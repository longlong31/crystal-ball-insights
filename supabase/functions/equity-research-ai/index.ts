// Multi-Agent Equity Research AI — Phase 3
// 6 specialist agents (Fundamental / Technical / Quant / Risk / Macro / Portfolio)
// run in parallel, then a Chief Strategist synthesizes a consensus thesis.
import "https://deno.land/std@0.224.0/dotenv/load.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MODEL = "google/gemini-3-flash-preview";
const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

interface AgentDef {
  id: string;
  name: string;
  emoji: string;
  persona: string;
}

const AGENTS: AgentDef[] = [
  {
    id: "fundamental",
    name: "Fundamental Analyst",
    emoji: "📊",
    persona:
      "Chuyên gia phân tích cơ bản (CFA-level). Đánh giá định giá (PE/PB/EV/EBITDA/DCF), chất lượng lợi nhuận, biên lãi, ROE/ROIC, cơ cấu vốn, lợi thế cạnh tranh (moat) và chất lượng quản trị.",
  },
  {
    id: "technical",
    name: "Technical Strategist",
    emoji: "📈",
    persona:
      "Chuyên gia phân tích kỹ thuật. Đọc xu hướng, RSI, MACD, MA, Bollinger, volume, mô hình giá, vùng hỗ trợ/kháng cự, breakout/breakdown và momentum đa khung.",
  },
  {
    id: "quant",
    name: "Quant Researcher",
    emoji: "⚛️",
    persona:
      "Quant cấp tổ chức. Phân tích Beta, Alpha, Sharpe, Sortino, Treynor, Information Ratio, skewness, kurtosis, biến động, drawdown, regime và factor exposure (Value/Growth/Momentum/Quality/LowVol).",
  },
  {
    id: "risk",
    name: "Risk Officer",
    emoji: "⚠️",
    persona:
      "Giám đốc rủi ro. Đo VaR/CVaR, max drawdown, stress test, rủi ro thanh khoản, rủi ro tập trung, rủi ro đòn bẩy, tail risk và rủi ro sự kiện (earnings, M&A, chính sách).",
  },
  {
    id: "macro",
    name: "Macro Economist",
    emoji: "🌍",
    persona:
      "Nhà kinh tế vĩ mô. Đánh giá tác động của lãi suất, lạm phát, tỷ giá, chu kỳ kinh tế, chính sách tiền tệ/tài khóa, dòng vốn ngoại và bối cảnh ngành.",
  },
  {
    id: "portfolio",
    name: "Portfolio Manager",
    emoji: "🎯",
    persona:
      "PM danh mục. Đưa khuyến nghị position sizing, vai trò trong portfolio (core/satellite/hedge), tương quan với chỉ số, đề xuất stop-loss/take-profit và horizon (ST/MT/LT).",
  },
];

function buildAgentPrompt(agent: AgentDef, symbol: string, ctx: any, lang: string) {
  const langLine =
    lang === "en"
      ? "Respond in concise institutional English."
      : "Trả lời bằng tiếng Việt súc tích, chuyên nghiệp cấp tổ chức.";
  return `Bạn là **${agent.emoji} ${agent.name}**. ${agent.persona}

${langLine}

Phân tích cổ phiếu **${symbol}** dựa trên dữ liệu thị trường thời gian thực dưới đây:

\`\`\`json
${JSON.stringify(ctx, null, 2)}
\`\`\`

Yêu cầu output (Markdown, ≤ 220 từ):
1. **Quan điểm cốt lõi** (1-2 câu)
2. **3 điểm chính** (bullet, có số liệu cụ thể)
3. **Đánh giá**: BUY / HOLD / SELL + **Confidence**: 0-100%
4. **Rủi ro chính** (1 câu)`;
}

function buildConsensusPrompt(symbol: string, agentReports: any[], lang: string) {
  const reportsBlock = agentReports
    .map((r) => `### ${r.emoji} ${r.name}\n${r.content}`)
    .join("\n\n---\n\n");
  const langLine =
    lang === "en"
      ? "Respond in concise institutional English."
      : "Trả lời bằng tiếng Việt súc tích cấp tổ chức.";
  return `Bạn là **Chief Investment Strategist**. ${langLine}

Tổng hợp 6 báo cáo dưới đây thành **Investment Thesis** cuối cùng cho **${symbol}**:

${reportsBlock}

Output Markdown bắt buộc:
1. **🎯 RATING**: BUY / HOLD / SELL  
2. **📊 CONFIDENCE**: 0-100%  
3. **🎯 PRICE TARGET (12M)**: ước lượng + khoảng tin cậy  
4. **📝 Investment Thesis** (3-5 bullets, súc tích)  
5. **✅ Catalysts** (2-3 bullets)  
6. **⚠️ Key Risks** (2-3 bullets)  
7. **🧭 Recommendation Horizon**: Short / Medium / Long-term + position sizing gợi ý`;
}

async function callAI(systemOrUser: string, key: string) {
  const r = await fetch(GATEWAY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: systemOrUser }],
      temperature: 0.6,
      max_tokens: 900,
    }),
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`AI ${r.status}: ${text.slice(0, 200)}`);
  }
  const j = await r.json();
  return j.choices?.[0]?.message?.content || "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const { symbol, context, language = "vi" } = await req.json();
    if (!symbol) throw new Error("symbol required");

    // 1) Run 6 agents in parallel
    const agentResults = await Promise.all(
      AGENTS.map(async (a) => {
        try {
          const content = await callAI(buildAgentPrompt(a, symbol, context || {}, language), key);
          return { id: a.id, name: a.name, emoji: a.emoji, content, ok: true };
        } catch (err) {
          return {
            id: a.id,
            name: a.name,
            emoji: a.emoji,
            content: `*Agent tạm thời không phản hồi: ${(err as Error).message}*`,
            ok: false,
          };
        }
      }),
    );

    // 2) Consensus synthesis
    let consensus = "";
    try {
      consensus = await callAI(
        buildConsensusPrompt(symbol, agentResults.filter((r) => r.ok), language),
        key,
      );
    } catch (err) {
      consensus = `*Không thể tổng hợp consensus: ${(err as Error).message}*`;
    }

    return new Response(
      JSON.stringify({ symbol, agents: agentResults, consensus }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("equity-research-ai error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
