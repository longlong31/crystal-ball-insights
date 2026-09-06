import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BookOpen, Database, ExternalLink, Newspaper, Radio, Sigma } from "lucide-react";
import { cn } from "@/lib/utils";

type SourceKind = "live" | "news" | "model" | "internal" | "general";

interface SourceMeta {
  kind: SourceKind;
  label: string;
  what: string;
  url?: string;
  freshness?: string;
}

const KIND_STYLE: Record<SourceKind, { icon: typeof Radio; cls: string }> = {
  live: { icon: Radio, cls: "text-emerald-500 border-emerald-500/40 bg-emerald-500/10" },
  news: { icon: Newspaper, cls: "text-amber-500 border-amber-500/40 bg-amber-500/10" },
  model: { icon: Sigma, cls: "text-violet-500 border-violet-500/40 bg-violet-500/10" },
  internal: { icon: Database, cls: "text-sky-500 border-sky-500/40 bg-sky-500/10" },
  general: { icon: BookOpen, cls: "text-muted-foreground border-border bg-muted/40" },
};

/** Registry: matched by lowercase substring of the citation text. */
const REGISTRY: Array<{ match: string[]; meta: SourceMeta }> = [
  {
    match: ["yahoo"],
    meta: {
      kind: "live",
      label: "Yahoo Finance",
      what: "Quote intraday, OHLCV lịch sử, vốn hoá, P/E — lấy qua Edge Function fetch-stock-data, cache/refresh 30 giây.",
      url: "https://finance.yahoo.com/",
      freshness: "Trễ 15 phút với một số sàn; crypto & US realtime.",
    },
  },
  {
    match: ["coingecko", "crypto"],
    meta: {
      kind: "live",
      label: "CoinGecko API",
      what: "Giá crypto, market cap, volume 24h, biến động — Edge Function fetch-market-data, refresh 30 giây.",
      url: "https://www.coingecko.com/",
      freshness: "Realtime ~30–60 giây.",
    },
  },
  {
    match: ["context", "dashboard", "rtđ", "real-time", "realtime"],
    meta: {
      kind: "live",
      label: "Context dashboard",
      what: "Chính dữ liệu đang hiển thị trên trang (giá, % thay đổi, chỉ báo kỹ thuật) được gửi kèm câu hỏi cho AI.",
      freshness: "Bằng đúng thời điểm bạn gửi câu hỏi.",
    },
  },
  {
    match: ["cafef", "vnexpress", "rss", "news", "tin tức", "báo"],
    meta: {
      kind: "news",
      label: "RSS tin tài chính",
      what: "CafeF, VnExpress Kinh doanh, Vietstock… được thu thập bởi cron fetch-news và lưu ở bảng news_articles.",
      url: "/community",
      freshness: "Cập nhật mỗi sáng 6:00 + khi bấm Refresh.",
    },
  },
  {
    match: ["capm", "sharpe", "dcf", "mô hình", "model", "kiến thức mô hình"],
    meta: {
      kind: "model",
      label: "Kiến thức mô hình",
      what: "Công thức học thuật chuẩn: CAPM (Sharpe 1964), Sharpe/Sortino, DCF, Black–Scholes, Altman Z, Piotroski F.",
      freshness: "Không phải dữ liệu thị trường — chỉ là công thức.",
    },
  },
  {
    match: ["công thức nội bộ", "monte carlo", "gbm", "internal"],
    meta: {
      kind: "internal",
      label: "Công thức nội bộ Crystall",
      what: "Tính trực tiếp trong trình duyệt: Monte Carlo GBM, VaR/CVaR lịch sử, RSI/MACD/Bollinger, PCA — xem code tại tab Python Lab.",
      freshness: "Tính lại mỗi lần bạn mở tab.",
    },
  },
];

