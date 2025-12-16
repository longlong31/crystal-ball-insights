import { YearlyData } from "@/lib/projectModel";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface CashFlowChartProps {
  yearlyData: YearlyData[];
}

export const CashFlowChart = ({ yearlyData }: CashFlowChartProps) => {
  const chartData = yearlyData.map((d) => ({
    year: `Năm ${d.year}`,
    ncfTIPV: d.ncfTIPV,
    ncfEPV: d.ncfEPV,
    cumulativeTIPV: d.cumulativePV_TIPV,
    cumulativeEPV: d.cumulativePV_EPV,
  }));

  const formatNumber = (value: number) => {
    if (Math.abs(value) >= 1000) {
      return `${(value / 1000).toFixed(1)}B`;
    }
    return `${value.toFixed(0)}tr`;
  };

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
          <XAxis 
            dataKey="year" 
            tick={{ fontSize: 12 }}
            className="fill-muted-foreground"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickFormatter={formatNumber}
            className="fill-muted-foreground"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            labelStyle={{ color: "hsl(var(--foreground))" }}
            formatter={(value: number, name: string) => {
              const labels: Record<string, string> = {
                ncfTIPV: "NCF TIPV",
                ncfEPV: "NCF EPV",
                cumulativeTIPV: "Lũy kế TIPV",
                cumulativeEPV: "Lũy kế EPV",
              };
              return [`${formatNumber(value)} triệu`, labels[name] || name];
            }}
          />
          <Legend 
            formatter={(value) => {
              const labels: Record<string, string> = {
                ncfTIPV: "NCF TIPV",
                ncfEPV: "NCF EPV",
                cumulativeTIPV: "Lũy kế PV TIPV",
                cumulativeEPV: "Lũy kế PV EPV",
              };
              return labels[value] || value;
            }}
          />
          <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
          <Bar 
            dataKey="ncfTIPV" 
            fill="hsl(var(--primary))" 
            opacity={0.8}
            radius={[4, 4, 0, 0]}
          />
          <Bar 
            dataKey="ncfEPV" 
            fill="hsl(var(--chart-2))" 
            opacity={0.8}
            radius={[4, 4, 0, 0]}
          />
          <Line
            type="monotone"
            dataKey="cumulativeTIPV"
            stroke="hsl(var(--chart-3))"
            strokeWidth={2}
            dot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="cumulativeEPV"
            stroke="hsl(var(--chart-4))"
            strokeWidth={2}
            dot={{ r: 4 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
