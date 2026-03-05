import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const COINGECKO_IDS: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  BNB: "binancecoin",
  XRP: "ripple",
  ADA: "cardano",
};

export interface CryptoMarketData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  currentPrice: number;
  marketCap: number;
  marketCapRank: number;
  totalVolume: number;
  high24h: number;
  low24h: number;
  priceChange24h: number;
  priceChangePercentage24h: number;
  priceChangePercentage1h: number;
  priceChangePercentage7d: number;
  priceChangePercentage30d: number;
  circulatingSupply: number;
  totalSupply: number;
  ath: number;
  athChangePercentage: number;
  sparkline7d: number[];
  lastUpdated: string;
}

export interface CryptoGlobalData {
  totalMarketCap: number;
  totalVolume: number;
  marketCapPercentage: Record<string, number>;
  activeCryptocurrencies: number;
  marketCapChangePercentage24h: number;
}

export interface CryptoHistoryData {
  prices: [number, number][];
  volumes: [number, number][];
  totalVolumes: [number, number][];
}

async function fetchMarketData(type: string, symbols?: string[]) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const resp = await fetch(`${supabaseUrl}/functions/v1/fetch-market-data`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ type, symbols }),
  });

  if (!resp.ok) {
    throw new Error(`Market data fetch failed: ${resp.status}`);
  }

  const result = await resp.json();
  if (result.error) throw new Error(result.error);
  return result.data;
}

export function useCryptoMarkets(symbolList?: string[]) {
  const ids = (symbolList || Object.keys(COINGECKO_IDS)).map(
    (s) => COINGECKO_IDS[s] || s.toLowerCase()
  );

  return useQuery<CryptoMarketData[]>({
    queryKey: ["crypto-markets", ids.join(",")],
    queryFn: () => fetchMarketData("crypto", ids),
    refetchInterval: 60000, // 1 min
    staleTime: 30000,
    retry: 2,
  });
}

export function useCryptoGlobal() {
  return useQuery<CryptoGlobalData>({
    queryKey: ["crypto-global"],
    queryFn: () => fetchMarketData("crypto_global"),
    refetchInterval: 120000, // 2 min
    staleTime: 60000,
    retry: 2,
  });
}

export function useCryptoHistory(symbol: string, days: string = "30") {
  const coinId = COINGECKO_IDS[symbol] || symbol.toLowerCase();

  return useQuery<CryptoHistoryData>({
    queryKey: ["crypto-history", coinId, days],
    queryFn: () => fetchMarketData("crypto_history", [coinId, days]),
    staleTime: 300000, // 5 min
    retry: 2,
  });
}

export { COINGECKO_IDS };
