import { Router, type IRouter } from "express";
import { AiAnalyzePortfolioBody, AiAnalyzePortfolioResponse } from "@workspace/api-zod";
import { openai } from "@workspace/integrations-openai-ai-server";
import { anthropic } from "@workspace/integrations-anthropic-ai";

const router: IRouter = Router();

const GPT_MODEL = "gpt-5.2";
const CLAUDE_MODEL = "claude-sonnet-4-6";

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

OUTPUT FORMAT (STRICT JSON - return ONLY the JSON object, no markdown, no explanation):
{
  "risk_level": "Low|Moderate|High|Very High",
  "diversification_score": "Poor|Fair|Good|Excellent",
  "key_issues": ["issue1", "issue2", "issue3"],
  "stock_recommendations": [
    {"stock": "SYMBOL", "action": "BUY|HOLD|SELL", "reason": "brief reason"}
  ],
  "summary": "2-3 sentence overall portfolio assessment"
}`;
}

function parseAIResponse(text: string): Record<string, unknown> {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in response");
  return JSON.parse(jsonMatch[0]) as Record<string, unknown>;
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
        divergentViews.push(`${gptRec.stock}: GPT says ${gptRec.action}, Claude says ${claudeRec.action}`);
      }
    }
  });

  const riskOrder: Record<string, number> = { "Low": 1, "Moderate": 2, "High": 3, "Very High": 4 };
  const gptRiskScore = riskOrder[gpt.risk_level as string] ?? 2;
  const claudeRiskScore = riskOrder[claude.risk_level as string] ?? 2;
  const avgRiskScore = Math.round((gptRiskScore + claudeRiskScore) / 2);
  const riskByScore: Record<number, string> = { 1: "Low", 2: "Moderate", 3: "High", 4: "Very High" };
  const overallRisk = riskByScore[avgRiskScore] ?? "Moderate";

  const consensusSummary = `Both models analyzed the portfolio. GPT assessed risk as ${gpt.risk_level} with ${gpt.diversification_score} diversification. Claude assessed risk as ${claude.risk_level} with ${claude.diversification_score} diversification. ${agreedRecs.length} recommendations have consensus. ${divergentViews.length > 0 ? `Areas of disagreement: ${divergentViews.join("; ")}.` : ""}`;

  return {
    overallRisk,
    consensusSummary,
    agreedRecommendations: agreedRecs,
    divergentViews,
  };
}

router.post("/analyze", async (req, res) => {
  const parseResult = AiAnalyzePortfolioBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Bad request", message: parseResult.error.message });
    return;
  }

  const { portfolioJson } = parseResult.data;
  const prompt = buildPrompt(portfolioJson);

  try {
    const [gptResult, claudeResult] = await Promise.allSettled([
      openai.chat.completions.create({
        model: GPT_MODEL,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 8192,
      }),
      anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 8192,
        messages: [{ role: "user", content: prompt }],
      }),
    ]);

    let gptAnalysis: Record<string, unknown>;
    let claudeAnalysis: Record<string, unknown>;

    if (gptResult.status === "fulfilled") {
      const gptText = gptResult.value.choices[0]?.message?.content ?? "{}";
      gptAnalysis = parseAIResponse(gptText);
    } else {
      req.log.error({ err: gptResult.reason }, "GPT analysis failed");
      gptAnalysis = {
        risk_level: "Moderate",
        diversification_score: "Fair",
        key_issues: ["GPT analysis unavailable"],
        stock_recommendations: [],
        summary: "GPT analysis could not be completed at this time.",
      };
    }

    if (claudeResult.status === "fulfilled") {
      const content = claudeResult.value.content[0];
      const claudeText = content?.type === "text" ? content.text : "{}";
      claudeAnalysis = parseAIResponse(claudeText);
    } else {
      req.log.error({ err: claudeResult.reason }, "Claude analysis failed");
      claudeAnalysis = {
        risk_level: "Moderate",
        diversification_score: "Fair",
        key_issues: ["Claude analysis unavailable"],
        stock_recommendations: [],
        summary: "Claude analysis could not be completed at this time.",
      };
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

    res.json(data);
  } catch (err) {
    req.log.error({ err }, "AI analysis failed");
    res.status(500).json({ error: "AI analysis failed", message: String(err) });
  }
});

export default router;
