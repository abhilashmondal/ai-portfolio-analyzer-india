import { Router, type IRouter } from "express";
import { AnalyzePortfolioBody, AnalyzePortfolioResponse } from "@workspace/api-zod";

const router: IRouter = Router();

const NIFTY_PE = 22.5;
const FETCH_TIMEOUT_MS = 10_000;

// Static sector + name lookup — authoritative source, no external API needed.
// Covers all NIFTY 50 and SENSEX 30 constituents.
const STOCK_META: Record<string, { name: string; sector: string }> = {
  "RELIANCE.NS":    { name: "Reliance Industries",        sector: "Energy" },
  "TCS.NS":         { name: "Tata Consultancy Services",   sector: "Information Technology" },
  "HDFCBANK.NS":    { name: "HDFC Bank",                   sector: "Financial Services" },
  "BHARTIARTL.NS":  { name: "Bharti Airtel",               sector: "Telecom" },
  "ICICIBANK.NS":   { name: "ICICI Bank",                  sector: "Financial Services" },
  "INFOSYS.NS":     { name: "Infosys",                     sector: "Information Technology" },
  "SBIN.NS":        { name: "State Bank of India",         sector: "Financial Services" },
  "HINDUNILVR.NS":  { name: "Hindustan Unilever",          sector: "FMCG" },
  "ITC.NS":         { name: "ITC Limited",                 sector: "FMCG" },
  "LT.NS":          { name: "Larsen & Toubro",             sector: "Construction" },
  "KOTAKBANK.NS":   { name: "Kotak Mahindra Bank",         sector: "Financial Services" },
  "BAJFINANCE.NS":  { name: "Bajaj Finance",               sector: "Financial Services" },
  "MARUTI.NS":      { name: "Maruti Suzuki",               sector: "Automobile" },
  "HCLTECH.NS":     { name: "HCL Technologies",            sector: "Information Technology" },
  "ASIANPAINT.NS":  { name: "Asian Paints",                sector: "Consumer Durables" },
  "AXISBANK.NS":    { name: "Axis Bank",                   sector: "Financial Services" },
  "WIPRO.NS":       { name: "Wipro",                       sector: "Information Technology" },
  "ADANIENT.NS":    { name: "Adani Enterprises",           sector: "Services" },
  "ULTRACEMCO.NS":  { name: "UltraTech Cement",            sector: "Construction Materials" },
  "TITAN.NS":       { name: "Titan Company",               sector: "Consumer Durables" },
  "ONGC.NS":        { name: "Oil & Natural Gas Corp",      sector: "Energy" },
  "POWERGRID.NS":   { name: "Power Grid Corporation",      sector: "Power" },
  "NTPC.NS":        { name: "NTPC",                        sector: "Power" },
  "JSWSTEEL.NS":    { name: "JSW Steel",                   sector: "Metals & Mining" },
  "TATAMOTORS.NS":  { name: "Tata Motors",                 sector: "Automobile" },
  "NESTLEIND.NS":   { name: "Nestle India",                sector: "FMCG" },
  "TATASTEEL.NS":   { name: "Tata Steel",                  sector: "Metals & Mining" },
  "BAJAJFINSV.NS":  { name: "Bajaj Finserv",               sector: "Financial Services" },
  "M&M.NS":         { name: "Mahindra & Mahindra",         sector: "Automobile" },
  "SUNPHARMA.NS":   { name: "Sun Pharmaceutical",          sector: "Healthcare" },
  "ADANIPORTS.NS":  { name: "Adani Ports & SEZ",           sector: "Services" },
  "COALINDIA.NS":   { name: "Coal India",                  sector: "Energy" },
  "TECHM.NS":       { name: "Tech Mahindra",               sector: "Information Technology" },
  "GRASIM.NS":      { name: "Grasim Industries",           sector: "Construction Materials" },
  "HDFCLIFE.NS":    { name: "HDFC Life Insurance",         sector: "Financial Services" },
  "CIPLA.NS":       { name: "Cipla",                       sector: "Healthcare" },
  "APOLLOHOSP.NS":  { name: "Apollo Hospitals",            sector: "Healthcare" },
  "DIVISLAB.NS":    { name: "Divi's Laboratories",         sector: "Healthcare" },
  "BPCL.NS":        { name: "Bharat Petroleum Corp",       sector: "Energy" },
  "EICHERMOT.NS":   { name: "Eicher Motors",               sector: "Automobile" },
  "HEROMOTOCO.NS":  { name: "Hero MotoCorp",               sector: "Automobile" },
  "TATACONSUM.NS":  { name: "Tata Consumer Products",      sector: "FMCG" },
  "SHREECEM.NS":    { name: "Shree Cement",                sector: "Construction Materials" },
  "INDUSINDBK.NS":  { name: "IndusInd Bank",               sector: "Financial Services" },
  "HINDALCO.NS":    { name: "Hindalco Industries",         sector: "Metals & Mining" },
  "DRREDDY.NS":     { name: "Dr. Reddy's Laboratories",   sector: "Healthcare" },
  "SBILIFE.NS":     { name: "SBI Life Insurance",          sector: "Financial Services" },
  "BAJAJ-AUTO.NS":  { name: "Bajaj Auto",                  sector: "Automobile" },
  "BRITANNIA.NS":   { name: "Britannia Industries",        sector: "FMCG" },
  "LTI.NS":         { name: "LTIMindtree",                 sector: "Information Technology" },
  // Additional popular NSE stocks
  "NIFTY50.NS":     { name: "NIFTY 50 Index",              sector: "Index" },
  "HDFC.NS":        { name: "HDFC Ltd",                    sector: "Financial Services" },
  "ZOMATO.NS":      { name: "Zomato",                      sector: "Consumer Services" },
  "PAYTM.NS":       { name: "One97 Communications",        sector: "Financial Services" },
  "NYKAA.NS":       { name: "FSN E-Commerce",              sector: "Consumer Services" },
  "DMART.NS":       { name: "Avenue Supermarts",           sector: "Retail" },
  "PIDILITIND.NS":  { name: "Pidilite Industries",         sector: "Chemicals" },
  "BERGEPAINT.NS":  { name: "Berger Paints",               sector: "Consumer Durables" },
  "MARICO.NS":      { name: "Marico",                      sector: "FMCG" },
  "GODREJCP.NS":    { name: "Godrej Consumer Products",    sector: "FMCG" },
  "COLPAL.NS":      { name: "Colgate-Palmolive India",     sector: "FMCG" },
  "DABUR.NS":       { name: "Dabur India",                 sector: "FMCG" },
  "EMAMILTD.NS":    { name: "Emami",                       sector: "FMCG" },
  "MCDOWELL-N.NS":  { name: "United Spirits",              sector: "FMCG" },
  "UBL.NS":         { name: "United Breweries",            sector: "FMCG" },
  "TATAPOWER.NS":   { name: "Tata Power",                  sector: "Power" },
  "ADANIGREEN.NS":  { name: "Adani Green Energy",          sector: "Power" },
  "ADANITRANS.NS":  { name: "Adani Transmission",          sector: "Power" },
  "TORNTPOWER.NS":  { name: "Torrent Power",               sector: "Power" },
  "IEX.NS":         { name: "Indian Energy Exchange",      sector: "Power" },
  "CESC.NS":        { name: "CESC",                        sector: "Power" },
  "NHPC.NS":        { name: "NHPC",                        sector: "Power" },
  "SJVN.NS":        { name: "SJVN",                        sector: "Power" },
  "IRCTC.NS":       { name: "Indian Railway Catering",     sector: "Services" },
  "IRFC.NS":        { name: "Indian Railway Finance",      sector: "Financial Services" },
  "HAL.NS":         { name: "Hindustan Aeronautics",       sector: "Defence" },
  "BEL.NS":         { name: "Bharat Electronics",          sector: "Defence" },
  "BHEL.NS":        { name: "Bharat Heavy Electricals",    sector: "Capital Goods" },
  "ABB.NS":         { name: "ABB India",                   sector: "Capital Goods" },
  "SIEMENS.NS":     { name: "Siemens India",               sector: "Capital Goods" },
  "AMBUJACEM.NS":   { name: "Ambuja Cements",              sector: "Construction Materials" },
  "ACCL.NS":        { name: "ACC",                         sector: "Construction Materials" },
  "ACC.NS":         { name: "ACC",                         sector: "Construction Materials" },
  "DLF.NS":         { name: "DLF",                         sector: "Real Estate" },
  "GODREJPROP.NS":  { name: "Godrej Properties",           sector: "Real Estate" },
  "OBEROIRLTY.NS":  { name: "Oberoi Realty",               sector: "Real Estate" },
  "PRESTIGE.NS":    { name: "Prestige Estates",            sector: "Real Estate" },
  "IDFCFIRSTB.NS":  { name: "IDFC First Bank",             sector: "Financial Services" },
  "FEDERALBNK.NS":  { name: "Federal Bank",                sector: "Financial Services" },
  "BANDHANBNK.NS":  { name: "Bandhan Bank",                sector: "Financial Services" },
  "RBLBANK.NS":     { name: "RBL Bank",                    sector: "Financial Services" },
  "YESBANK.NS":     { name: "Yes Bank",                    sector: "Financial Services" },
  "PNB.NS":         { name: "Punjab National Bank",        sector: "Financial Services" },
  "CANBK.NS":       { name: "Canara Bank",                 sector: "Financial Services" },
  "BANKBARODA.NS":  { name: "Bank of Baroda",              sector: "Financial Services" },
  "UNIONBANK.NS":   { name: "Union Bank of India",         sector: "Financial Services" },
  "MFSL.NS":        { name: "Max Financial Services",      sector: "Financial Services" },
  "ICICIGI.NS":     { name: "ICICI Lombard GIC",           sector: "Financial Services" },
  "ICICIPRULI.NS":  { name: "ICICI Prudential Life",       sector: "Financial Services" },
  "LICI.NS":        { name: "Life Insurance Corp of India",sector: "Financial Services" },
  "GICRE.NS":       { name: "General Insurance Corp",      sector: "Financial Services" },
  "NIACL.NS":       { name: "New India Assurance",         sector: "Financial Services" },
  "MUTHOOTFIN.NS":  { name: "Muthoot Finance",             sector: "Financial Services" },
  "CHOLAFIN.NS":    { name: "Cholamandalam Finance",       sector: "Financial Services" },
  "MANAPPURAM.NS":  { name: "Manappuram Finance",          sector: "Financial Services" },
  "M&MFIN.NS":      { name: "Mahindra Finance",            sector: "Financial Services" },
  "PNBHOUSING.NS":  { name: "PNB Housing Finance",         sector: "Financial Services" },
  "LICHSGFIN.NS":   { name: "LIC Housing Finance",         sector: "Financial Services" },
  "STARHEALTH.NS":  { name: "Star Health Insurance",       sector: "Financial Services" },
  "AUROPHARMA.NS":  { name: "Aurobindo Pharma",            sector: "Healthcare" },
  "BIOCON.NS":      { name: "Biocon",                      sector: "Healthcare" },
  "LUPIN.NS":       { name: "Lupin",                       sector: "Healthcare" },
  "TORNTPHARM.NS":  { name: "Torrent Pharmaceuticals",     sector: "Healthcare" },
  "ALKEM.NS":       { name: "Alkem Laboratories",          sector: "Healthcare" },
  "IPCALAB.NS":     { name: "IPCA Laboratories",           sector: "Healthcare" },
  "LALPATHLAB.NS":  { name: "Dr Lal PathLabs",             sector: "Healthcare" },
  "METROPOLIS.NS":  { name: "Metropolis Healthcare",       sector: "Healthcare" },
  "MAXHEALTH.NS":   { name: "Max Healthcare",              sector: "Healthcare" },
  "FORTIS.NS":      { name: "Fortis Healthcare",           sector: "Healthcare" },
  "HINDPETRO.NS":   { name: "Hindustan Petroleum",         sector: "Energy" },
  "IOC.NS":         { name: "Indian Oil Corporation",      sector: "Energy" },
  "GAIL.NS":        { name: "GAIL India",                  sector: "Energy" },
  "PETRONET.NS":    { name: "Petronet LNG",                sector: "Energy" },
  "MGL.NS":         { name: "Mahanagar Gas",               sector: "Energy" },
  "IGL.NS":         { name: "Indraprastha Gas",            sector: "Energy" },
  "VEDL.NS":        { name: "Vedanta",                     sector: "Metals & Mining" },
  "NMDC.NS":        { name: "NMDC",                        sector: "Metals & Mining" },
  "SAIL.NS":        { name: "Steel Authority of India",    sector: "Metals & Mining" },
  "JINDALSTEL.NS":  { name: "Jindal Steel & Power",        sector: "Metals & Mining" },
  "NATIONALUM.NS":  { name: "National Aluminium Co",       sector: "Metals & Mining" },
  "APLAPOLLO.NS":   { name: "APL Apollo Tubes",            sector: "Metals & Mining" },
  "HDFCAMC.NS":     { name: "HDFC Asset Management",      sector: "Financial Services" },
  "NAM-INDIA.NS":   { name: "Nippon India AMC",            sector: "Financial Services" },
  "ANGELONE.NS":    { name: "Angel One",                   sector: "Financial Services" },
  "CDSL.NS":        { name: "Central Depository Services", sector: "Financial Services" },
  "BSE.NS":         { name: "BSE Limited",                 sector: "Financial Services" },
  "MCX.NS":         { name: "Multi Commodity Exchange",    sector: "Financial Services" },
  "TATAELXSI.NS":   { name: "Tata Elxsi",                  sector: "Information Technology" },
  "MPHASIS.NS":     { name: "Mphasis",                     sector: "Information Technology" },
  "LTTS.NS":        { name: "L&T Technology Services",     sector: "Information Technology" },
  "PERSISTENT.NS":  { name: "Persistent Systems",          sector: "Information Technology" },
  "COFORGE.NS":     { name: "Coforge",                     sector: "Information Technology" },
  "KPITTECH.NS":    { name: "KPIT Technologies",           sector: "Information Technology" },
  "OFSS.NS":        { name: "Oracle Financial Services",   sector: "Information Technology" },
  "INFY.NS":        { name: "Infosys",                     sector: "Information Technology" },
};

