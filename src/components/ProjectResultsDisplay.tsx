import { motion } from "framer-motion";
import { useRef, useState } from "react";
import { SimulationCard } from "./SimulationCard";
import { ProjectResults, ProjectParams } from "@/lib/projectModel";
import { exportProjectResults, ProjectExportData } from "@/lib/excelParser";
import { exportToPDF } from "@/lib/pdfExporter";
import { CashFlowChart } from "./CashFlowChart";
import { CashFlowTable } from "./CashFlowTable";
import { ProjectRadarChart } from "./RadarChart";
import { ProjectEvaluationReport } from "./ProjectEvaluationReport";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown,
  Clock, 
  Shield,
  Percent,
  ArrowUp,
  ArrowDown,
  Download,
  BarChart3,
  Table2 as TableIcon,
  FileText,
  Loader2,
  DollarSign,
  PiggyBank,
  Target,
  AlertTriangle,
  Activity,
  Wallet,
  Scale,
  Zap,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ProjectResultsDisplayProps {
  results: ProjectResults | null;
  params?: ProjectParams;
  loading?: boolean;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  highlighted?: boolean;
  className?: string;
}

const MetricCard = ({ title, value, subtitle, icon, trend, highlighted, className }: MetricCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={cn(
      "p-4 rounded-xl border transition-all duration-300 hover:shadow-md",
      highlighted 
        ? "bg-primary/10 border-primary/30" 
        : "bg-muted/30 border-border/50 hover:border-border",
      className
    )}
  >
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        {icon}
        <span className="text-sm font-medium">{title}</span>
      </div>
      {trend && (
        <div className={cn(
          "text-xs px-2 py-0.5 rounded-full",
          trend === "up" && "text-green-500 bg-green-500/10",
          trend === "down" && "text-red-500 bg-red-500/10",
          trend === "neutral" && "text-yellow-500 bg-yellow-500/10"
        )}>
          {trend === "up" ? <ArrowUp className="w-3 h-3" /> : trend === "down" ? <ArrowDown className="w-3 h-3" /> : "~"}
        </div>
      )}
    </div>
    <div className={cn("text-2xl font-bold", highlighted && "text-primary")}>
      {value}
    </div>
    {subtitle && (
      <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>
    )}
  </motion.div>
);

interface MetricGroupProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  color?: string;
}

const MetricGroup = ({ title, icon, children, color = "primary" }: MetricGroupProps) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2">
      <div className={cn("p-2 rounded-lg", `bg-${color}/10`)}>
        {icon}
      </div>
      <h4 className="font-semibold text-sm">{title}</h4>
    </div>
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {children}
    </div>
  </div>
);

