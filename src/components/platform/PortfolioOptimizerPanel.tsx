import { useState, useMemo } from "react";
import { ScatterChart, Scatter, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Cell, PieChart, Pie, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import { Loader2, Target, TrendingUp, Shield, Zap } from "lucide-react";

const PIE_COLORS = [
  "hsl(var(--primary))",
  "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6",
  "#06b6d4", "#ec4899", "#f97316",
];

interface AssetData {
  symbol: string;
  returns: number[];
  closes: number[];
}

interface FrontierPoint {
  risk: number;
  return_: number;
  weights: number[];
  sharpe: number;
}

interface OptimalPortfolio {
  weights: { symbol: string; weight: number }[];
  expectedReturn: number;
  volatility: number;
  sharpe: number;
}

interface PortfolioOptimizerPanelProps {
  symbols: string[];
  assetsData: AssetData[];
}

function pearson(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 2) return 0;
  let sx = 0, sy = 0, sxy = 0, sx2 = 0, sy2 = 0;
  for (let i = 0; i < n; i++) {
    sx += x[i]; sy += y[i];
    sxy += x[i] * y[i];
    sx2 += x[i] ** 2; sy2 += y[i] ** 2;
  }
  const d = Math.sqrt((n * sx2 - sx ** 2) * (n * sy2 - sy ** 2));
  return d === 0 ? 0 : (n * sxy - sx * sy) / d;
}

function portfolioStats(
  weights: number[],
  meanReturns: number[],
  covMatrix: number[][],
  riskFreeRate: number = 0.04
): { ret: number; vol: number; sharpe: number } {
  const n = weights.length;
  let ret = 0;
  for (let i = 0; i < n; i++) ret += weights[i] * meanReturns[i];
  
  let variance = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      variance += weights[i] * weights[j] * covMatrix[i][j];
    }
  }
  const vol = Math.sqrt(variance);
  const sharpe = vol === 0 ? 0 : (ret - riskFreeRate) / vol;
  return { ret, vol, sharpe };
}

function buildCovMatrix(assets: AssetData[]): { meanReturns: number[]; covMatrix: number[][] } {
  const n = assets.length;
  const minLen = Math.min(...assets.map(a => a.returns.length));
  
  // Annualized mean returns
  const meanReturns = assets.map(a => {
    const r = a.returns.slice(-minLen);
    return (r.reduce((s, v) => s + v, 0) / r.length) * 252;
  });

  // Annualized covariance matrix
  const dailyMeans = assets.map(a => {
    const r = a.returns.slice(-minLen);
    return r.reduce((s, v) => s + v, 0) / r.length;
  });

  const covMatrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const ri = assets[i].returns.slice(-minLen);
      const rj = assets[j].returns.slice(-minLen);
      let cov = 0;
      for (let k = 0; k < minLen; k++) {
        cov += (ri[k] - dailyMeans[i]) * (rj[k] - dailyMeans[j]);
      }
      covMatrix[i][j] = (cov / (minLen - 1)) * 252;
    }
  }

  return { meanReturns, covMatrix };
}

