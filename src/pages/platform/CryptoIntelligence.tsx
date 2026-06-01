import { useState, useMemo } from "react";
import { Bitcoin, Loader2, RefreshCw, TrendingUp, TrendingDown, Activity, BarChart3, Search, Crown, Coins } from "lucide-react";
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell,
  BarChart, Bar, LineChart, Line, ReferenceLine, ComposedChart, CartesianGrid,
} from "recharts";
import {
  calculateRSI, calculateVolatility, calculateMACD, calculateEMA, calculateBollingerBands, calculateMaxDrawdown,
} from "@/lib/technicalIndicators";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTopCryptoMarkets, useCryptoGlobal, useCryptoHistory, useUsdVndRate } from "@/hooks/useMarketData";
import { useLanguage } from "@/contexts/LanguageContext";
import { CandlestickChart, Candle } from "@/components/platform/CandlestickChart";
import { CryptoChatPanel } from "@/components/platform/CryptoChatPanel";

const CRYPTO_COLORS: Record<string, string> = {
  BTC: "hsl(38, 92%, 55%)",
  ETH: "hsl(270, 70%, 60%)",
  SOL: "hsl(185, 80%, 50%)",
  BNB: "hsl(38, 70%, 50%)",
  XRP: "hsl(210, 80%, 55%)",
  ADA: "hsl(210, 70%, 50%)",
};

/** Synthesize OHLC from a close-price series (CoinGecko free tier returns prices only). */
function synthesizeOHLC(prices: [number, number][], volumes: [number, number][]): Candle[] {
  if (!prices?.length) return [];
  const out: Candle[] = [];
  for (let i = 0; i < prices.length; i++) {
    const [ts, close] = prices[i];
    const prevClose = i === 0 ? close : prices[i - 1][1];
    const open = prevClose;
    // Estimate H/L using a small intrabar range proportional to move + noise
    const move = Math.abs(close - open);
    const noise = Math.max(close, open) * 0.004;
    const high = Math.max(open, close) + move * 0.35 + noise;
    const low = Math.min(open, close) - move * 0.35 - noise;
    out.push({
      date: new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      open, high, low, close,
      volume: volumes?.[i]?.[1] ?? 0,
    });
  }
  return out;
}

