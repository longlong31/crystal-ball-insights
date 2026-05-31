import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Send, Sparkles, Loader2, Zap, RefreshCw } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

interface Msg { role: "user" | "assistant"; content: string }

interface Props {
  symbol: string;
  price?: number;
  change24h?: number;
  rsi?: number;
  cycle?: string;
}

export function CryptoChatPanel({ symbol, price, change24h, rsi, cycle }: Props) {
  const { language } = useLanguage();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const suggestions = language === "vi"
    ? [
        `Phân tích kỹ thuật ${symbol} bây giờ`,
        `${symbol} có nên mua không?`,
        `Vùng hỗ trợ/kháng cự ${symbol}`,
        `So sánh ${symbol} với BTC`,
      ]
    : [
        `Technical analysis on ${symbol} now`,
        `Should I buy ${symbol}?`,
        `Support & resistance for ${symbol}`,
        `Compare ${symbol} with BTC`,
      ];

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, streaming]);
  useEffect(() => { setMessages([]); }, [symbol]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || streaming) return;
    setInput("");

    const ctx = language === "vi"
      ? `Bối cảnh thời gian thực — ${symbol}: giá $${price?.toLocaleString() ?? "?"}, 24h ${change24h?.toFixed(2) ?? "?"}%, RSI(14) ${rsi?.toFixed(1) ?? "?"}, chu kỳ ${cycle ?? "?"}. Câu hỏi:`
      : `Real-time context — ${symbol}: price $${price?.toLocaleString() ?? "?"}, 24h ${change24h?.toFixed(2) ?? "?"}%, RSI(14) ${rsi?.toFixed(1) ?? "?"}, cycle ${cycle ?? "?"}. Question:`;

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
          message: `${ctx} ${content}`,
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

  return (
    <div className="quant-card flex flex-col h-[460px] overflow-hidden">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/30">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-500 ring-2 ring-card animate-pulse" />
          </div>
          <div>
            <p className="text-xs font-semibold leading-tight">
              {language === "vi" ? "Hỏi Crystal AI" : "Ask Crystal AI"} · {symbol}
            </p>
            <p className="text-[10px] text-muted-foreground font-mono leading-tight flex items-center gap-1">
              <Zap className="w-2.5 h-2.5 text-green-500" />
              {language === "vi" ? "Phân tích real-time" : "Real-time analyst"}
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
          <div className="space-y-2">
            <p className="text-[11px] text-muted-foreground px-1">
              {language === "vi"
                ? `Gợi ý câu hỏi về ${symbol}:`
                : `Suggested questions about ${symbol}:`}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-[11px] px-2 py-1 rounded-full bg-muted/40 hover:bg-primary/15 hover:text-primary border border-border/40 transition-colors text-left"
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
              <div className="w-6 h-6 rounded-md bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-3 h-3 text-primary" />
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
              language === "vi" ? `Hỏi về ${symbol}, vùng giá, xu hướng...` : `Ask about ${symbol}, levels, trends...`
            }
            className="flex-1 bg-transparent text-sm outline-none resize-none max-h-24 placeholder:text-muted-foreground"
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || streaming}
            className="h-7 w-7 rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 flex items-center justify-center shrink-0"
          >
            {streaming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
