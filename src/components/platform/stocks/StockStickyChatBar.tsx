import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Sparkles, Loader2, ChevronDown, X, Maximize2, Minimize2,
  LineChart, Calculator, Shield, PieChart, Globe2, Newspaper, Brain, Layers, Zap, Wand2, RefreshCcw,
} from "lucide-react";
import { CitedMarkdown } from "@/components/platform/CitedMarkdown";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

interface Msg { role: "user" | "assistant"; content: string }

interface Props {
  symbol?: string;
  context?: Record<string, any>;
}

/** Rich method taxonomy grouped by discipline. Each prompt is domain-specific. */
type MethodGroup = {
  id: string;
  label: { vi: string; en: string };
  icon: typeof LineChart;
  accent: string; // tailwind gradient classes
  prompts: { vi: string; en: string }[];
};

const METHOD_GROUPS: MethodGroup[] = [
  {
    id: "technical",
    label: { vi: "Kỹ thuật", en: "Technical" },
    icon: LineChart,
    accent: "from-emerald-500/25 to-emerald-500/5 text-emerald-400 border-emerald-500/30",
    prompts: [
      { vi: "Phân tích xu hướng đa khung (D/W/M)", en: "Multi-timeframe trend (D/W/M)" },
      { vi: "Tín hiệu RSI / MACD / Stochastic hiện tại", en: "RSI / MACD / Stochastic signals" },
      { vi: "Vùng hỗ trợ – kháng cự & Fibonacci", en: "Support / resistance & Fibonacci" },
      { vi: "Ichimoku Cloud & Bollinger Bands", en: "Ichimoku Cloud & Bollinger Bands" },
      { vi: "Price action & mô hình nến gần nhất", en: "Latest candlestick patterns" },
      { vi: "Khối lượng, OBV, VWAP", en: "Volume, OBV, VWAP analysis" },
    ],
  },
  {
    id: "fundamental",
    label: { vi: "Cơ bản", en: "Fundamental" },
    icon: Calculator,
    accent: "from-sky-500/25 to-sky-500/5 text-sky-400 border-sky-500/30",
    prompts: [
      { vi: "Đọc báo cáo tài chính 4 quý gần nhất", en: "Read last 4 quarters financials" },
      { vi: "Chất lượng lợi nhuận (Piotroski, Beneish)", en: "Earnings quality (Piotroski, Beneish)" },
      { vi: "Cấu trúc doanh thu & biên lợi nhuận", en: "Revenue mix & margins" },
      { vi: "Đòn bẩy, D/E, Interest Coverage", en: "Leverage, D/E, Interest Coverage" },
      { vi: "So sánh peers cùng ngành", en: "Peer comparison in sector" },
      { vi: "Ban lãnh đạo & quản trị (ESG)", en: "Management & governance (ESG)" },
    ],
  },
  {
    id: "valuation",
    label: { vi: "Định giá", en: "Valuation" },
    icon: PieChart,
    accent: "from-amber-500/25 to-amber-500/5 text-amber-400 border-amber-500/30",
    prompts: [
      { vi: "Định giá DCF 3 kịch bản (Bear/Base/Bull)", en: "3-scenario DCF (Bear/Base/Bull)" },
      { vi: "Định giá P/E, P/B, EV/EBITDA vs ngành", en: "P/E, P/B, EV/EBITDA vs sector" },
      { vi: "Sum-of-the-parts (SOTP)", en: "Sum-of-the-parts (SOTP)" },
      { vi: "Residual Income & EVA", en: "Residual Income & EVA" },
      { vi: "PEG, Graham Number, Owner Earnings", en: "PEG, Graham Number, Owner Earnings" },
      { vi: "Giá mục tiêu 6/12/24 tháng", en: "Price target 6/12/24 months" },
    ],
  },
  {
    id: "risk",
    label: { vi: "Rủi ro", en: "Risk" },
    icon: Shield,
    accent: "from-rose-500/25 to-rose-500/5 text-rose-400 border-rose-500/30",
    prompts: [
      { vi: "VaR & CVaR 1-day 95%/99%", en: "VaR & CVaR 1-day 95%/99%" },
      { vi: "Max Drawdown & thời gian phục hồi", en: "Max Drawdown & recovery time" },
      { vi: "Stress test: khủng hoảng, lãi suất tăng", en: "Stress test: crisis, rate hikes" },
      { vi: "Beta, Downside Beta, Tracking Error", en: "Beta, Downside Beta, Tracking Error" },
      { vi: "GARCH volatility & regime shift", en: "GARCH volatility & regime shift" },
      { vi: "Rủi ro thanh khoản & pha loãng", en: "Liquidity & dilution risk" },
    ],
  },
  {
    id: "portfolio",
    label: { vi: "Danh mục", en: "Portfolio" },
    icon: Layers,
    accent: "from-violet-500/25 to-violet-500/5 text-violet-400 border-violet-500/30",
    prompts: [
      { vi: "Vai trò trong danh mục 60/40", en: "Role in a 60/40 portfolio" },
      { vi: "Tối ưu Markowitz & Max Sharpe", en: "Markowitz & Max Sharpe optimization" },
      { vi: "Risk Parity & Black-Litterman", en: "Risk Parity & Black-Litterman" },
      { vi: "Hedge ratio với chỉ số/ngành", en: "Hedge ratio vs index/sector" },
      { vi: "Kelly Criterion sizing", en: "Kelly Criterion sizing" },
      { vi: "Đề xuất tỉ trọng theo khẩu vị rủi ro", en: "Weight suggestion by risk profile" },
    ],
  },
  {
    id: "quant",
    label: { vi: "Định lượng", en: "Quant" },
    icon: Brain,
    accent: "from-cyan-500/25 to-cyan-500/5 text-cyan-400 border-cyan-500/30",
    prompts: [
      { vi: "Backtest Momentum 12-1", en: "Backtest 12-1 Momentum" },
      { vi: "Mean-reversion Bollinger", en: "Bollinger mean-reversion" },
      { vi: "Monte Carlo 10.000 đường giá 1Y", en: "Monte Carlo 10k paths, 1Y" },
      { vi: "Fama-French 5 factor exposure", en: "Fama-French 5 factor exposure" },
      { vi: "Pairs trading với peer gần nhất", en: "Pairs trading with closest peer" },
      { vi: "Machine Learning forecast (LSTM/XGB)", en: "ML forecast (LSTM/XGB)" },
    ],
  },
  {
    id: "macro",
    label: { vi: "Vĩ mô", en: "Macro" },
    icon: Globe2,
    accent: "from-teal-500/25 to-teal-500/5 text-teal-400 border-teal-500/30",
    prompts: [
      { vi: "Tác động lãi suất & tỷ giá", en: "Rates & FX impact" },
      { vi: "Chu kỳ ngành & vị trí trong chu kỳ", en: "Sector cycle & position" },
      { vi: "Chính sách tiền tệ SBV / Fed", en: "SBV / Fed monetary policy impact" },
      { vi: "Chuỗi cung ứng & hàng hoá", en: "Supply chain & commodities" },
      { vi: "Địa chính trị & thương mại", en: "Geopolitics & trade" },
    ],
  },
  {
    id: "sentiment",
    label: { vi: "Tin & Sentiment", en: "News & Sentiment" },
    icon: Newspaper,
    accent: "from-fuchsia-500/25 to-fuchsia-500/5 text-fuchsia-400 border-fuchsia-500/30",
    prompts: [
      { vi: "Tin tức 7 ngày & tác động giá", en: "7-day news & price impact" },
      { vi: "Fear & Greed liên quan cổ phiếu", en: "Fear & Greed related to stock" },
      { vi: "Dòng tiền khối ngoại & tự doanh", en: "Foreign & prop money flow" },
      { vi: "Insider transactions gần đây", en: "Recent insider transactions" },
      { vi: "Social buzz & retail sentiment", en: "Social buzz & retail sentiment" },
    ],
  },
];

