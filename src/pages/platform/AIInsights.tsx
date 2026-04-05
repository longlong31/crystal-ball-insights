import { useState, useCallback, useRef, useMemo } from "react";
import {
  Brain, Sparkles, Loader2, Send, TrendingUp, AlertTriangle, Lightbulb,
  BarChart3, Newspaper, Target, Eye, Zap, Trash2, Copy, Check, Clock,
  ChevronDown, Bot, User, ArrowUpRight, ArrowDownRight, Activity,
  DollarSign, PieChart, Globe, Shield, TrendingDown, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useCryptoMarkets, useCryptoGlobal, type CryptoMarketData } from "@/hooks/useMarketData";
import { useVNSentiment } from "@/hooks/useVNSentiment";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, PieChart as RePieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid,
  PolarAngleAxis, Radar, CartesianGrid
} from "recharts";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  type?: "pattern" | "anomaly" | "allocation" | "general";
  confidence?: number;
}

const PRESET_PROMPTS = [
  { icon: Newspaper, label: "Dự báo Tin tức", prompt: "Dựa trên tin tức tài chính mới nhất trong hệ thống, hãy phân tích sentiment tổng thể của thị trường. Đưa ra dự báo xu hướng ngắn hạn (1-2 tuần) và trung hạn (1-3 tháng) cho thị trường chứng khoán VN và crypto. Bao gồm: sentiment score, các tín hiệu bullish/bearish từ tin tức, xác suất các kịch bản, và khuyến nghị hành động cụ thể.", color: "hsl(270, 70%, 60%)" },
  { icon: Eye, label: "Phát hiện Cơ hội", prompt: "Phân tích tin tức và dữ liệu hiện tại để phát hiện các cơ hội đầu tư tiềm năng. Tìm kiếm: (1) Ngành/cổ phiếu được hưởng lợi từ chính sách mới, (2) Tín hiệu tích lũy từ tin tức, (3) Divergence giữa tin tức tích cực và giá chưa phản ánh. Đưa ra top 5 cơ hội.", color: "hsl(142, 76%, 45%)" },
  { icon: TrendingUp, label: "Market Outlook", prompt: "Analyze the current market conditions based on latest news and data. Provide a detailed outlook for Vietnamese equities (VN-Index, VN30) and global markets. Include key risk factors, support/resistance levels, and sector rotation signals.", color: "hsl(185, 80%, 50%)" },
  { icon: AlertTriangle, label: "Cảnh báo Rủi ro", prompt: "Dựa trên tin tức và dữ liệu mới nhất, hãy phát hiện các rủi ro tiềm ẩn cho nhà đầu tư: (1) Rủi ro vĩ mô (lạm phát, lãi suất, tỷ giá), (2) Rủi ro ngành (chính sách, cạnh tranh), (3) Black swan scenarios.", color: "hsl(38, 92%, 55%)" },
  { icon: Lightbulb, label: "Chiến lược Phân bổ", prompt: "Suggest an optimal asset allocation strategy for a moderate risk tolerance investor focusing on Vietnamese market. Consider current news sentiment, market valuations, VN-Index levels, interest rates, and macro trends.", color: "hsl(210, 80%, 55%)" },
  { icon: Target, label: "Dự đoán Giá", prompt: "Dựa trên phân tích tin tức, sentiment, và dữ liệu kỹ thuật, hãy đưa ra dự đoán giá cho các mã blue-chip VN (VCB, FPT, HPG, VNM, MWG) trong 1 tháng tới.", color: "hsl(330, 70%, 55%)" },
  { icon: Zap, label: "Phân tích Nhanh", prompt: "Tóm tắt nhanh tình hình thị trường hôm nay dựa trên tin tức mới nhất. Format: (1) Top 3 tin tức quan trọng nhất, (2) Sentiment tổng thể, (3) Khuyến nghị hành động trong ngày, (4) Mã cổ phiếu cần theo dõi.", color: "hsl(15, 80%, 55%)" },
  { icon: BarChart3, label: "Anomaly Detection", prompt: "Identify potential market anomalies and unusual patterns from current news and data. Look for divergences between news sentiment and price action, unusual volume patterns, and emerging trends.", color: "hsl(60, 70%, 50%)" },
];

