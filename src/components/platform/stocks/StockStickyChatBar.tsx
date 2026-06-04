import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Loader2, ChevronUp, ChevronDown, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

interface Msg { role: "user" | "assistant"; content: string }

interface Props {
  symbol?: string;
  context?: Record<string, any>;
}

const QUICK_VI = ["Phân tích kỹ thuật", "Định giá theo CAPM", "Khuyến nghị mua/bán", "Rủi ro chính", "So với ngành"];
const QUICK_EN = ["Technical view", "CAPM valuation", "Buy/Sell call", "Key risks", "Vs sector"];

export function StockStickyChatBar({ symbol, context }: Props) {
  const { language } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const [closed, setClosed] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [streaming, setStreaming] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, streaming]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || streaming) return;
    setExpanded(true);
    setInput("");
    const ctxNote = symbol
      ? `\n[Context: symbol=${symbol}${context ? " · " + JSON.stringify(context).slice(0, 400) : ""}]`
      : "";
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
          message: content + ctxNote,
          conversationHistory: next.slice(-10, -1),
          stream: true,
          language,
        }),
      });
      if (!resp.ok || !resp.body) throw new Error("network");
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
        copy[copy.length - 1] = { role: "assistant", content: language === "vi" ? "😅 Mạng lỗi. Thử lại nhé." : "😅 Network error. Try again." };
        return copy;
      });
    } finally {
      setStreaming(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  if (closed) {
    return (
      <button
        onClick={() => setClosed(false)}
        className="sticky bottom-3 z-40 mx-auto flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:scale-105 transition-transform"
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span className="text-xs font-medium">Crystal AI</span>
      </button>
    );
  }

  const quick = language === "vi" ? QUICK_VI : QUICK_EN;

  return (
    <div className="sticky bottom-0 z-40 -mx-4 md:-mx-6 mt-4">
      <div className="border-t border-border/40 bg-card/85 backdrop-blur-xl shadow-[0_-8px_30px_-12px_hsl(var(--primary)/0.25)]">
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="messages"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="max-h-[40vh] overflow-y-auto px-4 md:px-6 py-3 space-y-2">
                {messages.map((m, i) => (
                  <div key={i} className={cn("flex gap-2", m.role === "user" ? "justify-end" : "justify-start")}>
                    {m.role === "assistant" && (
                      <div className="w-6 h-6 rounded-md bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                        <Sparkles className="w-3 h-3 text-primary" />
                      </div>
                    )}
                    <div className={cn(
                      "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                      m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted/40 text-foreground",
                    )}>
                      {m.role === "assistant" ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-pre:my-1 prose-ul:my-1 prose-headings:my-1 prose-headings:text-sm">
                          {m.content ? <ReactMarkdown>{m.content}</ReactMarkdown>
                            : <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{m.content}</p>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={endRef} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="px-4 md:px-6 py-2.5 flex items-center gap-2">
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <div className="hidden md:flex flex-col leading-tight">
              <span className="text-[11px] font-semibold">Crystal AI</span>
              <span className="text-[9px] font-mono text-muted-foreground">{symbol || "Realtime"}</span>
            </div>
          </div>

          {/* Quick chips */}
          <div className="flex gap-1 overflow-x-auto no-scrollbar shrink-0 max-w-[40%]">
            {quick.map((q) => (
              <button
                key={q}
                onClick={() => send(symbol ? `${q} cho ${symbol}` : q)}
                className="text-[10px] px-2 py-1 rounded-full bg-muted/40 hover:bg-primary/15 hover:text-primary border border-border/40 whitespace-nowrap transition-colors"
              >
                {q}
              </button>
            ))}
          </div>

          <div className="flex-1 flex items-center gap-2 rounded-lg border border-border/50 bg-background/60 focus-within:border-primary/50 transition-colors px-2.5 py-1.5 min-w-0">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); send(); } }}
              placeholder={language === "vi" ? `Hỏi Crystal AI về ${symbol || "thị trường"}...` : `Ask Crystal AI about ${symbol || "the market"}...`}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground min-w-0"
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || streaming}
              className="h-7 w-7 rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 flex items-center justify-center shrink-0"
            >
              {streaming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </button>
          </div>

          <button
            onClick={() => setExpanded((e) => !e)}
            title={expanded ? "Thu gọn" : "Mở rộng"}
            className="h-8 w-8 rounded-md hover:bg-muted/50 flex items-center justify-center text-muted-foreground shrink-0"
          >
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setClosed(true)}
            title="Đóng"
            className="h-8 w-8 rounded-md hover:bg-muted/50 flex items-center justify-center text-muted-foreground shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
