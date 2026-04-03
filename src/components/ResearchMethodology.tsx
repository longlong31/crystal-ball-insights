import { motion } from "framer-motion";
import { 
  FlaskConical, ArrowRight, Database, BarChart3, Brain, TrendingUp, 
  Shield, Target, Activity, Layers, GitBranch, Workflow, 
  Search, FileText, LineChart, PieChart, Cpu, Zap, CheckCircle2,
  AlertTriangle, Lightbulb, Eye, Filter, Calculator
} from "lucide-react";
import { cn } from "@/lib/utils";

const GlassCard = ({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 30, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    className={cn(
      "relative overflow-hidden rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl p-6",
      "shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.4)]",
      "transition-all duration-500 group",
      className
    )}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className="relative z-10">{children}</div>
  </motion.div>
);

const FlowStep = ({ step, title, desc, icon: Icon, color = "primary", isLast = false }: { 
  step: number; title: string; desc: string; icon: any; color?: string; isLast?: boolean 
}) => (
  <div className="flex items-start gap-4">
    <div className="flex flex-col items-center">
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold shrink-0")}
        style={{ background: `hsl(var(--${color}) / 0.2)`, color: `hsl(var(--${color}))` }}>
        <Icon className="w-5 h-5" />
      </div>
      {!isLast && <div className="w-px h-full min-h-[24px] bg-border/50 my-1" />}
    </div>
    <div className="pb-6">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground">Bước {step}</span>
        <h4 className="font-semibold text-foreground">{title}</h4>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  </div>
);

const IOBox = ({ type, items, color }: { type: 'input' | 'output'; items: string[]; color: string }) => (
  <div className={cn("p-4 rounded-xl border", type === 'input' ? "border-blue-500/30 bg-blue-500/5" : "border-green-500/30 bg-green-500/5")}>
    <div className={cn("text-xs font-bold uppercase tracking-wider mb-3", type === 'input' ? "text-blue-400" : "text-green-400")}>
      {type === 'input' ? '📥 Input' : '📤 Output'}
    </div>
    <div className="space-y-1.5">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", type === 'input' ? "bg-blue-400" : "bg-green-400")} />
          {item}
        </div>
      ))}
    </div>
  </div>
);

