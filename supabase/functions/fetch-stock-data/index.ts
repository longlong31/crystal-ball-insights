import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Yahoo Finance unofficial API endpoints
const YAHOO_QUOTE_URL = "https://query1.finance.yahoo.com/v8/finance/chart";
const YAHOO_QUOTESUMMARY_URL = "https://query1.finance.yahoo.com/v10/finance/quoteSummary";

interface StockQuote {
  symbol: string;
  name: string;
  sector: string;
  marketCap: string;
  currentPrice: number;
  previousClose: number;
  open: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  avgVolume: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  pe: number;
  pb: number;
  ps: number;
  roe: number;
  deRatio: number;
  currentRatio: number;
  divYield: number;
  eps: number;
  revenueGrowth: number;
  earningsGrowth: number;
  priceChange1d: number;
  priceChange1w: number;
  priceChange1m: number;
}

interface StockHistory {
  dates: string[];
  closes: number[];
  highs: number[];
  lows: number[];
  opens: number[];
  volumes: number[];
}

function formatMarketCap(val: number): string {
  if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
  if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
  if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
  return `$${val.toFixed(0)}`;
}

async function fetchQuote(symbol: string): Promise<StockQuote> {
  // Fetch chart data for price history
  const chartResp = await fetch(
    `${YAHOO_QUOTE_URL}/${symbol}?interval=1d&range=3mo&includePrePost=false`,
    { headers: { "User-Agent": "Mozilla/5.0" } }
  );
  
  if (!chartResp.ok) {
    throw new Error(`Yahoo Finance chart API error: ${chartResp.status}`);
  }
  
  const chartData = await chartResp.json();
  const result = chartData.chart?.result?.[0];
  if (!result) throw new Error(`No data for ${symbol}`);
  
  const meta = result.meta;
  const closes = result.indicators?.quote?.[0]?.close || [];
  const volumes = result.indicators?.quote?.[0]?.volume || [];
  const validCloses = closes.filter((c: number | null) => c !== null);
  
  const currentPrice = meta.regularMarketPrice || validCloses[validCloses.length - 1] || 0;
  const previousClose = meta.chartPreviousClose || meta.previousClose || validCloses[validCloses.length - 2] || currentPrice;
  
  // Calculate price changes
  const priceChange1d = previousClose ? ((currentPrice - previousClose) / previousClose) * 100 : 0;
  
  const fiveDaysAgo = validCloses.length > 5 ? validCloses[validCloses.length - 6] : previousClose;
  const priceChange1w = fiveDaysAgo ? ((currentPrice - fiveDaysAgo) / fiveDaysAgo) * 100 : 0;
  
  const twentyDaysAgo = validCloses.length > 22 ? validCloses[validCloses.length - 23] : previousClose;
  const priceChange1m = twentyDaysAgo ? ((currentPrice - twentyDaysAgo) / twentyDaysAgo) * 100 : 0;

  // Fetch fundamental data
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
    marketCap: formatMarketCap(price.marketCap?.raw || meta.regularMarketPrice * (meta.regularMarketVolume || 1)),
    currentPrice,
    previousClose,
    open: meta.regularMarketOpen || currentPrice,
    dayHigh: meta.regularMarketDayHigh || currentPrice,
    dayLow: meta.regularMarketDayLow || currentPrice,
    volume: meta.regularMarketVolume || 0,
    avgVolume: detail.averageVolume?.raw || 0,
    fiftyTwoWeekHigh: detail.fiftyTwoWeekHigh?.raw || meta.fiftyTwoWeekHigh || 0,
    fiftyTwoWeekLow: detail.fiftyTwoWeekLow?.raw || meta.fiftyTwoWeekLow || 0,
    pe: detail.trailingPE?.raw || keyStats.trailingPE?.raw || 0,
    pb: keyStats.priceToBook?.raw || 0,
    ps: keyStats.priceToSalesTrailing12Months?.raw || 0,
    roe: financial.returnOnEquity?.raw ? financial.returnOnEquity.raw * 100 : 0,
    deRatio: financial.debtToEquity?.raw ? financial.debtToEquity.raw / 100 : 0,
    currentRatio: financial.currentRatio?.raw || 0,
    divYield: detail.dividendYield?.raw ? detail.dividendYield.raw * 100 : 0,
    eps: detail.trailingEps?.raw || keyStats.trailingEps?.raw || 0,
    revenueGrowth: financial.revenueGrowth?.raw ? financial.revenueGrowth.raw * 100 : 0,
    earningsGrowth: financial.earningsGrowth?.raw ? financial.earningsGrowth.raw * 100 : 0,
    priceChange1d,
    priceChange1w,
    priceChange1m,
  };
}

async function fetchHistory(symbol: string, range: string = "1y"): Promise<StockHistory> {
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
      // Fetch multiple quotes
      const results = await Promise.allSettled(
        (symbols as string[]).map((s: string) => fetchQuote(s))
      );
      data = results
        .filter((r): r is PromiseFulfilledResult<StockQuote> => r.status === "fulfilled")
        .map((r) => r.value);
    } else if (type === "history") {
      data = await fetchHistory(symbol, range || "1y");
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
