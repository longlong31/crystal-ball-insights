import { useState, useMemo, useCallback } from "react";
import { TrendingUp, TrendingDown, BarChart3, Activity, ArrowUpDown } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, BarChart, Bar, LineChart, Line, ReferenceLine, ComposedChart } from "recharts";
import { generateSampleStockData, calculateRSI, calculateMACD, calculateEMA, calculateSMA, calculateBollingerBands, calculateVolatility, calculateBeta, calculateSharpeRatio, calculateMaxDrawdown } from "@/lib/technicalIndicators";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STOCKS = ['AAPL', 'GOOGL', 'MSFT', 'NVDA', 'TSLA', 'AMZN'];

const STOCK_INFO: Record<string, { name: string; sector: string; marketCap: string }> = {
  AAPL: { name: 'Apple Inc.', sector: 'Technology', marketCap: '$2.96T' },
  GOOGL: { name: 'Alphabet Inc.', sector: 'Technology', marketCap: '$1.78T' },
  MSFT: { name: 'Microsoft Corp.', sector: 'Technology', marketCap: '$3.12T' },
  NVDA: { name: 'NVIDIA Corp.', sector: 'Technology', marketCap: '$3.08T' },
  TSLA: { name: 'Tesla Inc.', sector: 'Consumer Discretionary', marketCap: '$780B' },
  AMZN: { name: 'Amazon.com Inc.', sector: 'Consumer Discretionary', marketCap: '$1.93T' },
};

const RATIOS: Record<string, { pe: number; pb: number; ps: number; roe: number; deRatio: number; currentRatio: number; divYield: number; eps: number }> = {
  AAPL: { pe: 29.5, pb: 47.3, ps: 7.8, roe: 160.1, deRatio: 1.87, currentRatio: 0.99, divYield: 0.55, eps: 6.42 },
  GOOGL: { pe: 24.8, pb: 6.9, ps: 6.5, roe: 28.7, deRatio: 0.08, currentRatio: 2.10, divYield: 0, eps: 5.80 },
  MSFT: { pe: 35.2, pb: 12.8, ps: 12.1, roe: 38.4, deRatio: 0.35, currentRatio: 1.77, divYield: 0.72, eps: 11.86 },
  NVDA: { pe: 65.4, pb: 52.1, ps: 37.2, roe: 115.0, deRatio: 0.41, currentRatio: 4.17, divYield: 0.02, eps: 12.96 },
  TSLA: { pe: 62.8, pb: 13.4, ps: 8.1, roe: 22.3, deRatio: 0.11, currentRatio: 1.73, divYield: 0, eps: 3.91 },
  AMZN: { pe: 58.3, pb: 8.7, ps: 3.1, roe: 19.8, deRatio: 0.55, currentRatio: 1.05, divYield: 0, eps: 3.25 },
};

