import { useMemo, useState } from "react";
import {
  ChevronDown, ChevronRight, LayoutGrid, TrendingUp, DollarSign, Activity,
  Percent, Layers, Wallet, BarChart3, LineChart, Shield, Gauge, Zap,
  Award, Coins, HeartPulse, Sparkles, Sigma,
} from "lucide-react";
import type { StockQuote, StockHistory } from "@/hooks/useStockData";

interface Props {
  quote?: StockQuote | null;
  history?: StockHistory | null;
  analysis?: {
    vol: number; beta: number; sharpe: number; maxDD: number;
    rsi: number; returns: number[]; chartData: any[];
  } | null;
}

const fmt = (v: number | null | undefined, digits = 2, suffix = "") => {
  if (v === null || v === undefined || !isFinite(v)) return "—";
  const abs = Math.abs(v);
  if (abs >= 1e12) return (v / 1e12).toFixed(digits) + "T" + suffix;
  if (abs >= 1e9) return (v / 1e9).toFixed(digits) + "B" + suffix;
  if (abs >= 1e6) return (v / 1e6).toFixed(digits) + "M" + suffix;
  if (abs >= 1e3 && !suffix) return (v / 1e3).toFixed(digits) + "K";
  return v.toFixed(digits) + suffix;
};
const pct = (v: number | null | undefined, digits = 2) => {
  if (v === null || v === undefined || !isFinite(v)) return "—";
  return (v * 100).toFixed(digits) + "%";
};

// -------- stats helpers --------
function mean(x: number[]) { return x.length ? x.reduce((a, b) => a + b, 0) / x.length : 0; }
function stdDev(x: number[]) {
  if (x.length < 2) return 0;
  const m = mean(x);
  return Math.sqrt(x.reduce((a, b) => a + (b - m) ** 2, 0) / (x.length - 1));
}
function skewness(x: number[]) {
  const n = x.length; if (n < 3) return 0;
  const m = mean(x); const s = stdDev(x); if (s === 0) return 0;
  return (n / ((n - 1) * (n - 2))) * x.reduce((a, b) => a + ((b - m) / s) ** 3, 0);
}
function kurtosisExcess(x: number[]) {
  const n = x.length; if (n < 4) return 0;
  const m = mean(x); const s = stdDev(x); if (s === 0) return 0;
  const k = x.reduce((a, b) => a + ((b - m) / s) ** 4, 0);
  return (n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3)) * k - (3 * (n - 1) ** 2) / ((n - 2) * (n - 3));
}
function autocorr(x: number[], lag = 1) {
  const n = x.length; if (n <= lag) return 0;
  const m = mean(x);
  let num = 0, den = 0;
  for (let i = 0; i < n - lag; i++) num += (x[i] - m) * (x[i + lag] - m);
  for (let i = 0; i < n; i++) den += (x[i] - m) ** 2;
  return den ? num / den : 0;
}
function downsideDeviation(x: number[], mar = 0) {
  const d = x.filter((v) => v < mar).map((v) => (v - mar) ** 2);
  if (!d.length) return 0;
  return Math.sqrt(d.reduce((a, b) => a + b, 0) / x.length);
}
function percentile(x: number[], p: number) {
  if (!x.length) return 0;
  const s = [...x].sort((a, b) => a - b);
  const i = Math.max(0, Math.min(s.length - 1, Math.floor(p * s.length)));
  return s[i];
}
function computeVWAP(highs: number[], lows: number[], closes: number[], vols: number[]) {
  let cumPV = 0, cumV = 0;
  for (let i = 0; i < closes.length; i++) {
    const tp = (highs[i] + lows[i] + closes[i]) / 3;
    cumPV += tp * (vols[i] || 0);
    cumV += vols[i] || 0;
  }
  return cumV ? cumPV / cumV : 0;
}
function computeATR(highs: number[], lows: number[], closes: number[], period = 14) {
  if (closes.length < period + 1) return 0;
  const trs: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    const tr = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1]),
    );
    trs.push(tr);
  }
  return mean(trs.slice(-period));
}
function computeOBV(closes: number[], vols: number[]) {
  let obv = 0;
  for (let i = 1; i < closes.length; i++) {
    if (closes[i] > closes[i - 1]) obv += vols[i] || 0;
    else if (closes[i] < closes[i - 1]) obv -= vols[i] || 0;
  }
  return obv;
}

