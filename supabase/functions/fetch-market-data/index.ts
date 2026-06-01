import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, symbols } = await req.json();

    if (type === "crypto") {
      // CoinGecko free API. If symbols provided -> filter by ids; otherwise fetch top N by mcap.
      const hasIds = Array.isArray(symbols) && symbols.length > 0 && !symbols[0]?.toString().startsWith("__top");
      const topMatch = symbols?.[0]?.toString().match(/^__top:(\d+)$/);
      const perPage = topMatch ? Math.min(250, parseInt(topMatch[1], 10) || 100) : 100;
      const idsParam = hasIds ? `&ids=${(symbols as string[]).join(",")}` : "";
      const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd${idsParam}&order=market_cap_desc&per_page=${perPage}&page=1&sparkline=true&price_change_percentage=1h,24h,7d,30d`;
      
      const resp = await fetch(url, {
        headers: { "Accept": "application/json" },
      });
      
      if (!resp.ok) {
        throw new Error(`CoinGecko API error: ${resp.status}`);
      }
      
      const data = await resp.json();
      
      const result = data.map((coin: any) => ({
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        image: coin.image,
        currentPrice: coin.current_price,
        marketCap: coin.market_cap,
        marketCapRank: coin.market_cap_rank,
        totalVolume: coin.total_volume,
        high24h: coin.high_24h,
        low24h: coin.low_24h,
        priceChange24h: coin.price_change_24h,
        priceChangePercentage24h: coin.price_change_percentage_24h,
        priceChangePercentage1h: coin.price_change_percentage_1h_in_currency,
        priceChangePercentage7d: coin.price_change_percentage_7d_in_currency,
        priceChangePercentage30d: coin.price_change_percentage_30d_in_currency,
        circulatingSupply: coin.circulating_supply,
        totalSupply: coin.total_supply,
        ath: coin.ath,
        athChangePercentage: coin.ath_change_percentage,
        sparkline7d: coin.sparkline_in_7d?.price || [],
        lastUpdated: coin.last_updated,
      }));

      return new Response(JSON.stringify({ data: result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (type === "crypto_global") {
      const resp = await fetch("https://api.coingecko.com/api/v3/global", {
        headers: { "Accept": "application/json" },
      });
      
      if (!resp.ok) throw new Error(`CoinGecko global API error: ${resp.status}`);
      
      const data = await resp.json();
      const globalData = data.data;
      
      return new Response(JSON.stringify({
        data: {
          totalMarketCap: globalData.total_market_cap?.usd || 0,
          totalVolume: globalData.total_volume?.usd || 0,
          marketCapPercentage: globalData.market_cap_percentage || {},
          activeCryptocurrencies: globalData.active_cryptocurrencies,
          marketCapChangePercentage24h: globalData.market_cap_change_percentage_24h_usd,
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (type === "crypto_history") {
      const coinId = symbols?.[0] || "bitcoin";
      const days = symbols?.[1] || "30";
      const url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`;
      
      const resp = await fetch(url, {
        headers: { "Accept": "application/json" },
      });
      
      if (!resp.ok) throw new Error(`CoinGecko history API error: ${resp.status}`);
      
      const data = await resp.json();
      
      return new Response(JSON.stringify({
        data: {
          prices: data.prices || [],
          volumes: data.market_caps || [],
          totalVolumes: data.total_volumes || [],
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid type. Use: crypto, crypto_global, crypto_history" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Market data error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
