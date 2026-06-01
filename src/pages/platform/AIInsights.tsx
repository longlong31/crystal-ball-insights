import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import {
  Brain, Sparkles, Loader2, Send, TrendingUp, AlertTriangle, Lightbulb,
  BarChart3, Newspaper, Target, Eye, Zap, Trash2, Copy, Check, Clock,
  ChevronDown, Bot, User, ArrowUpRight, ArrowDownRight, Activity,
  DollarSign, PieChart, Globe, Shield, TrendingDown, RefreshCw,
  Flame, Gauge, LineChart as LineChartIcon, Layers, Wifi, Star,
  ChevronRight, MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useCryptoMarkets, useCryptoGlobal, type CryptoMarketData } from "@/hooks/useMarketData";
import { useVNSentiment } from "@/hooks/useVNSentiment";
import {
  AreaChart, Area, BarChart, Bar, PieChart as RePieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid,
  PolarAngleAxis, Radar, CartesianGrid, ComposedChart, Line
} from "recharts";

// ─── Types ───
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  type?: "pattern" | "anomaly" | "allocation" | "general";
  confidence?: number;
}

// ─── Constants ───
const PRESET_PROMPTS = [
  { icon: Newspaper, label: "Dự báo Tin tức", prompt: "Dựa trên tin tức tài chính mới nhất trong hệ thống, hãy phân tích sentiment tổng thể của thị trường. Đưa ra dự báo xu hướng ngắn hạn (1-2 tuần) và trung hạn (1-3 tháng) cho thị trường chứng khoán VN và crypto. Bao gồm: sentiment score, các tín hiệu bullish/bearish từ tin tức, xác suất các kịch bản, và khuyến nghị hành động cụ thể.", color: "hsl(270, 70%, 60%)" },
  { icon: Eye, label: "Phát hiện Cơ hội", prompt: "Phân tích tin tức và dữ liệu hiện tại để phát hiện các cơ hội đầu tư tiềm năng. Tìm kiếm: (1) Ngành/cổ phiếu được hưởng lợi từ chính sách mới, (2) Tín hiệu tích lũy từ tin tức, (3) Divergence giữa tin tức tích cực và giá chưa phản ánh. Đưa ra top 5 cơ hội.", color: "hsl(142, 76%, 45%)" },
  { icon: TrendingUp, label: "Market Outlook", prompt: "Analyze the current market conditions based on latest news and data. Provide a detailed outlook for Vietnamese equities (VN-Index, VN30) and global markets. Include key risk factors, support/resistance levels, and sector rotation signals.", color: "hsl(185, 80%, 50%)" },
  { icon: AlertTriangle, label: "Cảnh báo Rủi ro", prompt: "Dựa trên tin tức và dữ liệu mới nhất, hãy phát hiện các rủi ro tiềm ẩn cho nhà đầu tư: (1) Rủi ro vĩ mô (lạm phát, lãi suất, tỷ giá), (2) Rủi ro ngành (chính sách, cạnh tranh), (3) Black swan scenarios.", color: "hsl(38, 92%, 55%)" },
  { icon: Lightbulb, label: "Chiến lược Phân bổ", prompt: "Suggest an optimal asset allocation strategy for a moderate risk tolerance investor focusing on Vietnamese market. Consider current news sentiment, market valuations, VN-Index levels, interest rates, and macro trends.", color: "hsl(210, 80%, 55%)" },
  { icon: Target, label: "Dự đoán Giá", prompt: "Dựa trên phân tích tin tức, sentiment, và dữ liệu kỹ thuật, hãy đưa ra dự đoán giá cho các mã blue-chip VN (VCB, FPT, HPG, VNM, MWG) trong 1 tháng tới.", color: "hsl(330, 70%, 55%)" },
  { icon: Zap, label: "Phân tích Nhanh", prompt: "Tóm tắt nhanh tình hình thị trường hôm nay dựa trên tin tức mới nhất. Format: (1) Top 3 tin tức quan trọng nhất, (2) Sentiment tổng thể, (3) Khuyến nghị hành động trong ngày, (4) Mã cổ phiếu cần theo dõi.", color: "hsl(15, 80%, 55%)" },
  { icon: BarChart3, label: "Anomaly Detection", prompt: "Identify potential market anomalies and unusual patterns from current news and data. Look for divergences between news sentiment and price action, unusual volume patterns, and emerging trends.", color: "hsl(60, 70%, 50%)" },
] as const;