const MermaidFlowchart = ({ chart, title }: { chart: string; title: string }) => (
  <div className="p-4 rounded-xl bg-muted/10 border border-border/30 mt-4">
    <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">📊 Flowchart: {title}</div>
    <div className="overflow-x-auto">
      <div className="flex flex-col items-center gap-1 min-w-[300px]">
        {chart.split('\n').map((line, i) => {
          const trimmed = line.trim();
          if (!trimmed) return null;
          
          // Parse node types
          if (trimmed.startsWith('-->')) {
            return (
              <div key={i} className="flex flex-col items-center">
                <div className="w-px h-5 bg-primary/40" />
                <ArrowRight className="w-4 h-4 text-primary/60 rotate-90" />
                <div className="w-px h-5 bg-primary/40" />
              </div>
            );
          }
          
          // Decision node (diamond)
          if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
            const text = trimmed.slice(1, -1);
            return (
              <div key={i} className="relative">
                <div className="rotate-45 w-24 h-24 border-2 border-yellow-500/40 bg-yellow-500/10 flex items-center justify-center">
                  <span className="-rotate-45 text-[10px] font-medium text-yellow-400 text-center px-1">{text}</span>
                </div>
              </div>
            );
          }
          
          // Process node (rectangle)
          const isStart = trimmed.startsWith('[START]');
          const isEnd = trimmed.startsWith('[END]');
          const bgColor = isStart ? 'bg-green-500/15 border-green-500/40 text-green-400' 
            : isEnd ? 'bg-red-500/15 border-red-500/40 text-red-400'
            : 'bg-primary/10 border-primary/30 text-foreground';
          
          return (
            <div key={i} className={cn(
              "px-4 py-2.5 rounded-lg border text-xs font-medium text-center max-w-[280px]",
              bgColor
            )}>
              {trimmed.replace('[START]', '').replace('[END]', '').trim()}
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

const FLOWCHARTS: Record<string, string> = {
  "Phân tích Cổ phiếu (Stock Analysis)": `[START] Nhập mã cổ phiếu
-->
Fetch OHLCV từ Yahoo Finance API
-->
Tính RSI, MACD, EMA, Bollinger
-->
Trích xuất P/E, P/B, ROE, D/E
-->
Tính Beta, VaR, CVaR, Max Drawdown
-->
Linear Regression & ACF
-->
[END] Render biểu đồ & Dashboard`,
  
  "Crypto Intelligence": `[START] Chọn Crypto Symbol
-->
Fetch Market Data từ CoinGecko
-->
Tính Technical Indicators
-->
Phân tích BTC Dominance & Volume
-->
Tính Volatility & Correlation
-->
[END] Heatmap & Sparkline Dashboard`,
  
  "Portfolio Optimization": `[START] Chọn 2-8 mã cổ phiếu
-->
Fetch lịch sử giá 1Y & Log Returns
-->
Tính Covariance Matrix
-->
Monte Carlo 15,000 portfolios
-->
Xác định Efficient Frontier
-->
Áp dụng Weight Constraints
-->
[END] Max Sharpe & Min Variance Portfolio`,
  
  "Risk Engine (VaR/CVaR)": `[START] Portfolio Holdings & Weights
-->
Tính Weighted Portfolio Returns
-->
Parametric VaR (Normal dist)
-->
Historical VaR (Percentile)
-->
CVaR = Mean of losses > VaR
-->
Stress Test Scenarios
-->
[END] Risk Report & Drawdown Chart`,
  
  "AI Insight Layer": `[START] User Prompt / Preset
-->
Fetch tin tức RSS & Community Posts
-->
Xây dựng AI Context + System Prompt
-->
Gửi đến Gemini via AI Gateway
-->
Pattern Recognition & Sentiment
-->
Dự báo với Confidence Level
-->
[END] Streaming Markdown Response`,
  
  "NPV/IRR Project Analysis": `[START] Nhập thông số dự án
-->
Projection dòng tiền hàng năm
-->
Tính WACC từ cấu trúc vốn
-->
NPV = Sum(CF / (1+WACC)^t)
-->
IRR via Newton-Raphson
-->
DSCR & Break-even Analysis
-->
[END] PDF/Word Report + AI Analysis`,
  
  "Monte Carlo Simulation": `[START] Chọn biến ngẫu nhiên
-->
Gán phân phối (Normal/PERT/Tri)
-->
Random Sampling (Box-Muller)
-->
Lặp N lần: Sample -> NPV/IRR
-->
Tính Mean, Std, VaR, CVaR
-->
[END] Histogram & CDF & Tornado`,
  
  "Sensitivity Analysis (Tornado/Spider)": `[START] Base Case Parameters
-->
One-at-a-Time (OAT) Variation
-->
Tính NPV/IRR cho mỗi scenario
-->
Tornado Ranking theo Impact
-->
Two-way Sensitivity Matrix
-->
Tìm Switching Values (NPV=0)
-->
[END] Tornado & Spider Chart`,
};

const MethodCard = ({ title, desc, icon: Icon, color, steps, inputs, outputs }: {
  title: string; desc: string; icon: any; color: string;
  steps: { title: string; desc: string; icon: any }[];
  inputs: string[]; outputs: string[];
}) => (
  <GlassCard delay={0.1}>
    <div className="flex items-center gap-4 mb-6">
      <div className="p-3 rounded-xl" style={{ background: `hsl(var(--${color}) / 0.2)` }}>
        <Icon className="w-7 h-7" style={{ color: `hsl(var(--${color}))` }} />
      </div>
      <div>
        <h3 className="text-xl font-bold">{title}</h3>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
    </div>

    {/* I/O Grid */}
    <div className="grid md:grid-cols-2 gap-4 mb-6">
      <IOBox type="input" items={inputs} color="blue" />
      <IOBox type="output" items={outputs} color="green" />
    </div>

    {/* Flow Steps */}
    <div className="p-4 rounded-xl bg-muted/20 border border-border/30">
      <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">⚙️ Quy trình xử lý</div>
      {steps.map((s, i) => (
        <FlowStep key={i} step={i + 1} title={s.title} desc={s.desc} icon={s.icon} color={color} isLast={i === steps.length - 1} />
      ))}
    </div>

    {/* Mermaid-style Flowchart */}
    {FLOWCHARTS[title] && (
      <MermaidFlowchart chart={FLOWCHARTS[title]} title={title} />
    )}
  </GlassCard>
);

const METHODOLOGIES = [
  {
    title: "Phân tích Cổ phiếu (Stock Analysis)",
    desc: "Phân tích kỹ thuật & cơ bản kết hợp dữ liệu thời gian thực từ Yahoo Finance",
    icon: TrendingUp, color: "primary",
    inputs: ["Mã cổ phiếu (VCB, FPT, AAPL...)", "Khoảng thời gian (1D - 5Y)", "Dữ liệu OHLCV real-time", "Báo cáo tài chính (Income, Balance, Cash Flow)"],
    outputs: ["RSI, MACD, EMA, Bollinger Bands", "P/E, P/B, ROE, D/E, Dividend Yield", "Beta, Sharpe Ratio, Max Drawdown", "VaR, CVaR (95%, 99%)", "Autocorrelation, Distribution Analysis", "Biểu đồ giá & chỉ báo kỹ thuật"],
    steps: [
      { title: "Thu thập dữ liệu", desc: "Fetch dữ liệu OHLCV real-time từ Yahoo Finance API qua Edge Function, cập nhật mỗi 30 giây", icon: Database },
      { title: "Tính toán chỉ báo kỹ thuật", desc: "RSI(14), MACD(12,26,9), EMA(20,50,200), Bollinger Bands(20,2σ) từ chuỗi giá lịch sử", icon: Calculator },
      { title: "Phân tích cơ bản", desc: "Trích xuất P/E, P/B, ROE, D/E từ báo cáo tài chính 4 quý gần nhất", icon: FileText },
      { title: "Đánh giá rủi ro", desc: "Tính Beta (vs VN-Index/S&P500), VaR parametric & historical, CVaR, Max Drawdown", icon: Shield },
      { title: "Phân tích thống kê", desc: "Linear Regression, Normal Distribution fitting, Autocorrelation function (ACF)", icon: BarChart3 },
      { title: "Trực quan hóa", desc: "Render biểu đồ nến, đường, histogram phân phối lợi suất, scatter plot", icon: LineChart },
    ]
  },
  {
    title: "Crypto Intelligence",
    desc: "Phân tích thị trường tiền mã hóa với dữ liệu on-chain từ CoinGecko",
    icon: Activity, color: "chart-2",
    inputs: ["Symbol crypto (BTC, ETH, SOL...)", "Dữ liệu thị trường CoinGecko API", "Market Cap, Volume 24h, ATH/ATL", "Lịch sử giá 7D - 1Y"],
    outputs: ["Bảng xếp hạng Market Cap", "Biểu đồ giá lịch sử", "RSI, MACD cho crypto", "Dominance Index (BTC/ETH)", "Fear & Greed estimation", "So sánh hiệu suất multi-coin"],
    steps: [
      { title: "Fetch Market Data", desc: "Lấy dữ liệu giá, volume, market cap từ CoinGecko API qua Edge Function, auto-refresh 60s", icon: Database },
      { title: "Tính toán Technical Indicators", desc: "RSI, MACD, EMA từ chuỗi giá lịch sử, phát hiện xu hướng ngắn/trung/dài hạn", icon: Calculator },
      { title: "Phân tích Market Structure", desc: "BTC Dominance, Total Market Cap, Volume flow, phát hiện divergence", icon: PieChart },
      { title: "Risk Metrics", desc: "Volatility (30D/90D), Sharpe Ratio, Correlation matrix giữa các coin", icon: Shield },
      { title: "Visual Dashboard", desc: "Heatmap, sparklines, biểu đồ giá tương tác với zoom/pan", icon: LineChart },
    ]
  },
  {
    title: "Portfolio Optimization",
    desc: "Tối ưu danh mục đầu tư bằng Modern Portfolio Theory và Monte Carlo",
    icon: PieChart, color: "chart-3",
    inputs: ["Danh sách cổ phiếu (2-8 mã)", "Lịch sử giá 1 năm", "Ràng buộc tỷ trọng (min/max %)", "Risk-free rate", "Benchmark (VN-Index/S&P500)"],
    outputs: ["Efficient Frontier (15,000 MC portfolios)", "Optimal weights (Max Sharpe/Min Variance)", "Expected Return & Volatility", "Sharpe Ratio, Sortino Ratio", "Ma trận tương quan (Pearson)", "Biểu đồ Efficient Frontier & Allocation"],
    steps: [
      { title: "Thu thập lợi suất", desc: "Fetch lịch sử giá 1Y cho tất cả mã, tính daily returns bằng log-return", icon: Database },
      { title: "Ma trận hiệp phương sai", desc: "Tính Covariance Matrix từ returns, xác định mức độ liên kết giữa các tài sản", icon: Layers },
      { title: "Monte Carlo Simulation", desc: "Tạo 15,000 danh mục ngẫu nhiên với trọng số random (Dirichlet distribution)", icon: Target },
      { title: "Efficient Frontier", desc: "Xác định biên hiệu quả: Max Sharpe, Min Variance, Max Return tại mỗi mức rủi ro", icon: TrendingUp },
      { title: "Áp dụng ràng buộc", desc: "Filter danh mục thỏa mãn constraints (min/max weight per asset), rebalance", icon: Filter },
      { title: "Kết quả tối ưu", desc: "Hiển thị phân bổ tối ưu, so sánh với equal-weight và benchmark", icon: CheckCircle2 },
    ]
  },
  {
    title: "Risk Engine (VaR/CVaR)",
    desc: "Đánh giá rủi ro danh mục với Value-at-Risk và Conditional VaR",
    icon: Shield, color: "chart-4",
    inputs: ["Portfolio weights & holdings", "Lịch sử giá (1Y daily)", "Confidence levels (95%, 99%)", "Holding period (1D, 10D)", "Stress test scenarios"],
    outputs: ["Parametric VaR & Historical VaR", "CVaR (Expected Shortfall)", "Component VaR per asset", "Stress Test results", "Risk decomposition", "Maximum Drawdown analysis"],
    steps: [
      { title: "Portfolio Returns", desc: "Tính weighted portfolio returns từ individual asset returns và weights", icon: Calculator },
      { title: "Parametric VaR", desc: "VaR = μ - z_α × σ (giả định Normal distribution), z_95%=1.645, z_99%=2.326", icon: BarChart3 },
      { title: "Historical VaR", desc: "Sắp xếp returns, lấy percentile thứ α (không giả định phân phối)", icon: Database },
      { title: "CVaR Calculation", desc: "Trung bình các losses vượt quá VaR threshold (Expected Shortfall)", icon: AlertTriangle },
      { title: "Stress Testing", desc: "Áp dụng các kịch bản cực đoan: Market Crash (-30%), Rate Hike, Black Swan", icon: Zap },
      { title: "Risk Report", desc: "Tổng hợp báo cáo rủi ro với biểu đồ distribution, drawdown, risk contribution", icon: FileText },
    ]
  },
  {
    title: "AI Insight Layer",
    desc: "Phân tích thị trường bằng AI kết hợp tin tức thời gian thực và dữ liệu định lượng",
    icon: Brain, color: "chart-5",
    inputs: ["Prompt người dùng (tự do/preset)", "Tin tức tài chính real-time (RSS feeds)", "Dữ liệu cộng đồng & xu hướng", "Bối cảnh thị trường hiện tại", "Kiến thức Q&A hệ thống"],
    outputs: ["Phân tích xu hướng thị trường", "Dự báo ngắn/trung hạn", "Đánh giá rủi ro chi tiết", "Chiến lược phân bổ tài sản", "Phát hiện anomaly & divergence", "Sentiment analysis từ tin tức"],
    steps: [
      { title: "Thu thập bối cảnh", desc: "Fetch tin tức mới nhất (VnExpress, Reuters, BBC), bài viết cộng đồng, Q&A knowledge base", icon: Search },
      { title: "Xây dựng Context", desc: "Tổng hợp system prompt + news context + market data + user query thành prompt AI", icon: Layers },
      { title: "AI Processing", desc: "Gửi prompt đến Google Gemini 3 Flash qua Lovable AI Gateway, streaming SSE response", icon: Cpu },
      { title: "Pattern Recognition", desc: "AI phân tích mẫu hình giá, volume divergence, momentum shifts từ dữ liệu", icon: Eye },
      { title: "Prediction Generation", desc: "Đưa ra dự báo kèm confidence level, key risk factors, và caveats", icon: Target },
      { title: "Streaming Output", desc: "Token-by-token rendering với Markdown (bảng, bullet points, headers)", icon: Zap },
    ]
  },
  {
    title: "NPV/IRR Project Analysis",
    desc: "Phân tích khả thi dự án đầu tư theo chuẩn ngân hàng quốc tế",
    icon: Calculator, color: "primary",
    inputs: ["Thông số dự án (vốn, doanh thu, chi phí)", "Cấu trúc vốn (D/E ratio)", "Lãi suất vay & chi phí vốn CSH", "Thuế suất, lạm phát", "Vòng đời dự án (năm)"],
    outputs: ["NPV (TIPV & EPV)", "IRR (TIPV & EPV)", "DPP (Discounted Payback Period)", "DSCR (min, avg, max)", "PI (Profitability Index)", "MIRR, EVA, Break-even Point", "Bảng dòng tiền chi tiết theo năm"],
    steps: [
      { title: "Nhập thông số", desc: "Form nhập liệu hoặc import từ Excel/PDF với validation tự động", icon: FileText },
      { title: "Tính dòng tiền", desc: "Projection doanh thu, chi phí, khấu hao, thuế, trả nợ cho từng năm", icon: Calculator },
      { title: "Chiết khấu WACC", desc: "WACC = D/(D+E) × rD × (1-T) + E/(D+E) × rE, tính NPV theo 2 góc độ (TIPV/EPV)", icon: BarChart3 },
      { title: "IRR Calculation", desc: "Newton-Raphson iteration với tolerance 0.0001%, max 1000 iterations", icon: Target },
      { title: "DSCR Analysis", desc: "DSCR = Net Cash Flow / Debt Service, kiểm tra khả năng trả nợ hàng năm", icon: Shield },
      { title: "Báo cáo kết quả", desc: "Dashboard trực quan + xuất PDF/Word với AI analysis tự động", icon: CheckCircle2 },
    ]
  },
  {
    title: "Monte Carlo Simulation",
    desc: "Mô phỏng xác suất với phân phối tùy chỉnh cho phân tích rủi ro dự án",
    icon: Target, color: "chart-2",
    inputs: ["Biến đầu vào (giá, sản lượng, chi phí)", "Phân phối xác suất (Normal, Triangular, PERT, Uniform, Lognormal)", "Số lần mô phỏng (500 - 50,000)", "Correlation matrix (optional)"],
    outputs: ["Phân phối NPV & IRR", "P(NPV > 0), P(IRR > WACC)", "VaR, CVaR của NPV", "Histogram & CDF", "Sensitivity tornado chart", "Confidence intervals (90%, 95%, 99%)"],
    steps: [
      { title: "Chọn biến ngẫu nhiên", desc: "Xác định các biến có tính bất định: giá bán, sản lượng, chi phí nguyên liệu, lạm phát", icon: Filter },
      { title: "Gán phân phối", desc: "Chọn phân phối phù hợp: Normal (đối xứng), Triangular (min/mode/max), PERT (β distribution)", icon: BarChart3 },
      { title: "Random Sampling", desc: "Box-Muller transform (Normal), Inverse CDF (others), Latin Hypercube sampling", icon: Target },
      { title: "Simulation Loop", desc: "Lặp N lần: sample random → tính dòng tiền → tính NPV/IRR cho mỗi iteration", icon: Workflow },
      { title: "Statistical Analysis", desc: "Tổng hợp kết quả: mean, std, percentiles, VaR, CVaR, skewness, kurtosis", icon: Calculator },
      { title: "Visualization", desc: "Histogram, CDF, tornado chart, scatter plot (NPV vs biến đầu vào)", icon: LineChart },
    ]
  },
  {
    title: "Sensitivity Analysis (Tornado/Spider)",
    desc: "Phân tích tác động từng biến số đến kết quả dự án",
    icon: BarChart3, color: "chart-4",
    inputs: ["Tham số cơ sở (base case)", "Biến phân tích (5-15 biến)", "Phạm vi biến đổi (±10% - ±50%)", "Kết quả mục tiêu (NPV, IRR)"],
    outputs: ["Tornado Chart (xếp hạng ảnh hưởng)", "Spider Chart (đa biến)", "One-way sensitivity tables", "Two-way sensitivity matrix", "Threshold analysis", "Switching values"],
    steps: [
      { title: "Xác định biến", desc: "Chọn các biến cần phân tích: giá, sản lượng, chi phí, lạm phát, lãi suất, thuế suất", icon: Filter },
      { title: "One-at-a-Time (OAT)", desc: "Thay đổi từng biến một trong khi giữ nguyên các biến khác ở giá trị base case", icon: GitBranch },
      { title: "Range Analysis", desc: "Với mỗi biến: tính NPV/IRR tại pessimistic → base → optimistic values", icon: BarChart3 },
      { title: "Tornado Ranking", desc: "Sắp xếp biến theo mức độ ảnh hưởng (|NPV_max - NPV_min|) từ lớn đến nhỏ", icon: TrendingUp },
      { title: "Two-way Matrix", desc: "Chọn 2 biến quan trọng nhất, tạo heatmap NPV theo tổ hợp giá trị", icon: Layers },
      { title: "Switching Value", desc: "Tìm giá trị tại đó NPV = 0 hoặc IRR = WACC (break-even sensitivity)", icon: Target },
    ]
  },
];

export const ResearchMethodology = () => {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <GlassCard delay={0}>
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 rounded-xl bg-primary/20">
            <FlaskConical className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Phương pháp nghiên cứu</h2>
            <p className="text-muted-foreground">Quy trình thu thập, xử lý dữ liệu và phân tích định lượng</p>
          </div>
        </div>

        {/* Overview Flow */}
        <div className="p-5 rounded-xl bg-muted/20 border border-border/30 mb-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">🔄 Tổng quan quy trình</h3>
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
            {[
              { label: "Thu thập dữ liệu", icon: Database, color: "bg-blue-500/20 text-blue-400" },
              { label: "Tiền xử lý", icon: Filter, color: "bg-yellow-500/20 text-yellow-400" },
              { label: "Phân tích định lượng", icon: Calculator, color: "bg-purple-500/20 text-purple-400" },
              { label: "Mô hình hóa", icon: Cpu, color: "bg-cyan-500/20 text-cyan-400" },
              { label: "Đánh giá rủi ro", icon: Shield, color: "bg-red-500/20 text-red-400" },
              { label: "AI Insights", icon: Brain, color: "bg-green-500/20 text-green-400" },
              { label: "Báo cáo & Quyết định", icon: CheckCircle2, color: "bg-primary/20 text-primary" },
            ].map((item, i, arr) => (
              <div key={i} className="flex items-center gap-2">
                <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg font-medium", item.color)}>
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </div>
                {i < arr.length - 1 && <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />}
              </div>
            ))}
          </div>
        </div>

        {/* Data sources */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
            <Database className="w-5 h-5 text-blue-400 mb-2" />
            <h4 className="font-semibold text-sm mb-1">Nguồn dữ liệu</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Yahoo Finance (Stocks real-time)</li>
              <li>• CoinGecko API (Crypto)</li>
              <li>• RSS Feeds (VnExpress, Reuters, BBC)</li>
              <li>• User uploads (Excel/PDF)</li>
            </ul>
          </div>
          <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
            <Cpu className="w-5 h-5 text-purple-400 mb-2" />
            <h4 className="font-semibold text-sm mb-1">Engine xử lý</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• TypeScript calculation engine</li>
              <li>• Monte Carlo (Box-Muller, Inverse CDF)</li>
              <li>• Newton-Raphson (IRR solver)</li>
              <li>• Pearson Correlation Matrix</li>
            </ul>
          </div>
          <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20">
            <Brain className="w-5 h-5 text-green-400 mb-2" />
            <h4 className="font-semibold text-sm mb-1">AI & Machine Learning</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Google Gemini 3 Flash (Analysis)</li>
              <li>• Sentiment Analysis (News)</li>
              <li>• Pattern Recognition</li>
              <li>• Predictive Forecasting</li>
            </ul>
          </div>
        </div>
      </GlassCard>

      {/* Individual methodologies */}
      {METHODOLOGIES.map((m, i) => (
        <MethodCard key={i} {...m} />
      ))}

      {/* Summary comparison table */}
      <GlassCard delay={0.2}>
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 rounded-xl bg-cyan-500/20">
            <Layers className="w-7 h-7 text-cyan-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Bảng tổng hợp phương pháp</h3>
            <p className="text-sm text-muted-foreground">So sánh các phương pháp phân tích và ứng dụng</p>
          </div>
        </div>
        <div className="overflow-x-auto rounded-xl border border-border/30">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30 border-b border-border/30">
                <th className="text-left p-3 font-semibold">Phương pháp</th>
                <th className="text-left p-3 font-semibold">Loại phân tích</th>
                <th className="text-left p-3 font-semibold">Tần suất cập nhật</th>
                <th className="text-left p-3 font-semibold">Độ phức tạp</th>
                <th className="text-left p-3 font-semibold">Ứng dụng chính</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              {[
                { method: "Stock Analysis", type: "Technical + Fundamental", freq: "30 giây", complexity: "⭐⭐⭐", use: "Đánh giá cổ phiếu" },
                { method: "Crypto Intelligence", type: "Market + On-chain", freq: "60 giây", complexity: "⭐⭐⭐", use: "Theo dõi crypto" },
                { method: "Portfolio Optimization", type: "Quantitative (MPT)", freq: "On-demand", complexity: "⭐⭐⭐⭐⭐", use: "Phân bổ tài sản" },
                { method: "Risk Engine", type: "Statistical (VaR)", freq: "On-demand", complexity: "⭐⭐⭐⭐", use: "Quản trị rủi ro" },
                { method: "AI Insights", type: "NLP + Predictive", freq: "Real-time", complexity: "⭐⭐⭐⭐⭐", use: "Dự báo & tư vấn" },
                { method: "NPV/IRR Analysis", type: "DCF", freq: "On-demand", complexity: "⭐⭐⭐", use: "Đánh giá dự án" },
                { method: "Monte Carlo", type: "Stochastic", freq: "On-demand", complexity: "⭐⭐⭐⭐", use: "Phân tích rủi ro" },
                { method: "Sensitivity Analysis", type: "Deterministic", freq: "On-demand", complexity: "⭐⭐⭐", use: "Xác định biến then chốt" },
              ].map((row, i) => (
                <tr key={i} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                  <td className="p-3 font-medium text-foreground">{row.method}</td>
                  <td className="p-3">{row.type}</td>
                  <td className="p-3">{row.freq}</td>
                  <td className="p-3">{row.complexity}</td>
                  <td className="p-3">{row.use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};
