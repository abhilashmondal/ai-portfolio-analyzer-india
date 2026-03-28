import { Router, type IRouter } from "express";
import { z } from "zod";

const router: IRouter = Router();

const FETCH_TIMEOUT_MS = 12_000;

const STOCK_META: Record<string, { name: string; sector: string }> = {
  "RELIANCE.NS":   { name: "Reliance Industries",      sector: "Energy" },
  "TCS.NS":        { name: "Tata Consultancy Services", sector: "Information Technology" },
  "HDFCBANK.NS":   { name: "HDFC Bank",                sector: "Financial Services" },
  "BHARTIARTL.NS": { name: "Bharti Airtel",             sector: "Telecom" },
  "ICICIBANK.NS":  { name: "ICICI Bank",                sector: "Financial Services" },
  "INFOSYS.NS":    { name: "Infosys",                   sector: "Information Technology" },
  "INFY.NS":       { name: "Infosys",                   sector: "Information Technology" },
  "SBIN.NS":       { name: "State Bank of India",       sector: "Financial Services" },
  "HINDUNILVR.NS": { name: "Hindustan Unilever",        sector: "FMCG" },
  "ITC.NS":        { name: "ITC Limited",               sector: "FMCG" },
  "LT.NS":         { name: "Larsen & Toubro",           sector: "Construction" },
  "KOTAKBANK.NS":  { name: "Kotak Mahindra Bank",       sector: "Financial Services" },
  "BAJFINANCE.NS": { name: "Bajaj Finance",             sector: "Financial Services" },
  "MARUTI.NS":     { name: "Maruti Suzuki",             sector: "Automobile" },
  "HCLTECH.NS":    { name: "HCL Technologies",          sector: "Information Technology" },
  "ASIANPAINT.NS": { name: "Asian Paints",              sector: "Consumer Durables" },
  "AXISBANK.NS":   { name: "Axis Bank",                 sector: "Financial Services" },
  "WIPRO.NS":      { name: "Wipro",                     sector: "Information Technology" },
  "ADANIENT.NS":   { name: "Adani Enterprises",         sector: "Services" },
  "ULTRACEMCO.NS": { name: "UltraTech Cement",          sector: "Construction Materials" },
  "TITAN.NS":      { name: "Titan Company",             sector: "Consumer Durables" },
  "ONGC.NS":       { name: "Oil & Natural Gas Corp",    sector: "Energy" },
  "POWERGRID.NS":  { name: "Power Grid Corporation",    sector: "Power" },
  "NTPC.NS":       { name: "NTPC",                      sector: "Power" },
  "JSWSTEEL.NS":   { name: "JSW Steel",                 sector: "Metals & Mining" },
  "TATAMOTORS.NS": { name: "Tata Motors",               sector: "Automobile" },
  "NESTLEIND.NS":  { name: "Nestle India",              sector: "FMCG" },
  "TATASTEEL.NS":  { name: "Tata Steel",                sector: "Metals & Mining" },
  "BAJAJFINSV.NS": { name: "Bajaj Finserv",             sector: "Financial Services" },
  "M&M.NS":        { name: "Mahindra & Mahindra",       sector: "Automobile" },
  "SUNPHARMA.NS":  { name: "Sun Pharmaceutical",        sector: "Healthcare" },
  "ADANIPORTS.NS": { name: "Adani Ports & SEZ",         sector: "Services" },
  "COALINDIA.NS":  { name: "Coal India",                sector: "Energy" },
  "TECHM.NS":      { name: "Tech Mahindra",             sector: "Information Technology" },
  "GRASIM.NS":     { name: "Grasim Industries",         sector: "Construction Materials" },
  "HDFCLIFE.NS":   { name: "HDFC Life Insurance",       sector: "Financial Services" },
  "CIPLA.NS":      { name: "Cipla",                     sector: "Healthcare" },
  "APOLLOHOSP.NS": { name: "Apollo Hospitals",          sector: "Healthcare" },
  "DIVISLAB.NS":   { name: "Divi's Laboratories",       sector: "Healthcare" },
  "BPCL.NS":       { name: "Bharat Petroleum Corp",     sector: "Energy" },
  "EICHERMOT.NS":  { name: "Eicher Motors",             sector: "Automobile" },
  "HEROMOTOCO.NS": { name: "Hero MotoCorp",             sector: "Automobile" },
  "TATACONSUM.NS": { name: "Tata Consumer Products",    sector: "FMCG" },
  "SHREECEM.NS":   { name: "Shree Cement",              sector: "Construction Materials" },
  "INDUSINDBK.NS": { name: "IndusInd Bank",             sector: "Financial Services" },
  "HINDALCO.NS":   { name: "Hindalco Industries",       sector: "Metals & Mining" },
  "DRREDDY.NS":    { name: "Dr. Reddy's Laboratories",  sector: "Healthcare" },
  "SBILIFE.NS":    { name: "SBI Life Insurance",        sector: "Financial Services" },
  "BAJAJ-AUTO.NS": { name: "Bajaj Auto",                sector: "Automobile" },
  "BRITANNIA.NS":  { name: "Britannia Industries",      sector: "FMCG" },
  "LTI.NS":        { name: "LTIMindtree",               sector: "Information Technology" },
  "ZOMATO.NS":     { name: "Zomato",                    sector: "Consumer Services" },
  "DMART.NS":      { name: "Avenue Supermarts",         sector: "Retail" },
  "PIDILITIND.NS": { name: "Pidilite Industries",       sector: "Chemicals" },
  "HDFC.NS":       { name: "HDFC Ltd",                  sector: "Financial Services" },
  "TATAPOWER.NS":  { name: "Tata Power",                sector: "Power" },
  "HAL.NS":        { name: "Hindustan Aeronautics",     sector: "Defence" },
  "BEL.NS":        { name: "Bharat Electronics",        sector: "Defence" },
  "IRCTC.NS":      { name: "Indian Railway Catering",   sector: "Services" },
  "VEDL.NS":       { name: "Vedanta",                   sector: "Metals & Mining" },
  "IOC.NS":        { name: "Indian Oil Corporation",    sector: "Energy" },
  "GAIL.NS":       { name: "GAIL India",                sector: "Energy" },
  "HINDPETRO.NS":  { name: "Hindustan Petroleum",       sector: "Energy" },
};