function resolve(citation: string): SourceMeta {
  const low = citation.toLowerCase();
  for (const r of REGISTRY) if (r.match.some((m) => low.includes(m))) return r.meta;
  return {
    kind: "general",
    label: "Kiến thức tổng quát",
    what: "Không có dữ liệu thời gian thực kèm theo — đây là kiến thức nền của mô hình AI, cần tự kiểm chứng.",
  };
}

function SourceChip({ citation, raw }: { citation: string; raw?: string }) {
  const meta = resolve(citation);
  const { icon: Icon, cls } = KIND_STYLE[meta.kind];
  const isExternal = meta.url?.startsWith("http");
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1 align-baseline rounded-full border px-1.5 py-[1px] mx-0.5 text-[10px] font-mono leading-4 hover:brightness-125 transition",
            cls,
          )}
        >
          <Icon className="w-2.5 h-2.5" />
          {citation.length > 42 ? citation.slice(0, 42) + "…" : citation}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 text-xs space-y-2">
        <div className="flex items-center gap-2">
          <span className={cn("inline-flex items-center gap-1 rounded-full border px-1.5 py-[1px] text-[10px] font-mono", cls)}>
            <Icon className="w-2.5 h-2.5" />
            {meta.label}
          </span>
        </div>
        <p className="text-muted-foreground leading-relaxed">{meta.what}</p>
        <div className="rounded-md border border-border/50 bg-muted/30 p-2">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Trích dẫn nguyên văn</p>
          <p className="font-mono text-[11px] break-words">({citation})</p>
        </div>
        {raw && (
          <div className="rounded-md border border-border/50 bg-muted/30 p-2 max-h-40 overflow-auto">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Dữ liệu gốc gửi kèm</p>
            <pre className="font-mono text-[10px] whitespace-pre-wrap break-words">{raw}</pre>
          </div>
        )}
        {meta.freshness && <p className="text-[10px] text-muted-foreground">⏱ {meta.freshness}</p>}
        {meta.url && (
          <a
            href={meta.url}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noreferrer" : undefined}
            className="inline-flex items-center gap-1 text-primary hover:underline text-[11px]"
          >
            <ExternalLink className="w-3 h-3" /> Mở nguồn gốc
          </a>
        )}
      </PopoverContent>
    </Popover>
  );
}

const CITE_RE = /\((?:Nguồn|Source)\s*:\s*([^()]{2,160})\)/gi;

/** Splits text nodes on citations and renders clickable chips. */
function withChips(children: React.ReactNode, raw?: string): React.ReactNode {
  const walk = (node: React.ReactNode, key: number): React.ReactNode => {
    if (typeof node !== "string") return node;
    const parts: React.ReactNode[] = [];
    let last = 0;
    let m: RegExpExecArray | null;
    CITE_RE.lastIndex = 0;
    while ((m = CITE_RE.exec(node))) {
      if (m.index > last) parts.push(node.slice(last, m.index));
      parts.push(<SourceChip key={`${key}-${m.index}`} citation={m[1].trim()} raw={raw} />);
      last = m.index + m[0].length;
    }
    if (!parts.length) return node;
    if (last < node.length) parts.push(node.slice(last));
    return parts;
  };
  return Array.isArray(children) ? children.map((c, i) => walk(c, i)) : walk(children, 0);
}

interface Props {
  content: string;
  /** Raw context payload sent along with the question, shown verbatim inside source popovers. */
  rawContext?: string;
}

export function CitedMarkdown({ content, rawContext }: Props) {
  const components = useMemo(
    () => ({
      p: ({ children }: any) => <p>{withChips(children, rawContext)}</p>,
      li: ({ children }: any) => <li>{withChips(children, rawContext)}</li>,
      td: ({ children }: any) => <td>{withChips(children, rawContext)}</td>,
      em: ({ children }: any) => <em>{withChips(children, rawContext)}</em>,
      strong: ({ children }: any) => <strong>{withChips(children, rawContext)}</strong>,
    }),
    [rawContext],
  );
  return <ReactMarkdown components={components as any}>{content}</ReactMarkdown>;
}
