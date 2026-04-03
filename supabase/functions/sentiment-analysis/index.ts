import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Fetch recent Vietnamese news
    const { data: newsData } = await supabase
      .from("news_articles")
      .select("title, description, source, published_at, category")
      .eq("is_active", true)
      .eq("language", "vi")
      .order("published_at", { ascending: false })
      .limit(20);

    // Also get some English financial news
    const { data: enNews } = await supabase
      .from("news_articles")
      .select("title, description, source")
      .eq("is_active", true)
      .eq("language", "en")
      .order("published_at", { ascending: false })
      .limit(10);

    let newsContext = "";
    if (newsData?.length) {
      newsContext += "TIN TỨC VIỆT NAM GẦN ĐÂY:\n";
      newsData.forEach((n: any) => {
        newsContext += `- ${n.title} (${n.source})\n`;
        if (n.description) newsContext += `  ${n.description.slice(0, 150)}\n`;
      });
    }
    if (enNews?.length) {
      newsContext += "\nINTERNATIONAL NEWS:\n";
      enNews.forEach((n: any) => {
        newsContext += `- ${n.title} (${n.source})\n`;
      });
    }

    const systemPrompt = `You are a quantitative market sentiment analyzer specializing in the Vietnamese stock market (HOSE, HNX, UPCOM).

Your task: Analyze the provided news headlines and return a Fear & Greed Index for the Vietnamese market.

RULES:
- Return ONLY a valid JSON object, nothing else
- Score from 0-100: 0=Extreme Fear, 25=Fear, 50=Neutral, 75=Greed, 100=Extreme Greed
- Analyze sentiment across 5 dimensions, each scored 0-100

JSON format:
{
  "score": <number 0-100>,
  "label": "<one of: Extreme Fear, Fear, Neutral, Greed, Extreme Greed>",
  "summary": "<1 sentence summary in Vietnamese>",
  "dimensions": {
    "market_momentum": <0-100>,
    "news_sentiment": <0-100>,
    "investor_confidence": <0-100>,
    "volatility_risk": <0-100>,
    "global_impact": <0-100>
  },
  "key_factors": ["<factor1 in Vietnamese>", "<factor2>", "<factor3>"]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: newsContext || "No recent news available. Provide a neutral assessment." },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Payment required." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "";
    
    // Extract JSON from response
    let sentiment;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      sentiment = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      sentiment = null;
    }

    if (!sentiment) {
      sentiment = {
        score: 50,
        label: "Neutral",
        summary: "Không đủ dữ liệu để phân tích",
        dimensions: { market_momentum: 50, news_sentiment: 50, investor_confidence: 50, volatility_risk: 50, global_impact: 50 },
        key_factors: ["Dữ liệu hạn chế"],
      };
    }

    return new Response(JSON.stringify(sentiment), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Sentiment analysis error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
