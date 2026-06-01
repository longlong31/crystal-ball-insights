import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Send, Sparkles, Loader2, Zap, RefreshCw, Brain } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Msg { role: "user" | "assistant"; content: string }

interface Props {
  symbol: string;
  name?: string;
  price?: number;
  priceVnd?: number;
  change24h?: number;
  change7d?: number;
  rsi?: number;
  cycle?: string;
  marketCap?: number;
  volume24h?: number;
  ath?: number;
  athChangePct?: number;
  maxDrawdown?: number; // 0..1
  volatilityAnn?: number; // 0..1
  rank?: number;
}

export function CryptoChatPanel(props: Props) {
  const { symbol, name, price, priceVnd, change24h, change7d, rsi, cycle, marketCap, volume24h, ath, athChangePct, maxDrawdown, volatilityAnn, rank } = props;
  const { language } = useLanguage();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [userName, setUserName] = useState<string>("");
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load user name once for personalization
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled || !user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .maybeSingle();
      const display = profile?.full_name || user.email?.split("@")[0] || "";
      setUserName(display);
    })();
    return () => { cancelled = true; };
  }, []);

  const suggestions = language === "vi"
    ? [
        `📈 Phân tích kỹ thuật ${symbol} chi tiết`,
        `🎯 Điểm mua/bán tối ưu ${symbol}?`,
        `🛡️ Vùng hỗ trợ & kháng cự ${symbol}`,
        `⚖️ So sánh ${symbol} với BTC & ETH`,
        `💡 ${symbol} có hợp đầu tư dài hạn?`,
        `⚠️ Rủi ro lớn nhất khi mua ${symbol}?`,
      ]
    : [
        `📈 Deep TA on ${symbol}`,
        `🎯 Optimal entry/exit for ${symbol}?`,
        `🛡️ Support & resistance for ${symbol}`,
        `⚖️ Compare ${symbol} vs BTC & ETH`,
        `💡 Is ${symbol} good long-term?`,
        `⚠️ Biggest risks of ${symbol}?`,
      ];

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, streaming]);
  useEffect(() => { setMessages([]); }, [symbol]);

  const buildContext = (q: string) => {
    const greet = userName ? (language === "vi" ? `Bạn đang nói chuyện với ${userName}. ` : `You are speaking with ${userName}. `) : "";
    const rsiZone = rsi == null ? "?" : rsi > 70 ? `${rsi.toFixed(1)} (quá mua)` : rsi < 30 ? `${rsi.toFixed(1)} (quá bán)` : `${rsi.toFixed(1)} (trung tính)`;
    const priceLine = price != null
      ? `$${price.toLocaleString()} (≈ ${priceVnd?.toLocaleString("vi-VN")} ₫)`
      : "?";

    const block = language === "vi"
      ? `BỐI CẢNH THỜI GIAN THỰC (${symbol}${name ? " · " + name : ""}${rank ? " · rank #" + rank : ""}):
- Giá hiện tại: ${priceLine}
- Thay đổi 24h: ${change24h?.toFixed(2) ?? "?"}% | 7d: ${change7d?.toFixed(2) ?? "?"}%
- RSI(14): ${rsiZone} | Chu kỳ: ${cycle ?? "?"}
- Vốn hóa: $${marketCap ? (marketCap / 1e9).toFixed(2) + "B" : "?"} | Volume 24h: $${volume24h ? (volume24h / 1e9).toFixed(2) + "B" : "?"}
- ATH: $${ath?.toLocaleString() ?? "?"} (${athChangePct?.toFixed(1) ?? "?"}% từ đỉnh)
- Biến động năm: ${volatilityAnn != null ? (volatilityAnn * 100).toFixed(1) + "%" : "?"} | Max DD: ${maxDrawdown != null ? "-" + (maxDrawdown * 100).toFixed(1) + "%" : "?"}

YÊU CẦU TRẢ LỜI:
- Xưng "mình" thân thiện${userName ? `, gọi tên "${userName}"` : ""}, giọng chuyên gia tài chính nhưng dễ hiểu
- Dùng dữ liệu thực tế ở trên, KHÔNG bịa số liệu
- Có cấu trúc rõ: nhận định → phân tích kỹ thuật → vùng giá quan trọng → khuyến nghị → rủi ro
- Luôn quy đổi giá ra VND khi nhắc đến điểm mua/bán cụ thể
- Cuối câu trả lời thêm 1 cảnh báo ngắn: "⚠️ Đây không phải lời khuyên đầu tư"

CÂU HỎI: ${q}`
      : `REAL-TIME CONTEXT (${symbol}${name ? " · " + name : ""}${rank ? " · rank #" + rank : ""}):
- Price: ${priceLine}
- 24h: ${change24h?.toFixed(2) ?? "?"}% | 7d: ${change7d?.toFixed(2) ?? "?"}%
- RSI(14): ${rsi?.toFixed(1) ?? "?"} | Cycle: ${cycle ?? "?"}
- MCap: $${marketCap ? (marketCap / 1e9).toFixed(2) + "B" : "?"} | Vol 24h: $${volume24h ? (volume24h / 1e9).toFixed(2) + "B" : "?"}
- ATH: $${ath?.toLocaleString() ?? "?"} (${athChangePct?.toFixed(1) ?? "?"}% from ATH)
- Ann. vol: ${volatilityAnn != null ? (volatilityAnn * 100).toFixed(1) + "%" : "?"} | Max DD: ${maxDrawdown != null ? "-" + (maxDrawdown * 100).toFixed(1) + "%" : "?"}

Use the real numbers, don't invent. Structure: takeaway → TA → key levels → recommendation → risks. End with a brief "Not financial advice" disclaimer.

QUESTION: ${q}`;

    return greet + block;
  };

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || streaming) return;
    setInput("");

    const next: Msg[] = [...messages, { role: "user", content }];
    setMessages(next);
    setStreaming(true);
    setMessages((m) => [...m, { role: "assistant", content: "" }]);

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chatbot-ai`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          message: buildContext(content),
          conversationHistory: next.slice(-8, -1),
          stream: true,
          language,
        }),
      });
      if (!resp.ok || !resp.body) throw new Error("net");
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "", acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          const l = line.trim();
          if (!l.startsWith("data:")) continue;
          const data = l.slice(5).trim();
          if (data === "[DONE]") continue;
          try {
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              acc += delta;
              setMessages((m) => {
                const copy = [...m];
                copy[copy.length - 1] = { role: "assistant", content: acc };
                return copy;
              });
            }
          } catch {}
        }
      }
    } catch {
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = {
          role: "assistant",
          content: language === "vi" ? "😅 Kết nối lỗi. Thử lại nhé!" : "😅 Connection failed. Try again.",
        };
        return copy;
      });
    } finally {
      setStreaming(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const greetingTitle = userName
    ? (language === "vi" ? `Chào ${userName}!` : `Hi ${userName}!`)
    : (language === "vi" ? "Crystal AI · Chuyên gia Crypto" : "Crystal AI · Crypto Expert");

  return (
    <div className="quant-card flex flex-col h-[520px] overflow-hidden">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/30">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary via-primary/80 to-quant-amber/60 flex items-center justify-center shadow-lg shadow-primary/20">
              <Brain className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-500 ring-2 ring-card animate-pulse" />
          </div>
          <div>
            <p className="text-xs font-semibold leading-tight flex items-center gap-1.5">
              {greetingTitle}
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-mono">{symbol}</span>
            </p>
            <p className="text-[10px] text-muted-foreground font-mono leading-tight flex items-center gap-1 mt-0.5">
              <Zap className="w-2.5 h-2.5 text-green-500" />
              {language === "vi"
                ? `Phân tích real-time · ${cycle ?? "?"} cycle · RSI ${rsi?.toFixed(0) ?? "?"}`
                : `Real-time · ${cycle ?? "?"} cycle · RSI ${rsi?.toFixed(0) ?? "?"}`}
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 font-mono"
          >
            <RefreshCw className="w-3 h-3" /> {language === "vi" ? "Mới" : "Clear"}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {messages.length === 0 && (
          <div className="space-y-3">
            <div className="rounded-lg bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 p-3">
              <p className="text-xs leading-relaxed">
                {language === "vi"
                  ? <>👋 <b>{userName ? userName : "Bạn"}</b> ơi, mình là <b>Crystal AI</b> — chuyên gia phân tích crypto. Mình đang theo dõi <b>{symbol}</b> ở mức <span className="font-mono text-primary">${price?.toLocaleString()}</span> (≈ {priceVnd?.toLocaleString("vi-VN")} ₫). Hỏi mình bất cứ điều gì nhé!</>
                  : <>👋 Hi! I'm <b>Crystal AI</b> — your crypto analyst. I'm tracking <b>{symbol}</b> at <span className="font-mono text-primary">${price?.toLocaleString()}</span>. Ask me anything!</>}
              </p>
            </div>
            <p className="text-[11px] text-muted-foreground px-1">
              {language === "vi" ? "💬 Gợi ý câu hỏi:" : "💬 Try asking:"}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-[11px] px-2.5 py-1.5 rounded-full bg-muted/40 hover:bg-primary/15 hover:text-primary hover:border-primary/30 border border-border/40 transition-all text-left"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={cn("flex gap-2", m.role === "user" ? "justify-end" : "justify-start")}>
            {m.role === "assistant" && (
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-quant-amber/60 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-3 h-3 text-primary-foreground" />
              </div>
            )}
            <div
              className={cn(
                "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted/40 text-foreground"
              )}
            >
              {m.role === "assistant" ? (
                <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-pre:my-1 prose-ul:my-1 prose-headings:my-2 prose-headings:text-sm">
                  {m.content ? <ReactMarkdown>{m.content}</ReactMarkdown> : <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{m.content}</p>
              )}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="mt-2 pt-2 border-t border-border/30">
        <div className="flex items-end gap-2 rounded-lg border border-border/50 bg-background/60 focus-within:border-primary/50 transition-colors px-2 py-1.5">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
            }}
            rows={1}
            placeholder={
              language === "vi"
                ? `Hỏi Crystal AI về ${symbol}: vùng giá, xu hướng, rủi ro...`
                : `Ask Crystal AI about ${symbol}: levels, trends, risk...`
            }
            className="flex-1 bg-transparent text-sm outline-none resize-none max-h-24 placeholder:text-muted-foreground"
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || streaming}
            className="h-7 w-7 rounded-md bg-gradient-to-br from-primary to-primary/80 text-primary-foreground hover:opacity-90 disabled:opacity-40 flex items-center justify-center shrink-0 shadow-md shadow-primary/20"
          >
            {streaming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </div>
        <p className="text-[9px] text-muted-foreground font-mono text-center mt-1.5">
          {language === "vi" ? "Crystal AI có thể sai sót · Không phải lời khuyên đầu tư" : "Crystal AI may err · Not financial advice"}
        </p>
      </div>
    </div>
  );
}
