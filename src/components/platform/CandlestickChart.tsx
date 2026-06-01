import { useMemo, useState } from "react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine, Cell,
} from "recharts";

export interface Candle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ema12?: number;
  ema26?: number;
  ema50?: number;
  bbUpper?: number;
  bbLower?: number;
  bbMiddle?: number;
}

interface Props {
  data: Candle[];
  height?: number;
  showBollinger?: boolean;
  showEMA?: boolean;
  formatPrice?: (v: number) => string;
}

const BULL = "hsl(142, 76%, 45%)";
const BEAR = "hsl(0, 72%, 55%)";
const GRID = "hsl(222, 20%, 14%)";

/* Custom candle shape: a thin wick line + body rectangle */
const CandleShape = (props: any) => {
  const { x, y, width, height, payload, yAxis } = props;
  if (!payload || !yAxis) return null;
  const { open, close, high, low } = payload as Candle;
  const isBull = close >= open;
  const color = isBull ? BULL : BEAR;
  const scale = yAxis.scale;
  if (!scale) return null;

  const yHigh = scale(high);
  const yLow = scale(low);
  const yOpen = scale(open);
  const yClose = scale(close);
  const bodyTop = Math.min(yOpen, yClose);
  const bodyH = Math.max(Math.abs(yClose - yOpen), 1);
  const cx = x + width / 2;
  const bodyW = Math.max(width * 0.7, 2);

  return (
    <g>
      {/* wick */}
      <line x1={cx} x2={cx} y1={yHigh} y2={yLow} stroke={color} strokeWidth={1} />
      {/* body */}
      <rect
        x={cx - bodyW / 2}
        y={bodyTop}
        width={bodyW}
        height={bodyH}
        fill={isBull ? color : color}
        fillOpacity={isBull ? 0.95 : 0.85}
        stroke={color}
        strokeWidth={0.8}
        rx={0.5}
      />
    </g>
  );
};

const VolumeBar = (props: any) => {
  const { x, y, width, height, payload } = props;
  if (!payload) return null;
  const isBull = (payload as Candle).close >= (payload as Candle).open;
  return (
    <rect
      x={x + width * 0.15}
      y={y}
      width={width * 0.7}
      height={height}
      fill={isBull ? BULL : BEAR}
      fillOpacity={0.35}
      rx={1}
    />
  );
};

const fmtCompact = (v: number) => {
  if (v == null) return "";
  const abs = Math.abs(v);
  if (abs >= 1e9) return (v / 1e9).toFixed(1) + "B";
  if (abs >= 1e6) return (v / 1e6).toFixed(1) + "M";
  if (abs >= 1e3) return (v / 1e3).toFixed(1) + "K";
  return v.toFixed(0);
};

