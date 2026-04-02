import { motion } from "framer-motion";
import { Brain, RefreshCw, TrendingUp, Newspaper, Users, Activity, Globe, Loader2, AlertTriangle } from "lucide-react";
import { useVNSentiment } from "@/hooks/useVNSentiment";
import { cn } from "@/lib/utils";

const GAUGE_COLORS = [
  { min: 0, max: 20, color: "hsl(0, 72%, 50%)", label: "Extreme Fear" },
  { min: 20, max: 40, color: "hsl(25, 85%, 55%)", label: "Fear" },
  { min: 40, max: 60, color: "hsl(45, 90%, 55%)", label: "Neutral" },
  { min: 60, max: 80, color: "hsl(100, 65%, 50%)", label: "Greed" },
  { min: 80, max: 100, color: "hsl(142, 76%, 45%)", label: "Extreme Greed" },
];

function getScoreColor(score: number) {
  return GAUGE_COLORS.find(c => score >= c.min && score <= c.max)?.color || "hsl(45, 90%, 55%)";
}

const DIMENSION_META: Record<string, { label: string; icon: any }> = {
  market_momentum: { label: "Động lượng", icon: TrendingUp },
  news_sentiment: { label: "Tin tức", icon: Newspaper },
  investor_confidence: { label: "Nhà đầu tư", icon: Users },
  volatility_risk: { label: "Biến động", icon: Activity },
  global_impact: { label: "Quốc tế", icon: Globe },
};

export function FearGreedGauge() {
  const { data, loading, error, refetch } = useVNSentiment();

  if (loading && !data) {
    return (
      <div className="quant-card flex items-center justify-center h-[280px]">
        <div className="text-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Đang phân tích sentiment...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="quant-card flex items-center justify-center h-[280px]">
        <div className="text-center">
          <AlertTriangle className="w-6 h-6 text-destructive mx-auto mb-2" />
          <p className="text-xs text-muted-foreground mb-2">Lỗi phân tích</p>
          <button onClick={refetch} className="text-xs text-primary hover:underline">Thử lại</button>
        </div>
      </div>
    );
  }

  const score = data?.score ?? 50;
  const color = getScoreColor(score);
  const rotation = (score / 100) * 180 - 90; // -90 to 90 degrees

  return (
    <div className="quant-card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          <p className="stat-label">VN Fear & Greed Index</p>
          <span className="text-[10px] text-primary font-mono">AI</span>
        </div>
        <button
          onClick={refetch}
          disabled={loading}
          className="p-1 rounded hover:bg-muted/50 transition-colors"
        >
          <RefreshCw className={cn("w-3.5 h-3.5 text-muted-foreground", loading && "animate-spin")} />
        </button>
      </div>

      {/* Gauge */}
      <div className="flex flex-col items-center">
        <div className="relative w-[180px] h-[100px] overflow-hidden">
          {/* Background arc segments */}
          <svg viewBox="0 0 200 110" className="w-full h-full">
            {GAUGE_COLORS.map((segment, i) => {
              const startAngle = (segment.min / 100) * 180 - 180;
              const endAngle = (segment.max / 100) * 180 - 180;
              const startRad = (startAngle * Math.PI) / 180;
              const endRad = (endAngle * Math.PI) / 180;
              const r = 80;
              const cx = 100, cy = 100;
              const x1 = cx + r * Math.cos(startRad);
              const y1 = cy + r * Math.sin(startRad);
              const x2 = cx + r * Math.cos(endRad);
              const y2 = cy + r * Math.sin(endRad);
              const largeArc = endAngle - startAngle > 180 ? 1 : 0;
              return (
                <path
                  key={i}
                  d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`}
                  stroke={segment.color}
                  strokeWidth="12"
                  fill="none"
                  opacity={0.25}
                  strokeLinecap="round"
                />
              );
            })}
            {/* Needle */}
            <motion.g
              initial={{ rotate: -90 }}
              animate={{ rotate: rotation }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              style={{ transformOrigin: "100px 100px" }}
            >
              <line x1="100" y1="100" x2="100" y2="30" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="100" cy="100" r="5" fill={color} />
            </motion.g>
          </svg>
        </div>

        {/* Score */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center -mt-2"
        >
          <span className="text-3xl font-bold font-mono" style={{ color }}>{score}</span>
          <p className="text-xs font-medium mt-0.5" style={{ color }}>{data?.label}</p>
        </motion.div>
      </div>

      {/* Summary */}
      {data?.summary && (
        <p className="text-[11px] text-muted-foreground text-center mt-2 px-2 leading-relaxed">
          {data.summary}
        </p>
      )}

      {/* Dimensions */}
      {data?.dimensions && (
        <div className="mt-3 space-y-1.5">
          {Object.entries(data.dimensions).map(([key, value]) => {
            const meta = DIMENSION_META[key];
            if (!meta) return null;
            const dimColor = getScoreColor(value);
            return (
              <div key={key} className="flex items-center gap-2 text-xs">
                <meta.icon className="w-3 h-3 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground w-16 truncate">{meta.label}</span>
                <div className="flex-1 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    transition={{ duration: 1, delay: 0.3 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: dimColor }}
                  />
                </div>
                <span className="font-mono w-6 text-right" style={{ color: dimColor }}>{value}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Key factors */}
      {data?.key_factors && data.key_factors.length > 0 && (
        <div className="mt-3 pt-2 border-t border-border/30">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Yếu tố chính</p>
          <div className="flex flex-wrap gap-1">
            {data.key_factors.slice(0, 3).map((f, i) => (
              <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-muted/30 text-muted-foreground">
                {f}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
