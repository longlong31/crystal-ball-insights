import { useState, useMemo, useCallback } from "react";
import { Briefcase, Play, RotateCcw, TrendingUp, Shield, BarChart3 } from "lucide-react";
import { ScatterChart, Scatter, ResponsiveContainer, XAxis, YAxis, Tooltip, AreaChart, Area, LineChart, Line } from "recharts";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { generateSampleStockData, generateSampleCryptoData, calculateVolatility, calculateSharpeRatio, calculateMaxDrawdown } from "@/lib/technicalIndicators";
import { calculatePortfolioMetrics, generateEfficientFrontier, monteCarloPortfolio, type PortfolioAsset } from "@/lib/portfolioOptimizer";

const PORTFOLIO_ASSETS = [
  { symbol: 'AAPL', name: 'Apple', type: 'stock' },
  { symbol: 'MSFT', name: 'Microsoft', type: 'stock' },
  { symbol: 'NVDA', name: 'NVIDIA', type: 'stock' },
  { symbol: 'BTC', name: 'Bitcoin', type: 'crypto' },
  { symbol: 'ETH', name: 'Ethereum', type: 'crypto' },
  { symbol: 'GOOGL', name: 'Google', type: 'stock' },
];

export default function PortfolioOptimizer() {
  const [weights, setWeights] = useState<Record<string, number>>({
    AAPL: 20, MSFT: 20, NVDA: 15, BTC: 15, ETH: 10, GOOGL: 20
  });
  const [mcResult, setMcResult] = useState<{ finalValues: number[]; paths: number[][] } | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const assets = useMemo((): PortfolioAsset[] => {
    return PORTFOLIO_ASSETS.map(a => {
      const raw = a.type === 'crypto' ? generateSampleCryptoData(a.symbol, 252) : generateSampleStockData(a.symbol, 252);
      const closes = raw.map(d => d.close);
      const returns = closes.slice(1).map((c, i) => (c - closes[i]) / closes[i]);
      const vol = calculateVolatility(returns);
      const expectedReturn = returns.reduce((s, r) => s + r, 0) / returns.length * 252;

      return {
        symbol: a.symbol,
        name: a.name,
        weight: (weights[a.symbol] || 0) / 100,
        returns,
        expectedReturn,
        volatility: vol,
        prices: closes,
      };
    });
  }, [weights]);

  const metrics = useMemo(() => calculatePortfolioMetrics(assets), [assets]);

  const frontier = useMemo(() => generateEfficientFrontier(assets, 200), [assets]);
  const frontierData = frontier.map(p => ({ risk: +(p.risk * 100).toFixed(2), return_: +(p.return_ * 100).toFixed(2), sharpe: p.sharpe }));

  const currentPoint = [{ risk: +(metrics.volatility * 100).toFixed(2), return_: +(metrics.expectedReturn * 100).toFixed(2) }];

  const updateWeight = useCallback((symbol: string, value: number) => {
    setWeights(prev => {
      const newWeights = { ...prev, [symbol]: value };
      const total = Object.values(newWeights).reduce((a, b) => a + b, 0);
      if (total > 100) {
        const others = Object.keys(newWeights).filter(k => k !== symbol);
        const excess = total - 100;
        const otherTotal = others.reduce((a, k) => a + newWeights[k], 0);
        if (otherTotal > 0) {
          others.forEach(k => {
            newWeights[k] = Math.max(0, newWeights[k] - (newWeights[k] / otherTotal) * excess);
          });
        }
      }
      return newWeights;
    });
  }, []);

  const runMonteCarlo = useCallback(() => {
    setIsRunning(true);
    setTimeout(() => {
      const result = monteCarloPortfolio(assets, 5000, 252);
      setMcResult(result);
      setIsRunning(false);
    }, 100);
  }, [assets]);

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-quant-green" /> Portfolio Optimizer
          </h1>
          <p className="text-sm text-muted-foreground">Risk-adjusted allocation & simulation</p>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {[
          { label: 'Expected Return', value: `${(metrics.expectedReturn * 100).toFixed(1)}%`, good: metrics.expectedReturn > 0 },
          { label: 'Volatility', value: `${(metrics.volatility * 100).toFixed(1)}%` },
          { label: 'Sharpe Ratio', value: metrics.sharpeRatio.toFixed(2), good: metrics.sharpeRatio > 1 },
          { label: 'Max Drawdown', value: `${(metrics.maxDrawdown * 100).toFixed(1)}%` },
          { label: 'Sortino', value: metrics.sortino.toFixed(2), good: metrics.sortino > 1 },
        ].map(m => (
          <div key={m.label} className="quant-card text-center py-3">
            <p className="stat-label">{m.label}</p>
            <p className={`stat-value mt-1 ${m.good ? 'ticker-green' : ''}`}>{m.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Allocation Controls */}
        <div className="quant-card">
          <div className="flex items-center justify-between mb-4">
            <p className="stat-label">Asset Allocation</p>
            <span className={`text-xs font-mono ${Math.abs(totalWeight - 100) < 1 ? 'ticker-green' : 'ticker-red'}`}>
              {totalWeight.toFixed(0)}%
            </span>
          </div>
          <div className="space-y-4">
            {PORTFOLIO_ASSETS.map(a => (
              <div key={a.symbol} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium">{a.symbol}</span>
                    <span className="text-muted-foreground">{a.name}</span>
                  </div>
                  <span className="font-mono">{(weights[a.symbol] || 0).toFixed(0)}%</span>
                </div>
                <Slider
                  value={[weights[a.symbol] || 0]}
                  onValueChange={([v]) => updateWeight(a.symbol, v)}
                  max={100}
                  step={1}
                  className="cursor-pointer"
                />
              </div>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <Button onClick={runMonteCarlo} disabled={isRunning} size="sm" className="flex-1">
              <Play className="w-3 h-3 mr-1" />
              {isRunning ? 'Running...' : 'Monte Carlo'}
            </Button>
            <Button onClick={() => setWeights(Object.fromEntries(PORTFOLIO_ASSETS.map(a => [a.symbol, 100 / PORTFOLIO_ASSETS.length])))} variant="outline" size="sm">
              <RotateCcw className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Charts */}
        <div className="lg:col-span-2 space-y-3">
          <Tabs defaultValue="frontier">
            <TabsList className="bg-muted/30 border border-border/30">
              <TabsTrigger value="frontier" className="text-xs">Efficient Frontier</TabsTrigger>
              <TabsTrigger value="montecarlo" className="text-xs">Monte Carlo</TabsTrigger>
              <TabsTrigger value="stress" className="text-xs">Stress Test</TabsTrigger>
            </TabsList>

            <TabsContent value="frontier">
              <div className="quant-card">
                <p className="stat-label mb-2">Risk-Return Frontier (200 Random Portfolios)</p>
                <ResponsiveContainer width="100%" height={320}>
                  <ScatterChart>
                    <XAxis dataKey="risk" name="Risk" unit="%" tick={{ fontSize: 10 }} label={{ value: 'Volatility (%)', position: 'bottom', fontSize: 10, fill: 'hsl(215, 15%, 50%)' }} />
                    <YAxis dataKey="return_" name="Return" unit="%" tick={{ fontSize: 10 }} label={{ value: 'Return (%)', angle: -90, position: 'insideLeft', fontSize: 10, fill: 'hsl(215, 15%, 50%)' }} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(222, 40%, 7%)', border: '1px solid hsl(222, 20%, 14%)', borderRadius: 6, fontSize: 11 }} />
                    <Scatter name="Portfolios" data={frontierData} fill="hsl(185, 80%, 50%)" fillOpacity={0.3} r={3} />
                    <Scatter name="Current" data={currentPoint} fill="hsl(38, 92%, 55%)" r={8} shape="diamond" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="montecarlo">
              <div className="quant-card">
                {mcResult ? (
                  <>
                    <p className="stat-label mb-2">Monte Carlo Simulation — 5,000 Paths × 252 Days</p>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart>
                        <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} />
                        {mcResult.paths.slice(0, 50).map((path, idx) => (
                          <Line
                            key={idx}
                            data={path.map((v, i) => ({ day: i, v }))}
                            dataKey="v"
                            stroke="hsl(185, 80%, 50%)"
                            strokeOpacity={0.1}
                            strokeWidth={0.5}
                            dot={false}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-4 gap-3 mt-3">
                      {(() => {
                        const sorted = [...mcResult.finalValues].sort((a, b) => a - b);
                        const median = sorted[Math.floor(sorted.length / 2)];
                        const p5 = sorted[Math.floor(sorted.length * 0.05)];
                        const p95 = sorted[Math.floor(sorted.length * 0.95)];
                        const mean = sorted.reduce((a, b) => a + b, 0) / sorted.length;
                        return [
                          { label: '5th Percentile', value: `$${(p5 / 1000).toFixed(0)}K` },
                          { label: 'Median', value: `$${(median / 1000).toFixed(0)}K` },
                          { label: 'Mean', value: `$${(mean / 1000).toFixed(0)}K` },
                          { label: '95th Percentile', value: `$${(p95 / 1000).toFixed(0)}K` },
                        ].map(s => (
                          <div key={s.label} className="text-center p-2 rounded bg-muted/20">
                            <p className="stat-label">{s.label}</p>
                            <p className="stat-value mt-1">{s.value}</p>
                          </div>
                        ));
                      })()}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                    <BarChart3 className="w-8 h-8 mb-2 opacity-50" />
                    <p className="text-sm">Run Monte Carlo simulation to see projected outcomes</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="stress">
              <div className="quant-card">
                <p className="stat-label mb-3">Scenario Stress Testing</p>
                <div className="space-y-3">
                  {[
                    { name: 'Market Crash (-30%)', impact: -28.4, color: 'hsl(0, 72%, 55%)' },
                    { name: 'Interest Rate Hike (+200bps)', impact: -12.1, color: 'hsl(38, 92%, 55%)' },
                    { name: 'Tech Sector Rotation', impact: -18.7, color: 'hsl(270, 70%, 60%)' },
                    { name: 'Crypto Winter', impact: -8.3, color: 'hsl(210, 80%, 55%)' },
                    { name: 'Inflation Spike', impact: -15.2, color: 'hsl(25, 95%, 55%)' },
                    { name: 'Bull Market Rally', impact: 22.5, color: 'hsl(142, 76%, 45%)' },
                  ].map(scenario => (
                    <div key={scenario.name} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-48">{scenario.name}</span>
                      <div className="flex-1 h-5 bg-muted/30 rounded-full relative overflow-hidden">
                        <div
                          className="h-full rounded-full absolute"
                          style={{
                            backgroundColor: scenario.color,
                            width: `${Math.abs(scenario.impact)}%`,
                            [scenario.impact >= 0 ? 'left' : 'right']: '50%',
                            opacity: 0.6,
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-px h-full bg-border" />
                        </div>
                      </div>
                      <span className={`text-xs font-mono w-16 text-right ${scenario.impact >= 0 ? 'ticker-green' : 'ticker-red'}`}>
                        {scenario.impact >= 0 ? '+' : ''}{scenario.impact}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