export const ProjectResultsDisplay = ({ results, params, loading }: ProjectResultsDisplayProps) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  if (loading) {
    return (
      <SimulationCard>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </SimulationCard>
    );
  }

  if (!results) {
    return (
      <SimulationCard>
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <TrendingUp className="w-12 h-12 mb-4 opacity-50" />
          <p>Nhấn "Tính toán" để xem kết quả phân tích dự án</p>
        </div>
      </SimulationCard>
    );
  }

  const formatNumber = (num: number, decimals: number = 0) => {
    if (!isFinite(num)) return "N/A";
    return new Intl.NumberFormat("vi-VN", {
      maximumFractionDigits: decimals,
    }).format(num);
  };

  const formatPercent = (num: number) => {
    if (!isFinite(num)) return "N/A";
    return `${(num * 100).toFixed(2)}%`;
  };

  const formatPercentDirect = (num: number) => {
    if (!isFinite(num)) return "N/A";
    return `${num.toFixed(2)}%`;
  };

  const handleExport = () => {
    if (!results || !params) return;

    const exportData: ProjectExportData = {
      projectName: params.projectName,
      npvTIPV: results.npvTIPV,
      irrTIPV: results.irrTIPV,
      dppTIPV: results.dppTIPV,
      dscrAverage: results.dscrAverage,
      npvEPV: results.npvEPV,
      irrEPV: results.irrEPV,
      dppEPV: results.dppEPV,
      waccAverage: results.waccAverage,
      yearlyData: results.yearlyData.map((y) => ({
        year: y.year,
        revenue: y.revenue,
        ncfTIPV: y.ncfTIPV,
        ncfEPV: y.ncfEPV,
        cumulativePV_TIPV: y.cumulativePV_TIPV,
        cumulativePV_EPV: y.cumulativePV_EPV,
        dscr: y.dscr,
      })),
    };

    exportProjectResults(exportData, `${params.projectName}-analysis.xlsx`);
    toast.success("Đã xuất file Excel thành công!");
  };

  const handleExportPDF = async () => {
    if (!results || !params) return;
    
    setExportingPDF(true);
    try {
      await exportToPDF({
        params,
        results,
        chartRef: chartRef.current,
      });
      toast.success("Đã xuất báo cáo PDF thành công!");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Có lỗi khi xuất PDF. Vui lòng thử lại.");
    } finally {
      setExportingPDF(false);
    }
  };

  // Đánh giá tổng thể dự án
  const getProjectScore = () => {
    let score = 0;
    if (results.npvTIPV > 0) score += 25;
    if (results.irrTIPV > results.waccAverage) score += 20;
    if (results.pi > 1) score += 15;
    if (results.dscrAverage > 1.2) score += 15;
    if (results.roe > 10) score += 10;
    if (results.safetyMargin > 20) score += 10;
    if (results.paybackPeriod < 5) score += 5;
    return Math.min(score, 100);
  };

  const projectScore = getProjectScore();
  const scoreColor = projectScore >= 70 ? "text-green-500" : projectScore >= 40 ? "text-yellow-500" : "text-red-500";

  return (
    <SimulationCard>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Kết quả phân tích dự án</h3>
            <div className={cn("px-3 py-1 rounded-full text-sm font-bold", scoreColor, "bg-current/10")}>
              <span className={scoreColor}>{projectScore}/100</span>
            </div>
          </div>
          {params && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Excel
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleExportPDF}
                disabled={exportingPDF}
              >
                {exportingPDF ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4 mr-2" />
                )}
                PDF
              </Button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7 lg:w-auto lg:inline-flex">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">Tổng quan</TabsTrigger>
            <TabsTrigger value="radar" className="text-xs sm:text-sm">Radar</TabsTrigger>
            <TabsTrigger value="report" className="text-xs sm:text-sm">Báo cáo</TabsTrigger>
            <TabsTrigger value="profitability" className="text-xs sm:text-sm">Sinh lời</TabsTrigger>
            <TabsTrigger value="efficiency" className="text-xs sm:text-sm">Hiệu quả</TabsTrigger>
            <TabsTrigger value="risk" className="text-xs sm:text-sm">Rủi ro</TabsTrigger>
            <TabsTrigger value="cashflow" className="text-xs sm:text-sm">Dòng tiền</TabsTrigger>
          </TabsList>

          {/* Tab: Tổng quan */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* TIPV Results */}
            <MetricGroup 
              title="Quan điểm Tổng đầu tư (TIPV)" 
              icon={<DollarSign className="w-4 h-4 text-primary" />}
            >
              <MetricCard
                title="NPV"
                value={`${formatNumber(results.npvTIPV)} tr`}
                subtitle="Giá trị hiện tại ròng"
                icon={<TrendingUp className="w-4 h-4" />}
                trend={results.npvTIPV > 0 ? "up" : "down"}
                highlighted={results.npvTIPV > 0}
              />
              <MetricCard
                title="IRR"
                value={formatPercent(results.irrTIPV)}
                subtitle="Tỷ suất sinh lời nội bộ"
                icon={<Percent className="w-4 h-4" />}
                trend={results.irrTIPV > results.waccAverage ? "up" : "down"}
              />
              <MetricCard
                title="DPP"
                value={`${results.dppTIPV.toFixed(2)} năm`}
                subtitle="Thời gian hoàn vốn (chiết khấu)"
                icon={<Clock className="w-4 h-4" />}
                trend={results.dppTIPV < 5 ? "up" : "neutral"}
              />
              <MetricCard
                title="DSCR"
                value={results.dscrAverage.toFixed(2)}
                subtitle="Hệ số bảo đảm trả nợ"
                icon={<Shield className="w-4 h-4" />}
                trend={results.dscrAverage > 1.2 ? "up" : results.dscrAverage < 1 ? "down" : "neutral"}
              />
            </MetricGroup>

            {/* EPV Results */}
            <MetricGroup 
              title="Quan điểm Chủ đầu tư (EPV)" 
              icon={<PiggyBank className="w-4 h-4 text-chart-2" />}
              color="chart-2"
            >
              <MetricCard
                title="NPV"
                value={`${formatNumber(results.npvEPV)} tr`}
                subtitle="Giá trị hiện tại ròng"
                icon={<TrendingUp className="w-4 h-4" />}
                trend={results.npvEPV > 0 ? "up" : "down"}
                highlighted={results.npvEPV > 0}
              />
              <MetricCard
                title="IRR"
                value={formatPercent(results.irrEPV)}
                subtitle="Tỷ suất sinh lời nội bộ"
                icon={<Percent className="w-4 h-4" />}
              />
              <MetricCard
                title="DPP"
                value={`${results.dppEPV.toFixed(2)} năm`}
                subtitle="Thời gian hoàn vốn (chiết khấu)"
                icon={<Clock className="w-4 h-4" />}
              />
            </MetricGroup>

            {/* Key Metrics */}
            <MetricGroup 
              title="Chỉ số quan trọng" 
              icon={<Zap className="w-4 h-4 text-chart-3" />}
              color="chart-3"
            >
              <MetricCard
                title="PI"
                value={results.pi.toFixed(2)}
                subtitle="Chỉ số sinh lời"
                icon={<Target className="w-4 h-4" />}
                trend={results.pi > 1 ? "up" : "down"}
                highlighted={results.pi > 1}
              />
              <MetricCard
                title="MIRR"
                value={formatPercent(results.mirr)}
                subtitle="IRR điều chỉnh"
                icon={<Activity className="w-4 h-4" />}
              />
              <MetricCard
                title="WACC"
                value={formatPercent(results.waccAverage)}
                subtitle="Chi phí vốn bình quân"
                icon={<Scale className="w-4 h-4" />}
              />
              <MetricCard
                title="Payback"
                value={`${results.paybackPeriod.toFixed(2)} năm`}
                subtitle="Thời gian hoàn vốn"
                icon={<Clock className="w-4 h-4" />}
                trend={results.paybackPeriod < 5 ? "up" : "neutral"}
              />
            </MetricGroup>
          </TabsContent>

          {/* Tab: Radar Chart */}
          <TabsContent value="radar" className="mt-6">
            <div className="p-4 rounded-xl border border-border bg-muted/20">
              <ProjectRadarChart results={results} />
            </div>
          </TabsContent>

          {/* Tab: Báo cáo đánh giá */}
          <TabsContent value="report" className="mt-6">
            {params && <ProjectEvaluationReport results={results} params={params} />}
          </TabsContent>

          {/* Tab: Sinh lời */}
          <TabsContent value="profitability" className="space-y-6 mt-6">
            <MetricGroup 
              title="Tỷ suất sinh lời" 
              icon={<TrendingUp className="w-4 h-4 text-green-500" />}
              color="green"
            >
              <MetricCard
                title="ROI"
                value={formatPercentDirect(results.roi)}
                subtitle="Return on Investment"
                icon={<TrendingUp className="w-4 h-4" />}
                trend={results.roi > 0 ? "up" : "down"}
                highlighted={results.roi > 15}
              />
              <MetricCard
                title="ROE"
                value={formatPercentDirect(results.roe)}
                subtitle="Return on Equity"
                icon={<PiggyBank className="w-4 h-4" />}
                trend={results.roe > 10 ? "up" : results.roe > 0 ? "neutral" : "down"}
              />
              <MetricCard
                title="ROA"
                value={formatPercentDirect(results.roa)}
                subtitle="Return on Assets"
                icon={<Wallet className="w-4 h-4" />}
                trend={results.roa > 5 ? "up" : "neutral"}
              />
            </MetricGroup>

            <MetricGroup 
              title="Biên lợi nhuận" 
              icon={<Percent className="w-4 h-4 text-chart-2" />}
              color="chart-2"
            >
              <MetricCard
                title="Gross Margin"
                value={formatPercentDirect(results.grossProfitMargin)}
                subtitle="Biên lợi nhuận gộp"
                icon={<BarChart3 className="w-4 h-4" />}
                trend={results.grossProfitMargin > 20 ? "up" : "neutral"}
              />
              <MetricCard
                title="Net Margin"
                value={formatPercentDirect(results.netProfitMargin)}
                subtitle="Biên lợi nhuận ròng"
                icon={<BarChart3 className="w-4 h-4" />}
                trend={results.netProfitMargin > 10 ? "up" : "neutral"}
              />
              <MetricCard
                title="Avg Margin"
                value={formatPercentDirect(results.averageProfitMargin)}
                subtitle="Biên LN bình quân"
                icon={<Activity className="w-4 h-4" />}
              />
            </MetricGroup>

            <MetricGroup 
              title="Điểm hòa vốn" 
              icon={<Target className="w-4 h-4 text-chart-4" />}
              color="chart-4"
            >
              <MetricCard
                title="BEP (Sản lượng)"
                value={formatNumber(results.breakEvenPoint)}
                subtitle="Điểm hòa vốn"
                icon={<Target className="w-4 h-4" />}
              />
              <MetricCard
                title="BEP (Năm)"
                value={`${results.breakEvenYear.toFixed(2)} năm`}
                subtitle="Năm hòa vốn"
                icon={<Clock className="w-4 h-4" />}
                trend={results.breakEvenYear < 5 ? "up" : "neutral"}
              />
              <MetricCard
                title="BEP (Doanh thu)"
                value={`${formatNumber(results.breakEvenRevenue)} tr`}
                subtitle="Doanh thu hòa vốn"
                icon={<DollarSign className="w-4 h-4" />}
              />
            </MetricGroup>
          </TabsContent>

          {/* Tab: Hiệu quả vốn */}
          <TabsContent value="efficiency" className="space-y-6 mt-6">
            <MetricGroup 
              title="Hiệu quả sử dụng vốn" 
              icon={<Activity className="w-4 h-4 text-chart-3" />}
              color="chart-3"
            >
              <MetricCard
                title="PI"
                value={results.pi.toFixed(3)}
                subtitle="Profitability Index"
                icon={<Target className="w-4 h-4" />}
                trend={results.pi > 1 ? "up" : "down"}
                highlighted={results.pi > 1.2}
              />
              <MetricCard
                title="MIRR"
                value={formatPercent(results.mirr)}
                subtitle="Modified IRR"
                icon={<Percent className="w-4 h-4" />}
                trend={results.mirr > results.waccAverage ? "up" : "down"}
              />
              <MetricCard
                title="EVA"
                value={`${formatNumber(results.eva)} tr`}
                subtitle="Economic Value Added"
                icon={<Zap className="w-4 h-4" />}
                trend={results.eva > 0 ? "up" : "down"}
                highlighted={results.eva > 0}
              />
            </MetricGroup>

            <MetricGroup 
              title="Vòng quay vốn" 
              icon={<Scale className="w-4 h-4 text-primary" />}
            >
              <MetricCard
                title="Capital Turnover"
                value={results.capitalTurnover.toFixed(2)}
                subtitle="Vòng quay vốn"
                icon={<Activity className="w-4 h-4" />}
                trend={results.capitalTurnover > 1 ? "up" : "neutral"}
              />
              <MetricCard
                title="Asset Turnover"
                value={results.assetTurnover.toFixed(2)}
                subtitle="Vòng quay tài sản"
                icon={<Wallet className="w-4 h-4" />}
              />
            </MetricGroup>

            <MetricGroup 
              title="Cấu trúc tài chính" 
              icon={<Shield className="w-4 h-4 text-chart-5" />}
              color="chart-5"
            >
              <MetricCard
                title="D/E Ratio"
                value={results.debtToEquity.toFixed(2)}
                subtitle="Nợ / Vốn chủ sở hữu"
                icon={<Scale className="w-4 h-4" />}
                trend={results.debtToEquity < 2 ? "up" : "down"}
              />
              <MetricCard
                title="ICR"
                value={results.interestCoverageRatio.toFixed(2)}
                subtitle="Khả năng trả lãi"
                icon={<Shield className="w-4 h-4" />}
                trend={results.interestCoverageRatio > 3 ? "up" : "neutral"}
              />
              <MetricCard
                title="DSCR"
                value={results.debtServiceCoverageRatio.toFixed(2)}
                subtitle="Khả năng trả nợ"
                icon={<Shield className="w-4 h-4" />}
                trend={results.debtServiceCoverageRatio > 1.2 ? "up" : results.debtServiceCoverageRatio < 1 ? "down" : "neutral"}
              />
            </MetricGroup>
          </TabsContent>

          {/* Tab: Rủi ro */}
          <TabsContent value="risk" className="space-y-6 mt-6">
            <MetricGroup 
              title="Chỉ số rủi ro" 
              icon={<AlertTriangle className="w-4 h-4 text-red-500" />}
              color="destructive"
            >
              <MetricCard
                title="CV"
                value={results.coefficientOfVariation.toFixed(3)}
                subtitle="Hệ số biến thiên"
                icon={<Activity className="w-4 h-4" />}
                trend={results.coefficientOfVariation < 0.5 ? "up" : "down"}
              />
              <MetricCard
                title="Sensitivity Index"
                value={results.sensitivityIndex.toFixed(3)}
                subtitle="Chỉ số độ nhạy"
                icon={<Zap className="w-4 h-4" />}
              />
              <MetricCard
                title="Safety Margin"
                value={formatPercentDirect(results.safetyMargin)}
                subtitle="Biên an toàn"
                icon={<Shield className="w-4 h-4" />}
                trend={results.safetyMargin > 20 ? "up" : results.safetyMargin > 0 ? "neutral" : "down"}
                highlighted={results.safetyMargin > 30}
              />
            </MetricGroup>

            <MetricGroup 
              title="Đòn bẩy" 
              icon={<Scale className="w-4 h-4 text-chart-4" />}
              color="chart-4"
            >
              <MetricCard
                title="Financial Leverage"
                value={results.financialLeverage.toFixed(2)}
                subtitle="Đòn bẩy tài chính"
                icon={<TrendingUp className="w-4 h-4" />}
                trend={results.financialLeverage < 3 ? "up" : "down"}
              />
              <MetricCard
                title="Operating Leverage"
                value={formatPercentDirect(results.operatingLeverage * 100)}
                subtitle="Đòn bẩy hoạt động"
                icon={<Activity className="w-4 h-4" />}
              />
            </MetricGroup>

            <MetricGroup 
              title="Biến động dòng tiền" 
              icon={<Activity className="w-4 h-4 text-chart-3" />}
              color="chart-3"
            >
              <MetricCard
                title="CF Volatility"
                value={formatNumber(results.cashFlowVolatility)}
                subtitle="Độ biến động"
                icon={<Activity className="w-4 h-4" />}
              />
              <MetricCard
                title="Peak Deficit"
                value={`${formatNumber(results.peakCashDeficit)} tr`}
                subtitle="Thâm hụt cao nhất"
                icon={<TrendingDown className="w-4 h-4" />}
              />
            </MetricGroup>
          </TabsContent>

          {/* Tab: Dòng tiền */}
          <TabsContent value="cashflow" className="space-y-6 mt-6">
            <MetricGroup 
              title="Thống kê dòng tiền" 
              icon={<Wallet className="w-4 h-4 text-primary" />}
            >
              <MetricCard
                title="Total Inflow"
                value={`${formatNumber(results.totalCashInflow)} tr`}
                subtitle="Tổng dòng tiền vào"
                icon={<ArrowUp className="w-4 h-4 text-green-500" />}
              />
              <MetricCard
                title="Total Outflow"
                value={`${formatNumber(results.totalCashOutflow)} tr`}
                subtitle="Tổng dòng tiền ra"
                icon={<ArrowDown className="w-4 h-4 text-red-500" />}
              />
              <MetricCard
                title="Net Cash Flow"
                value={`${formatNumber(results.totalCashInflow - results.totalCashOutflow)} tr`}
                subtitle="Dòng tiền thuần"
                icon={<DollarSign className="w-4 h-4" />}
                trend={results.totalCashInflow > results.totalCashOutflow ? "up" : "down"}
                highlighted
              />
            </MetricGroup>

            {/* Cash Flow Chart */}
            <div className="pt-4 border-t border-border">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-medium">Biểu đồ dòng tiền theo năm</h4>
              </div>
              <div ref={chartRef}>
                <CashFlowChart yearlyData={results.yearlyData} />
              </div>
            </div>

            {/* Cash Flow Table */}
            <div className="pt-4 border-t border-border">
              <div className="flex items-center gap-2 mb-4">
                <TableIcon className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-medium">Bảng chi tiết dòng tiền theo năm</h4>
              </div>
              <CashFlowTable yearlyData={results.yearlyData} />
            </div>
          </TabsContent>
        </Tabs>

        {/* Additional Info */}
        <div className="pt-4 border-t border-border">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">WACC:</span>
              <span className="ml-2 font-medium">{formatPercent(results.waccAverage)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">PI:</span>
              <span className="ml-2 font-medium">{results.pi.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">ROE:</span>
              <span className="ml-2 font-medium">{formatPercentDirect(results.roe)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Kết luận:</span>
              <span className={cn("ml-2 font-medium", results.npvTIPV > 0 ? "text-green-500" : "text-red-500")}>
                {results.npvTIPV > 0 ? "Khả thi" : "Không khả thi"}
              </span>
            </div>
          </div>
        </div>

        {/* Evaluation Summary */}
        {results.npvTIPV > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 rounded-lg bg-green-500/10 border border-green-500/20"
          >
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-500">Dự án có hiệu quả tài chính tốt</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  NPV dương ({formatNumber(results.npvTIPV)} triệu), PI = {results.pi.toFixed(2)} &gt; 1, 
                  IRR ({formatPercent(results.irrTIPV)}) &gt; WACC ({formatPercent(results.waccAverage)}). 
                  ROE đạt {formatPercentDirect(results.roe)}, biên an toàn {formatPercentDirect(results.safetyMargin)}.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {results.npvTIPV <= 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 rounded-lg bg-red-500/10 border border-red-500/20"
          >
            <div className="flex items-start gap-3">
              <TrendingDown className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-500">Dự án chưa đạt hiệu quả tài chính</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  NPV âm ({formatNumber(results.npvTIPV)} triệu), PI = {results.pi.toFixed(2)} &lt; 1.
                  Cần xem xét lại thông số đầu vào hoặc cơ cấu vốn.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </SimulationCard>
  );
};
