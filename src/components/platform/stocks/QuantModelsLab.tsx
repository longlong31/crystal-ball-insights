import { useMemo, useState } from "react";
import { Activity, Sparkles, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, Area, ComposedChart, ReferenceLine, Legend } from "recharts";
import { capm, blackScholes, arFit, garchFit, mlEnsembleForecast } from "@/lib/quantModels";

interface Props {
  symbol: string;
  returns: number[];          // daily log/simple returns of asset
  closes: number[];           // historical closes
  currentPrice: number;
  beta?: number;
  /** Real benchmark daily returns aligned with alignedReturns */
  marketReturns?: number[];
  alignedReturns?: number[];
  benchmarkSymbol?: string;
  formatPrice?: (v: number) => string;
}

function StatRow({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between py-1.5 border-b border-border/15 last:border-b-0">
      <span className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</span>
      <span className="font-mono text-sm tabular-nums">
        {value}
        {hint && <span className="ml-1 text-[10px] text-muted-foreground">{hint}</span>}
      </span>
    </div>
  );
}

export function QuantModelsLab({ symbol, returns, closes, currentPrice, beta, marketReturns, alignedReturns, benchmarkSymbol, formatPrice }: Props) {
  const fmt = formatPrice ?? ((v: number) => v.toFixed(2));

  // Real benchmark returns (aligned by trading date). Falls back to asset returns
  // scaled by beta only when the index series is unavailable.
  const hasMkt = !!marketReturns && marketReturns.length >= 30;
  const capmAsset = hasMkt ? (alignedReturns ?? returns) : returns;
  const capmMarket = useMemo(
    () => (hasMkt ? marketReturns! : returns.map((r) => (beta && beta !== 0 ? r / beta : r))),
    [hasMkt, marketReturns, returns, beta],
  );

  const [riskFree, setRiskFree] = useState(4);          // %
  const [expectedMkt, setExpectedMkt] = useState(10);   // %

  const capmRes = useMemo(
    () => capm(capmAsset, capmMarket, riskFree / 100, expectedMkt / 100),
    [capmAsset, capmMarket, riskFree, expectedMkt],
  );


  // Black-Scholes inputs
  const [strike, setStrike] = useState(currentPrice);
  const [days, setDays] = useState(30);
  const annualVol = useMemo(() => {
    const m = returns.reduce((a, b) => a + b, 0) / returns.length;
    const v = returns.reduce((a, b) => a + (b - m) ** 2, 0) / Math.max(1, returns.length - 1);
    return Math.sqrt(v * 252);
  }, [returns]);
  const bs = useMemo(
    () => blackScholes(currentPrice, strike || currentPrice, Math.max(1, days) / 365, riskFree / 100, annualVol),
    [currentPrice, strike, days, riskFree, annualVol],
  );

  // ARIMA (AR(2)) on returns
  const ar = useMemo(() => arFit(returns, 2, 30), [returns]);
  // GARCH(1,1) on returns
  const garch = useMemo(() => garchFit(returns, 30), [returns]);
  // ML Ensemble
  const ml = useMemo(() => mlEnsembleForecast(returns, currentPrice, 30), [returns, currentPrice]);

  const volChartData = garch.volatilityForecast.map((v, i) => ({
    day: i + 1,
    sigma: v * 100,
    annualized: v * Math.sqrt(252) * 100,
  }));

  const pricePathData = ml.pricePath.map((p, i) => ({
    day: i + 1,
    price: p,
    low: ml.confidenceLow[i],
    high: ml.confidenceHigh[i],
  }));

  const sigIcon =
    ml.signal === "BUY" ? <TrendingUp className="w-4 h-4 text-green-500" /> :
    ml.signal === "SELL" ? <TrendingDown className="w-4 h-4 text-red-500" /> :
    <Minus className="w-4 h-4 text-yellow-500" />;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="quant-card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 rounded-sm bg-primary" />
            <p className="text-xs font-semibold tracking-wide uppercase">Quant Models Lab — {symbol}</p>
            <span className="text-[10px] text-muted-foreground font-mono">CAPM · Black-Scholes · ARIMA · GARCH(1,1) · ML Ensemble</span>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <label className="flex items-center gap-1">
              <span className="text-muted-foreground">Rf%</span>
              <input type="number" value={riskFree} step={0.25}
                onChange={(e) => setRiskFree(parseFloat(e.target.value) || 0)}
                className="w-14 bg-muted/40 px-1.5 py-0.5 rounded font-mono text-right border border-border/30" />
            </label>
            <label className="flex items-center gap-1">
              <span className="text-muted-foreground">E[Rm]%</span>
              <input type="number" value={expectedMkt} step={0.5}
                onChange={(e) => setExpectedMkt(parseFloat(e.target.value) || 0)}
                className="w-14 bg-muted/40 px-1.5 py-0.5 rounded font-mono text-right border border-border/30" />
            </label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* CAPM */}
        <div className="quant-card">
          <p className="text-xs font-semibold uppercase tracking-wide mb-2 flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-primary" /> CAPM — Capital Asset Pricing Model
          </p>
          <StatRow label="Beta (β)" value={capmRes.beta.toFixed(3)} />
          <StatRow label="Alpha (α)" value={(capmRes.alpha * 100).toFixed(2) + "%"} hint="/năm" />
          <StatRow label="Expected Return E[R]" value={(capmRes.expectedReturn * 100).toFixed(2) + "%"} hint="/năm" />
          <StatRow label="Market Risk Premium" value={(capmRes.riskPremium * 100).toFixed(2) + "%"} />
          <StatRow label="R²" value={capmRes.rSquared.toFixed(3)} />
          <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
            E[R] = Rf + β · (E[Rm] − Rf). β &gt; 1 ⇒ biến động mạnh hơn thị trường; α &gt; 0 ⇒ vượt benchmark sau điều chỉnh rủi ro.
          </p>
        </div>

        {/* Black-Scholes */}
        <div className="quant-card">
          <p className="text-xs font-semibold uppercase tracking-wide mb-2 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-primary" /> Black-Scholes Option Pricing
          </p>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <label className="text-[11px]">
              <span className="text-muted-foreground">Strike (K)</span>
              <input type="number" value={strike} step={0.5}
                onChange={(e) => setStrike(parseFloat(e.target.value) || 0)}
                className="w-full mt-0.5 bg-muted/40 px-2 py-1 rounded font-mono border border-border/30" />
            </label>
            <label className="text-[11px]">
              <span className="text-muted-foreground">Time to expiry (days)</span>
              <input type="number" value={days} step={1} min={1}
                onChange={(e) => setDays(parseInt(e.target.value) || 1)}
                className="w-full mt-0.5 bg-muted/40 px-2 py-1 rounded font-mono border border-border/30" />
            </label>
          </div>
          <StatRow label="Spot (S)" value={fmt(currentPrice)} />
          <StatRow label="Volatility (σ)" value={(annualVol * 100).toFixed(2) + "%"} hint="annualized" />
          <StatRow label="Call price" value={fmt(bs.callPrice)} />
          <StatRow label="Put price" value={fmt(bs.putPrice)} />
          <div className="grid grid-cols-2 gap-x-3 mt-1">
            <StatRow label="Δ Call" value={bs.greeks.deltaCall.toFixed(3)} />
            <StatRow label="Δ Put" value={bs.greeks.deltaPut.toFixed(3)} />
            <StatRow label="Γ" value={bs.greeks.gamma.toFixed(4)} />
            <StatRow label="Vega" value={bs.greeks.vega.toFixed(3)} hint="/1%" />
            <StatRow label="Θ Call" value={bs.greeks.thetaCall.toFixed(3)} hint="/day" />
            <StatRow label="Θ Put" value={bs.greeks.thetaPut.toFixed(3)} hint="/day" />
          </div>
        </div>

        {/* ARIMA / AR(2) */}
        <div className="quant-card">
          <p className="text-xs font-semibold uppercase tracking-wide mb-2">ARIMA(2,0,0) — Autoregressive Returns</p>
          <StatRow label="c (intercept)" value={ar.coefficients[0]?.toExponential(2) || "—"} />
          <StatRow label="φ₁" value={(ar.coefficients[1] ?? 0).toFixed(4)} />
          <StatRow label="φ₂" value={(ar.coefficients[2] ?? 0).toFixed(4)} />
          <StatRow label="Residual σ" value={(ar.residualStd * 100).toFixed(3) + "%"} />
          <div className="h-[140px] mt-2">
            <ResponsiveContainer>
              <LineChart data={ar.forecast.map((v, i) => ({ day: i + 1, ret: v * 100 }))}>
                <XAxis dataKey="day" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} unit="%" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 10 }} />
                <ReferenceLine y={0} stroke="hsl(var(--border))" />
                <Line type="monotone" dataKey="ret" stroke="hsl(var(--primary))" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GARCH */}
        <div className="quant-card">
          <p className="text-xs font-semibold uppercase tracking-wide mb-2">GARCH(1,1) — Volatility Clustering</p>
          <StatRow label="ω (omega)" value={garch.omega.toExponential(3)} />
          <StatRow label="α" value={garch.alpha.toFixed(4)} />
          <StatRow label="β" value={garch.beta.toFixed(4)} />
          <StatRow label="Persistence (α+β)" value={garch.persistence.toFixed(4)} />
          <StatRow label="Unconditional σ" value={(Math.sqrt(garch.unconditionalVar) * Math.sqrt(252) * 100).toFixed(2) + "%"} hint="/năm" />
          <div className="h-[140px] mt-2">
            <ResponsiveContainer>
              <LineChart data={volChartData}>
                <XAxis dataKey="day" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} unit="%" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 10 }} />
                <Line type="monotone" dataKey="annualized" stroke="hsl(var(--chart-2))" strokeWidth={1.5} dot={false} name="Annualized σ%" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ML Ensemble */}
      <div className="quant-card">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <p className="text-xs font-semibold uppercase tracking-wide flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            ML Ensemble Forecast — AR + EMA Momentum + GARCH Volatility
          </p>
          <div className="flex items-center gap-2 text-xs">
            {sigIcon}
            <span className={`font-mono font-semibold ${ml.signal === "BUY" ? "text-green-500" : ml.signal === "SELL" ? "text-red-500" : "text-yellow-500"}`}>
              {ml.signal}
            </span>
            <span className="text-muted-foreground font-mono">score: {ml.score.toFixed(3)}</span>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground mb-2 leading-relaxed">
          Ensemble heuristic mô phỏng output của các mô hình AI/ML (LSTM, Transformer, XGBoost, LightGBM):
          AR(2) + EMA(5/20) momentum cho trend, GARCH(1,1) cho khoảng tin cậy 95%. Để chạy mô hình neural thật,
          kết nối dữ liệu với pipeline Python (statsmodels / scikit-learn / pandas-ta / TA-Lib) qua Edge Function.
        </p>
        <div className="h-[260px]">
          <ResponsiveContainer>
            <ComposedChart data={pricePathData}>
              <XAxis dataKey="day" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} domain={["auto", "auto"]} tickFormatter={(v) => fmt(v)} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 11 }}
                formatter={(v: number) => fmt(v)}
              />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Area type="monotone" dataKey="high" stroke="none" fill="hsl(var(--primary) / 0.12)" name="95% CI upper" />
              <Area type="monotone" dataKey="low" stroke="none" fill="hsl(var(--background))" name="95% CI lower" />
              <Line type="monotone" dataKey="price" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Forecast price" />
              <ReferenceLine y={currentPrice} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" label={{ value: "Spot", fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
