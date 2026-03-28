import { Router, type IRouter } from "express";
import {
  GetNifty50StocksResponse,
  GetSensex30StocksResponse,
  GetStockQuotesBody,
  GetStockQuotesResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const NIFTY50_STOCKS = [
  { symbol: "RELIANCE.NS", name: "Reliance Industries", sector: "Energy", exchange: "NSE" as const },
  { symbol: "TCS.NS", name: "Tata Consultancy Services", sector: "Information Technology", exchange: "NSE" as const },
  { symbol: "HDFCBANK.NS", name: "HDFC Bank", sector: "Financial Services", exchange: "NSE" as const },
  { symbol: "BHARTIARTL.NS", name: "Bharti Airtel", sector: "Telecom", exchange: "NSE" as const },
  { symbol: "ICICIBANK.NS", name: "ICICI Bank", sector: "Financial Services", exchange: "NSE" as const },
  { symbol: "INFOSYS.NS", name: "Infosys", sector: "Information Technology", exchange: "NSE" as const },
  { symbol: "SBIN.NS", name: "State Bank of India", sector: "Financial Services", exchange: "NSE" as const },
  { symbol: "HINDUNILVR.NS", name: "Hindustan Unilever", sector: "FMCG", exchange: "NSE" as const },
  { symbol: "ITC.NS", name: "ITC Limited", sector: "FMCG", exchange: "NSE" as const },
  { symbol: "LT.NS", name: "Larsen & Toubro", sector: "Construction", exchange: "NSE" as const },
  { symbol: "KOTAKBANK.NS", name: "Kotak Mahindra Bank", sector: "Financial Services", exchange: "NSE" as const },
  { symbol: "BAJFINANCE.NS", name: "Bajaj Finance", sector: "Financial Services", exchange: "NSE" as const },
  { symbol: "MARUTI.NS", name: "Maruti Suzuki", sector: "Automobile", exchange: "NSE" as const },
  { symbol: "HCLTECH.NS", name: "HCL Technologies", sector: "Information Technology", exchange: "NSE" as const },
  { symbol: "ASIANPAINT.NS", name: "Asian Paints", sector: "Consumer Durables", exchange: "NSE" as const },
  { symbol: "AXISBANK.NS", name: "Axis Bank", sector: "Financial Services", exchange: "NSE" as const },
  { symbol: "WIPRO.NS", name: "Wipro", sector: "Information Technology", exchange: "NSE" as const },
  { symbol: "ADANIENT.NS", name: "Adani Enterprises", sector: "Services", exchange: "NSE" as const },
  { symbol: "ULTRACEMCO.NS", name: "UltraTech Cement", sector: "Construction Materials", exchange: "NSE" as const },
  { symbol: "TITAN.NS", name: "Titan Company", sector: "Consumer Durables", exchange: "NSE" as const },
  { symbol: "ONGC.NS", name: "Oil & Natural Gas Corp", sector: "Energy", exchange: "NSE" as const },
  { symbol: "POWERGRID.NS", name: "Power Grid Corporation", sector: "Power", exchange: "NSE" as const },
  { symbol: "NTPC.NS", name: "NTPC", sector: "Power", exchange: "NSE" as const },
  { symbol: "JSWSTEEL.NS", name: "JSW Steel", sector: "Metals & Mining", exchange: "NSE" as const },
  { symbol: "TATAMOTORS.NS", name: "Tata Motors", sector: "Automobile", exchange: "NSE" as const },
  { symbol: "NESTLEIND.NS", name: "Nestle India", sector: "FMCG", exchange: "NSE" as const },
  { symbol: "TATASTEEL.NS", name: "Tata Steel", sector: "Metals & Mining", exchange: "NSE" as const },
  { symbol: "BAJAJFINSV.NS", name: "Bajaj Finserv", sector: "Financial Services", exchange: "NSE" as const },
  { symbol: "M&M.NS", name: "Mahindra & Mahindra", sector: "Automobile", exchange: "NSE" as const },
  { symbol: "SUNPHARMA.NS", name: "Sun Pharmaceutical", sector: "Healthcare", exchange: "NSE" as const },
  { symbol: "ADANIPORTS.NS", name: "Adani Ports & SEZ", sector: "Services", exchange: "NSE" as const },
  { symbol: "COALINDIA.NS", name: "Coal India", sector: "Energy", exchange: "NSE" as const },
  { symbol: "TECHM.NS", name: "Tech Mahindra", sector: "Information Technology", exchange: "NSE" as const },
  { symbol: "GRASIM.NS", name: "Grasim Industries", sector: "Construction Materials", exchange: "NSE" as const },
  { symbol: "HDFCLIFE.NS", name: "HDFC Life Insurance", sector: "Financial Services", exchange: "NSE" as const },
  { symbol: "CIPLA.NS", name: "Cipla", sector: "Healthcare", exchange: "NSE" as const },
  { symbol: "APOLLOHOSP.NS", name: "Apollo Hospitals", sector: "Healthcare", exchange: "NSE" as const },
  { symbol: "DIVISLAB.NS", name: "Divi's Laboratories", sector: "Healthcare", exchange: "NSE" as const },
  { symbol: "BPCL.NS", name: "Bharat Petroleum Corp", sector: "Energy", exchange: "NSE" as const },
  { symbol: "EICHERMOT.NS", name: "Eicher Motors", sector: "Automobile", exchange: "NSE" as const },
  { symbol: "HEROMOTOCO.NS", name: "Hero MotoCorp", sector: "Automobile", exchange: "NSE" as const },
  { symbol: "TATACONSUM.NS", name: "Tata Consumer Products", sector: "FMCG", exchange: "NSE" as const },
  { symbol: "SHREECEM.NS", name: "Shree Cement", sector: "Construction Materials", exchange: "NSE" as const },
  { symbol: "INDUSINDBK.NS", name: "IndusInd Bank", sector: "Financial Services", exchange: "NSE" as const },
  { symbol: "HINDALCO.NS", name: "Hindalco Industries", sector: "Metals & Mining", exchange: "NSE" as const },
  { symbol: "DRREDDY.NS", name: "Dr. Reddy's Laboratories", sector: "Healthcare", exchange: "NSE" as const },
  { symbol: "SBILIFE.NS", name: "SBI Life Insurance", sector: "Financial Services", exchange: "NSE" as const },
  { symbol: "BAJAJ-AUTO.NS", name: "Bajaj Auto", sector: "Automobile", exchange: "NSE" as const },
  { symbol: "BRITANNIA.NS", name: "Britannia Industries", sector: "FMCG", exchange: "NSE" as const },
  { symbol: "LTI.NS", name: "LTIMindtree", sector: "Information Technology", exchange: "NSE" as const },
];

const SENSEX30_STOCKS = [
  { symbol: "RELIANCE.NS", name: "Reliance Industries", sector: "Energy", exchange: "BSE" as const },
  { symbol: "TCS.NS", name: "Tata Consultancy Services", sector: "Information Technology", exchange: "BSE" as const },
  { symbol: "HDFCBANK.NS", name: "HDFC Bank", sector: "Financial Services", exchange: "BSE" as const },
  { symbol: "BHARTIARTL.NS", name: "Bharti Airtel", sector: "Telecom", exchange: "BSE" as const },
  { symbol: "ICICIBANK.NS", name: "ICICI Bank", sector: "Financial Services", exchange: "BSE" as const },
  { symbol: "INFOSYS.NS", name: "Infosys", sector: "Information Technology", exchange: "BSE" as const },
  { symbol: "SBIN.NS", name: "State Bank of India", sector: "Financial Services", exchange: "BSE" as const },
  { symbol: "ITC.NS", name: "ITC Limited", sector: "FMCG", exchange: "BSE" as const },
  { symbol: "LT.NS", name: "Larsen & Toubro", sector: "Construction", exchange: "BSE" as const },
  { symbol: "KOTAKBANK.NS", name: "Kotak Mahindra Bank", sector: "Financial Services", exchange: "BSE" as const },
  { symbol: "BAJFINANCE.NS", name: "Bajaj Finance", sector: "Financial Services", exchange: "BSE" as const },
  { symbol: "MARUTI.NS", name: "Maruti Suzuki", sector: "Automobile", exchange: "BSE" as const },
  { symbol: "HCLTECH.NS", name: "HCL Technologies", sector: "Information Technology", exchange: "BSE" as const },
  { symbol: "ASIANPAINT.NS", name: "Asian Paints", sector: "Consumer Durables", exchange: "BSE" as const },
  { symbol: "AXISBANK.NS", name: "Axis Bank", sector: "Financial Services", exchange: "BSE" as const },
  { symbol: "WIPRO.NS", name: "Wipro", sector: "Information Technology", exchange: "BSE" as const },
  { symbol: "ULTRACEMCO.NS", name: "UltraTech Cement", sector: "Construction Materials", exchange: "BSE" as const },
  { symbol: "TITAN.NS", name: "Titan Company", sector: "Consumer Durables", exchange: "BSE" as const },
  { symbol: "ONGC.NS", name: "Oil & Natural Gas Corp", sector: "Energy", exchange: "BSE" as const },
  { symbol: "POWERGRID.NS", name: "Power Grid Corporation", sector: "Power", exchange: "BSE" as const },
  { symbol: "NTPC.NS", name: "NTPC", sector: "Power", exchange: "BSE" as const },
  { symbol: "JSWSTEEL.NS", name: "JSW Steel", sector: "Metals & Mining", exchange: "BSE" as const },
  { symbol: "TATAMOTORS.NS", name: "Tata Motors", sector: "Automobile", exchange: "BSE" as const },
  { symbol: "NESTLEIND.NS", name: "Nestle India", sector: "FMCG", exchange: "BSE" as const },
  { symbol: "TATASTEEL.NS", name: "Tata Steel", sector: "Metals & Mining", exchange: "BSE" as const },
  { symbol: "SUNPHARMA.NS", name: "Sun Pharmaceutical", sector: "Healthcare", exchange: "BSE" as const },
  { symbol: "M&M.NS", name: "Mahindra & Mahindra", sector: "Automobile", exchange: "BSE" as const },
  { symbol: "BAJAJFINSV.NS", name: "Bajaj Finserv", sector: "Financial Services", exchange: "BSE" as const },
  { symbol: "HINDUNILVR.NS", name: "Hindustan Unilever", sector: "FMCG", exchange: "BSE" as const },
  { symbol: "DRREDDY.NS", name: "Dr. Reddy's Laboratories", sector: "Healthcare", exchange: "BSE" as const },
];

router.get("/nifty50", (_req, res) => {
  const data = GetNifty50StocksResponse.parse({
    stocks: NIFTY50_STOCKS,
    count: NIFTY50_STOCKS.length,
  });
  res.json(data);
});

router.get("/sensex30", (_req, res) => {
  const data = GetSensex30StocksResponse.parse({
    stocks: SENSEX30_STOCKS,
    count: SENSEX30_STOCKS.length,
  });
  res.json(data);
});

async function fetchStockData(symbol: string): Promise<Record<string, unknown> | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    if (!response.ok) return null;
    const json = await response.json() as Record<string, unknown>;
    return json;
  } catch {
    return null;
  }
}