// -------- Metric dictionary: definition, formula, and why data may be missing --------
type MetricInfo = { def: string; formula?: string; na?: string };
const METRIC_INFO: Record<string, MetricInfo> = {
  // Valuation
  "P/E":                { def: "Price/Earnings — thị giá trên lợi nhuận mỗi cổ phiếu.", formula: "Price ÷ EPS (TTM)", na: "Thiếu EPS TTM hoặc EPS âm." },
  "Forward P/E":        { def: "P/E dựa trên EPS dự phóng 12 tháng tới.", formula: "Price ÷ Forward EPS", na: "Nhà cung cấp không có EPS dự phóng." },
  "PEG":                { def: "P/E điều chỉnh theo tốc độ tăng trưởng EPS.", formula: "P/E ÷ (EPS Growth %)", na: "Thiếu tăng trưởng EPS hoặc EPS Growth = 0." },
  "P/B":                { def: "Price/Book — thị giá trên giá trị sổ sách/cp.", formula: "Price ÷ Book Value per Share", na: "Thiếu Book Value." },
  "P/S":                { def: "Price/Sales — thị giá trên doanh thu mỗi cp.", formula: "Market Cap ÷ Revenue", na: "Thiếu doanh thu TTM." },
  "EV/EBITDA":          { def: "Enterprise Value chia EBITDA — định giá không phụ thuộc cấu trúc vốn.", formula: "(MCap + Debt − Cash) ÷ EBITDA", na: "Cần EBITDA từ báo cáo — chạy 09_valuation_ratios.py." },
  "EV/Sales":           { def: "Enterprise Value chia doanh thu.", formula: "EV ÷ Revenue (TTM)", na: "Thiếu EV hoặc Revenue." },
  "Price/Cash Flow":    { def: "Thị giá trên dòng tiền hoạt động.", formula: "Market Cap ÷ Operating Cash Flow", na: "Thiếu OCF." },
  "Enterprise Value":   { def: "Giá trị doanh nghiệp thực (bao gồm nợ, trừ tiền mặt).", formula: "Market Cap + Total Debt − Cash", na: "Thiếu Total Debt hoặc Cash." },
  "Market Cap":         { def: "Vốn hoá thị trường.", formula: "Price × Shares Outstanding" },
  "Book Value/Share":   { def: "Giá trị sổ sách/cp — vốn chủ trên số cp lưu hành.", formula: "Equity ÷ Shares Outstanding" },
  "Intrinsic Value (DCF)": { def: "Giá trị nội tại theo mô hình chiết khấu dòng tiền.", formula: "Σ FCFₜ/(1+r)ᵗ + TV/(1+r)ⁿ", na: "Cần chạy DCF trong 09_valuation_ratios.py hoặc tab Models Lab." },
  // Profitability
  "ROE":                { def: "Return on Equity — sinh lời trên vốn chủ.", formula: "Net Income ÷ Equity" },
  "ROA":                { def: "Return on Assets — sinh lời trên tổng tài sản.", formula: "Net Income ÷ Total Assets" },
  "ROIC":               { def: "Return on Invested Capital.", formula: "NOPAT ÷ Invested Capital", na: "Cần NOPAT & Invested Capital từ BCTC chi tiết." },
  "ROI":                { def: "Return on Investment tổng quát.", formula: "(Gain − Cost) ÷ Cost", na: "Cần khung dự án cụ thể." },
  "ROCE":               { def: "Return on Capital Employed.", formula: "EBIT ÷ (Assets − Current Liabilities)", na: "Cần EBIT và Current Liabilities." },
  "Gross Margin":       { def: "Biên lợi nhuận gộp.", formula: "(Revenue − COGS) ÷ Revenue" },
  "EBITDA Margin":      { def: "Biên EBITDA.", formula: "EBITDA ÷ Revenue", na: "Cần EBITDA từ báo cáo." },
  "Operating Margin":   { def: "Biên lợi nhuận hoạt động.", formula: "Operating Income ÷ Revenue" },
  "Net Margin":         { def: "Biên lợi nhuận ròng.", formula: "Net Income ÷ Revenue" },
  "EPS":                { def: "Earnings per Share — lợi nhuận trên mỗi cp.", formula: "Net Income ÷ Shares Outstanding" },
  "Diluted EPS":        { def: "EPS pha loãng (bao gồm options, warrants).", formula: "NI ÷ (Shares + Convertibles)", na: "Cần chi tiết cấu trúc vốn." },
  // Growth
  "Revenue Growth":     { def: "Tăng trưởng doanh thu YoY.", formula: "(Rev_t − Rev_{t−1}) ÷ Rev_{t−1}" },
  "EPS Growth":         { def: "Tăng trưởng EPS YoY.", formula: "(EPS_t − EPS_{t−1}) ÷ EPS_{t−1}", na: "Provider không cung cấp lịch sử EPS đủ dài." },
  "Net Income Growth":  { def: "Tăng trưởng lợi nhuận ròng YoY.", formula: "(NI_t − NI_{t−1}) ÷ NI_{t−1}" },
  "Operating Income Growth": { def: "Tăng trưởng lợi nhuận hoạt động.", na: "Cần chuỗi Operating Income từ BCTC." },
  "Cash Flow Growth":   { def: "Tăng trưởng OCF.", na: "Cần lịch sử OCF nhiều năm." },
  "Free Cash Flow Growth": { def: "Tăng trưởng FCF.", na: "Cần lịch sử FCF nhiều năm." },
  "CAGR 3Y (price)":    { def: "Tăng trưởng kép giá 3 năm.", formula: "(P_end/P_start)^(1/3) − 1", na: "Chuỗi giá < 3 năm." },
  "CAGR 5Y (price)":    { def: "Tăng trưởng kép giá 5 năm.", formula: "(P_end/P_start)^(1/5) − 1", na: "Chuỗi giá < 5 năm." },
  // Liquidity
  "Current Ratio":      { def: "Khả năng thanh toán ngắn hạn.", formula: "Current Assets ÷ Current Liabilities" },
  "Quick Ratio":        { def: "Thanh toán nhanh (không tính hàng tồn kho).", formula: "(CA − Inventory) ÷ CL", na: "Cần Inventory từ Balance Sheet." },
  "Cash Ratio":         { def: "Tỉ lệ tiền mặt trên nợ ngắn hạn.", formula: "Cash ÷ Current Liabilities", na: "Cần Current Liabilities." },
  "Working Capital":    { def: "Vốn lưu động ròng.", formula: "Current Assets − Current Liabilities", na: "Cần CA & CL." },
  "Current Assets":     { def: "Tài sản ngắn hạn." , na: "Cần Balance Sheet." },
  "Current Liabilities":{ def: "Nợ ngắn hạn.", na: "Cần Balance Sheet." },
  // Leverage
  "Debt/Equity":        { def: "Tỉ lệ nợ trên vốn chủ.", formula: "Total Debt ÷ Total Equity" },
  "Debt/Assets":        { def: "Tỉ lệ nợ trên tài sản.", formula: "Total Debt ÷ Total Assets", na: "Cần Total Assets." },
  "Interest Coverage":  { def: "Khả năng thanh toán lãi vay.", formula: "EBIT ÷ Interest Expense", na: "Cần Interest Expense." },
  "Financial Leverage": { def: "Hệ số đòn bẩy tài chính.", formula: "Total Assets ÷ Equity", na: "Cần Total Assets & Equity." },
  "Long-term Debt":     { def: "Nợ dài hạn.", na: "Cần Balance Sheet chi tiết." },
  "Net Debt":           { def: "Nợ ròng.", formula: "Total Debt − Cash" },
  // Cash flow
  "Operating Cash Flow":{ def: "Dòng tiền từ hoạt động kinh doanh." },
  "Investing Cash Flow":{ def: "Dòng tiền từ đầu tư.", na: "Cần Cash Flow Statement chi tiết." },
  "Financing Cash Flow":{ def: "Dòng tiền từ tài chính.", na: "Cần Cash Flow Statement chi tiết." },
  "Free Cash Flow":     { def: "Dòng tiền tự do.", formula: "OCF − CapEx" },
  "CapEx (OCF − FCF)":  { def: "Chi đầu tư ước tính.", formula: "Operating CF − Free CF" },
  "FCF Yield":          { def: "Lợi suất dòng tiền tự do.", formula: "FCF ÷ Market Cap" },
  // Market
  "Volume":             { def: "Khối lượng giao dịch phiên." },
  "Average Volume":     { def: "Khối lượng trung bình (thường 30 ngày)." },
  "Float":              { def: "Số cp tự do lưu thông.", na: "Cần dữ liệu ownership." },
  "Shares Outstanding": { def: "Tổng số cp đang lưu hành.", na: "Chưa được provider trả về." },
  "Insider Ownership":  { def: "Tỉ lệ sở hữu của ban lãnh đạo.", na: "Cần dữ liệu insider filings." },
  "Institutional Ownership": { def: "Tỉ lệ sở hữu tổ chức.", na: "Cần dữ liệu 13F filings." },
  "Short Interest":     { def: "Khối lượng bán khống.", na: "Không có API short interest." },
  "Short Ratio":        { def: "Days-to-cover.", formula: "Short Interest ÷ Avg Volume", na: "Cần Short Interest." },
  "Relative Volume":    { def: "Vol phiên vs trung bình.", formula: "Volume ÷ Avg Volume" },
  // Technical
  "RSI(14)":            { def: "Relative Strength Index — quá mua/bán.", formula: "100 − 100/(1 + AvgGain/AvgLoss)" },
  "MACD":               { def: "Moving Average Convergence Divergence.", formula: "EMA(12) − EMA(26)" },
  "MACD Signal":        { def: "Đường tín hiệu MACD.", formula: "EMA(9) của MACD" },
  "BB Upper":           { def: "Dải Bollinger trên.", formula: "SMA(20) + 2·σ(20)" },
  "BB Lower":           { def: "Dải Bollinger dưới.", formula: "SMA(20) − 2·σ(20)" },
  "EMA 12":             { def: "Trung bình mũ 12 phiên.", formula: "EMA_t = α·P_t + (1−α)·EMA_{t−1}, α=2/13" },
  "EMA 26":             { def: "Trung bình mũ 26 phiên." },
  "EMA 50":             { def: "Trung bình mũ 50 phiên — xu hướng trung hạn." },
  "SMA 20":             { def: "Trung bình đơn giản 20 phiên." },
  "VWAP":               { def: "Giá trung bình theo khối lượng.", formula: "Σ(TP·V) ÷ ΣV, TP=(H+L+C)/3" },
  "ATR(14)":            { def: "Average True Range — biên độ dao động thực.", formula: "AVG(max(H−L, |H−C_{−1}|, |L−C_{−1}|))" },
  "OBV":                { def: "On-Balance Volume — dòng tiền tích luỹ.", formula: "OBV_t = OBV_{t−1} ± V_t" },
  "ADX / CCI / MFI / StochRSI": { def: "Bộ chỉ báo nâng cao.", na: "Chạy 12_technical_bundle.py trong Python Lab." },
  "Ichimoku / Fibonacci": { def: "Mô hình Ichimoku Cloud & Fibonacci retracement.", na: "Xem trực quan trong TradingView Panel." },
  // Risk
  "Beta":               { def: "Hệ số beta so với thị trường.", formula: "Cov(r_i, r_m) ÷ Var(r_m)" },
  "Alpha (CAPM, annual)": { def: "Lợi nhuận vượt trội so với CAPM.", formula: "α = R_i − [Rf + β(Rm − Rf)]", na: "Cần chuỗi lợi suất thị trường thực." },
  "Volatility (annual)":{ def: "Độ biến động chuẩn hoá năm.", formula: "σ_daily × √252" },
  "Historical Vol":     { def: "Volatility lịch sử (annual)." },
  "Implied Volatility": { def: "Volatility ngụ ý từ giá option.", na: "Cần option chain — chưa tích hợp." },
  "Std Dev (daily)":    { def: "Độ lệch chuẩn lợi suất ngày.", formula: "√(Σ(r−r̄)² ÷ (n−1))" },
  "Variance (daily)":   { def: "Phương sai lợi suất ngày.", formula: "σ²" },
  "Covariance":         { def: "Hiệp phương sai giữa 2 tài sản.", na: "Cần ≥2 chuỗi — dùng Portfolio Lab." },
  "Correlation":        { def: "Hệ số tương quan Pearson.", na: "Cần ≥2 chuỗi — dùng Portfolio Lab." },
  "Correlation Matrix": { def: "Ma trận tương quan.", na: "Dùng tab Portfolio/Stock Comparison." },
  "Max Drawdown":       { def: "Sụt giảm tối đa từ đỉnh.", formula: "min((P_t − max P_{≤t}) ÷ max P_{≤t})" },
  "Downside Deviation": { def: "Độ lệch chuẩn phần lợi suất âm.", formula: "√(Σ min(r−MAR,0)² ÷ n)" },
  "Tracking Error":     { def: "Sai số theo dõi so với benchmark.", formula: "σ(r_p − r_b)", na: "Cần benchmark cụ thể." },
  "VaR 95% (1d)":       { def: "Value at Risk — tổn thất tối đa với 95% tin cậy.", formula: "−percentile(r, 5%)" },
  "CVaR 95% (1d)":      { def: "Conditional VaR — kỳ vọng lỗ khi vượt VaR.", formula: "−E[r | r ≤ −VaR]" },
  "Expected Shortfall": { def: "Đồng nghĩa CVaR." },
  // Portfolio
  "Sharpe Ratio":       { def: "Lợi nhuận vượt trội trên đơn vị rủi ro tổng.", formula: "(R − Rf) ÷ σ" },
  "Sortino Ratio":      { def: "Sharpe chỉ tính rủi ro downside.", formula: "(R − Rf) ÷ DownsideDev" },
  "Treynor Ratio":      { def: "Excess return trên beta.", formula: "(R − Rf) ÷ β", na: "Yêu cầu benchmark thị trường thực." },
  "Information Ratio":  { def: "Active return trên tracking error.", formula: "(R_p − R_b) ÷ TE", na: "Cần benchmark." },
  "Calmar Ratio":       { def: "CAGR trên Max Drawdown.", formula: "CAGR ÷ |MaxDD|" },
  "Jensen Alpha":       { def: "Alpha theo CAPM.", na: "Cần benchmark." },
  "Active Return":      { def: "R_portfolio − R_benchmark.", na: "Cần benchmark." },
  "Active Risk":        { def: "σ(R_p − R_b) — chính là Tracking Error.", na: "Cần benchmark." },
  // Momentum
  "Momentum 1M":        { def: "Đà giá 1 tháng.", formula: "P_t/P_{t−21} − 1" },
  "Momentum 3M":        { def: "Đà giá 3 tháng.", formula: "P_t/P_{t−63} − 1" },
  "Momentum 6M":        { def: "Đà giá 6 tháng.", formula: "P_t/P_{t−126} − 1" },
  "Earnings Momentum":  { def: "Đà tăng trưởng EPS gần nhất.", na: "Cần chuỗi EPS quý." },
  "Volume Momentum":    { def: "So sánh vol 20 phiên gần với 20 phiên trước.", formula: "AvgVol(0..20)/AvgVol(20..40) − 1" },
  // Quality
  "Piotroski F-Score":  { def: "Chấm điểm chất lượng 9 tiêu chí.", na: "Chạy 10_quality_scores.py." },
  "Altman Z-Score":     { def: "Chỉ số dự báo phá sản.", formula: "1.2A + 1.4B + 3.3C + 0.6D + 1.0E", na: "Chạy 10_quality_scores.py." },
  "Beneish M-Score":    { def: "Chỉ số phát hiện gian lận báo cáo.", na: "Cần 8 biến kế toán chi tiết." },
  "Earnings Quality":   { def: "Chất lượng lợi nhuận (OCF/NI).", na: "Cần OCF và Net Income." },
  "Accrual Ratio":      { def: "Tỷ trọng khoản kế toán dồn tích.", na: "Cần chi tiết BS + CF." },
  // Dividend
  "Dividend Yield":     { def: "Cổ tức trên giá.", formula: "DPS ÷ Price" },
  "Dividend Growth":    { def: "Tăng trưởng cổ tức YoY.", na: "Cần lịch sử chi trả." },
  "Dividend CAGR":      { def: "Tăng trưởng kép cổ tức.", na: "Cần lịch sử ≥3 năm." },
  "Payout Ratio":       { def: "Tỉ lệ chi trả từ lợi nhuận.", formula: "DPS ÷ EPS", na: "Cần DPS." },
  "Ex-Dividend Date":   { def: "Ngày giao dịch không hưởng quyền.", na: "Provider chưa trả về." },
  "Dividend History":   { def: "Lịch sử chi trả.", na: "Cần API dividend history." },
  // Health
  "Debt Coverage (OCF/Debt)": { def: "Khả năng trả nợ từ OCF.", formula: "OCF ÷ Total Debt" },
  "Bankruptcy Risk":    { def: "Rủi ro phá sản định tính.", na: "Dùng Altman Z-Score." },
  "Solvency Score":     { def: "Chỉ số dung nạp nợ ròng.", formula: "(Cash − Debt) ÷ (Cash + Debt)" },
  // Quant advanced
  "Z-Score (last return)": { def: "Chuẩn hoá lợi suất phiên gần nhất.", formula: "(r_t − r̄) ÷ σ" },
  "Skewness":           { def: "Độ lệch phân phối lợi suất.", formula: "E[(r−μ)³] ÷ σ³" },
  "Kurtosis (excess)":  { def: "Độ nhọn (excess) — đo đuôi.", formula: "E[(r−μ)⁴] ÷ σ⁴ − 3" },
  "Autocorrelation (lag 1)": { def: "Tự tương quan lag 1.", formula: "Corr(r_t, r_{t−1})" },
  "Rolling Volatility 20D": { def: "Volatility trượt 20 phiên (annualized)." },
  "Rolling Correlation":{ def: "Tương quan trượt.", na: "Cần ≥2 chuỗi — Portfolio Lab." },
  "Rolling Beta":       { def: "Beta trượt.", na: "Cần benchmark — Portfolio Lab." },
  "Covariance Matrix":  { def: "Ma trận hiệp phương sai.", na: "Cần rổ tài sản — Portfolio Lab." },
  "Eigenvalues / PCA":  { def: "Trị riêng / phân tích thành phần chính.", na: "Chạy 11_pca_correlation.py." },
  "Monte Carlo":        { def: "Mô phỏng ngẫu nhiên GBM.", na: "Xem tab Forecast hoặc 04_monte_carlo_gbm.py." },
  "GARCH Volatility":   { def: "Volatility có điều kiện, mô hình GARCH(1,1).", na: "Cần thư viện chuyên — Models Lab." },
  "CAPM E[R] (annual)": { def: "Kỳ vọng lợi nhuận theo CAPM.", formula: "Rf + β·(Rm − Rf)" },
  "Fama-French 3F":     { def: "Mô hình 3 nhân tố (MKT, SMB, HML).", na: "Cần dữ liệu factor Fama-French." },
  "Fama-French 5F":     { def: "5 nhân tố (+ RMW, CMA).", na: "Cần dữ liệu factor." },
  "Carhart 4F":         { def: "3F + Momentum (UMD).", na: "Cần dữ liệu factor." },
  "Black-Litterman":    { def: "Mô hình phối kết hợp kỳ vọng tiên nghiệm.", na: "Yêu cầu views và ma trận covariance." },
  "Efficient Frontier": { def: "Đường biên hiệu quả Markowitz.", na: "Dùng Portfolio Lab." },
  "Information Coefficient": { def: "Corr(dự báo, thực tế) — sức mạnh tín hiệu.", na: "Cần model dự báo." },
  // AI scores
  "Overall AI Score":   { def: "Điểm tổng hợp (0-100) theo 7 nhân tố.", formula: "0.25·F + 0.15·T + 0.15·M + 0.15·G + 0.15·Q + 0.10·R + 0.05·V" },
  "Fundamental Score":  { def: "Điểm cơ bản (ROE, ROA, biên, D/E, tăng trưởng)." },
  "Technical Score":    { def: "Điểm kỹ thuật (RSI, EMA50, MACD)." },
  "Momentum Score":     { def: "Điểm đà (1M + 3M returns)." },
  "Growth Score":       { def: "Điểm tăng trưởng (Revenue & Earnings)." },
  "Quality Score":      { def: "Điểm chất lượng (biên gộp, biên hoạt động, current ratio, ROE)." },
  "Risk Score (adj.)":  { def: "Điểm rủi ro nghịch đảo (thấp = rủi ro cao).", formula: "100 − vol·150 − |MaxDD|·100" },
  "Value Score":        { def: "Điểm định giá (P/E, P/B, FCF Yield)." },
  "Sentiment Score":    { def: "Điểm tâm lý thị trường.", na: "Dùng tab AI Research / Fear & Greed." },
  "ESG Score":          { def: "Điểm ESG.", na: "Chưa tích hợp provider ESG." },
  "Institutional Score":{ def: "Sức mua tổ chức.", na: "Cần dữ liệu 13F." },
  "Smart Money Score":  { def: "Dòng tiền thông minh.", na: "Cần dữ liệu insider + options flow." },
};