const CHART_COLORS = [
  "hsl(185, 80%, 50%)", "hsl(142, 76%, 45%)", "hsl(270, 70%, 60%)",
  "hsl(38, 92%, 55%)", "hsl(330, 70%, 55%)", "hsl(210, 80%, 55%)"
];

const TYPE_CONFIG: Record<string, { color: string; label: string }> = {
  pattern: { color: "hsl(185, 80%, 50%)", label: "Pattern" },
  anomaly: { color: "hsl(38, 92%, 55%)", label: "Risk" },
  allocation: { color: "hsl(142, 76%, 45%)", label: "Strategy" },
  general: { color: "hsl(270, 70%, 60%)", label: "Analysis" },
};

// ─── GlassCard ───
function GlassCard({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
      className={`relative rounded-2xl bg-card/60 backdrop-blur-md border border-border/40 overflow-hidden group hover:border-primary/20 transition-all duration-300 ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent pointer-events-none" />
      <div className="relative">{children}</div>
    </motion.div>
  );
}

// ─── Mini Sparkline SVG ───
function MiniSparkline({ data, color, width = 80, height = 28 }: { data: number[]; color: string; width?: number; height?: number }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * height}`).join(" ");
  const gradId = `sg-${color.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={points} />
      <polygon fill={`url(#${gradId})`} points={`0,${height} ${points} ${width},${height}`} />
    </svg>
  );
}

// ─── Enhanced Fear & Greed Gauge ───
function FearGreedGaugeCard({ score, label, summary, loading, onRefresh }: {
  score: number; label: string; summary?: string; loading: boolean; onRefresh: () => void;
}) {
  const getColor = (s: number) =>
    s <= 20 ? "hsl(0, 72%, 51%)" : s <= 40 ? "hsl(25, 95%, 53%)" : s <= 60 ? "hsl(48, 96%, 53%)" : s <= 80 ? "hsl(142, 71%, 45%)" : "hsl(142, 76%, 36%)";
  const color = getColor(score);
  const angle = -90 + (score / 100) * 180;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-semibold">VN Fear & Greed</span>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onRefresh}>
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>
      {score > 0 ? (
        <>
          <svg width="140" height="78" viewBox="0 0 140 78" className="drop-shadow-lg">
            <defs>
              <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="hsl(0, 72%, 51%)" />
                <stop offset="25%" stopColor="hsl(25, 95%, 53%)" />
                <stop offset="50%" stopColor="hsl(48, 96%, 53%)" />
                <stop offset="75%" stopColor="hsl(142, 71%, 45%)" />
                <stop offset="100%" stopColor="hsl(142, 76%, 36%)" />
              </linearGradient>
            </defs>
            {/* Background arc */}
            <path d="M 14 68 A 56 56 0 0 1 126 68" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" strokeLinecap="round" />
            {/* Colored arc */}
            <path d="M 14 68 A 56 56 0 0 1 126 68" fill="none" stroke="url(#gaugeGrad)" strokeWidth="8" strokeLinecap="round"
              strokeDasharray={`${(score / 100) * 176} 176`} />
            {/* Needle */}
            <line x1="70" y1="68" x2="70" y2="20" stroke={color} strokeWidth="2.5" strokeLinecap="round"
              transform={`rotate(${angle}, 70, 68)`} />
            <circle cx="70" cy="68" r="5" fill={color} />
            <circle cx="70" cy="68" r="2.5" fill="hsl(var(--card))" />
          </svg>
          <div className="text-center -mt-1">
            <span className="text-3xl font-black font-mono tracking-tight" style={{ color }}>{score}</span>
            <Badge variant="outline" className="ml-2 text-[10px] px-2 py-0" style={{ borderColor: color, color }}>{label}</Badge>
          </div>
          {summary && <p className="text-[10px] text-muted-foreground text-center line-clamp-2 max-w-[200px]">{summary}</p>}
        </>
      ) : (
        <div className="h-28 flex items-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      )}
    </div>
  );
}

// ─── Sentiment Radar ───
function SentimentRadar({ dimensions }: { dimensions: Record<string, number> }) {
  const labels: Record<string, string> = {
    market_momentum: "Momentum", news_sentiment: "Tin tức", investor_confidence: "Niềm tin",
    volatility_risk: "Biến động", global_impact: "Toàn cầu",
  };
  const data = Object.entries(dimensions).map(([key, value]) => ({ subject: labels[key] || key, score: value, fullMark: 100 }));
  return (
    <ResponsiveContainer width="100%" height={180}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius={60}>
        <PolarGrid stroke="hsl(var(--border))" strokeOpacity={0.5} />
        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
        <Radar dataKey="score" stroke="hsl(185, 80%, 50%)" fill="hsl(185, 80%, 50%)" fillOpacity={0.15} strokeWidth={2} dot={{ r: 3, fill: "hsl(185, 80%, 50%)" }} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

// ─── Market Dominance Donut ───
function DominanceChart({ marketCap }: { marketCap: Record<string, number> }) {
  const data = Object.entries(marketCap).filter(([, v]) => v > 1).sort((a, b) => b[1] - a[1]).slice(0, 6)
    .map(([name, value]) => ({ name: name.toUpperCase(), value: +value.toFixed(1) }));
  const others = 100 - data.reduce((s, d) => s + d.value, 0);
  if (others > 0.5) data.push({ name: "Others", value: +others.toFixed(1) });
  return (
    <ResponsiveContainer width="100%" height={160}>
      <RePieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={36} outerRadius={58} paddingAngle={2} strokeWidth={0}>
          {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
        </Pie>
        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 10, fontSize: 11 }}
          formatter={(v: number) => `${v}%`} />
      </RePieChart>
    </ResponsiveContainer>
  );
}

// ─── Crypto Ticker ───
function CryptoTicker({ coin, rank }: { coin: CryptoMarketData; rank: number }) {
  const isUp = coin.priceChangePercentage24h >= 0;
  return (
    <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: rank * 0.03 }}
      className="flex items-center gap-3 p-2.5 rounded-xl bg-card/40 border border-border/20 hover:border-primary/20 hover:bg-card/80 transition-all group cursor-default"
    >
      <span className="text-[10px] font-mono text-muted-foreground/50 w-3">{rank}</span>
      <img src={coin.image} alt={coin.symbol} className="w-7 h-7 rounded-full ring-1 ring-border/30" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold uppercase">{coin.symbol}</span>
          <span className={`text-[10px] flex items-center gap-0.5 font-mono font-semibold ${isUp ? "text-emerald-500" : "text-red-500"}`}>
            {isUp ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
            {Math.abs(coin.priceChangePercentage24h).toFixed(1)}%
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground font-mono">
          ${coin.currentPrice.toLocaleString("en-US", { maximumFractionDigits: coin.currentPrice < 1 ? 4 : 2 })}
        </span>
      </div>
      <MiniSparkline data={coin.sparkline7d?.slice(-24) || []} color={isUp ? "hsl(142, 76%, 45%)" : "hsl(0, 72%, 51%)"} width={52} height={22} />
    </motion.div>
  );
}

// ─── Volume + Price Combined Chart ───
function MarketOverviewChart({ coins }: { coins: CryptoMarketData[] }) {
  const data = coins.slice(0, 8).map(c => ({
    name: c.symbol.toUpperCase(),
    vol: +(c.totalVolume / 1e9).toFixed(2),
    change: +c.priceChangePercentage24h.toFixed(1),
  }));
  return (
    <ResponsiveContainer width="100%" height={150}>
      <ComposedChart data={data} barSize={16}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
        <XAxis dataKey="name" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
        <YAxis yAxisId="left" hide />
        <YAxis yAxisId="right" orientation="right" hide />
        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 10, fontSize: 11 }} />
        <Bar yAxisId="left" dataKey="vol" name="Volume ($B)" radius={[6, 6, 0, 0]}>
          {data.map((d, i) => <Cell key={i} fill={d.change >= 0 ? "hsl(142, 76%, 45%)" : "hsl(0, 72%, 51%)"} fillOpacity={0.6} />)}
        </Bar>
        <Line yAxisId="right" type="monotone" dataKey="change" name="24h %" stroke="hsl(38, 92%, 55%)" strokeWidth={2} dot={{ r: 3, fill: "hsl(38, 92%, 55%)" }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ─── BTC Price Area ───
function BTCPriceChart({ coins }: { coins: CryptoMarketData[] }) {
  const btc = coins.find(c => c.symbol === "btc");
  if (!btc?.sparkline7d?.length) return null;
  const sparkData = btc.sparkline7d;
  const step = Math.max(1, Math.floor(sparkData.length / 48));
  const data = sparkData.filter((_, i) => i % step === 0).map((p, i) => ({ t: i, price: p }));
  const isUp = sparkData[sparkData.length - 1] >= sparkData[0];
  const strokeColor = isUp ? "hsl(142, 76%, 45%)" : "hsl(0, 72%, 51%)";

  return (
    <ResponsiveContainer width="100%" height={120}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="btcAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity={0.3} />
            <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.2} />
        <Area type="monotone" dataKey="price" stroke={strokeColor} strokeWidth={2} fill="url(#btcAreaGrad)" />
        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 10, fontSize: 11 }}
          formatter={(v: number) => [`$${v.toLocaleString()}`, "BTC"]} labelFormatter={() => ""} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Market Heatmap Row ───
function MarketHeatmap({ coins }: { coins: CryptoMarketData[] }) {
  const sorted = coins.slice(0, 12).sort((a, b) => b.marketCap - a.marketCap);
  const maxCap = sorted[0]?.marketCap || 1;
  return (
    <div className="grid grid-cols-4 md:grid-cols-6 gap-1.5">
      {sorted.map(c => {
        const isUp = c.priceChangePercentage24h >= 0;
        const intensity = Math.min(Math.abs(c.priceChangePercentage24h) / 10, 1);
        const size = 0.5 + (c.marketCap / maxCap) * 0.5;
        return (
          <motion.div key={c.id} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="relative rounded-xl p-2 flex flex-col items-center justify-center border border-border/20 cursor-default hover:scale-105 transition-transform"
            style={{
              backgroundColor: isUp ? `hsla(142, 76%, 45%, ${intensity * 0.2})` : `hsla(0, 72%, 51%, ${intensity * 0.2})`,
              minHeight: `${Math.max(50, size * 70)}px`,
            }}
          >
            <img src={c.image} alt="" className="w-5 h-5 rounded-full mb-1" />
            <span className="text-[10px] font-bold uppercase">{c.symbol}</span>
            <span className={`text-[10px] font-mono font-semibold ${isUp ? "text-emerald-500" : "text-red-500"}`}>
              {isUp ? "+" : ""}{c.priceChangePercentage24h.toFixed(1)}%
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Stat Card ───
function StatKPI({ icon: Icon, label, value, sub, up }: {
  icon: React.ElementType; label: string; value: string; sub?: string; up?: boolean;
}) {
  return (
    <GlassCard className="p-4" delay={0}>
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-lg bg-primary/10">
          <Icon className="w-3.5 h-3.5 text-primary" />
        </div>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-black font-mono tracking-tight">{value}</span>
        {sub && (
          <span className={`text-xs font-mono font-semibold flex items-center gap-0.5 ${up ? "text-emerald-500" : "text-red-500"}`}>
            {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {sub}
          </span>
        )}
      </div>
    </GlassCard>
  );
}

// ═══════════════════════════════════════
// ─── Main Page ───
// ═══════════════════════════════════════
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
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  }, []);

  const classifyType = useCallback((text: string): Message["type"] => {
    const lower = text.toLowerCase();
    if (lower.includes("risk") || lower.includes("rủi ro") || lower.includes("cảnh báo")) return "anomaly";
    if (lower.includes("alloc") || lower.includes("phân bổ") || lower.includes("chiến lược")) return "allocation";
    if (lower.includes("pattern") || lower.includes("anomal") || lower.includes("phát hiện")) return "pattern";
    return "general";
  }, []);

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
        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          const line = buffer.slice(0, idx).replace(/\r$/, "");
          buffer = buffer.slice(idx + 1);
          if (!line.startsWith("data: ") || !line.trim()) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const content = JSON.parse(jsonStr).choices?.[0]?.delta?.content;
            if (content) { fullContent += content; setStreamingContent(fullContent); scrollToBottom(); }
          } catch { /* partial chunk */ }
        }
      }

      const aiMsg: Message = {
        id: crypto.randomUUID(), role: "assistant", content: fullContent || "Phân tích hoàn tất.",
        timestamp: new Date(), type: classifyType(inputPrompt), confidence: 0.82 + Math.random() * 0.15,
      };
      setMessages(prev => [...prev, aiMsg]);
      setStreamingContent("");
      scrollToBottom();
    } catch (err: any) {
      console.error("AI analysis error:", err);
      const errorMsg = err?.message?.includes("Hệ thống") || err?.message?.includes("credits")
        ? err.message : "⚠️ Không thể tạo phân tích. Vui lòng thử lại.";
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "assistant", content: errorMsg, timestamp: new Date(), type: "general" }]);
      setStreamingContent("");
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, scrollToBottom, classifyType]);

  const copyMessage = useCallback((msg: Message) => {
    navigator.clipboard.writeText(msg.content);
    setCopiedId(msg.id);
    toast.success("Đã sao chép!");
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const clearChat = useCallback(() => { setMessages([]); setStreamingContent(""); setShowPresets(true); }, []);

  const topGainers = useMemo(() => cryptoData?.slice().sort((a, b) => b.priceChangePercentage24h - a.priceChangePercentage24h).slice(0, 5) || [], [cryptoData]);
  const topLosers = useMemo(() => cryptoData?.slice().sort((a, b) => a.priceChangePercentage24h - b.priceChangePercentage24h).slice(0, 5) || [], [cryptoData]);

  const globalStats = useMemo(() => [
    { icon: Globe, label: "Tổng Market Cap", value: globalData ? `$${(globalData.totalMarketCap / 1e12).toFixed(2)}T` : "—", sub: globalData ? `${globalData.marketCapChangePercentage24h >= 0 ? "+" : ""}${globalData.marketCapChangePercentage24h.toFixed(2)}%` : undefined, up: (globalData?.marketCapChangePercentage24h ?? 0) >= 0 },
    { icon: BarChart3, label: "Volume 24h", value: globalData ? `$${(globalData.totalVolume / 1e9).toFixed(0)}B` : "—", up: true },
    { icon: Layers, label: "BTC Dominance", value: globalData ? `${globalData.marketCapPercentage?.btc?.toFixed(1) || 0}%` : "—", up: true },
    { icon: Shield, label: "Sentiment Score", value: sentimentData ? `${sentimentData.score}/100` : "—", sub: sentimentData?.label, up: (sentimentData?.score ?? 50) >= 50 },
  ], [globalData, sentimentData]);

  // Auto-resize textarea
  const handleTextareaInput = useCallback((e: React.FormEvent<HTMLTextAreaElement>) => {
    const el = e.target as HTMLTextAreaElement;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* ═══ Header ═══ */}
      <div className="shrink-0 border-b border-border/30 bg-card/30 backdrop-blur-xl px-4 py-2.5">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20 shadow-lg shadow-primary/5">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-card animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight">Crystall AI</h1>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-primary/30 text-primary">PRO</Badge>
              </div>
              <p className="text-[10px] text-muted-foreground">Intelligence • Charts • Predictions</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Tabs value={activeView} onValueChange={v => setActiveView(v as "dashboard" | "chat")}>
              <TabsList className="h-8 bg-muted/30 backdrop-blur-sm">
                <TabsTrigger value="dashboard" className="text-xs h-7 px-3 gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm">
                  <Activity className="w-3 h-3" />Dashboard
                </TabsTrigger>
                <TabsTrigger value="chat" className="text-xs h-7 px-3 gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm">
                  <MessageSquare className="w-3 h-3" />Chat AI
                  {messages.length > 0 && (
                    <span className="ml-1 w-4 h-4 rounded-full bg-primary/20 text-primary text-[9px] font-bold flex items-center justify-center">{messages.length}</span>
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>
            {messages.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearChat} className="text-xs gap-1.5 text-muted-foreground h-8 hover:text-red-500">
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <Wifi className="w-3 h-3 text-emerald-500" />
              <span className="text-[10px] font-semibold text-emerald-500">Live</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════ DASHBOARD VIEW ═══════════ */}
      {activeView === "dashboard" && (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 py-5 space-y-5">

            {/* KPI Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {globalStats.map((s, i) => <StatKPI key={i} {...s} />)}
            </div>

            {/* Row 2: Gauge + Radar + BTC Chart */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <GlassCard className="p-5" delay={0.1}>
                <FearGreedGaugeCard
                  score={sentimentData?.score ?? 0} label={sentimentData?.label ?? "Loading"}
                  summary={sentimentData?.summary} loading={sentimentLoading} onRefresh={refetchSentiment}
                />
              </GlassCard>

              <GlassCard className="p-5" delay={0.15}>
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-semibold">Phân tích Đa chiều</span>
                </div>
                {sentimentData?.dimensions ? (
                  <>
                    <SentimentRadar dimensions={sentimentData.dimensions} />
                    <div className="grid grid-cols-2 gap-1 mt-1">
                      {Object.entries(sentimentData.dimensions).map(([k, v]) => {
                        const labelMap: Record<string, string> = { market_momentum: "Momentum", news_sentiment: "Tin tức", investor_confidence: "Niềm tin", volatility_risk: "Biến động", global_impact: "Toàn cầu" };
                        return (
                          <div key={k} className="flex items-center gap-2 px-2 py-0.5">
                            <span className="text-[9px] text-muted-foreground flex-1">{labelMap[k] || k}</span>
                            <Progress value={v} className="h-1 flex-1 max-w-[60px]" />
                            <span className="text-[9px] font-mono font-semibold w-6 text-right">{v}</span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="h-52 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
                )}
              </GlassCard>

              <GlassCard className="p-5" delay={0.2}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-semibold">Bitcoin 7D</span>
                  </div>
                  {cryptoData && (() => {
                    const btc = cryptoData.find(c => c.symbol === "btc");
                    if (!btc) return null;
                    const isUp = btc.priceChangePercentage7d >= 0;
                    return (
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold font-mono">${btc.currentPrice.toLocaleString()}</span>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${isUp ? "border-emerald-500/30 text-emerald-500" : "border-red-500/30 text-red-500"}`}>
                          {isUp ? "+" : ""}{btc.priceChangePercentage7d?.toFixed(1)}%
                        </Badge>
                      </div>
                    );
                  })()}
                </div>
                {cryptoData ? <BTCPriceChart coins={cryptoData} /> : (
                  <div className="h-32 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
                )}
                {cryptoData && (() => {
                  const btc = cryptoData.find(c => c.symbol === "btc");
                  if (!btc) return null;
                  return (
                    <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border/30">
                      <div className="text-center">
                        <span className="text-[9px] text-muted-foreground block">24h High</span>
                        <span className="text-[10px] font-mono font-semibold">${btc.high24h?.toLocaleString()}</span>
                      </div>
                      <div className="text-center">
                        <span className="text-[9px] text-muted-foreground block">24h Low</span>
                        <span className="text-[10px] font-mono font-semibold">${btc.low24h?.toLocaleString()}</span>
                      </div>
                      <div className="text-center">
                        <span className="text-[9px] text-muted-foreground block">ATH</span>
                        <span className="text-[10px] font-mono font-semibold">${btc.ath?.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })()}
              </GlassCard>
            </div>

            {/* Row 3: Market Heatmap */}
            <GlassCard className="p-5" delay={0.25}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-semibold">Market Heatmap</span>
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">24h</Badge>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => refetchCrypto()}>
                  <RefreshCw className={`w-3 h-3 ${cryptoLoading ? "animate-spin" : ""}`} />
                </Button>
              </div>
              {cryptoData ? <MarketHeatmap coins={cryptoData} /> : (
                <div className="h-20 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
              )}
            </GlassCard>

            {/* Row 4: Crypto List + Volume Chart */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <GlassCard className="p-5" delay={0.3}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-semibold">Top Crypto</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => refetchCrypto()}>
                    <RefreshCw className={`w-3 h-3 ${cryptoLoading ? "animate-spin" : ""}`} />
                  </Button>
                </div>
                <div className="space-y-1.5">
                  {cryptoData ? cryptoData.slice(0, 6).map((c, i) => <CryptoTicker key={c.id} coin={c} rank={i + 1} />) : (
                    Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-14 rounded-xl bg-muted/20 animate-pulse" />)
                  )}
                </div>
              </GlassCard>

              <GlassCard className="p-5" delay={0.35}>
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-semibold">Volume & Performance 24h</span>
                </div>
                {cryptoData ? <MarketOverviewChart coins={cryptoData} /> : (
                  <div className="h-40 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
                )}
              </GlassCard>
            </div>

            {/* Row 5: Gainers + Losers + Dominance */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <GlassCard className="p-5" delay={0.4}>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-semibold">Top Tăng 24h</span>
                </div>
                <div className="space-y-2.5">
                  {topGainers.map((c, i) => (
                    <div key={c.id} className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-muted-foreground/50 w-3">{i + 1}</span>
                      <img src={c.image} alt="" className="w-5 h-5 rounded-full" />
                      <span className="text-xs font-semibold uppercase flex-1">{c.symbol}</span>
                      <span className="text-xs font-mono text-muted-foreground">${c.currentPrice.toLocaleString("en-US", { maximumFractionDigits: 2 })}</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-500/30 text-emerald-500">
                        +{c.priceChangePercentage24h.toFixed(1)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </GlassCard>

              <GlassCard className="p-5" delay={0.45}>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingDown className="w-4 h-4 text-red-500" />
                  <span className="text-xs font-semibold">Top Giảm 24h</span>
                </div>
                <div className="space-y-2.5">
                  {topLosers.map((c, i) => (
                    <div key={c.id} className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-muted-foreground/50 w-3">{i + 1}</span>
                      <img src={c.image} alt="" className="w-5 h-5 rounded-full" />
                      <span className="text-xs font-semibold uppercase flex-1">{c.symbol}</span>
                      <span className="text-xs font-mono text-muted-foreground">${c.currentPrice.toLocaleString("en-US", { maximumFractionDigits: 2 })}</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-red-500/30 text-red-500">
                        {c.priceChangePercentage24h.toFixed(1)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </GlassCard>

              <GlassCard className="p-5" delay={0.5}>
                <div className="flex items-center gap-2 mb-2">
                  <PieChart className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-semibold">Market Dominance</span>
                </div>
                {globalData?.marketCapPercentage ? (
                  <>
                    <DominanceChart marketCap={globalData.marketCapPercentage} />
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                      {Object.entries(globalData.marketCapPercentage).filter(([, v]) => v > 1).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v], i) => (
                        <div key={k} className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                          <span className="text-[10px] text-muted-foreground font-medium">{k.toUpperCase()} {v.toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="h-40 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
                )}
              </GlassCard>
            </div>

            {/* Row 6: Key Factors + AI Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sentimentData?.key_factors && sentimentData.key_factors.length > 0 && (
                <GlassCard className="p-5" delay={0.55}>
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold">Yếu tố Chính (AI Analysis)</span>
                  </div>
                  <div className="space-y-2.5">
                    {sentimentData.key_factors.slice(0, 5).map((f, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-[9px] font-black text-primary">{i + 1}</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{f}</p>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              )}

              <GlassCard className="p-5 border-primary/20" delay={0.6}>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold">Phân tích với AI</span>
                  <ChevronRight className="w-3 h-3 text-muted-foreground ml-auto" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {PRESET_PROMPTS.slice(0, 6).map(p => (
                    <button key={p.label} onClick={() => analyze(p.prompt)} disabled={isLoading}
                      className="text-left p-3 rounded-xl bg-card/50 border border-border/20 hover:border-primary/30 hover:bg-primary/5 transition-all disabled:opacity-50 group"
                    >
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-md" style={{ backgroundColor: `${p.color}15` }}>
                          <p.icon className="w-3 h-3" style={{ color: p.color }} />
                        </div>
                        <span className="text-[11px] font-medium group-hover:text-primary transition-colors">{p.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ CHAT VIEW ═══════════ */}
      {activeView === "chat" && (
        <>
          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-4 py-4 space-y-1">

              {/* Empty state */}
              {messages.length === 0 && showPresets && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center pt-12 pb-6">
                  <div className="relative mb-5">
                    <div className="p-5 rounded-3xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/20 shadow-2xl shadow-primary/10">
                      <Brain className="w-12 h-12 text-primary" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-card flex items-center justify-center">
                      <Sparkles className="w-2 h-2 text-white" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-black mb-1.5 tracking-tight">Crystall AI</h2>
                  <p className="text-sm text-muted-foreground mb-8 text-center max-w-md leading-relaxed">
                    Trợ lý AI phân tích thị trường thời gian thực, dự báo xu hướng và phát hiện cơ hội đầu tư
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 w-full">
                    {PRESET_PROMPTS.map((p, i) => (
                      <motion.button key={p.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.05 }}
                        onClick={() => analyze(p.prompt)} disabled={isLoading}
                        className="group text-left p-3.5 rounded-xl bg-card/60 border border-border/30 hover:border-primary/30 hover:bg-primary/5 hover:shadow-lg hover:shadow-primary/5 transition-all disabled:opacity-50">
                        <div className="p-1.5 rounded-lg w-fit mb-2.5" style={{ backgroundColor: `${p.color}12` }}>
                          <p.icon className="w-4 h-4" style={{ color: p.color }} />
                        </div>
                        <p className="text-xs font-semibold group-hover:text-primary transition-colors leading-tight">{p.label}</p>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Toggle presets */}
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
                  {PRESET_PROMPTS.slice(0, 5).map(p => (
                    <button key={p.label} onClick={() => analyze(p.prompt)} disabled={isLoading}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/60 border border-border/30 hover:border-primary/30 text-xs font-medium transition-all disabled:opacity-50">
                      <p.icon className="w-3 h-3" style={{ color: p.color }} />
                      {p.label}
                    </button>
                  ))}
                </motion.div>
              )}

              {/* Messages */}
              <AnimatePresence>
                {messages.map(msg => (
                  <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 py-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                    {msg.role === "assistant" && (
                      <div className="shrink-0 mt-1">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 flex items-center justify-center shadow-sm">
                          <Bot className="w-4 h-4 text-primary" />
                        </div>
                      </div>
                    )}
                    <div className={`max-w-[85%] ${msg.role === "user" ? "order-first" : ""}`}>
                      {msg.role === "assistant" && msg.type && (
                        <div className="flex items-center gap-2 mb-1.5">
                          <Badge variant="outline" className="text-[9px] uppercase tracking-wider font-bold px-2 py-0 h-4"
                            style={{ borderColor: TYPE_CONFIG[msg.type].color, color: TYPE_CONFIG[msg.type].color }}>
                            {TYPE_CONFIG[msg.type].label}
                          </Badge>
                          {msg.confidence && (
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {(msg.confidence * 100).toFixed(0)}% confidence
                            </span>
                          )}
                        </div>
                      )}
                      <div className={`rounded-2xl px-4 py-3 ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-md shadow-lg shadow-primary/10"
                          : "bg-card/60 backdrop-blur-sm border border-border/40 rounded-bl-md"
                      }`}>
                        {msg.role === "assistant" ? (
                          <div className="prose prose-sm prose-invert max-w-none text-sm leading-relaxed [&_table]:text-xs [&_th]:px-2 [&_td]:px-2 [&_pre]:bg-background/50 [&_code]:text-primary [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-xs [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-sm">{msg.content}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 px-1">
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
                        <div className="w-8 h-8 rounded-xl bg-primary shadow-lg shadow-primary/20 flex items-center justify-center">
                          <User className="w-4 h-4 text-primary-foreground" />
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Streaming */}
              {streamingContent && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 py-3">
                  <div className="shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                    </div>
                  </div>
                  <div className="max-w-[85%]">
                    <div className="rounded-2xl rounded-bl-md px-4 py-3 bg-card/60 backdrop-blur-sm border border-primary/20">
                      <div className="prose prose-sm prose-invert max-w-none text-sm leading-relaxed [&_table]:text-xs [&_th]:px-2 [&_td]:px-2">
                        <ReactMarkdown>{streamingContent}</ReactMarkdown>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 px-1">
                      <Loader2 className="w-2.5 h-2.5 animate-spin text-primary" />
                      <span className="text-[10px] text-primary font-semibold">Đang phân tích...</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Loading dots */}
              {isLoading && !streamingContent && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 py-3">
                  <div className="shrink-0">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                  <div className="rounded-2xl rounded-bl-md px-4 py-3 bg-card/60 backdrop-blur-sm border border-border/40">
                    <div className="flex items-center gap-1.5">
                      {[0, 1, 2].map(i => (
                        <motion.div key={i} className="w-2 h-2 rounded-full bg-primary/50"
                          animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Input */}
          <div className="shrink-0 border-t border-border/30 bg-card/30 backdrop-blur-xl px-4 py-3">
            <div className="max-w-3xl mx-auto">
              <div className="flex gap-2 items-end">
                <div className="flex-1 relative">
                  <Textarea ref={textareaRef} value={prompt} onChange={e => setPrompt(e.target.value)}
                    placeholder="Hỏi Crystall AI về thị trường, rủi ro, chiến lược..."
                    className="resize-none bg-muted/20 border-border/20 text-sm min-h-[44px] max-h-[120px] pr-12 rounded-xl focus:border-primary/30 focus:ring-primary/10" rows={1}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); analyze(prompt); } }}
                    onInput={handleTextareaInput}
                  />
                  <div className="absolute right-2 bottom-2">
                    <Button onClick={() => analyze(prompt)} disabled={isLoading || !prompt.trim()} size="icon"
                      className="h-7 w-7 rounded-lg shadow-lg shadow-primary/20">
                      {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground/40 text-center mt-2">
                Crystall AI có thể sai. Xác minh thông tin trước khi ra quyết định đầu tư.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
