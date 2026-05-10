import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { sheets, fileName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    if (!Array.isArray(sheets) || sheets.length === 0) {
      return new Response(JSON.stringify({ error: "No sheet data" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build compact text representation (cap size)
    const MAX_CHARS = 18000;
    let dataText = "";
    for (const s of sheets) {
      const headers = (s.headers || []).join(" | ");
      dataText += `\n## SHEET: ${s.name}\nHEADERS: ${headers}\n`;
      const rows = (s.rows || []).slice(0, 200);
      for (const r of rows) {
        const line = Object.values(r).map((v: any) => String(v ?? "")).join(" | ");
        if (line.trim()) dataText += line + "\n";
        if (dataText.length > MAX_CHARS) break;
      }
      if (dataText.length > MAX_CHARS) break;
    }
    dataText = dataText.slice(0, MAX_CHARS);

    const tools = [{
      type: "function",
      function: {
        name: "submit_financial_extraction",
        description: "Trích xuất các chỉ số tài chính từ báo cáo và đưa ra phân tích",
        parameters: {
          type: "object",
          properties: {
            currency: { type: "string", description: "VND, USD..." },
            unitMultiplier: { type: "number", description: "Hệ số nhân đơn vị: 1, 1000, 1000000, 1000000000" },
            period: { type: "string", description: "Kỳ báo cáo, vd: 2024 hoặc Q3/2024" },
            metrics: {
              type: "array",
              description: "Tất cả chỉ số tài chính trích xuất được. Giá trị raw (chưa nhân hệ số đơn vị).",
              items: {
                type: "object",
                properties: {
                  name: { type: "string", description: "Tên gốc trong báo cáo" },
                  value: { type: "number" },
                  category: { type: "string", enum: ["Doanh thu","Chi phí","Lợi nhuận","Tài sản","Nợ","Vốn","Dòng tiền","Khấu hao","Thuế","Khác"] },
                  useAs: { type: "string", description: "Map sang field chuẩn", enum: ["revenue","expenses","netIncome","assets","liabilities","equity","cashFlow","operatingCashFlow","investingCashFlow","financingCashFlow","depreciation","interestExpense","taxExpense","ebitda","grossProfit","operatingIncome",""] },
                  confidence: { type: "number", description: "0-1" }
                },
                required: ["name","value","category","useAs","confidence"]
              }
            },
            insights: { type: "array", items: { type: "string" }, description: "5-8 nhận định từ số liệu" },
            dataQuality: { type: "string", enum: ["high","medium","low"] },
            warnings: { type: "array", items: { type: "string" } }
          },
          required: ["metrics","insights","dataQuality"]
        }
      }
    }];

    const systemPrompt = `Bạn là chuyên gia phân tích báo cáo tài chính. Đọc dữ liệu thô từ file Excel/PDF rồi:
1. Nhận diện và trích xuất TẤT CẢ chỉ số tài chính có giá trị số (doanh thu, chi phí, lợi nhuận, tài sản, nợ, vốn, dòng tiền, EBITDA...).
2. Tự suy luận đơn vị (đồng/nghìn/triệu/tỷ) từ context.
3. Map mỗi chỉ số sang field chuẩn (useAs) khi phù hợp. Nếu không chắc, để useAs = "".
4. Đưa ra insights chuyên sâu dựa trên các con số tìm được.
5. Cảnh báo dữ liệu bất thường hoặc thiếu.
Luôn gọi tool submit_financial_extraction để trả kết quả.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `File: ${fileName || "unknown"}\n\nDỮ LIỆU THÔ:\n${dataText}` }
        ],
        tools,
        tool_choice: { type: "function", function: { name: "submit_financial_extraction" } }
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      const status = response.status === 429 || response.status === 402 ? response.status : 500;
      const msg = response.status === 429 ? "Vượt quá giới hạn yêu cầu, vui lòng thử lại sau."
        : response.status === 402 ? "Cần nạp thêm credit để dùng AI."
        : "Lỗi AI gateway";
      return new Response(JSON.stringify({ error: msg }), {
        status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("AI did not return tool call");
    const extraction = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ extraction }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-extract-financials error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
