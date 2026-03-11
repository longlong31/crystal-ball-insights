import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const YAHOO_QUOTE_URL = "https://query1.finance.yahoo.com/v8/finance/chart";
const YAHOO_QUOTESUMMARY_URL = "https://query1.finance.yahoo.com/v10/finance/quoteSummary";

function formatMarketCap(val: number): string {
  if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
  if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
  if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
  return `$${val.toFixed(0)}`;
}

function extractRaw(obj: any): number {
  return obj?.raw ?? obj ?? 0;
}

async function fetchQuote(symbol: string) {
  const chartResp = await fetch(
    `${YAHOO_QUOTE_URL}/${symbol}?interval=1d&range=3mo&includePrePost=false`,
    { headers: { "User-Agent": "Mozilla/5.0" } }
  );
  if (!chartResp.ok) throw new Error(`Yahoo Finance chart API error: ${chartResp.status}`);
  const chartData = await chartResp.json();
  const result = chartData.chart?.result?.[0];
  if (!result) throw new Error(`No data for ${symbol}`);

  const meta = result.meta;
  const closes = result.indicators?.quote?.[0]?.close || [];
  const validCloses = closes.filter((c: number | null) => c !== null);

  const currentPrice = meta.regularMarketPrice || validCloses[validCloses.length - 1] || 0;
  const previousClose = meta.chartPreviousClose || meta.previousClose || validCloses[validCloses.length - 2] || currentPrice;

  const priceChange1d = previousClose ? ((currentPrice - previousClose) / previousClose) * 100 : 0;
  const fiveDaysAgo = validCloses.length > 5 ? validCloses[validCloses.length - 6] : previousClose;
  const priceChange1w = fiveDaysAgo ? ((currentPrice - fiveDaysAgo) / fiveDaysAgo) * 100 : 0;
  const twentyDaysAgo = validCloses.length > 22 ? validCloses[validCloses.length - 23] : previousClose;
  const priceChange1m = twentyDaysAgo ? ((currentPrice - twentyDaysAgo) / twentyDaysAgo) * 100 : 0;

  let fundamentals: any = {};
  try {
    const summaryResp = await fetch(
      `${YAHOO_QUOTESUMMARY_URL}/${symbol}?modules=defaultKeyStatistics,financialData,summaryProfile,price,summaryDetail`,
      { headers: { "User-Agent": "Mozilla/5.0" } }
    );
    if (summaryResp.ok) {
      const summaryData = await summaryResp.json();
      const r = summaryData.quoteSummary?.result?.[0];
      fundamentals = {
        keyStats: r?.defaultKeyStatistics || {},
        financial: r?.financialData || {},
        profile: r?.summaryProfile || {},
        price: r?.price || {},
        detail: r?.summaryDetail || {},
      };
    }
  } catch (e) {
    console.warn("Could not fetch fundamentals for", symbol, e);
  }

  const keyStats = fundamentals.keyStats || {};
  const financial = fundamentals.financial || {};
  const price = fundamentals.price || {};
  const detail = fundamentals.detail || {};

  return {
    symbol,
    name: price.longName || price.shortName || symbol,
    sector: fundamentals.profile?.sector || "N/A",
    industry: fundamentals.profile?.industry || "N/A",
    website: fundamentals.profile?.website || "",
    description: fundamentals.profile?.longBusinessSummary || "",
    country: fundamentals.profile?.country || "N/A",
    employees: fundamentals.profile?.fullTimeEmployees || 0,
    marketCap: formatMarketCap(extractRaw(price.marketCap) || meta.regularMarketPrice * (meta.regularMarketVolume || 1)),
    currentPrice,
    previousClose,
    open: meta.regularMarketOpen || currentPrice,
    dayHigh: meta.regularMarketDayHigh || currentPrice,
    dayLow: meta.regularMarketDayLow || currentPrice,
    volume: meta.regularMarketVolume || 0,
    avgVolume: extractRaw(detail.averageVolume),
    fiftyTwoWeekHigh: extractRaw(detail.fiftyTwoWeekHigh) || meta.fiftyTwoWeekHigh || 0,
    fiftyTwoWeekLow: extractRaw(detail.fiftyTwoWeekLow) || meta.fiftyTwoWeekLow || 0,
    pe: extractRaw(detail.trailingPE) || extractRaw(keyStats.trailingPE),
    forwardPe: extractRaw(keyStats.forwardPE),
    pb: extractRaw(keyStats.priceToBook),
    ps: extractRaw(keyStats.priceToSalesTrailing12Months),
    roe: extractRaw(financial.returnOnEquity) * 100,
    roa: extractRaw(financial.returnOnAssets) * 100,
    deRatio: extractRaw(financial.debtToEquity) / 100,
    currentRatio: extractRaw(financial.currentRatio),
    divYield: extractRaw(detail.dividendYield) * 100,
    eps: extractRaw(detail.trailingEps) || extractRaw(keyStats.trailingEps),
    revenueGrowth: extractRaw(financial.revenueGrowth) * 100,
    earningsGrowth: extractRaw(financial.earningsGrowth) * 100,
    profitMargin: extractRaw(financial.profitMargins) * 100,
    operatingMargin: extractRaw(financial.operatingMargins) * 100,
    grossMargin: extractRaw(financial.grossMargins) * 100,
    freeCashflow: extractRaw(financial.freeCashflow),
    operatingCashflow: extractRaw(financial.operatingCashflow),
    totalRevenue: extractRaw(financial.totalRevenue),
    totalDebt: extractRaw(financial.totalDebt),
    totalCash: extractRaw(financial.totalCash),
    bookValue: extractRaw(keyStats.bookValue),
    priceChange1d,
    priceChange1w,
    priceChange1m,
  };
}

