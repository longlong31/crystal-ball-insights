import { useEffect, useRef, useState } from "react";
import { ExternalLink, ChevronDown, ChevronUp } from "lucide-react";

/**
 * Convert internal ticker (e.g. "ACB.VN", "AAPL", "BTC-USD") to a TradingView
 * fully-qualified symbol. Falls back to the raw symbol if unknown.
 */
function toTVSymbol(symbol: string): string {
  if (!symbol) return "HOSE:VNINDEX";
  const s = symbol.trim().toUpperCase();
  if (s.endsWith(".VN")) return `HOSE:${s.replace(".VN", "")}`;
  if (s.endsWith(".HK")) return `HKEX:${s.replace(".HK", "")}`;
  if (s.endsWith(".L")) return `LSE:${s.replace(".L", "")}`;
  if (s.endsWith(".T")) return `TSE:${s.replace(".T", "")}`;
  if (s.endsWith(".SS")) return `SSE:${s.replace(".SS", "")}`;
  if (s.endsWith(".SZ")) return `SZSE:${s.replace(".SZ", "")}`;
  if (s.endsWith("=F")) return `COMEX:${s.replace("=F", "")}`;
  if (s.endsWith("-USD")) return `BINANCE:${s.replace("-USD", "USDT")}`;
  if (s.includes(":")) return s;
  return s; // TradingView resolves plain US tickers
}

function tvUrl(symbol: string) {
  const s = symbol.trim().toUpperCase();
  if (s.endsWith(".VN")) return `https://vn.tradingview.com/symbols/HOSE-${s.replace(".VN", "")}/`;
  return `https://vn.tradingview.com/symbols/${toTVSymbol(symbol).replace(":", "-")}/`;
}

interface WidgetProps {
  script: string;
  config: Record<string, unknown>;
  height: number;
}

function TVWidget({ script, config, height }: WidgetProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = "";
    const container = document.createElement("div");
    container.className = "tradingview-widget-container__widget";
    ref.current.appendChild(container);

    const s = document.createElement("script");
    s.type = "text/javascript";
    s.async = true;
    s.src = `https://s3.tradingview.com/external-embedding/${script}`;
    s.innerHTML = JSON.stringify(config);
    ref.current.appendChild(s);

    return () => {
      if (ref.current) ref.current.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(config), script]);

  return (
    <div
      ref={ref}
      className="tradingview-widget-container rounded-lg overflow-hidden bg-card border border-border/40"
      style={{ height }}
    />
  );
}

interface Props {
  symbol: string;
}

export function TradingViewPanel({ symbol }: Props) {
  const tvSymbol = toTVSymbol(symbol);
  const [openChart, setOpenChart] = useState(true);
  const [openProfile, setOpenProfile] = useState(true);
  const [openFinancials, setOpenFinancials] = useState(false);
  const [openTech, setOpenFundTech] = useState(false);

  const commonTheme = {
    colorTheme: "dark",
    isTransparent: true,
    locale: "vi_VN",
    largeChartUrl: "",
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold">TV</div>
          <div>
            <p className="text-xs font-semibold">TradingView Insights</p>
            <p className="text-[10px] font-mono text-muted-foreground">{tvSymbol}</p>
          </div>
        </div>
        <a
          href={tvUrl(symbol)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary/15 hover:bg-primary/25 text-primary transition-colors"
        >
          Xem trên TradingView <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Advanced Chart */}
      <Section title="📈 Biểu đồ nâng cao" open={openChart} onToggle={() => setOpenChart(!openChart)}>
        <TVWidget
          script="tv.js"
          height={520}
          config={{
            ...commonTheme,
            autosize: true,
            symbol: tvSymbol,
            interval: "D",
            timezone: "Asia/Ho_Chi_Minh",
            style: "1",
            enable_publishing: false,
            hide_top_toolbar: false,
            hide_legend: false,
            withdateranges: true,
            allow_symbol_change: true,
            calendar: false,
            studies: ["MASimple@tv-basicstudies", "RSI@tv-basicstudies", "MACD@tv-basicstudies"],
          }}
        />
      </Section>

      {/* Symbol Profile */}
      <Section title="🏢 Hồ sơ công ty" open={openProfile} onToggle={() => setOpenProfile(!openProfile)}>
        <TVWidget
          script="embed-widget-symbol-profile.js"
          height={380}
          config={{ ...commonTheme, symbol: tvSymbol, width: "100%", height: 380 }}
        />
      </Section>

      {/* Financials */}
      <Section title="💰 Tài chính chi tiết" open={openFinancials} onToggle={() => setOpenFinancials(!openFinancials)}>
        <TVWidget
          script="embed-widget-financials.js"
          height={480}
          config={{
            ...commonTheme,
            symbol: tvSymbol,
            width: "100%",
            height: 480,
            displayMode: "regular",
          }}
        />
      </Section>

      {/* Technical Analysis Gauge */}
      <Section title="🧭 Đồng hồ phân tích kỹ thuật" open={openTech} onToggle={() => setOpenFundTech(!openTech)}>
        <div className="grid md:grid-cols-2 gap-3">
          <TVWidget
            script="embed-widget-technical-analysis.js"
            height={430}
            config={{
              ...commonTheme,
              symbol: tvSymbol,
              interval: "1D",
              width: "100%",
              height: 430,
              showIntervalTabs: true,
            }}
          />
          <TVWidget
            script="embed-widget-symbol-info.js"
            height={430}
            config={{ ...commonTheme, symbol: tvSymbol, width: "100%" }}
          />
        </div>
      </Section>

      <p className="text-[10px] text-muted-foreground text-center">
        Dữ liệu và biểu đồ do TradingView cung cấp · nhúng công khai theo chính sách sử dụng của TradingView
      </p>
    </div>
  );
}

function Section({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="quant-card !p-0 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
      >
        <span className="text-sm font-semibold">{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <div className="p-3 border-t border-border/20">{children}</div>}
    </div>
  );
}
