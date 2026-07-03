import { useMemo, useState } from "react";
import {
  ChevronDown, ChevronRight, LayoutGrid, TrendingUp, DollarSign, Activity,
  Percent, Layers, Wallet, BarChart3, LineChart, Shield, Gauge, Zap,
  Award, Coins, HeartPulse, Sparkles, Sigma,
} from "lucide-react";
import type { StockQuote, StockHistory } from "@/hooks/useStockData";

interface Props {
  quote?: StockQuote | null;
  history?: StockHistory | null;
  analysis?: {
    vol: number; beta: number; sharpe: number; maxDD: number;
    rsi: number; returns: number[]; chartData: any[];
  } | null;
}

const fmt = (v: number | null | undefined, digits = 2, suffix = "") => {
  if (v === null || v === undefined || !isFinite(v)) return "—";
  const abs = Math.abs(v);
  if (abs >= 1e12) return (v / 1e12).toFixed(digits) + "T" + suffix;
  if (abs >= 1e9) return (v / 1e9).toFixed(digits) + "B" + suffix;
  if (abs >= 1e6) return (v / 1e6).toFixed(digits) + "M" + suffix;
  if (abs >= 1e3 && !suffix) return (v / 1e3).toFixed(digits) + "K";
  return v.toFixed(digits) + suffix;
};
const pct = (v: number | null | undefined, digits = 2) => {
  if (v === null || v === undefined || !isFinite(v)) return "—";
  return (v * 100).toFixed(digits) + "%";
};

// -------- stats helpers --------
function mean(x: number[]) { return x.length ? x.reduce((a, b) => a + b, 0) / x.length : 0; }
function stdDev(x: number[]) {
  if (x.length < 2) return 0;
  const m = mean(x);
  return Math.sqrt(x.reduce((a, b) => a + (b - m) ** 2, 0) / (x.length - 1));
}
function skewness(x: number[]) {
  const n = x.length; if (n < 3) return 0;
  const m = mean(x); const s = stdDev(x); if (s === 0) return 0;
  return (n / ((n - 1) * (n - 2))) * x.reduce((a, b) => a + ((b - m) / s) ** 3, 0);
}
function kurtosisExcess(x: number[]) {
  const n = x.length; if (n < 4) return 0;
  const m = mean(x); const s = stdDev(x); if (s === 0) return 0;
  const k = x.reduce((a, b) => a + ((b - m) / s) ** 4, 0);
  return (n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3)) * k - (3 * (n - 1) ** 2) / ((n - 2) * (n - 3));
}
function autocorr(x: number[], lag = 1) {
  const n = x.length; if (n <= lag) return 0;
  const m = mean(x);
  let num = 0, den = 0;
  for (let i = 0; i < n - lag; i++) num += (x[i] - m) * (x[i + lag] - m);
  for (let i = 0; i < n; i++) den += (x[i] - m) ** 2;
  return den ? num / den : 0;
}
function downsideDeviation(x: number[], mar = 0) {
  const d = x.filter((v) => v < mar).map((v) => (v - mar) ** 2);
  if (!d.length) return 0;
  return Math.sqrt(d.reduce((a, b) => a + b, 0) / x.length);
}
function percentile(x: number[], p: number) {
  if (!x.length) return 0;
  const s = [...x].sort((a, b) => a - b);
  const i = Math.max(0, Math.min(s.length - 1, Math.floor(p * s.length)));
  return s[i];
}
function computeVWAP(highs: number[], lows: number[], closes: number[], vols: number[]) {
  let cumPV = 0, cumV = 0;
  for (let i = 0; i < closes.length; i++) {
    const tp = (highs[i] + lows[i] + closes[i]) / 3;
    cumPV += tp * (vols[i] || 0);
    cumV += vols[i] || 0;
  }
  return cumV ? cumPV / cumV : 0;
}
function computeATR(highs: number[], lows: number[], closes: number[], period = 14) {
  if (closes.length < period + 1) return 0;
  const trs: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    const tr = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1]),
    );
    trs.push(tr);
  }
  return mean(trs.slice(-period));
}
function computeOBV(closes: number[], vols: number[]) {
  let obv = 0;
  for (let i = 1; i < closes.length; i++) {
    if (closes[i] > closes[i - 1]) obv += vols[i] || 0;
    else if (closes[i] < closes[i - 1]) obv -= vols[i] || 0;
  }
  return obv;
}