export function StockStickyChatBar({ symbol, context }: Props) {
  const { language } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [closed, setClosed] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [activeGroup, setActiveGroup] = useState<string>(METHOD_GROUPS[0].id);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, streaming]);

  const currentGroup = useMemo(
    () => METHOD_GROUPS.find((g) => g.id === activeGroup) ?? METHOD_GROUPS[0],
    [activeGroup],
  );

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

  const runPrompt = (p: { vi: string; en: string }) => {
    const base = language === "vi" ? p.vi : p.en;
    send(symbol ? `${base} — ${symbol}` : base);
  };

  if (closed) {
    return (
      <div className="sticky bottom-4 z-40 flex justify-center pointer-events-none">
        <button
          onClick={() => setClosed(false)}
          className="pointer-events-auto flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary to-primary/70 text-primary-foreground shadow-[0_10px_40px_-10px_hsl(var(--primary)/0.6)] hover:scale-105 transition-transform"
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-semibold">Crystal AI</span>
          <span className="text-[10px] font-mono opacity-80 hidden sm:inline">
            {language === "vi" ? "· 8 nhóm phân tích" : "· 8 method groups"}
          </span>
        </button>
      </div>
    );
  }

  const t = (vi: string, en: string) => (language === "vi" ? vi : en);

  return (
    <div className={cn(
      "sticky bottom-0 z-40 -mx-4 md:-mx-6 mt-6",
      maximized && "fixed inset-0 mx-0 mt-0",
    )}>
      <div className={cn(
        "border-t border-primary/20 bg-gradient-to-b from-card/95 to-card/90 backdrop-blur-2xl",
        "shadow-[0_-20px_60px_-15px_hsl(var(--primary)/0.35)]",
        maximized && "h-full flex flex-col",
      )}>
        {/* Header ribbon */}
        <div className="px-4 md:px-6 pt-3 pb-2 flex items-center gap-3 border-b border-border/40">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-primary/80 to-primary/50 flex items-center justify-center shadow-lg shadow-primary/30">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-card animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight">Crystal AI Research</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <Zap className="inline w-2.5 h-2.5 -mt-px" /> LIVE
              </span>
              {symbol && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/30">
                  {symbol}
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground leading-tight mt-0.5 truncate">
              {t(
                "8 nhóm phân tích chuyên sâu · Kỹ thuật · Cơ bản · Định giá · Rủi ro · Danh mục · Định lượng · Vĩ mô · Sentiment",
                "8 research disciplines · Technical · Fundamental · Valuation · Risk · Portfolio · Quant · Macro · Sentiment",
              )}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                title={t("Xoá hội thoại", "Clear conversation")}
                className="h-8 w-8 rounded-lg hover:bg-muted/60 flex items-center justify-center text-muted-foreground border border-border/40"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => setMaximized((v) => !v)}
              title={maximized ? t("Thu nhỏ", "Restore") : t("Toàn màn hình", "Fullscreen")}
              className="h-8 w-8 rounded-lg hover:bg-muted/60 flex items-center justify-center text-muted-foreground border border-border/40"
            >
              {maximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => setExpanded((v) => !v)}
              title={expanded ? t("Thu gọn", "Collapse") : t("Mở rộng", "Expand")}
              className="h-8 w-8 rounded-lg hover:bg-muted/60 flex items-center justify-center text-muted-foreground border border-border/40"
            >
              <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", !expanded && "rotate-180")} />
            </button>
            <button
              onClick={() => { setClosed(true); setMaximized(false); }}
              title={t("Đóng", "Close")}
              className="h-8 w-8 rounded-lg hover:bg-destructive/20 hover:text-destructive flex items-center justify-center text-muted-foreground border border-border/40"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Method categories tabs */}
        <div className="px-4 md:px-6 py-2.5 border-b border-border/30 bg-background/30 overflow-x-auto no-scrollbar">
          <div className="flex gap-1.5 min-w-max">
            {METHOD_GROUPS.map((g) => {
              const Icon = g.icon;
              const active = g.id === activeGroup;
              return (
                <button
                  key={g.id}
                  onClick={() => { setActiveGroup(g.id); setExpanded(true); }}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all whitespace-nowrap",
                    active
                      ? `bg-gradient-to-br ${g.accent} shadow-sm`
                      : "border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted/40",
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {g.label[language as "vi" | "en"] ?? g.label.en}
                </button>
              );
            })}
          </div>
        </div>

        {/* Expanded body: prompt library + messages */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="body"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="overflow-hidden"
            >
              <div className={cn(
                "grid gap-0 md:grid-cols-[320px_1fr]",
                maximized ? "h-[calc(100vh-260px)]" : "h-[min(560px,70vh)]",
              )}>
                {/* Prompt library */}
                <div className="border-r border-border/30 bg-background/20 overflow-y-auto p-3">
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <Wand2 className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {currentGroup.label[language as "vi" | "en"] ?? currentGroup.label.en} · {t("Câu hỏi mẫu", "Prompt library")}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {currentGroup.prompts.map((p, i) => (
                      <button
                        key={i}
                        onClick={() => runPrompt(p)}
                        disabled={streaming}
                        className={cn(
                          "w-full text-left text-[12.5px] leading-snug px-3 py-2 rounded-lg border transition-all",
                          "border-border/40 bg-card/40 hover:bg-primary/10 hover:border-primary/40 hover:text-primary",
                          "disabled:opacity-50 disabled:cursor-not-allowed",
                        )}
                      >
                        {p[language as "vi" | "en"] ?? p.en}
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 p-3 rounded-lg border border-primary/20 bg-primary/5">
                    <div className="text-[10px] font-mono text-primary/80 uppercase tracking-wider mb-1">
                      {t("Mẹo", "Tip")}
                    </div>
                    <p className="text-[11.5px] text-muted-foreground leading-relaxed">
                      {t(
                        "Kết hợp nhiều nhóm để có báo cáo 360°: Kỹ thuật + Định giá + Rủi ro thường tạo khuyến nghị mạnh nhất.",
                        "Combine groups for a 360° report — Technical + Valuation + Risk usually yields the strongest call.",
                      )}
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <div className="overflow-y-auto px-4 md:px-6 py-4 space-y-4">
                  {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center py-10">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4 border border-primary/30">
                        <Sparkles className="w-7 h-7 text-primary" />
                      </div>
                      <p className="text-sm font-semibold mb-1">
                        {t(`Sẵn sàng phân tích ${symbol || "thị trường"}`, `Ready to analyze ${symbol || "the market"}`)}
                      </p>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        {t(
                          "Chọn một câu hỏi mẫu bên trái, hoặc gõ câu hỏi của bạn bên dưới.",
                          "Pick a prompt on the left or type your own question below.",
                        )}
                      </p>
                    </div>
                  )}
                  {messages.map((m, i) => (
                    <div key={i} className={cn("flex gap-3", m.role === "user" ? "justify-end" : "justify-start")}>
                      {m.role === "assistant" && (
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center shrink-0 mt-0.5 border border-primary/30">
                          <Sparkles className="w-4 h-4 text-primary" />
                        </div>
                      )}
                      <div className={cn(
                        "max-w-[85%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed",
                        m.role === "user"
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                          : "bg-muted/40 text-foreground border border-border/40",
                      )}>
                        {m.role === "assistant" ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1.5 prose-pre:my-2 prose-ul:my-1.5 prose-headings:my-2 prose-headings:text-sm">
                            {m.content ? (
                              <CitedMarkdown
                                content={m.content}
                                rawContext={
                                  symbol
                                    ? `symbol=${symbol}\n${context ? JSON.stringify(context, null, 2) : "(không có dữ liệu context)"}`
                                    : undefined
                                }
                              />
                            ) : (
                              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
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
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Composer */}
        <div className="px-4 md:px-6 py-3 border-t border-border/30 bg-background/40">
          <div className="flex items-end gap-2 rounded-xl border border-border/50 bg-background/70 focus-within:border-primary/60 focus-within:shadow-[0_0_0_3px_hsl(var(--primary)/0.12)] transition-all px-3 py-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
              }}
              rows={1}
              placeholder={t(
                `Hỏi Crystal AI về ${symbol || "thị trường"} — kỹ thuật, định giá, rủi ro, danh mục...`,
                `Ask Crystal AI about ${symbol || "the market"} — technicals, valuation, risk, portfolio...`,
              )}
              className="flex-1 bg-transparent text-sm outline-none resize-none max-h-28 min-h-[24px] placeholder:text-muted-foreground py-1"
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || streaming}
              className="h-9 px-4 rounded-lg bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:opacity-90 disabled:opacity-40 flex items-center gap-2 shrink-0 shadow-md shadow-primary/20 text-sm font-medium"
            >
              {streaming
                ? <><Loader2 className="w-4 h-4 animate-spin" /> {t("Đang phân tích", "Analyzing")}</>
                : <><Send className="w-4 h-4" /> {t("Gửi", "Send")}</>}
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 px-1 font-mono flex items-center justify-between">
            <span>{t("Enter gửi · Shift+Enter xuống dòng", "Enter to send · Shift+Enter for new line")}</span>
            <span className="hidden sm:inline">
              {t("Powered by Crystall Quant AI", "Powered by Crystall Quant AI")}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
