import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { ExternalLink, ChevronDown, ChevronUp, Settings2, RotateCcw } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

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
  return s;
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
  }, [JSON.stringify(config), script, height]);

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

const TV_SETTINGS_KEY = "crystall-tv-panel-settings";

const DEFAULT_SETTINGS = {
  openChart: true,
  openProfile: true,
  openFinancials: false,
  openTech: false,
  showSettings: false,
  interval: "D",
  style: "1",
  activeIndicators: ["ma", "rsi", "macd"],
  zoom: 100,
};

type Settings = typeof DEFAULT_SETTINGS;

const INTERVALS: { value: string; label: string }[] = [
  { value: "1", label: "1m" },
  { value: "5", label: "5m" },
  { value: "15", label: "15m" },
  { value: "60", label: "1h" },
  { value: "240", label: "4h" },
  { value: "D", label: "1D" },
  { value: "W", label: "1W" },
  { value: "M", label: "1M" },
];

const INDICATORS: { key: string; label: string; study: string }[] = [
  { key: "ma", label: "MA", study: "MASimple@tv-basicstudies" },
  { key: "ema", label: "EMA", study: "MAExp@tv-basicstudies" },
  { key: "bb", label: "Bollinger", study: "BB@tv-basicstudies" },
  { key: "rsi", label: "RSI", study: "RSI@tv-basicstudies" },
  { key: "macd", label: "MACD", study: "MACD@tv-basicstudies" },
  { key: "stoch", label: "Stoch", study: "Stochastic@tv-basicstudies" },
  { key: "vol", label: "Volume", study: "Volume@tv-basicstudies" },
];

const CHART_STYLES: { value: string; label: string }[] = [
  { value: "1", label: "Nến" },
  { value: "8", label: "Heikin Ashi" },
  { value: "2", label: "Đường" },
  { value: "3", label: "Area" },
  { value: "9", label: "Baseline" },
];

