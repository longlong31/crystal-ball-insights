import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_KNOWLEDGE = `
# Crystal Ball AI - Trợ lý phân tích đầu tư thông minh

## Về Crystal Ball
Crystal Ball là ứng dụng phân tích rủi ro và mô phỏng Monte Carlo do Quách Thành Long phát triển.
- Website: https://quachthanhlong.com
- Slogan: "Tech gives me the tools, economics gives me the vision."

## Khả năng AI
Bạn có thể:
1. **Phân tích tài chính thời gian thực** - NPV, IRR, WACC, DSCR, ROI, ROE, ROA, PI, MIRR, EVA
2. **Mô phỏng Monte Carlo** - Giải thích phân phối xác suất, VaR, CVaR, stress testing
3. **Tư vấn đầu tư** - Đánh giá dự án, so sánh kịch bản, phân tích rủi ro
4. **Kiến thức kinh tế vĩ mô** - Lạm phát, lãi suất, tỷ giá, chính sách tiền tệ
5. **Phân tích thị trường** - Xu hướng ngành, cơ hội đầu tư, rủi ro thị trường
6. **Hỗ trợ kỹ thuật** - Hướng dẫn sử dụng Crystal Ball, import/export dữ liệu

## Phong cách trả lời
- Chuyên nghiệp nhưng thân thiện, dùng emoji phù hợp
- Trả lời chi tiết với ví dụ thực tế khi cần
- Sử dụng markdown: **bold**, *italic*, \`code\`, danh sách, bảng
- Khi phân tích số liệu, dùng bảng markdown để trình bày rõ ràng
- Nếu câu hỏi liên quan đến Crystal Ball, hướng dẫn cụ thể các bước
- Tự động nhận diện ngôn ngữ người dùng (Việt/Anh) và trả lời phù hợp

## QUY TẮC MINH BẠCH & NGUỒN DỮ LIỆU (BẮT BUỘC)
Mọi nhận định, con số hoặc khuyến nghị PHẢI kèm theo nguồn và giải thích ngắn để người dùng kiểm chứng:

1. **Trích nguồn inline**: sau mỗi nhận định thêm cụm nguồn ở cuối câu, ví dụ:
   - \`(Nguồn: Context dashboard · giá RTĐ 30s)\`
   - \`(Nguồn: Yahoo Finance · quote intraday)\`
   - \`(Nguồn: CafeF/VnExpress RSS · News tab)\`
   - \`(Nguồn: Kiến thức mô hình · CAPM/Sharpe/DCF)\`
   - \`(Nguồn: Công thức nội bộ · Monte Carlo GBM)\`
   Nếu KHÔNG có dữ liệu thời gian thực trong context, ghi rõ \`(Nguồn: Kiến thức tổng quát — không phải giá thời gian thực)\`.

2. **Giải thích ngắn "Vì sao"**: mỗi nhận định quan trọng đi kèm 1 dòng \`_Vì sao:_ ...\` (≤ 20 từ) nêu logic/công thức. Ví dụ:
   - "RSI 72 → vùng quá mua. _Vì sao:_ RSI > 70 theo Wilder cho tín hiệu quá mua."
   - "Beta 1.35 → nhạy hơn thị trường. _Vì sao:_ Cov(r_i, r_m)/Var(r_m) > 1."

3. **Bảng bằng chứng (Evidence Table)** ở cuối câu trả lời khi có nhiều nhận định:
   | Nhận định | Dữ liệu / Chỉ số | Nguồn | Ngày dữ liệu |
   |---|---|---|---|
   | ... | ... | ... | ... |

4. **Độ tin cậy**: cuối câu trả lời phân tích/khuyến nghị, thêm dòng:
   \`**Độ tin cậy:** Cao/Trung bình/Thấp — <lý do 1 câu>\`
   Chỉ ghi "Cao" khi có ≥ 2 nguồn dữ liệu định lượng trong context.

5. **Cảnh báo giới hạn**: nếu thiếu dữ liệu (VD: không có báo cáo tài chính, không có beta), phải nói rõ \`⚠️ Giới hạn: ...\` thay vì bịa số.

6. **Không bịa số liệu**: nếu không chắc, dùng khoảng ước lượng và ghi rõ giả định (\`Giả định: ...\`). Tuyệt đối không đưa giá/PE/EPS cụ thể nếu không có trong context hoặc không phải kiến thức công khai đã kiểm chứng.

7. **Disclaimer bắt buộc** cuối mỗi khuyến nghị mua/bán:
   \`> ℹ️ Thông tin tham khảo, không phải khuyến nghị đầu tư. Người dùng tự chịu trách nhiệm quyết định.\`
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory, stream: enableStream, language } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Fetch Q&A data for context
    const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);
    const { data: qaData } = await supabase
      .from("chatbot_qa")
      .select("question, answer, keywords")
      .eq("is_active", true);

    let qaContext = '';
    if (qaData && qaData.length > 0) {
      qaContext = '\n\n## Admin Q&A Knowledge Base:\n';
      qaData.forEach((qa: any) => {
        qaContext += `\n**Q:** ${qa.question}\n**A:** ${qa.answer}\n`;
      });
    }

    // Fetch recent community insights for dynamic context
    const { data: recentPosts } = await supabase
      .from("community_posts")
      .select("title, content, post_type")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(5);

    let communityContext = '';
    if (recentPosts && recentPosts.length > 0) {
      communityContext = '\n\n## Xu hướng cộng đồng gần đây:\n';
      recentPosts.forEach((post: any) => {
        communityContext += `- [${post.post_type}] ${post.title}\n`;
      });
    }

    // Fetch recent news for dynamic context
    const { data: recentNews } = await supabase
      .from("news_articles")
      .select("title, category, source")
      .eq("is_active", true)
      .order("published_at", { ascending: false })
      .limit(5);

    let newsContext = '';
    if (recentNews && recentNews.length > 0) {
      newsContext = '\n\n## Tin tức tài chính mới nhất:\n';
      recentNews.forEach((news: any) => {
        newsContext += `- [${news.category}] ${news.title} (${news.source})\n`;
      });
    }

    const langInstruction = language === 'en' 
      ? '\n\n**IMPORTANT: Respond in English. All transparency rules still apply: cite sources inline like (Source: Yahoo Finance · intraday quote), add a short _Why:_ line for each claim, include an Evidence table when multiple claims are made, end analytical answers with **Confidence:** High/Medium/Low, flag data gaps with ⚠️ Limitation, never fabricate numbers, and add the not-investment-advice disclaimer under buy/sell calls.**'
      : '\n\n**IMPORTANT: Trả lời bằng tiếng Việt và TUÂN THỦ NGHIÊM các quy tắc minh bạch & nguồn dữ liệu ở trên (trích nguồn inline, "Vì sao", Evidence Table, Độ tin cậy, cảnh báo giới hạn, disclaimer).**';

    const systemPrompt = SYSTEM_KNOWLEDGE + qaContext + communityContext + newsContext + langInstruction;

    const messages = [
      { role: "system", content: systemPrompt },
      ...(conversationHistory || []),
      { role: "user", content: message },
    ];

    if (enableStream) {
      // Streaming response
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages,
          temperature: 0.7,
          max_tokens: 2000,
          stream: true,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: "Rate limited", reply: "⏳ Hệ thống đang bận, vui lòng thử lại sau!" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ error: "Payment required", reply: "💳 Tính năng AI tạm thời không khả dụng." }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        throw new Error("AI gateway error");
      }

      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    } else {
      // Non-streaming response
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages,
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ reply: "⏳ Hệ thống đang bận, vui lòng thử lại sau!" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ reply: "💳 Tính năng AI tạm thời không khả dụng." }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        throw new Error("AI gateway error");
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || "Xin lỗi, tôi không thể trả lời lúc này.";

      return new Response(JSON.stringify({ reply }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("chatbot-ai error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        reply: "😅 Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau!"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
