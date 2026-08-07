import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Sparkles,
  Loader2,
  X,
  Maximize2,
  Minimize2,
  MessageSquare,
  Zap,
  Square,
  Copy,
  Check,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { CitedMarkdown } from "@/components/platform/CitedMarkdown";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Msg { role: "user" | "assistant"; content: string; ts?: number }

const STORAGE_KEY = "crystal-ai-chat-v1";

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

  const greeting: Msg = {
    role: "assistant",
    content:
      language === "vi"
        ? "👋 Xin chào! Mình là **Crystal AI** — trợ lý phân tích đầu tư real-time. Hỏi mình về cổ phiếu, crypto, danh mục, hoặc bất kỳ chỉ số nào trên dashboard."
        : "👋 Hi! I'm **Crystal AI** — your real-time investment analyst. Ask me about stocks, crypto, portfolio, or any metric on the dashboard.",
  };

  const [open, setOpen] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as Msg[]) : null;
      if (parsed && Array.isArray(parsed) && parsed.length) return parsed;
    } catch {}
    return [greeting];
  });
  const [streaming, setStreaming] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lastUserRef = useRef<string>("");

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-50)));
    } catch {}
  }, [messages]);

  // auto-resize textarea
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [input]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreaming(false);
  }, []);

  const clearChat = useCallback(() => {
    stop();
    setMessages([greeting]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, stop]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || streaming) return;
    lastUserRef.current = content;
    setInput("");
    const next: Msg[] = [...messages, { role: "user", content, ts: Date.now() }];
    setMessages(next);
    setStreaming(true);
    setMessages((m) => [...m, { role: "assistant", content: "", ts: Date.now() }]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chatbot-ai`;
      const resp = await fetch(url, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          message: content,
          conversationHistory: next
            .slice(-10, -1)
            .map(({ role, content }) => ({ role, content })),
          stream: true,
          language,
        }),
      });

      if (resp.status === 429) throw new Error("rate");
      if (resp.status === 402) throw new Error("credits");
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
                copy[copy.length - 1] = { role: "assistant", content: acc, ts: Date.now() };
                return copy;
              });
            }
          } catch {}
        }
      }

      if (!acc.trim()) {
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = {
            role: "assistant",
            content:
              language === "vi"
                ? "⚠️ Không nhận được nội dung trả lời. Bạn thử hỏi lại nhé."
                : "⚠️ No content returned. Please try asking again.",
          };
          return copy;
        });
      }
    } catch (e) {
      const kind = e instanceof Error ? e.message : "network";
      if (kind === "AbortError" || controller.signal.aborted) {
        setMessages((m) => {
          const copy = [...m];
          const last = copy[copy.length - 1];
          if (last && last.role === "assistant" && !last.content.trim()) copy.pop();
          return copy;
        });
      } else {
        const msg =
          kind === "rate"
            ? language === "vi"
              ? "⏳ Quá nhiều yêu cầu. Vui lòng thử lại sau ít phút."
              : "⏳ Rate limit reached. Please try again shortly."
            : kind === "credits"
              ? language === "vi"
                ? "💳 Hết credit AI. Vui lòng nạp thêm để tiếp tục."
                : "💳 AI credits exhausted. Please top up to continue."
              : language === "vi"
                ? "😅 Mạng đang chập chờn. Thử lại nhé!"
                : "😅 Connection error. Please try again.";
        toast.error(msg);
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", content: msg, ts: Date.now() };
          return copy;
        });
      }
    } finally {
      abortRef.current = null;
      setStreaming(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const retry = () => {
    if (streaming || !lastUserRef.current) return;
    setMessages((m) => {
      const copy = [...m];
      if (copy[copy.length - 1]?.role === "assistant") copy.pop();
      if (copy[copy.length - 1]?.role === "user") copy.pop();
      return copy;
    });
    setTimeout(() => send(lastUserRef.current), 0);
  };

  const copyMsg = async (i: number, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(i);
      setTimeout(() => setCopied(null), 1500);
    } catch {}
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
            aria-label="Open Crystal AI chat"
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
              "fixed z-50 right-4 bottom-4 rounded-xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl shadow-primary/10 overflow-hidden flex flex-col",
              expanded
                ? "w-[min(720px,calc(100vw-2rem))] h-[80vh]"
                : "w-[min(440px,calc(100vw-2rem))] h-[520px]",
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
                    <Zap className="w-2.5 h-2.5 text-green-500" />
                    {streaming
                      ? language === "vi"
                        ? "Đang trả lời..."
                        : "Thinking..."
                      : "Real-time"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                <button
                  onClick={retry}
                  disabled={streaming || !lastUserRef.current}
                  title={language === "vi" ? "Trả lời lại" : "Regenerate"}
                  className="h-7 w-7 rounded-md hover:bg-muted/50 disabled:opacity-30 flex items-center justify-center text-muted-foreground"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={clearChat}
                  title={language === "vi" ? "Xoá hội thoại" : "Clear chat"}
                  className="h-7 w-7 rounded-md hover:bg-muted/50 flex items-center justify-center text-muted-foreground"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
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
                  className={cn("flex gap-2 group", m.role === "user" ? "justify-end" : "justify-start")}
                >
                  {m.role === "assistant" && (
                    <div className="w-6 h-6 rounded-md bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-3 h-3 text-primary" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg px-3 py-2 text-sm relative",
                      m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/40 text-foreground",
                    )}
                  >
                    {m.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-pre:my-1 prose-ul:my-1 prose-headings:my-2 prose-headings:text-sm">
                        {m.content ? (
                          <CitedMarkdown content={m.content} />
                        ) : (
                          <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            {language === "vi" ? "Đang phân tích..." : "Analyzing..."}
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    )}

                    {m.content && (
                      <button
                        onClick={() => copyMsg(i, m.content)}
                        title={language === "vi" ? "Sao chép" : "Copy"}
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-md border border-border/50 bg-card text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        {copied === i ? (
                          <Check className="w-3 h-3 text-green-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
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
                  className="flex-1 bg-transparent text-sm outline-none resize-none max-h-32 placeholder:text-muted-foreground"
                />
                {streaming ? (
                  <button
                    onClick={stop}
                    title={language === "vi" ? "Dừng" : "Stop"}
                    className="h-7 w-7 rounded-md bg-destructive text-destructive-foreground hover:opacity-90 flex items-center justify-center shrink-0"
                  >
                    <Square className="w-3 h-3 fill-current" />
                  </button>
                ) : (
                  <button
                    onClick={() => send()}
                    disabled={!input.trim()}
                    className="h-7 w-7 rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 flex items-center justify-center shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 px-1 font-mono">
                {language === "vi"
                  ? "Enter để gửi · Shift+Enter xuống dòng · Lịch sử được lưu tự động"
                  : "Enter to send · Shift+Enter for new line · History auto-saved"}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
