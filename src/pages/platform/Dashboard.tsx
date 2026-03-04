import { useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, DollarSign, Activity, BarChart3, Zap, Shield, Brain } from "lucide-react";
import { Link } from "react-router-dom";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { generateSampleStockData, generateSampleCryptoData, calculateRSI, calculateSharpeRatio, calculateMaxDrawdown, calculateVolatility } from "@/lib/technicalIndicators";

const TICKER_COLORS = {
  up: "hsl(142, 76%, 45%)",
  down: "hsl(0, 72%, 55%)",
  neutral: "hsl(215, 15%, 50%)",
};

function MetricCard({ label, value, change, icon: Icon, color }: { label: string; value: string; change?: number; icon: any; color: string }) {
  return (
    <div className="quant-card flex items-start justify-between">
      <div>
        <p className="stat-label">{label}</p>
        <p className="stat-value mt-1">{value}</p>
        {change !== undefined && (
          <div className={`flex items-center gap-1 mt-1 text-xs font-mono ${change >= 0 ? 'ticker-green' : 'ticker-red'}`}>
            {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{change >= 0 ? '+' : ''}{change.toFixed(2)}%</span>
          </div>
        )}
      </div>
      <div className="p-2 rounded-md" style={{ backgroundColor: `${color}15` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
    </div>
  );
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const chartData = data.slice(-30).map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height={40}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id={`spark-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} fill={`url(#spark-${color})`} strokeWidth={1.5} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default function Dashboard() {
  const marketData = useMemo(() => {
    const stocks = ['AAPL', 'GOOGL', 'MSFT', 'NVDA', 'TSLA', 'AMZN'];
    const cryptos = ['BTC', 'ETH', 'SOL', 'BNB'];

    const stockData = stocks.map(s => {
      const data = generateSampleStockData(s, 90);
      const closes = data.map(d => d.close);
      const lastPrice = closes[closes.length - 1];
      const prevPrice = closes[closes.length - 2];
      const change = ((lastPrice - prevPrice) / prevPrice) * 100;
      return { symbol: s, price: lastPrice, change, closes };
    });

    const cryptoData = cryptos.map(c => {
      const data = generateSampleCryptoData(c, 90);
      const closes = data.map(d => d.close);
      const lastPrice = closes[closes.length - 1];
      const prevPrice = closes[closes.length - 2];
      const change = ((lastPrice - prevPrice) / prevPrice) * 100;
      return { symbol: c, price: lastPrice, change, closes };
    });

    return { stockData, cryptoData };
  }, []);

  const portfolioValue = 2847650;
  const dailyPnL = 12453.20;
  const dailyPnLPct = 0.44;

  const allocationData = [
    { name: 'US Stocks', value: 45, color: 'hsl(185, 80%, 50%)' },
    { name: 'Crypto', value: 20, color: 'hsl(270, 70%, 60%)' },
    { name: 'Bonds', value: 15, color: 'hsl(142, 76%, 45%)' },
    { name: 'Commodities', value: 10, color: 'hsl(38, 92%, 55%)' },
    { name: 'Cash', value: 10, color: 'hsl(215, 15%, 50%)' },
  ];

  const performanceData = Array.from({ length: 90 }, (_, i) => ({
    day: i,
    value: 2500000 + Math.sin(i / 10) * 150000 + i * 3000 + (Math.random() - 0.5) * 50000,
  }));

  const modules = [
    { path: '/platform/stocks', icon: TrendingUp, title: 'Stock Analysis', desc: 'Fundamental & technical analysis', color: 'hsl(185, 80%, 50%)' },
    { path: '/platform/crypto', icon: Zap, title: 'Crypto Intelligence', desc: 'Market dominance & cycles', color: 'hsl(270, 70%, 60%)' },
    { path: '/platform/portfolio', icon: BarChart3, title: 'Portfolio Optimizer', desc: 'Risk-adjusted allocation', color: 'hsl(142, 76%, 45%)' },
    { path: '/platform/risk', icon: Shield, title: 'Risk Engine', desc: 'VaR & correlation analysis', color: 'hsl(38, 92%, 55%)' },
    { path: '/platform/ai-insights', icon: Brain, title: 'AI Insights', desc: 'Pattern & anomaly detection', color: 'hsl(0, 72%, 55%)' },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Investment Intelligence Overview</p>
        </div>
        <div className="text-right">
          <p className="stat-label">Portfolio Value</p>
          <p className="text-2xl font-semibold font-mono">${portfolioValue.toLocaleString()}</p>
          <p className={`text-xs font-mono ${dailyPnL >= 0 ? 'ticker-green' : 'ticker-red'}`}>
            {dailyPnL >= 0 ? '+' : ''}${dailyPnL.toLocaleString()} ({dailyPnLPct >= 0 ? '+' : ''}{dailyPnLPct}%)
          </p>
        </div>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Sharpe Ratio" value="1.84" change={5.2} icon={Activity} color="hsl(185, 80%, 50%)" />
        <MetricCard label="Max Drawdown" value="-12.3%" icon={TrendingDown} color="hsl(0, 72%, 55%)" />
        <MetricCard label="VaR (95%)" value="$34,250" icon={Shield} color="hsl(38, 92%, 55%)" />
        <MetricCard label="Daily P&L" value={`$${dailyPnL.toLocaleString()}`} change={dailyPnLPct} icon={DollarSign} color="hsl(142, 76%, 45%)" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Performance Chart */}
        <div className="quant-card lg:col-span-2">
          <p className="stat-label mb-3">Portfolio Performance (90D)</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={performanceData}>
              <defs>
                <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(185, 80%, 50%)" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="hsl(185, 80%, 50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" hide />
              <YAxis hide domain={['dataMin', 'dataMax']} />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(222, 40%, 7%)', border: '1px solid hsl(222, 20%, 14%)', borderRadius: 6, fontSize: 12 }}
                formatter={(v: number) => [`$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, 'Value']}
              />
              <Area type="monotone" dataKey="value" stroke="hsl(185, 80%, 50%)" fill="url(#perfGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Allocation */}
        <div className="quant-card">
          <p className="stat-label mb-3">Asset Allocation</p>
          <div className="flex items-center justify-center">
            <PieChart width={160} height={160}>
              <Pie data={allocationData} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={70} strokeWidth={0}>
                {allocationData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </div>
          <div className="space-y-1.5 mt-2">
            {allocationData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
                <span className="font-mono">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Market Tickers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Stocks */}
        <div className="quant-card">
          <p className="stat-label mb-3">Equity Markets</p>
          <div className="space-y-2">
            {marketData.stockData.map((stock) => (
              <div key={stock.symbol} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-medium w-14">{stock.symbol}</span>
                  <MiniSparkline data={stock.closes} color={stock.change >= 0 ? TICKER_COLORS.up : TICKER_COLORS.down} />
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono">${stock.price.toFixed(2)}</p>
                  <p className={`text-[10px] font-mono ${stock.change >= 0 ? 'ticker-green' : 'ticker-red'}`}>
                    {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Crypto */}
        <div className="quant-card">
          <p className="stat-label mb-3">Crypto Markets</p>
          <div className="space-y-2">
            {marketData.cryptoData.map((crypto) => (
              <div key={crypto.symbol} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-medium w-14">{crypto.symbol}</span>
                  <MiniSparkline data={crypto.closes} color={crypto.change >= 0 ? TICKER_COLORS.up : TICKER_COLORS.down} />
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono">${crypto.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                  <p className={`text-[10px] font-mono ${crypto.change >= 0 ? 'ticker-green' : 'ticker-red'}`}>
                    {crypto.change >= 0 ? '+' : ''}{crypto.change.toFixed(2)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Module Quick Access */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {modules.map((mod) => (
          <Link key={mod.path} to={mod.path}>
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              className="quant-card text-center cursor-pointer hover:border-primary/30 transition-colors"
            >
              <div className="mx-auto w-10 h-10 rounded-lg flex items-center justify-center mb-2" style={{ backgroundColor: `${mod.color}15` }}>
                <mod.icon className="w-5 h-5" style={{ color: mod.color }} />
              </div>
              <p className="text-xs font-medium">{mod.title}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{mod.desc}</p>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}
