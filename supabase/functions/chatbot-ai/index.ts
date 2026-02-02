import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
      .select("question, answer")
      .eq("is_active", true);

    const qaContext = qaData?.map(qa => `Q: ${qa.question}\nA: ${qa.answer}`).join("\n\n") || "";

    const systemPrompt = `Bạn là Crystal Ball AI Assistant - trợ lý thông minh cho ứng dụng phân tích dự án đầu tư Crystal Ball.

THÔNG TIN VỀ ỨNG DỤNG:
- Crystal Ball là công cụ mô phỏng Monte Carlo và phân tích tài chính dự án đầu tư
- Hỗ trợ tính toán NPV, IRR, DSCR, ROI, ROE và nhiều chỉ số tài chính khác
- Cho phép phân tích độ nhạy, so sánh nhiều dự án, xuất báo cáo PDF/Word
- Tích hợp AI để phân tích và đánh giá dự án

CƠ SỞ KIẾN THỨC TỪ Q&A:
${qaContext}

QUY TẮC TRẢ LỜI:
1. Trả lời ngắn gọn, rõ ràng bằng tiếng Việt
2. Thân thiện và chuyên nghiệp
3. Nếu câu hỏi liên quan đến Q&A có sẵn, ưu tiên sử dụng thông tin đó
4. Với câu hỏi chuyên môn về tài chính, đưa ra giải thích dễ hiểu
5. Nếu không chắc chắn, hướng dẫn người dùng liên hệ admin
6. Sử dụng emoji phù hợp để thân thiện hơn`;

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
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Đã vượt quá giới hạn yêu cầu, vui lòng thử lại sau.", reply: "Xin lỗi, hệ thống đang bận. Vui lòng thử lại sau ít phút nhé! 🙏" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Cần nạp thêm credit.", reply: "Xin lỗi, tính năng AI tạm thời không khả dụng. Vui lòng thử lại sau! 🙏" }),
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
        reply: "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau! 🙏"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
