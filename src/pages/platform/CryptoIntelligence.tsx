import { useState, useMemo } from "react";
import { Bitcoin, TrendingUp, TrendingDown, Activity, Zap, Globe, BarChart3, Loader2, RefreshCw } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, ReferenceLine } from "recharts";
import { calculateRSI, calculateVolatility, calculateMACD } from "@/lib/technicalIndicators";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useCryptoMarkets, useCryptoGlobal, useCryptoHistory } from "@/hooks/useMarketData";
import { useLanguage } from "@/contexts/LanguageContext";

const CRYPTO_COLORS: Record<string, string> = {
  BTC: "hsl(38, 92%, 55%)",
  ETH: "hsl(270, 70%, 60%)",
  SOL: "hsl(185, 80%, 50%)",
  BNB: "hsl(38, 70%, 50%)",
  XRP: "hsl(210, 80%, 55%)",
  ADA: "hsl(210, 70%, 50%)",
};

export default function CryptoIntelligence() {
  const [selectedCrypto, setSelectedCrypto] = useState("BTC");
  const [historyDays, setHistoryDays] = useState("30");
  const { language } = useLanguage();

  const { data: cryptoMarkets, isLoading: marketsLoading, refetch: refetchMarkets } = useCryptoMarkets();
  const { data: globalData, isLoading: globalLoading } = useCryptoGlobal();
  const { data: historyData, isLoading: historyLoading } = useCryptoHistory(selectedCrypto, historyDays);

  // Process history data for charts
  const chartData = useMemo(() => {
    if (!historyData?.prices) return [];
    return historyData.prices.map(([timestamp, price], i) => ({
      date: new Date(timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      close: price,
      volume: historyData.totalVolumes?.[i]?.[1] || 0,
    }));
  }, [historyData]);

  // Calculate technical indicators from history
  const indicators = useMemo(() => {
    if (!chartData.length) return null;
    const closes = chartData.map((d) => d.close);
    const returns = closes.slice(1).map((c, i) => (c - closes[i]) / closes[i]);
    const rsi = calculateRSI(closes);
    const macd = calculateMACD(closes);
    const vol = calculateVolatility(returns);

    const sma50 = closes.map((_, i) =>
      i >= 49 ? closes.slice(i - 49, i + 1).reduce((a, b) => a + b, 0) / 50 : NaN
    );
    const lastSma50 = sma50.filter((v) => !isNaN(v));
    const avgPrice = closes.reduce((a, b) => a + b, 0) / closes.length;
    const currentCycle =
      lastSma50.length > 0 && closes[closes.length - 1] > lastSma50[lastSma50.length - 1]
        ? "Bullish"
        : "Bearish";

    return {
      rsi,
      macd,
      vol,
      currentCycle,
      chartDataWithIndicators: chartData.map((d, i) => ({
        ...d,
        rsi: rsi[i],
        macd: macd[i]?.macd,
        signal: macd[i]?.signal,
        histogram: macd[i]?.histogram,
      })),
    };
  }, [chartData]);

  const selectedMarket = cryptoMarkets?.find((c) => c.symbol === selectedCrypto);

  // Dominance data from real global data
  const dominanceData = useMemo(() => {
    if (!globalData?.marketCapPercentage) return [];
    const entries = Object.entries(globalData.marketCapPercentage)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6);
    const topTotal = entries.reduce((a, [, v]) => a + v, 0);
    const colors = ["hsl(38, 92%, 55%)", "hsl(270, 70%, 60%)", "hsl(185, 80%, 50%)", "hsl(38, 70%, 50%)", "hsl(210, 80%, 55%)", "hsl(210, 70%, 50%)"];
    const result = entries.map(([name, value], i) => ({
      name: name.toUpperCase(),
      value: +value.toFixed(1),
      fill: colors[i] || "hsl(215, 15%, 30%)",
    }));
    if (topTotal < 100) {
      result.push({ name: "Others", value: +(100 - topTotal).toFixed(1), fill: "hsl(215, 15%, 30%)" });
    }
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Bitcoin className="w-6 h-6 text-quant-amber" /> Crypto Intelligence
          </h1>
          <p className="text-sm text-muted-foreground">
            {language === "vi" ? "Dữ liệu thời gian thực từ CoinGecko" : "Real-time data from CoinGecko"}
          </p>
        </div>
        <div className="flex items-center gap-3">
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
          </div>
        </div>
      </div>

      {/* Market Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="quant-card lg:col-span-2">
          <p className="stat-label mb-3">
            {language === "vi" ? "Tổng quan thị trường" : "Market Overview"}
            <span className="text-[10px] ml-2 text-primary font-normal">LIVE</span>
          </p>
          <div className="space-y-1">
            {cryptoMarkets?.map((c) => (
              <div
                key={c.symbol}
                className={`flex items-center gap-4 p-3 rounded-md cursor-pointer transition-colors ${
                  selectedCrypto === c.symbol ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/30"
                }`}
                onClick={() => setSelectedCrypto(c.symbol)}
              >
                <div className="flex items-center gap-2 w-28">
                  <img src={c.image} alt={c.name} className="w-6 h-6 rounded-full" />
                  <div>
                    <span className="font-mono font-medium text-sm">{c.symbol}</span>
                    <p className="text-[10px] text-muted-foreground">{c.name}</p>
                  </div>
                </div>
                <div className="flex-1">
                  {c.sparkline7d.length > 0 && (
                    <ResponsiveContainer width="100%" height={35}>
                      <AreaChart data={c.sparkline7d.filter((_, i) => i % 4 === 0).map((v, i) => ({ i, v }))}>
                        <defs>
                          <linearGradient id={`cg-${c.symbol}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={CRYPTO_COLORS[c.symbol] || "hsl(185, 80%, 50%)"} stopOpacity={0.3} />
                            <stop offset="100%" stopColor={CRYPTO_COLORS[c.symbol] || "hsl(185, 80%, 50%)"} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="v" stroke={CRYPTO_COLORS[c.symbol] || "hsl(185, 80%, 50%)"} fill={`url(#cg-${c.symbol})`} strokeWidth={1.5} dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
                <div className="text-right w-28">
                  <p className="text-sm font-mono">${c.currentPrice.toLocaleString(undefined, { maximumFractionDigits: c.currentPrice < 1 ? 4 : 2 })}</p>
                  <p className={`text-[10px] font-mono ${c.priceChangePercentage24h >= 0 ? "ticker-green" : "ticker-red"}`}>
                    {c.priceChangePercentage24h >= 0 ? "+" : ""}
                    {c.priceChangePercentage24h?.toFixed(2)}%
                  </p>
                </div>
                <div className="text-right w-20 hidden md:block">
                  <p className="text-[10px] text-muted-foreground">24h Vol</p>
                  <p className="text-xs font-mono">${(c.totalVolume / 1e9).toFixed(1)}B</p>
                </div>
                <div className="text-right w-20 hidden lg:block">
                  <p className="text-[10px] text-muted-foreground">MCap</p>
                  <p className="text-xs font-mono">${(c.marketCap / 1e9).toFixed(0)}B</p>
                </div>
              </div>
            ))}
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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <img src={selectedMarket.image} alt={selectedMarket.name} className="w-8 h-8 rounded-full" />
              <span className="text-lg font-semibold">{selectedMarket.name}</span>
              <span className="font-mono text-muted-foreground">{selectedCrypto}/USD</span>
              {indicators && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  indicators.currentCycle === "Bullish" ? "bg-quant-green/10 text-quant-green" : "bg-quant-red/10 text-quant-red"
                }`}>
                  {indicators.currentCycle} Cycle
                </span>
              )}
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
                <p className={`text-xs font-mono ${selectedMarket.priceChangePercentage24h >= 0 ? "ticker-green" : "ticker-red"}`}>
                  {selectedMarket.priceChangePercentage24h >= 0 ? "+" : ""}
                  {selectedMarket.priceChangePercentage24h?.toFixed(2)}% (24h)
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-4">
            {[
              { label: "1h", value: selectedMarket.priceChangePercentage1h },
              { label: "24h", value: selectedMarket.priceChangePercentage24h },
              { label: "7d", value: selectedMarket.priceChangePercentage7d },
              { label: "30d", value: selectedMarket.priceChangePercentage30d },
              { label: "ATH", value: selectedMarket.athChangePercentage, neutral: false },
              { label: "Vol", value: indicators ? indicators.vol * 100 : 0, neutral: true },
            ].map((s) => (
              <div key={s.label} className="text-center p-2 rounded-md bg-muted/20">
                <p className="stat-label">{s.label}</p>
                <p className={`text-xs font-mono mt-0.5 ${s.neutral ? "" : (s.value || 0) >= 0 ? "ticker-green" : "ticker-red"}`}>
                  {s.neutral ? `${(s.value || 0).toFixed(1)}%` : `${(s.value || 0) >= 0 ? "+" : ""}${(s.value || 0).toFixed(2)}%`}
                </p>
              </div>
            ))}
          </div>

          <Tabs defaultValue="chart">
            <TabsList className="bg-muted/30 border border-border/30">
              <TabsTrigger value="chart" className="text-xs">Price</TabsTrigger>
              <TabsTrigger value="indicators" className="text-xs">Indicators</TabsTrigger>
              <TabsTrigger value="details" className="text-xs">Details</TabsTrigger>
            </TabsList>

            <TabsContent value="chart">
              {historyLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="cryptoDetailGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(185, 80%, 50%)" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="hsl(185, 80%, 50%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={Math.max(1, Math.floor(chartData.length / 8))} />
                    <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v.toFixed(2)}`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(222, 40%, 7%)", border: "1px solid hsl(222, 20%, 14%)", borderRadius: 6, fontSize: 11 }}
                      formatter={(v: number) => [`$${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, "Price"]}
                    />
                    <Area type="monotone" dataKey="close" stroke="hsl(185, 80%, 50%)" fill="url(#cryptoDetailGrad)" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </TabsContent>

            <TabsContent value="indicators">
              {indicators ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <p className="stat-label mb-2">RSI (14) — {indicators.rsi[indicators.rsi.length - 1]?.toFixed(1)}</p>
                    <ResponsiveContainer width="100%" height={150}>
                      <LineChart data={indicators.chartDataWithIndicators}>
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
                      <BarChart data={indicators.chartDataWithIndicators}>
                        <ReferenceLine y={0} stroke="hsl(222, 20%, 14%)" />
                        <Bar dataKey="histogram" fill="hsl(185, 80%, 50%)" fillOpacity={0.5} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              )}
            </TabsContent>

            <TabsContent value="details">
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
    </div>
  );
}
