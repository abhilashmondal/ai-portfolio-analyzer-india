import { Router, type IRouter } from "express";
import { AiAnalyzePortfolioBody, AiAnalyzePortfolioResponse } from "@workspace/api-zod";
import { openai } from "@workspace/integrations-openai-ai-server";
import { anthropic } from "@workspace/integrations-anthropic-ai";

const router: IRouter = Router();

const GPT_MODEL = "gpt-5.2";
const CLAUDE_MODEL = "claude-sonnet-4-6";
const AI_TIMEOUT_MS = 45_000;

const VALID_RISK_LEVELS = ["Low", "Moderate", "High", "Very High"] as const;
const VALID_DIV_SCORES = ["Poor", "Fair", "Good", "Excellent"] as const;
const VALID_ACTIONS = ["BUY", "HOLD", "SELL"] as const;

function normalizeAIResult(raw: Record<string, unknown>): Record<string, unknown> {
  const normalizeEnum = <T extends string>(
    val: unknown,
    allowed: readonly T[],
    fallback: T
  ): T => {
    const str = String(val ?? "").trim();
    const found = allowed.find((a) => a.toLowerCase() === str.toLowerCase());
    return found ?? fallback;
  };

  const recs = Array.isArray(raw.stock_recommendations)
    ? (raw.stock_recommendations as unknown[]).map((r) => {
        const rec = (typeof r === "object" && r !== null ? r : {}) as Record<string, unknown>;
        return {
          stock: String(rec.stock ?? ""),
          action: normalizeEnum(rec.action, VALID_ACTIONS, "HOLD"),
          reason: String(rec.reason ?? ""),
        };
      }).filter((r) => r.stock.length > 0)
    : [];

  const keyIssues = Array.isArray(raw.key_issues)
    ? (raw.key_issues as unknown[]).map(String).filter(Boolean)
    : ["Unable to identify specific issues"];

  return {
    risk_level: normalizeEnum(raw.risk_level, VALID_RISK_LEVELS, "Moderate"),
    diversification_score: normalizeEnum(raw.diversification_score, VALID_DIV_SCORES, "Fair"),
    key_issues: keyIssues.length > 0 ? keyIssues : ["No issues identified"],
    stock_recommendations: recs,
    summary: String(raw.summary ?? "No summary provided."),
  };
}

function parseAIResponse(text: string, model: string): Record<string, unknown> {
  if (!text || text.trim() === "") {
    throw new Error(`${model} returned empty response`);
  }

  // Strip markdown code fences if present
  const stripped = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

  // Extract first JSON object
  const jsonMatch = stripped.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`${model} response contained no JSON object. Response: ${stripped.slice(0, 200)}`);
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
    return normalizeAIResult(parsed);
  } catch (parseErr) {
    throw new Error(`${model} returned invalid JSON: ${String(parseErr)}`);
  }
}

function fallbackAnalysis(modelName: string): Record<string, unknown> {
  return {
    risk_level: "Moderate",
    diversification_score: "Fair",
    key_issues: [`${modelName} analysis unavailable — service may be temporarily overloaded`],
    stock_recommendations: [],
    summary: `${modelName} analysis could not be completed at this time. Please retry in a moment.`,
  };
}

function buildConsensus(
  gpt: Record<string, unknown>,
  claude: Record<string, unknown>
): Record<string, unknown> {
  const gptRecs = (gpt.stock_recommendations as Array<Record<string, unknown>>) ?? [];
  const claudeRecs = (claude.stock_recommendations as Array<Record<string, unknown>>) ?? [];

  const agreedRecs: Array<Record<string, unknown>> = [];
  const divergentViews: string[] = [];

  gptRecs.forEach((gptRec) => {
    const claudeRec = claudeRecs.find((c) => c.stock === gptRec.stock);
    if (claudeRec) {
      if (claudeRec.action === gptRec.action) {
        agreedRecs.push(gptRec);
      } else {
        divergentViews.push(`${gptRec.stock}: GPT → ${gptRec.action}, Claude → ${claudeRec.action}`);
      }
    }
  });

  const riskOrder: Record<string, number> = { "Low": 1, "Moderate": 2, "High": 3, "Very High": 4 };
  const gptRiskScore = riskOrder[gpt.risk_level as string] ?? 2;
  const claudeRiskScore = riskOrder[claude.risk_level as string] ?? 2;
  const avgRiskScore = Math.round((gptRiskScore + claudeRiskScore) / 2);
  const riskByScore: Record<number, string> = { 1: "Low", 2: "Moderate", 3: "High", 4: "Very High" };
  const overallRisk = riskByScore[avgRiskScore] ?? "Moderate";

  const consensusSummary =
    `Both models completed analysis. GPT: ${gpt.risk_level} risk, ${gpt.diversification_score} diversification. ` +
    `Claude: ${claude.risk_level} risk, ${claude.diversification_score} diversification. ` +
    `${agreedRecs.length} of ${gptRecs.length} recommendations agreed upon.` +
    (divergentViews.length > 0 ? ` Divergent: ${divergentViews.join("; ")}.` : " Full consensus reached.");

  return {
    overallRisk,
    consensusSummary,
    agreedRecommendations: agreedRecs,
    divergentViews,
  };
}

