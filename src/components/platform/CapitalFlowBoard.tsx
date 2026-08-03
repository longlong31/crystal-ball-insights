import { useMemo } from "react";
import { motion } from "framer-motion";
import { Waves, ArrowUpRight, ArrowDownRight, RefreshCw } from "lucide-react";
import { useTopCryptoMarkets } from "@/hooks/useMarketData";
import { useLanguage } from "@/contexts/LanguageContext";

const W = 900;
const H = 320;

function fmt(n: number) {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toFixed(0)}`;
}

interface Flow {
  symbol: string;
  volume: number;
  change: number;
  price: number;
}

/** Realtime capital-flow (Sankey-style) board with animated money particles. */
export function CapitalFlowBoard() {
  const { language } = useLanguage();
  const { data, isFetching, dataUpdatedAt } = useTopCryptoMarkets(12);

  const flows: Flow[] = useMemo(
    () =>
      (data ?? [])
        .slice(0, 8)
        .map((d) => ({
          symbol: d.symbol.toUpperCase(),
          volume: d.totalVolume || 0,
          change: d.priceChangePercentage24h ?? 0,
          price: d.currentPrice,
        }))
        .sort((a, b) => b.volume - a.volume),
    [data],
  );

  const totalVol = flows.reduce((s, f) => s + f.volume, 0) || 1;
  const inflow = flows.filter((f) => f.change >= 0).reduce((s, f) => s + f.volume, 0);
  const outflow = totalVol - inflow;
  const netPct = ((inflow - outflow) / totalVol) * 100;

  const srcX = 168;
  const dstX = W - 190;
  const bandTop = 30;
  const bandH = H - 60;

  let cursor = bandTop;
  const bands = flows.map((f) => {
    const h = Math.max((f.volume / totalVol) * bandH, 8);
    const y = cursor;
    cursor += h + 2;
    return { ...f, y, h };
  });

  const srcH = Math.max(cursor - bandTop - 2, 20);

  return (
    <div className="quant-card overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Waves className="w-4 h-4 text-primary" />
          <div>
            <p className="stat-label">
              {language === "vi" ? "Dòng chảy nguồn tiền (24h)" : "Capital Flow (24h)"}
            </p>
            <p className="text-[10px] text-muted-foreground font-mono">
              {language === "vi"
                ? "Độ dày dải = khối lượng giao dịch · Hạt chạy = tốc độ dòng tiền"
                : "Band width = traded volume · Particles = flow velocity"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono">
          <span className="inline-flex items-center gap-1 ticker-green">
            <ArrowUpRight className="w-3 h-3" /> {fmt(inflow)}
          </span>
          <span className="inline-flex items-center gap-1 ticker-red">
            <ArrowDownRight className="w-3 h-3" /> {fmt(outflow)}
          </span>
          <span className={netPct >= 0 ? "ticker-green" : "ticker-red"}>
            NET {netPct >= 0 ? "+" : ""}{netPct.toFixed(1)}%
          </span>
          <span className="inline-flex items-center gap-1 text-emerald-500">
            <RefreshCw className={`w-3 h-3 ${isFetching ? "animate-spin" : ""}`} /> LIVE
          </span>
        </div>
      </div>

      <div className="rounded-lg border border-border/40 bg-background/40 overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[720px] h-auto">
          <defs>
            <linearGradient id="cfSrc" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(185, 80%, 50%)" />
              <stop offset="100%" stopColor="hsl(270, 70%, 60%)" />
            </linearGradient>
            {bands.map((b) => (
              <linearGradient key={b.symbol} id={`cf-${b.symbol}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="hsl(185, 80%, 50%)" stopOpacity={0.35} />
                <stop
                  offset="100%"
                  stopColor={b.change >= 0 ? "hsl(142, 76%, 45%)" : "hsl(0, 72%, 55%)"}
                  stopOpacity={0.75}
                />
              </linearGradient>
            ))}
            <filter id="cfGlow">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Source column */}
          <rect x={srcX - 26} y={bandTop} width={26} height={srcH} rx={4} fill="url(#cfSrc)" opacity={0.9} />
          <text x={srcX - 34} y={bandTop + srcH / 2} textAnchor="end" fontSize={12} fill="hsl(215,15%,70%)" fontFamily="monospace">
            {language === "vi" ? "Tổng thanh khoản" : "Total liquidity"}
          </text>
          <text x={srcX - 34} y={bandTop + srcH / 2 + 16} textAnchor="end" fontSize={13} fill="hsl(185,80%,60%)" fontFamily="monospace">
            {fmt(totalVol)}
          </text>

          {bands.map((b, i) => {
            const y0 = bandTop + srcH * ((b.y - bandTop + b.h / 2) / Math.max(srcH, 1));
            const path = `M ${srcX} ${y0 - b.h / 2}
              C ${(srcX + dstX) / 2} ${y0 - b.h / 2}, ${(srcX + dstX) / 2} ${b.y}, ${dstX} ${b.y}
              L ${dstX} ${b.y + b.h}
              C ${(srcX + dstX) / 2} ${b.y + b.h}, ${(srcX + dstX) / 2} ${y0 + b.h / 2}, ${srcX} ${y0 + b.h / 2} Z`;
            const linePath = `M ${srcX} ${y0} C ${(srcX + dstX) / 2} ${y0}, ${(srcX + dstX) / 2} ${b.y + b.h / 2}, ${dstX} ${b.y + b.h / 2}`;
            const color = b.change >= 0 ? "hsl(142, 76%, 55%)" : "hsl(0, 72%, 60%)";
            const dur = Math.max(1.4, 4 - (b.volume / totalVol) * 8);
            return (
              <g key={b.symbol}>
                <motion.path
                  d={path}
                  fill={`url(#cf-${b.symbol})`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                />
                <path id={`cfline-${b.symbol}`} d={linePath} fill="none" stroke="none" />
                {[0, 0.33, 0.66].map((off) => (
                  <circle key={off} r={2.6} fill={color} filter="url(#cfGlow)">
                    <animateMotion dur={`${dur}s`} repeatCount="indefinite" begin={`${off * dur}s`} path={linePath} />
                  </circle>
                ))}
                <rect x={dstX} y={b.y} width={14} height={b.h} rx={3} fill={color} opacity={0.9} />
                <text x={dstX + 22} y={b.y + b.h / 2 - 2} fontSize={12} fill="hsl(210,20%,88%)" fontFamily="monospace">
                  {b.symbol}
                </text>
                <text x={dstX + 22} y={b.y + b.h / 2 + 12} fontSize={10} fill={color} fontFamily="monospace">
                  {fmt(b.volume)} · {b.change >= 0 ? "+" : ""}{b.change.toFixed(1)}%
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <p className="text-[10px] font-mono text-muted-foreground mt-2">
        {language === "vi" ? "Nguồn: CoinGecko · làm mới 60s" : "Source: CoinGecko · refresh 60s"}
        {dataUpdatedAt ? ` · ${new Date(dataUpdatedAt).toLocaleTimeString()}` : ""}
      </p>
    </div>
  );
}

export default CapitalFlowBoard;