// -------- UI primitives --------
function Cell({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  const isNA = value === "—" || value === "" || value === null || value === undefined;
  return (
    <div className="rounded-md border border-border/40 bg-muted/20 p-2.5 group hover:border-primary/40 transition-colors" title={hint}>
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground truncate">{label}</div>
      <div className={`font-mono text-[13px] mt-0.5 truncate ${isNA ? "text-muted-foreground/50" : "text-primary"}`}>
        {value}
      </div>
    </div>
  );
}

function Section({
  id, title, icon: Icon, count, total, defaultOpen = false, children,
}: {
  id: string; title: string; icon: any; count: number; total: number;
  defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const pctFill = Math.round((count / total) * 100);
  return (
    <div className="rounded-lg border border-border/40 bg-background/40">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted/30 transition-colors"
      >
        {open ? <ChevronDown className="w-3.5 h-3.5 text-primary" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
        <Icon className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs font-semibold">{title}</span>
        <span className="text-[10px] font-mono text-muted-foreground">
          {count}/{total}
        </span>
        <div className="ml-auto flex items-center gap-2 min-w-[80px]">
          <div className="h-1 w-16 bg-muted/40 rounded overflow-hidden">
            <div
              className={`h-full ${pctFill >= 70 ? "bg-emerald-500" : pctFill >= 40 ? "bg-amber-500" : "bg-red-500/60"}`}
              style={{ width: `${pctFill}%` }}
            />
          </div>
          <span className="text-[9px] font-mono text-muted-foreground w-8 text-right">{pctFill}%</span>
        </div>
      </button>
      {open && (
        <div className="p-3 border-t border-border/40 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {children}
        </div>
      )}
    </div>
  );
}

export function ComprehensiveMetricsPanel({ quote, history, analysis }: Props) {
  const [expandAll, setExpandAll] = useState(false);

  const m = useMemo(() => {
    const q: any = quote || {};
    const r = analysis?.returns || [];
    const closes = history?.closes || [];
    const highs = history?.highs || [];
    const lows = history?.lows || [];
    const vols = history?.volumes || [];

    const ev = q.marketCap && q.totalDebt !== undefined
      ? (Number(q.marketCap) || 0) + (q.totalDebt || 0) - (q.totalCash || 0)
      : null;
    const capex = (q.operatingCashflow && q.freeCashflow)
      ? q.operatingCashflow - q.freeCashflow : null;
    const fcfYield = (q.freeCashflow && q.marketCap)
      ? q.freeCashflow / Number(q.marketCap) : null;
    const netDebt = (q.totalDebt !== undefined && q.totalCash !== undefined)
      ? q.totalDebt - q.totalCash : null;
    const priceCF = (q.marketCap && q.operatingCashflow)
      ? Number(q.marketCap) / q.operatingCashflow : null;

    // CAGR from closes
    const cagr = (years: number) => {
      const need = Math.round(years * 252);
      if (closes.length < need) return null;
      const start = closes[closes.length - need];
      const end = closes[closes.length - 1];
      if (!start || start <= 0) return null;
      return Math.pow(end / start, 1 / years) - 1;
    };
    const cagr3 = cagr(3); const cagr5 = cagr(5);

    // Returns stats
    const stdDaily = stdDev(r);
    const varDaily = stdDaily * stdDaily;
    const skew = skewness(r);
    const kurt = kurtosisExcess(r);
    const ac1 = autocorr(r, 1);
    const dd = downsideDeviation(r);
    const var95 = -percentile(r, 0.05);
    const tail = r.filter((v) => v <= -var95);
    const cvar95 = tail.length ? -mean(tail) : 0;
    const rollingVol20 = r.length >= 20 ? stdDev(r.slice(-20)) * Math.sqrt(252) : null;

    // Momentum
    const mom = (days: number) => {
      if (closes.length < days + 1) return null;
      const a = closes[closes.length - days - 1], b = closes[closes.length - 1];
      return a > 0 ? (b - a) / a : null;
    };
    const mom1m = mom(21); const mom3m = mom(63); const mom6m = mom(126);
    const volMom = vols.length >= 40
      ? mean(vols.slice(-20)) / (mean(vols.slice(-40, -20)) || 1) - 1
      : null;
    const relVol = q.volume && q.avgVolume ? q.volume / q.avgVolume : null;

    // Technicals
    const last = analysis?.chartData?.[analysis.chartData.length - 1] || {};
    const vwap = computeVWAP(highs, lows, closes, vols);
    const atr = computeATR(highs, lows, closes);
    const obv = computeOBV(closes, vols);

    // Sortino, Calmar
    const rfDaily = 0.04 / 252;
    const sortino = dd > 0 ? ((mean(r) - rfDaily) / dd) * Math.sqrt(252) : null;
    const calmar = analysis && analysis.maxDD > 0 && cagr3
      ? cagr3 / analysis.maxDD : null;

    // CAPM E[R]
    const capmER = analysis ? 0.04 + analysis.beta * (0.10 - 0.04) : null;

    // Financial health simple
    const debtCoverage = (q.operatingCashflow && q.totalDebt)
      ? q.operatingCashflow / q.totalDebt : null;
    const solvency = (q.totalCash !== undefined && q.totalDebt !== undefined && (q.totalCash + q.totalDebt) > 0)
      ? (q.totalCash - q.totalDebt) / (q.totalCash + q.totalDebt) : null;

    // AI scores (heuristic 0-100)
    const clamp = (x: number) => Math.max(0, Math.min(100, x));
    const fundamentalScore = clamp(
      50 + (q.roe > 0.15 ? 15 : 0) + (q.roa > 0.05 ? 10 : 0)
      + (q.profitMargin > 0.1 ? 10 : 0) + (q.deRatio && q.deRatio < 1 ? 10 : 0)
      + (q.revenueGrowth > 0.1 ? 10 : 0)
    );
    const technicalScore = clamp(
      50 + (analysis?.rsi > 40 && analysis?.rsi < 65 ? 15 : -5)
      + (last?.close > last?.ema50 ? 15 : -5)
      + (last?.macd > last?.signal ? 15 : -5)
    );
    const momentumScore = clamp(50 + (mom1m || 0) * 200 + (mom3m || 0) * 100);
    const growthScore = clamp(50 + (q.revenueGrowth || 0) * 200 + (q.earningsGrowth || 0) * 150);
    const qualityScore = clamp(
      50 + (q.grossMargin > 0.3 ? 15 : 0) + (q.operatingMargin > 0.15 ? 10 : 0)
      + (q.currentRatio > 1.5 ? 10 : 0) + (q.roe > 0.15 ? 15 : 0)
    );
    const riskScore = clamp(
      100 - (analysis?.vol || 0) * 150 - (analysis?.maxDD || 0) * 100
    );
    const valueScore = clamp(
      50 + (q.pe > 0 && q.pe < 15 ? 20 : q.pe < 25 ? 10 : -10)
      + (q.pb > 0 && q.pb < 2 ? 15 : q.pb < 4 ? 5 : -10)
      + (fcfYield && fcfYield > 0.05 ? 15 : 0)
    );
    const overall = clamp(
      (fundamentalScore * 0.25 + technicalScore * 0.15 + momentumScore * 0.15
        + growthScore * 0.15 + qualityScore * 0.15 + riskScore * 0.10 + valueScore * 0.05)
    );

    return {
      q, r, ev, capex, fcfYield, netDebt, priceCF,
      cagr3, cagr5, stdDaily, varDaily, skew, kurt, ac1, dd,
      var95, cvar95, rollingVol20,
      mom1m, mom3m, mom6m, volMom, relVol,
      last, vwap, atr, obv,
      sortino, calmar, capmER,
      debtCoverage, solvency,
      scores: {
        overall, fundamental: fundamentalScore, technical: technicalScore,
        momentum: momentumScore, growth: growthScore, quality: qualityScore,
        risk: riskScore, value: valueScore,
      },
    };
  }, [quote, history, analysis]);

  const q: any = quote || {};
  const has = (v: any) => v !== null && v !== undefined && !Number.isNaN(v) && isFinite(v as number);

  // Helper to count non-empty cells per section
  const cnt = (arr: any[]) => arr.filter((v) => has(v)).length;

  const recBadge = (() => {
    const s = m.scores.overall;
    if (s >= 75) return { text: "STRONG BUY", cls: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" };
    if (s >= 60) return { text: "BUY", cls: "bg-green-500/15 text-green-400 border-green-500/40" };
    if (s >= 45) return { text: "HOLD", cls: "bg-amber-500/15 text-amber-400 border-amber-500/40" };
    if (s >= 30) return { text: "REDUCE", cls: "bg-orange-500/15 text-orange-400 border-orange-500/40" };
    return { text: "SELL", cls: "bg-red-500/15 text-red-400 border-red-500/40" };
  })();

  return (
    <div className="quant-card space-y-4">
      {/* Header + Overall AI Score */}
      <div className="flex items-center gap-2 flex-wrap">
        <LayoutGrid className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold tracking-wide uppercase">Comprehensive Metrics — 16 Categories</h3>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/15 text-primary">
          Bloomberg-grade dashboard
        </span>
        <button
          onClick={() => setExpandAll(!expandAll)}
          className="ml-auto text-[10px] px-2 py-1 rounded-full bg-muted/30 hover:bg-muted/50 border border-border/40 font-mono"
        >
          {expandAll ? "Collapse all" : "Expand all"}
        </button>
      </div>

      {/* AI Score summary */}
      <div className="rounded-lg border border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          <span className="text-xs uppercase tracking-wider font-semibold">Overall AI Score</span>
          <div className="text-2xl font-bold font-mono text-primary">{m.scores.overall.toFixed(0)}<span className="text-sm text-muted-foreground">/100</span></div>
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md border ${recBadge.cls}`}>{recBadge.text}</span>
          <span className="ml-auto text-[10px] font-mono text-muted-foreground">Symbol: {q.symbol || "—"}</span>
        </div>
        <div className="mt-3 grid grid-cols-2 md:grid-cols-7 gap-2">
          {[
            { l: "Fundamental", v: m.scores.fundamental },
            { l: "Technical", v: m.scores.technical },
            { l: "Momentum", v: m.scores.momentum },
            { l: "Growth", v: m.scores.growth },
            { l: "Quality", v: m.scores.quality },
            { l: "Risk (adj)", v: m.scores.risk },
            { l: "Value", v: m.scores.value },
          ].map((s) => (
            <div key={s.l} className="rounded-md bg-background/60 border border-border/40 p-2">
              <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{s.l}</div>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="font-mono text-sm text-primary">{s.v.toFixed(0)}</span>
                <span className="text-[9px] text-muted-foreground">/100</span>
              </div>
              <div className="h-1 bg-muted/40 rounded mt-1 overflow-hidden">
                <div className={`h-full ${s.v >= 65 ? "bg-emerald-500" : s.v >= 45 ? "bg-amber-500" : "bg-red-500/70"}`} style={{ width: `${s.v}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-2" key={expandAll ? "open" : "closed"}>
        {/* 1. Valuation */}
        <Section id="val" title="1. Valuation (Định giá)" icon={DollarSign}
          count={cnt([q.pe, q.forwardPe, q.pe && q.earningsGrowth, q.pb, q.ps, null, m.ev, m.ev, m.priceCF, q.marketCap, q.bookValue])}
          total={12} defaultOpen={expandAll || true}>
          <Cell label="P/E" value={fmt(q.pe)} />
          <Cell label="Forward P/E" value={fmt(q.forwardPe)} />
          <Cell label="PEG" value={q.pe && q.earningsGrowth ? fmt(q.pe / (q.earningsGrowth * 100), 2) : "—"} hint="P/E ÷ (EPS Growth %)" />
          <Cell label="P/B" value={fmt(q.pb)} />
          <Cell label="P/S" value={fmt(q.ps)} />
          <Cell label="EV/EBITDA" value="—" hint="Cần EBITDA từ báo cáo" />
          <Cell label="EV/Sales" value={m.ev && q.totalRevenue ? fmt(m.ev / q.totalRevenue) : "—"} />
          <Cell label="Price/Cash Flow" value={fmt(m.priceCF)} />
          <Cell label="Enterprise Value" value={fmt(m.ev, 2, " $")} />
          <Cell label="Market Cap" value={typeof q.marketCap === "number" ? fmt(q.marketCap, 2, " $") : q.marketCap || "—"} />
          <Cell label="Book Value/Share" value={fmt(q.bookValue)} />
          <Cell label="Intrinsic Value (DCF)" value="—" hint="Xem tab Forecast/Models Lab" />
        </Section>

        {/* 2. Profitability */}
        <Section id="prof" title="2. Profitability (Sinh lời)" icon={Percent}
          count={cnt([q.roe, q.roa, null, null, null, q.grossMargin, null, q.operatingMargin, q.profitMargin, q.eps])}
          total={11}>
          <Cell label="ROE" value={pct(q.roe)} />
          <Cell label="ROA" value={pct(q.roa)} />
          <Cell label="ROIC" value="—" />
          <Cell label="ROI" value="—" />
          <Cell label="ROCE" value="—" />
          <Cell label="Gross Margin" value={pct(q.grossMargin)} />
          <Cell label="EBITDA Margin" value="—" />
          <Cell label="Operating Margin" value={pct(q.operatingMargin)} />
          <Cell label="Net Margin" value={pct(q.profitMargin)} />
          <Cell label="EPS" value={fmt(q.eps)} />
          <Cell label="Diluted EPS" value="—" />
        </Section>

        {/* 3. Growth */}
        <Section id="growth" title="3. Growth (Tăng trưởng)" icon={TrendingUp}
          count={cnt([q.revenueGrowth, null, q.earningsGrowth, null, null, null, m.cagr3, m.cagr5])} total={8}>
          <Cell label="Revenue Growth" value={pct(q.revenueGrowth)} />
          <Cell label="EPS Growth" value="—" />
          <Cell label="Net Income Growth" value={pct(q.earningsGrowth)} />
          <Cell label="Operating Income Growth" value="—" />
          <Cell label="Cash Flow Growth" value="—" />
          <Cell label="Free Cash Flow Growth" value="—" />
          <Cell label="CAGR 3Y (price)" value={pct(m.cagr3)} />
          <Cell label="CAGR 5Y (price)" value={pct(m.cagr5)} />
        </Section>

        {/* 4. Liquidity */}
        <Section id="liq" title="4. Liquidity (Thanh khoản)" icon={Wallet}
          count={cnt([q.currentRatio])} total={6}>
          <Cell label="Current Ratio" value={fmt(q.currentRatio)} />
          <Cell label="Quick Ratio" value="—" />
          <Cell label="Cash Ratio" value="—" />
          <Cell label="Working Capital" value="—" />
          <Cell label="Current Assets" value="—" />
          <Cell label="Current Liabilities" value="—" />
        </Section>

        {/* 5. Leverage */}
        <Section id="lev" title="5. Leverage (Đòn bẩy)" icon={Layers}
          count={cnt([q.deRatio, null, null, null, null, m.netDebt])} total={6}>
          <Cell label="Debt/Equity" value={fmt(q.deRatio)} />
          <Cell label="Debt/Assets" value="—" />
          <Cell label="Interest Coverage" value="—" />
          <Cell label="Financial Leverage" value="—" />
          <Cell label="Long-term Debt" value="—" />
          <Cell label="Net Debt" value={fmt(m.netDebt, 2, " $")} />
        </Section>

        {/* 6. Cash Flow */}
        <Section id="cf" title="6. Cash Flow" icon={Coins}
          count={cnt([q.operatingCashflow, null, null, q.freeCashflow, m.capex, m.fcfYield])} total={6}>
          <Cell label="Operating Cash Flow" value={fmt(q.operatingCashflow, 2, " $")} />
          <Cell label="Investing Cash Flow" value="—" />
          <Cell label="Financing Cash Flow" value="—" />
          <Cell label="Free Cash Flow" value={fmt(q.freeCashflow, 2, " $")} />
          <Cell label="CapEx (OCF − FCF)" value={fmt(m.capex, 2, " $")} />
          <Cell label="FCF Yield" value={pct(m.fcfYield)} />
        </Section>

        {/* 7. Market Statistics */}
        <Section id="mkt" title="7. Market Statistics" icon={BarChart3}
          count={cnt([q.volume, q.avgVolume, null, null, null, null, null, null, m.relVol])} total={9}>
          <Cell label="Volume" value={fmt(q.volume)} />
          <Cell label="Average Volume" value={fmt(q.avgVolume)} />
          <Cell label="Float" value="—" />
          <Cell label="Shares Outstanding" value="—" />
          <Cell label="Insider Ownership" value="—" />
          <Cell label="Institutional Ownership" value="—" />
          <Cell label="Short Interest" value="—" />
          <Cell label="Short Ratio" value="—" />
          <Cell label="Relative Volume" value={fmt(m.relVol)} />
        </Section>

        {/* 8. Technical */}
        <Section id="tech" title="8. Technical Indicators" icon={Activity}
          count={cnt([analysis?.rsi, m.last?.macd, m.last?.bbUpper, m.last?.ema12, analysis?.chartData?.length, m.vwap, m.atr, m.obv])} total={14}>
          <Cell label="RSI(14)" value={fmt(analysis?.rsi, 1)} />
          <Cell label="MACD" value={fmt(m.last?.macd, 3)} />
          <Cell label="MACD Signal" value={fmt(m.last?.signal, 3)} />
          <Cell label="BB Upper" value={fmt(m.last?.bbUpper)} />
          <Cell label="BB Lower" value={fmt(m.last?.bbLower)} />
          <Cell label="EMA 12" value={fmt(m.last?.ema12)} />
          <Cell label="EMA 26" value={fmt(m.last?.ema26)} />
          <Cell label="EMA 50" value={fmt(m.last?.ema50)} />
          <Cell label="SMA 20" value={fmt(m.last?.sma20)} />
          <Cell label="VWAP" value={fmt(m.vwap)} />
          <Cell label="ATR(14)" value={fmt(m.atr, 3)} />
          <Cell label="OBV" value={fmt(m.obv)} />
          <Cell label="ADX / CCI / MFI / StochRSI" value="→ Python Lab" hint="Chạy 12_technical_bundle.py" />
          <Cell label="Ichimoku / Fibonacci" value="→ TradingView" />
        </Section>

        {/* 9. Volatility & Risk */}
        <Section id="risk" title="9. Volatility & Risk" icon={Shield}
          count={cnt([analysis?.beta, null, analysis?.vol, analysis?.vol, null, m.stdDaily, m.varDaily, null, null, null, analysis?.maxDD, m.dd, null, m.var95, m.cvar95, m.cvar95])} total={17}>
          <Cell label="Beta" value={fmt(analysis?.beta)} />
          <Cell label="Alpha (CAPM, annual)" value="→ Models Lab" hint="Cần thêm chuỗi thị trường thực" />
          <Cell label="Volatility (annual)" value={pct(analysis?.vol)} />
          <Cell label="Historical Vol" value={pct(analysis?.vol)} />
          <Cell label="Implied Volatility" value="—" hint="Cần chuỗi option chain" />
          <Cell label="Std Dev (daily)" value={pct(m.stdDaily, 3)} />
          <Cell label="Variance (daily)" value={m.varDaily.toExponential(3)} />
          <Cell label="Covariance" value="→ Portfolio Lab" />
          <Cell label="Correlation" value="→ Portfolio Lab" />
          <Cell label="Correlation Matrix" value="→ Portfolio Lab" />
          <Cell label="Max Drawdown" value={pct(analysis?.maxDD)} />
          <Cell label="Downside Deviation" value={pct(m.dd, 3)} />
          <Cell label="Tracking Error" value="—" />
          <Cell label="VaR 95% (1d)" value={pct(m.var95)} />
          <Cell label="CVaR 95% (1d)" value={pct(m.cvar95)} />
          <Cell label="Expected Shortfall" value={pct(m.cvar95)} />
        </Section>

        {/* 10. Portfolio Metrics */}
        <Section id="port" title="10. Portfolio Metrics" icon={Gauge}
          count={cnt([analysis?.sharpe, m.sortino, null, null, m.calmar])} total={8}>
          <Cell label="Sharpe Ratio" value={fmt(analysis?.sharpe, 3)} />
          <Cell label="Sortino Ratio" value={fmt(m.sortino, 3)} />
          <Cell label="Treynor Ratio" value="—" />
          <Cell label="Information Ratio" value="—" />
          <Cell label="Calmar Ratio" value={fmt(m.calmar, 3)} />
          <Cell label="Jensen Alpha" value="—" />
          <Cell label="Active Return" value="—" />
          <Cell label="Active Risk" value="—" />
        </Section>

        {/* 11. Momentum */}
        <Section id="mom" title="11. Momentum" icon={Zap}
          count={cnt([m.mom1m, null, m.mom3m, null, m.volMom, m.relVol])} total={6}>
          <Cell label="Momentum 1M" value={pct(m.mom1m)} />
          <Cell label="Momentum 3M" value={pct(m.mom3m)} />
          <Cell label="Momentum 6M" value={pct(m.mom6m)} />
          <Cell label="Earnings Momentum" value="—" />
          <Cell label="Volume Momentum" value={pct(m.volMom)} />
          <Cell label="Relative Volume" value={fmt(m.relVol, 2, "×")} />
        </Section>

        {/* 12. Quality */}
        <Section id="qual" title="12. Quality Score" icon={Award}
          count={0} total={5}>
          <Cell label="Piotroski F-Score" value="→ 10_quality_scores.py" />
          <Cell label="Altman Z-Score" value="→ 10_quality_scores.py" />
          <Cell label="Beneish M-Score" value="—" />
          <Cell label="Earnings Quality" value="—" />
          <Cell label="Accrual Ratio" value="—" />
        </Section>

        {/* 13. Dividend */}
        <Section id="div" title="13. Dividend" icon={Coins}
          count={cnt([q.divYield])} total={6}>
          <Cell label="Dividend Yield" value={pct(q.divYield)} />
          <Cell label="Dividend Growth" value="—" />
          <Cell label="Dividend CAGR" value="—" />
          <Cell label="Payout Ratio" value="—" />
          <Cell label="Ex-Dividend Date" value="—" />
          <Cell label="Dividend History" value="—" />
        </Section>

        {/* 14. Financial Health */}
        <Section id="health" title="14. Financial Health" icon={HeartPulse}
          count={cnt([null, null, m.debtCoverage, null, null, m.solvency])} total={6}>
          <Cell label="Altman Z-Score" value="—" />
          <Cell label="Piotroski F-Score" value="—" />
          <Cell label="Debt Coverage (OCF/Debt)" value={fmt(m.debtCoverage, 2)} />
          <Cell label="Bankruptcy Risk" value="—" />
          <Cell label="Interest Coverage" value="—" />
          <Cell label="Solvency Score" value={has(m.solvency) ? m.solvency.toFixed(3) : "—"} hint="(Cash - Debt) / (Cash + Debt)" />
        </Section>

        {/* 15. Quant advanced */}
        <Section id="quant" title="15. Quant Advanced (Bloomberg-grade)" icon={Sigma}
          count={cnt([m.stdDaily, m.stdDaily, m.skew, m.kurt, m.ac1, null, null, m.rollingVol20, m.capmER])} total={20}>
          <Cell label="Z-Score (last return)" value={m.stdDaily ? ((m.r[m.r.length - 1] || 0) / m.stdDaily).toFixed(2) : "—"} />
          <Cell label="Skewness" value={fmt(m.skew, 3)} />
          <Cell label="Kurtosis (excess)" value={fmt(m.kurt, 3)} />
          <Cell label="Autocorrelation (lag 1)" value={fmt(m.ac1, 3)} />
          <Cell label="Rolling Volatility 20D" value={pct(m.rollingVol20)} />
          <Cell label="Rolling Correlation" value="→ Portfolio Lab" />
          <Cell label="Rolling Beta" value="→ Portfolio Lab" />
          <Cell label="Covariance Matrix" value="→ Portfolio Lab" />
          <Cell label="Correlation Matrix" value="→ Portfolio Lab" />
          <Cell label="Eigenvalues / PCA" value="→ 11_pca_correlation.py" />
          <Cell label="Monte Carlo" value="→ Forecast tab" />
          <Cell label="GARCH Volatility" value="→ Models Lab" />
          <Cell label="CAPM E[R] (annual)" value={pct(m.capmER)} hint="Rf + β×(Rm − Rf), Rf=4%, Rm=10%" />
          <Cell label="Fama-French 3F" value="—" />
          <Cell label="Fama-French 5F" value="—" />
          <Cell label="Carhart 4F" value="—" />
          <Cell label="Black-Litterman" value="—" />
          <Cell label="Efficient Frontier" value="→ Portfolio Lab" />
          <Cell label="Information Coefficient" value="—" />
          <Cell label="Information Ratio" value="—" />
        </Section>

        {/* 16. AI Scores */}
        <Section id="ai" title="16. AI Scores (Crystal Ball proprietary)" icon={Sparkles}
          count={7} total={12} defaultOpen={expandAll}>
          <Cell label="Overall AI Score" value={`${m.scores.overall.toFixed(0)}/100`} />
          <Cell label="Fundamental Score" value={`${m.scores.fundamental.toFixed(0)}/100`} />
          <Cell label="Technical Score" value={`${m.scores.technical.toFixed(0)}/100`} />
          <Cell label="Momentum Score" value={`${m.scores.momentum.toFixed(0)}/100`} />
          <Cell label="Growth Score" value={`${m.scores.growth.toFixed(0)}/100`} />
          <Cell label="Quality Score" value={`${m.scores.quality.toFixed(0)}/100`} />
          <Cell label="Risk Score (adj.)" value={`${m.scores.risk.toFixed(0)}/100`} />
          <Cell label="Value Score" value={`${m.scores.value.toFixed(0)}/100`} />
          <Cell label="Sentiment Score" value="→ AI Research" />
          <Cell label="ESG Score" value="—" />
          <Cell label="Institutional Score" value="—" />
          <Cell label="Smart Money Score" value="—" />
        </Section>
      </div>

      <div className="text-[10px] text-muted-foreground font-mono flex items-center gap-2 pt-1">
        <LineChart className="w-3 h-3" />
        Các chỉ số "—" cần dữ liệu chuyên sâu (báo cáo tài chính chi tiết, chuỗi thị trường, option chain). Điều hướng "→" mở tab tương ứng để tính sâu hơn.
      </div>
    </div>
  );
}
