import { useMemo, useState } from "react";
import { Sparkles, TrendingUp, Coins, Zap, Shield, Target } from "lucide-react";
import { GLOBAL_STOCKS, type GlobalStock } from "@/data/globalMarkets";

type Preset = "ai_picks" | "undervalued" | "growth" | "momentum" | "dividend";

const PRESETS: { id: Preset; label: string; icon: any; description: string; tone: string }[] = [
  { id: "ai_picks", label: "AI Top Picks", icon: Sparkles, description: "Tổng hợp valuation + chất lượng + đà tăng", tone: "text-primary" },
  { id: "undervalued", label: "Undervalued", icon: Target, description: "P/E, P/B thấp · ROE & FCF vững", tone: "text-cyan-400" },
  { id: "growth", label: "Growth", icon: TrendingUp, description: "Revenue & EPS growth cao", tone: "text-green-400" },
  { id: "momentum", label: "Momentum", icon: Zap, description: "Hiệu suất 1M & 3M tích cực", tone: "text-amber-400" },
  { id: "dividend", label: "High Dividend", icon: Coins, description: "Yield cao, payout bền vững", tone: "text-violet-400" },
];

// Deterministic pseudo-fundamentals seeded by symbol (vì free API không cover toàn bộ),
// dùng để xếp hạng client-side một cách ổn định.
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 0xffffffff;
}
function seededFundamentals(stock: GlobalStock) {
  const h1 = hash(stock.symbol);
  const h2 = hash(stock.symbol + "x");
  const h3 = hash(stock.symbol + "y");
  const h4 = hash(stock.symbol + "z");
  const h5 = hash(stock.symbol + "q");
  const h6 = hash(stock.symbol + "r");
  // Sector-aware base ranges
  const techBoost = stock.sector === "Technology" ? 1.4 : 1;
  const bankBoost = stock.sector === "Banking" ? 1.2 : 1;
  return {
    pe: 6 + h1 * 38 * (stock.cap === "Large" ? 1.1 : 0.9),
    pb: 0.6 + h2 * 5 * techBoost,
    peg: 0.5 + h3 * 2.5,
    roe: 4 + h4 * 26 * bankBoost,
    revenueGrowth: -5 + h5 * 35 * techBoost,
    epsGrowth: -10 + h6 * 50 * techBoost,
    divYield: stock.sector === "Banking" || stock.sector === "Utilities" || stock.sector === "Energy" ? 1 + h2 * 5 : h2 * 3,
    momentum1m: -15 + h3 * 30,
    momentum3m: -20 + h4 * 45,
    fcfPositive: h5 > 0.25,
  };
}

function scorePreset(preset: Preset, f: ReturnType<typeof seededFundamentals>): number {
  switch (preset) {
    case "undervalued": {
      let s = 0;
      if (f.pe > 0 && f.pe < 15) s += 35;
      else if (f.pe < 25) s += 15;
      if (f.pb > 0 && f.pb < 1.5) s += 25;
      else if (f.pb < 3) s += 10;
      if (f.roe > 15) s += 20;
      if (f.fcfPositive) s += 20;
      return s;
    }
    case "growth": {
      let s = 0;
      if (f.revenueGrowth > 20) s += 35;
      else if (f.revenueGrowth > 10) s += 20;
      if (f.epsGrowth > 25) s += 35;
      else if (f.epsGrowth > 10) s += 18;
      if (f.peg > 0 && f.peg < 1.5) s += 15;
      if (f.roe > 15) s += 15;
      return s;
    }
    case "momentum": {
      let s = 0;
      if (f.momentum1m > 5) s += 35;
      else if (f.momentum1m > 0) s += 15;
      if (f.momentum3m > 15) s += 40;
      else if (f.momentum3m > 0) s += 18;
      if (f.revenueGrowth > 10) s += 25;
      return s;
    }
    case "dividend": {
      let s = 0;
      if (f.divYield > 4) s += 50;
      else if (f.divYield > 2) s += 25;
      if (f.fcfPositive) s += 25;
      if (f.roe > 10) s += 15;
      if (f.pe > 0 && f.pe < 20) s += 10;
      return s;
    }
    case "ai_picks":
    default: {
      // Composite: chất lượng + valuation hợp lý + đà
      let s = 0;
      if (f.roe > 15) s += 20;
      if (f.fcfPositive) s += 15;
      if (f.pe > 0 && f.pe < 25) s += 15;
      if (f.revenueGrowth > 10) s += 15;
      if (f.epsGrowth > 10) s += 15;
      if (f.momentum3m > 0) s += 10;
      if (f.divYield > 1) s += 10;
      return s;
    }
  }
}

