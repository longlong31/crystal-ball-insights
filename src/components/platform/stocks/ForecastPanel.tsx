import { useMemo, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, ReferenceLine, Line, LineChart, Legend } from "recharts";
import { Sparkles, TrendingUp, TrendingDown, Activity } from "lucide-react";

interface ForecastPanelProps {
  closes: number[];
  returns: number[];
  currentPrice: number;
  symbol: string;
  formatPrice: (v: number) => string;
}

const HORIZONS: { id: string; label: string; days: number }[] = [
  { id: "1w", label: "1 Week", days: 5 },
  { id: "1m", label: "1 Month", days: 21 },
  { id: "3m", label: "3 Months", days: 63 },
  { id: "6m", label: "6 Months", days: 126 },
  { id: "1y", label: "1 Year", days: 252 },
];

const SIMS = 600;

function mean(arr: number[]) { return arr.reduce((a, b) => a + b, 0) / Math.max(1, arr.length); }
function std(arr: number[]) {
  const m = mean(arr);
  return Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / Math.max(1, arr.length - 1));
}
function quantile(sorted: number[], q: number) {
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor(q * (sorted.length - 1))));
  return sorted[idx];
}

// Box-Muller transform
function randn() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

export function ForecastPanel({ closes, returns, currentPrice, symbol, formatPrice }: ForecastPanelProps) {
  const [horizon, setHorizon] = useState("3m");

  const sim = useMemo(() => {
    if (returns.length < 20 || currentPrice <= 0) return null;
    const mu = mean(returns);
    const sigma = std(returns);
    const days = HORIZONS.find((h) => h.id === horizon)!.days;

    // Path simulations (store full trajectory of medians + bands)
    const paths: number[][] = [];
    for (let s = 0; s < SIMS; s++) {
      const path = new Array(days);
      let p = currentPrice;
      for (let d = 0; d < days; d++) {
        // GBM step on log-returns
        const r = mu + sigma * randn();
        p = p * (1 + r);
        path[d] = p;
      }
      paths.push(path);
    }

    // Per-day quantile bands
    const band = new Array(days);
    for (let d = 0; d < days; d++) {
      const col = paths.map((p) => p[d]).sort((a, b) => a - b);
      band[d] = {
        t: d + 1,
        bear: quantile(col, 0.1),
        base: quantile(col, 0.5),
        bull: quantile(col, 0.9),
        p25: quantile(col, 0.25),
        p75: quantile(col, 0.75),
      };
    }

    // Final-day stats
    const finals = paths.map((p) => p[p.length - 1]).sort((a, b) => a - b);
    const bullPrice = quantile(finals, 0.9);
    const basePrice = quantile(finals, 0.5);
    const bearPrice = quantile(finals, 0.1);

    const bullProb = (finals.filter((f) => f > currentPrice * 1.1).length / finals.length) * 100;
    const flatProb = (finals.filter((f) => f >= currentPrice * 0.9 && f <= currentPrice * 1.1).length / finals.length) * 100;
    const bearProb = (finals.filter((f) => f < currentPrice * 0.9).length / finals.length) * 100;

    // Chart data: include t=0 anchor
    const chart = [{ t: 0, bear: currentPrice, base: currentPrice, bull: currentPrice, p25: currentPrice, p75: currentPrice }, ...band];

    return {
      chart,
      bullPrice,
      basePrice,
      bearPrice,
      bullProb,
      flatProb,
      bearProb,
      mu,
      sigma,
      days,
    };
  }, [returns, currentPrice, horizon]);

  return (
    <div className="space-y-3">
      <div className="quant-card">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 rounded-sm bg-primary" />
            <p className="text-xs font-semibold tracking-wide uppercase text-foreground/80">
              AI Forecast · Monte Carlo GBM · {symbol}
            </p>
            <span className="text-[10px] text-muted-foreground font-mono">
              {SIMS} paths
            </span>
          </div>
          <div className="flex gap-1">
            {HORIZONS.map((h) => (
              <button
                key={h.id}
                onClick={() => setHorizon(h.id)}
                className={`px-2.5 py-1 text-[11px] rounded font-mono transition-all ${
                  horizon === h.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                }`}
              >
                {h.label}
              </button>
            ))}
          </div>
        </div>

        {sim ? (
          <>
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div className="p-3 rounded-md border border-green-500/30 bg-green-500/5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-green-400/80 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> Bull Case
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">{sim.bullProb.toFixed(0)}%</span>
                </div>
                <p className="mt-1 font-mono text-base font-semibold tabular-nums text-green-400">
                  {formatPrice(sim.bullPrice)}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {((sim.bullPrice / currentPrice - 1) * 100).toFixed(1)}% vs hiện tại
                </p>
              </div>
              <div className="p-3 rounded-md border border-primary/30 bg-primary/5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-primary/80 flex items-center gap-1">
                    <Activity className="w-3 h-3" /> Base Case
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">{sim.flatProb.toFixed(0)}%</span>
                </div>
                <p className="mt-1 font-mono text-base font-semibold tabular-nums text-primary">
                  {formatPrice(sim.basePrice)}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {((sim.basePrice / currentPrice - 1) * 100).toFixed(1)}% vs hiện tại
                </p>
              </div>
              <div className="p-3 rounded-md border border-red-500/30 bg-red-500/5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-red-400/80 flex items-center gap-1">
                    <TrendingDown className="w-3 h-3" /> Bear Case
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">{sim.bearProb.toFixed(0)}%</span>
                </div>
                <p className="mt-1 font-mono text-base font-semibold tabular-nums text-red-400">
                  {formatPrice(sim.bearPrice)}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {((sim.bearPrice / currentPrice - 1) * 100).toFixed(1)}% vs hiện tại
                </p>
              </div>
            </div>

            <div className="mt-3">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={sim.chart}>
                  <defs>
                    <linearGradient id="bullGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(142, 76%, 45%)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="hsl(142, 76%, 45%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="iqrGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="t" tick={{ fontSize: 10 }} label={{ value: "Trading days", position: "insideBottom", offset: -2, fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => formatPrice(v)} width={80} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(222, 40%, 7%)", border: "1px solid hsl(222, 20%, 14%)", borderRadius: 6, fontSize: 11 }}
                    formatter={(v: any) => formatPrice(Number(v))}
                  />
                  <ReferenceLine y={currentPrice} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" label={{ value: "Now", fontSize: 10, fill: "hsl(var(--muted-foreground))", position: "right" }} />
                  <Area type="monotone" dataKey="bull" stroke="hsl(142, 76%, 45%)" fill="url(#bullGrad)" strokeWidth={1} name="P90 (Bull)" />
                  <Area type="monotone" dataKey="p75" stroke="hsl(var(--primary))" fill="url(#iqrGrad)" strokeWidth={1} name="P75" />
                  <Area type="monotone" dataKey="p25" stroke="hsl(var(--primary))" fill="hsl(var(--background))" strokeWidth={1} name="P25" />
                  <Area type="monotone" dataKey="bear" stroke="hsl(0, 72%, 55%)" fill="hsl(var(--background))" strokeWidth={1} name="P10 (Bear)" />
                  <Line type="monotone" dataKey="base" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-3 p-3 rounded-md bg-muted/15 border border-border/15 text-xs text-muted-foreground leading-relaxed">
              <span className="text-foreground font-medium">Model:</span>{" "}
              Mô phỏng Monte Carlo {SIMS} đường giá theo Geometric Brownian Motion với μ = {(sim.mu * 252 * 100).toFixed(2)}%/năm,
              σ = {(sim.sigma * Math.sqrt(252) * 100).toFixed(2)}%/năm (ước lượng từ {returns.length} phiên gần nhất).
              Vùng tô màu là khoảng IQR (P25–P75), đường liền là P50.
              Kịch bản chỉ mang tính tham khảo, không phải khuyến nghị đầu tư.
            </div>
          </>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-10">Cần ít nhất 20 phiên để mô phỏng.</p>
        )}
      </div>
    </div>
  );
}
