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

    // Build compact text representation (larger budget for richer context)
    const MAX_CHARS = 40000;
    let dataText = "";
    for (const s of sheets) {
      const headers = (s.headers || []).join(" | ");
      dataText += `\n## SHEET: ${s.name}\nCỘT: ${headers}\n`;
      const rows = (s.rows || []).slice(0, 500);
      for (const r of rows) {
        const line = Object.values(r).map((v: any) => {
          if (v == null) return "";
          if (typeof v === "number") {
            // Preserve precision; show as plain number
            return Number.isInteger(v) ? String(v) : v.toFixed(2);
          }
          return String(v);
        }).join(" | ");
        if (line.replace(/[\s|]/g, "")) dataText += line + "\n";
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

    const systemPrompt = `Bạn là CFO + auditor cấp cao, chuyên đọc báo cáo tài chính Việt Nam và quốc tế (BCĐKT, KQKD, LCTT).

NHIỆM VỤ:
1. Đọc TỪNG dòng dữ liệu thô bên dưới (đã được trích xuất từ Excel/PDF), nhận diện cấu trúc báo cáo: Bảng cân đối kế toán, Kết quả kinh doanh, Lưu chuyển tiền tệ, Thuyết minh.
2. Trích xuất TOÀN BỘ chỉ số tài chính có giá trị số (tối thiểu 15-30 chỉ số nếu file đủ dữ liệu): doanh thu thuần, giá vốn, lợi nhuận gộp, chi phí bán hàng/QLDN, lợi nhuận thuần HĐKD, lợi nhuận trước/sau thuế, EBITDA, tổng tài sản (ngắn hạn + dài hạn), nợ phải trả (ngắn hạn + dài hạn), vốn chủ sở hữu, tiền & tương đương, hàng tồn kho, phải thu, TSCĐ, dòng tiền HĐKD/đầu tư/tài chính, khấu hao, chi phí lãi vay, thuế TNDN...
3. Khi có nhiều kỳ (2023/2024, Q1/Q2...), CHỌN KỲ MỚI NHẤT. Nếu không rõ kỳ, lấy cột số đầu tiên có dữ liệu.
4. Tự suy luận đơn vị (đồng/nghìn/triệu/tỷ) từ tiêu đề báo cáo hoặc cường độ con số. Trả về unitMultiplier áp dụng cho TẤT CẢ giá trị (1, 1000, 1000000, 1000000000). Giá trị 'value' phải là số RAW như xuất hiện trong file (chưa nhân hệ số).
5. Map chính xác sang field chuẩn 'useAs'. Nếu chỉ số không thuộc nhóm chuẩn, để useAs = "".
6. Confidence: 0.9+ nếu match rõ ràng theo tên tiếng Việt/Anh chuẩn; 0.7-0.8 nếu phải suy luận; <0.6 nếu mơ hồ.
7. Insights (5-10 câu): nhận định CỤ THỂ dựa trên số liệu — tỷ lệ tăng trưởng, biên lợi nhuận, cơ cấu vốn, thanh khoản, sức khỏe tài chính. Tránh nói chung chung.
8. Warnings: chỉ ra dữ liệu bất thường (giá trị âm bất hợp lý, mất cân đối kế toán, dòng tiền âm liên tục, đòn bẩy quá cao...).

LUÔN gọi tool submit_financial_extraction để trả kết quả. KHÔNG bỏ sót chỉ số nào có trong file.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
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
