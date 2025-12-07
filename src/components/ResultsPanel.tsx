import { motion } from "framer-motion";
import { SimulationCard } from "./SimulationCard";
import { MonteCarloChart } from "./MonteCarloChart";
import { StatCard } from "./StatCard";
import { TrendingUp, TrendingDown, Target, BarChart3, Percent, Calculator } from "lucide-react";

interface ResultsPanelProps {
  data: number[];
  stats: {
    mean: number;
    stdDev: number;
    min: number;
    max: number;
    percentile5: number;
    percentile25: number;
    percentile50: number;
    percentile75: number;
    percentile95: number;
  };
}

export const ResultsPanel = ({ data, stats }: ResultsPanelProps) => {
  const formatNumber = (num: number) => 
    num.toLocaleString('vi-VN', { maximumFractionDigits: 0 });

  return (
    <div className="space-y-6">
      <SimulationCard glowing={data.length > 0}>
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Phân phối kết quả</h3>
          {data.length > 0 && (
            <span className="ml-auto text-sm text-muted-foreground font-mono">
              {data.length.toLocaleString('vi-VN')} lần mô phỏng
            </span>
          )}
        </div>
        <MonteCarloChart
          data={data}
          mean={stats.mean}
          percentile5={stats.percentile5}
          percentile95={stats.percentile95}
        />
        
        {data.length > 0 && (
          <div className="mt-4 flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-destructive" />
              <span className="text-muted-foreground">5%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-primary border-dashed" />
              <span className="text-muted-foreground">Trung bình</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-success" />
              <span className="text-muted-foreground">95%</span>
            </div>
          </div>
        )}
      </SimulationCard>

      {data.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <StatCard
            label="Giá trị trung bình"
            value={formatNumber(stats.mean)}
            icon={<Target className="w-4 h-4" />}
            delay={0.1}
          />
          <StatCard
            label="Độ lệch chuẩn"
            value={formatNumber(stats.stdDev)}
            icon={<Calculator className="w-4 h-4" />}
            delay={0.2}
          />
          <StatCard
            label="Phân vị 5%"
            value={formatNumber(stats.percentile5)}
            icon={<TrendingDown className="w-4 h-4" />}
            trend="down"
            delay={0.3}
          />
          <StatCard
            label="Phân vị 95%"
            value={formatNumber(stats.percentile95)}
            icon={<TrendingUp className="w-4 h-4" />}
            trend="up"
            delay={0.4}
          />
        </motion.div>
      )}

      {data.length > 0 && (
        <SimulationCard>
          <div className="flex items-center gap-3 mb-4">
            <Percent className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Khoảng tin cậy</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-muted/30 border border-border">
              <p className="text-sm text-muted-foreground mb-1">Khoảng 50%</p>
              <p className="font-mono text-foreground">
                {formatNumber(stats.percentile25)} - {formatNumber(stats.percentile75)}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30 border border-border">
              <p className="text-sm text-muted-foreground mb-1">Khoảng 90%</p>
              <p className="font-mono text-foreground">
                {formatNumber(stats.percentile5)} - {formatNumber(stats.percentile95)}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30 border border-border">
              <p className="text-sm text-muted-foreground mb-1">Toàn bộ phạm vi</p>
              <p className="font-mono text-foreground">
                {formatNumber(stats.min)} - {formatNumber(stats.max)}
              </p>
            </div>
          </div>
        </SimulationCard>
      )}
    </div>
  );
};
