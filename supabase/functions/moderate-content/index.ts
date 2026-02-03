import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, title } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const textToModerate = `Tiêu đề: ${title || ""}\n\nNội dung: ${content}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Bạn là hệ thống kiểm duyệt nội dung. Phân tích văn bản và xác định xem có vi phạm các quy tắc sau không:

1. NỘI DUNG BẠO LỰC: Kích động bạo lực, đe dọa, mô tả hành vi bạo lực
2. NỘI DUNG KHIÊU DÂM: Nội dung tình dục, khiêu dâm
3. KÍCH ĐỘNG CHIẾN TRANH: Kích động chiến tranh, xung đột, chia rẽ
4. NGÔN TỪ THÓA MẠ: Xúc phạm, phỉ báng, kỳ thị
5. THÔNG TIN SAI LỆCH: Thông tin sai sự thật gây hoang mang
6. SPAM/QUẢNG CÁO: Spam, quảng cáo không được phép

Trả về JSON với format:
{
  "safe": true/false,
  "violations": ["danh sách vi phạm nếu có"],
  "reason": "lý do chi tiết nếu không an toàn",
  "severity": "low/medium/high"
}

Chỉ trả về JSON, không giải thích thêm.`
          },
          {
            role: "user",
            content: textToModerate
          }
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          safe: true, 
          reason: "Rate limited - allowing content",
          violations: [] 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || "";
    
    // Parse JSON from AI response
    let moderationResult;
    try {
      // Extract JSON from response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        moderationResult = JSON.parse(jsonMatch[0]);
      } else {
        moderationResult = { safe: true, violations: [], reason: "" };
      }
    } catch {
      moderationResult = { safe: true, violations: [], reason: "" };
    }

    return new Response(JSON.stringify(moderationResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Moderation error:", error);
    // On error, allow content but flag for manual review
    return new Response(JSON.stringify({ 
      safe: true, 
      needsReview: true,
      reason: "Could not moderate - needs manual review",
      violations: []
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