function buildPrompt(portfolioJson: string): string {
  return `You are a professional equity research analyst specializing in Indian markets.

Analyze the following portfolio:

PORTFOLIO DATA:
${portfolioJson}

MARKET CONTEXT:
- Benchmark: NIFTY 50 / SENSEX
- Country: India
- Current NIFTY P/E: ~22.5x

TASKS:
1. Evaluate portfolio diversification (sector, concentration risk)
2. Compare valuation vs benchmark (P/E, growth indicators if available)
3. Identify high-risk exposures
4. Suggest rebalancing strategies
5. Provide Buy/Hold/Sell view for key stocks

OUTPUT FORMAT (STRICT JSON — return ONLY the raw JSON object, no markdown, no explanation, no code fences):
{
  "risk_level": "Low|Moderate|High|Very High",
  "diversification_score": "Poor|Fair|Good|Excellent",
  "key_issues": ["issue1", "issue2", "issue3"],
  "stock_recommendations": [
    {"stock": "SYMBOL.NS", "action": "BUY|HOLD|SELL", "reason": "brief reason"}
  ],
  "summary": "2-3 sentence overall portfolio assessment"
}`;
}

router.post("/analyze", async (req, res) => {
  const parseResult = AiAnalyzePortfolioBody.safeParse(req.body);
  if (!parseResult.success) {
    req.log.warn({ issues: parseResult.error.issues }, "AI analyze: invalid request body");
    res.status(400).json({ error: "Bad request", message: parseResult.error.message });
    return;
  }

  const { portfolioJson } = parseResult.data;

  // Guard: reject clearly empty/malformed portfolio
  if (!portfolioJson || portfolioJson.trim().length < 10) {
    res.status(400).json({ error: "Bad request", message: "portfolioJson is empty or too short" });
    return;
  }

  req.log.info({ portfolioJsonLength: portfolioJson.length }, "AI analyze: incoming portfolio");

  const prompt = buildPrompt(portfolioJson);

  try {
    const [gptResult, claudeResult] = await Promise.allSettled([
      openai.chat.completions.create(
        {
          model: GPT_MODEL,
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
          max_completion_tokens: 8192,
        },
        { signal: AbortSignal.timeout(AI_TIMEOUT_MS) }
      ),
      anthropic.messages.create(
        {
          model: CLAUDE_MODEL,
          max_tokens: 8192,
          messages: [{ role: "user", content: prompt }],
        },
        { signal: AbortSignal.timeout(AI_TIMEOUT_MS) }
      ),
    ]);

    let gptAnalysis: Record<string, unknown>;
    let claudeAnalysis: Record<string, unknown>;

    if (gptResult.status === "fulfilled") {
      const gptRaw = gptResult.value.choices[0]?.message?.content ?? "";
      req.log.info({ gptRawLength: gptRaw.length, gptRaw: gptRaw.slice(0, 300) }, "GPT raw response");
      try {
        gptAnalysis = parseAIResponse(gptRaw, "GPT");
        req.log.info({ riskLevel: gptAnalysis.risk_level, recCount: (gptAnalysis.stock_recommendations as unknown[])?.length }, "GPT analysis parsed");
      } catch (parseErr) {
        req.log.error({ err: parseErr }, "GPT parse failed — using fallback");
        gptAnalysis = fallbackAnalysis("ChatGPT");
      }
    } else {
      req.log.error({ err: gptResult.reason }, "GPT API call failed");
      gptAnalysis = fallbackAnalysis("ChatGPT");
    }

    if (claudeResult.status === "fulfilled") {
      const content = claudeResult.value.content[0];
      const claudeRaw = content?.type === "text" ? content.text : "";
      req.log.info({ claudeRawLength: claudeRaw.length, claudeRaw: claudeRaw.slice(0, 300) }, "Claude raw response");
      try {
        claudeAnalysis = parseAIResponse(claudeRaw, "Claude");
        req.log.info({ riskLevel: claudeAnalysis.risk_level, recCount: (claudeAnalysis.stock_recommendations as unknown[])?.length }, "Claude analysis parsed");
      } catch (parseErr) {
        req.log.error({ err: parseErr }, "Claude parse failed — using fallback");
        claudeAnalysis = fallbackAnalysis("Claude");
      }
    } else {
      req.log.error({ err: claudeResult.reason }, "Claude API call failed");
      claudeAnalysis = fallbackAnalysis("Claude");
    }

    const consensus = buildConsensus(gptAnalysis, claudeAnalysis);

    const data = AiAnalyzePortfolioResponse.parse({
      gpt: gptAnalysis,
      claude: claudeAnalysis,
      consensus,
      gptModel: GPT_MODEL,
      claudeModel: CLAUDE_MODEL,
      analyzedAt: new Date().toISOString(),
    });

    req.log.info("AI analyze: response sent successfully");
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "AI analysis: unexpected top-level error");
    res.status(500).json({ error: "AI analysis failed", message: String(err) });
  }
});

export default router;
