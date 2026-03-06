import { useQuery } from "@tanstack/react-query";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export interface StockQuote {
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

export interface StockHistory {
  dates: string[];
  closes: number[];
  highs: number[];
  lows: number[];
  opens: number[];
  volumes: number[];
}

async function fetchStockAPI(body: Record<string, unknown>) {
  const resp = await fetch(`${SUPABASE_URL}/functions/v1/fetch-stock-data`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) throw new Error(`Stock API error: ${resp.status}`);
  const result = await resp.json();
  if (result.error) throw new Error(result.error);
  return result.data;
}

export function useStockQuote(symbol: string) {
  return useQuery<StockQuote>({
    queryKey: ["stock-quote", symbol],
    queryFn: () => fetchStockAPI({ type: "quote", symbol }),
    refetchInterval: 60000,
    staleTime: 30000,
    retry: 2,
  });
}

export function useStockQuotes(symbols: string[]) {
  return useQuery<StockQuote[]>({
    queryKey: ["stock-quotes", symbols.join(",")],
    queryFn: () => fetchStockAPI({ type: "quotes", symbols }),
    refetchInterval: 60000,
    staleTime: 30000,
    retry: 2,
  });
}

export function useStockHistory(symbol: string, range: string = "1y") {
  return useQuery<StockHistory>({
    queryKey: ["stock-history", symbol, range],
    queryFn: () => fetchStockAPI({ type: "history", symbol, range }),
    staleTime: 300000,
    retry: 2,
  });
}