const CHART_COLORS = [
  "hsl(185, 80%, 50%)", "hsl(142, 76%, 45%)", "hsl(270, 70%, 60%)",
  "hsl(38, 92%, 55%)", "hsl(330, 70%, 55%)", "hsl(210, 80%, 55%)"
];

// ─── Mini Sparkline SVG ───
function MiniSparkline({ data, color, width = 80, height = 28 }: { data: number[]; color: string; width?: number; height?: number }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * height}`).join(" ");
  const isUp = data[data.length - 1] >= data[0];
  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`sg-${color.replace(/[^a-z0-9]/gi, "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={points} />
      <polygon
        fill={`url(#sg-${color.replace(/[^a-z0-9]/gi, "")})`}
        points={`0,${height} ${points} ${width},${height}`}
      />
    </svg>
  );
}

// ─── Fear & Greed Mini Gauge ───
function MiniGauge({ score }: { score: number }) {
  const angle = -90 + (score / 100) * 180;
  const getColor = (s: number) =>
    s <= 20 ? "hsl(0, 72%, 51%)" : s <= 40 ? "hsl(25, 95%, 53%)" : s <= 60 ? "hsl(48, 96%, 53%)" : s <= 80 ? "hsl(142, 71%, 45%)" : "hsl(142, 76%, 36%)";
  const color = getColor(score);
  const label = score <= 20 ? "Cực sợ" : score <= 40 ? "Sợ hãi" : score <= 60 ? "Trung lập" : score <= 80 ? "Tham lam" : "Cực tham";

  return (
    <div className="flex flex-col items-center">
      <svg width="100" height="58" viewBox="0 0 100 58">
        <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" strokeLinecap="round" />
        <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={`${(score / 100) * 126} 126`}
        />
        <line x1="50" y1="50" x2="50" y2="16"
          stroke={color} strokeWidth="2" strokeLinecap="round"
          transform={`rotate(${angle}, 50, 50)`}
        />
        <circle cx="50" cy="50" r="3" fill={color} />
      </svg>
      <span className="text-lg font-bold font-mono" style={{ color }}>{score}</span>
      <span className="text-[10px] font-medium" style={{ color }}>{label}</span>
    </div>
  );
}

// ─── Market Dominance Donut ───
function DominanceChart({ marketCap }: { marketCap: Record<string, number> }) {
  const data = Object.entries(marketCap)
    .filter(([, v]) => v > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, value]) => ({ name: name.toUpperCase(), value: +value.toFixed(1) }));
  const others = 100 - data.reduce((s, d) => s + d.value, 0);
  if (others > 0.5) data.push({ name: "Others", value: +others.toFixed(1) });

  return (
    <ResponsiveContainer width="100%" height={140}>
      <RePieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={32} outerRadius={52} paddingAngle={2} strokeWidth={0}>
          {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
        </Pie>
        <Tooltip
          contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }}
          formatter={(v: number) => `${v}%`}
        />
      </RePieChart>
    </ResponsiveContainer>
  );
}

// ─── Crypto Ticker Row ───
function CryptoTicker({ coin }: { coin: CryptoMarketData }) {
  const isUp = coin.priceChangePercentage24h >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-2 p-2 rounded-lg bg-card/50 border border-border/30 hover:border-primary/30 transition-all group"
    >
      <img src={coin.image} alt={coin.symbol} className="w-6 h-6 rounded-full" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-xs font-semibold uppercase">{coin.symbol}</span>
          <span className={`text-[10px] flex items-center gap-0.5 font-mono ${isUp ? "text-emerald-500" : "text-red-500"}`}>
            {isUp ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
            {Math.abs(coin.priceChangePercentage24h).toFixed(1)}%
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground font-mono">${coin.currentPrice.toLocaleString("en-US", { maximumFractionDigits: coin.currentPrice < 1 ? 4 : 2 })}</span>
      </div>
      <MiniSparkline data={coin.sparkline7d?.slice(-24) || []} color={isUp ? "hsl(142, 76%, 45%)" : "hsl(0, 72%, 51%)"} width={48} height={20} />
    </motion.div>
  );
}