export function CandlestickChart({
  data, height = 380, showBollinger = true, showEMA = true,
  formatPrice = (v) => v.toFixed(2),
}: Props) {
  const [visible, setVisible] = useState({ ema12: true, ema50: true, bb: true });

  const { yMin, yMax } = useMemo(() => {
    if (!data.length) return { yMin: 0, yMax: 1 };
    let lo = Infinity, hi = -Infinity;
    for (const d of data) {
      if (d.low < lo) lo = d.low;
      if (d.high > hi) hi = d.high;
      if (showBollinger) {
        if (d.bbLower != null && d.bbLower < lo) lo = d.bbLower;
        if (d.bbUpper != null && d.bbUpper > hi) hi = d.bbUpper;
      }
    }
    const pad = (hi - lo) * 0.05;
    return { yMin: lo - pad, yMax: hi + pad };
  }, [data, showBollinger]);

  const last = data[data.length - 1];
  const prev = data[data.length - 2];
  const change = last && prev ? last.close - prev.close : 0;
  const changePct = last && prev ? ((change / prev.close) * 100) : 0;
  const isBull = change >= 0;

  return (
    <div className="w-full">
      {/* Legend + last quote */}
      <div className="flex flex-wrap items-center gap-3 mb-2 text-[11px]">
        {last && (
          <div className="flex items-baseline gap-2 mr-auto">
            <span className="font-mono text-base font-semibold tabular-nums">
              {formatPrice(last.close)}
            </span>
            <span
              className="font-mono px-1.5 py-0.5 rounded text-[10px]"
              style={{
                color: isBull ? BULL : BEAR,
                background: `${isBull ? BULL : BEAR}20`,
              }}
            >
              {isBull ? "▲" : "▼"} {Math.abs(change).toFixed(2)} ({changePct >= 0 ? "+" : ""}
              {changePct.toFixed(2)}%)
            </span>
          </div>
        )}
        {last && (
          <div className="flex gap-3 font-mono text-muted-foreground">
            <span>O <span className="text-foreground">{formatPrice(last.open)}</span></span>
            <span>H <span style={{ color: BULL }}>{formatPrice(last.high)}</span></span>
            <span>L <span style={{ color: BEAR }}>{formatPrice(last.low)}</span></span>
            <span>C <span className="text-foreground">{formatPrice(last.close)}</span></span>
          </div>
        )}
        <div className="flex gap-2">
          {showEMA && (
            <>
              <Toggle on={visible.ema12} onClick={() => setVisible(v => ({ ...v, ema12: !v.ema12 }))} color="hsl(38, 92%, 55%)" label="EMA12" />
              <Toggle on={visible.ema50} onClick={() => setVisible(v => ({ ...v, ema50: !v.ema50 }))} color="hsl(270, 70%, 60%)" label="EMA50" />
            </>
          )}
          {showBollinger && (
            <Toggle on={visible.bb} onClick={() => setVisible(v => ({ ...v, bb: !v.bb }))} color="hsl(185, 80%, 50%)" label="BB(20)" />
          )}
        </div>
      </div>

      {/* Price candlestick */}
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data} margin={{ top: 10, right: 8, bottom: 0, left: -10 }}>
          <defs>
            <linearGradient id="candleBg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(185, 80%, 50%)" stopOpacity={0.06} />
              <stop offset="100%" stopColor="hsl(185, 80%, 50%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={GRID} strokeDasharray="2 4" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 9, fill: "hsl(215, 16%, 47%)" }}
            interval={Math.floor(data.length / 8)}
            tickLine={false}
            axisLine={{ stroke: GRID }}
          />
          <YAxis
            domain={[yMin, yMax]}
            tick={{ fontSize: 10, fill: "hsl(215, 16%, 47%)" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => formatPrice(v)}
            width={60}
            orientation="right"
          />
          <Tooltip
            cursor={{ stroke: "hsl(185, 80%, 50%)", strokeWidth: 0.8, strokeDasharray: "3 3" }}
            content={<CandleTooltip formatPrice={formatPrice} />}
          />

          {/* Bollinger fill area via two lines */}
          {showBollinger && visible.bb && (
            <>
              <Line type="monotone" dataKey="bbUpper" stroke="hsl(185, 80%, 50%)" strokeWidth={0.8} strokeDasharray="3 3" dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="bbMiddle" stroke="hsl(185, 50%, 50%)" strokeWidth={0.6} strokeDasharray="1 4" dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="bbLower" stroke="hsl(185, 80%, 50%)" strokeWidth={0.8} strokeDasharray="3 3" dot={false} isAnimationActive={false} />
            </>
          )}

          {showEMA && visible.ema12 && (
            <Line type="monotone" dataKey="ema12" stroke="hsl(38, 92%, 55%)" strokeWidth={1.2} dot={false} isAnimationActive={false} />
          )}
          {showEMA && visible.ema50 && (
            <Line type="monotone" dataKey="ema50" stroke="hsl(270, 70%, 60%)" strokeWidth={1.2} dot={false} isAnimationActive={false} />
          )}

          {/* Candles: use high as the value so YAxis fits & shape draws full body */}
          <Bar dataKey="high" shape={<CandleShape />} isAnimationActive={false} />

          {last && (
            <ReferenceLine
              y={last.close}
              stroke={isBull ? BULL : BEAR}
              strokeDasharray="2 4"
              strokeOpacity={0.6}
              label={{
                position: "right",
                value: formatPrice(last.close),
                fill: isBull ? BULL : BEAR,
                fontSize: 10,
                fontFamily: "ui-monospace",
              } as any}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>

      {/* Volume */}
      <ResponsiveContainer width="100%" height={70}>
        <ComposedChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
          <CartesianGrid stroke={GRID} strokeDasharray="2 4" vertical={false} />
          <XAxis dataKey="date" hide />
          <YAxis
            tick={{ fontSize: 9, fill: "hsl(215, 16%, 47%)" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={fmtCompact}
            width={60}
            orientation="right"
          />
          <Tooltip
            cursor={{ fill: "hsl(185, 80%, 50%)", fillOpacity: 0.05 }}
            content={<VolumeTooltip />}
          />
          <Bar dataKey="volume" shape={<VolumeBar />} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function Toggle({ on, onClick, color, label }: { on: boolean; onClick: () => void; color: string; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono transition-all border ${
        on ? "border-border/40 bg-muted/30" : "border-transparent bg-transparent text-muted-foreground/50"
      }`}
    >
      <span
        className="w-2 h-2 rounded-sm"
        style={{ background: on ? color : "transparent", border: `1px solid ${color}` }}
      />
      {label}
    </button>
  );
}

function CandleTooltip({ active, payload, formatPrice }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as Candle;
  const bull = d.close >= d.open;
  const ch = d.close - d.open;
  const chPct = (ch / d.open) * 100;
  return (
    <div className="bg-[hsl(222,40%,7%)] border border-border/40 rounded-md px-2.5 py-2 shadow-xl text-[11px] font-mono backdrop-blur-md">
      <div className="text-muted-foreground mb-1">{d.date}</div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
        <span className="text-muted-foreground">Open</span><span className="text-right">{formatPrice(d.open)}</span>
        <span className="text-muted-foreground">High</span><span className="text-right" style={{ color: BULL }}>{formatPrice(d.high)}</span>
        <span className="text-muted-foreground">Low</span><span className="text-right" style={{ color: BEAR }}>{formatPrice(d.low)}</span>
        <span className="text-muted-foreground">Close</span>
        <span className="text-right" style={{ color: bull ? BULL : BEAR }}>{formatPrice(d.close)}</span>
        <span className="text-muted-foreground">Δ</span>
        <span className="text-right" style={{ color: bull ? BULL : BEAR }}>
          {bull ? "+" : ""}{ch.toFixed(2)} ({chPct.toFixed(2)}%)
        </span>
        <span className="text-muted-foreground">Vol</span><span className="text-right">{fmtCompact(d.volume)}</span>
      </div>
    </div>
  );
}

function VolumeTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as Candle;
  return (
    <div className="bg-[hsl(222,40%,7%)] border border-border/40 rounded-md px-2 py-1 text-[10px] font-mono">
      Vol: <span className="text-foreground">{fmtCompact(d.volume)}</span>
    </div>
  );
}