async function fetchHistory(symbol: string, range: string = "1y") {
  const interval = range === "5d" ? "5m" : range === "1mo" ? "1h" : "1d";
  const resp = await fetch(
    `${YAHOO_QUOTE_URL}/${symbol}?interval=${interval}&range=${range}&includePrePost=false`,
    { headers: { "User-Agent": "Mozilla/5.0" } }
  );
  if (!resp.ok) throw new Error(`Yahoo Finance error: ${resp.status}`);
  const data = await resp.json();
  const result = data.chart?.result?.[0];
  if (!result) throw new Error(`No history for ${symbol}`);

  const timestamps = result.timestamp || [];
  const quote = result.indicators?.quote?.[0] || {};
  return {
    dates: timestamps.map((t: number) => new Date(t * 1000).toISOString().split("T")[0]),
    closes: (quote.close || []).map((v: number | null) => v ?? 0),
    highs: (quote.high || []).map((v: number | null) => v ?? 0),
    lows: (quote.low || []).map((v: number | null) => v ?? 0),
    opens: (quote.open || []).map((v: number | null) => v ?? 0),
    volumes: (quote.volume || []).map((v: number | null) => v ?? 0),
  };
}

async function fetchFinancials(symbol: string) {
  const modules = "incomeStatementHistory,incomeStatementHistoryQuarterly,balanceSheetHistory,balanceSheetHistoryQuarterly,cashflowStatementHistory,cashflowStatementHistoryQuarterly,earnings";
  const resp = await fetch(
    `${YAHOO_QUOTE_URL}/${symbol}?interval=1d&range=5d&includePrePost=false`,
    { headers: { "User-Agent": "Mozilla/5.0" } }
  );
  // Try quoteSummary with a crumb/cookie approach
  let summaryResp: Response;
  try {
    summaryResp = await fetch(
      `${YAHOO_QUOTESUMMARY_URL}/${symbol}?modules=${modules}`,
      { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" } }
    );
  } catch (e) {
    console.warn("Financials fetch failed for", symbol, e);
    return { incomeAnnual: [], incomeQuarterly: [], balanceAnnual: [], balanceQuarterly: [], cashflowAnnual: [], cashflowQuarterly: [], earnings: { quarterly: [], yearly: [] } };
  }
  if (!summaryResp.ok) {
    console.warn(`Yahoo Finance financials returned ${summaryResp.status} for ${symbol}`);
    return { incomeAnnual: [], incomeQuarterly: [], balanceAnnual: [], balanceQuarterly: [], cashflowAnnual: [], cashflowQuarterly: [], earnings: { quarterly: [], yearly: [] } };
  }
  const data = await summaryResp.json();
  const r = data.quoteSummary?.result?.[0];
  if (!r) return { incomeAnnual: [], incomeQuarterly: [], balanceAnnual: [], balanceQuarterly: [], cashflowAnnual: [], cashflowQuarterly: [], earnings: { quarterly: [], yearly: [] } };

  const mapStatement = (stmt: any) => {
    if (!stmt) return {};
    const result: Record<string, number> = {};
    for (const [key, val] of Object.entries(stmt)) {
      if (val && typeof val === 'object' && 'raw' in (val as any)) {
        result[key] = (val as any).raw;
      }
    }
    result['endDate'] = stmt.endDate?.raw || 0;
    return result;
  };

  const mapStatements = (arr: any[]) => (arr || []).map(mapStatement);

  return {
    incomeAnnual: mapStatements(r.incomeStatementHistory?.incomeStatementHistory),
    incomeQuarterly: mapStatements(r.incomeStatementHistoryQuarterly?.incomeStatementHistory),
    balanceAnnual: mapStatements(r.balanceSheetHistory?.balanceSheetStatements),
    balanceQuarterly: mapStatements(r.balanceSheetHistoryQuarterly?.balanceSheetStatements),
    cashflowAnnual: mapStatements(r.cashflowStatementHistory?.cashflowStatements),
    cashflowQuarterly: mapStatements(r.cashflowStatementHistoryQuarterly?.cashflowStatements),
    earnings: {
      quarterly: (r.earnings?.financialsChart?.quarterly || []).map((q: any) => ({
        date: q.date,
        revenue: extractRaw(q.revenue),
        earnings: extractRaw(q.earnings),
      })),
      yearly: (r.earnings?.financialsChart?.yearly || []).map((y: any) => ({
        date: y.date,
        revenue: extractRaw(y.revenue),
        earnings: extractRaw(y.earnings),
      })),
    },
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, symbol, symbols, range } = await req.json();
    let data: any;

    if (type === "quote") {
      data = await fetchQuote(symbol);
    } else if (type === "quotes") {
      const results = await Promise.allSettled(
        (symbols as string[]).map((s: string) => fetchQuote(s))
      );
      data = results
        .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled")
        .map((r) => r.value);
    } else if (type === "history") {
      data = await fetchHistory(symbol, range || "1y");
    } else if (type === "financials") {
      data = await fetchFinancials(symbol);
    } else {
      throw new Error(`Unknown type: ${type}`);
    }

    return new Response(JSON.stringify({ data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("fetch-stock-data error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