// -------- UI primitives --------
function Cell({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  const isNA = value === "—" || value === "" || value === null || value === undefined;
  const info = METRIC_INFO[label];
  return (
    <div className="relative rounded-md border border-border/40 bg-muted/20 p-2.5 hover:border-primary/40 transition-colors group cursor-help">
      <div className="flex items-center gap-1">
        <div className="text-[9px] uppercase tracking-wider text-muted-foreground truncate flex-1">{label}</div>
        {(info || hint) && (
          <span className="text-[9px] font-mono text-muted-foreground/60 group-hover:text-primary transition-colors">ⓘ</span>
        )}
      </div>
      <div className={`font-mono text-[13px] mt-0.5 truncate ${isNA ? "text-muted-foreground/50" : "text-primary"}`}>
        {value}
      </div>
      {(info || hint) && (
        <div className="pointer-events-none absolute z-50 left-0 top-full mt-1 w-64 opacity-0 group-hover:opacity-100 transition-opacity duration-150 rounded-md border border-primary/40 bg-popover/95 backdrop-blur-sm shadow-lg p-2.5 text-left">
          <div className="text-[10px] font-semibold text-primary mb-1">{label}</div>
          {info?.def && <div className="text-[10px] text-foreground/90 leading-snug mb-1">{info.def}</div>}
          {info?.formula && (
            <div className="text-[10px] font-mono text-emerald-400/90 leading-snug mb-1">
              <span className="text-muted-foreground">ƒ:</span> {info.formula}
            </div>
          )}
          {hint && <div className="text-[10px] text-muted-foreground leading-snug mb-1">{hint}</div>}
          {isNA && (info?.na || !info) && (
            <div className="text-[10px] text-amber-400/90 leading-snug border-t border-border/40 pt-1 mt-1">
              <span className="font-semibold">Vì sao "—":</span> {info?.na || "Provider hiện chưa trả về dữ liệu này cho mã đang chọn."}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Section({
  id, title, icon: Icon, count, total, defaultOpen = false, children,
}: {
  id: string; title: string; icon: any; count: number; total: number;
  defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const pctFill = Math.round((count / total) * 100);
  return (
    <div className="rounded-lg border border-border/40 bg-background/40">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted/30 transition-colors"
      >
        {open ? <ChevronDown className="w-3.5 h-3.5 text-primary" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
        <Icon className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs font-semibold">{title}</span>
        <span className="text-[10px] font-mono text-muted-foreground">
          {count}/{total}
        </span>
        <div className="ml-auto flex items-center gap-2 min-w-[80px]">
          <div className="h-1 w-16 bg-muted/40 rounded overflow-hidden">
            <div
              className={`h-full ${pctFill >= 70 ? "bg-emerald-500" : pctFill >= 40 ? "bg-amber-500" : "bg-red-500/60"}`}
              style={{ width: `${pctFill}%` }}
            />
          </div>
          <span className="text-[9px] font-mono text-muted-foreground w-8 text-right">{pctFill}%</span>
        </div>
      </button>
      {open && (
        <div className="p-3 border-t border-border/40 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {children}
        </div>
      )}
    </div>
  );
}

export function ComprehensiveMetricsPanel({ quote, history, analysis }: Props) {
  const [expandAll, setExpandAll] = useState(false);

  const m = useMemo(() => {
    const q: any = quote || {};
    const r = analysis?.returns || [];
    const closes = history?.closes || [];
    const highs = history?.highs || [];
    const lows = history?.lows || [];
    const vols = history?.volumes || [];

    const ev = q.marketCap && q.totalDebt !== undefined
      ? (Number(q.marketCap) || 0) + (q.totalDebt || 0) - (q.totalCash || 0)
      : null;
    const capex = (q.operatingCashflow && q.freeCashflow)
      ? q.operatingCashflow - q.freeCashflow : null;
    const fcfYield = (q.freeCashflow && q.marketCap)
      ? q.freeCashflow / Number(q.marketCap) : null;
    const netDebt = (q.totalDebt !== undefined && q.totalCash !== undefined)
      ? q.totalDebt - q.totalCash : null;
    const priceCF = (q.marketCap && q.operatingCashflow)
      ? Number(q.marketCap) / q.operatingCashflow : null;

    // CAGR from closes
    const cagr = (years: number) => {
      const need = Math.round(years * 252);
      if (closes.length < need) return null;
      const start = closes[closes.length - need];
      const end = closes[closes.length - 1];
      if (!start || start <= 0) return null;
      return Math.pow(end / start, 1 / years) - 1;
    };
    const cagr3 = cagr(3); const cagr5 = cagr(5);

    // Returns stats
    const stdDaily = stdDev(r);
    const varDaily = stdDaily * stdDaily;
    const skew = skewness(r);
    const kurt = kurtosisExcess(r);
    const ac1 = autocorr(r, 1);
    const dd = downsideDeviation(r);
    const var95 = -percentile(r, 0.05);
    const tail = r.filter((v) => v <= -var95);
    const cvar95 = tail.length ? -mean(tail) : 0;
    const rollingVol20 = r.length >= 20 ? stdDev(r.slice(-20)) * Math.sqrt(252) : null;

    // Momentum
    const mom = (days: number) => {
      if (closes.length < days + 1) return null;
      const a = closes[closes.length - days - 1], b = closes[closes.length - 1];
      return a > 0 ? (b - a) / a : null;
    };
    const mom1m = mom(21); const mom3m = mom(63); const mom6m = mom(126);
    const volMom = vols.length >= 40
      ? mean(vols.slice(-20)) / (mean(vols.slice(-40, -20)) || 1) - 1
      : null;
    const relVol = q.volume && q.avgVolume ? q.volume / q.avgVolume : null;

    // Technicals
    const last = analysis?.chartData?.[analysis.chartData.length - 1] || {};
    const vwap = computeVWAP(highs, lows, closes, vols);
    const atr = computeATR(highs, lows, closes);
    const obv = computeOBV(closes, vols);

    // Sortino, Calmar
    const rfDaily = 0.04 / 252;
    const sortino = dd > 0 ? ((mean(r) - rfDaily) / dd) * Math.sqrt(252) : null;
    const calmar = analysis && analysis.maxDD > 0 && cagr3
      ? cagr3 / analysis.maxDD : null;

    // CAPM E[R]
    const capmER = analysis ? 0.04 + analysis.beta * (0.10 - 0.04) : null;

    // Financial health simple
    const debtCoverage = (q.operatingCashflow && q.totalDebt)
      ? q.operatingCashflow / q.totalDebt : null;
    const solvency = (q.totalCash !== undefined && q.totalDebt !== undefined && (q.totalCash + q.totalDebt) > 0)
      ? (q.totalCash - q.totalDebt) / (q.totalCash + q.totalDebt) : null;

    // AI scores (heuristic 0-100)
    const clamp = (x: number) => Math.max(0, Math.min(100, x));
    const fundamentalScore = clamp(
      50 + (q.roe > 0.15 ? 15 : 0) + (q.roa > 0.05 ? 10 : 0)
      + (q.profitMargin > 0.1 ? 10 : 0) + (q.deRatio && q.deRatio < 1 ? 10 : 0)
      + (q.revenueGrowth > 0.1 ? 10 : 0)
    );
    const technicalScore = clamp(
      50 + (analysis?.rsi > 40 && analysis?.rsi < 65 ? 15 : -5)
      + (last?.close > last?.ema50 ? 15 : -5)
      + (last?.macd > last?.signal ? 15 : -5)
    );
    const momentumScore = clamp(50 + (mom1m || 0) * 200 + (mom3m || 0) * 100);
    const growthScore = clamp(50 + (q.revenueGrowth || 0) * 200 + (q.earningsGrowth || 0) * 150);
    const qualityScore = clamp(
      50 + (q.grossMargin > 0.3 ? 15 : 0) + (q.operatingMargin > 0.15 ? 10 : 0)
      + (q.currentRatio > 1.5 ? 10 : 0) + (q.roe > 0.15 ? 15 : 0)
    );
    const riskScore = clamp(
      100 - (analysis?.vol || 0) * 150 - (analysis?.maxDD || 0) * 100
    );
    const valueScore = clamp(
      50 + (q.pe > 0 && q.pe < 15 ? 20 : q.pe < 25 ? 10 : -10)
      + (q.pb > 0 && q.pb < 2 ? 15 : q.pb < 4 ? 5 : -10)
      + (fcfYield && fcfYield > 0.05 ? 15 : 0)
    );
    const overall = clamp(
      (fundamentalScore * 0.25 + technicalScore * 0.15 + momentumScore * 0.15
        + growthScore * 0.15 + qualityScore * 0.15 + riskScore * 0.10 + valueScore * 0.05)
    );

    return {
      q, r, ev, capex, fcfYield, netDebt, priceCF,
      cagr3, cagr5, stdDaily, varDaily, skew, kurt, ac1, dd,
      var95, cvar95, rollingVol20,
      mom1m, mom3m, mom6m, volMom, relVol,
      last, vwap, atr, obv,
      sortino, calmar, capmER,
      debtCoverage, solvency,
      scores: {
        overall, fundamental: fundamentalScore, technical: technicalScore,
        momentum: momentumScore, growth: growthScore, quality: qualityScore,
        risk: riskScore, value: valueScore,
      },
    };
  }, [quote, history, analysis]);

  const q: any = quote || {};
  const has = (v: any) => v !== null && v !== undefined && !Number.isNaN(v) && isFinite(v as number);

  // Helper to count non-empty cells per section
  const cnt = (arr: any[]) => arr.filter((v) => has(v)).length;

  const recBadge = (() => {
    const s = m.scores.overall;
    if (s >= 75) return { text: "STRONG BUY", cls: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" };
    if (s >= 60) return { text: "BUY", cls: "bg-green-500/15 text-green-400 border-green-500/40" };
    if (s >= 45) return { text: "HOLD", cls: "bg-amber-500/15 text-amber-400 border-amber-500/40" };
    if (s >= 30) return { text: "REDUCE", cls: "bg-orange-500/15 text-orange-400 border-orange-500/40" };
    return { text: "SELL", cls: "bg-red-500/15 text-red-400 border-red-500/40" };
  })();

  return (
    <div className="quant-card space-y-4">
      {/* Header + Overall AI Score */}
      <div className="flex items-center gap-2 flex-wrap">
        <LayoutGrid className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold tracking-wide uppercase">Comprehensive Metrics — 16 Categories</h3>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/15 text-primary">
          Bloomberg-grade dashboard
        </span>
        <button
          onClick={() => setExpandAll(!expandAll)}
          className="ml-auto text-[10px] px-2 py-1 rounded-full bg-muted/30 hover:bg-muted/50 border border-border/40 font-mono"
        >
          {expandAll ? "Collapse all" : "Expand all"}
        </button>
      </div>

      {/* AI Score summary */}
      <div className="rounded-lg border border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          <span className="text-xs uppercase tracking-wider font-semibold">Overall AI Score</span>
          <div className="text-2xl font-bold font-mono text-primary">{m.scores.overall.toFixed(0)}<span className="text-sm text-muted-foreground">/100</span></div>
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md border ${recBadge.cls}`}>{recBadge.text}</span>
          <span className="ml-auto text-[10px] font-mono text-muted-foreground">Symbol: {q.symbol || "—"}</span>
        </div>
        <div className="mt-3 grid grid-cols-2 md:grid-cols-7 gap-2">
          {[
            { l: "Fundamental", v: m.scores.fundamental },
            { l: "Technical", v: m.scores.technical },
            { l: "Momentum", v: m.scores.momentum },
            { l: "Growth", v: m.scores.growth },
            { l: "Quality", v: m.scores.quality },
            { l: "Risk (adj)", v: m.scores.risk },
            { l: "Value", v: m.scores.value },
          ].map((s) => (
            <div key={s.l} className="rounded-md bg-background/60 border border-border/40 p-2">
              <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{s.l}</div>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="font-mono text-sm text-primary">{s.v.toFixed(0)}</span>
                <span className="text-[9px] text-muted-foreground">/100</span>
              </div>
              <div className="h-1 bg-muted/40 rounded mt-1 overflow-hidden">
                <div className={`h-full ${s.v >= 65 ? "bg-emerald-500" : s.v >= 45 ? "bg-amber-500" : "bg-red-500/70"}`} style={{ width: `${s.v}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-2" key={expandAll ? "open" : "closed"}>
        {/* 1. Valuation */}
        <Section id="val" title="1. Valuation (Định giá)" icon={DollarSign}
          count={cnt([q.pe, q.forwardPe, q.pe && q.earningsGrowth, q.pb, q.ps, null, m.ev, m.ev, m.priceCF, q.marketCap, q.bookValue])}
          total={12} defaultOpen={expandAll || true}>
          <Cell label="P/E" value={fmt(q.pe)} />
          <Cell label="Forward P/E" value={fmt(q.forwardPe)} />
          <Cell label="PEG" value={q.pe && q.earningsGrowth ? fmt(q.pe / (q.earningsGrowth * 100), 2) : "—"} hint="P/E ÷ (EPS Growth %)" />
          <Cell label="P/B" value={fmt(q.pb)} />
          <Cell label="P/S" value={fmt(q.ps)} />
          <Cell label="EV/EBITDA" value="—" hint="Cần EBITDA từ báo cáo" />
          <Cell label="EV/Sales" value={m.ev && q.totalRevenue ? fmt(m.ev / q.totalRevenue) : "—"} />
          <Cell label="Price/Cash Flow" value={fmt(m.priceCF)} />
          <Cell label="Enterprise Value" value={fmt(m.ev, 2, " $")} />
          <Cell label="Market Cap" value={typeof q.marketCap === "number" ? fmt(q.marketCap, 2, " $") : q.marketCap || "—"} />
          <Cell label="Book Value/Share" value={fmt(q.bookValue)} />
          <Cell label="Intrinsic Value (DCF)" value="—" hint="Xem tab Forecast/Models Lab" />
        </Section>

        {/* 2. Profitability */}
        <Section id="prof" title="2. Profitability (Sinh lời)" icon={Percent}
          count={cnt([q.roe, q.roa, null, null, null, q.grossMargin, null, q.operatingMargin, q.profitMargin, q.eps])}
          total={11}>
          <Cell label="ROE" value={pct(q.roe)} />
          <Cell label="ROA" value={pct(q.roa)} />
          <Cell label="ROIC" value="—" />
          <Cell label="ROI" value="—" />
          <Cell label="ROCE" value="—" />
          <Cell label="Gross Margin" value={pct(q.grossMargin)} />
          <Cell label="EBITDA Margin" value="—" />
          <Cell label="Operating Margin" value={pct(q.operatingMargin)} />
          <Cell label="Net Margin" value={pct(q.profitMargin)} />
          <Cell label="EPS" value={fmt(q.eps)} />
          <Cell label="Diluted EPS" value="—" />
        </Section>

        {/* 3. Growth */}
        <Section id="growth" title="3. Growth (Tăng trưởng)" icon={TrendingUp}
          count={cnt([q.revenueGrowth, null, q.earningsGrowth, null, null, null, m.cagr3, m.cagr5])} total={8}>
          <Cell label="Revenue Growth" value={pct(q.revenueGrowth)} />
          <Cell label="EPS Growth" value="—" />
          <Cell label="Net Income Growth" value={pct(q.earningsGrowth)} />
          <Cell label="Operating Income Growth" value="—" />
          <Cell label="Cash Flow Growth" value="—" />
          <Cell label="Free Cash Flow Growth" value="—" />
          <Cell label="CAGR 3Y (price)" value={pct(m.cagr3)} />
          <Cell label="CAGR 5Y (price)" value={pct(m.cagr5)} />
        </Section>

        {/* 4. Liquidity */}
        <Section id="liq" title="4. Liquidity (Thanh khoản)" icon={Wallet}
          count={cnt([q.currentRatio])} total={6}>
          <Cell label="Current Ratio" value={fmt(q.currentRatio)} />
          <Cell label="Quick Ratio" value="—" />
          <Cell label="Cash Ratio" value="—" />
          <Cell label="Working Capital" value="—" />
          <Cell label="Current Assets" value="—" />
          <Cell label="Current Liabilities" value="—" />
        </Section>

        {/* 5. Leverage */}
        <Section id="lev" title="5. Leverage (Đòn bẩy)" icon={Layers}
          count={cnt([q.deRatio, null, null, null, null, m.netDebt])} total={6}>
          <Cell label="Debt/Equity" value={fmt(q.deRatio)} />
          <Cell label="Debt/Assets" value="—" />
          <Cell label="Interest Coverage" value="—" />
          <Cell label="Financial Leverage" value="—" />
          <Cell label="Long-term Debt" value="—" />
          <Cell label="Net Debt" value={fmt(m.netDebt, 2, " $")} />
        </Section>

        {/* 6. Cash Flow */}
        <Section id="cf" title="6. Cash Flow" icon={Coins}
          count={cnt([q.operatingCashflow, null, null, q.freeCashflow, m.capex, m.fcfYield])} total={6}>
          <Cell label="Operating Cash Flow" value={fmt(q.operatingCashflow, 2, " $")} />
          <Cell label="Investing Cash Flow" value="—" />
          <Cell label="Financing Cash Flow" value="—" />
          <Cell label="Free Cash Flow" value={fmt(q.freeCashflow, 2, " $")} />
          <Cell label="CapEx (OCF − FCF)" value={fmt(m.capex, 2, " $")} />
          <Cell label="FCF Yield" value={pct(m.fcfYield)} />
        </Section>

        {/* 7. Market Statistics */}
        <Section id="mkt" title="7. Market Statistics" icon={BarChart3}
          count={cnt([q.volume, q.avgVolume, null, null, null, null, null, null, m.relVol])} total={9}>
          <Cell label="Volume" value={fmt(q.volume)} />
          <Cell label="Average Volume" value={fmt(q.avgVolume)} />
          <Cell label="Float" value="—" />
          <Cell label="Shares Outstanding" value="—" />
          <Cell label="Insider Ownership" value="—" />
          <Cell label="Institutional Ownership" value="—" />
          <Cell label="Short Interest" value="—" />
          <Cell label="Short Ratio" value="—" />
          <Cell label="Relative Volume" value={fmt(m.relVol)} />
        </Section>

        {/* 8. Technical */}
        <Section id="tech" title="8. Technical Indicators" icon={Activity}
          count={cnt([analysis?.rsi, m.last?.macd, m.last?.bbUpper, m.last?.ema12, analysis?.chartData?.length, m.vwap, m.atr, m.obv])} total={14}>
          <Cell label="RSI(14)" value={fmt(analysis?.rsi, 1)} />
          <Cell label="MACD" value={fmt(m.last?.macd, 3)} />
          <Cell label="MACD Signal" value={fmt(m.last?.signal, 3)} />
          <Cell label="BB Upper" value={fmt(m.last?.bbUpper)} />
          <Cell label="BB Lower" value={fmt(m.last?.bbLower)} />
          <Cell label="EMA 12" value={fmt(m.last?.ema12)} />
          <Cell label="EMA 26" value={fmt(m.last?.ema26)} />
          <Cell label="EMA 50" value={fmt(m.last?.ema50)} />
          <Cell label="SMA 20" value={fmt(m.last?.sma20)} />
          <Cell label="VWAP" value={fmt(m.vwap)} />
          <Cell label="ATR(14)" value={fmt(m.atr, 3)} />
          <Cell label="OBV" value={fmt(m.obv)} />
          <Cell label="ADX / CCI / MFI / StochRSI" value="→ Python Lab" hint="Chạy 12_technical_bundle.py" />
          <Cell label="Ichimoku / Fibonacci" value="→ TradingView" />
        </Section>

        {/* 9. Volatility & Risk */}
        <Section id="risk" title="9. Volatility & Risk" icon={Shield}
          count={cnt([analysis?.beta, null, analysis?.vol, analysis?.vol, null, m.stdDaily, m.varDaily, null, null, null, analysis?.maxDD, m.dd, null, m.var95, m.cvar95, m.cvar95])} total={17}>
          <Cell label="Beta" value={fmt(analysis?.beta)} />
          <Cell label="Alpha (CAPM, annual)" value="→ Models Lab" hint="Cần thêm chuỗi thị trường thực" />
          <Cell label="Volatility (annual)" value={pct(analysis?.vol)} />
          <Cell label="Historical Vol" value={pct(analysis?.vol)} />
          <Cell label="Implied Volatility" value="—" hint="Cần chuỗi option chain" />
          <Cell label="Std Dev (daily)" value={pct(m.stdDaily, 3)} />
          <Cell label="Variance (daily)" value={m.varDaily.toExponential(3)} />
          <Cell label="Covariance" value="→ Portfolio Lab" />
          <Cell label="Correlation" value="→ Portfolio Lab" />
          <Cell label="Correlation Matrix" value="→ Portfolio Lab" />
          <Cell label="Max Drawdown" value={pct(analysis?.maxDD)} />
          <Cell label="Downside Deviation" value={pct(m.dd, 3)} />
          <Cell label="Tracking Error" value="—" />
          <Cell label="VaR 95% (1d)" value={pct(m.var95)} />
          <Cell label="CVaR 95% (1d)" value={pct(m.cvar95)} />
          <Cell label="Expected Shortfall" value={pct(m.cvar95)} />
        </Section>

        {/* 10. Portfolio Metrics */}
        <Section id="port" title="10. Portfolio Metrics" icon={Gauge}
          count={cnt([analysis?.sharpe, m.sortino, null, null, m.calmar])} total={8}>
          <Cell label="Sharpe Ratio" value={fmt(analysis?.sharpe, 3)} />
          <Cell label="Sortino Ratio" value={fmt(m.sortino, 3)} />
          <Cell label="Treynor Ratio" value="—" />
          <Cell label="Information Ratio" value="—" />
          <Cell label="Calmar Ratio" value={fmt(m.calmar, 3)} />
          <Cell label="Jensen Alpha" value="—" />
          <Cell label="Active Return" value="—" />
          <Cell label="Active Risk" value="—" />
        </Section>

        {/* 11. Momentum */}
        <Section id="mom" title="11. Momentum" icon={Zap}
          count={cnt([m.mom1m, null, m.mom3m, null, m.volMom, m.relVol])} total={6}>
          <Cell label="Momentum 1M" value={pct(m.mom1m)} />
          <Cell label="Momentum 3M" value={pct(m.mom3m)} />
          <Cell label="Momentum 6M" value={pct(m.mom6m)} />
          <Cell label="Earnings Momentum" value="—" />
          <Cell label="Volume Momentum" value={pct(m.volMom)} />
          <Cell label="Relative Volume" value={fmt(m.relVol, 2, "×")} />
        </Section>

        {/* 12. Quality */}
        <Section id="qual" title="12. Quality Score" icon={Award}
          count={0} total={5}>
          <Cell label="Piotroski F-Score" value="→ 10_quality_scores.py" />
          <Cell label="Altman Z-Score" value="→ 10_quality_scores.py" />
          <Cell label="Beneish M-Score" value="—" />
          <Cell label="Earnings Quality" value="—" />
          <Cell label="Accrual Ratio" value="—" />
        </Section>

        {/* 13. Dividend */}
        <Section id="div" title="13. Dividend" icon={Coins}
          count={cnt([q.divYield])} total={6}>
          <Cell label="Dividend Yield" value={pct(q.divYield)} />
          <Cell label="Dividend Growth" value="—" />
          <Cell label="Dividend CAGR" value="—" />
          <Cell label="Payout Ratio" value="—" />
          <Cell label="Ex-Dividend Date" value="—" />
          <Cell label="Dividend History" value="—" />
        </Section>

        {/* 14. Financial Health */}
        <Section id="health" title="14. Financial Health" icon={HeartPulse}
          count={cnt([null, null, m.debtCoverage, null, null, m.solvency])} total={6}>
          <Cell label="Altman Z-Score" value="—" />
          <Cell label="Piotroski F-Score" value="—" />
          <Cell label="Debt Coverage (OCF/Debt)" value={fmt(m.debtCoverage, 2)} />
          <Cell label="Bankruptcy Risk" value="—" />
          <Cell label="Interest Coverage" value="—" />
          <Cell label="Solvency Score" value={has(m.solvency) ? m.solvency.toFixed(3) : "—"} hint="(Cash - Debt) / (Cash + Debt)" />
        </Section>

        {/* 15. Quant advanced */}
        <Section id="quant" title="15. Quant Advanced (Bloomberg-grade)" icon={Sigma}
          count={cnt([m.stdDaily, m.stdDaily, m.skew, m.kurt, m.ac1, null, null, m.rollingVol20, m.capmER])} total={20}>
          <Cell label="Z-Score (last return)" value={m.stdDaily ? ((m.r[m.r.length - 1] || 0) / m.stdDaily).toFixed(2) : "—"} />
          <Cell label="Skewness" value={fmt(m.skew, 3)} />
          <Cell label="Kurtosis (excess)" value={fmt(m.kurt, 3)} />
          <Cell label="Autocorrelation (lag 1)" value={fmt(m.ac1, 3)} />
          <Cell label="Rolling Volatility 20D" value={pct(m.rollingVol20)} />
          <Cell label="Rolling Correlation" value="→ Portfolio Lab" />
          <Cell label="Rolling Beta" value="→ Portfolio Lab" />
          <Cell label="Covariance Matrix" value="→ Portfolio Lab" />
          <Cell label="Correlation Matrix" value="→ Portfolio Lab" />
          <Cell label="Eigenvalues / PCA" value="→ 11_pca_correlation.py" />
          <Cell label="Monte Carlo" value="→ Forecast tab" />
          <Cell label="GARCH Volatility" value="→ Models Lab" />
          <Cell label="CAPM E[R] (annual)" value={pct(m.capmER)} hint="Rf + β×(Rm − Rf), Rf=4%, Rm=10%" />
          <Cell label="Fama-French 3F" value="—" />
          <Cell label="Fama-French 5F" value="—" />
          <Cell label="Carhart 4F" value="—" />
          <Cell label="Black-Litterman" value="—" />
          <Cell label="Efficient Frontier" value="→ Portfolio Lab" />
          <Cell label="Information Coefficient" value="—" />
          <Cell label="Information Ratio" value="—" />
        </Section>

        {/* 16. AI Scores */}
        <Section id="ai" title="16. AI Scores (Crystal Ball proprietary)" icon={Sparkles}
          count={7} total={12} defaultOpen={expandAll}>
          <Cell label="Overall AI Score" value={`${m.scores.overall.toFixed(0)}/100`} />
          <Cell label="Fundamental Score" value={`${m.scores.fundamental.toFixed(0)}/100`} />
          <Cell label="Technical Score" value={`${m.scores.technical.toFixed(0)}/100`} />
          <Cell label="Momentum Score" value={`${m.scores.momentum.toFixed(0)}/100`} />
          <Cell label="Growth Score" value={`${m.scores.growth.toFixed(0)}/100`} />
          <Cell label="Quality Score" value={`${m.scores.quality.toFixed(0)}/100`} />
          <Cell label="Risk Score (adj.)" value={`${m.scores.risk.toFixed(0)}/100`} />
          <Cell label="Value Score" value={`${m.scores.value.toFixed(0)}/100`} />
          <Cell label="Sentiment Score" value="→ AI Research" />
          <Cell label="ESG Score" value="—" />
          <Cell label="Institutional Score" value="—" />
          <Cell label="Smart Money Score" value="—" />
        </Section>
      </div>

      <div className="text-[10px] text-muted-foreground font-mono flex items-center gap-2 pt-1">
        <LineChart className="w-3 h-3" />
        Các chỉ số "—" cần dữ liệu chuyên sâu (báo cáo tài chính chi tiết, chuỗi thị trường, option chain). Điều hướng "→" mở tab tương ứng để tính sâu hơn.
      </div>
    </div>
  );
}
