import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, Bitcoin, Landmark, Building2, Cpu, Calendar,
  FileText, Newspaper, Sparkles, ArrowUpRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Beautiful category overview grid — pulls latest N articles from Lovable Cloud
 * once, classifies each by server-tagged topic (source suffix) or keyword fallback,
 * and renders a gorgeous responsive grid of category cards with live counts.
 * Clicking a card switches the active tab in the parent Community page.
 */

type TopicKey = "stocks" | "crypto" | "banking" | "realestate" | "tech" | "events" | "blogs" | "news";

const TOPICS: {
  key: TopicKey; label: string; tabKey: string; icon: any;
  gradient: string; ring: string; iconBg: string; keywords: string[]; tag: string;
}[] = [
  {
    key: "stocks", label: "Cổ phiếu", tabKey: "stocks", icon: TrendingUp,
    gradient: "from-emerald-500/25 via-emerald-500/10 to-transparent",
    ring: "hover:shadow-emerald-500/20 hover:border-emerald-500/40",
    iconBg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    tag: "· Chứng khoán",
    keywords: ["cổ phiếu", "chứng khoán", "vn-index", "vnindex", "hose", "hnx", "stock", "equity", "ipo"],
  },
  {
    key: "crypto", label: "Crypto", tabKey: "crypto", icon: Bitcoin,
    gradient: "from-amber-500/25 via-orange-500/10 to-transparent",
    ring: "hover:shadow-amber-500/20 hover:border-amber-500/40",
    iconBg: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    tag: "· Crypto",
    keywords: ["bitcoin", "btc", "eth", "ethereum", "crypto", "blockchain", "coin", "defi", "nft", "tiền số"],
  },
  {
    key: "banking", label: "Ngân hàng", tabKey: "banking", icon: Landmark,
    gradient: "from-blue-500/25 via-cyan-500/10 to-transparent",
    ring: "hover:shadow-blue-500/20 hover:border-blue-500/40",
    iconBg: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    tag: "· Ngân hàng",
    keywords: ["ngân hàng", "sbv", "tín dụng", "bank", "lãi suất", "nợ xấu", "credit"],
  },
  {
    key: "realestate", label: "Bất động sản", tabKey: "realestate", icon: Building2,
    gradient: "from-rose-500/25 via-pink-500/10 to-transparent",
    ring: "hover:shadow-rose-500/20 hover:border-rose-500/40",
    iconBg: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    tag: "· BĐS",
    keywords: ["bất động sản", "bđs", "nhà đất", "chung cư", "real estate", "property", "căn hộ"],
  },
  {
    key: "tech", label: "Công nghệ", tabKey: "tech", icon: Cpu,
    gradient: "from-violet-500/25 via-purple-500/10 to-transparent",
    ring: "hover:shadow-violet-500/20 hover:border-violet-500/40",
    iconBg: "bg-violet-500/15 text-violet-400 border-violet-500/30",
    tag: "· Công nghệ",
    keywords: ["công nghệ", "ai", "artificial intelligence", "fintech", "technology", "startup", "digital"],
  },
  {
    key: "events", label: "Sự kiện", tabKey: "events", icon: Calendar,
    gradient: "from-teal-500/25 via-cyan-500/10 to-transparent",
    ring: "hover:shadow-teal-500/20 hover:border-teal-500/40",
    iconBg: "bg-teal-500/15 text-teal-400 border-teal-500/30",
    tag: "· Sự kiện",
    keywords: ["sự kiện", "hội thảo", "hội nghị", "event", "conference", "workshop", "webinar"],
  },
  {
    key: "blogs", label: "Blog & Phân tích", tabKey: "blogs", icon: FileText,
    gradient: "from-slate-500/25 via-slate-500/10 to-transparent",
    ring: "hover:shadow-slate-500/20 hover:border-slate-500/40",
    iconBg: "bg-slate-500/15 text-slate-300 border-slate-500/30",
    tag: "",
    keywords: [],
  },
  {
    key: "news", label: "Tin tức tổng hợp", tabKey: "news", icon: Newspaper,
    gradient: "from-primary/25 via-primary/10 to-transparent",
    ring: "hover:shadow-primary/20 hover:border-primary/40",
    iconBg: "bg-primary/15 text-primary border-primary/30",
    tag: "",
    keywords: [],
  },
];

