import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { motion } from "framer-motion";

interface MonteCarloChartProps {
  data: number[];
  mean: number;
  percentile5: number;
  percentile95: number;
}

export const MonteCarloChart = ({ data, mean, percentile5, percentile95 }: MonteCarloChartProps) => {
  const histogramData = useMemo(() => {
    if (data.length === 0) return [];
    
    const min = Math.min(...data);
    const max = Math.max(...data);
    const binCount = 40;
    const binWidth = (max - min) / binCount;
    
    const bins = Array(binCount).fill(0);
    data.forEach((value) => {
      const binIndex = Math.min(Math.floor((value - min) / binWidth), binCount - 1);
      bins[binIndex]++;
    });
    
    return bins.map((count, index) => ({
      value: min + (index + 0.5) * binWidth,
      frequency: count,
      percentage: (count / data.length) * 100,
    }));
  }, [data]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass rounded-lg p-3 border border-primary/30">
          <p className="text-sm text-foreground">
            Giá trị: <span className="text-primary font-mono">{payload[0].payload.value.toLocaleString('vi-VN', { maximumFractionDigits: 0 })}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Tần suất: <span className="text-foreground font-mono">{payload[0].payload.percentage.toFixed(2)}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        Chạy mô phỏng để xem kết quả
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="h-[300px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={histogramData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <defs>
            <linearGradient id="colorFrequency" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(185, 80%, 50%)" stopOpacity={0.6} />
              <stop offset="95%" stopColor="hsl(185, 80%, 50%)" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="value"
            stroke="hsl(215, 20%, 55%)"
            fontSize={12}
            tickFormatter={(value) => value.toLocaleString('vi-VN', { maximumFractionDigits: 0 })}
          />
          <YAxis
            stroke="hsl(215, 20%, 55%)"
            fontSize={12}
            tickFormatter={(value) => `${value.toFixed(1)}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            x={mean}
            stroke="hsl(185, 80%, 50%)"
            strokeWidth={2}
            strokeDasharray="5 5"
            label={{ value: "Trung bình", position: "top", fill: "hsl(185, 80%, 50%)", fontSize: 12 }}
          />
          <ReferenceLine
            x={percentile5}
            stroke="hsl(0, 72%, 51%)"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
          <ReferenceLine
            x={percentile95}
            stroke="hsl(142, 76%, 45%)"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
          <Area
            type="monotone"
            dataKey="percentage"
            stroke="hsl(185, 80%, 50%)"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorFrequency)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
};
