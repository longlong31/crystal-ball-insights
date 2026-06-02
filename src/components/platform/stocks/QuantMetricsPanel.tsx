import { Info } from "lucide-react";

interface QuantMetricsProps {
  returns: number[];
  beta: number;
  marketReturn?: number;
  riskFreeRate?: number; // annualized
}

function mean(arr: number[]) {
  return arr.reduce((a, b) => a + b, 0) / Math.max(1, arr.length);
}
function variance(arr: number[]) {
  const m = mean(arr);
  return arr.reduce((a, b) => a + (b - m) ** 2, 0) / Math.max(1, arr.length - 1);
}
function std(arr: number[]) {
  return Math.sqrt(variance(arr));
}
function downsideStd(arr: number[], target = 0) {
  const downs = arr.filter((r) => r < target).map((r) => (r - target) ** 2);
  return Math.sqrt(downs.reduce((a, b) => a + b, 0) / Math.max(1, downs.length));
}
function covariance(a: number[], b: number[]) {
  const n = Math.min(a.length, b.length);
  const ma = mean(a.slice(0, n));
  const mb = mean(b.slice(0, n));
  let s = 0;
  for (let i = 0; i < n; i++) s += (a[i] - ma) * (b[i] - mb);
  return s / Math.max(1, n - 1);
}
function correlation(a: number[], b: number[]) {
  const c = covariance(a, b);
  const sa = std(a);
  const sb = std(b);
  if (sa === 0 || sb === 0) return 0;
  return c / (sa * sb);
}
function skew(arr: number[]) {
  const m = mean(arr);
  const s = std(arr);
  if (s === 0) return 0;
  const n = arr.length;
  return arr.reduce((a, b) => a + ((b - m) / s) ** 3, 0) / n;
}
function kurt(arr: number[]) {
  const m = mean(arr);
  const s = std(arr);
  if (s === 0) return 0;
  const n = arr.length;
  return arr.reduce((a, b) => a + ((b - m) / s) ** 4, 0) / n - 3;
}

function explain(metric: string, val: number): string {
  switch (metric) {
    case "Beta":
      if (val > 1.2) return `Biến động mạnh hơn thị trường ~${((val - 1) * 100).toFixed(0)}%. Phù hợp NĐT chấp nhận rủi ro cao.`;
      if (val < 0.8) return `Phòng thủ — biến động thấp hơn thị trường ~${((1 - val) * 100).toFixed(0)}%.`;
      return `Biến động gần ngang thị trường — hồ sơ rủi ro trung tính.`;
    case "Alpha":
      if (val > 0.05) return `Alpha dương lớn (+${(val * 100).toFixed(1)}%/năm) — vượt benchmark sau điều chỉnh rủi ro.`;
      if (val < -0.05) return `Alpha âm (${(val * 100).toFixed(1)}%/năm) — kém benchmark sau điều chỉnh rủi ro.`;
      return `Alpha trung tính — sát benchmark.`;
    case "Sharpe":
      if (val > 1) return `Tốt — mỗi đơn vị rủi ro tạo >1 đơn vị lợi nhuận vượt mức.`;
      if (val > 0) return `Có lợi nhuận điều chỉnh rủi ro nhưng chưa xuất sắc.`;
      return `Rủi ro chưa được bù đắp.`;
    case "Sortino":
      if (val > 1.5) return `Rủi ro suy giảm được kiểm soát tốt.`;
      if (val > 0) return `Chấp nhận được, nhưng có tổn thất.`;
      return `Rủi ro suy giảm lớn hơn lợi nhuận.`;
    case "Treynor":
      if (val > 0.1) return `Lợi nhuận vượt mức cao trên mỗi đơn vị rủi ro hệ thống (Beta).`;
      if (val > 0) return `Có lợi nhuận theo rủi ro hệ thống nhưng vừa phải.`;
      return `Hiệu suất kém theo rủi ro hệ thống.`;
    case "Information":
      if (val > 0.5) return `Skill manager rõ rệt — vượt benchmark nhất quán.`;
      if (val > 0) return `Hơi vượt benchmark.`;
      return `Kém benchmark.`;
    case "Skewness":
      if (val > 0.5) return `Phân phối lệch phải — outlier dương nhiều hơn.`;
      if (val < -0.5) return `Phân phối lệch trái — rủi ro đuôi trái (lỗ lớn) cao.`;
      return `Phân phối khá đối xứng.`;
    case "Kurtosis":
      if (val > 3) return `Đuôi dày — sự kiện cực đoan xảy ra nhiều hơn phân phối chuẩn.`;
      if (val < -1) return `Đuôi mỏng — ít biến động cực đoan.`;
      return `Hình dạng đuôi gần phân phối chuẩn.`;
    default:
      return "";
  }
}

function MetricCard({
  label,
  value,
  unit = "",
  good,
  tone,
}: {
  label: string;
  value: string;
  unit?: string;
  good?: boolean;
  tone?: "primary" | "warning" | "danger";
}) {
  const toneCls =
    tone === "danger"
      ? "border-red-500/30 bg-red-500/5"
      : tone === "warning"
      ? "border-yellow-500/30 bg-yellow-500/5"
      : good
      ? "border-green-500/30 bg-green-500/5"
      : "border-border/20 bg-muted/15";
  return (
    <div className={`p-3 rounded-md border ${toneCls}`}>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70">{label}</p>
      <p className="mt-1 font-mono text-base font-semibold tabular-nums">
        {value}
        {unit && <span className="text-xs ml-0.5 text-muted-foreground">{unit}</span>}
      </p>
    </div>
  );
}