async function fetchPriceOnly(symbol: string): Promise<{ currentPrice: number; nameFromYahoo?: string }> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!res.ok) return { currentPrice: 0 };

  const json = await res.json() as Record<string, unknown>;
  const result = (json.chart as Record<string, unknown>)?.result as unknown[];
  const meta = (result?.[0] as Record<string, unknown>)?.meta as Record<string, unknown>;

  if (!meta) return { currentPrice: 0 };

  const currentPrice =
    (typeof meta.regularMarketPrice === "number" ? meta.regularMarketPrice : 0) ||
    (typeof meta.previousClose === "number" ? meta.previousClose : 0);

  const nameFromYahoo = meta.longName
    ? String(meta.longName)
    : meta.shortName
    ? String(meta.shortName)
    : undefined;

  return { currentPrice, nameFromYahoo };
}

router.post("/analyze", async (req, res) => {
  const parseResult = AnalyzePortfolioBody.safeParse(req.body);
  if (!parseResult.success) {
    req.log.warn({ issues: parseResult.error.issues }, "Portfolio analyze: invalid request body");
    res.status(400).json({ error: "Bad request", message: parseResult.error.message });
    return;
  }

  const { holdings } = parseResult.data;

  if (holdings.length === 0) {
    res.status(400).json({ error: "Bad request", message: "Portfolio must contain at least one holding" });
    return;
  }

  if (holdings.length > 50) {
    res.status(400).json({ error: "Bad request", message: "Portfolio cannot exceed 50 holdings" });
    return;
  }

  req.log.info(
    { holdingCount: holdings.length, symbols: holdings.map((h) => h.symbol) },
    "Portfolio analyze: incoming request"
  );

  // Fetch live prices in parallel — only the v8 chart endpoint (no quoteSummary)
  const priceResults = await Promise.allSettled(
    holdings.map(async (h) => {
      try {
        return { symbol: h.symbol, ...(await fetchPriceOnly(h.symbol)) };
      } catch (e) {
        req.log.warn({ symbol: h.symbol, err: String(e) }, "Price fetch failed");
        return { symbol: h.symbol, currentPrice: 0 };
      }
    })
  );

  const priceMap = new Map<string, { currentPrice: number; nameFromYahoo?: string }>();
  priceResults.forEach((r, i) => {
    const symbol = holdings[i]!.symbol;
    if (r.status === "fulfilled") {
      priceMap.set(symbol, r.value);
    } else {
      priceMap.set(symbol, { currentPrice: 0 });
    }
  });

  let totalCurrentValue = 0;
  let totalInvestedValue = 0;
  let weightedBeta = 0;

  const holdingDetails = holdings.map((h) => {
    const price = priceMap.get(h.symbol)!;
    // Sector and name: static lookup wins, Yahoo longName as fallback, symbol as last resort
    const staticMeta = STOCK_META[h.symbol];
    const sector = staticMeta?.sector ?? "Other";
    const name = staticMeta?.name ?? price.nameFromYahoo ?? h.symbol;

    const currentPrice = price.currentPrice > 0 ? price.currentPrice : h.buyPrice;
    const currentValue = currentPrice * h.quantity;
    const investedValue = h.buyPrice * h.quantity;
    const gainLoss = currentValue - investedValue;
    const gainLossPercent = investedValue > 0 ? (gainLoss / investedValue) * 100 : 0;

    totalCurrentValue += currentValue;
    totalInvestedValue += investedValue;

    return {
      symbol: h.symbol,
      name,
      sector,
      quantity: h.quantity,
      buyPrice: h.buyPrice,
      currentPrice,
      currentValue,
      investedValue,
      gainLoss,
      gainLossPercent: Math.round(gainLossPercent * 100) / 100,
      peRatio: undefined as number | undefined,
      beta: undefined as number | undefined,
      weight: 0,
    };
  });

  holdingDetails.forEach((h) => {
    h.weight =
      totalCurrentValue > 0
        ? Math.round((h.currentValue / totalCurrentValue) * 10000) / 100
        : 0;
    if (h.beta !== undefined) weightedBeta += h.beta * h.weight;
  });

  const portfolioBeta = weightedBeta / 100;
  const totalGainLoss = totalCurrentValue - totalInvestedValue;
  const totalGainLossPercent =
    totalInvestedValue > 0 ? (totalGainLoss / totalInvestedValue) * 100 : 0;

  // Sector allocation from accurate static data
  const sectorMap = new Map<string, { value: number; count: number }>();
  holdingDetails.forEach((h) => {
    const existing = sectorMap.get(h.sector) ?? { value: 0, count: 0 };
    sectorMap.set(h.sector, { value: existing.value + h.currentValue, count: existing.count + 1 });
  });

  const sectorAllocation = Array.from(sectorMap.entries())
    .map(([sector, data]) => ({
      sector,
      value: Math.round(data.value),
      percentage:
        totalCurrentValue > 0
          ? Math.round((data.value / totalCurrentValue) * 10000) / 100
          : 0,
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

  const portfolioJson = JSON.stringify(
    {
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
      })),
      metrics: {
        totalCurrentValue,
        totalInvestedValue,
        totalGainLossPercent: Math.round(totalGainLossPercent * 100) / 100,
        niftyPE: NIFTY_PE,
        numberOfSectors,
        numberOfHoldings: holdings.length,
        concentrationRisk,
        topSectors: sectorAllocation.slice(0, 3).map((s) => s.sector),
        sectorBreakdown: sectorAllocation.map((s) => `${s.sector}: ${s.percentage}%`),
      },
    },
    null,
    2
  );

  req.log.info(
    {
      totalCurrentValue: Math.round(totalCurrentValue),
      totalGainLossPercent: Math.round(totalGainLossPercent * 10) / 10,
      numberOfSectors,
      sectors: sectorAllocation.map((s) => `${s.sector}(${s.percentage}%)`),
    },
    "Portfolio analyze: metrics calculated"
  );

  const data = AnalyzePortfolioResponse.parse({
    totalCurrentValue: Math.round(totalCurrentValue),
    totalInvestedValue: Math.round(totalInvestedValue),
    totalGainLoss: Math.round(totalGainLoss),
    totalGainLossPercent: Math.round(totalGainLossPercent * 100) / 100,
    weightedPE: 0,
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
