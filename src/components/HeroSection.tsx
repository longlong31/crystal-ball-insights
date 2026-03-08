import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { Link } from "react-router-dom";
import { CrystalBallIcon } from "./CrystalBallIcon";
import {
  Sparkles, Target, BarChart3, Shield, ArrowRight, Zap, TrendingUp,
  Brain, FlaskConical, Activity, LineChart, Layers, GitBranch, Cpu,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useEffect, useRef } from "react";

// ─── Animated counter ────────────────────────────────────────────
const AnimatedCounter = ({ end, duration = 2, suffix = "" }: { end: number; duration?: number; suffix?: string }) => {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started) setStarted(true);
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    let start = 0;
    const step = end / (duration * 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [started, end, duration]);

  return <span ref={ref} className="font-mono">{count.toLocaleString()}{suffix}</span>;
};

// ─── Live ticker bar ─────────────────────────────────────────────
const tickerItems = [
  { symbol: "BTC", price: "67,842.50", change: "+2.4%", up: true },
  { symbol: "ETH", price: "3,421.80", change: "+1.8%", up: true },
  { symbol: "VN30F1M", price: "1,285.5", change: "-0.3%", up: false },
  { symbol: "AAPL", price: "189.25", change: "+0.7%", up: true },
  { symbol: "GOLD", price: "2,342.10", change: "+0.5%", up: true },
  { symbol: "S&P 500", price: "5,234.18", change: "+0.4%", up: true },
  { symbol: "EUR/USD", price: "1.0842", change: "-0.1%", up: false },
  { symbol: "NVDA", price: "875.28", change: "+3.2%", up: true },
];

const TickerBar = () => (
  <div className="relative overflow-hidden py-3 border-y border-border/30 bg-card/40 backdrop-blur-sm">
    <div className="flex animate-ticker gap-8 whitespace-nowrap">
      {[...tickerItems, ...tickerItems].map((item, i) => (
        <span key={i} className="inline-flex items-center gap-2 text-xs font-mono">
          <span className="font-semibold text-foreground">{item.symbol}</span>
          <span className="text-muted-foreground">{item.price}</span>
          <span className={item.up ? "text-[hsl(var(--quant-green))]" : "text-[hsl(var(--quant-red))]"}>
            {item.change}
          </span>
        </span>
      ))}
    </div>
  </div>
);

// ─── Mini live chart widget ──────────────────────────────────────
const MiniChart = ({ data, color }: { data: number[]; color: string }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const h = 40;
  const w = 120;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");

  return (
    <svg width={w} height={h} className="overflow-visible">
      <defs>
        <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${h} ${points} ${w},${h}`}
        fill={`url(#grad-${color})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

// ─── Floating 3D card ────────────────────────────────────────────
const Float3DCard = ({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-50, 50], [8, -8]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(x, [-50, 50], [-8, 8]), { stiffness: 200, damping: 20 });

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6, type: "spring" }}
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        x.set(e.clientX - rect.left - rect.width / 2);
        y.set(e.clientY - rect.top - rect.height / 2);
      }}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      className={`${className}`}
    >
      {children}
    </motion.div>
  );
};

// ─── Scan line effect ────────────────────────────────────────────
const ScanLine = () => (
  <motion.div
    className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent pointer-events-none"
    animate={{ top: ["-5%", "105%"] }}
    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
  />
);

// ─── Generate fake chart data ────────────────────────────────────
const genChartData = (n: number, trend = 1) => {
  const d: number[] = [50];
  for (let i = 1; i < n; i++) d.push(Math.max(5, d[i - 1] + (Math.random() - 0.45) * 5 * trend));
  return d;
};

