import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Dữ liệu về Quách Thành Long cho chatbot
const LONG_PROFILE_DATA = `
# Thông tin về Quách Thành Long (Long Quach)

## Giới thiệu
- Tên: Quách Thành Long
- Vai trò: Investor | Web/Game Developer | Business Analyst
- Năng lực: CTO-level talent passionate about technology, economics, and creating innovative solutions
- Website chính thức: https://quachthanhlong.com

## Thống kê
- 25+ dự án đã hoàn thành
- 800+ giờ học tập và nghiên cứu
- 12+ khách hàng phục vụ

## Kỹ năng chuyên môn
1. **Full-Stack Development**: React, Next.js, Node.js, Unity
2. **Business Analysis**: Strategic Planning, Market Research
3. **Investment**: Tech Startups, Market Analysis

## Dự án nổi bật
1. **ThinkShift**: Tái định nghĩa năng lực trong Kỷ nguyên Số (Next.js, Python, Analytics)
   - Demo: https://thinkshift-vietnam.vercel.app/
   
2. **MSC**: Trung tâm đào tạo và phát triển kỹ năng chuyên nghiệp hàng đầu Việt Nam (Next.js, GoLang)
   - Demo: https://msc-rebuild.vercel.app/
   
3. **Fragments of Memory Game**: Healing Game (Unity, C#, WebGL, Mobile)

## Game Development
1. **Dragon Keeper**: Game nuôi rồng fantasy với PvP, tiến hóa & giao diện đẹp mắt (Next.js, Tailwind)
   - Play: https://dragon-keeper-game.vercel.app/
   
2. **Cosmic Emotion Letter**: Emotional space-themed letter writing game with beautiful UI and healing gameplay
   - Play: https://cosmic-emotion-letter-game.vercel.app/play

## Blog & Insights
- "The Future of Web Development: AI Integration" - Khám phá cách AI đang thay đổi phát triển web
- "Game Development with Unity: Best Practices" - Tips và kỹ thuật tạo game hấp dẫn với Unity
- "Investment Strategies in Tech Startups" - Phân tích xu hướng thị trường và cơ hội đầu tư

## Liên hệ
- Website: https://quachthanhlong.com
- Projects: https://quachthanhlong.com/projects
- Contact: https://quachthanhlong.com/contact

## Slogan
"Tech gives me the tools, economics gives me the vision."
`;

// Dữ liệu về Crystal Ball app
const CRYSTAL_BALL_DATA = `
# Thông tin về Crystal Ball - Ứng dụng Mô phỏng Monte Carlo

## Giới thiệu
Crystal Ball là một ứng dụng web hiện đại được phát triển bởi Quách Thành Long để hỗ trợ phân tích rủi ro và mô phỏng Monte Carlo trong các dự án đầu tư.

## Tính năng chính
1. **Mô phỏng Monte Carlo cơ bản**
   - Hỗ trợ nhiều loại phân phối: Triangular, Normal, Lognormal, Uniform, Beta
   - Chạy hàng nghìn lần lặp để dự đoán kết quả
   - Hiển thị thống kê chi tiết: Mean, Median, Percentiles (P5, P25, P50, P75, P95)

2. **Phân tích độ nhạy**
   - Xác định các yếu tố ảnh hưởng nhiều nhất đến kết quả
   - Biểu đồ Tornado trực quan
   - Phân tích tương quan

3. **Phân tích dự án đầu tư**
   - Tính NPV (Net Present Value) - Giá trị hiện tại ròng
   - Tính IRR (Internal Rate of Return) - Tỷ suất hoàn vốn nội bộ
   - Phân tích Payback Period - Thời gian hoàn vốn
   - DSCR (Debt Service Coverage Ratio) - Hệ số khả năng trả nợ
   - ROI, ROE - Tỷ suất sinh lời
   - Stress Testing - Kiểm tra khả năng chịu đựng

4. **Quản lý kịch bản**
   - Lưu và load các kịch bản mô phỏng
   - So sánh nhiều kịch bản
   - Export kết quả ra PDF/Word

5. **Import/Export dữ liệu**
   - Hỗ trợ import từ Excel
   - Export báo cáo PDF/Word chuyên nghiệp

## Các khái niệm tài chính quan trọng
1. **Monte Carlo Simulation**: Phương pháp sử dụng mô phỏng ngẫu nhiên để dự đoán kết quả có tính đến rủi ro
2. **NPV**: Tổng giá trị hiện tại của tất cả dòng tiền tương lai, chiết khấu về hiện tại
3. **IRR**: Tỷ suất chiết khấu mà tại đó NPV = 0
4. **Sensitivity Analysis**: Phân tích ảnh hưởng của từng biến số đến kết quả
5. **Risk Analysis**: Đánh giá và lượng hóa rủi ro trong đầu tư

## Đối tượng sử dụng
- Nhà phân tích tài chính
- Quản lý dự án
- Nhà đầu tư cá nhân và tổ chức
- Sinh viên kinh tế/tài chính
- Doanh nghiệp cần đánh giá dự án
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory } = await req.json();
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
      qaContext = '\n\n# Câu hỏi và trả lời được định nghĩa sẵn từ Admin:\n';
      qaData.forEach((qa: any) => {
        qaContext += `\nQ: ${qa.question}\nA: ${qa.answer}\n`;
        if (qa.keywords && qa.keywords.length > 0) {
          qaContext += `Keywords: ${qa.keywords.join(', ')}\n`;
        }
      });
    }

    const systemPrompt = `Bạn là Crystal Ball AI Assistant - trợ lý thông minh chuyên về phân tích rủi ro, mô phỏng Monte Carlo và tư vấn đầu tư. 

Bạn được phát triển bởi Quách Thành Long (Long Quach) - một developer và business analyst tài năng.

## Kiến thức của bạn:

${LONG_PROFILE_DATA}

${CRYSTAL_BALL_DATA}

${qaContext}

## Hướng dẫn trả lời:
1. Luôn thân thiện, chuyên nghiệp và hữu ích
2. Ưu tiên sử dụng thông tin từ Q&A đã định nghĩa nếu có câu hỏi liên quan
3. Có thể trả lời về Quách Thành Long, các dự án của anh ấy, và thông tin liên hệ
4. Giải thích các khái niệm tài chính một cách dễ hiểu với ví dụ thực tế
5. Hỗ trợ sử dụng ứng dụng Crystal Ball
6. Trả lời bằng tiếng Việt trừ khi được yêu cầu khác
7. Sử dụng emoji phù hợp để tạo trải nghiệm thân thiện 🎯
8. Nếu không biết câu trả lời, hãy thành thật nói và gợi ý liên hệ qua quachthanhlong.com
9. Khi nói về Long/Quách Thành Long, hãy giới thiệu như một chuyên gia đáng tin cậy`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...(conversationHistory || []),
      { role: "user", content: message },
    ];

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
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Đã vượt quá giới hạn yêu cầu, vui lòng thử lại sau.", reply: "⏳ Xin lỗi, hệ thống đang bận. Vui lòng thử lại sau ít phút nhé!" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Cần nạp thêm credit.", reply: "💳 Xin lỗi, tính năng AI tạm thời không khả dụng. Vui lòng liên hệ admin!" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Xin lỗi, tôi không thể trả lời lúc này.";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
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