const CHART_COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444",
  "#8B5CF6", "#EC4899", "#06B6D4", "#F97316",
  "#84CC16", "#14B8A6", "#A78BFA", "#FB923C",
];

const RequestSchema = z.object({
  holdings: z.array(
    z.object({
      symbol: z.string().min(1),
      quantity: z.number().positive(),
      buyPrice: z.number().positive(),
    })
  ).min(1).max(20),
  period: z.enum(["6mo", "1y"]),
});

interface PricePoint { date: string; price: number; changeFromStart: number }
interface PortfolioPoint { date: string; value: number; changeFromStart: number }

async function fetchHistoricalPrices(
  symbol: string,
  period: string
): Promise<{ timestamps: number[]; closes: number[] } | null> {
  const interval = period === "1y" ? "1wk" : "1d";
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${period}`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!res.ok) return null;

    const json = await res.json() as Record<string, unknown>;
    const chart = json.chart as Record<string, unknown>;
    const results = chart?.result as unknown[];
    const result = results?.[0] as Record<string, unknown> | undefined;

    if (!result) return null;

    const timestamps = result.timestamp as number[] | undefined;
    const indicators = result.indicators as Record<string, unknown> | undefined;
    const quoteArr = indicators?.quote as unknown[];
    const quote = quoteArr?.[0] as Record<string, unknown> | undefined;

    // Prefer adjclose, fall back to close
    const adjcloseArr = indicators?.adjclose as unknown[];
    const adjcloseObj = adjcloseArr?.[0] as Record<string, unknown> | undefined;
    const adjcloses = adjcloseObj?.adjclose as (number | null)[] | undefined;
    const closes = (adjcloses ?? quote?.close) as (number | null)[] | undefined;

    if (!timestamps?.length || !closes?.length) return null;

    return { timestamps, closes: closes as number[] };
  } catch {
    return null;
  }
}

function formatDate(ts: number): string {
  const d = new Date(ts * 1000);
  return d.toISOString().slice(0, 10);
}

router.post("/history", async (req, res) => {
  const parsed = RequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Bad request", message: parsed.error.message });
    return;
  }

  const { holdings, period } = parsed.data;
  req.log.info({ symbols: holdings.map((h) => h.symbol), period }, "History: fetching");

  // Fetch all stocks in parallel
  const results = await Promise.allSettled(
    holdings.map(async (h) => {
      const raw = await fetchHistoricalPrices(h.symbol, period);
      return { holding: h, raw };
    })
  );

  // Build per-stock series and a shared date universe
  const stockSeriesData: Array<{
    symbol: string;
    name: string;
    sector: string;
    color: string;
    data: PricePoint[];
    available: boolean;
    quantity: number;
    priceByDate: Map<string, number>;
  }> = [];

  results.forEach((r, i) => {
    const holding = holdings[i]!;
    const meta = STOCK_META[holding.symbol] ?? { name: holding.symbol, sector: "Other" };
    const color = CHART_COLORS[i % CHART_COLORS.length]!;

    if (r.status === "rejected" || !r.value.raw) {
      req.log.warn({ symbol: holding.symbol }, "History: no data available");
      stockSeriesData.push({
        symbol: holding.symbol,
        name: meta.name,
        sector: meta.sector,
        color,
        data: [],
        available: false,
        quantity: holding.quantity,
        priceByDate: new Map(),
      });
      return;
    }

    const { timestamps, closes } = r.value.raw;
    const data: PricePoint[] = [];
    const priceByDate = new Map<string, number>();

    let startPrice: number | null = null;
    timestamps.forEach((ts, idx) => {
      const price = closes[idx];
      if (price == null || isNaN(price) || price <= 0) return;
      const date = formatDate(ts);
      if (startPrice === null) startPrice = price;
      const changeFromStart = startPrice > 0
        ? Math.round(((price - startPrice) / startPrice) * 10000) / 100
        : 0;
      data.push({ date, price: Math.round(price * 100) / 100, changeFromStart });
      priceByDate.set(date, price);
    });

    stockSeriesData.push({
      symbol: holding.symbol,
      name: meta.name,
      sector: meta.sector,
      color,
      data,
      available: data.length > 0,
      quantity: holding.quantity,
      priceByDate,
    });
  });

  // Build portfolio combined value trend
  // Collect all dates that appear in at least one stock
  const allDates = new Set<string>();
  stockSeriesData.forEach((s) => s.priceByDate.forEach((_, d) => allDates.add(d)));
  const sortedDates = Array.from(allDates).sort();

  // For each date, fill forward last known price for each stock
  const portfolio: PortfolioPoint[] = [];
  let startPortfolioValue: number | null = null;

  const lastKnownPrice = new Map<string, number>();
  // Seed last known price with buy price
  stockSeriesData.forEach((s) => lastKnownPrice.set(s.symbol, s.quantity > 0
    ? holdings.find((h) => h.symbol === s.symbol)?.buyPrice ?? 0
    : 0));

  for (const date of sortedDates) {
    let totalValue = 0;
    for (const s of stockSeriesData) {
      const price = s.priceByDate.get(date);
      if (price !== undefined) lastKnownPrice.set(s.symbol, price);
      const lp = lastKnownPrice.get(s.symbol) ?? 0;
      totalValue += lp * s.quantity;
    }
    if (startPortfolioValue === null) startPortfolioValue = totalValue;
    const changeFromStart = startPortfolioValue > 0
      ? Math.round(((totalValue - startPortfolioValue) / startPortfolioValue) * 10000) / 100
      : 0;
    portfolio.push({
      date,
      value: Math.round(totalValue),
      changeFromStart,
    });
  }

  req.log.info(
    { period, dataPoints: portfolio.length, stocks: stockSeriesData.filter((s) => s.available).length },
    "History: complete"
  );

  res.json({
    stocks: stockSeriesData.map((s) => ({
      symbol: s.symbol,
      name: s.name,
      sector: s.sector,
      color: s.color,
      data: s.data,
      available: s.available,
    })),
    portfolio,
    period,
    generatedAt: new Date().toISOString(),
  });
});

export default router;
