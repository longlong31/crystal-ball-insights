import { motion } from "framer-motion";
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
} from "lucide-react";
import { useState } from "react";

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

const generateRecommendations = (results: ProjectResults, params: ProjectParams): Recommendation[] => {
  const recommendations: Recommendation[] = [];

  // NPV Analysis
  const totalInvestment = params.fixedAssetValue + params.intangibleAssetValue;
  const projectLife = params.operationYears + 1; // Include liquidation year
  
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

  // IRR Analysis
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
  } else if (results.irrTIPV > results.waccAverage && results.irrTIPV < results.waccAverage * 1.5) {
    recommendations.push({
      id: "irr-marginal",
      category: "profitability",
      severity: "info",
      title: "IRR cao hơn WACC nhưng biên độ an toàn thấp",
      description: `IRR chỉ cao hơn WACC ${((results.irrTIPV - results.waccAverage) * 100).toFixed(2)}%.`,
      suggestion: "Duy trì biên độ an toàn bằng cách kiểm soát chi phí chặt chẽ.",
      impact: "Đảm bảo dự án vẫn sinh lời trong các kịch bản bất lợi.",
      metric: "Spread",
      currentValue: `${((results.irrTIPV - results.waccAverage) * 100).toFixed(2)}%`,
      targetValue: "> 5%"
    });
  }

  // DSCR Analysis
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

  // Payback Period
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

  // ROE Analysis
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

  // PI Analysis
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

  // Safety Margin
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

  // Debt to Equity
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

  // CV (Coefficient of Variation)
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

  // Success indicators
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

  // Calculate scores
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

  const criticalCount = recommendations.filter(r => r.severity === "critical").length;
  const warningCount = recommendations.filter(r => r.severity === "warning").length;
  const successCount = recommendations.filter(r => r.severity === "success").length;

  const getStatusColor = (status: EvaluationSection["status"]) => {
    switch (status) {
      case "excellent": return "text-green-500 bg-green-500";
      case "good": return "text-blue-500 bg-blue-500";
      case "warning": return "text-yellow-500 bg-yellow-500";
      case "critical": return "text-red-500 bg-red-500";
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-2xl border border-border bg-gradient-to-br from-muted/50 to-background"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Đánh giá tổng thể dự án
          </h3>
          <div className={cn(
            "text-2xl font-bold",
            overallPercentage >= 70 ? "text-green-500" : overallPercentage >= 40 ? "text-yellow-500" : "text-red-500"
          )}>
            {totalScore}/{maxScore}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-3 bg-muted rounded-full overflow-hidden mb-4">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${overallPercentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={cn(
              "h-full rounded-full",
              overallPercentage >= 70 ? "bg-green-500" : overallPercentage >= 40 ? "bg-yellow-500" : "bg-red-500"
            )}
          />
        </div>

        {/* Section Scores */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {sections.map((section, idx) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="p-3 rounded-xl bg-background border border-border"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">{section.title}</span>
                <span className={cn("text-sm font-bold", getStatusColor(section.status).split(" ")[0])}>
                  {section.score}/{section.maxScore}
                </span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className={cn("h-full rounded-full transition-all", getStatusColor(section.status).split(" ")[1])}
                  style={{ width: `${(section.score / section.maxScore) * 100}%` }}
                />
              </div>
              <div className="mt-2 space-y-1">
                {section.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-1 text-xs">
                    {item.passed ? (
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-3 h-3 text-red-500" />
                    )}
                    <span className={item.passed ? "text-muted-foreground" : "text-foreground"}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-500 font-medium">Nghiêm trọng</span>
          </div>
          <div className="text-2xl font-bold text-red-500">{criticalCount}</div>
        </div>
        <div className="p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            <span className="text-sm text-yellow-500 font-medium">Cảnh báo</span>
          </div>
          <div className="text-2xl font-bold text-yellow-500">{warningCount}</div>
        </div>
        <div className="p-4 rounded-xl border border-green-500/30 bg-green-500/10">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-sm text-green-500 font-medium">Tốt</span>
          </div>
          <div className="text-2xl font-bold text-green-500">{successCount}</div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-primary" />
          Đề xuất cải thiện ({recommendations.length})
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
                  "rounded-xl border overflow-hidden transition-all",
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
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
