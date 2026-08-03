import { useMemo, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, DollarSign, Activity, BarChart3, Zap, Shield, Brain, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";
import { generateSampleStockData, calculateSharpeRatio, calculateMaxDrawdown, calculateVolatility, calculateVaR } from "@/lib/technicalIndicators";
import { useCryptoMarkets, useCryptoGlobal } from "@/hooks/useMarketData";
import { useLanguage } from "@/contexts/LanguageContext";
import { WatchlistPanel } from "@/components/platform/WatchlistPanel";
import { FearGreedGauge } from "@/components/platform/FearGreedGauge";

const Market3DUniverse = lazy(() => import("@/components/platform/Market3DUniverse"));
const CapitalFlowBoard = lazy(() => import("@/components/platform/CapitalFlowBoard"));

function PanelSkeleton({ height }: { height: number }) {
  return (
    <div className="quant-card flex items-center justify-center" style={{ height }}>
      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
    </div>
  );
}

const TICKER_COLORS = {
  up: "hsl(142, 76%, 45%)",
  down: "hsl(0, 72%, 55%)",
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
          <linearGradient id={`spark-${color.replace(/[^a-z0-9]/gi, '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} fill={`url(#spark-${color.replace(/[^a-z0-9]/gi, '')})`} strokeWidth={1.5} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default function Dashboard() {
  const { language } = useLanguage();
  const { data: cryptoMarkets, isLoading: cryptoLoading } = useCryptoMarkets(["BTC", "ETH", "SOL", "BNB"]);
  const { data: globalData } = useCryptoGlobal();

  const stockData = useMemo(() => {
    const stocks = [
      { symbol: 'VCB.VN', label: 'VCB', base: 88 },
      { symbol: 'FPT.VN', label: 'FPT', base: 125 },
      { symbol: 'HPG.VN', label: 'HPG', base: 27 },
      { symbol: 'VNM.VN', label: 'VNM', base: 72 },
      { symbol: 'MWG.VN', label: 'MWG', base: 55 },
      { symbol: 'TCB.VN', label: 'TCB', base: 35 },
      { symbol: 'VIC.VN', label: 'VIC', base: 42 },
      { symbol: 'SSI.VN', label: 'SSI', base: 32 },
    ];
    return stocks.map(s => {
      const data = generateSampleStockData(s.symbol, 90);
      const closes = data.map(d => d.close);
      // Scale to realistic VN price range (x1000 VND)
      const scale = s.base / (closes[0] || 100);
      const scaledCloses = closes.map(c => +(c * scale).toFixed(1));
      const lastPrice = scaledCloses[scaledCloses.length - 1];
      const prevPrice = scaledCloses[scaledCloses.length - 2];
      const change = ((lastPrice - prevPrice) / prevPrice) * 100;
      return { symbol: s.label, price: lastPrice, change, closes: scaledCloses, isVN: true };
    });
  }, []);

  // Portfolio metrics from stock data
  const portfolioMetrics = useMemo(() => {
    const allReturns = stockData.flatMap(s => {
      const c = s.closes;
      return c.slice(1).map((v, i) => (v - c[i]) / c[i]);
    });
    const avgReturns = stockData[0].closes.slice(1).map((_, i) =>
      stockData.reduce((sum, s) => sum + ((s.closes[i + 1] - s.closes[i]) / s.closes[i]), 0) / stockData.length
    );
    return {
      sharpe: calculateSharpeRatio(avgReturns),
      maxDD: calculateMaxDrawdown(stockData[0].closes),
      var95: calculateVaR(avgReturns, 0.95),
    };
  }, [stockData]);

  const portfolioValue = 2847650;
  const dailyPnL = 12453.20;
  const dailyPnLPct = 0.44;

  const allocationData = [
    { name: language === 'vi' ? 'Cổ phiếu VN' : 'VN Stocks', value: 40, color: 'hsl(0, 72%, 55%)' },
    { name: language === 'vi' ? 'Cổ phiếu Mỹ' : 'US Stocks', value: 25, color: 'hsl(185, 80%, 50%)' },
    { name: 'Crypto', value: 15, color: 'hsl(270, 70%, 60%)' },
    { name: language === 'vi' ? 'Trái phiếu' : 'Bonds', value: 10, color: 'hsl(142, 76%, 45%)' },
    { name: language === 'vi' ? 'Hàng hóa' : 'Commodities', value: 5, color: 'hsl(38, 92%, 55%)' },
    { name: language === 'vi' ? 'Tiền mặt' : 'Cash', value: 5, color: 'hsl(215, 15%, 50%)' },
  ];

  const performanceData = Array.from({ length: 90 }, (_, i) => ({
    day: i,
    value: 2500000 + Math.sin(i / 10) * 150000 + i * 3000 + (Math.random() - 0.5) * 50000,
  }));

  const modules = [
    { path: '/platform/stocks', icon: TrendingUp, title: language === 'vi' ? 'Cổ phiếu' : 'Stocks', desc: language === 'vi' ? 'Phân tích kỹ thuật & cơ bản' : 'Technical & fundamental', color: 'hsl(185, 80%, 50%)' },
    { path: '/platform/crypto', icon: Zap, title: 'Crypto', desc: language === 'vi' ? 'Dữ liệu thời gian thực' : 'Real-time data', color: 'hsl(270, 70%, 60%)' },
    { path: '/platform/portfolio', icon: BarChart3, title: language === 'vi' ? 'Danh mục' : 'Portfolio', desc: language === 'vi' ? 'Tối ưu phân bổ' : 'Optimization', color: 'hsl(142, 76%, 45%)' },
    { path: '/platform/risk', icon: Shield, title: language === 'vi' ? 'Rủi ro' : 'Risk', desc: 'VaR & correlation', color: 'hsl(38, 92%, 55%)' },
    { path: '/platform/ai-insights', icon: Brain, title: 'AI Insights', desc: language === 'vi' ? 'Nhận diện mô hình' : 'Pattern detection', color: 'hsl(0, 72%, 55%)' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {language === 'vi' ? 'Tổng quan đầu tư thông minh' : 'Investment Intelligence Overview'}
          </p>
        </div>
        <div className="text-right">
          <p className="stat-label">{language === 'vi' ? 'Giá trị danh mục' : 'Portfolio Value'}</p>
          <p className="text-2xl font-semibold font-mono">${portfolioValue.toLocaleString()}</p>
          <p className={`text-xs font-mono ${dailyPnL >= 0 ? 'ticker-green' : 'ticker-red'}`}>
            {dailyPnL >= 0 ? '+' : ''}${dailyPnL.toLocaleString()} ({dailyPnLPct >= 0 ? '+' : ''}{dailyPnLPct}%)
          </p>
        </div>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Sharpe Ratio" value={portfolioMetrics.sharpe.toFixed(2)} change={5.2} icon={Activity} color="hsl(185, 80%, 50%)" />
        <MetricCard label="Max Drawdown" value={`${(portfolioMetrics.maxDD * 100).toFixed(1)}%`} icon={TrendingDown} color="hsl(0, 72%, 55%)" />
        <MetricCard label="VaR (95%)" value={`${(portfolioMetrics.var95 * 100).toFixed(2)}%`} icon={Shield} color="hsl(38, 92%, 55%)" />
        <MetricCard label="Daily P&L" value={`$${dailyPnL.toLocaleString()}`} change={dailyPnLPct} icon={DollarSign} color="hsl(142, 76%, 45%)" />
      </div>

      {/* 3D market universe + realtime capital flow */}
      <div className="space-y-3">
        <Suspense fallback={<PanelSkeleton height={452} />}>
          <Market3DUniverse />
        </Suspense>
        <Suspense fallback={<PanelSkeleton height={420} />}>
          <CapitalFlowBoard />
        </Suspense>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        <div className="quant-card lg:col-span-2">
          <p className="stat-label mb-3">{language === 'vi' ? 'Hiệu suất danh mục (90 ngày)' : 'Portfolio Performance (90D)'}</p>
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

        {/* Fear & Greed Gauge */}
        <FearGreedGauge />

        <div className="quant-card">
          <p className="stat-label mb-3">{language === 'vi' ? 'Phân bổ tài sản' : 'Asset Allocation'}</p>
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
        <div className="quant-card">
         <p className="stat-label mb-3">{language === 'vi' ? 'Thị trường cổ phiếu VN' : 'VN Equity Markets'}</p>
          <div className="space-y-2">
            {stockData.map((stock) => (
              <div key={stock.symbol} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-medium w-14">{stock.symbol}</span>
                  <MiniSparkline data={stock.closes} color={stock.change >= 0 ? TICKER_COLORS.up : TICKER_COLORS.down} />
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono">{stock.price.toFixed(1)}</p>
                  <p className={`text-[10px] font-mono ${stock.change >= 0 ? 'ticker-green' : 'ticker-red'}`}>
                    {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="quant-card">
          <p className="stat-label mb-3">
            {language === 'vi' ? 'Thị trường Crypto' : 'Crypto Markets'}
            <span className="text-[10px] ml-2 text-primary font-normal">LIVE</span>
          </p>
          {cryptoLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-2">
              {cryptoMarkets?.map((crypto) => (
                <div key={crypto.symbol} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 w-14">
                      <img src={crypto.image} alt={crypto.name} className="w-5 h-5 rounded-full" />
                      <span className="font-mono text-sm font-medium">{crypto.symbol}</span>
                    </div>
                    {crypto.sparkline7d.length > 0 && (
                      <MiniSparkline
                        data={crypto.sparkline7d.filter((_, i) => i % 4 === 0)}
                        color={crypto.priceChangePercentage24h >= 0 ? TICKER_COLORS.up : TICKER_COLORS.down}
                      />
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono">${crypto.currentPrice.toLocaleString(undefined, { maximumFractionDigits: crypto.currentPrice < 1 ? 4 : 2 })}</p>
                    <p className={`text-[10px] font-mono ${crypto.priceChangePercentage24h >= 0 ? 'ticker-green' : 'ticker-red'}`}>
                      {crypto.priceChangePercentage24h >= 0 ? '+' : ''}{crypto.priceChangePercentage24h?.toFixed(2)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Watchlist */}
      <WatchlistPanel
        currentPrices={Object.fromEntries([
          ...stockData.map(s => [s.symbol, s.price]),
          ...(cryptoMarkets?.map(c => [c.symbol.toUpperCase(), c.currentPrice]) || []),
        ])}
      />

      {/* Module Quick Access — rich dashboard cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="stat-label">{language === 'vi' ? 'Module nền tảng' : 'Platform Modules'}</p>
          <span className="text-[10px] font-mono text-muted-foreground">{modules.length} {language === 'vi' ? 'mô-đun trực tiếp' : 'live modules'}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {modules.map((mod, idx) => {
            const trend = stockData[idx % stockData.length]?.closes || [];
            return (
              <Link key={mod.path} to={mod.path}>
                <motion.div
                  whileHover={{ y: -3 }}
                  className="quant-card group cursor-pointer relative overflow-hidden hover:border-primary/40 transition-all h-full"
                >
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                    style={{ background: `radial-gradient(circle at top right, ${mod.color}20, transparent 60%)` }}
                  />
                  <div className="relative flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${mod.color}18`, boxShadow: `0 0 20px ${mod.color}25` }}>
                      <mod.icon className="w-5 h-5" style={{ color: mod.color }} />
                    </div>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-green-500/10 text-green-500 flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />LIVE
                    </span>
                  </div>
                  <p className="relative text-sm font-semibold">{mod.title}</p>
                  <p className="relative text-[11px] text-muted-foreground mt-0.5">{mod.desc}</p>
                  <div className="relative mt-2 -mx-1">
                    <MiniSparkline data={trend} color={mod.color} />
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
