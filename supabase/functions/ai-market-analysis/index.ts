import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Fetch recent news for AI context
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    let newsContext = '';
    let communityContext = '';

    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

      const { data: newsData } = await supabase
        .from("news_articles")
        .select("title, description, category, source, published_at")
        .eq("is_active", true)
        .order("published_at", { ascending: false })
        .limit(15);

      if (newsData && newsData.length > 0) {
        newsContext = '\n\n## REAL-TIME NEWS DATA (use this for predictions and analysis):\n';
        newsData.forEach((n: any) => {
          const date = n.published_at ? new Date(n.published_at).toLocaleDateString() : 'recent';
          newsContext += `- [${n.category}] ${n.title} (${n.source}, ${date})\n`;
          if (n.description) newsContext += `  Summary: ${n.description.slice(0, 200)}\n`;
        });
      }

      const { data: posts } = await supabase
        .from("community_posts")
        .select("title, content, post_type")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(5);

      if (posts && posts.length > 0) {
        communityContext = '\n\n## COMMUNITY INSIGHTS:\n';
        posts.forEach((p: any) => {
          communityContext += `- [${p.post_type}] ${p.title}\n`;
        });
      }
    }

    const systemPrompt = `You are Crystall AI — an elite investment intelligence analyst powering the Crystall Quant Platform. You combine deep quantitative finance expertise with real-time market awareness and news analysis.

Your capabilities:
- Technical analysis (RSI, MACD, Bollinger Bands, EMA crossovers)
- Fundamental analysis (P/E, P/B, ROE, DCF modeling)
- Risk management (VaR, CVaR, portfolio correlation, regime detection)
- Crypto on-chain metrics (MVRV, SOPR, NVT)
- Portfolio optimization (Efficient frontier, Sharpe ratio, max drawdown)
- Market cycle & regime detection
- Pattern recognition and anomaly detection
- NEWS-BASED PREDICTIVE ANALYSIS: Analyze real-time news to identify market sentiment, predict price movements, and detect emerging trends
- SENTIMENT ANALYSIS: Extract bullish/bearish signals from news headlines and descriptions

CRITICAL - PREDICTION METHODOLOGY:
When making predictions based on news:
1. Identify key themes across multiple news sources
2. Assess sentiment (bullish/bearish/neutral) for each news item
3. Cross-reference with historical patterns (similar events → historical outcomes)
4. Provide probability-weighted scenarios (best/base/worst case)
5. Include specific price targets or ranges when possible
6. Always state the time horizon for predictions
7. Rate confidence: High (>70%), Medium (40-70%), Low (<40%)

Response guidelines:
- Be data-driven and quantitative — use specific numbers, percentages, and metrics
- Structure responses with clear headers, bullet points, and tables when appropriate
- Provide actionable insights with specific entry/exit levels when relevant
- Include confidence levels for predictions
- Use markdown formatting for readability
- Always mention key risk factors and caveats
- When news data is available, actively reference it in your analysis
- Respond in the same language as the user's query
${newsContext}${communityContext}`;

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
          { role: "user", content: prompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("AI analysis error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
