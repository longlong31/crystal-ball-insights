import { motion, AnimatePresence } from "framer-motion";
import { ProjectResults, ProjectParams } from "@/lib/projectModel";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  Target,
  Shield,
  Zap,
  ArrowRight,
  Info,
  ChevronDown,
  ChevronUp,
  Download,
  Sparkles,
  Brain,
  FileText,
  Loader2,
  AlertCircle,
  BarChart3,
  TrendingDown as RiskIcon,
  Star,
  Award,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { exportToPDF } from "@/lib/pdfExporter";

interface ProjectEvaluationReportProps {
  results: ProjectResults;
  params: ProjectParams;
}

interface Recommendation {
  id: string;
  category: "profitability" | "efficiency" | "risk" | "structure";
  severity: "critical" | "warning" | "info" | "success";
  title: string;
  description: string;
  suggestion: string;
  impact: string;
  metric?: string;
  currentValue?: string;
  targetValue?: string;
}

interface EvaluationSection {
  title: string;
  score: number;
  maxScore: number;
  status: "excellent" | "good" | "warning" | "critical";
  items: { label: string; passed: boolean; detail: string }[];
}

interface AIAnalysis {
  overallAssessment: string;
  score: number;
  feasibility: "VERY_FEASIBLE" | "FEASIBLE" | "MARGINAL" | "NOT_FEASIBLE";
  strengths: string[];
  weaknesses: string[];
  aiRecommendations: {
    priority: "HIGH" | "MEDIUM" | "LOW";
    area: string;
    issue: string;
    solution: string;
    expectedImpact: string;
    implementationSteps: string[];
  }[];
  riskAnalysis: {
    overallRiskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    financialRisk: string;
    operationalRisk: string;
    marketRisk: string;
    mitigationStrategies: string[];
  };
  strategicInsights: string;
  executiveSummary: string;
}

const getCategoryIcon = (category: Recommendation["category"]) => {
  switch (category) {
    case "profitability": return <TrendingUp className="w-4 h-4" />;
    case "efficiency": return <Zap className="w-4 h-4" />;
    case "risk": return <Shield className="w-4 h-4" />;
    case "structure": return <Target className="w-4 h-4" />;
  }
};

const getCategoryLabel = (category: Recommendation["category"]) => {
  switch (category) {
    case "profitability": return "Sinh lời";
    case "efficiency": return "Hiệu quả";
    case "risk": return "Rủi ro";
    case "structure": return "Cấu trúc";
  }
};