function RatioBar({ label, value, max, unit = '' }: { label: string; value: number; max: number; unit?: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono">{value.toFixed(2)}{unit}</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary/60 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function StockAnalysis() {
  const [selected, setSelected] = useState('AAPL');

  const analysis = useMemo(() => {
    const data = generateSampleStockData(selected, 252);
    const closes = data.map(d => d.close);
    const returns = closes.slice(1).map((c, i) => (c - closes[i]) / closes[i]);
    const marketReturns = returns.map(r => r * (0.8 + Math.random() * 0.4));

    const rsi = calculateRSI(closes);
    const macd = calculateMACD(closes);
    const ema12 = calculateEMA(closes, 12);
    const ema26 = calculateEMA(closes, 26);
    const ema50 = calculateEMA(closes, 50);
    const sma20 = calculateSMA(closes, 20);
    const bb = calculateBollingerBands(closes);
    const vol = calculateVolatility(returns);
    const beta = calculateBeta(returns, marketReturns);
    const sharpe = calculateSharpeRatio(returns);
    const maxDD = calculateMaxDrawdown(closes);

    const chartData = data.map((d, i) => ({
      date: d.date,
      close: d.close,
      volume: d.volume,
      rsi: rsi[i],
      macd: macd[i]?.macd,
      signal: macd[i]?.signal,
      histogram: macd[i]?.histogram,
      ema12: ema12[i],
      ema26: ema26[i],
      ema50: ema50[i],
      sma20: sma20[i],
      bbUpper: bb[i]?.upper,
      bbLower: bb[i]?.lower,
      bbMiddle: bb[i]?.middle,
    }));

    const lastPrice = closes[closes.length - 1];
    const prevPrice = closes[closes.length - 2];
    const dailyChange = ((lastPrice - prevPrice) / prevPrice) * 100;
    const weeklyChange = ((lastPrice - closes[closes.length - 6]) / closes[closes.length - 6]) * 100;
    const monthlyChange = ((lastPrice - closes[closes.length - 22]) / closes[closes.length - 22]) * 100;

    return { chartData, lastPrice, dailyChange, weeklyChange, monthlyChange, vol, beta, sharpe, maxDD, rsi: rsi[rsi.length - 1] };
  }, [selected]);

  const info = STOCK_INFO[selected];
  const ratios = RATIOS[selected];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger className="w-40 bg-card border-border/30">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STOCKS.map(s => (
                <SelectItem key={s} value={s}>
                  <span className="font-mono font-medium">{s}</span>
                  <span className="text-muted-foreground ml-2 text-xs">{STOCK_INFO[s].name}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div>
            <h1 className="text-xl font-semibold">{info.name}</h1>
            <p className="text-xs text-muted-foreground">{info.sector} · {info.marketCap}</p>
          </div>
        </div>
        <div className="flex items-baseline gap-4">
          <span className="text-3xl font-mono font-semibold">${analysis.lastPrice.toFixed(2)}</span>
          <span className={`text-sm font-mono ${analysis.dailyChange >= 0 ? 'ticker-green' : 'ticker-red'}`}>
            {analysis.dailyChange >= 0 ? '+' : ''}{analysis.dailyChange.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        {[
          { label: '1D', value: analysis.dailyChange, fmt: (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%` },
          { label: '1W', value: analysis.weeklyChange, fmt: (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%` },
          { label: '1M', value: analysis.monthlyChange, fmt: (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%` },
          { label: 'RSI(14)', value: analysis.rsi, fmt: (v: number) => v.toFixed(1), neutral: true },
          { label: 'Beta', value: analysis.beta, fmt: (v: number) => v.toFixed(2), neutral: true },
          { label: 'Vol', value: analysis.vol * 100, fmt: (v: number) => `${v.toFixed(1)}%`, neutral: true },
        ].map((stat) => (
          <div key={stat.label} className="quant-card text-center py-3">
            <p className="stat-label">{stat.label}</p>
            <p className={`stat-value mt-1 ${!stat.neutral ? (stat.value >= 0 ? 'ticker-green' : 'ticker-red') : ''}`}>
              {stat.fmt(stat.value)}
            </p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="price" className="w-full">
        <TabsList className="bg-muted/30 border border-border/30">
          <TabsTrigger value="price" className="text-xs">Price & Overlays</TabsTrigger>
          <TabsTrigger value="technicals" className="text-xs">Indicators</TabsTrigger>
          <TabsTrigger value="fundamentals" className="text-xs">Fundamentals</TabsTrigger>
        </TabsList>

        <TabsContent value="price">
          <div className="quant-card space-y-4">
            <p className="stat-label">Price Chart with Bollinger Bands & EMAs</p>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={analysis.chartData}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={30} />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(222, 40%, 7%)', border: '1px solid hsl(222, 20%, 14%)', borderRadius: 6, fontSize: 11 }} />
                <Area type="monotone" dataKey="bbUpper" stroke="none" fill="hsl(185, 80%, 50%)" fillOpacity={0.05} />
                <Area type="monotone" dataKey="bbLower" stroke="none" fill="hsl(185, 80%, 50%)" fillOpacity={0.05} />
                <Line type="monotone" dataKey="bbUpper" stroke="hsl(185, 80%, 50%)" strokeWidth={0.5} dot={false} strokeDasharray="3 3" />
                <Line type="monotone" dataKey="bbLower" stroke="hsl(185, 80%, 50%)" strokeWidth={0.5} dot={false} strokeDasharray="3 3" />
                <Line type="monotone" dataKey="ema12" stroke="hsl(38, 92%, 55%)" strokeWidth={1} dot={false} />
                <Line type="monotone" dataKey="ema50" stroke="hsl(270, 70%, 60%)" strokeWidth={1} dot={false} />
                <Line type="monotone" dataKey="close" stroke="hsl(185, 80%, 50%)" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>

            {/* Volume */}
            <ResponsiveContainer width="100%" height={80}>
              <BarChart data={analysis.chartData}>
                <XAxis dataKey="date" hide />
                <Bar dataKey="volume" fill="hsl(185, 80%, 50%)" fillOpacity={0.2} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        <TabsContent value="technicals">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* RSI */}
            <div className="quant-card">
              <p className="stat-label mb-2">RSI (14)</p>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={analysis.chartData}>
                  <XAxis dataKey="date" hide />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <ReferenceLine y={70} stroke="hsl(0, 72%, 55%)" strokeDasharray="3 3" />
                  <ReferenceLine y={30} stroke="hsl(142, 76%, 45%)" strokeDasharray="3 3" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(222, 40%, 7%)', border: '1px solid hsl(222, 20%, 14%)', borderRadius: 6, fontSize: 11 }} />
                  <Line type="monotone" dataKey="rsi" stroke="hsl(270, 70%, 60%)" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>Oversold (&lt;30)</span>
                <span className="font-mono">Current: {analysis.rsi.toFixed(1)}</span>
                <span>Overbought (&gt;70)</span>
              </div>
            </div>

            {/* MACD */}
            <div className="quant-card">
              <p className="stat-label mb-2">MACD (12, 26, 9)</p>
              <ResponsiveContainer width="100%" height={180}>
                <ComposedChart data={analysis.chartData}>
                  <XAxis dataKey="date" hide />
                  <YAxis tick={{ fontSize: 10 }} />
                  <ReferenceLine y={0} stroke="hsl(222, 20%, 14%)" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(222, 40%, 7%)', border: '1px solid hsl(222, 20%, 14%)', borderRadius: 6, fontSize: 11 }} />
                  <Bar dataKey="histogram" fill="hsl(185, 80%, 50%)" fillOpacity={0.4} />
                  <Line type="monotone" dataKey="macd" stroke="hsl(185, 80%, 50%)" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="signal" stroke="hsl(0, 72%, 55%)" strokeWidth={1} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Risk Metrics */}
            <div className="quant-card lg:col-span-2">
              <p className="stat-label mb-3">Risk & Performance Metrics</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Sharpe Ratio', value: analysis.sharpe.toFixed(2) },
                  { label: 'Max Drawdown', value: `${(analysis.maxDD * 100).toFixed(1)}%` },
                  { label: 'Annualized Vol', value: `${(analysis.vol * 100).toFixed(1)}%` },
                  { label: 'Beta', value: analysis.beta.toFixed(2) },
                ].map((m) => (
                  <div key={m.label} className="text-center p-3 rounded-md bg-muted/30">
                    <p className="stat-label">{m.label}</p>
                    <p className="stat-value mt-1">{m.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="fundamentals">
          <div className="quant-card">
            <p className="stat-label mb-4">Financial Ratios — {selected}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
              <RatioBar label="P/E Ratio" value={ratios.pe} max={80} />
              <RatioBar label="P/B Ratio" value={ratios.pb} max={60} />
              <RatioBar label="P/S Ratio" value={ratios.ps} max={40} />
              <RatioBar label="ROE" value={ratios.roe} max={200} unit="%" />
              <RatioBar label="D/E Ratio" value={ratios.deRatio} max={3} />
              <RatioBar label="Current Ratio" value={ratios.currentRatio} max={5} />
              <RatioBar label="Div. Yield" value={ratios.divYield} max={5} unit="%" />
              <RatioBar label="EPS (TTM)" value={ratios.eps} max={15} unit="$" />
            </div>

            {/* Earnings summary */}
            <div className="mt-6 p-4 rounded-md bg-muted/20 border border-border/20">
              <p className="text-xs font-medium mb-2">Earnings Summary</p>
              <div className="grid grid-cols-4 gap-4 text-xs">
                <div><span className="text-muted-foreground">Q4 EPS</span><p className="font-mono mt-0.5">${ratios.eps.toFixed(2)}</p></div>
                <div><span className="text-muted-foreground">Revenue Growth</span><p className="font-mono mt-0.5 ticker-green">+8.2%</p></div>
                <div><span className="text-muted-foreground">Earnings Beat</span><p className="font-mono mt-0.5 ticker-green">4/4</p></div>
                <div><span className="text-muted-foreground">Next Earnings</span><p className="font-mono mt-0.5">Apr 24</p></div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