export function PortfolioOptimizerPanel({ symbols, assetsData }: PortfolioOptimizerPanelProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<{
    frontier: FrontierPoint[];
    optimal: OptimalPortfolio;
    minVol: OptimalPortfolio;
  } | null>(null);

  const canOptimize = assetsData.length >= 2 && assetsData.every(a => a.returns.length >= 30);

  const runOptimization = () => {
    if (!canOptimize) return;
    setIsRunning(true);

    setTimeout(() => {
      const { meanReturns, covMatrix } = buildCovMatrix(assetsData);
      const n = assetsData.length;
      const iterations = 15000;
      const frontier: FrontierPoint[] = [];
      let bestSharpe: FrontierPoint | null = null;
      let bestMinVol: FrontierPoint | null = null;

      for (let iter = 0; iter < iterations; iter++) {
        // Generate random weights summing to 1
        const raw = Array.from({ length: n }, () => Math.random());
        const sum = raw.reduce((a, b) => a + b, 0);
        const weights = raw.map(w => w / sum);

        const { ret, vol, sharpe } = portfolioStats(weights, meanReturns, covMatrix);

        const point: FrontierPoint = { risk: vol, return_: ret, weights, sharpe };
        frontier.push(point);

        if (!bestSharpe || sharpe > bestSharpe.sharpe) bestSharpe = point;
        if (!bestMinVol || vol < bestMinVol.risk) bestMinVol = point;
      }

      const toOptimal = (p: FrontierPoint): OptimalPortfolio => ({
        weights: symbols.map((s, i) => ({ symbol: s, weight: p.weights[i] })),
        expectedReturn: p.return_,
        volatility: p.risk,
        sharpe: p.sharpe,
      });

      setResult({
        frontier: frontier.sort((a, b) => a.risk - b.risk),
        optimal: toOptimal(bestSharpe!),
        minVol: toOptimal(bestMinVol!),
      });
      setIsRunning(false);
    }, 100);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          Tối ưu hóa danh mục (Portfolio Optimization)
        </h3>
        <Button
          size="sm"
          onClick={runOptimization}
          disabled={!canOptimize || isRunning}
          className="text-xs"
        >
          {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Zap className="w-3.5 h-3.5 mr-1" />}
          {isRunning ? "Đang tính..." : "Chạy tối ưu (15K mẫu)"}
        </Button>
      </div>

      {!canOptimize && (
        <p className="text-xs text-muted-foreground">
          Cần ít nhất 2 mã cổ phiếu với đủ dữ liệu lịch sử để chạy tối ưu hóa.
        </p>
      )}

      {result && (
        <>
          {/* Optimal portfolios summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <PortfolioCard
              title="🏆 Max Sharpe Ratio"
              icon={<TrendingUp className="w-4 h-4 text-primary" />}
              portfolio={result.optimal}
              highlight="primary"
            />
            <PortfolioCard
              title="🛡️ Min Volatility"
              icon={<Shield className="w-4 h-4 text-green-500" />}
              portfolio={result.minVol}
              highlight="green"
            />
          </div>

          {/* Efficient Frontier Chart */}
          <div className="quant-card">
            <h4 className="text-xs font-semibold mb-3">Efficient Frontier (15,000 danh mục ngẫu nhiên)</h4>
            <ResponsiveContainer width="100%" height={350}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis
                  dataKey="risk"
                  name="Volatility"
                  type="number"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => `${(v * 100).toFixed(1)}%`}
                  stroke="hsl(var(--muted-foreground))"
                  label={{ value: "Risk (Volatility)", position: "insideBottom", offset: -5, fontSize: 10 }}
                />
                <YAxis
                  dataKey="return_"
                  name="Return"
                  type="number"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => `${(v * 100).toFixed(1)}%`}
                  stroke="hsl(var(--muted-foreground))"
                  label={{ value: "Expected Return", angle: -90, position: "insideLeft", fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                    fontSize: 11,
                  }}
                  formatter={(value: number, name: string) => [
                    `${(value * 100).toFixed(2)}%`,
                    name === "return_" ? "Return" : name === "risk" ? "Volatility" : "Sharpe",
                  ]}
                />
                <Scatter data={result.frontier.filter((_, i) => i % 10 === 0)} fill="hsl(var(--muted-foreground))" opacity={0.3} r={2}>
                  {result.frontier.filter((_, i) => i % 10 === 0).map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={getSharpeColor(entry.sharpe)}
                      opacity={0.5}
                    />
                  ))}
                </Scatter>
                {/* Optimal point */}
                <Scatter
                  data={[{ risk: result.optimal.volatility, return_: result.optimal.expectedReturn }]}
                  fill="hsl(var(--primary))"
                  r={8}
                  shape="star"
                  name="Max Sharpe"
                />
                {/* Min Vol point */}
                <Scatter
                  data={[{ risk: result.minVol.volatility, return_: result.minVol.expectedReturn }]}
                  fill="#22c55e"
                  r={7}
                  shape="diamond"
                  name="Min Vol"
                />
              </ScatterChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-primary inline-block" /> Max Sharpe</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> Min Volatility</span>
              <span>Màu sắc: Sharpe Ratio (đỏ → vàng → xanh)</span>
            </div>
          </div>

          {/* Allocation Pie Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <AllocationPie title="Phân bổ Max Sharpe" weights={result.optimal.weights} />
            <AllocationPie title="Phân bổ Min Volatility" weights={result.minVol.weights} />
          </div>
        </>
      )}
    </div>
  );
}

function PortfolioCard({
  title, icon, portfolio, highlight
}: {
  title: string;
  icon: React.ReactNode;
  portfolio: OptimalPortfolio;
  highlight: string;
}) {
  const sorted = [...portfolio.weights].sort((a, b) => b.weight - a.weight);
  return (
    <div className="quant-card space-y-2">
      <div className="flex items-center gap-2 text-sm font-semibold">{icon} {title}</div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <span className="text-muted-foreground">Return</span>
          <div className="font-mono font-bold text-foreground">{(portfolio.expectedReturn * 100).toFixed(2)}%</div>
        </div>
        <div>
          <span className="text-muted-foreground">Volatility</span>
          <div className="font-mono font-bold text-foreground">{(portfolio.volatility * 100).toFixed(2)}%</div>
        </div>
        <div>
          <span className="text-muted-foreground">Sharpe</span>
          <div className="font-mono font-bold text-foreground">{portfolio.sharpe.toFixed(3)}</div>
        </div>
      </div>
      <div className="space-y-1 pt-1 border-t border-border/30">
        {sorted.map(w => (
          <div key={w.symbol} className="flex items-center justify-between text-xs">
            <span className="font-mono">{w.symbol}</span>
            <div className="flex items-center gap-2">
              <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${w.weight * 100}%` }}
                />
              </div>
              <span className="font-mono w-12 text-right">{(w.weight * 100).toFixed(1)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AllocationPie({ title, weights }: { title: string; weights: { symbol: string; weight: number }[] }) {
  const data = weights
    .filter(w => w.weight > 0.01)
    .map((w, i) => ({ name: w.symbol, value: Math.round(w.weight * 1000) / 10, fill: PIE_COLORS[i % PIE_COLORS.length] }));

  return (
    <div className="quant-card">
      <h4 className="text-xs font-semibold mb-2">{title}</h4>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            innerRadius={40}
            label={({ name, value }) => `${name} ${value}%`}
            labelLine={{ strokeWidth: 1 }}
            fontSize={10}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip formatter={(v: number) => `${v}%`} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function getSharpeColor(sharpe: number): string {
  if (sharpe > 1.5) return "#22c55e";
  if (sharpe > 0.8) return "#84cc16";
  if (sharpe > 0.3) return "#f59e0b";
  if (sharpe > 0) return "#f97316";
  return "#ef4444";
}