const getSeverityStyles = (severity: Recommendation["severity"]) => {
  switch (severity) {
    case "critical": return { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-500", icon: AlertTriangle };
    case "warning": return { bg: "bg-yellow-500/10", border: "border-yellow-500/30", text: "text-yellow-500", icon: AlertTriangle };
    case "info": return { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-500", icon: Info };
    case "success": return { bg: "bg-green-500/10", border: "border-green-500/30", text: "text-green-500", icon: CheckCircle2 };
  }
};

const getFeasibilityConfig = (feasibility: AIAnalysis["feasibility"]) => {
  switch (feasibility) {
    case "VERY_FEASIBLE": return { label: "Rất khả thi", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/30" };
    case "FEASIBLE": return { label: "Khả thi", color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/30" };
    case "MARGINAL": return { label: "Cần cân nhắc", color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/30" };
    case "NOT_FEASIBLE": return { label: "Không khả thi", color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/30" };
  }
};

const getRiskLevelConfig = (level: AIAnalysis["riskAnalysis"]["overallRiskLevel"]) => {
  switch (level) {
    case "LOW": return { label: "Thấp", color: "text-green-500", icon: Shield };
    case "MEDIUM": return { label: "Trung bình", color: "text-yellow-500", icon: AlertCircle };
    case "HIGH": return { label: "Cao", color: "text-orange-500", icon: AlertTriangle };
    case "CRITICAL": return { label: "Nghiêm trọng", color: "text-red-500", icon: RiskIcon };
  }
};

const getPriorityConfig = (priority: "HIGH" | "MEDIUM" | "LOW") => {
  switch (priority) {
    case "HIGH": return { label: "Ưu tiên cao", color: "text-red-500", bg: "bg-red-500/10" };
    case "MEDIUM": return { label: "Ưu tiên vừa", color: "text-yellow-500", bg: "bg-yellow-500/10" };
    case "LOW": return { label: "Ưu tiên thấp", color: "text-blue-500", bg: "bg-blue-500/10" };
  }
};

const generateRecommendations = (results: ProjectResults, params: ProjectParams): Recommendation[] => {
  const recommendations: Recommendation[] = [];
  const totalInvestment = params.fixedAssetValue + params.intangibleAssetValue;
  const projectLife = params.operationYears + 1;
  
  if (results.npvTIPV <= 0) {
    recommendations.push({
      id: "npv-negative",
      category: "profitability",
      severity: "critical",
      title: "NPV âm - Dự án không khả thi về tài chính",
      description: `NPV = ${results.npvTIPV.toLocaleString("vi-VN")} triệu đồng, cho thấy dự án không tạo ra giá trị gia tăng.`,
      suggestion: "Tăng doanh thu bằng cách mở rộng công suất hoặc tối ưu giá bán; giảm chi phí đầu tư ban đầu; đàm phán lãi suất vay thấp hơn.",
      impact: "Có thể chuyển NPV từ âm sang dương, cải thiện tính khả thi của dự án.",
      metric: "NPV",
      currentValue: `${results.npvTIPV.toLocaleString("vi-VN")} tr`,
      targetValue: "> 0 tr"
    });
  } else if (results.npvTIPV > 0 && results.npvTIPV < totalInvestment * 0.1) {
    recommendations.push({
      id: "npv-low",
      category: "profitability",
      severity: "warning",
      title: "NPV dương nhưng thấp so với quy mô đầu tư",
      description: `NPV chỉ bằng ${((results.npvTIPV / totalInvestment) * 100).toFixed(1)}% tổng đầu tư.`,
      suggestion: "Xem xét tối ưu hóa chi phí vận hành hoặc tìm kiếm nguồn doanh thu bổ sung.",
      impact: "Tăng biên lợi nhuận và giá trị dự án.",
      metric: "NPV/Investment",
      currentValue: `${((results.npvTIPV / totalInvestment) * 100).toFixed(1)}%`,
      targetValue: "> 15%"
    });
  }

  if (results.irrTIPV < results.waccAverage) {
    recommendations.push({
      id: "irr-below-wacc",
      category: "profitability",
      severity: "critical",
      title: "IRR thấp hơn WACC",
      description: `IRR (${(results.irrTIPV * 100).toFixed(2)}%) < WACC (${(results.waccAverage * 100).toFixed(2)}%), dự án không bù đắp được chi phí vốn.`,
      suggestion: "Tái cấu trúc nguồn vốn với tỷ lệ vốn chủ sở hữu cao hơn; cải thiện doanh thu hoặc giảm chi phí để tăng IRR.",
      impact: "Đưa IRR vượt WACC để đảm bảo dự án sinh lời.",
      metric: "IRR vs WACC",
      currentValue: `${(results.irrTIPV * 100).toFixed(2)}%`,
      targetValue: `> ${(results.waccAverage * 100).toFixed(2)}%`
    });
  }

  if (results.dscrAverage < 1) {
    recommendations.push({
      id: "dscr-critical",
      category: "risk",
      severity: "critical",
      title: "DSCR < 1 - Không đủ khả năng trả nợ",
      description: `DSCR trung bình = ${results.dscrAverage.toFixed(2)}, dự án không tạo đủ dòng tiền để trả nợ.`,
      suggestion: "Giảm quy mô vay; kéo dài thời gian vay để giảm áp lực trả nợ hàng năm; tăng vốn chủ sở hữu.",
      impact: "Đảm bảo khả năng trả nợ và tránh rủi ro phá sản.",
      metric: "DSCR",
      currentValue: results.dscrAverage.toFixed(2),
      targetValue: "> 1.2"
    });
  } else if (results.dscrAverage >= 1 && results.dscrAverage < 1.2) {
    recommendations.push({
      id: "dscr-low",
      category: "risk",
      severity: "warning",
      title: "DSCR gần ngưỡng an toàn",
      description: `DSCR = ${results.dscrAverage.toFixed(2)}, chưa đạt mức an toàn theo tiêu chuẩn ngân hàng (≥1.2).`,
      suggestion: "Tạo quỹ dự phòng; cân nhắc tái cấu trúc khoản vay.",
      impact: "Tăng khả năng được ngân hàng chấp thuận và giảm rủi ro.",
      metric: "DSCR",
      currentValue: results.dscrAverage.toFixed(2),
      targetValue: "> 1.2"
    });
  }

  if (results.paybackPeriod > projectLife * 0.7) {
    recommendations.push({
      id: "payback-long",
      category: "efficiency",
      severity: "warning",
      title: "Thời gian hoàn vốn dài",
      description: `Hoàn vốn sau ${results.paybackPeriod.toFixed(1)} năm (${((results.paybackPeriod / projectLife) * 100).toFixed(0)}% vòng đời dự án).`,
      suggestion: "Tăng doanh thu giai đoạn đầu; giảm chi phí đầu tư ban đầu; phân kỳ đầu tư.",
      impact: "Rút ngắn thời gian hoàn vốn, giảm rủi ro dài hạn.",
      metric: "Payback",
      currentValue: `${results.paybackPeriod.toFixed(1)} năm`,
      targetValue: `< ${(projectLife * 0.5).toFixed(1)} năm`
    });
  }

  if (results.roe < 10) {
    recommendations.push({
      id: "roe-low",
      category: "profitability",
      severity: "warning",
      title: "ROE thấp",
      description: `ROE = ${results.roe.toFixed(2)}%, chưa hấp dẫn so với các kênh đầu tư khác.`,
      suggestion: "Sử dụng đòn bẩy tài chính hợp lý; tối ưu hóa lợi nhuận ròng.",
      impact: "Tăng sức hấp dẫn cho nhà đầu tư vốn chủ sở hữu.",
      metric: "ROE",
      currentValue: `${results.roe.toFixed(2)}%`,
      targetValue: "> 15%"
    });
  }

  if (results.pi < 1) {
    recommendations.push({
      id: "pi-below-1",
      category: "efficiency",
      severity: "critical",
      title: "PI < 1 - Đầu tư không hiệu quả",
      description: `PI = ${results.pi.toFixed(2)}, mỗi đồng đầu tư tạo ra ít hơn 1 đồng giá trị.`,
      suggestion: "Cắt giảm chi phí đầu tư không cần thiết; tập trung vào các hạng mục có hiệu quả cao nhất.",
      impact: "Đưa PI > 1 để dự án tạo giá trị.",
      metric: "PI",
      currentValue: results.pi.toFixed(2),
      targetValue: "> 1.0"
    });
  }

  if (results.safetyMargin < 15) {
    recommendations.push({
      id: "safety-low",
      category: "risk",
      severity: "warning",
      title: "Biên an toàn thấp",
      description: `Biên an toàn chỉ ${results.safetyMargin.toFixed(1)}%, dự án nhạy cảm với biến động.`,
      suggestion: "Đa dạng hóa nguồn thu; ký hợp đồng dài hạn với khách hàng; hedge giá nguyên liệu.",
      impact: "Tăng khả năng chống chịu với biến động thị trường.",
      metric: "Safety Margin",
      currentValue: `${results.safetyMargin.toFixed(1)}%`,
      targetValue: "> 25%"
    });
  }

  if (results.debtToEquity > 3) {
    recommendations.push({
      id: "de-high",
      category: "structure",
      severity: "warning",
      title: "Tỷ lệ Nợ/Vốn CSH cao",
      description: `D/E = ${results.debtToEquity.toFixed(2)}, rủi ro tài chính cao.`,
      suggestion: "Tăng vốn chủ sở hữu; giảm quy mô vay; tái cấu trúc nguồn vốn.",
      impact: "Giảm rủi ro tài chính và chi phí vốn.",
      metric: "D/E Ratio",
      currentValue: results.debtToEquity.toFixed(2),
      targetValue: "< 2.0"
    });
  }

  if (results.coefficientOfVariation > 0.8) {
    recommendations.push({
      id: "cv-high",
      category: "risk",
      severity: "warning",
      title: "Biến động dòng tiền cao",
      description: `Hệ số biến thiên = ${results.coefficientOfVariation.toFixed(2)}, dòng tiền không ổn định.`,
      suggestion: "Ổn định doanh thu bằng hợp đồng dài hạn; đa dạng hóa sản phẩm/dịch vụ.",
      impact: "Giảm biến động và tăng tính dự báo được.",
      metric: "CV",
      currentValue: results.coefficientOfVariation.toFixed(2),
      targetValue: "< 0.5"
    });
  }

  if (results.npvTIPV > 0 && results.irrTIPV > results.waccAverage * 1.5 && results.dscrAverage > 1.5) {
    recommendations.push({
      id: "strong-fundamentals",
      category: "profitability",
      severity: "success",
      title: "Dự án có nền tảng tài chính mạnh",
      description: `NPV dương, IRR cao hơn WACC đáng kể, DSCR an toàn.`,
      suggestion: "Cân nhắc mở rộng quy mô hoặc tìm kiếm cơ hội tương tự.",
      impact: "Tối đa hóa lợi nhuận từ dự án thành công.",
    });
  }

  if (results.safetyMargin > 30) {
    recommendations.push({
      id: "high-safety",
      category: "risk",
      severity: "success",
      title: "Biên an toàn cao",
      description: `Biên an toàn ${results.safetyMargin.toFixed(1)}%, dự án có khả năng chống chịu tốt.`,
      suggestion: "Duy trì và theo dõi định kỳ.",
      impact: "Ổn định hoạt động trong điều kiện bất lợi.",
    });
  }

  return recommendations;
};

const generateEvaluationSections = (results: ProjectResults): EvaluationSection[] => {
  const sections: EvaluationSection[] = [
    {
      title: "Khả thi tài chính",
      score: 0,
      maxScore: 25,
      status: "warning",
      items: [
        { label: "NPV > 0", passed: results.npvTIPV > 0, detail: `NPV = ${results.npvTIPV.toLocaleString("vi-VN")} tr` },
        { label: "IRR > WACC", passed: results.irrTIPV > results.waccAverage, detail: `IRR = ${(results.irrTIPV * 100).toFixed(2)}%` },
        { label: "PI > 1", passed: results.pi > 1, detail: `PI = ${results.pi.toFixed(2)}` },
        { label: "Payback hợp lý", passed: results.paybackPeriod < 7, detail: `${results.paybackPeriod.toFixed(1)} năm` },
      ]
    },
    {
      title: "Khả năng trả nợ",
      score: 0,
      maxScore: 25,
      status: "warning",
      items: [
        { label: "DSCR > 1.2", passed: results.dscrAverage > 1.2, detail: `DSCR = ${results.dscrAverage.toFixed(2)}` },
        { label: "ICR > 3", passed: results.interestCoverageRatio > 3, detail: `ICR = ${results.interestCoverageRatio.toFixed(2)}` },
        { label: "D/E < 3", passed: results.debtToEquity < 3, detail: `D/E = ${results.debtToEquity.toFixed(2)}` },
      ]
    },
    {
      title: "Hiệu quả sinh lời",
      score: 0,
      maxScore: 25,
      status: "warning",
      items: [
        { label: "ROE > 10%", passed: results.roe > 10, detail: `ROE = ${results.roe.toFixed(2)}%` },
        { label: "ROI > 15%", passed: results.roi > 15, detail: `ROI = ${results.roi.toFixed(2)}%` },
        { label: "Net Margin > 10%", passed: results.netProfitMargin > 10, detail: `Net Margin = ${results.netProfitMargin.toFixed(2)}%` },
      ]
    },
    {
      title: "Quản lý rủi ro",
      score: 0,
      maxScore: 25,
      status: "warning",
      items: [
        { label: "Biên an toàn > 20%", passed: results.safetyMargin > 20, detail: `Safety = ${results.safetyMargin.toFixed(1)}%` },
        { label: "CV < 0.5", passed: results.coefficientOfVariation < 0.5, detail: `CV = ${results.coefficientOfVariation.toFixed(2)}` },
        { label: "Đòn bẩy < 3", passed: results.financialLeverage < 3, detail: `Leverage = ${results.financialLeverage.toFixed(2)}` },
      ]
    }
  ];

  sections.forEach(section => {
    const passedItems = section.items.filter(item => item.passed).length;
    section.score = Math.round((passedItems / section.items.length) * section.maxScore);
    
    const percentage = section.score / section.maxScore;
    if (percentage >= 0.8) section.status = "excellent";
    else if (percentage >= 0.6) section.status = "good";
    else if (percentage >= 0.4) section.status = "warning";
    else section.status = "critical";
  });

  return sections;
};

export const ProjectEvaluationReport = ({ results, params }: ProjectEvaluationReportProps) => {
  const [expandedRecs, setExpandedRecs] = useState<Set<string>>(new Set());
  const [expandedAIRecs, setExpandedAIRecs] = useState<Set<number>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAIAnalysis] = useState<AIAnalysis | null>(null);
  const [showAISection, setShowAISection] = useState(false);

  const recommendations = generateRecommendations(results, params);
  const sections = generateEvaluationSections(results);
  
  const totalScore = sections.reduce((sum, s) => sum + s.score, 0);
  const maxScore = sections.reduce((sum, s) => sum + s.maxScore, 0);
  const overallPercentage = (totalScore / maxScore) * 100;

  const toggleRec = (id: string) => {
    setExpandedRecs(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAIRec = (idx: number) => {
    setExpandedAIRecs(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await exportToPDF({ params, results });
      toast.success("Đã xuất báo cáo PDF thành công!");
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("Lỗi khi xuất PDF. Vui lòng thử lại.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleAIAnalysis = async () => {
    setIsAnalyzing(true);
    setShowAISection(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-project", {
        body: {
          projectData: {
            params: {
              projectName: params.projectName,
              operationYears: params.operationYears,
              fixedAssetValue: params.fixedAssetValue,
              intangibleAssetValue: params.intangibleAssetValue,
              debtRatio: params.debtRatio,
              nominalInterestRate: params.nominalInterestRate,
              loanTerm: params.loanTerm,
              designCapacity: params.designCapacity,
              basePrice: params.basePrice,
              componentCost: params.componentCost,
              adminCost: params.adminCost,
              inflationRate: params.inflationRate,
              corporateTaxRate: params.corporateTaxRate,
            },
            results: {
              npvTIPV: results.npvTIPV,
              npvEPV: results.npvEPV,
              irrTIPV: results.irrTIPV,
              irrEPV: results.irrEPV,
              dppTIPV: results.dppTIPV,
              dppEPV: results.dppEPV,
              dscrAverage: results.dscrAverage,
              waccAverage: results.waccAverage,
              roi: results.roi,
              roe: results.roe,
              roa: results.roa,
              pi: results.pi,
              mirr: results.mirr,
              eva: results.eva,
              paybackPeriod: results.paybackPeriod,
              netProfitMargin: results.netProfitMargin,
              grossProfitMargin: results.grossProfitMargin,
              assetTurnover: results.assetTurnover,
              capitalEfficiency: 0,
              interestCoverageRatio: results.interestCoverageRatio,
              debtToEquity: results.debtToEquity,
              financialLeverage: results.financialLeverage,
              breakEvenRevenue: results.breakEvenRevenue,
              breakEvenUnits: 0,
              safetyMargin: results.safetyMargin,
              operatingLeverage: results.operatingLeverage,
              coefficientOfVariation: results.coefficientOfVariation,
            },
          },
        },
      });

      if (error) throw error;
      setAIAnalysis(data.analysis);
      toast.success("Phân tích AI hoàn thành!");
    } catch (error: any) {
      console.error("AI analysis error:", error);
      if (error.message?.includes("429")) {
        toast.error("Đã vượt quá giới hạn yêu cầu, vui lòng thử lại sau.");
      } else if (error.message?.includes("402")) {
        toast.error("Cần nạp thêm credit để sử dụng tính năng AI.");
      } else {
        toast.error("Lỗi khi phân tích. Vui lòng thử lại.");
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const criticalCount = recommendations.filter(r => r.severity === "critical").length;
  const warningCount = recommendations.filter(r => r.severity === "warning").length;
  const successCount = recommendations.filter(r => r.severity === "success").length;

  const getStatusColor = (status: EvaluationSection["status"]) => {
    switch (status) {
      case "excellent": return "text-emerald-500 bg-emerald-500";
      case "good": return "text-blue-500 bg-blue-500";
      case "warning": return "text-amber-500 bg-amber-500";
      case "critical": return "text-red-500 bg-red-500";
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button 
          onClick={handleExportPDF} 
          disabled={isExporting}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25"
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          Xuất báo cáo PDF
        </Button>
        <Button 
          onClick={handleAIAnalysis} 
          disabled={isAnalyzing}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/25"
        >
          {isAnalyzing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Brain className="w-4 h-4 mr-2" />
          )}
          Phân tích AI chuyên sâu
        </Button>
      </div>

      {/* Overall Score Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden p-6 rounded-2xl border border-border bg-gradient-to-br from-background via-muted/30 to-background"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl" />
        
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <div className="p-2 rounded-xl bg-primary/10">
                <Award className="w-5 h-5 text-primary" />
              </div>
              Đánh giá tổng thể dự án
            </h3>
            <div className="flex items-center gap-2">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
                className={cn(
                  "text-3xl font-bold",
                  overallPercentage >= 70 ? "text-emerald-500" : overallPercentage >= 40 ? "text-amber-500" : "text-red-500"
                )}
              >
                {totalScore}
              </motion.div>
              <span className="text-muted-foreground">/ {maxScore}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-4 bg-muted/50 rounded-full overflow-hidden mb-6 shadow-inner">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${overallPercentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={cn(
                "h-full rounded-full relative overflow-hidden",
                overallPercentage >= 70 
                  ? "bg-gradient-to-r from-emerald-500 to-green-400" 
                  : overallPercentage >= 40 
                  ? "bg-gradient-to-r from-amber-500 to-yellow-400" 
                  : "bg-gradient-to-r from-red-500 to-orange-400"
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </motion.div>
          </div>

          {/* Section Scores Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {sections.map((section, idx) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="p-4 rounded-xl bg-background/80 border border-border/50 backdrop-blur-sm hover:border-primary/30 transition-all hover:shadow-md"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-muted-foreground">{section.title}</span>
                  <span className={cn("text-sm font-bold", getStatusColor(section.status).split(" ")[0])}>
                    {section.score}/{section.maxScore}
                  </span>
                </div>
                <div className="h-2 bg-muted/50 rounded-full overflow-hidden mb-3">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(section.score / section.maxScore) * 100}%` }}
                    transition={{ duration: 0.6, delay: idx * 0.1 }}
                    className={cn("h-full rounded-full transition-all", getStatusColor(section.status).split(" ")[1])}
                  />
                </div>
                <div className="space-y-1.5">
                  {section.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      {item.passed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      )}
                      <span className={cn(
                        "truncate",
                        item.passed ? "text-muted-foreground" : "text-foreground font-medium"
                      )}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="p-5 rounded-xl border border-red-500/20 bg-gradient-to-br from-red-500/5 to-red-500/10 hover:shadow-lg hover:shadow-red-500/10 transition-all"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-red-500/10">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <span className="text-sm text-red-400 font-medium">Nghiêm trọng</span>
          </div>
          <div className="text-3xl font-bold text-red-500">{criticalCount}</div>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="p-5 rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-amber-500/10 hover:shadow-lg hover:shadow-amber-500/10 transition-all"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <AlertCircle className="w-5 h-5 text-amber-500" />
            </div>
            <span className="text-sm text-amber-400 font-medium">Cảnh báo</span>
          </div>
          <div className="text-3xl font-bold text-amber-500">{warningCount}</div>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="p-5 rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 hover:shadow-lg hover:shadow-emerald-500/10 transition-all"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <span className="text-sm text-emerald-400 font-medium">Tốt</span>
          </div>
          <div className="text-3xl font-bold text-emerald-500">{successCount}</div>
        </motion.div>
      </div>

      {/* AI Analysis Section */}
      <AnimatePresence>
        {showAISection && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-6 rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/5 via-background to-pink-500/5">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-lg font-semibold flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                    <Brain className="w-5 h-5 text-purple-500" />
                  </div>
                  Phân tích AI chuyên sâu
                  <Sparkles className="w-4 h-4 text-purple-400" />
                </h4>
                {aiAnalysis && (
                  <Button variant="ghost" size="sm" onClick={handleAIAnalysis} disabled={isAnalyzing}>
                    <RefreshCw className={cn("w-4 h-4 mr-1", isAnalyzing && "animate-spin")} />
                    Phân tích lại
                  </Button>
                )}
              </div>

              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin" />
                    <Brain className="w-6 h-6 text-purple-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <p className="mt-4 text-muted-foreground">Đang phân tích dự án với AI...</p>
                </div>
              ) : aiAnalysis ? (
                <div className="space-y-6">
                  {/* Executive Summary & Score */}
                  <div className="grid md:grid-cols-[1fr_200px] gap-4">
                    <div className="p-4 rounded-xl bg-background/50 border border-border/50">
                      <h5 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Tóm tắt điều hành
                      </h5>
                      <p className="text-sm leading-relaxed">{aiAnalysis.executiveSummary}</p>
                    </div>
                    <div className={cn(
                      "p-4 rounded-xl border flex flex-col items-center justify-center",
                      getFeasibilityConfig(aiAnalysis.feasibility).bg,
                      getFeasibilityConfig(aiAnalysis.feasibility).border
                    )}>
                      <div className={cn("text-4xl font-bold mb-1", getFeasibilityConfig(aiAnalysis.feasibility).color)}>
                        {aiAnalysis.score}
                      </div>
                      <div className={cn("text-sm font-medium", getFeasibilityConfig(aiAnalysis.feasibility).color)}>
                        {getFeasibilityConfig(aiAnalysis.feasibility).label}
                      </div>
                    </div>
                  </div>

                  {/* Overall Assessment */}
                  <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                    <p className="text-sm leading-relaxed">{aiAnalysis.overallAssessment}</p>
                  </div>

                  {/* Strengths & Weaknesses */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                      <h5 className="text-sm font-semibold text-emerald-500 mb-3 flex items-center gap-2">
                        <Star className="w-4 h-4" />
                        Điểm mạnh
                      </h5>
                      <ul className="space-y-2">
                        {aiAnalysis.strengths.map((s, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                      <h5 className="text-sm font-semibold text-red-500 mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Điểm yếu
                      </h5>
                      <ul className="space-y-2">
                        {aiAnalysis.weaknesses.map((w, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                            <span>{w}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Risk Analysis */}
                  <div className="p-4 rounded-xl bg-background/50 border border-border/50">
                    <div className="flex items-center justify-between mb-4">
                      <h5 className="text-sm font-semibold flex items-center gap-2">
                        <Shield className="w-4 h-4 text-primary" />
                        Phân tích rủi ro
                      </h5>
                      <div className={cn("flex items-center gap-1 text-sm font-medium", getRiskLevelConfig(aiAnalysis.riskAnalysis.overallRiskLevel).color)}>
                        {(() => {
                          const Icon = getRiskLevelConfig(aiAnalysis.riskAnalysis.overallRiskLevel).icon;
                          return <Icon className="w-4 h-4" />;
                        })()}
                        {getRiskLevelConfig(aiAnalysis.riskAnalysis.overallRiskLevel).label}
                      </div>
                    </div>
                    <div className="grid md:grid-cols-3 gap-3 mb-4">
                      <div className="p-3 rounded-lg bg-muted/30">
                        <div className="text-xs text-muted-foreground mb-1">Rủi ro tài chính</div>
                        <p className="text-xs">{aiAnalysis.riskAnalysis.financialRisk}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/30">
                        <div className="text-xs text-muted-foreground mb-1">Rủi ro vận hành</div>
                        <p className="text-xs">{aiAnalysis.riskAnalysis.operationalRisk}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/30">
                        <div className="text-xs text-muted-foreground mb-1">Rủi ro thị trường</div>
                        <p className="text-xs">{aiAnalysis.riskAnalysis.marketRisk}</p>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">Chiến lược giảm thiểu:</div>
                    <ul className="space-y-1">
                      {aiAnalysis.riskAnalysis.mitigationStrategies.map((s, i) => (
                        <li key={i} className="text-xs flex items-start gap-2">
                          <ArrowRight className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* AI Recommendations */}
                  <div>
                    <h5 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-amber-500" />
                      Gợi ý cải thiện từ AI ({aiAnalysis.aiRecommendations.length})
                    </h5>
                    <div className="space-y-2">
                      {aiAnalysis.aiRecommendations.map((rec, idx) => {
                        const priorityConfig = getPriorityConfig(rec.priority);
                        const isExpanded = expandedAIRecs.has(idx);
                        
                        return (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="rounded-xl border border-border/50 overflow-hidden bg-background/50"
                          >
                            <button
                              onClick={() => toggleAIRec(idx)}
                              className="w-full p-4 flex items-start gap-3 text-left hover:bg-muted/20 transition-colors"
                            >
                              <div className={cn("p-1.5 rounded-lg shrink-0", priorityConfig.bg)}>
                                <Zap className={cn("w-4 h-4", priorityConfig.color)} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", priorityConfig.bg, priorityConfig.color)}>
                                    {priorityConfig.label}
                                  </span>
                                  <span className="text-xs text-muted-foreground">{rec.area}</span>
                                </div>
                                <h6 className="font-medium text-sm">{rec.issue}</h6>
                              </div>
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                              )}
                            </button>
                            
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="border-t border-border/50"
                                >
                                  <div className="p-4 space-y-4">
                                    <div>
                                      <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                        <ArrowRight className="w-3 h-3" />
                                        Giải pháp
                                      </div>
                                      <p className="text-sm bg-primary/5 p-3 rounded-lg">{rec.solution}</p>
                                    </div>
                                    <div>
                                      <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                        <Zap className="w-3 h-3" />
                                        Tác động dự kiến
                                      </div>
                                      <p className="text-sm text-foreground/80">{rec.expectedImpact}</p>
                                    </div>
                                    {rec.implementationSteps?.length > 0 && (
                                      <div>
                                        <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                                          <BarChart3 className="w-3 h-3" />
                                          Các bước thực hiện
                                        </div>
                                        <ol className="space-y-1.5">
                                          {rec.implementationSteps.map((step, i) => (
                                            <li key={i} className="text-xs flex items-start gap-2">
                                              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-[10px] font-medium">
                                                {i + 1}
                                              </span>
                                              <span className="pt-0.5">{step}</span>
                                            </li>
                                          ))}
                                        </ol>
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Strategic Insights */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-primary/5 to-purple-500/5 border border-primary/20">
                    <h5 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <Target className="w-4 h-4 text-primary" />
                      Nhận định chiến lược
                    </h5>
                    <p className="text-sm leading-relaxed text-foreground/90">{aiAnalysis.strategicInsights}</p>
                  </div>
                </div>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual Recommendations */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-primary" />
          Đề xuất cải thiện tự động ({recommendations.length})
        </h4>
        
        <div className="space-y-2">
          {recommendations.map((rec, idx) => {
            const styles = getSeverityStyles(rec.severity);
            const Icon = styles.icon;
            const isExpanded = expandedRecs.has(rec.id);
            
            return (
              <motion.div
                key={rec.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={cn(
                  "rounded-xl border overflow-hidden transition-all hover:shadow-md",
                  styles.bg,
                  styles.border
                )}
              >
                <button
                  onClick={() => toggleRec(rec.id)}
                  className="w-full p-4 flex items-start gap-3 text-left hover:bg-muted/20 transition-colors"
                >
                  <Icon className={cn("w-5 h-5 mt-0.5 shrink-0", styles.text)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn("text-xs px-2 py-0.5 rounded-full", styles.bg, styles.text, "font-medium")}>
                        {getCategoryLabel(rec.category)}
                      </span>
                      {rec.metric && (
                        <span className="text-xs text-muted-foreground">
                          {rec.metric}: {rec.currentValue} → {rec.targetValue}
                        </span>
                      )}
                    </div>
                    <h5 className="font-medium text-sm">{rec.title}</h5>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{rec.description}</p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                </button>
                
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-4 pb-4 pt-0 border-t border-border/50"
                    >
                      <div className="pt-3 space-y-3">
                        <div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                            <ArrowRight className="w-3 h-3" />
                            Đề xuất giải pháp
                          </div>
                          <p className="text-sm bg-background/50 p-3 rounded-lg">{rec.suggestion}</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                            <Zap className="w-3 h-3" />
                            Tác động dự kiến
                          </div>
                          <p className="text-sm text-foreground/80">{rec.impact}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
