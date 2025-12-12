import { motion } from "framer-motion";
import { SimulationCard } from "./SimulationCard";
import { ProjectResults, ProjectParams } from "@/lib/projectModel";
import { exportProjectResults, ProjectExportData } from "@/lib/excelParser";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown,
  Clock, 
  Shield,
  Percent,
  ArrowUp,
  ArrowDown,
  Download,
} from "lucide-react";
import { toast } from "sonner";

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
}

const MetricCard = ({ title, value, subtitle, icon, trend, highlighted }: MetricCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`p-4 rounded-xl border ${
      highlighted 
        ? "bg-primary/10 border-primary/30" 
        : "bg-muted/30 border-border/50"
    }`}
  >
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        {icon}
        <span className="text-sm">{title}</span>
      </div>
      {trend && (
        <div className={`text-xs ${trend === "up" ? "text-green-500" : trend === "down" ? "text-red-500" : "text-muted-foreground"}`}>
          {trend === "up" ? <ArrowUp className="w-3 h-3" /> : trend === "down" ? <ArrowDown className="w-3 h-3" /> : null}
        </div>
      )}
    </div>
    <div className={`text-2xl font-bold ${highlighted ? "text-primary" : ""}`}>
      {value}
    </div>
    {subtitle && (
      <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>
    )}
  </motion.div>
);

export const ProjectResultsDisplay = ({ results, params, loading }: ProjectResultsDisplayProps) => {
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
    return new Intl.NumberFormat("vi-VN", {
      maximumFractionDigits: decimals,
    }).format(num);
  };

  const formatPercent = (num: number) => {
    return `${(num * 100).toFixed(2)}%`;
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

  return (
    <SimulationCard>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Kết quả phân tích dự án</h3>
          </div>
          {params && (
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Xuất Excel
            </Button>
          )}
        </div>

        {/* TIPV Results */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">
            Quan điểm Tổng đầu tư (TIPV)
          </h4>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
              subtitle="Thời gian hoàn vốn"
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
          </div>
        </div>

        {/* EPV Results */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">
            Quan điểm Chủ đầu tư (EPV)
          </h4>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
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
              subtitle="Thời gian hoàn vốn"
              icon={<Clock className="w-4 h-4" />}
            />
          </div>
        </div>

        {/* Additional Info */}
        <div className="pt-4 border-t border-border">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">WACC bình quân:</span>
              <span className="ml-2 font-medium">{formatPercent(results.waccAverage)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Kết luận:</span>
              <span className={`ml-2 font-medium ${results.npvTIPV > 0 ? "text-green-500" : "text-red-500"}`}>
                {results.npvTIPV > 0 ? "Dự án khả thi" : "Dự án không khả thi"}
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
                  NPV dương cho thấy dự án tạo ra giá trị gia tăng. 
                  IRR ({formatPercent(results.irrTIPV)}) cao hơn WACC ({formatPercent(results.waccAverage)}) 
                  chứng tỏ dự án sinh lời tốt.
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
                  NPV âm cho thấy dự án không tạo ra giá trị gia tăng với chi phí vốn hiện tại.
                  Cần xem xét lại các thông số đầu vào hoặc cơ cấu vốn.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </SimulationCard>
  );
};