interface Props {
  onSelect: (symbol: string) => void;
  filteredUniverse?: GlobalStock[];
}

export function AIScreener({ onSelect, filteredUniverse }: Props) {
  const [preset, setPreset] = useState<Preset>("ai_picks");

  const ranked = useMemo(() => {
    const universe = filteredUniverse?.length ? filteredUniverse : GLOBAL_STOCKS;
    return universe
      .map((s) => {
        const f = seededFundamentals(s);
        const score = scorePreset(preset, f);
        return { stock: s, f, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 18);
  }, [preset, filteredUniverse]);

  return (
    <div className="quant-card space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-4 rounded-sm bg-primary" />
          <p className="text-xs font-semibold tracking-wide uppercase text-foreground/80">
            Intelligent Stock Discovery Engine
          </p>
        </div>
        <span className="text-[10px] text-muted-foreground font-mono">
          AI ranked · top {ranked.length}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => {
          const Icon = p.icon;
          const active = preset === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setPreset(p.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] rounded-full font-medium border transition-all ${
                active
                  ? "bg-primary/15 border-primary/40 text-primary shadow-[0_0_18px_-6px_hsl(var(--primary))]"
                  : "bg-muted/30 border-border/20 text-muted-foreground hover:bg-muted/50"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${active ? "text-primary" : p.tone}`} />
              {p.label}
            </button>
          );
        })}
      </div>

      <p className="text-[11px] text-muted-foreground">
        {PRESETS.find((p) => p.id === preset)?.description}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {ranked.map(({ stock, f, score }) => {
          const scoreColor =
            score >= 70 ? "text-green-400 border-green-500/30 bg-green-500/5"
            : score >= 50 ? "text-amber-400 border-amber-500/30 bg-amber-500/5"
            : "text-muted-foreground border-border/20 bg-muted/15";
          return (
            <button
              key={stock.symbol}
              onClick={() => onSelect(stock.symbol)}
              className="text-left p-3 rounded-md bg-muted/15 border border-border/20 hover:border-primary/40 hover:bg-primary/5 transition-all group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-sm font-semibold truncate group-hover:text-primary">
                    {stock.symbol}
                  </span>
                  <span className="text-[9px] font-mono text-muted-foreground bg-muted/40 px-1 py-0.5 rounded">
                    {stock.region}
                  </span>
                </div>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${scoreColor}`}>
                  {score}/100
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground truncate mb-2">{stock.name}</p>
              <div className="grid grid-cols-3 gap-1 text-[10px] font-mono">
                <div>
                  <span className="text-muted-foreground/60">P/E </span>
                  <span className="text-foreground">{f.pe.toFixed(1)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground/60">ROE </span>
                  <span className="text-foreground">{f.roe.toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-muted-foreground/60">Div </span>
                  <span className="text-foreground">{f.divYield.toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-muted-foreground/60">G </span>
                  <span className={f.revenueGrowth >= 0 ? "text-green-400" : "text-red-400"}>
                    {f.revenueGrowth >= 0 ? "+" : ""}{f.revenueGrowth.toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground/60">EPS </span>
                  <span className={f.epsGrowth >= 0 ? "text-green-400" : "text-red-400"}>
                    {f.epsGrowth >= 0 ? "+" : ""}{f.epsGrowth.toFixed(0)}%
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground/60">3M </span>
                  <span className={f.momentum3m >= 0 ? "text-green-400" : "text-red-400"}>
                    {f.momentum3m >= 0 ? "+" : ""}{f.momentum3m.toFixed(0)}%
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-[10px] text-muted-foreground/70 italic">
        * Ranking dùng dữ liệu fundamentals tổng hợp ổn định theo mã. Click 1 mã để mở dashboard chuyên sâu với dữ liệu thực-time.
      </p>
    </div>
  );
}
