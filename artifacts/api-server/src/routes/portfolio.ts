import { Router, type IRouter } from "express";
import { AnalyzePortfolioBody, AnalyzePortfolioResponse } from "@workspace/api-zod";

const router: IRouter = Router();

const NIFTY_PE = 22.5;

router.post("/analyze", async (req, res) => {
  const parseResult = AnalyzePortfolioBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Bad request", message: parseResult.error.message });
    return;
  }

  const { holdings } = parseResult.data;

  const symbols = holdings.map((h) => h.symbol);

  const fetchPromises = symbols.map(async (symbol) => {
    const [chartRes, summaryRes] = await Promise.all([
      fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
      }),
      fetch(`https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=summaryDetail,defaultKeyStatistics,assetProfile`, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
      }),
    ]);

    let currentPrice = 0;
    let peRatio: number | undefined;
    let beta: number | undefined;
    let sector = "Unknown";
    let name = symbol;

    if (chartRes.ok) {
      const json = await chartRes.json() as Record<string, unknown>;
      const result = (json.chart as Record<string, unknown>)?.result as unknown[];
      const meta = (result?.[0] as Record<string, unknown>)?.meta as Record<string, unknown>;
      if (meta) {
        currentPrice = (typeof meta.regularMarketPrice === "number" ? meta.regularMarketPrice : 0) ||
                       (typeof meta.previousClose === "number" ? meta.previousClose : 0);
        name = String(meta.longName ?? meta.shortName ?? symbol);
      }
    }

    if (summaryRes.ok) {
      const json = await summaryRes.json() as Record<string, unknown>;
      const result = ((json.quoteSummary as Record<string, unknown>)?.result as unknown[])?.[0] as Record<string, unknown> | undefined;
      const summaryDetail = result?.summaryDetail as Record<string, unknown> | undefined;
      const keyStats = result?.defaultKeyStatistics as Record<string, unknown> | undefined;
      const assetProfile = result?.assetProfile as Record<string, unknown> | undefined;

      const getRaw = (val: unknown): number | undefined => {
        if (typeof val === "number" && !isNaN(val)) return val;
        if (typeof val === "object" && val !== null) {
          const obj = val as Record<string, unknown>;
          if (typeof obj.raw === "number" && !isNaN(obj.raw)) return obj.raw;
        }
        return undefined;
      };

      peRatio = getRaw(summaryDetail?.trailingPE);
      beta = getRaw(summaryDetail?.beta) ?? getRaw(keyStats?.beta);
      sector = String(assetProfile?.sector ?? "Unknown");
    }

    return { symbol, currentPrice, peRatio, beta, sector, name };
  });

  const quoteResults = await Promise.allSettled(fetchPromises);
  const quoteMap = new Map<string, { currentPrice: number; peRatio?: number; beta?: number; sector: string; name: string }>();

  quoteResults.forEach((result, i) => {
    if (result.status === "fulfilled") {
      quoteMap.set(symbols[i]!, result.value);
    } else {
      quoteMap.set(symbols[i]!, { currentPrice: 0, sector: "Unknown", name: symbols[i]! });
    }
  });

  let totalCurrentValue = 0;
  let totalInvestedValue = 0;
  let weightedPENum = 0;
  let weightedPEDen = 0;
  let weightedBeta = 0;

  const holdingDetails = holdings.map((h) => {
    const quote = quoteMap.get(h.symbol)!;
    const currentPrice = quote.currentPrice || h.buyPrice;
    const currentValue = currentPrice * h.quantity;
    const investedValue = h.buyPrice * h.quantity;
    const gainLoss = currentValue - investedValue;
    const gainLossPercent = investedValue > 0 ? (gainLoss / investedValue) * 100 : 0;

    totalCurrentValue += currentValue;
    totalInvestedValue += investedValue;

    if (quote.peRatio !== undefined) {
      weightedPENum += quote.peRatio * currentValue;
      weightedPEDen += currentValue;
    }

    return {
      symbol: h.symbol,
      name: quote.name,
      sector: quote.sector,
      quantity: h.quantity,
      buyPrice: h.buyPrice,
      currentPrice,
      currentValue,
      investedValue,
      gainLoss,
      gainLossPercent: Math.round(gainLossPercent * 100) / 100,
      peRatio: quote.peRatio,
      beta: quote.beta,
      weight: 0,
    };
  });

  holdingDetails.forEach((h) => {
    h.weight = totalCurrentValue > 0 ? Math.round((h.currentValue / totalCurrentValue) * 10000) / 100 : 0;
    if (h.beta !== undefined) {
      weightedBeta += h.beta * h.weight;
    }
  });

  const portfolioBeta = weightedBeta / 100;
  const weightedPE = weightedPEDen > 0 ? Math.round((weightedPENum / weightedPEDen) * 10) / 10 : 0;
  const totalGainLoss = totalCurrentValue - totalInvestedValue;
  const totalGainLossPercent = totalInvestedValue > 0 ? (totalGainLoss / totalInvestedValue) * 100 : 0;

  const sectorMap = new Map<string, { value: number; count: number }>();
  holdingDetails.forEach((h) => {
    const existing = sectorMap.get(h.sector) ?? { value: 0, count: 0 };
    sectorMap.set(h.sector, { value: existing.value + h.currentValue, count: existing.count + 1 });
  });

  const sectorAllocation = Array.from(sectorMap.entries())
    .map(([sector, data]) => ({
      sector,
      value: Math.round(data.value),
      percentage: totalCurrentValue > 0 ? Math.round((data.value / totalCurrentValue) * 10000) / 100 : 0,
      count: data.count,
    }))
    .sort((a, b) => b.value - a.value);

  const topHoldingWeight = holdingDetails.reduce((max, h) => Math.max(max, h.weight), 0);
  const numberOfSectors = sectorMap.size;

  const hhi = holdingDetails.reduce((sum, h) => sum + (h.weight / 100) ** 2, 0);

  let volatilityCategory: "Low" | "Moderate" | "High" | "Very High" = "Moderate";
  if (portfolioBeta < 0.7) volatilityCategory = "Low";
  else if (portfolioBeta < 1.1) volatilityCategory = "Moderate";
  else if (portfolioBeta < 1.5) volatilityCategory = "High";
  else volatilityCategory = "Very High";

  let concentrationRisk: "Low" | "Moderate" | "High" = "Low";
  if (topHoldingWeight > 40 || hhi > 0.25) concentrationRisk = "High";
  else if (topHoldingWeight > 25 || hhi > 0.15) concentrationRisk = "Moderate";

  const portfolioJson = JSON.stringify({
    holdings: holdingDetails.map((h) => ({
      symbol: h.symbol,
      name: h.name,
      sector: h.sector,
      quantity: h.quantity,
      buyPrice: h.buyPrice,
      currentPrice: h.currentPrice,
      currentValue: h.currentValue,
      gainLossPercent: h.gainLossPercent,
      weight: h.weight,
      peRatio: h.peRatio,
      beta: h.beta,
    })),
    metrics: {
      totalCurrentValue,
      totalInvestedValue,
      totalGainLossPercent: Math.round(totalGainLossPercent * 100) / 100,
      weightedPE,
      niftyPE: NIFTY_PE,
      portfolioBeta: Math.round(portfolioBeta * 100) / 100,
      numberOfSectors,
      numberOfHoldings: holdings.length,
      concentrationRisk,
      topSectors: sectorAllocation.slice(0, 3).map((s) => s.sector),
    },
  }, null, 2);

  const data = AnalyzePortfolioResponse.parse({
    totalCurrentValue: Math.round(totalCurrentValue),
    totalInvestedValue: Math.round(totalInvestedValue),
    totalGainLoss: Math.round(totalGainLoss),
    totalGainLossPercent: Math.round(totalGainLossPercent * 100) / 100,
    weightedPE,
    niftyPE: NIFTY_PE,
    holdings: holdingDetails,
    sectorAllocation,
    riskMetrics: {
      portfolioBeta: Math.round(portfolioBeta * 100) / 100,
      volatilityCategory,
      concentrationRisk,
      topHoldingWeight: Math.round(topHoldingWeight * 100) / 100,
      numberOfSectors,
      herfindahlIndex: Math.round(hhi * 1000) / 1000,
    },
    portfolioJson,
  });

  res.json(data);
});

export default router;
