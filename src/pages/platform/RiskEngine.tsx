import { useMemo } from "react";
import { ShieldAlert, AlertTriangle, TrendingDown, Activity } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area, ScatterChart, Scatter, Cell } from "recharts";
import { generateSampleStockData, generateSampleCryptoData, calculateVaR, calculateCVaR, calculateVolatility, calculateCorrelationMatrix } from "@/lib/technicalIndicators";
import { detectRegimeShift } from "@/lib/portfolioOptimizer";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const ASSETS = ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'BTC', 'ETH'];

export default function RiskEngine() {
  const { assetData, correlationData, varData, regimeShifts, returnsDistribution } = useMemo(() => {
    const all = ASSETS.map(symbol => {
      const isCrypto = ['BTC', 'ETH'].includes(symbol);
      const raw = isCrypto ? generateSampleCryptoData(symbol, 365) : generateSampleStockData(symbol, 252);
      const closes = raw.map(d => d.close);
      const returns = closes.slice(1).map((c, i) => (c - closes[i]) / closes[i]);
      const vol = calculateVolatility(returns);
      const var95 = calculateVaR(returns, 0.95);
      const var99 = calculateVaR(returns, 0.99);
      const cvar95 = calculateCVaR(returns, 0.95);
      return { symbol, returns, vol, var95, var99, cvar95, closes };
    });

    const correlationData = calculateCorrelationMatrix(all.map(a => ({ name: a.symbol, returns: a.returns })));

    const varData = all.map(a => ({
      symbol: a.symbol,
      var95: +(a.var95 * 100).toFixed(2),
      var99: +(a.var99 * 100).toFixed(2),
      cvar95: +(a.cvar95 * 100).toFixed(2),
      vol: +(a.vol * 100).toFixed(1),
    }));

    // Regime shifts for BTC
    const btcData = all.find(a => a.symbol === 'BTC')!;
    const regimeShifts = detectRegimeShift(btcData.returns, 30);

    // Returns distribution histogram for portfolio
    const portfolioReturns = all[0].returns.map((_, i) => {
      return all.reduce((sum, a) => sum + (a.returns[i] || 0) / all.length, 0);
    });
    const bins = 40;
    const minR = Math.min(...portfolioReturns);
    const maxR = Math.max(...portfolioReturns);
    const binSize = (maxR - minR) / bins;
    const histogram: { bin: string; count: number; isVar: boolean }[] = [];
    const varThreshold = -calculateVaR(portfolioReturns, 0.95);

    for (let i = 0; i < bins; i++) {
      const lo = minR + i * binSize;
      const hi = lo + binSize;
      const count = portfolioReturns.filter(r => r >= lo && r < hi).length;
      histogram.push({
        bin: `${(lo * 100).toFixed(1)}%`,
        count,
        isVar: lo < varThreshold,
      });
    }

    return { assetData: all, correlationData, varData, regimeShifts, returnsDistribution: histogram };
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-quant-amber" /> Risk Engine
        </h1>
        <p className="text-sm text-muted-foreground">Value-at-Risk, correlation analysis & regime detection</p>
      </div>

      {/* VaR Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {[
          { label: 'Portfolio VaR (95%)', value: '2.34%', icon: AlertTriangle, color: 'hsl(38, 92%, 55%)' },
          { label: 'Portfolio CVaR (95%)', value: '3.67%', icon: TrendingDown, color: 'hsl(0, 72%, 55%)' },
          { label: 'Regime', value: regimeShifts.length > 0 ? regimeShifts[regimeShifts.length - 1].type.replace('_', ' ') : 'Stable', icon: Activity, color: 'hsl(185, 80%, 50%)' },
        ].map(m => (
          <div key={m.label} className="quant-card flex items-start justify-between">
            <div>
              <p className="stat-label">{m.label}</p>
              <p className="stat-value mt-1">{m.value}</p>
            </div>
            <div className="p-2 rounded-md" style={{ backgroundColor: `${m.color}15` }}>
              <m.icon className="w-4 h-4" style={{ color: m.color }} />
            </div>
          </div>
        ))}
      </div>

      <Tabs defaultValue="var">
        <TabsList className="bg-muted/30 border border-border/30">
          <TabsTrigger value="var" className="text-xs">VaR Analysis</TabsTrigger>
          <TabsTrigger value="correlation" className="text-xs">Correlation Matrix</TabsTrigger>
          <TabsTrigger value="distribution" className="text-xs">Returns Distribution</TabsTrigger>
          <TabsTrigger value="regime" className="text-xs">Regime Detection</TabsTrigger>
        </TabsList>

        <TabsContent value="var">
          <div className="quant-card">
            <p className="stat-label mb-3">Value-at-Risk by Asset</p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={varData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 10 }} unit="%" />
                <YAxis type="category" dataKey="symbol" tick={{ fontSize: 11 }} width={50} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(222, 40%, 7%)', border: '1px solid hsl(222, 20%, 14%)', borderRadius: 6, fontSize: 11 }} />
                <Bar dataKey="var95" name="VaR 95%" fill="hsl(38, 92%, 55%)" fillOpacity={0.7} radius={[0, 4, 4, 0]} />
                <Bar dataKey="cvar95" name="CVaR 95%" fill="hsl(0, 72%, 55%)" fillOpacity={0.7} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        <TabsContent value="correlation">
          <div className="quant-card">
            <p className="stat-label mb-3">Correlation Matrix</p>
            <div className="overflow-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr>
                    <th className="p-2 text-left text-muted-foreground"></th>
                    {correlationData.labels.map(l => (
                      <th key={l} className="p-2 text-center text-muted-foreground">{l}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {correlationData.matrix.map((row, i) => (
                    <tr key={i}>
                      <td className="p-2 font-medium">{correlationData.labels[i]}</td>
                      {row.map((val, j) => {
                        const abs = Math.abs(val);
                        const color = val > 0
                          ? `hsl(142, 76%, ${90 - abs * 50}%)`
                          : `hsl(0, 72%, ${90 - abs * 50}%)`;
                        return (
                          <td
                            key={j}
                            className="p-2 text-center"
                            style={{ backgroundColor: i === j ? 'transparent' : `${color}20`, color: i === j ? 'inherit' : color }}
                          >
                            {val.toFixed(2)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="distribution">
          <div className="quant-card">
            <p className="stat-label mb-3">Portfolio Returns Distribution (VaR tail highlighted)</p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={returnsDistribution}>
                <XAxis dataKey="bin" tick={{ fontSize: 9 }} interval={4} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(222, 40%, 7%)', border: '1px solid hsl(222, 20%, 14%)', borderRadius: 6, fontSize: 11 }} />
                <Bar dataKey="count">
                  {returnsDistribution.map((entry, i) => (
                    <Cell key={i} fill={entry.isVar ? 'hsl(0, 72%, 55%)' : 'hsl(185, 80%, 50%)'} fillOpacity={entry.isVar ? 0.8 : 0.4} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        <TabsContent value="regime">
          <div className="quant-card">
            <p className="stat-label mb-3">Market Regime Shift Detection (BTC)</p>
            {regimeShifts.length > 0 ? (
              <div className="space-y-2">
                {regimeShifts.slice(-10).map((shift, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded bg-muted/20 border border-border/20">
                    <div className={`w-2 h-2 rounded-full ${
                      shift.type === 'bull' ? 'bg-quant-green' :
                      shift.type === 'bear' ? 'bg-quant-red' :
                      shift.type === 'high_vol' ? 'bg-quant-amber' : 'bg-quant-cyan'
                    }`} />
                    <span className="text-xs font-medium capitalize">{shift.type.replace('_', ' ')} Regime</span>
                    <span className="text-xs text-muted-foreground">Day {shift.date}</span>
                    <div className="flex-1" />
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-muted-foreground">Confidence:</span>
                      <div className="w-16 h-1.5 bg-muted rounded-full">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${shift.confidence * 100}%` }} />
                      </div>
                      <span className="text-[10px] font-mono">{(shift.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No significant regime shifts detected in current window</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
