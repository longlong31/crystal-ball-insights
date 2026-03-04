import { useState, useMemo } from "react";
import { Bitcoin, TrendingUp, TrendingDown, Activity, Zap, Globe, BarChart3 } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, ReferenceLine } from "recharts";
import { generateSampleCryptoData, calculateRSI, calculateVolatility, calculateMACD } from "@/lib/technicalIndicators";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const CRYPTOS = [
  { symbol: 'BTC', name: 'Bitcoin', color: 'hsl(38, 92%, 55%)', dominance: 52.3 },
  { symbol: 'ETH', name: 'Ethereum', color: 'hsl(270, 70%, 60%)', dominance: 17.8 },
  { symbol: 'SOL', name: 'Solana', color: 'hsl(185, 80%, 50%)', dominance: 3.2 },
  { symbol: 'BNB', name: 'BNB', color: 'hsl(38, 70%, 50%)', dominance: 3.8 },
  { symbol: 'XRP', name: 'Ripple', color: 'hsl(210, 80%, 55%)', dominance: 2.9 },
  { symbol: 'ADA', name: 'Cardano', color: 'hsl(210, 70%, 50%)', dominance: 1.4 },
];

function CryptoRow({ symbol, name, color, data }: { symbol: string; name: string; color: string; data: any }) {
  const sparkData = data.closes.slice(-30).map((v: number, i: number) => ({ i, v }));
  return (
    <div className="flex items-center gap-4 p-3 rounded-md hover:bg-muted/30 transition-colors">
      <div className="w-20">
        <span className="font-mono font-medium text-sm">{symbol}</span>
        <p className="text-[10px] text-muted-foreground">{name}</p>
      </div>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height={35}>
          <AreaChart data={sparkData}>
            <defs>
              <linearGradient id={`cg-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="v" stroke={color} fill={`url(#cg-${symbol})`} strokeWidth={1.5} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="text-right w-28">
        <p className="text-sm font-mono">${data.lastPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
        <p className={`text-[10px] font-mono ${data.change >= 0 ? 'ticker-green' : 'ticker-red'}`}>
          {data.change >= 0 ? '+' : ''}{data.change.toFixed(2)}%
        </p>
      </div>
      <div className="text-right w-20 hidden md:block">
        <p className="text-[10px] text-muted-foreground">24h Vol</p>
        <p className="text-xs font-mono">${(data.volume / 1e9).toFixed(1)}B</p>
      </div>
      <div className="text-right w-16 hidden md:block">
        <p className="text-[10px] text-muted-foreground">Vol</p>
        <p className="text-xs font-mono">{(data.vol * 100).toFixed(0)}%</p>
      </div>
    </div>
  );
}

export default function CryptoIntelligence() {
  const [selectedCrypto, setSelectedCrypto] = useState('BTC');

  const allData = useMemo(() => {
    return CRYPTOS.map(c => {
      const raw = generateSampleCryptoData(c.symbol, 365);
      const closes = raw.map(d => d.close);
      const returns = closes.slice(1).map((v, i) => (v - closes[i]) / closes[i]);
      const lastPrice = closes[closes.length - 1];
      const prevPrice = closes[closes.length - 2];
      const change = ((lastPrice - prevPrice) / prevPrice) * 100;
      const vol = calculateVolatility(returns);
      const volume = raw[raw.length - 1].volume;
      return { ...c, closes, returns, lastPrice, change, vol, volume, raw };
    });
  }, []);

  const selectedData = useMemo(() => {
    const crypto = allData.find(c => c.symbol === selectedCrypto)!;
    const closes = crypto.closes;
    const rsi = calculateRSI(closes);
    const macd = calculateMACD(closes);

    const chartData = crypto.raw.map((d, i) => ({
      date: d.date,
      close: d.close,
      volume: d.volume,
      rsi: rsi[i],
      macd: macd[i]?.macd,
      signal: macd[i]?.signal,
      histogram: macd[i]?.histogram,
    }));

    // Market cycle detection - simple moving average crossover
    const sma50 = closes.map((_, i) => i >= 49 ? closes.slice(i - 49, i + 1).reduce((a, b) => a + b, 0) / 50 : NaN);
    const sma200 = closes.map((_, i) => i >= 199 ? closes.slice(i - 199, i + 1).reduce((a, b) => a + b, 0) / 200 : NaN);
    const currentCycle = !isNaN(sma50[sma50.length - 1]) && !isNaN(sma200[sma200.length - 1])
      ? sma50[sma50.length - 1] > sma200[sma200.length - 1] ? 'Bullish' : 'Bearish'
      : 'Neutral';

    return { chartData, rsi: rsi[rsi.length - 1], currentCycle, crypto };
  }, [selectedCrypto, allData]);

  const totalMarketCap = 2.67; // Trillion

  const dominanceData = CRYPTOS.map(c => ({
    name: c.symbol,
    value: c.dominance,
    fill: c.color,
  }));
  dominanceData.push({ name: 'Others', value: 100 - CRYPTOS.reduce((a, b) => a + b.dominance, 0), fill: 'hsl(215, 15%, 30%)' });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Bitcoin className="w-6 h-6 text-quant-amber" /> Crypto Intelligence
          </h1>
          <p className="text-sm text-muted-foreground">Market dominance, volatility & cycle detection</p>
        </div>
        <div className="text-right">
          <p className="stat-label">Total Market Cap</p>
          <p className="text-xl font-mono font-semibold">${totalMarketCap}T</p>
        </div>
      </div>

      {/* Market Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="quant-card lg:col-span-2">
          <p className="stat-label mb-3">Market Overview</p>
          <div className="space-y-1">
            {allData.map(c => (
              <div key={c.symbol} className="cursor-pointer" onClick={() => setSelectedCrypto(c.symbol)}>
                <CryptoRow symbol={c.symbol} name={c.name} color={c.color} data={c} />
              </div>
            ))}
          </div>
        </div>

        <div className="quant-card">
          <p className="stat-label mb-3">Market Dominance</p>
          <div className="flex justify-center">
            <PieChart width={180} height={180}>
              <Pie data={dominanceData} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={80} strokeWidth={0}>
                {dominanceData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </div>
          <div className="space-y-1.5 mt-2">
            {dominanceData.map(d => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.fill }} />
                  <span className="text-muted-foreground">{d.name}</span>
                </div>
                <span className="font-mono">{d.value.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Crypto Detail */}
      <div className="quant-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold">{selectedData.crypto.name}</span>
            <span className="font-mono text-muted-foreground">{selectedCrypto}/USD</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              selectedData.currentCycle === 'Bullish' ? 'bg-quant-green/10 text-quant-green' : 'bg-quant-red/10 text-quant-red'
            }`}>
              {selectedData.currentCycle} Cycle
            </span>
          </div>
          <div className="text-right">
            <p className="text-2xl font-mono font-semibold">${selectedData.crypto.lastPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
            <p className={`text-xs font-mono ${selectedData.crypto.change >= 0 ? 'ticker-green' : 'ticker-red'}`}>
              {selectedData.crypto.change >= 0 ? '+' : ''}{selectedData.crypto.change.toFixed(2)}%
            </p>
          </div>
        </div>

        <Tabs defaultValue="chart">
          <TabsList className="bg-muted/30 border border-border/30">
            <TabsTrigger value="chart" className="text-xs">Price</TabsTrigger>
            <TabsTrigger value="indicators" className="text-xs">Indicators</TabsTrigger>
            <TabsTrigger value="onchain" className="text-xs">On-Chain</TabsTrigger>
          </TabsList>

          <TabsContent value="chart">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={selectedData.chartData}>
                <defs>
                  <linearGradient id="cryptoGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(185, 80%, 50%)" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="hsl(185, 80%, 50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={40} />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(222, 40%, 7%)', border: '1px solid hsl(222, 20%, 14%)', borderRadius: 6, fontSize: 11 }} />
                <Area type="monotone" dataKey="close" stroke="hsl(185, 80%, 50%)" fill="url(#cryptoGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="indicators">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <p className="stat-label mb-2">RSI (14) — {selectedData.rsi?.toFixed(1)}</p>
                <ResponsiveContainer width="100%" height={150}>
                  <LineChart data={selectedData.chartData}>
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <ReferenceLine y={70} stroke="hsl(0, 72%, 55%)" strokeDasharray="3 3" />
                    <ReferenceLine y={30} stroke="hsl(142, 76%, 45%)" strokeDasharray="3 3" />
                    <Line type="monotone" dataKey="rsi" stroke="hsl(270, 70%, 60%)" strokeWidth={1.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div>
                <p className="stat-label mb-2">MACD</p>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={selectedData.chartData}>
                    <ReferenceLine y={0} stroke="hsl(222, 20%, 14%)" />
                    <Bar dataKey="histogram" fill="hsl(185, 80%, 50%)" fillOpacity={0.5} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="onchain">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Active Addresses', value: '1.2M', change: 5.3 },
                { label: 'Hash Rate', value: '623 EH/s', change: 2.1 },
                { label: 'Network Fees', value: '$2.4M', change: -8.5 },
                { label: 'Exchange Outflow', value: '$340M', change: 12.7 },
                { label: 'MVRV Ratio', value: '2.34', change: 1.8 },
                { label: 'NVT Signal', value: '67.2', change: -3.2 },
                { label: 'Realized Cap', value: '$450B', change: 0.9 },
                { label: 'SOPR', value: '1.02', change: 0.5 },
              ].map(m => (
                <div key={m.label} className="p-3 rounded-md bg-muted/20 border border-border/20">
                  <p className="stat-label">{m.label}</p>
                  <p className="stat-value mt-1">{m.value}</p>
                  <p className={`text-[10px] font-mono mt-0.5 ${m.change >= 0 ? 'ticker-green' : 'ticker-red'}`}>
                    {m.change >= 0 ? '+' : ''}{m.change}%
                  </p>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
