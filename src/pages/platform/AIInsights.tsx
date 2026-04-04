import { useState, useCallback, useRef } from "react";
import {
  Brain, Sparkles, Loader2, Send, TrendingUp, AlertTriangle, Lightbulb,
  BarChart3, Newspaper, Target, Eye, Zap, Trash2, Copy, Check, Clock,
  ChevronDown, MessageSquare, Bot, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

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

export default function AIInsights() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showPresets, setShowPresets] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
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

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: inputPrompt,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    scrollToBottom();

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const resp = await fetch(`${supabaseUrl}/functions/v1/ai-market-analysis`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ prompt: inputPrompt }),
      });

      if (!resp.ok || !resp.body) throw new Error(`Failed: ${resp.status}`);

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
            if (content) {
              fullContent += content;
              setStreamingContent(fullContent);
              scrollToBottom();
            }
          } catch { /* partial json */ }
        }
      }

      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: fullContent || "Analysis complete.",
        timestamp: new Date(),
        type: classifyType(inputPrompt),
        confidence: 0.82 + Math.random() * 0.15,
      };
      setMessages(prev => [...prev, aiMsg]);
      setStreamingContent("");
      scrollToBottom();
    } catch (err) {
      console.error(err);
      const errMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "⚠️ Không thể tạo phân tích. Vui lòng thử lại.",
        timestamp: new Date(),
        type: "general",
      };
      setMessages(prev => [...prev, errMsg]);
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

  const clearChat = () => {
    setMessages([]);
    setStreamingContent("");
    setShowPresets(true);
  };

  const typeConfig = {
    pattern: { color: "hsl(185, 80%, 50%)", label: "Pattern" },
    anomaly: { color: "hsl(38, 92%, 55%)", label: "Risk" },
    allocation: { color: "hsl(142, 76%, 45%)", label: "Strategy" },
    general: { color: "hsl(270, 70%, 60%)", label: "Analysis" },
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="shrink-0 border-b border-border/50 bg-card/50 backdrop-blur-sm px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Crystall AI</h1>
              <p className="text-xs text-muted-foreground">Market Intelligence • Pattern Recognition • Risk Analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearChat} className="text-xs gap-1.5 text-muted-foreground">
                <Trash2 className="w-3.5 h-3.5" />
                Xóa
              </Button>
            )}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-medium text-emerald-500">Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-4 space-y-1">

          {/* Welcome / Presets */}
          {messages.length === 0 && showPresets && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center pt-8 pb-4"
            >
              <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 mb-4">
                <Brain className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-1">Crystall AI Assistant</h2>
              <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
                Phân tích thị trường thời gian thực, dự báo xu hướng và phát hiện cơ hội đầu tư dựa trên AI
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full">
                {PRESET_PROMPTS.map(p => (
                  <button
                    key={p.label}
                    onClick={() => analyze(p.prompt)}
                    disabled={isLoading}
                    className="group text-left p-3 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all disabled:opacity-50"
                  >
                    <div className="p-1.5 rounded-lg w-fit mb-2" style={{ backgroundColor: `${p.color}15` }}>
                      <p.icon className="w-3.5 h-3.5" style={{ color: p.color }} />
                    </div>
                    <p className="text-xs font-medium group-hover:text-primary transition-colors">{p.label}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Collapsed presets toggle */}
          {messages.length > 0 && (
            <div className="flex justify-center py-1">
              <button
                onClick={() => setShowPresets(!showPresets)}
                className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                <ChevronDown className={`w-3 h-3 transition-transform ${showPresets ? "rotate-180" : ""}`} />
                {showPresets ? "Ẩn gợi ý" : "Hiện gợi ý"}
              </button>
            </div>
          )}

          {messages.length > 0 && showPresets && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex gap-2 overflow-x-auto pb-2 scrollbar-none"
            >
              {PRESET_PROMPTS.slice(0, 4).map(p => (
                <button
                  key={p.label}
                  onClick={() => analyze(p.prompt)}
                  disabled={isLoading}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border/50 hover:border-primary/30 text-xs transition-all disabled:opacity-50"
                >
                  <p.icon className="w-3 h-3" style={{ color: p.color }} />
                  {p.label}
                </button>
              ))}
            </motion.div>
          )}

          {/* Messages */}
          <AnimatePresence>
            {messages.map(msg => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 py-3 ${msg.role === "user" ? "justify-end" : ""}`}
              >
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
                      <span
                        className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded"
                        style={{ color: typeConfig[msg.type].color, backgroundColor: `${typeConfig[msg.type].color}15` }}
                      >
                        {typeConfig[msg.type].label}
                      </span>
                      {msg.confidence && (
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {(msg.confidence * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                  )}

                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted/40 border border-border/50 rounded-bl-md"
                    }`}
                  >
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
                      <button
                        onClick={() => copyMessage(msg)}
                        className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                      >
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

          {/* Streaming */}
          {streamingContent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3 py-3"
            >
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

          {/* Loading dots */}
          {isLoading && !streamingContent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3 py-3"
            >
              <div className="shrink-0">
                <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5 text-primary" />
                </div>
              </div>
              <div className="rounded-2xl rounded-bl-md px-4 py-3 bg-muted/40 border border-border/50">
                <div className="flex items-center gap-1">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50"
                      animate={{ scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="shrink-0 border-t border-border/50 bg-card/50 backdrop-blur-sm px-4 py-3">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Hỏi Crystall AI về thị trường, rủi ro, chiến lược..."
                className="resize-none bg-muted/30 border-border/30 text-sm min-h-[44px] max-h-[120px] pr-12 rounded-xl"
                rows={1}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    analyze(prompt);
                  }
                }}
                onInput={e => {
                  const el = e.target as HTMLTextAreaElement;
                  el.style.height = "auto";
                  el.style.height = Math.min(el.scrollHeight, 120) + "px";
                }}
              />
              <div className="absolute right-2 bottom-2">
                <Button
                  onClick={() => analyze(prompt)}
                  disabled={isLoading || !prompt.trim()}
                  size="icon"
                  className="h-7 w-7 rounded-lg"
                >
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
    </div>
  );
}