export const HeroSection = () => {
  const { t, language } = useLanguage();

  const features = [
    { icon: <Target className="w-5 h-5" />, text: t("hero.feature1") },
    { icon: <BarChart3 className="w-5 h-5" />, text: t("hero.feature2") },
    { icon: <Shield className="w-5 h-5" />, text: t("hero.feature3") },
  ];

  const modules = [
    { icon: TrendingUp, label: language === "vi" ? "Phân tích cổ phiếu" : "Stock Analysis", color: "text-[hsl(var(--quant-green))]" },
    { icon: Brain, label: "AI Insights", color: "text-[hsl(var(--quant-violet))]" },
    { icon: Zap, label: language === "vi" ? "Tối ưu danh mục" : "Portfolio Optimizer", color: "text-[hsl(var(--quant-amber))]" },
    { icon: FlaskConical, label: language === "vi" ? "Phòng thí nghiệm" : "Algorithm Lab", color: "text-[hsl(var(--quant-cyan))]" },
  ];

  const demoWidgets = [
    {
      title: language === "vi" ? "Monte Carlo VaR" : "Monte Carlo VaR",
      value: "$2.4M",
      sub: "95% Confidence",
      chart: genChartData(30),
      chartColor: "hsl(185, 80%, 50%)",
      icon: Activity,
    },
    {
      title: language === "vi" ? "Portfolio Beta" : "Portfolio Beta",
      value: "1.24",
      sub: "vs S&P 500",
      chart: genChartData(30, 0.8),
      chartColor: "hsl(142, 76%, 45%)",
      icon: LineChart,
    },
    {
      title: language === "vi" ? "Sharpe Ratio" : "Sharpe Ratio",
      value: "2.18",
      sub: language === "vi" ? "Vượt trội" : "Outperforming",
      chart: genChartData(30, 1.2),
      chartColor: "hsl(270, 70%, 60%)",
      icon: TrendingUp,
    },
  ];

  return (
    <>
      {/* Ticker bar */}
      <TickerBar />

      <section className="relative py-16 lg:py-24 overflow-hidden">
        {/* Complex animated background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.04] via-transparent to-transparent" />
          <div className="absolute top-0 left-1/4 w-[700px] h-[700px] rounded-full bg-primary/[0.06] blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-secondary/[0.04] blur-[100px]" />
          <div className="absolute top-1/2 right-0 w-[300px] h-[300px] rounded-full bg-[hsl(var(--quant-amber))]/[0.03] blur-[80px]" />
          {/* Grid */}
          <div className="absolute inset-0 opacity-[0.025]" style={{
            backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
            backgroundSize: '48px 48px'
          }} />
          <ScanLine />
        </div>

        <div className="container relative z-10">
          {/* ─── Main Hero ────────────────────────────────────── */}
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16 mb-20">
            {/* Left content */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              className="flex-1 text-center lg:text-left"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-6"
              >
                <Sparkles className="w-4 h-4" />
                {t("hero.badge")}
              </motion.div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-[1.05] tracking-tight">
                <motion.span
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="block text-foreground"
                >
                  Crystal Ball
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="block bg-gradient-to-r from-primary via-[hsl(var(--crystal-glow))] to-secondary bg-clip-text text-transparent"
                >
                  {t("hero.subtitle")}
                </motion.span>
              </h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed"
              >
                {t("hero.description")}
              </motion.p>

              {/* Feature pills */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-3 mb-8">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass border border-border/50 text-sm cursor-default"
                  >
                    <span className="text-primary">{feature.icon}</span>
                    <span className="text-foreground">{feature.text}</span>
                  </motion.div>
                ))}
              </div>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="flex flex-wrap justify-center lg:justify-start gap-3"
              >
                <Link to="/platform">
                  <Button size="xl" variant="glow" className="gap-2 text-base font-semibold">
                    <Sparkles className="w-5 h-5" />
                    {language === "vi" ? "Khám phá Platform" : "Launch Platform"}
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/algorithms">
                  <Button size="lg" variant="crystal" className="gap-2 text-base">
                    <FlaskConical className="w-4 h-4" />
                    {language === "vi" ? "Phòng thí nghiệm" : "Algorithm Lab"}
                  </Button>
                </Link>
              </motion.div>
            </motion.div>

            {/* Right side - Crystal ball + orbiting modules */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="flex-shrink-0 relative"
            >
              <div className="absolute inset-0 bg-primary/10 blur-[60px] rounded-full scale-150" />
              <div className="relative">
                <CrystalBallIcon className="w-48 h-48 md:w-60 md:h-60 relative z-10" />
                {modules.map((mod, i) => {
                  const Icon = mod.icon;
                  const angle = (i * 90 - 45) * (Math.PI / 180);
                  const radius = 130;
                  const x = Math.cos(angle) * radius;
                  const y = Math.sin(angle) * radius;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1 + i * 0.15, type: "spring" }}
                      className="absolute top-1/2 left-1/2 z-20"
                      style={{ transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` }}
                    >
                      <motion.div
                        whileHover={{ scale: 1.15 }}
                        animate={{ y: [0, -4, 0] }}
                        transition={{ y: { duration: 2 + i * 0.5, repeat: Infinity, ease: "easeInOut" } }}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg glass border border-border/50 shadow-lg cursor-default whitespace-nowrap"
                      >
                        <Icon className={`w-4 h-4 ${mod.color}`} />
                        <span className="text-xs font-medium text-foreground">{mod.label}</span>
                      </motion.div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* ─── Live Demo Widgets ────────────────────────────── */}
          <div className="grid md:grid-cols-3 gap-4 mb-20">
            {demoWidgets.map((widget, i) => {
              const Icon = widget.icon;
              return (
                <Float3DCard key={i} delay={0.8 + i * 0.15}>
                  <div className="relative overflow-hidden rounded-xl border border-border/40 bg-card/80 backdrop-blur-md p-5 h-full">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/[0.03] rounded-full blur-[40px]" />
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">{widget.title}</span>
                      </div>
                      <span className="text-[10px] text-[hsl(var(--quant-green))] bg-[hsl(var(--quant-green))]/10 px-2 py-0.5 rounded-full font-mono">LIVE</span>
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-2xl font-bold font-mono text-foreground">{widget.value}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{widget.sub}</div>
                      </div>
                      <MiniChart data={widget.chart} color={widget.chartColor} />
                    </div>
                  </div>
                </Float3DCard>
              );
            })}
          </div>

          {/* ─── Stats Counter Bar ────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20"
          >
            {[
              { value: 15000, suffix: "+", label: language === "vi" ? "Mô phỏng chạy" : "Simulations Run", icon: Activity },
              { value: 12, suffix: "", label: language === "vi" ? "Thuật toán" : "Algorithms", icon: FlaskConical },
              { value: 6, suffix: "+", label: language === "vi" ? "Mô-đun phân tích" : "Analysis Modules", icon: Layers },
              { value: 99, suffix: "%", label: language === "vi" ? "Độ chính xác" : "Accuracy", icon: Target },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="relative text-center p-6 rounded-xl border border-border/30 bg-card/50 backdrop-blur-sm overflow-hidden group hover:border-primary/30 transition-colors"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Icon className="w-5 h-5 text-primary mx-auto mb-2" />
                  <div className="text-3xl font-bold text-foreground mb-1">
                    <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* ─── Feature Showcase ─────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <div className="text-center mb-12">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-3xl md:text-4xl font-bold mb-4"
              >
                {language === "vi" ? "Nền tảng Quant " : "Institutional-Grade "}
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  {language === "vi" ? "đẳng cấp tổ chức" : "Quant Platform"}
                </span>
              </motion.h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {language === "vi"
                  ? "Kết hợp sức mạnh của Bloomberg Terminal với công nghệ AI hiện đại, phục vụ từ nhà đầu tư cá nhân đến tổ chức tài chính."
                  : "Combining Bloomberg Terminal power with modern AI technology, serving individual investors to financial institutions."}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                {
                  icon: TrendingUp, color: "hsl(var(--quant-green))",
                  title: language === "vi" ? "Phân tích kỹ thuật" : "Technical Analysis",
                  desc: language === "vi"
                    ? "RSI, MACD, Bollinger Bands, và 20+ chỉ báo kỹ thuật chuyên sâu thời gian thực."
                    : "RSI, MACD, Bollinger Bands, and 20+ real-time technical indicators.",
                  demo: genChartData(20, 1.1),
                },
                {
                  icon: Brain, color: "hsl(var(--quant-violet))",
                  title: language === "vi" ? "AI Dự báo thị trường" : "AI Market Predictions",
                  desc: language === "vi"
                    ? "Mô hình Neural Network và ARIMA dự báo xu hướng giá với độ chính xác cao."
                    : "Neural Network and ARIMA models predicting price trends with high accuracy.",
                  demo: genChartData(20, 1.3),
                },
                {
                  icon: GitBranch, color: "hsl(var(--quant-cyan))",
                  title: language === "vi" ? "Pipeline Builder" : "Algorithm Pipeline",
                  desc: language === "vi"
                    ? "Kết nối nhiều thuật toán thành pipeline xử lý, output → input tự động."
                    : "Connect multiple algorithms into processing pipelines with auto-linked I/O.",
                  demo: genChartData(20, 0.9),
                },
                {
                  icon: Activity, color: "hsl(var(--quant-amber))",
                  title: "Monte Carlo VaR",
                  desc: language === "vi"
                    ? "Mô phỏng 10,000+ kịch bản để đánh giá rủi ro danh mục đầu tư."
                    : "Simulate 10,000+ scenarios to assess portfolio risk exposure.",
                  demo: genChartData(20, 0.7),
                },
                {
                  icon: Cpu, color: "hsl(var(--quant-orange))",
                  title: language === "vi" ? "Tối ưu hóa danh mục" : "Portfolio Optimization",
                  desc: language === "vi"
                    ? "Markowitz Mean-Variance, Black-Litterman, và Risk Parity cho danh mục tối ưu."
                    : "Markowitz Mean-Variance, Black-Litterman, and Risk Parity optimization.",
                  demo: genChartData(20, 1.0),
                },
                {
                  icon: Layers, color: "hsl(185, 90%, 55%)",
                  title: language === "vi" ? "Đa tài sản" : "Multi-Asset",
                  desc: language === "vi"
                    ? "Cổ phiếu, crypto, forex, hàng hóa — tất cả trong một nền tảng thống nhất."
                    : "Stocks, crypto, forex, commodities — all in one unified platform.",
                  demo: genChartData(20, 1.15),
                },
              ].map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <Float3DCard key={i} delay={0.1 + i * 0.08}>
                    <div className="group relative h-full rounded-xl border border-border/30 bg-card/60 backdrop-blur-sm p-6 hover:border-primary/30 transition-all duration-300 overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-2.5 rounded-lg border border-border/30" style={{ backgroundColor: `${feature.color}10` }}>
                          <Icon className="w-5 h-5" style={{ color: feature.color }} />
                        </div>
                        <MiniChart data={feature.demo} color={feature.color} />
                      </div>
                      <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                      <div className="mt-4 flex items-center gap-1 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>{language === "vi" ? "Khám phá" : "Explore"}</span>
                        <ChevronRight className="w-3 h-3" />
                      </div>
                    </div>
                  </Float3DCard>
                );
              })}
            </div>
          </motion.div>

          {/* ─── Terminal Demo ─────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <Float3DCard delay={0}>
              <div className="rounded-xl border border-border/40 bg-card/80 backdrop-blur-md overflow-hidden">
                {/* Terminal header */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30 bg-card/60">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-[hsl(var(--quant-red))]" />
                    <div className="w-3 h-3 rounded-full bg-[hsl(var(--quant-amber))]" />
                    <div className="w-3 h-3 rounded-full bg-[hsl(var(--quant-green))]" />
                  </div>
                  <span className="text-xs text-muted-foreground font-mono ml-2">crystal-ball — quantitative-engine v3.2.0</span>
                </div>
                {/* Terminal content */}
                <div className="p-5 font-mono text-xs space-y-2">
                  <TerminalLine delay={0.3} prefix="$" text="crystal run --monte-carlo --iterations 10000" />
                  <TerminalLine delay={0.8} prefix="►" text="Initializing Monte Carlo engine..." color="text-primary" />
                  <TerminalLine delay={1.3} prefix="►" text="Running 10,000 simulations with triangular distribution..." color="text-primary" />
                  <TerminalLine delay={1.8} prefix="✓" text="VaR (95%): $2,412,500 | CVaR: $1,892,000" color="text-[hsl(var(--quant-green))]" />
                  <TerminalLine delay={2.3} prefix="✓" text="Sharpe: 2.18 | Sortino: 3.42 | Max Drawdown: -12.4%" color="text-[hsl(var(--quant-green))]" />
                  <TerminalLine delay={2.8} prefix="$" text="crystal optimize --method markowitz --target sharpe" />
                  <TerminalLine delay={3.3} prefix="►" text="Optimal weights: AAPL(24%) NVDA(18%) GOOGL(15%) BTC(8%) GOLD(12%) BONDS(23%)" color="text-[hsl(var(--quant-amber))]" />
                  <TerminalLine delay={3.8} prefix="✓" text="Pipeline complete. Results exported to dashboard." color="text-[hsl(var(--quant-green))]" />
                </div>
              </div>
            </Float3DCard>
          </motion.div>

          {/* ─── CTA Section ──────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center py-16 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.03] via-secondary/[0.05] to-primary/[0.03] rounded-2xl" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {language === "vi" ? "Sẵn sàng nâng tầm " : "Ready to Elevate "}
                <span className="bg-gradient-to-r from-primary to-[hsl(var(--crystal-glow))] bg-clip-text text-transparent">
                  {language === "vi" ? "phân tích tài chính?" : "Your Analysis?"}
                </span>
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto mb-8">
                {language === "vi"
                  ? "Trải nghiệm ngay nền tảng phân tích định lượng đẳng cấp tổ chức với AI tích hợp."
                  : "Experience institutional-grade quantitative analysis with integrated AI today."}
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link to="/platform">
                  <Button size="xl" variant="glow" className="gap-2 font-semibold">
                    <Sparkles className="w-5 h-5" />
                    {language === "vi" ? "Bắt đầu miễn phí" : "Get Started Free"}
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/docs">
                  <Button size="lg" variant="outline" className="gap-2">
                    {language === "vi" ? "Xem tài liệu" : "View Documentation"}
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
};

// ─── Terminal line animation ─────────────────────────────────────
const TerminalLine = ({ delay, prefix, text, color = "text-foreground" }: { delay: number; prefix: string; text: string; color?: string }) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.3 }}
    className={`flex gap-2 ${color}`}
  >
    <span className="text-muted-foreground select-none">{prefix}</span>
    <span>{text}</span>
  </motion.div>
);