const fmtPrice = (v: number) =>
  v >= 1000
    ? `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
    : `$${v.toLocaleString(undefined, { maximumFractionDigits: v < 1 ? 4 : 2 })}`;

const fmtVnd = (usd: number, rate: number) => {
  const v = usd * rate;
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)} tỷ ₫`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)} triệu ₫`;
  if (v >= 1e3) return `${v.toLocaleString("vi-VN", { maximumFractionDigits: 0 })} ₫`;
  return `${v.toLocaleString("vi-VN", { maximumFractionDigits: 2 })} ₫`;
};

export default function CryptoIntelligence() {
  const [selectedCrypto, setSelectedCrypto] = useState("BTC");
  const [historyDays, setHistoryDays] = useState("90");
  const [search, setSearch] = useState("");
  const [showVnd, setShowVnd] = useState(false);
  const { language } = useLanguage();

  const { data: cryptoMarkets, isLoading: marketsLoading, refetch: refetchMarkets } = useTopCryptoMarkets(100);
  const { data: globalData } = useCryptoGlobal();
  const { data: fxData } = useUsdVndRate();
  const usdVnd = fxData?.usdVnd ?? 25400;
  // Resolve CoinGecko id for selected symbol (fallback to symbol if not found)
  const selectedMarketEarly = cryptoMarkets?.find((c) => c.symbol === selectedCrypto);
  const selectedCoinId = selectedMarketEarly?.id || selectedCrypto.toLowerCase();
  const { data: historyData, isLoading: historyLoading } = useCryptoHistory(selectedCoinId, historyDays);

  /** Build full candle dataset with indicators */
  const candles: Candle[] = useMemo(() => {
    if (!historyData?.prices) return [];
    const base = synthesizeOHLC(historyData.prices, historyData.totalVolumes || historyData.volumes);
    const closes = base.map((d) => d.close);
    const ema12 = calculateEMA(closes, 12);
    const ema26 = calculateEMA(closes, 26);
    const ema50 = calculateEMA(closes, 50);
    const bb = calculateBollingerBands(closes, 20, 2);
    return base.map((d, i) => ({
      ...d,
      ema12: isNaN(ema12[i]) ? undefined : ema12[i],
      ema26: isNaN(ema26[i]) ? undefined : ema26[i],
      ema50: isNaN(ema50[i]) ? undefined : ema50[i],
      bbUpper: isNaN(bb[i]?.upper) ? undefined : bb[i].upper,
      bbMiddle: isNaN(bb[i]?.middle) ? undefined : bb[i].middle,
      bbLower: isNaN(bb[i]?.lower) ? undefined : bb[i].lower,
    }));
  }, [historyData]);

  /** Technical indicator series for the secondary panels */
  const tech = useMemo(() => {
    if (!candles.length) return null;
    const closes = candles.map((c) => c.close);
    const returns = closes.slice(1).map((c, i) => (c - closes[i]) / closes[i]);
    const rsi = calculateRSI(closes);
    const macd = calculateMACD(closes);
    const vol = calculateVolatility(returns);
    const maxDD = calculateMaxDrawdown(closes);
    const sma50 = closes.map((_, i) =>
      i >= 49 ? closes.slice(i - 49, i + 1).reduce((a, b) => a + b, 0) / 50 : NaN
    );
    const lastSma50 = sma50.filter((v) => !isNaN(v));
    const cycle =
      lastSma50.length > 0 && closes[closes.length - 1] > lastSma50[lastSma50.length - 1]
        ? "Bullish"
        : "Bearish";

    // Drawdown series
    let peak = closes[0];
    const drawdown = closes.map((p) => {
      if (p > peak) peak = p;
      return ((p - peak) / peak) * 100;
    });

    // Returns histogram (20 bins)
    const bins = 20;
    const rmin = Math.min(...returns);
    const rmax = Math.max(...returns);
    const w = (rmax - rmin) / bins || 1;
    const hist = Array.from({ length: bins }, (_, i) => ({
      bin: ((rmin + i * w + w / 2) * 100).toFixed(2) + "%",
      count: 0,
      mid: rmin + i * w + w / 2,
    }));
    for (const r of returns) {
      const idx = Math.min(bins - 1, Math.max(0, Math.floor((r - rmin) / w)));
      hist[idx].count++;
    }

    const series = candles.map((d, i) => ({
      date: d.date,
      close: d.close,
      rsi: rsi[i],
      macd: macd[i]?.macd,
      signal: macd[i]?.signal,
      histogram: macd[i]?.histogram,
      drawdown: drawdown[i],
    }));

    return { rsi, macd, vol, maxDD, cycle, series, returns, hist };
  }, [candles]);

  const selectedMarket = cryptoMarkets?.find((c) => c.symbol === selectedCrypto);

  const dominanceData = useMemo(() => {
    if (!globalData?.marketCapPercentage) return [];
    const entries = Object.entries(globalData.marketCapPercentage).sort(([, a], [, b]) => b - a).slice(0, 6);
    const topTotal = entries.reduce((a, [, v]) => a + v, 0);
    const colors = ["hsl(38, 92%, 55%)", "hsl(270, 70%, 60%)", "hsl(185, 80%, 50%)", "hsl(38, 70%, 50%)", "hsl(210, 80%, 55%)", "hsl(210, 70%, 50%)"];
    const result = entries.map(([name, value], i) => ({
      name: name.toUpperCase(),
      value: +value.toFixed(1),
      fill: colors[i] || "hsl(215, 15%, 30%)",
    }));
    if (topTotal < 100) result.push({ name: "Others", value: +(100 - topTotal).toFixed(1), fill: "hsl(215, 15%, 30%)" });
    return result;
  }, [globalData]);

  if (marketsLoading && !cryptoMarkets) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">
          {language === "vi" ? "Đang tải dữ liệu thị trường..." : "Loading market data..."}
        </span>
      </div>
    );
  }

  const rsiLast = tech?.rsi[tech.rsi.length - 1];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Bitcoin className="w-6 h-6 text-quant-amber" /> Crypto Intelligence
          </h1>
          <p className="text-sm text-muted-foreground">
            {language === "vi" ? "Phân tích chuyên sâu · Real-time từ CoinGecko" : "Pro-grade analytics · Real-time from CoinGecko"}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant={showVnd ? "default" : "outline"}
            size="sm"
            onClick={() => setShowVnd((v) => !v)}
            title={`1 USD ≈ ${usdVnd.toLocaleString("vi-VN")} ₫`}
          >
            <Coins className="w-3 h-3 mr-1" />
            {showVnd ? "USD + VND" : "USD only"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetchMarkets()}>
            <RefreshCw className="w-3 h-3 mr-1" />
            {language === "vi" ? "Làm mới" : "Refresh"}
          </Button>
          <div className="text-right">
            <p className="stat-label">Total Market Cap</p>
            <p className="text-xl font-mono font-semibold">
              ${globalData ? (globalData.totalMarketCap / 1e12).toFixed(2) : "—"}T
            </p>
            {globalData && (
              <p className={`text-[10px] font-mono ${globalData.marketCapChangePercentage24h >= 0 ? "ticker-green" : "ticker-red"}`}>
                {globalData.marketCapChangePercentage24h >= 0 ? "+" : ""}
                {globalData.marketCapChangePercentage24h?.toFixed(2)}% 24h
              </p>
            )}
            <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
              1 USD ≈ {usdVnd.toLocaleString("vi-VN")} ₫
            </p>
          </div>
        </div>
      </div>

      {/* Top 10 cards */}
      <div className="quant-card">
        <div className="flex items-center justify-between mb-3">
          <p className="stat-label flex items-center gap-2">
            <Crown className="w-3.5 h-3.5 text-quant-amber" />
            {language === "vi" ? "TOP 10 VỐN HÓA" : "TOP 10 BY MARKET CAP"}
            <span className="text-[10px] ml-1 text-primary font-normal">LIVE</span>
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {cryptoMarkets?.slice(0, 10).map((c, idx) => {
            const isSelected = selectedCrypto === c.symbol;
            const up = (c.priceChangePercentage24h ?? 0) >= 0;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCrypto(c.symbol)}
                className={`relative text-left p-2.5 rounded-lg border transition-all ${
                  isSelected
                    ? "bg-primary/10 border-primary/40 ring-1 ring-primary/30"
                    : "bg-muted/20 border-border/30 hover:border-primary/30 hover:bg-muted/40"
                }`}
              >
                <span className="absolute top-1 right-1.5 text-[9px] font-mono text-muted-foreground">#{idx + 1}</span>
                <div className="flex items-center gap-2 mb-1.5">
                  <img src={c.image} alt={c.name} className="w-5 h-5 rounded-full" />
                  <span className="font-mono text-xs font-semibold truncate">{c.symbol}</span>
                </div>
                <p className="text-sm font-mono font-medium leading-tight">
                  ${c.currentPrice.toLocaleString(undefined, { maximumFractionDigits: c.currentPrice < 1 ? 4 : 2 })}
                </p>
                {showVnd && (
                  <p className="text-[10px] font-mono text-muted-foreground leading-tight">
                    {fmtVnd(c.currentPrice, usdVnd)}
                  </p>
                )}
                <p className={`text-[10px] font-mono mt-0.5 ${up ? "ticker-green" : "ticker-red"}`}>
                  {up ? "▲" : "▼"} {Math.abs(c.priceChangePercentage24h ?? 0).toFixed(2)}%
                </p>
                {c.sparkline7d.length > 0 && (
                  <ResponsiveContainer width="100%" height={24}>
                    <AreaChart data={c.sparkline7d.filter((_, i) => i % 6 === 0).map((v, i) => ({ i, v }))}>
                      <defs>
                        <linearGradient id={`tg-${c.symbol}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={up ? "hsl(142, 76%, 45%)" : "hsl(0, 72%, 55%)"} stopOpacity={0.35} />
                          <stop offset="100%" stopColor={up ? "hsl(142, 76%, 45%)" : "hsl(0, 72%, 55%)"} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="v" stroke={up ? "hsl(142, 76%, 45%)" : "hsl(0, 72%, 55%)"} fill={`url(#tg-${c.symbol})`} strokeWidth={1.2} dot={false} isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </button>
            );
          })}
        </div>
      </div>


      {/* Market Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="quant-card lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-3 gap-2">
            <p className="stat-label">
              {language === "vi" ? "Tất cả Crypto" : "All Cryptos"}
              <span className="text-[10px] ml-2 text-primary font-normal">
                {cryptoMarkets?.length ?? 0} {language === "vi" ? "loại" : "coins"}
              </span>
            </p>
            <div className="relative w-56">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={language === "vi" ? "Tìm theo tên/ký hiệu..." : "Search symbol/name..."}
                className="h-7 pl-7 text-xs font-mono bg-muted/20 border-border/40"
              />
            </div>
          </div>
          <div className="grid grid-cols-[40px_1fr_90px_110px_70px_70px] gap-2 px-3 py-1.5 text-[10px] font-mono text-muted-foreground border-b border-border/30 bg-muted/10">
            <span>#</span>
            <span>{language === "vi" ? "Tên" : "Name"}</span>
            <span className="text-right">7D</span>
            <span className="text-right">{language === "vi" ? "Giá" : "Price"}</span>
            <span className="text-right">24h%</span>
            <span className="text-right hidden md:block">MCap</span>
          </div>
          <div className="overflow-y-auto max-h-[520px] divide-y divide-border/20 pr-1">
            {cryptoMarkets
              ?.filter((c) => {
                if (!search.trim()) return true;
                const q = search.toLowerCase();
                return c.symbol.toLowerCase().includes(q) || c.name.toLowerCase().includes(q);
              })
              .map((c) => {
                const up = (c.priceChangePercentage24h ?? 0) >= 0;
                const isSel = selectedCrypto === c.symbol;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCrypto(c.symbol)}
                    className={`grid grid-cols-[40px_1fr_90px_110px_70px_70px] gap-2 items-center px-3 py-2 cursor-pointer transition-colors ${
                      isSel ? "bg-primary/10" : "hover:bg-muted/30"
                    }`}
                  >
                    <span className="text-[10px] font-mono text-muted-foreground">#{c.marketCapRank}</span>
                    <div className="flex items-center gap-2 min-w-0">
                      <img src={c.image} alt={c.name} className="w-5 h-5 rounded-full shrink-0" />
                      <div className="min-w-0">
                        <span className="font-mono font-medium text-xs">{c.symbol}</span>
                        <p className="text-[10px] text-muted-foreground truncate">{c.name}</p>
                      </div>
                    </div>
                    <div className="h-7">
                      {c.sparkline7d.length > 0 && (
                        <ResponsiveContainer width="100%" height={28}>
                          <AreaChart data={c.sparkline7d.filter((_, i) => i % 6 === 0).map((v, i) => ({ i, v }))}>
                            <Area type="monotone" dataKey="v" stroke={up ? "hsl(142, 76%, 45%)" : "hsl(0, 72%, 55%)"} fill={up ? "hsl(142, 76%, 45%)" : "hsl(0, 72%, 55%)"} fillOpacity={0.15} strokeWidth={1.2} dot={false} isAnimationActive={false} />
                          </AreaChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-mono">${c.currentPrice.toLocaleString(undefined, { maximumFractionDigits: c.currentPrice < 1 ? 4 : 2 })}</p>
                      {showVnd && (
                        <p className="text-[9px] font-mono text-muted-foreground">{fmtVnd(c.currentPrice, usdVnd)}</p>
                      )}
                    </div>
                    <p className={`text-[10px] font-mono text-right ${up ? "ticker-green" : "ticker-red"}`}>
                      {up ? "+" : ""}{c.priceChangePercentage24h?.toFixed(2)}%
                    </p>
                    <p className="text-[10px] font-mono text-right text-muted-foreground hidden md:block">
                      {c.marketCap >= 1e9 ? `$${(c.marketCap / 1e9).toFixed(1)}B` : `$${(c.marketCap / 1e6).toFixed(0)}M`}
                    </p>
                  </div>
                );
              })}
          </div>
        </div>


        <div className="quant-card">
          <p className="stat-label mb-3">{language === "vi" ? "Thị phần" : "Market Dominance"}</p>
          {dominanceData.length > 0 ? (
            <>
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
                {dominanceData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.fill }} />
                      <span className="text-muted-foreground">{d.name}</span>
                    </div>
                    <span className="font-mono">{d.value}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </div>

      {/* Selected Crypto Detail */}
      {selectedMarket && (
        <div className="quant-card">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <img src={selectedMarket.image} alt={selectedMarket.name} className="w-9 h-9 rounded-full ring-2 ring-primary/20" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold">{selectedMarket.name}</span>
                  <span className="font-mono text-xs text-muted-foreground">{selectedCrypto}/USD</span>
                  {tech && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      tech.cycle === "Bullish" ? "bg-quant-green/10 text-quant-green" : "bg-quant-red/10 text-quant-red"
                    }`}>
                      {tech.cycle} Cycle
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                  Rank #{selectedMarket.marketCapRank} · MCap ${(selectedMarket.marketCap / 1e9).toFixed(1)}B
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {["7", "30", "90", "365"].map((d) => (
                  <button
                    key={d}
                    onClick={() => setHistoryDays(d)}
                    className={`px-2 py-1 rounded text-[10px] font-mono transition-colors ${
                      historyDays === d ? "bg-primary text-primary-foreground" : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                    }`}
                  >
                    {d}D
                  </button>
                ))}
              </div>
              <div className="text-right">
                <p className="text-2xl font-mono font-semibold">
                  ${selectedMarket.currentPrice.toLocaleString(undefined, { maximumFractionDigits: selectedMarket.currentPrice < 1 ? 4 : 2 })}
                </p>
                <p className="text-[11px] font-mono text-muted-foreground">
                  ≈ {fmtVnd(selectedMarket.currentPrice, usdVnd)}
                </p>
                <p className={`text-xs font-mono ${selectedMarket.priceChangePercentage24h >= 0 ? "ticker-green" : "ticker-red"}`}>
                  {selectedMarket.priceChangePercentage24h >= 0 ? "+" : ""}
                  {selectedMarket.priceChangePercentage24h?.toFixed(2)}% (24h)
                </p>
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 mb-4">
            {[
              { label: "1h", value: selectedMarket.priceChangePercentage1h },
              { label: "24h", value: selectedMarket.priceChangePercentage24h },
              { label: "7d", value: selectedMarket.priceChangePercentage7d },
              { label: "30d", value: selectedMarket.priceChangePercentage30d },
              { label: "ATH", value: selectedMarket.athChangePercentage },
              { label: "Vol(ann.)", value: tech ? tech.vol * 100 : 0, neutral: true },
              { label: "RSI(14)", value: rsiLast || 0, neutral: true, fmt: (v: number) => v.toFixed(1) },
              { label: "Max DD", value: tech ? -tech.maxDD * 100 : 0 },
            ].map((s) => (
              <div key={s.label} className="text-center p-2 rounded-md bg-muted/20 border border-border/20">
                <p className="stat-label">{s.label}</p>
                <p className={`text-xs font-mono mt-0.5 ${s.neutral ? "" : (s.value || 0) >= 0 ? "ticker-green" : "ticker-red"}`}>
                  {(s as any).fmt
                    ? (s as any).fmt(s.value || 0)
                    : s.neutral
                      ? `${(s.value || 0).toFixed(1)}%`
                      : `${(s.value || 0) >= 0 ? "+" : ""}${(s.value || 0).toFixed(2)}%`}
                </p>
              </div>
            ))}
          </div>

          <Tabs defaultValue="candles">
            <TabsList className="bg-muted/30 border border-border/30 flex-wrap h-auto">
              <TabsTrigger value="candles" className="text-xs gap-1">
                <BarChart3 className="w-3 h-3" /> Candlestick
              </TabsTrigger>
              <TabsTrigger value="area" className="text-xs gap-1">
                <Activity className="w-3 h-3" /> {language === "vi" ? "Giá + Volume" : "Price+Vol"}
              </TabsTrigger>
              <TabsTrigger value="indicators" className="text-xs gap-1">
                <Activity className="w-3 h-3" /> RSI / MACD
              </TabsTrigger>
              <TabsTrigger value="volume" className="text-xs gap-1">
                <BarChart3 className="w-3 h-3" /> Volume
              </TabsTrigger>
              <TabsTrigger value="drawdown" className="text-xs gap-1">
                <TrendingDown className="w-3 h-3" /> Drawdown
              </TabsTrigger>
              <TabsTrigger value="distribution" className="text-xs gap-1">
                <TrendingUp className="w-3 h-3" /> Returns
              </TabsTrigger>
              <TabsTrigger value="details" className="text-xs">Details</TabsTrigger>
            </TabsList>

            <TabsContent value="candles" className="mt-3">
              {historyLoading ? (
                <div className="flex items-center justify-center h-72">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : candles.length ? (
                <CandlestickChart data={candles} height={380} formatPrice={fmtPrice} />
              ) : (
                <p className="text-xs text-muted-foreground text-center py-12">
                  {language === "vi" ? "Không có dữ liệu" : "No data"}
                </p>
              )}
            </TabsContent>

            <TabsContent value="area" className="mt-3">
              {candles.length ? (
                <ResponsiveContainer width="100%" height={380}>
                  <ComposedChart data={candles} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
                    <defs>
                      <linearGradient id="priceArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(185, 80%, 50%)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="hsl(185, 80%, 50%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="hsl(222, 20%, 14%)" strokeDasharray="2 4" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(215, 16%, 47%)" }} interval={Math.floor(candles.length / 8)} />
                    <YAxis yAxisId="price" tick={{ fontSize: 10, fill: "hsl(215, 16%, 47%)" }} tickLine={false} axisLine={false} domain={["auto", "auto"]} tickFormatter={(v) => fmtPrice(v)} />
                    <YAxis yAxisId="vol" orientation="right" tick={{ fontSize: 9, fill: "hsl(215, 16%, 35%)" }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1e9).toFixed(1)}B`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(222, 40%, 7%)", border: "1px solid hsl(222, 20%, 14%)", borderRadius: 6, fontSize: 11 }}
                      formatter={(value: number, name: string) => {
                        if (name === "close") return [`${fmtPrice(value)} (${fmtVnd(value, usdVnd)})`, language === "vi" ? "Giá" : "Price"];
                        if (name === "volume") return [`$${(value / 1e9).toFixed(2)}B`, "Volume"];
                        return [value, name];
                      }}
                    />
                    <Bar yAxisId="vol" dataKey="volume" fill="hsl(215, 16%, 35%)" fillOpacity={0.4} isAnimationActive={false} />
                    <Area yAxisId="price" type="monotone" dataKey="close" stroke="hsl(185, 80%, 50%)" fill="url(#priceArea)" strokeWidth={1.8} dot={false} isAnimationActive={false} />
                    <Line yAxisId="price" type="monotone" dataKey="ema50" stroke="hsl(38, 92%, 55%)" strokeWidth={1.2} dot={false} strokeDasharray="3 3" isAnimationActive={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : <div className="flex items-center justify-center h-72"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>}
            </TabsContent>

            <TabsContent value="volume" className="mt-3">
              {candles.length ? (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <p className="stat-label">{language === "vi" ? "Khối lượng giao dịch" : "Trading Volume"}</p>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      24h: ${(selectedMarket.totalVolume / 1e9).toFixed(2)}B · ≈ {fmtVnd(selectedMarket.totalVolume, usdVnd)}
                    </span>
                  </div>
                  <ResponsiveContainer width="100%" height={340}>
                    <BarChart data={candles} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
                      <CartesianGrid stroke="hsl(222, 20%, 14%)" strokeDasharray="2 4" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(215, 16%, 47%)" }} interval={Math.floor(candles.length / 8)} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(215, 16%, 47%)" }} tickFormatter={(v) => `${(v / 1e9).toFixed(1)}B`} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(222, 40%, 7%)", border: "1px solid hsl(222, 20%, 14%)", borderRadius: 6, fontSize: 11 }} formatter={(v: number) => [`$${(v / 1e9).toFixed(2)}B`, "Volume"]} />
                      <Bar dataKey="volume" isAnimationActive={false}>
                        {candles.map((d, i) => (
                          <Cell key={i} fill={d.close >= d.open ? "hsl(142, 76%, 45%)" : "hsl(0, 72%, 55%)"} fillOpacity={0.6} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </>
              ) : <div className="flex items-center justify-center h-72"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>}
            </TabsContent>


              {tech ? (
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="stat-label">RSI (14)</p>
                      <span className="text-[10px] font-mono">
                        Last: <span className={
                          (rsiLast ?? 50) > 70 ? "ticker-red" : (rsiLast ?? 50) < 30 ? "ticker-green" : "text-foreground"
                        }>{rsiLast?.toFixed(1)}</span>
                        {(rsiLast ?? 50) > 70 && <span className="ml-1 text-quant-red">Overbought</span>}
                        {(rsiLast ?? 50) < 30 && <span className="ml-1 text-quant-green">Oversold</span>}
                      </span>
                    </div>
                    <ResponsiveContainer width="100%" height={160}>
                      <LineChart data={tech.series} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                        <CartesianGrid stroke="hsl(222, 20%, 14%)" strokeDasharray="2 4" vertical={false} />
                        <XAxis dataKey="date" hide />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(215, 16%, 47%)" }} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: "hsl(222, 40%, 7%)", border: "1px solid hsl(222, 20%, 14%)", borderRadius: 6, fontSize: 11 }} />
                        <ReferenceLine y={70} stroke="hsl(0, 72%, 55%)" strokeDasharray="3 3" strokeOpacity={0.6} />
                        <ReferenceLine y={50} stroke="hsl(215, 16%, 47%)" strokeDasharray="1 3" strokeOpacity={0.5} />
                        <ReferenceLine y={30} stroke="hsl(142, 76%, 45%)" strokeDasharray="3 3" strokeOpacity={0.6} />
                        <Line type="monotone" dataKey="rsi" stroke="hsl(270, 70%, 60%)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div>
                    <p className="stat-label mb-1">MACD (12, 26, 9)</p>
                    <ResponsiveContainer width="100%" height={180}>
                      <ComposedChart data={tech.series} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                        <CartesianGrid stroke="hsl(222, 20%, 14%)" strokeDasharray="2 4" vertical={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(215, 16%, 47%)" }} interval={Math.floor(tech.series.length / 8)} />
                        <YAxis tick={{ fontSize: 10, fill: "hsl(215, 16%, 47%)" }} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: "hsl(222, 40%, 7%)", border: "1px solid hsl(222, 20%, 14%)", borderRadius: 6, fontSize: 11 }} />
                        <ReferenceLine y={0} stroke="hsl(222, 20%, 14%)" />
                        <Bar dataKey="histogram" isAnimationActive={false}>
                          {tech.series.map((d, i) => (
                            <Cell key={i} fill={(d.histogram ?? 0) >= 0 ? "hsl(142, 76%, 45%)" : "hsl(0, 72%, 55%)"} fillOpacity={0.55} />
                          ))}
                        </Bar>
                        <Line type="monotone" dataKey="macd" stroke="hsl(185, 80%, 50%)" strokeWidth={1.4} dot={false} isAnimationActive={false} />
                        <Line type="monotone" dataKey="signal" stroke="hsl(38, 92%, 55%)" strokeWidth={1.4} dot={false} isAnimationActive={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              )}
            </TabsContent>

            <TabsContent value="drawdown" className="mt-3">
              {tech ? (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <p className="stat-label">{language === "vi" ? "Sụt giảm từ đỉnh" : "Drawdown from Peak"}</p>
                    <span className="text-[10px] font-mono text-quant-red">
                      Max DD: -{(tech.maxDD * 100).toFixed(2)}%
                    </span>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={tech.series} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
                      <defs>
                        <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(0, 72%, 55%)" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="hsl(0, 72%, 55%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="hsl(222, 20%, 14%)" strokeDasharray="2 4" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(215, 16%, 47%)" }} interval={Math.floor(tech.series.length / 8)} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(215, 16%, 47%)" }} tickFormatter={(v) => `${v.toFixed(0)}%`} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(222, 40%, 7%)", border: "1px solid hsl(222, 20%, 14%)", borderRadius: 6, fontSize: 11 }} formatter={(v: number) => [`${v.toFixed(2)}%`, "Drawdown"]} />
                      <ReferenceLine y={0} stroke="hsl(222, 20%, 14%)" />
                      <Area type="monotone" dataKey="drawdown" stroke="hsl(0, 72%, 55%)" fill="url(#ddGrad)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </>
              ) : null}
            </TabsContent>

            <TabsContent value="distribution" className="mt-3">
              {tech ? (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <p className="stat-label">{language === "vi" ? "Phân phối lợi nhuận hàng ngày" : "Daily Returns Distribution"}</p>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      σ ann. {(tech.vol * 100).toFixed(1)}% · n={tech.returns.length}
                    </span>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={tech.hist} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
                      <CartesianGrid stroke="hsl(222, 20%, 14%)" strokeDasharray="2 4" vertical={false} />
                      <XAxis dataKey="bin" tick={{ fontSize: 9, fill: "hsl(215, 16%, 47%)" }} interval={2} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(215, 16%, 47%)" }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(222, 40%, 7%)", border: "1px solid hsl(222, 20%, 14%)", borderRadius: 6, fontSize: 11 }} />
                      <ReferenceLine x={tech.hist[Math.floor(tech.hist.length / 2)]?.bin} stroke="hsl(215, 16%, 47%)" strokeDasharray="2 4" />
                      <Bar dataKey="count" isAnimationActive={false}>
                        {tech.hist.map((d, i) => (
                          <Cell key={i} fill={d.mid >= 0 ? "hsl(142, 76%, 45%)" : "hsl(0, 72%, 55%)"} fillOpacity={0.7} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </>
              ) : null}
            </TabsContent>

            <TabsContent value="details" className="mt-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Market Cap", value: `$${(selectedMarket.marketCap / 1e9).toFixed(1)}B` },
                  { label: "24h Volume", value: `$${(selectedMarket.totalVolume / 1e9).toFixed(1)}B` },
                  { label: "Circulating Supply", value: selectedMarket.circulatingSupply ? `${(selectedMarket.circulatingSupply / 1e6).toFixed(1)}M` : "—" },
                  { label: "Total Supply", value: selectedMarket.totalSupply ? `${(selectedMarket.totalSupply / 1e6).toFixed(1)}M` : "∞" },
                  { label: "24h High", value: `$${selectedMarket.high24h?.toLocaleString(undefined, { maximumFractionDigits: 2 })}` },
                  { label: "24h Low", value: `$${selectedMarket.low24h?.toLocaleString(undefined, { maximumFractionDigits: 2 })}` },
                  { label: "All-Time High", value: `$${selectedMarket.ath?.toLocaleString(undefined, { maximumFractionDigits: 2 })}` },
                  { label: "ATH Change", value: `${selectedMarket.athChangePercentage?.toFixed(1)}%` },
                ].map((m) => (
                  <div key={m.label} className="p-3 rounded-md bg-muted/20 border border-border/20">
                    <p className="stat-label">{m.label}</p>
                    <p className="stat-value mt-1">{m.value}</p>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Chat panel pinned below */}
      {selectedMarket && (
        <CryptoChatPanel
          symbol={selectedCrypto}
          price={selectedMarket.currentPrice}
          change24h={selectedMarket.priceChangePercentage24h}
          rsi={rsiLast}
          cycle={tech?.cycle}
        />
      )}
    </div>
  );
}
