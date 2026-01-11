import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProjectData {
  params: {
    projectName: string;
    operationYears: number;
    fixedAssetValue: number;
    intangibleAssetValue: number;
    debtRatio: number;
    nominalInterestRate: number;
    loanTerm: number;
    designCapacity: number;
    basePrice: number;
    componentCost: number;
    adminCost: number;
    inflationRate: number;
    corporateTaxRate: number;
  };
  results: {
    npvTIPV: number;
    npvEPV: number;
    irrTIPV: number;
    irrEPV: number;
    dppTIPV: number;
    dppEPV: number;
    dscrAverage: number;
    waccAverage: number;
    roi: number;
    roe: number;
    roa: number;
    pi: number;
    mirr: number;
    eva: number;
    paybackPeriod: number;
    netProfitMargin: number;
    grossProfitMargin: number;
    assetTurnover: number;
    capitalEfficiency: number;
    interestCoverageRatio: number;
    debtToEquity: number;
    financialLeverage: number;
    breakEvenRevenue: number;
    breakEvenUnits: number;
    safetyMargin: number;
    operatingLeverage: number;
    coefficientOfVariation: number;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectData } = await req.json() as { projectData: ProjectData };
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Bạn là chuyên gia phân tích tài chính dự án đầu tư hàng đầu Việt Nam với 20+ năm kinh nghiệm. 
Nhiệm vụ: Phân tích chuyên sâu dự án và đưa ra báo cáo đánh giá chi tiết.

Quy tắc:
1. Phân tích dựa trên các chỉ số tài chính được cung cấp
2. Đưa ra đánh giá khách quan, có căn cứ
3. Gợi ý cải thiện cụ thể, khả thi
4. Sử dụng ngôn ngữ chuyên nghiệp nhưng dễ hiểu
5. So sánh với tiêu chuẩn ngành (NPV > 0, IRR > WACC, DSCR > 1.2, ROE > 15%, PI > 1)

Định dạng output (JSON):
{
  "overallAssessment": "Đánh giá tổng quan dự án (2-3 câu)",
  "score": số điểm từ 0-100,
  "feasibility": "VERY_FEASIBLE" | "FEASIBLE" | "MARGINAL" | "NOT_FEASIBLE",
  "strengths": ["Điểm mạnh 1", "Điểm mạnh 2", ...],
  "weaknesses": ["Điểm yếu 1", "Điểm yếu 2", ...],
  "aiRecommendations": [
    {
      "priority": "HIGH" | "MEDIUM" | "LOW",
      "area": "Lĩnh vực cần cải thiện",
      "issue": "Vấn đề cụ thể",
      "solution": "Giải pháp đề xuất chi tiết",
      "expectedImpact": "Tác động dự kiến khi áp dụng",
      "implementationSteps": ["Bước 1", "Bước 2", ...]
    }
  ],
  "riskAnalysis": {
    "overallRiskLevel": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
    "financialRisk": "Phân tích rủi ro tài chính",
    "operationalRisk": "Phân tích rủi ro vận hành", 
    "marketRisk": "Phân tích rủi ro thị trường",
    "mitigationStrategies": ["Chiến lược giảm thiểu 1", ...]
  },
  "strategicInsights": "Nhận định chiến lược và gợi ý định hướng phát triển (3-4 câu)",
  "executiveSummary": "Tóm tắt điều hành cho lãnh đạo (2-3 câu ngắn gọn)"
}`;

    const userPrompt = `Phân tích dự án đầu tư sau:

**Tên dự án:** ${projectData.params.projectName}

**Thông số đầu vào:**
- Thời gian hoạt động: ${projectData.params.operationYears} năm
- Tổng đầu tư: ${(projectData.params.fixedAssetValue + projectData.params.intangibleAssetValue).toLocaleString()} triệu đồng
- Tỷ lệ vay: ${projectData.params.debtRatio}%
- Lãi suất: ${projectData.params.nominalInterestRate}%
- Công suất thiết kế: ${projectData.params.designCapacity} SP/năm
- Giá bán: ${projectData.params.basePrice} triệu/SP
- Chi phí linh kiện: ${projectData.params.componentCost} triệu/SP
- Lạm phát: ${projectData.params.inflationRate}%
- Thuế TNDN: ${projectData.params.corporateTaxRate}%

**Các chỉ số tài chính:**
- NPV (TIPV): ${projectData.results.npvTIPV.toLocaleString()} triệu đồng
- NPV (EPV): ${projectData.results.npvEPV.toLocaleString()} triệu đồng  
- IRR (TIPV): ${(projectData.results.irrTIPV * 100).toFixed(2)}%
- IRR (EPV): ${(projectData.results.irrEPV * 100).toFixed(2)}%
- WACC: ${(projectData.results.waccAverage * 100).toFixed(2)}%
- DPP (TIPV): ${projectData.results.dppTIPV.toFixed(2)} năm
- DSCR: ${projectData.results.dscrAverage.toFixed(2)}
- ROI: ${projectData.results.roi.toFixed(2)}%
- ROE: ${projectData.results.roe.toFixed(2)}%
- ROA: ${projectData.results.roa.toFixed(2)}%
- PI (Profitability Index): ${projectData.results.pi.toFixed(2)}
- MIRR: ${projectData.results.mirr.toFixed(2)}%
- EVA: ${projectData.results.eva.toLocaleString()} triệu
- Payback Period: ${projectData.results.paybackPeriod.toFixed(2)} năm
- Net Profit Margin: ${projectData.results.netProfitMargin.toFixed(2)}%
- Interest Coverage Ratio: ${projectData.results.interestCoverageRatio.toFixed(2)}
- D/E Ratio: ${projectData.results.debtToEquity.toFixed(2)}
- Break-even Revenue: ${projectData.results.breakEvenRevenue.toLocaleString()} triệu
- Safety Margin: ${projectData.results.safetyMargin.toFixed(2)}%
- Coefficient of Variation: ${projectData.results.coefficientOfVariation.toFixed(2)}

Hãy phân tích chuyên sâu và đưa ra báo cáo chi tiết theo format JSON đã yêu cầu.`;

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
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Đã vượt quá giới hạn yêu cầu, vui lòng thử lại sau." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Cần nạp thêm credit để sử dụng tính năng AI." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Lỗi kết nối AI gateway" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Empty response from AI");
    }

    // Parse JSON from response
    let analysis;
    try {
      analysis = JSON.parse(content);
    } catch {
      // Try to extract JSON from markdown code block
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error("Could not parse AI response as JSON");
      }
    }

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("analyze-project error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
