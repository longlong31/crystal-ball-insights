import { useState, useMemo } from "react";
import { TrendingUp, TrendingDown, BarChart3, Activity, Loader2, RefreshCw } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, BarChart, Bar, LineChart, Line, ReferenceLine, ComposedChart } from "recharts";
import { calculateRSI, calculateMACD, calculateEMA, calculateSMA, calculateBollingerBands, calculateVolatility, calculateBeta, calculateSharpeRatio, calculateMaxDrawdown } from "@/lib/technicalIndicators";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useStockQuote, useStockHistory } from "@/hooks/useStockData";

const STOCKS = ['AAPL', 'GOOGL', 'MSFT', 'NVDA', 'TSLA', 'AMZN'];

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
  const [historyRange, setHistoryRange] = useState('1y');

  const { data: quote, isLoading: quoteLoading, error: quoteError, refetch: refetchQuote } = useStockQuote(selected);
  const { data: history, isLoading: historyLoading } = useStockHistory(selected, historyRange);

  const analysis = useMemo(() => {
    if (!history || !history.closes || history.closes.length < 30) return null;

    const closes = history.closes.filter(c => c > 0);
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

    const chartData = history.dates.map((date, i) => ({
      date,
      close: history.closes[i],
      volume: history.volumes[i],
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

    return { chartData, vol, beta, sharpe, maxDD, rsi: rsi[rsi.length - 1] || 50 };
  }, [history]);

  const isLoading = quoteLoading || historyLoading;

  if (quoteError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <p className="text-destructive">Không thể tải dữ liệu cổ phiếu: {(quoteError as Error).message}</p>
        <Button variant="outline" onClick={() => refetchQuote()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Thử lại
        </Button>
      </div>
    );
  }

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
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div>
            {quote ? (
              <>
                <h1 className="text-xl font-semibold">{quote.name}</h1>
                <p className="text-xs text-muted-foreground">{quote.sector} · {quote.marketCap}</p>
              </>
            ) : (
              <div className="space-y-1">
                <div className="h-5 w-32 bg-muted animate-pulse rounded" />
                <div className="h-3 w-20 bg-muted animate-pulse rounded" />
              </div>
            )}
          </div>
          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
        </div>
        <div className="flex items-baseline gap-4">
          {quote ? (
            <>
              <span className="text-3xl font-mono font-semibold">${quote.currentPrice.toFixed(2)}</span>
              <span className={`text-sm font-mono ${quote.priceChange1d >= 0 ? 'ticker-green' : 'ticker-red'}`}>
                {quote.priceChange1d >= 0 ? '+' : ''}{quote.priceChange1d.toFixed(2)}%
              </span>
            </>
          ) : (
            <div className="h-8 w-28 bg-muted animate-pulse rounded" />
          )}
        </div>
      </div>

      {/* Quick Stats */}
      {quote && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          {[
            { label: '1D', value: quote.priceChange1d, fmt: (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%` },
            { label: '1W', value: quote.priceChange1w, fmt: (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%` },
            { label: '1M', value: quote.priceChange1m, fmt: (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%` },
            { label: 'RSI(14)', value: analysis?.rsi ?? 0, fmt: (v: number) => v.toFixed(1), neutral: true },
            { label: 'Beta', value: analysis?.beta ?? 0, fmt: (v: number) => v.toFixed(2), neutral: true },
            { label: 'Vol', value: (analysis?.vol ?? 0) * 100, fmt: (v: number) => `${v.toFixed(1)}%`, neutral: true },
          ].map((stat) => (
            <div key={stat.label} className="quant-card text-center py-3">
              <p className="stat-label">{stat.label}</p>
              <p className={`stat-value mt-1 ${!stat.neutral ? (stat.value >= 0 ? 'ticker-green' : 'ticker-red') : ''}`}>
                {stat.fmt(stat.value)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Range selector */}
      <div className="flex gap-1">
        {['5d', '1mo', '3mo', '6mo', '1y', '2y'].map(r => (
          <button
            key={r}
            onClick={() => setHistoryRange(r)}
            className={`px-3 py-1 text-xs rounded font-mono transition-all ${
              historyRange === r
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
            }`}
          >
            {r.toUpperCase()}
          </button>
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
            {analysis ? (
              <>
                <ResponsiveContainer width="100%" height={350}>
                  <ComposedChart data={analysis.chartData}>
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={Math.floor(analysis.chartData.length / 8)} />
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
                <ResponsiveContainer width="100%" height={80}>
                  <BarChart data={analysis.chartData}>
                    <XAxis dataKey="date" hide />
                    <Bar dataKey="volume" fill="hsl(185, 80%, 50%)" fillOpacity={0.2} />
                  </BarChart>
                </ResponsiveContainer>
              </>
            ) : (
              <div className="flex items-center justify-center h-[350px]">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="technicals">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="quant-card">
              <p className="stat-label mb-2">RSI (14)</p>
              {analysis ? (
                <>
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
                </>
              ) : (
                <div className="flex items-center justify-center h-[180px]"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
              )}
            </div>

            <div className="quant-card">
              <p className="stat-label mb-2">MACD (12, 26, 9)</p>
              {analysis ? (
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
              ) : (
                <div className="flex items-center justify-center h-[180px]"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
              )}
            </div>

            {analysis && (
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
            )}
          </div>
        </TabsContent>

        <TabsContent value="fundamentals">
          <div className="quant-card">
            {quote ? (
              <>
                <p className="stat-label mb-4">Financial Ratios — {selected} ({quote.name})</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                  <RatioBar label="P/E Ratio" value={quote.pe} max={80} />
                  <RatioBar label="P/B Ratio" value={quote.pb} max={60} />
                  <RatioBar label="P/S Ratio" value={quote.ps} max={40} />
                  <RatioBar label="ROE" value={quote.roe} max={200} unit="%" />
                  <RatioBar label="D/E Ratio" value={quote.deRatio} max={3} />
                  <RatioBar label="Current Ratio" value={quote.currentRatio} max={5} />
                  <RatioBar label="Div. Yield" value={quote.divYield} max={5} unit="%" />
                  <RatioBar label="EPS (TTM)" value={quote.eps} max={15} unit="$" />
                </div>

                <div className="mt-6 p-4 rounded-md bg-muted/20 border border-border/20">
                  <p className="text-xs font-medium mb-2">Growth & Market Info</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-muted-foreground">Revenue Growth</span>
                      <p className={`font-mono mt-0.5 ${quote.revenueGrowth >= 0 ? 'ticker-green' : 'ticker-red'}`}>
                        {quote.revenueGrowth >= 0 ? '+' : ''}{quote.revenueGrowth.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Earnings Growth</span>
                      <p className={`font-mono mt-0.5 ${quote.earningsGrowth >= 0 ? 'ticker-green' : 'ticker-red'}`}>
                        {quote.earningsGrowth >= 0 ? '+' : ''}{quote.earningsGrowth.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">52W High</span>
                      <p className="font-mono mt-0.5">${quote.fiftyTwoWeekHigh.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">52W Low</span>
                      <p className="font-mono mt-0.5">${quote.fiftyTwoWeekLow.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-40"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