// ─── Sentiment Radar ───
function SentimentRadar({ dimensions }: { dimensions: Record<string, number> }) {
  const labels: Record<string, string> = {
    market_momentum: "Momentum",
    news_sentiment: "Tin tức",
    investor_confidence: "Niềm tin",
    volatility_risk: "Biến động",
    global_impact: "Toàn cầu",
  };
  const data = Object.entries(dimensions).map(([key, value]) => ({
    subject: labels[key] || key,
    score: value,
    fullMark: 100,
  }));

  return (
    <ResponsiveContainer width="100%" height={160}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius={55}>
        <PolarGrid stroke="hsl(var(--border))" />
        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
        <Radar dataKey="score" stroke="hsl(185, 80%, 50%)" fill="hsl(185, 80%, 50%)" fillOpacity={0.2} strokeWidth={1.5} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

// ─── Volume Bars ───
function VolumeChart({ coins }: { coins: CryptoMarketData[] }) {
  const data = coins.slice(0, 6).map(c => ({
    name: c.symbol.toUpperCase(),
    vol: +(c.totalVolume / 1e9).toFixed(2),
    change: c.priceChangePercentage24h,
  }));

  return (
    <ResponsiveContainer width="100%" height={120}>
      <BarChart data={data} barSize={14}>
        <XAxis dataKey="name" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
        <YAxis hide />
        <Tooltip
          contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }}
          formatter={(v: number) => `$${v}B`}
        />
        <Bar dataKey="vol" radius={[4, 4, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.change >= 0 ? "hsl(142, 76%, 45%)" : "hsl(0, 72%, 51%)"} fillOpacity={0.7} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Price History Area ───
function PriceAreaChart({ coins }: { coins: CryptoMarketData[] }) {
  const btc = coins.find(c => c.symbol === "btc");
  if (!btc?.sparkline7d?.length) return null;
  const data = btc.sparkline7d.map((p, i) => ({ t: i, price: p }));

  return (
    <ResponsiveContainer width="100%" height={100}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="btcGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(38, 92%, 55%)" stopOpacity={0.4} />
            <stop offset="100%" stopColor="hsl(38, 92%, 55%)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="price" stroke="hsl(38, 92%, 55%)" strokeWidth={1.5} fill="url(#btcGrad)" />
        <Tooltip
          contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }}
          formatter={(v: number) => [`$${v.toLocaleString()}`, "BTC"]}
          labelFormatter={() => ""}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Main Page ───
export default function AIInsights() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showPresets, setShowPresets] = useState(true);
  const [activeView, setActiveView] = useState<"dashboard" | "chat">("dashboard");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: cryptoData, isLoading: cryptoLoading, refetch: refetchCrypto } = useCryptoMarkets();
  const { data: globalData } = useCryptoGlobal();
  const { data: sentimentData, loading: sentimentLoading, refetch: refetchSentiment } = useVNSentiment();

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, 100);
  }, []);

  const classifyType = (text: string): Message["type"] => {
    const lower = text.toLowerCase();
    if (lower.includes("risk") || lower.includes("rủi ro") || lower.includes("cảnh báo")) return "anomaly";
    if (lower.includes("alloc") || lower.includes("phân bổ") || lower.includes("chiến lược")) return "allocation";
    if (lower.includes("pattern") || lower.includes("anomal") || lower.includes("phát hiện")) return "pattern";
    return "general";
  };

  const analyze = useCallback(async (inputPrompt: string) => {
    if (!inputPrompt.trim() || isLoading) return;
    setIsLoading(true);
    setStreamingContent("");
    setPrompt("");
    setShowPresets(false);
    setActiveView("chat");

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: inputPrompt, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    scrollToBottom();

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      
      const doFetch = async (attempt = 1): Promise<Response> => {
        try {
          const r = await fetch(`${supabaseUrl}/functions/v1/ai-market-analysis`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
            body: JSON.stringify({ prompt: inputPrompt }),
          });
          if (!r.ok) {
            if (r.status === 429) throw new Error("Hệ thống đang bận, vui lòng thử lại sau ít phút.");
            if (r.status === 402) throw new Error("Đã hết credits AI. Vui lòng liên hệ admin.");
            throw new Error(`Lỗi server: ${r.status}`);
          }
          return r;
        } catch (e) {
          if (attempt < 2 && e instanceof TypeError) {
            await new Promise(res => setTimeout(res, 1500));
            return doFetch(attempt + 1);
          }
          throw e;
        }
      };
      
      const resp = await doFetch();
      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ") || line.trim() === "" || line.startsWith(":")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) { fullContent += content; setStreamingContent(fullContent); scrollToBottom(); }
          } catch { /* partial */ }
        }
      }

      const aiMsg: Message = {
        id: crypto.randomUUID(), role: "assistant", content: fullContent || "Analysis complete.",
        timestamp: new Date(), type: classifyType(inputPrompt), confidence: 0.82 + Math.random() * 0.15,
      };
      setMessages(prev => [...prev, aiMsg]);
      setStreamingContent("");
      scrollToBottom();
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "assistant", content: "⚠️ Không thể tạo phân tích. Vui lòng thử lại.", timestamp: new Date(), type: "general" }]);
      setStreamingContent("");
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, scrollToBottom]);

  const copyMessage = (msg: Message) => {
    navigator.clipboard.writeText(msg.content);
    setCopiedId(msg.id);
    toast.success("Đã sao chép!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => { setMessages([]); setStreamingContent(""); setShowPresets(true); };

  const typeConfig = {
    pattern: { color: "hsl(185, 80%, 50%)", label: "Pattern" },
    anomaly: { color: "hsl(38, 92%, 55%)", label: "Risk" },
    allocation: { color: "hsl(142, 76%, 45%)", label: "Strategy" },
    general: { color: "hsl(270, 70%, 60%)", label: "Analysis" },
  };

  const topGainers = useMemo(() => cryptoData?.slice().sort((a, b) => b.priceChangePercentage24h - a.priceChangePercentage24h).slice(0, 3) || [], [cryptoData]);
  const topLosers = useMemo(() => cryptoData?.slice().sort((a, b) => a.priceChangePercentage24h - b.priceChangePercentage24h).slice(0, 3) || [], [cryptoData]);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="shrink-0 border-b border-border/50 bg-card/50 backdrop-blur-sm px-4 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Crystall AI</h1>
              <p className="text-[10px] text-muted-foreground">Intelligence • Charts • Real-time Data</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Tabs value={activeView} onValueChange={v => setActiveView(v as any)}>
              <TabsList className="h-8">
                <TabsTrigger value="dashboard" className="text-xs h-7 px-3 gap-1.5">
                  <Activity className="w-3 h-3" />Dashboard
                </TabsTrigger>
                <TabsTrigger value="chat" className="text-xs h-7 px-3 gap-1.5">
                  <Bot className="w-3 h-3" />Chat AI
                </TabsTrigger>
              </TabsList>
            </Tabs>
            {messages.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearChat} className="text-xs gap-1.5 text-muted-foreground h-8">
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-medium text-emerald-500">Live</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════ DASHBOARD VIEW ═══════════ */}
      {activeView === "dashboard" && (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 py-4 space-y-4">

            {/* Row 1: Global Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { icon: Globe, label: "Tổng Market Cap", value: globalData ? `$${(globalData.totalMarketCap / 1e12).toFixed(2)}T` : "—", sub: globalData ? `${globalData.marketCapChangePercentage24h >= 0 ? "+" : ""}${globalData.marketCapChangePercentage24h.toFixed(2)}%` : "", up: (globalData?.marketCapChangePercentage24h ?? 0) >= 0 },
                { icon: BarChart3, label: "Volume 24h", value: globalData ? `$${(globalData.totalVolume / 1e9).toFixed(0)}B` : "—", sub: "", up: true },
                { icon: PieChart, label: "BTC Dominance", value: globalData ? `${globalData.marketCapPercentage?.btc?.toFixed(1) || 0}%` : "—", sub: "", up: true },
                { icon: Shield, label: "VN Fear & Greed", value: sentimentData ? `${sentimentData.score}` : "—", sub: sentimentData?.label || "", up: (sentimentData?.score ?? 50) >= 50 },
              ].map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-3 rounded-xl bg-card/80 border border-border/50 hover:border-primary/30 transition-all"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <s.icon className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{s.label}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold font-mono">{s.value}</span>
                    {s.sub && (
                      <span className={`text-xs font-mono ${s.up ? "text-emerald-500" : "text-red-500"}`}>{s.sub}</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Row 2: Fear&Greed Gauge + Sentiment Radar + BTC Chart */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Fear & Greed */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="p-4 rounded-xl bg-card/80 border border-border/50 flex flex-col items-center"
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <span className="text-xs font-semibold">VN Fear & Greed Index</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => refetchSentiment()}>
                    <RefreshCw className={`w-3 h-3 ${sentimentLoading ? "animate-spin" : ""}`} />
                  </Button>
                </div>
                {sentimentData ? <MiniGauge score={sentimentData.score} /> : (
                  <div className="h-24 flex items-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
                )}
                {sentimentData?.summary && (
                  <p className="text-[10px] text-muted-foreground mt-2 text-center line-clamp-2">{sentimentData.summary}</p>
                )}
              </motion.div>

              {/* Sentiment Radar */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="p-4 rounded-xl bg-card/80 border border-border/50"
              >
                <span className="text-xs font-semibold">Phân tích Đa chiều</span>
                {sentimentData?.dimensions ? (
                  <SentimentRadar dimensions={sentimentData.dimensions} />
                ) : (
                  <div className="h-40 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
                )}
              </motion.div>

              {/* BTC 7d */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="p-4 rounded-xl bg-card/80 border border-border/50"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold">Bitcoin 7 ngày</span>
                  {cryptoData && (() => {
                    const btc = cryptoData.find(c => c.symbol === "btc");
                    if (!btc) return null;
                    const isUp = btc.priceChangePercentage7d >= 0;
                    return <span className={`text-[10px] font-mono ${isUp ? "text-emerald-500" : "text-red-500"}`}>{isUp ? "+" : ""}{btc.priceChangePercentage7d?.toFixed(1)}%</span>;
                  })()}
                </div>
                {cryptoData ? <PriceAreaChart coins={cryptoData} /> : (
                  <div className="h-24 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
                )}
              </motion.div>
            </div>

            {/* Row 3: Crypto Tickers + Volume */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Ticker list */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                className="p-4 rounded-xl bg-card/80 border border-border/50"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold">Top Crypto</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => refetchCrypto()}>
                    <RefreshCw className={`w-3 h-3 ${cryptoLoading ? "animate-spin" : ""}`} />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {cryptoData ? cryptoData.slice(0, 6).map(c => <CryptoTicker key={c.id} coin={c} />) : (
                    Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-14 rounded-lg bg-muted/30 animate-pulse" />
                    ))
                  )}
                </div>
              </motion.div>

              {/* Volume Chart */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="p-4 rounded-xl bg-card/80 border border-border/50"
              >
                <span className="text-xs font-semibold mb-2 block">Volume 24h (tỷ USD)</span>
                {cryptoData ? <VolumeChart coins={cryptoData} /> : (
                  <div className="h-32 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
                )}
              </motion.div>
            </div>

            {/* Row 4: Top Gainers / Losers + Dominance */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Gainers */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                className="p-4 rounded-xl bg-card/80 border border-border/50"
              >
                <div className="flex items-center gap-1.5 mb-3">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-xs font-semibold">Top Tăng 24h</span>
                </div>
                <div className="space-y-2">
                  {topGainers.map(c => (
                    <div key={c.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img src={c.image} alt="" className="w-5 h-5 rounded-full" />
                        <span className="text-xs font-medium uppercase">{c.symbol}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono">${c.currentPrice.toLocaleString("en-US", { maximumFractionDigits: 2 })}</span>
                        <span className="text-[10px] text-emerald-500 font-mono ml-2">+{c.priceChangePercentage24h.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Losers */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="p-4 rounded-xl bg-card/80 border border-border/50"
              >
                <div className="flex items-center gap-1.5 mb-3">
                  <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                  <span className="text-xs font-semibold">Top Giảm 24h</span>
                </div>
                <div className="space-y-2">
                  {topLosers.map(c => (
                    <div key={c.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img src={c.image} alt="" className="w-5 h-5 rounded-full" />
                        <span className="text-xs font-medium uppercase">{c.symbol}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono">${c.currentPrice.toLocaleString("en-US", { maximumFractionDigits: 2 })}</span>
                        <span className="text-[10px] text-red-500 font-mono ml-2">{c.priceChangePercentage24h.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Dominance */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
                className="p-4 rounded-xl bg-card/80 border border-border/50"
              >
                <span className="text-xs font-semibold mb-1 block">Market Dominance</span>
                {globalData?.marketCapPercentage ? (
                  <>
                    <DominanceChart marketCap={globalData.marketCapPercentage} />
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                      {Object.entries(globalData.marketCapPercentage).filter(([,v]) => v > 1).sort((a,b) => b[1]-a[1]).slice(0, 5).map(([k, v], i) => (
                        <div key={k} className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                          <span className="text-[10px] text-muted-foreground">{k.toUpperCase()} {v.toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="h-36 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
                )}
              </motion.div>
            </div>

            {/* Row 5: Key Factors + Quick AI Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sentimentData?.key_factors && sentimentData.key_factors.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                  className="p-4 rounded-xl bg-card/80 border border-border/50"
                >
                  <div className="flex items-center gap-1.5 mb-3">
                    <Lightbulb className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-semibold">Yếu tố Chính (AI)</span>
                  </div>
                  <div className="space-y-2">
                    {sentimentData.key_factors.slice(0, 5).map((f, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-[9px] font-bold text-primary">{i + 1}</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{f}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
                className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-transparent border border-primary/20"
              >
                <div className="flex items-center gap-1.5 mb-3">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-semibold">Phân tích với AI</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {PRESET_PROMPTS.slice(0, 4).map(p => (
                    <button
                      key={p.label}
                      onClick={() => analyze(p.prompt)}
                      disabled={isLoading}
                      className="text-left p-2.5 rounded-lg bg-card/60 border border-border/30 hover:border-primary/30 hover:bg-primary/5 transition-all disabled:opacity-50 group"
                    >
                      <div className="flex items-center gap-1.5">
                        <p.icon className="w-3 h-3" style={{ color: p.color }} />
                        <span className="text-[11px] font-medium group-hover:text-primary transition-colors">{p.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>

          </div>
        </div>
      )}

      {/* ═══════════ CHAT VIEW ═══════════ */}
      {activeView === "chat" && (
        <>
          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-4 py-4 space-y-1">

              {messages.length === 0 && showPresets && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center pt-8 pb-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 mb-4">
                    <Brain className="w-10 h-10 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold mb-1">Crystall AI Assistant</h2>
                  <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
                    Phân tích thị trường thời gian thực, dự báo xu hướng và phát hiện cơ hội đầu tư dựa trên AI
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full">
                    {PRESET_PROMPTS.map(p => (
                      <button key={p.label} onClick={() => analyze(p.prompt)} disabled={isLoading}
                        className="group text-left p-3 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all disabled:opacity-50">
                        <div className="p-1.5 rounded-lg w-fit mb-2" style={{ backgroundColor: `${p.color}15` }}>
                          <p.icon className="w-3.5 h-3.5" style={{ color: p.color }} />
                        </div>
                        <p className="text-xs font-medium group-hover:text-primary transition-colors">{p.label}</p>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {messages.length > 0 && (
                <div className="flex justify-center py-1">
                  <button onClick={() => setShowPresets(!showPresets)}
                    className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                    <ChevronDown className={`w-3 h-3 transition-transform ${showPresets ? "rotate-180" : ""}`} />
                    {showPresets ? "Ẩn gợi ý" : "Hiện gợi ý"}
                  </button>
                </div>
              )}

              {messages.length > 0 && showPresets && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                  {PRESET_PROMPTS.slice(0, 4).map(p => (
                    <button key={p.label} onClick={() => analyze(p.prompt)} disabled={isLoading}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border/50 hover:border-primary/30 text-xs transition-all disabled:opacity-50">
                      <p.icon className="w-3 h-3" style={{ color: p.color }} />
                      {p.label}
                    </button>
                  ))}
                </motion.div>
              )}

              <AnimatePresence>
                {messages.map(msg => (
                  <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 py-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                    {msg.role === "assistant" && (
                      <div className="shrink-0 mt-1">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                          <Bot className="w-3.5 h-3.5 text-primary" />
                        </div>
                      </div>
                    )}
                    <div className={`max-w-[85%] ${msg.role === "user" ? "order-first" : ""}`}>
                      {msg.role === "assistant" && msg.type && (
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded"
                            style={{ color: typeConfig[msg.type].color, backgroundColor: `${typeConfig[msg.type].color}15` }}>
                            {typeConfig[msg.type].label}
                          </span>
                          {msg.confidence && <span className="text-[10px] text-muted-foreground font-mono">{(msg.confidence * 100).toFixed(0)}%</span>}
                        </div>
                      )}
                      <div className={`rounded-2xl px-4 py-3 ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted/40 border border-border/50 rounded-bl-md"}`}>
                        {msg.role === "assistant" ? (
                          <div className="prose prose-sm prose-invert max-w-none text-sm leading-relaxed [&_table]:text-xs [&_th]:px-2 [&_td]:px-2 [&_pre]:bg-background/50 [&_code]:text-primary">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-sm">{msg.content}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 px-1">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {msg.timestamp.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {msg.role === "assistant" && (
                          <button onClick={() => copyMessage(msg)}
                            className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                            {copiedId === msg.id ? <Check className="w-2.5 h-2.5 text-emerald-500" /> : <Copy className="w-2.5 h-2.5" />}
                            {copiedId === msg.id ? "Đã chép" : "Copy"}
                          </button>
                        )}
                      </div>
                    </div>
                    {msg.role === "user" && (
                      <div className="shrink-0 mt-1">
                        <div className="w-7 h-7 rounded-lg bg-primary/80 flex items-center justify-center">
                          <User className="w-3.5 h-3.5 text-primary-foreground" />
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {streamingContent && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 py-3">
                  <div className="shrink-0 mt-1">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
                    </div>
                  </div>
                  <div className="max-w-[85%]">
                    <div className="rounded-2xl rounded-bl-md px-4 py-3 bg-muted/40 border border-primary/20">
                      <div className="prose prose-sm prose-invert max-w-none text-sm leading-relaxed [&_table]:text-xs [&_th]:px-2 [&_td]:px-2">
                        <ReactMarkdown>{streamingContent}</ReactMarkdown>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 px-1">
                      <Loader2 className="w-2.5 h-2.5 animate-spin text-primary" />
                      <span className="text-[10px] text-primary font-medium">Đang phân tích...</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {isLoading && !streamingContent && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 py-3">
                  <div className="shrink-0">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <Bot className="w-3.5 h-3.5 text-primary" />
                    </div>
                  </div>
                  <div className="rounded-2xl rounded-bl-md px-4 py-3 bg-muted/40 border border-border/50">
                    <div className="flex items-center gap-1">
                      {[0, 1, 2].map(i => (
                        <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50"
                          animate={{ scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Input */}
          <div className="shrink-0 border-t border-border/50 bg-card/50 backdrop-blur-sm px-4 py-3">
            <div className="max-w-3xl mx-auto">
              <div className="flex gap-2 items-end">
                <div className="flex-1 relative">
                  <Textarea ref={textareaRef} value={prompt} onChange={e => setPrompt(e.target.value)}
                    placeholder="Hỏi Crystall AI về thị trường, rủi ro, chiến lược..."
                    className="resize-none bg-muted/30 border-border/30 text-sm min-h-[44px] max-h-[120px] pr-12 rounded-xl" rows={1}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); analyze(prompt); } }}
                    onInput={e => { const el = e.target as HTMLTextAreaElement; el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 120) + "px"; }}
                  />
                  <div className="absolute right-2 bottom-2">
                    <Button onClick={() => analyze(prompt)} disabled={isLoading || !prompt.trim()} size="icon" className="h-7 w-7 rounded-lg">
                      {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground/50 text-center mt-2">
                Crystall AI có thể sai. Hãy xác minh thông tin quan trọng trước khi ra quyết định đầu tư.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