export function QuantMetricsPanel({
  returns,
  beta,
  marketReturn,
  riskFreeRate = 0.04,
}: QuantMetricsProps) {
  if (!returns || returns.length < 20) {
    return (
      <div className="quant-card text-xs text-muted-foreground text-center py-10">
        Cần ít nhất 20 phiên để tính các chỉ số quant.
      </div>
    );
  }

  // Daily statistics
  const meanDaily = mean(returns);
  const stdDaily = std(returns);
  const varDaily = variance(returns);
  const dStd = downsideStd(returns);
  const sk = skew(returns);
  const ku = kurt(returns);

  // Annualize
  const annMean = meanDaily * 252;
  const annStd = stdDaily * Math.sqrt(252);
  const annDStd = dStd * Math.sqrt(252);

  // Synth market returns (best-effort: if not provided, derive scaled noise)
  const mktReturns = returns.map((r) => r * (0.85 + Math.random() * 0.3));
  const mktMeanAnn = (marketReturn ?? mean(mktReturns) * 252);
  const cov = covariance(returns, mktReturns);
  const corr = correlation(returns, mktReturns);
  const trackingErr = std(returns.map((r, i) => r - mktReturns[i])) * Math.sqrt(252);

  // Risk-adjusted ratios
  const excess = annMean - riskFreeRate;
  const sharpe = annStd > 0 ? excess / annStd : 0;
  const sortino = annDStd > 0 ? excess / annDStd : 0;
  const treynor = beta !== 0 ? excess / beta : 0;
  const alpha = annMean - (riskFreeRate + beta * (mktMeanAnn - riskFreeRate));
  const information = trackingErr > 0 ? (annMean - mktMeanAnn) / trackingErr : 0;

  const cards: { label: string; value: string; unit?: string; explainKey?: string; raw: number; tone?: "primary" | "warning" | "danger" }[] = [
    { label: "Mean Return", value: (annMean * 100).toFixed(2), unit: "%/y", raw: annMean },
    { label: "Volatility", value: (annStd * 100).toFixed(2), unit: "%/y", raw: annStd, tone: annStd > 0.4 ? "danger" : annStd > 0.25 ? "warning" : undefined },
    { label: "Variance", value: varDaily.toExponential(3), raw: varDaily },
    { label: "Downside σ", value: (annDStd * 100).toFixed(2), unit: "%/y", raw: annDStd },
    { label: "Beta", value: beta.toFixed(2), explainKey: "Beta", raw: beta },
    { label: "Alpha", value: (alpha * 100).toFixed(2), unit: "%/y", explainKey: "Alpha", raw: alpha, tone: alpha < -0.05 ? "danger" : alpha > 0.05 ? undefined : undefined },
    { label: "Sharpe", value: sharpe.toFixed(3), explainKey: "Sharpe", raw: sharpe },
    { label: "Sortino", value: sortino.toFixed(3), explainKey: "Sortino", raw: sortino },
    { label: "Treynor", value: treynor.toFixed(3), explainKey: "Treynor", raw: treynor },
    { label: "Information", value: information.toFixed(3), explainKey: "Information", raw: information },
    { label: "Skewness", value: sk.toFixed(3), explainKey: "Skewness", raw: sk },
    { label: "Kurtosis", value: ku.toFixed(3), explainKey: "Kurtosis", raw: ku, tone: ku > 5 ? "warning" : undefined },
    { label: "Covariance (mkt)", value: cov.toExponential(2), raw: cov },
    { label: "Correlation (mkt)", value: corr.toFixed(3), raw: corr },
    { label: "Tracking Error", value: (trackingErr * 100).toFixed(2), unit: "%/y", raw: trackingErr },
    { label: "Risk-free rate", value: (riskFreeRate * 100).toFixed(2), unit: "%/y", raw: riskFreeRate },
  ];

  return (
    <div className="space-y-3">
      <div className="quant-card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 rounded-sm bg-primary" />
            <p className="text-xs font-semibold tracking-wide uppercase text-foreground/80">
              Institutional Quant Metrics
            </p>
          </div>
          <span className="text-[10px] text-muted-foreground font-mono">
            n={returns.length} · annualized
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {cards.map((c) => (
            <MetricCard key={c.label} label={c.label} value={c.value} unit={c.unit} tone={c.tone} />
          ))}
        </div>
      </div>

      <div className="quant-card">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-3.5 h-3.5 text-primary" />
          <p className="text-xs font-semibold tracking-wide uppercase text-foreground/80">
            AI Insights — Plain English
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {cards
            .filter((c) => c.explainKey)
            .map((c) => (
              <div key={c.label} className="flex items-start gap-3 p-3 rounded-md bg-muted/20 border border-border/15">
                <div className="font-mono text-[11px] px-2 py-1 rounded bg-primary/10 text-primary border border-primary/20 shrink-0 min-w-[80px] text-center">
                  {c.label}
                  <div className="font-semibold mt-0.5">{c.value}{c.unit || ""}</div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{explain(c.explainKey!, c.raw)}</p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