async function fetchQuoteSummary(symbol: string): Promise<Record<string, unknown> | null> {
  const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=summaryDetail,defaultKeyStatistics,financialData,assetProfile`;
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    if (!response.ok) return null;
    const json = await response.json() as Record<string, unknown>;
    return json;
  } catch {
    return null;
  }
}

function safeNumber(val: unknown, fallback?: number): number | undefined {
  if (typeof val === "number" && !isNaN(val)) return val;
  if (typeof val === "object" && val !== null) {
    const obj = val as Record<string, unknown>;
    if (typeof obj.raw === "number" && !isNaN(obj.raw)) return obj.raw;
  }
  return fallback;
}

router.post("/quote", async (req, res) => {
  const parseResult = GetStockQuotesBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Bad request", message: parseResult.error.message });
    return;
  }

  const { symbols } = parseResult.data;
  const quotes: Record<string, unknown>[] = [];
  const errors: string[] = [];

  await Promise.allSettled(
    symbols.map(async (symbol) => {
      try {
        const [chartData, summaryData] = await Promise.all([
          fetchStockData(symbol),
          fetchQuoteSummary(symbol),
        ]);

        if (!chartData) {
          errors.push(`Failed to fetch data for ${symbol}`);
          return;
        }

        const result = chartData.chart as Record<string, unknown>;
        const chartResult = (result?.result as unknown[])?.[0] as Record<string, unknown> | undefined;
        if (!chartResult) {
          errors.push(`No data found for ${symbol}`);
          return;
        }

        const meta = chartResult.meta as Record<string, unknown>;
        const currentPrice = safeNumber(meta?.regularMarketPrice) ?? safeNumber(meta?.previousClose) ?? 0;
        const previousClose = safeNumber(meta?.chartPreviousClose) ?? safeNumber(meta?.previousClose) ?? currentPrice;
        const changePercent = previousClose > 0 ? ((currentPrice - previousClose) / previousClose) * 100 : 0;

        const quoteSummaryResult = summaryData?.quoteSummary as Record<string, unknown>;
        const summaryResult = (quoteSummaryResult?.result as unknown[])?.[0] as Record<string, unknown> | undefined;
        const summaryDetail = summaryResult?.summaryDetail as Record<string, unknown> | undefined;
        const keyStats = summaryResult?.defaultKeyStatistics as Record<string, unknown> | undefined;
        const assetProfile = summaryResult?.assetProfile as Record<string, unknown> | undefined;

        const allStocks = [...NIFTY50_STOCKS, ...SENSEX30_STOCKS];
        const stockInfo = allStocks.find((s) => s.symbol === symbol);

        quotes.push({
          symbol,
          name: String(meta?.longName ?? meta?.shortName ?? stockInfo?.name ?? symbol),
          currentPrice,
          previousClose,
          changePercent: Math.round(changePercent * 100) / 100,
          marketCap: safeNumber(summaryDetail?.marketCap),
          peRatio: safeNumber(summaryDetail?.trailingPE),
          pbRatio: safeNumber(summaryDetail?.priceToBook),
          eps: safeNumber(keyStats?.trailingEps),
          fiftyTwoWeekHigh: safeNumber(summaryDetail?.fiftyTwoWeekHigh),
          fiftyTwoWeekLow: safeNumber(summaryDetail?.fiftyTwoWeekLow),
          volume: safeNumber(summaryDetail?.volume),
          avgVolume: safeNumber(summaryDetail?.averageVolume),
          sector: String(assetProfile?.sector ?? stockInfo?.sector ?? "Unknown"),
          industry: String(assetProfile?.industry ?? ""),
          beta: safeNumber(summaryDetail?.beta),
          dividendYield: safeNumber(summaryDetail?.dividendYield),
          lastUpdated: new Date().toISOString(),
        });
      } catch {
        errors.push(`Error processing ${symbol}`);
      }
    })
  );

  const data = GetStockQuotesResponse.parse({ quotes, errors });
  res.json(data);
});

export default router;