export function TradingViewPanel({ symbol }: Props) {
  const tvSymbol = toTVSymbol(symbol);
  const isMobile = useIsMobile();

  const [openChart, setOpenChart] = useState(DEFAULT_SETTINGS.openChart);
  const [openProfile, setOpenProfile] = useState(DEFAULT_SETTINGS.openProfile);
  const [openFinancials, setOpenFinancials] = useState(DEFAULT_SETTINGS.openFinancials);
  const [openTech, setOpenFundTech] = useState(DEFAULT_SETTINGS.openTech);
  const [showSettings, setShowSettings] = useState(DEFAULT_SETTINGS.showSettings);

  const [interval, setInterval] = useState(DEFAULT_SETTINGS.interval);
  const [style, setStyle] = useState(DEFAULT_SETTINGS.style);
  const [activeIndicators, setActiveIndicators] = useState<string[]>(DEFAULT_SETTINGS.activeIndicators);
  const [zoom, setZoom] = useState(DEFAULT_SETTINGS.zoom);

  // Load persisted settings once on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(TV_SETTINGS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<Settings>;
      if (typeof parsed.openChart === "boolean") setOpenChart(parsed.openChart);
      if (typeof parsed.openProfile === "boolean") setOpenProfile(parsed.openProfile);
      if (typeof parsed.openFinancials === "boolean") setOpenFinancials(parsed.openFinancials);
      if (typeof parsed.openTech === "boolean") setOpenFundTech(parsed.openTech);
      if (typeof parsed.showSettings === "boolean") setShowSettings(parsed.showSettings);
      if (INTERVALS.some((i) => i.value === parsed.interval)) setInterval(parsed.interval!);
      if (CHART_STYLES.some((s) => s.value === parsed.style)) setStyle(parsed.style!);
      if (Array.isArray(parsed.activeIndicators)) {
        const valid = parsed.activeIndicators.filter((k) => INDICATORS.some((i) => i.key === k));
        if (valid.length) setActiveIndicators(valid);
      }
      if (typeof parsed.zoom === "number" && parsed.zoom >= 60 && parsed.zoom <= 160) {
        setZoom(parsed.zoom);
      }
    } catch {
      // Ignore corrupted storage
    }
  }, []);

  // Persist whenever any setting changes
  useEffect(() => {
    const payload: Settings = {
      openChart,
      openProfile,
      openFinancials,
      openTech,
      showSettings,
      interval,
      style,
      activeIndicators,
      zoom,
    };
    try {
      localStorage.setItem(TV_SETTINGS_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage errors (e.g. private mode)
    }
  }, [openChart, openProfile, openFinancials, openTech, showSettings, interval, style, activeIndicators, zoom]);

  const resetSettings = useCallback(() => {
    setOpenChart(DEFAULT_SETTINGS.openChart);
    setOpenProfile(DEFAULT_SETTINGS.openProfile);
    setOpenFinancials(DEFAULT_SETTINGS.openFinancials);
    setOpenFundTech(DEFAULT_SETTINGS.openTech);
    setShowSettings(DEFAULT_SETTINGS.showSettings);
    setInterval(DEFAULT_SETTINGS.interval);
    setStyle(DEFAULT_SETTINGS.style);
    setActiveIndicators(DEFAULT_SETTINGS.activeIndicators);
    setZoom(DEFAULT_SETTINGS.zoom);
    try {
      localStorage.removeItem(TV_SETTINGS_KEY);
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Adaptive base height by device
  const baseHeight = isMobile ? 380 : 560;
  const chartHeight = Math.round((baseHeight * zoom) / 100);

  const studies = useMemo(
    () => INDICATORS.filter((i) => activeIndicators.includes(i.key)).map((i) => i.study),
    [activeIndicators],
  );

  const toggleIndicator = (key: string) =>
    setActiveIndicators((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const commonTheme = {
    colorTheme: "dark",
    isTransparent: true,
    locale: "vi_VN",
    largeChartUrl: "",
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 p-3 rounded-lg bg-muted/20 border border-border/30 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold">TV</div>
          <div>
            <p className="text-xs font-semibold">TradingView Insights</p>
            <p className="text-[10px] font-mono text-muted-foreground">{tvSymbol}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings((v) => !v)}
            className="text-[11px] flex items-center gap-1 px-2.5 py-1 rounded-md bg-muted/40 hover:bg-muted/60 text-foreground/80 transition-colors"
          >
            <Settings2 className="w-3 h-3" /> Tùy chỉnh
          </button>
          <a
            href={tvUrl(symbol)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary/15 hover:bg-primary/25 text-primary transition-colors"
          >
            TradingView <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="p-3 rounded-lg bg-card border border-border/40 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Tùy chọn hiển thị</p>
            <button
              onClick={resetSettings}
              className="text-[10px] flex items-center gap-1 px-2 py-1 rounded-md bg-muted/40 hover:bg-muted/60 text-foreground/70 transition-colors"
              title="Khôi phục mặc định"
            >
              <RotateCcw className="w-3 h-3" /> Mặc định
            </button>
          </div>

          {/* Interval */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Khung thời gian</p>
            <div className="flex flex-wrap gap-1.5">
              {INTERVALS.map((it) => (
                <button
                  key={it.value}
                  onClick={() => setInterval(it.value)}
                  className={`text-[11px] px-2.5 py-1 rounded-md font-mono transition-colors ${
                    interval === it.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/40 hover:bg-muted/60 text-foreground/80"
                  }`}
                >
                  {it.label}
                </button>
              ))}
            </div>
          </div>

          {/* Style */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Kiểu biểu đồ</p>
            <div className="flex flex-wrap gap-1.5">
              {CHART_STYLES.map((cs) => (
                <button
                  key={cs.value}
                  onClick={() => setStyle(cs.value)}
                  className={`text-[11px] px-2.5 py-1 rounded-md transition-colors ${
                    style === cs.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/40 hover:bg-muted/60 text-foreground/80"
                  }`}
                >
                  {cs.label}
                </button>
              ))}
            </div>
          </div>

          {/* Indicators */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Chỉ báo mặc định</p>
            <div className="flex flex-wrap gap-1.5">
              {INDICATORS.map((ind) => {
                const active = activeIndicators.includes(ind.key);
                return (
                  <button
                    key={ind.key}
                    onClick={() => toggleIndicator(ind.key)}
                    className={`text-[11px] px-2.5 py-1 rounded-md transition-colors border ${
                      active
                        ? "bg-primary/20 border-primary/50 text-primary"
                        : "bg-muted/30 border-border/40 hover:bg-muted/50 text-foreground/70"
                    }`}
                  >
                    {ind.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Zoom */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Độ phóng đại ({isMobile ? "Mobile" : "Desktop"})
              </p>
              <span className="text-[11px] font-mono text-primary">{zoom}% · {chartHeight}px</span>
            </div>
            <input
              type="range"
              min={60}
              max={160}
              step={10}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5">
              <span>60%</span><span>100%</span><span>160%</span>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Chart */}
      <Section title="📈 Biểu đồ nâng cao" open={openChart} onToggle={() => setOpenChart(!openChart)}>
        <TVWidget
          script="tv.js"
          height={chartHeight}
          config={{
            ...commonTheme,
            autosize: true,
            symbol: tvSymbol,
            interval,
            timezone: "Asia/Ho_Chi_Minh",
            style,
            enable_publishing: false,
            hide_top_toolbar: false,
            hide_legend: false,
            withdateranges: true,
            allow_symbol_change: true,
            calendar: false,
            studies,
          }}
        />
      </Section>

      {/* Symbol Profile */}
      <Section title="🏢 Hồ sơ công ty" open={openProfile} onToggle={() => setOpenProfile(!openProfile)}>
        <TVWidget
          script="embed-widget-symbol-profile.js"
          height={isMobile ? 320 : 380}
          config={{ ...commonTheme, symbol: tvSymbol, width: "100%", height: isMobile ? 320 : 380 }}
        />
      </Section>

      {/* Financials */}
      <Section title="💰 Tài chính chi tiết" open={openFinancials} onToggle={() => setOpenFinancials(!openFinancials)}>
        <TVWidget
          script="embed-widget-financials.js"
          height={isMobile ? 400 : 480}
          config={{
            ...commonTheme,
            symbol: tvSymbol,
            width: "100%",
            height: isMobile ? 400 : 480,
            displayMode: "regular",
          }}
        />
      </Section>

      {/* Technical Analysis Gauge */}
      <Section title="🧭 Đồng hồ phân tích kỹ thuật" open={openTech} onToggle={() => setOpenFundTech(!openTech)}>
        <div className="grid md:grid-cols-2 gap-3">
          <TVWidget
            script="embed-widget-technical-analysis.js"
            height={isMobile ? 380 : 430}
            config={{
              ...commonTheme,
              symbol: tvSymbol,
              interval: interval === "D" ? "1D" : interval === "W" ? "1W" : interval === "M" ? "1M" : `${interval}m`,
              width: "100%",
              height: isMobile ? 380 : 430,
              showIntervalTabs: true,
            }}
          />
          <TVWidget
            script="embed-widget-symbol-info.js"
            height={isMobile ? 380 : 430}
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
