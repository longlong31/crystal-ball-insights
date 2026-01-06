import { 
  ResponsiveContainer, 
  RadarChart as RechartsRadar, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  Legend,
  Tooltip 
} from "recharts";
import { ProjectResults } from "@/lib/projectModel";
import { cn } from "@/lib/utils";

interface RadarChartProps {
  results: ProjectResults;
  className?: string;
}

// Normalize value to 0-100 scale based on metric type
const normalizeMetric = (value: number, metric: string): number => {
  const normalizers: Record<string, (v: number) => number> = {
    // Profitability (higher is better)
    roi: (v) => Math.min(Math.max((v + 20) / 60 * 100, 0), 100), // -20% to 40%
    roe: (v) => Math.min(Math.max((v + 10) / 50 * 100, 0), 100), // -10% to 40%
    roa: (v) => Math.min(Math.max((v + 5) / 25 * 100, 0), 100), // -5% to 20%
    netProfitMargin: (v) => Math.min(Math.max((v + 10) / 40 * 100, 0), 100), // -10% to 30%
    
    // Efficiency (higher is better)
    pi: (v) => Math.min(Math.max((v - 0.5) / 1 * 100, 0), 100), // 0.5 to 1.5
    mirr: (v) => Math.min(Math.max((v * 100) / 30 * 100, 0), 100), // 0% to 30%
    capitalTurnover: (v) => Math.min(Math.max(v / 3 * 100, 0), 100), // 0 to 3
    
    // Safety (higher is better, but with some inverted for risk)
    dscr: (v) => Math.min(Math.max((v - 0.5) / 2 * 100, 0), 100), // 0.5 to 2.5
    safetyMargin: (v) => Math.min(Math.max((v + 20) / 70 * 100, 0), 100), // -20% to 50%
    
    // Time (lower is better - inverted)
    paybackPeriod: (v) => Math.min(Math.max((15 - v) / 15 * 100, 0), 100), // 0 to 15 years
    dpp: (v) => Math.min(Math.max((15 - v) / 15 * 100, 0), 100), // 0 to 15 years
    
    // Risk (lower is better - inverted)
    coefficientOfVariation: (v) => Math.min(Math.max((1.5 - v) / 1.5 * 100, 0), 100), // 0 to 1.5
    financialLeverage: (v) => Math.min(Math.max((5 - v) / 5 * 100, 0), 100), // 0 to 5
  };

  return normalizers[metric]?.(value) ?? 50;
};

export const ProjectRadarChart = ({ results, className }: RadarChartProps) => {
  const radarData = [
    { 
      metric: "ROI", 
      value: normalizeMetric(results.roi, "roi"),
      fullMark: 100,
      actual: `${results.roi.toFixed(1)}%`
    },
    { 
      metric: "ROE", 
      value: normalizeMetric(results.roe, "roe"),
      fullMark: 100,
      actual: `${results.roe.toFixed(1)}%`
    },
    { 
      metric: "PI", 
      value: normalizeMetric(results.pi, "pi"),
      fullMark: 100,
      actual: results.pi.toFixed(2)
    },
    { 
      metric: "DSCR", 
      value: normalizeMetric(results.dscrAverage, "dscr"),
      fullMark: 100,
      actual: results.dscrAverage.toFixed(2)
    },
    { 
      metric: "Safety", 
      value: normalizeMetric(results.safetyMargin, "safetyMargin"),
      fullMark: 100,
      actual: `${results.safetyMargin.toFixed(1)}%`
    },
    { 
      metric: "Payback", 
      value: normalizeMetric(results.paybackPeriod, "paybackPeriod"),
      fullMark: 100,
      actual: `${results.paybackPeriod.toFixed(1)} năm`
    },
    { 
      metric: "MIRR", 
      value: normalizeMetric(results.mirr, "mirr"),
      fullMark: 100,
      actual: `${(results.mirr * 100).toFixed(1)}%`
    },
    { 
      metric: "Risk", 
      value: normalizeMetric(results.coefficientOfVariation, "coefficientOfVariation"),
      fullMark: 100,
      actual: `CV: ${results.coefficientOfVariation.toFixed(2)}`
    },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-sm">{data.metric}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Điểm: <span className="text-primary font-medium">{data.value.toFixed(0)}/100</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Giá trị: <span className="text-foreground font-medium">{data.actual}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Calculate overall score
  const overallScore = radarData.reduce((sum, item) => sum + item.value, 0) / radarData.length;
  const scoreColor = overallScore >= 70 ? "text-green-500" : overallScore >= 40 ? "text-yellow-500" : "text-red-500";
  const scoreBg = overallScore >= 70 ? "bg-green-500/10" : overallScore >= 40 ? "bg-yellow-500/10" : "bg-red-500/10";

  return (
    <div className={cn("space-y-4", className)}>
      {/* Score Badge */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Biểu đồ radar tổng hợp các chỉ số
        </div>
        <div className={cn("px-3 py-1 rounded-full text-sm font-bold", scoreBg)}>
          <span className={scoreColor}>Điểm: {overallScore.toFixed(0)}/100</span>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsRadar cx="50%" cy="50%" outerRadius="75%" data={radarData}>
            <PolarGrid 
              stroke="hsl(var(--border))" 
              strokeOpacity={0.5}
            />
            <PolarAngleAxis 
              dataKey="metric" 
              tick={{ 
                fill: "hsl(var(--foreground))", 
                fontSize: 11,
                fontWeight: 500 
              }}
            />
            <PolarRadiusAxis 
              angle={90} 
              domain={[0, 100]} 
              tick={{ 
                fill: "hsl(var(--muted-foreground))", 
                fontSize: 9 
              }}
              tickCount={5}
            />
            <Radar
              name="Chỉ số dự án"
              dataKey="value"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.35}
              strokeWidth={2}
            />
            <Tooltip content={<CustomTooltip />} />
          </RechartsRadar>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-4 gap-2 text-xs">
        {radarData.map((item) => (
          <div 
            key={item.metric}
            className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div 
              className={cn(
                "w-2 h-2 rounded-full",
                item.value >= 70 ? "bg-green-500" : item.value >= 40 ? "bg-yellow-500" : "bg-red-500"
              )}
            />
            <div>
              <div className="font-medium">{item.metric}</div>
              <div className="text-muted-foreground">{item.actual}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