interface Props {
  onSelectTopic: (tabKey: string) => void;
  activeTab: string;
}

export function CategoryOverviewGrid({ onSelectTopic, activeTab }: Props) {
  const [rows, setRows] = useState<{ source: string; title: string; description: string | null; category: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("news_articles")
        .select("source, title, description, category")
        .eq("is_active", true)
        .order("published_at", { ascending: false })
        .limit(400);
      if (!cancelled) {
        setRows(data || []);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const counts = useMemo(() => {
    const c: Record<TopicKey, number> = {
      stocks: 0, crypto: 0, banking: 0, realestate: 0, tech: 0, events: 0, blogs: 0, news: rows.length,
    };
    for (const r of rows) {
      const hay = `${r.title} ${r.description ?? ""}`.toLowerCase();
      const src = r.source || "";
      for (const t of TOPICS) {
        if (t.key === "news") continue;
        if (t.key === "blogs") { if (r.category === "blog") c.blogs++; continue; }
        const tagged = t.tag && src.includes(t.tag);
        const kw = t.keywords.some((k) => hay.includes(k));
        if (tagged || kw) c[t.key]++;
      }
    }
    return c;
  }, [rows]);

  const total = rows.length;
  const maxCount = Math.max(1, ...Object.values(counts).filter((_, i) => i < TOPICS.length - 1));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-border/40 bg-gradient-to-br from-card/80 via-card/40 to-background/60 backdrop-blur-sm p-4 md:p-5"
    >
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Sparkles className="w-4 h-4 text-primary animate-pulse" />
        <h3 className="text-sm font-semibold uppercase tracking-wider">Phân loại bài viết theo danh mục</h3>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
          {loading ? "…" : `${total} bài từ API`}
        </span>
        <span className="ml-auto text-[10px] font-mono text-muted-foreground">
          Nhấp thẻ để chuyển tab
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {TOPICS.map((t, i) => {
          const n = counts[t.key];
          const active = activeTab === t.tabKey;
          const pctBar = t.key === "news" ? 100 : Math.round((n / maxCount) * 100);
          return (
            <motion.button
              key={t.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.03 * i }}
              onClick={() => onSelectTopic(t.tabKey)}
              className={`group relative text-left rounded-xl border transition-all duration-300 overflow-hidden p-3 ${t.ring} ${
                active
                  ? "border-primary/60 shadow-lg shadow-primary/10 bg-card/80"
                  : "border-border/40 bg-card/40 hover:bg-card/60"
              }`}
            >
              {/* Gradient wash */}
              <div className={`absolute inset-0 -z-10 bg-gradient-to-br ${t.gradient} opacity-70 group-hover:opacity-100 transition-opacity`} />
              {/* Grid overlay */}
              <div className="absolute inset-0 -z-10 opacity-[0.04]" style={{
                backgroundImage: "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }} />

              <div className="flex items-start gap-2.5">
                <div className={`p-2 rounded-lg border ${t.iconBg} shrink-0`}>
                  <t.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground truncate">{t.label}</div>
                    <ArrowUpRight className="w-3 h-3 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 ml-auto" />
                  </div>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="font-mono font-bold text-xl text-foreground">
                      {loading ? "…" : n}
                    </span>
                    <span className="text-[10px] text-muted-foreground">bài</span>
                  </div>
                  <div className="h-1 bg-muted/30 rounded overflow-hidden mt-1.5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pctBar}%` }}
                      transition={{ duration: 0.8, delay: 0.1 + i * 0.03 }}
                      className={`h-full ${
                        t.key === "stocks" ? "bg-emerald-500"
                        : t.key === "crypto" ? "bg-amber-500"
                        : t.key === "banking" ? "bg-blue-500"
                        : t.key === "realestate" ? "bg-rose-500"
                        : t.key === "tech" ? "bg-violet-500"
                        : t.key === "events" ? "bg-teal-500"
                        : "bg-primary"
                      }`}
                    />
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
