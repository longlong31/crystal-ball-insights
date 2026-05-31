import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Loader2, X, Maximize2, Minimize2, MessageSquare, Zap } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

interface Msg { role: "user" | "assistant"; content: string }

const SUGGESTIONS_VI = [
  "Phân tích VCB hôm nay",
  "BTC có nên mua không?",
  "Giải thích chỉ số Sharpe",
  "Tối ưu danh mục 60/40",
];
const SUGGESTIONS_EN = [
  "Analyze VCB today",
  "Should I buy BTC now?",
  "Explain Sharpe Ratio",
  "Optimize 60/40 portfolio",
];

export function PlatformChatDock() {
  const { language } = useLanguage();
  const [open, setOpen] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        language === "vi"
          ? "👋 Xin chào! Mình là **Crystal AI** — trợ lý phân tích đầu tư real-time. Hỏi mình về cổ phiếu, crypto, danh mục, hoặc bất kỳ chỉ số nào trên dashboard."
          : "👋 Hi! I'm **Crystal AI** — your real-time investment analyst. Ask me about stocks, crypto, portfolio, or any metric on the dashboard.",
    },
  ]);
  const [streaming, setStreaming] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

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
          message: content,
          conversationHistory: next.slice(-10, -1),
          stream: true,
          language,
        }),
      });

      if (!resp.ok || !resp.body) throw new Error("network");
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let acc = "";

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
          content:
            language === "vi"
              ? "😅 Mạng đang chập chờn. Thử lại nhé!"
              : "😅 Connection error. Please try again.",
        };
        return copy;
      });
    } finally {
      setStreaming(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const suggestions = language === "vi" ? SUGGESTIONS_VI : SUGGESTIONS_EN;

  return (
    <>
      {/* Floating toggle when closed */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-gradient-to-br from-primary to-primary/70 shadow-[0_0_30px_hsl(var(--primary)/0.5)] flex items-center justify-center text-primary-foreground hover:scale-105 transition-transform"
          >
            <MessageSquare className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-green-500 animate-pulse" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={cn(
              "fixed z-50 right-4 bottom-4 w-[min(440px,calc(100vw-2rem))] rounded-xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl shadow-primary/10 overflow-hidden flex flex-col",
              expanded ? "h-[80vh]" : "h-[520px]",
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 h-11 border-b border-border/40 bg-gradient-to-r from-primary/10 via-transparent to-primary/5">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-500 ring-2 ring-card" />
                </div>
                <div>
                  <p className="text-xs font-semibold leading-tight">Crystal AI</p>
                  <p className="text-[10px] text-muted-foreground font-mono leading-tight flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5 text-green-500" /> Real-time
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => setExpanded((e) => !e)}
                  className="h-7 w-7 rounded-md hover:bg-muted/50 flex items-center justify-center text-muted-foreground"
                >
                  {expanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="h-7 w-7 rounded-md hover:bg-muted/50 flex items-center justify-center text-muted-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={cn("flex gap-2", m.role === "user" ? "justify-end" : "justify-start")}
                >
                  {m.role === "assistant" && (
                    <div className="w-6 h-6 rounded-md bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-3 h-3 text-primary" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                      m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/40 text-foreground",
                    )}
                  >
                    {m.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-pre:my-1 prose-ul:my-1 prose-headings:my-2 prose-headings:text-sm">
                        {m.content ? (
                          <ReactMarkdown>{m.content}</ReactMarkdown>
                        ) : (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                        )}
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    )}
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>

            {/* Suggestions */}
            {messages.length <= 1 && (
              <div className="px-3 pb-2 flex flex-wrap gap-1.5">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-[11px] px-2 py-1 rounded-full bg-muted/40 hover:bg-primary/15 hover:text-primary border border-border/40 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="border-t border-border/40 p-2 bg-background/30">
              <div className="flex items-end gap-2 rounded-lg border border-border/50 bg-background/60 focus-within:border-primary/50 transition-colors px-2 py-1.5">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  rows={1}
                  placeholder={
                    language === "vi"
                      ? "Hỏi Crystal AI về thị trường..."
                      : "Ask Crystal AI about markets..."
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
              <p className="text-[10px] text-muted-foreground mt-1 px-1 font-mono">
                {language === "vi"
                  ? "Enter để gửi · Shift+Enter xuống dòng"
                  : "Enter to send · Shift+Enter for new line"}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
