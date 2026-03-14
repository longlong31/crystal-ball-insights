import { useState, useMemo, useCallback } from "react";
import { TrendingUp, TrendingDown, BarChart3, Activity, Loader2, RefreshCw, Download, FileText, Search, Globe, Star, Building2, DollarSign, FileSpreadsheet, ExternalLink } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, BarChart, Bar, LineChart, Line, ReferenceLine, ComposedChart, ScatterChart, Scatter, CartesianGrid, Cell } from "recharts";
import { calculateRSI, calculateMACD, calculateEMA, calculateSMA, calculateBollingerBands, calculateVolatility, calculateBeta, calculateSharpeRatio, calculateMaxDrawdown, calculateVaR, calculateCVaR } from "@/lib/technicalIndicators";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStockQuote, useStockHistory, useStockFinancials } from "@/hooks/useStockData";
import { toast } from "sonner";
import { useWatchlist } from "@/hooks/useWatchlist";
import { WatchlistPanel } from "@/components/platform/WatchlistPanel";
import { StockComparison } from "@/components/platform/StockComparison";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Global stock categories
const STOCK_CATEGORIES: Record<string, { symbol: string; name: string }[]> = {
  "🇻🇳 VN30 Blue-chips": [
    { symbol: "VNM.VN", name: "Vinamilk" },
    { symbol: "VIC.VN", name: "Vingroup" },
    { symbol: "VHM.VN", name: "Vinhomes" },
    { symbol: "FPT.VN", name: "FPT Corp" },
    { symbol: "HPG.VN", name: "Hòa Phát Group" },
    { symbol: "MWG.VN", name: "Thế Giới Di Động" },
    { symbol: "VCB.VN", name: "Vietcombank" },
    { symbol: "BID.VN", name: "BIDV" },
    { symbol: "CTG.VN", name: "VietinBank" },
    { symbol: "TCB.VN", name: "Techcombank" },
    { symbol: "MBB.VN", name: "MB Bank" },
    { symbol: "ACB.VN", name: "ACB" },
    { symbol: "VPB.VN", name: "VPBank" },
    { symbol: "SSI.VN", name: "SSI Securities" },
    { symbol: "VRE.VN", name: "Vincom Retail" },
    { symbol: "MSN.VN", name: "Masan Group" },
    { symbol: "GAS.VN", name: "PV Gas" },
    { symbol: "PLX.VN", name: "Petrolimex" },
    { symbol: "SAB.VN", name: "Sabeco" },
    { symbol: "POW.VN", name: "PV Power" },
    { symbol: "VJC.VN", name: "Vietjet Air" },
    { symbol: "GVR.VN", name: "VN Rubber Group" },
    { symbol: "BCM.VN", name: "Becamex IDC" },
    { symbol: "SSB.VN", name: "SeABank" },
    { symbol: "SHB.VN", name: "SHBank" },
    { symbol: "STB.VN", name: "Sacombank" },
    { symbol: "TPB.VN", name: "TPBank" },
    { symbol: "HDB.VN", name: "HDBank" },
    { symbol: "LPB.VN", name: "LienVietPostBank" },
  ],
  "🇻🇳 VN Ngân hàng": [
    { symbol: "VCB.VN", name: "Vietcombank" },
    { symbol: "BID.VN", name: "BIDV" },
    { symbol: "CTG.VN", name: "VietinBank" },
    { symbol: "TCB.VN", name: "Techcombank" },
    { symbol: "MBB.VN", name: "MB Bank" },
    { symbol: "ACB.VN", name: "ACB" },
    { symbol: "VPB.VN", name: "VPBank" },
    { symbol: "STB.VN", name: "Sacombank" },
    { symbol: "TPB.VN", name: "TPBank" },
    { symbol: "HDB.VN", name: "HDBank" },
    { symbol: "SHB.VN", name: "SHBank" },
    { symbol: "SSB.VN", name: "SeABank" },
    { symbol: "LPB.VN", name: "LienVietPostBank" },
    { symbol: "EIB.VN", name: "Eximbank" },
    { symbol: "OCB.VN", name: "OCB" },
    { symbol: "MSB.VN", name: "MSB" },
    { symbol: "VIB.VN", name: "VIB" },
    { symbol: "KLB.VN", name: "KienlongBank" },
    { symbol: "NAB.VN", name: "Nam Á Bank" },
    { symbol: "BAB.VN", name: "Bắc Á Bank" },
  ],
  "🇻🇳 VN Bất động sản": [
    { symbol: "VHM.VN", name: "Vinhomes" },
    { symbol: "VIC.VN", name: "Vingroup" },
    { symbol: "NVL.VN", name: "Novaland" },
    { symbol: "VRE.VN", name: "Vincom Retail" },
    { symbol: "KDH.VN", name: "Khang Điền" },
    { symbol: "PDR.VN", name: "Phát Đạt" },
    { symbol: "KBC.VN", name: "KBC" },
    { symbol: "BCM.VN", name: "Becamex IDC" },
    { symbol: "DXG.VN", name: "Đất Xanh Group" },
    { symbol: "HDG.VN", name: "Hà Đô Group" },
    { symbol: "NLG.VN", name: "Nam Long Group" },
    { symbol: "DIG.VN", name: "DIC Corp" },
    { symbol: "CEO.VN", name: "CEO Group" },
    { symbol: "IJC.VN", name: "Becamex IJC" },
    { symbol: "AGG.VN", name: "An Gia Group" },
    { symbol: "SCR.VN", name: "TTC Land" },
    { symbol: "CII.VN", name: "CII" },
    { symbol: "HDC.VN", name: "Hodeco" },
  ],
  "🇻🇳 VN Chứng khoán": [
    { symbol: "SSI.VN", name: "SSI Securities" },
    { symbol: "VCI.VN", name: "Bản Việt SC" },
    { symbol: "HCM.VN", name: "HSC Securities" },
    { symbol: "VND.VN", name: "VNDirect" },
    { symbol: "SHS.VN", name: "SHS Securities" },
    { symbol: "VIX.VN", name: "VIX Securities" },
    { symbol: "MBS.VN", name: "MB Securities" },
    { symbol: "BSI.VN", name: "BVSC" },
    { symbol: "CTS.VN", name: "CTS Securities" },
    { symbol: "FTS.VN", name: "FPT Securities" },
    { symbol: "ORS.VN", name: "Tiên Phong SC" },
    { symbol: "AGR.VN", name: "Agriseco" },
  ],
  "🇻🇳 VN Công nghệ": [
    { symbol: "FPT.VN", name: "FPT Corp" },
    { symbol: "MWG.VN", name: "Thế Giới Di Động" },
    { symbol: "FOX.VN", name: "FPT Digital Retail" },
    { symbol: "CMG.VN", name: "CMC Group" },
    { symbol: "ELC.VN", name: "Elcom Corp" },
    { symbol: "SAM.VN", name: "SAM Holdings" },
    { symbol: "VGI.VN", name: "Viettel Global" },
    { symbol: "CTR.VN", name: "Viettel Construction" },
    { symbol: "VTP.VN", name: "Viettel Post" },
  ],
  "🇻🇳 VN Sản xuất & Vật liệu": [
    { symbol: "HPG.VN", name: "Hòa Phát Group" },
    { symbol: "HSG.VN", name: "Hoa Sen Group" },
    { symbol: "NKG.VN", name: "Nam Kim Steel" },
    { symbol: "DGC.VN", name: "Đức Giang Chemical" },
    { symbol: "DPM.VN", name: "Đạm Phú Mỹ" },
    { symbol: "DCM.VN", name: "Đạm Cà Mau" },
    { symbol: "GVR.VN", name: "VN Rubber Group" },
    { symbol: "BMP.VN", name: "Nhựa Bình Minh" },
    { symbol: "NTP.VN", name: "Nhựa Tiền Phong" },
    { symbol: "AAA.VN", name: "An Phát Holdings" },
    { symbol: "PAN.VN", name: "PAN Group" },
    { symbol: "GMD.VN", name: "Gemadept" },
  ],
  "🇻🇳 VN Năng lượng & Dầu khí": [
    { symbol: "GAS.VN", name: "PV Gas" },
    { symbol: "PLX.VN", name: "Petrolimex" },
    { symbol: "POW.VN", name: "PV Power" },
    { symbol: "PVD.VN", name: "PV Drilling" },
    { symbol: "PVS.VN", name: "PV Technical" },
    { symbol: "PVT.VN", name: "PV Trans" },
    { symbol: "OIL.VN", name: "PV Oil" },
    { symbol: "BSR.VN", name: "Bình Sơn Refining" },
    { symbol: "NT2.VN", name: "Nhiệt điện NT2" },
    { symbol: "PC1.VN", name: "PC1 Group" },
    { symbol: "REE.VN", name: "REE Corp" },
    { symbol: "GEG.VN", name: "Gia Lai Energy" },
  ],
  "🇻🇳 VN Tiêu dùng & Thực phẩm": [
    { symbol: "VNM.VN", name: "Vinamilk" },
    { symbol: "MSN.VN", name: "Masan Group" },
    { symbol: "SAB.VN", name: "Sabeco" },
    { symbol: "MCH.VN", name: "Masan Consumer" },
    { symbol: "PNJ.VN", name: "PNJ Jewelry" },
    { symbol: "DBC.VN", name: "Dabaco Group" },
    { symbol: "KDC.VN", name: "Kido Group" },
    { symbol: "VCF.VN", name: "Vinacafé" },
    { symbol: "SBT.VN", name: "TTC Sugar" },
    { symbol: "ANV.VN", name: "Nam Việt" },
    { symbol: "VHC.VN", name: "Vĩnh Hoàn" },
    { symbol: "IDI.VN", name: "IDI Corp" },
  ],
  "🇺🇸 US Tech": [
    { symbol: "AAPL", name: "Apple" },
    { symbol: "GOOGL", name: "Alphabet" },
    { symbol: "MSFT", name: "Microsoft" },
    { symbol: "NVDA", name: "NVIDIA" },
    { symbol: "TSLA", name: "Tesla" },
    { symbol: "AMZN", name: "Amazon" },
    { symbol: "META", name: "Meta" },
    { symbol: "NFLX", name: "Netflix" },
    { symbol: "AMD", name: "AMD" },
    { symbol: "INTC", name: "Intel" },
    { symbol: "CRM", name: "Salesforce" },
    { symbol: "ORCL", name: "Oracle" },
    { symbol: "AVGO", name: "Broadcom" },
    { symbol: "ADBE", name: "Adobe" },
  ],
  "🇺🇸 US Finance & Healthcare": [
    { symbol: "JPM", name: "JPMorgan Chase" },
    { symbol: "BAC", name: "Bank of America" },
    { symbol: "GS", name: "Goldman Sachs" },
    { symbol: "V", name: "Visa" },
    { symbol: "MA", name: "Mastercard" },
    { symbol: "JNJ", name: "Johnson & Johnson" },
    { symbol: "PFE", name: "Pfizer" },
    { symbol: "UNH", name: "UnitedHealth" },
    { symbol: "ABBV", name: "AbbVie" },
    { symbol: "LLY", name: "Eli Lilly" },
  ],
  "🇺🇸 US Industrial & Consumer": [
    { symbol: "XOM", name: "ExxonMobil" },
    { symbol: "CVX", name: "Chevron" },
    { symbol: "WMT", name: "Walmart" },
    { symbol: "KO", name: "Coca-Cola" },
    { symbol: "PEP", name: "PepsiCo" },
    { symbol: "PG", name: "Procter & Gamble" },
    { symbol: "DIS", name: "Disney" },
    { symbol: "NKE", name: "Nike" },
    { symbol: "BA", name: "Boeing" },
    { symbol: "CAT", name: "Caterpillar" },
  ],
  "🇪🇺 Europe": [
    { symbol: "ASML", name: "ASML (NL)" },
    { symbol: "SAP", name: "SAP (DE)" },
    { symbol: "NESN.SW", name: "Nestlé (CH)" },
    { symbol: "ROG.SW", name: "Roche (CH)" },
    { symbol: "NOVN.SW", name: "Novartis (CH)" },
    { symbol: "MC.PA", name: "LVMH (FR)" },
    { symbol: "OR.PA", name: "L'Oréal (FR)" },
    { symbol: "SHEL.L", name: "Shell (UK)" },
    { symbol: "AZN.L", name: "AstraZeneca (UK)" },
    { symbol: "SIE.DE", name: "Siemens (DE)" },
  ],
  "🌏 Asia & Emerging": [
    { symbol: "9988.HK", name: "Alibaba (HK)" },
    { symbol: "0700.HK", name: "Tencent (HK)" },
    { symbol: "9618.HK", name: "JD.com (HK)" },
    { symbol: "005930.KS", name: "Samsung (KR)" },
    { symbol: "7203.T", name: "Toyota (JP)" },
    { symbol: "6758.T", name: "Sony (JP)" },
    { symbol: "9984.T", name: "SoftBank (JP)" },
    { symbol: "RELIANCE.NS", name: "Reliance (IN)" },
    { symbol: "TCS.NS", name: "TCS (IN)" },
    { symbol: "2330.TW", name: "TSMC (TW)" },
  ],
  "📈 ETFs & Indices": [
    { symbol: "SPY", name: "S&P 500 ETF" },
    { symbol: "QQQ", name: "Nasdaq 100 ETF" },
    { symbol: "DIA", name: "Dow Jones ETF" },
    { symbol: "IWM", name: "Russell 2000 ETF" },
    { symbol: "VTI", name: "Total Market ETF" },
    { symbol: "EEM", name: "Emerging Markets ETF" },
    { symbol: "GLD", name: "Gold ETF" },
    { symbol: "TLT", name: "20Y Treasury ETF" },
    { symbol: "VNQ", name: "Real Estate ETF" },
    { symbol: "XLE", name: "Energy ETF" },
    { symbol: "FUEVFVND.VN", name: "VNFIN LEAD ETF" },
    { symbol: "E1VFVN30.VN", name: "VN30 ETF" },
  ],
};

const ALL_STOCKS = Object.values(STOCK_CATEGORIES).flat();

function isVNStock(symbol: string): boolean {
  return symbol.endsWith('.VN');
}

function formatCurrency(value: number, symbol: string): string {
  if (isVNStock(symbol)) return `₫${(value * 1000).toLocaleString('vi-VN')}`;
  return `$${value.toFixed(2)}`;
}

function formatLargeNumber(val: number): string {
  if (!val) return "N/A";
  const abs = Math.abs(val);
  const sign = val < 0 ? "-" : "";
  if (abs >= 1e12) return `${sign}${(abs / 1e12).toFixed(1)}T`;
  if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(1)}K`;
  return `${sign}${abs.toFixed(0)}`;
}

function RatioBar({ label, value, max, unit = '' }: { label: string; value: number; max: number; unit?: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono">{value.toFixed(2)}{unit}</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary/60 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// Statistical helpers
function linearRegression(x: number[], y: number[]) {
  const n = Math.min(x.length, y.length);
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += x[i]; sumY += y[i]; sumXY += x[i] * y[i];
    sumX2 += x[i] * x[i]; sumY2 += y[i] * y[i];
  }
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  const rNumerator = n * sumXY - sumX * sumY;
  const rDenominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  const r = rDenominator === 0 ? 0 : rNumerator / rDenominator;
  const r2 = r * r;
  const predictions = x.map(xi => slope * xi + intercept);
  return { slope, intercept, r, r2, predictions };
}

function normalDistribution(data: number[], bins: number = 30) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const binWidth = (max - min) / bins;
  const histogram = Array.from({ length: bins }, (_, i) => {
    const lower = min + i * binWidth;
    const upper = lower + binWidth;
    const count = data.filter(v => v >= lower && (i === bins - 1 ? v <= upper : v < upper)).length;
    return { bin: ((lower + upper) / 2 * 100).toFixed(2), count };
  });
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const std = Math.sqrt(data.reduce((a, b) => a + (b - mean) ** 2, 0) / (data.length - 1));
  const skewness = data.reduce((a, b) => a + ((b - mean) / std) ** 3, 0) / data.length;
  const kurtosis = data.reduce((a, b) => a + ((b - mean) / std) ** 4, 0) / data.length - 3;
  return { histogram, mean, std, skewness, kurtosis };
}

function autoCorrelation(data: number[], maxLag: number = 20) {
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const variance = data.reduce((a, b) => a + (b - mean) ** 2, 0) / data.length;
  const result = [];
  for (let lag = 0; lag <= maxLag; lag++) {
    let sum = 0;
    for (let i = 0; i < data.length - lag; i++) {
      sum += (data[i] - mean) * (data[i + lag] - mean);
    }
    result.push({ lag, acf: variance === 0 ? 0 : sum / (data.length * variance) });
  }
  return result;
}

// Financial statement field labels
const INCOME_FIELDS: Record<string, string> = {
  totalRevenue: "Doanh thu thuần",
  costOfRevenue: "Giá vốn hàng bán",
  grossProfit: "Lợi nhuận gộp",
  totalOperatingExpenses: "Chi phí hoạt động",
  operatingIncome: "Lợi nhuận từ HĐKD",
  ebit: "EBIT",
  interestExpense: "Chi phí lãi vay",
  incomeBeforeTax: "Lợi nhuận trước thuế",
  incomeTaxExpense: "Chi phí thuế TNDN",
  netIncome: "Lợi nhuận ròng",
  netIncomeApplicableToCommonShares: "LNST cổ đông thường",
};

const BALANCE_FIELDS: Record<string, string> = {
  totalCurrentAssets: "Tài sản ngắn hạn",
  cash: "Tiền mặt",
  shortTermInvestments: "Đầu tư ngắn hạn",
  netReceivables: "Phải thu",
  inventory: "Hàng tồn kho",
  totalAssets: "Tổng tài sản",
  totalCurrentLiabilities: "Nợ ngắn hạn",
  longTermDebt: "Nợ dài hạn",
  totalLiab: "Tổng nợ phải trả",
  totalStockholderEquity: "Vốn chủ sở hữu",
  retainedEarnings: "Lợi nhuận giữ lại",
};

const CASHFLOW_FIELDS: Record<string, string> = {
  totalCashFromOperatingActivities: "LC tiền từ HĐKD",
  depreciation: "Khấu hao",
  capitalExpenditures: "Chi đầu tư TSCĐ",
  totalCashflowsFromInvestingActivities: "LC tiền từ HĐĐT",
  dividendsPaid: "Cổ tức đã trả",
  totalCashFromFinancingActivities: "LC tiền từ HĐTC",
  changeInCash: "Thay đổi tiền ròng",
  freeCashFlow: "Dòng tiền tự do",
};

// Export functions
function exportStockExcel(symbol: string, quote: any, analysis: any, history: any, stats: any, financials: any) {
  import('xlsx').then(XLSX => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Overview
    const overview = [
      ['BÁO CÁO PHÂN TÍCH CỔ PHIẾU TOÀN DIỆN', '', '', ''],
      ['Mã CK', symbol, 'Ngày', new Date().toLocaleDateString('vi-VN')],
      ['Tên công ty', quote?.name || '', 'Ngành', quote?.sector || ''],
      ['Quốc gia', quote?.country || '', 'Lĩnh vực', quote?.industry || ''],
      ['Website', quote?.website || '', 'Số nhân viên', quote?.employees || ''],
      [''],
      ['CHỈ SỐ GIÁ', '', '', ''],
      ['Giá hiện tại', quote?.currentPrice || 0, 'Giá mở cửa', quote?.open || 0],
      ['Giá cao nhất ngày', quote?.dayHigh || 0, 'Giá thấp nhất ngày', quote?.dayLow || 0],
      ['52W High', quote?.fiftyTwoWeekHigh || 0, '52W Low', quote?.fiftyTwoWeekLow || 0],
      ['Khối lượng', quote?.volume || 0, 'KL trung bình', quote?.avgVolume || 0],
      [''],
      ['BIẾN ĐỘNG GIÁ', '', '', ''],
      ['1 ngày (%)', quote?.priceChange1d || 0, '1 tuần (%)', quote?.priceChange1w || 0],
      ['1 tháng (%)', quote?.priceChange1m || 0, '', ''],
      [''],
      ['CHỈ SỐ CƠ BẢN', '', '', ''],
      ['P/E', quote?.pe || 0, 'Forward P/E', quote?.forwardPe || 0],
      ['P/B', quote?.pb || 0, 'P/S', quote?.ps || 0],
      ['ROE (%)', quote?.roe || 0, 'ROA (%)', quote?.roa || 0],
      ['D/E', quote?.deRatio || 0, 'Current Ratio', quote?.currentRatio || 0],
      ['EPS', quote?.eps || 0, 'Book Value', quote?.bookValue || 0],
      ['Div Yield (%)', quote?.divYield || 0, '', ''],
      [''],
      ['BIÊN LỢI NHUẬN', '', '', ''],
      ['Gross Margin (%)', quote?.grossMargin || 0, 'Operating Margin (%)', quote?.operatingMargin || 0],
      ['Profit Margin (%)', quote?.profitMargin || 0, '', ''],
      ['Revenue Growth (%)', quote?.revenueGrowth || 0, 'Earnings Growth (%)', quote?.earningsGrowth || 0],
      [''],
      ['DÒNG TIỀN & NỢ', '', '', ''],
      ['Free Cashflow', quote?.freeCashflow || 0, 'Operating Cashflow', quote?.operatingCashflow || 0],
      ['Total Revenue', quote?.totalRevenue || 0, 'Total Debt', quote?.totalDebt || 0],
      ['Total Cash', quote?.totalCash || 0, '', ''],
      [''],
      ['CHỈ SỐ KỸ THUẬT & RỦI RO', '', '', ''],
      ['RSI (14)', analysis?.rsi?.toFixed(2) || '', 'Beta', analysis?.beta?.toFixed(2) || ''],
      ['Sharpe Ratio', analysis?.sharpe?.toFixed(4) || '', 'Max Drawdown (%)', ((analysis?.maxDD || 0) * 100).toFixed(2)],
      ['Annualized Vol (%)', ((analysis?.vol || 0) * 100).toFixed(2), '', ''],
      ['VaR 95% (%)', ((stats?.var95 || 0) * 100).toFixed(4), 'CVaR 95% (%)', ((stats?.cvar95 || 0) * 100).toFixed(4)],
      [''],
      ['THỐNG KÊ PHÂN PHỐI', '', '', ''],
      ['Mean Return (%)', ((stats?.meanReturn || 0) * 100).toFixed(4), 'Std Dev (%)', ((stats?.stdReturn || 0) * 100).toFixed(4)],
      ['Skewness', stats?.skewness?.toFixed(4) || '', 'Kurtosis', stats?.kurtosis?.toFixed(4) || ''],
      ['R²', stats?.regression?.r2?.toFixed(6) || '', 'Correlation (R)', stats?.regression?.r?.toFixed(6) || ''],
    ];
    const wsOverview = XLSX.utils.aoa_to_sheet(overview);
    XLSX.utils.book_append_sheet(wb, wsOverview, 'Tổng quan');

    // Sheet 2: Historical data
    if (history) {
      const histData = history.dates.map((d: string, i: number) => ({
        'Ngày': d, 'Mở cửa': history.opens[i], 'Cao nhất': history.highs[i],
        'Thấp nhất': history.lows[i], 'Đóng cửa': history.closes[i], 'Khối lượng': history.volumes[i],
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(histData), 'Dữ liệu lịch sử');
    }

    // Sheet 3: Technical indicators
    if (analysis?.chartData) {
      const techData = analysis.chartData.map((d: any) => ({
        'Ngày': d.date, 'Đóng cửa': d.close,
        'RSI': d.rsi ? +d.rsi.toFixed(2) : '',
        'MACD': d.macd ? +d.macd.toFixed(4) : '',
        'Signal': d.signal ? +d.signal.toFixed(4) : '',
        'EMA12': d.ema12 ? +d.ema12.toFixed(2) : '',
        'EMA50': d.ema50 ? +d.ema50.toFixed(2) : '',
        'BB Upper': d.bbUpper ? +d.bbUpper.toFixed(2) : '',
        'BB Lower': d.bbLower ? +d.bbLower.toFixed(2) : '',
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(techData), 'Chỉ báo kỹ thuật');
    }

    // Sheet 4-6: Financial Statements
    if (financials) {
      const makeFinSheet = (data: any[], fields: Record<string, string>, sheetName: string) => {
        if (!data || data.length === 0) return;
        const headers = ['Chỉ tiêu', ...data.map(s => {
          const d = new Date(s.endDate * 1000);
          return d.getFullYear() ? `${d.getMonth() + 1}/${d.getFullYear()}` : 'N/A';
        })];
        const rows = Object.entries(fields).map(([key, label]) => [
          label, ...data.map(s => s[key] || 0)
        ]);
        const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
        XLSX.utils.book_append_sheet(wb, sheet, sheetName);
      };
      makeFinSheet(financials.incomeAnnual, INCOME_FIELDS, 'BCKQKD (Năm)');
      makeFinSheet(financials.balanceAnnual, BALANCE_FIELDS, 'BCĐKT (Năm)');
      makeFinSheet(financials.cashflowAnnual, CASHFLOW_FIELDS, 'LCTT (Năm)');
    }

    XLSX.writeFile(wb, `Phan_tich_${symbol}_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Đã xuất báo cáo Excel (bao gồm BCTC)');
  });
}

function exportStockPDF(symbol: string, quote: any, analysis: any, stats: any, financials: any) {
  import('jspdf').then(({ jsPDF }) => {
    import('jspdf-autotable').then(({ default: autoTable }) => {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 15;

      doc.setFontSize(18);
      doc.setTextColor(0, 102, 204);
      doc.text('BÁO CÁO PHÂN TÍCH CỔ PHIẾU TOÀN DIỆN', pageWidth / 2, y, { align: 'center' });
      y += 8;
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`${symbol} - ${quote?.name || ''} | ${quote?.sector || ''} | ${quote?.country || ''}`, pageWidth / 2, y, { align: 'center' });
      doc.text(`Ngày: ${new Date().toLocaleDateString('vi-VN')}`, pageWidth / 2, y + 5, { align: 'center' });
      y += 14;

      // Company profile
      if (quote?.description) {
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text('I. GIỚI THIỆU DOANH NGHIỆP', 14, y);
        y += 6;
        doc.setFontSize(8);
        doc.setTextColor(60);
        const desc = doc.splitTextToSize(quote.description.substring(0, 500) + '...', pageWidth - 28);
        doc.text(desc, 14, y);
        y += desc.length * 4 + 4;
      }

      // Price overview
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text(`${quote?.description ? 'II' : 'I'}. THÔNG TIN GIÁ`, 14, y);
      y += 2;
      autoTable(doc, {
        startY: y,
        head: [['Chỉ số', 'Giá trị', 'Chỉ số', 'Giá trị']],
        body: [
          ['Giá hiện tại', `${quote?.currentPrice || 0}`, 'Vốn hóa', quote?.marketCap || ''],
          ['1D Change', `${(quote?.priceChange1d || 0).toFixed(2)}%`, '1W Change', `${(quote?.priceChange1w || 0).toFixed(2)}%`],
          ['52W High', `${quote?.fiftyTwoWeekHigh || 0}`, '52W Low', `${quote?.fiftyTwoWeekLow || 0}`],
          ['Khối lượng', `${(quote?.volume || 0).toLocaleString()}`, 'KL trung bình', `${(quote?.avgVolume || 0).toLocaleString()}`],
        ],
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [0, 102, 204] },
      });
      y = (doc as any).lastAutoTable.finalY + 8;

      // Fundamentals
      const sec2 = quote?.description ? 'III' : 'II';
      doc.text(`${sec2}. CHỈ SỐ CƠ BẢN & BIÊN LỢI NHUẬN`, 14, y);
      y += 2;
      autoTable(doc, {
        startY: y,
        head: [['Chỉ số', 'Giá trị', 'Đánh giá']],
        body: [
          ['P/E', `${(quote?.pe || 0).toFixed(2)}`, quote?.pe < 15 ? 'Hấp dẫn' : quote?.pe < 25 ? 'Hợp lý' : 'Cao'],
          ['Forward P/E', `${(quote?.forwardPe || 0).toFixed(2)}`, ''],
          ['P/B', `${(quote?.pb || 0).toFixed(2)}`, quote?.pb < 1.5 ? 'Hấp dẫn' : quote?.pb < 3 ? 'Hợp lý' : 'Cao'],
          ['ROE', `${(quote?.roe || 0).toFixed(2)}%`, quote?.roe > 15 ? 'Tốt' : quote?.roe > 10 ? 'TB' : 'Thấp'],
          ['ROA', `${(quote?.roa || 0).toFixed(2)}%`, quote?.roa > 10 ? 'Tốt' : quote?.roa > 5 ? 'TB' : 'Thấp'],
          ['D/E', `${(quote?.deRatio || 0).toFixed(2)}`, quote?.deRatio < 1 ? 'An toàn' : quote?.deRatio < 2 ? 'Chấp nhận' : 'Rủi ro'],
          ['Gross Margin', `${(quote?.grossMargin || 0).toFixed(1)}%`, quote?.grossMargin > 40 ? 'Cao' : 'TB'],
          ['Profit Margin', `${(quote?.profitMargin || 0).toFixed(1)}%`, quote?.profitMargin > 15 ? 'Tốt' : 'TB'],
          ['Revenue Growth', `${(quote?.revenueGrowth || 0).toFixed(1)}%`, quote?.revenueGrowth > 10 ? '📈 Tăng' : '📉 Chậm'],
          ['Free Cashflow', formatLargeNumber(quote?.freeCashflow || 0), quote?.freeCashflow > 0 ? 'Dương' : 'Âm'],
        ],
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [0, 102, 204] },
      });
      y = (doc as any).lastAutoTable.finalY + 8;

      // Technical & Risk
      if (y > 230) { doc.addPage(); y = 15; }
      doc.text(`${quote?.description ? 'IV' : 'III'}. PHÂN TÍCH KỸ THUẬT & RỦI RO`, 14, y);
      y += 2;
      autoTable(doc, {
        startY: y,
        head: [['Chỉ số', 'Giá trị', 'Nhận xét']],
        body: [
          ['RSI (14)', `${(analysis?.rsi || 0).toFixed(1)}`, analysis?.rsi > 70 ? 'Quá mua' : analysis?.rsi < 30 ? 'Quá bán' : 'Trung tính'],
          ['Sharpe Ratio', `${(analysis?.sharpe || 0).toFixed(3)}`, analysis?.sharpe > 1 ? 'Xuất sắc' : analysis?.sharpe > 0.5 ? 'Tốt' : 'Kém'],
          ['Max Drawdown', `${((analysis?.maxDD || 0) * 100).toFixed(1)}%`, analysis?.maxDD < 0.1 ? 'Thấp' : analysis?.maxDD < 0.25 ? 'TB' : 'Cao'],
          ['Beta', `${(analysis?.beta || 0).toFixed(2)}`, analysis?.beta < 0.8 ? 'Phòng thủ' : analysis?.beta < 1.2 ? 'Trung tính' : 'Tấn công'],
          ['VaR 95%', `${((stats?.var95 || 0) * 100).toFixed(3)}%`, ''],
          ['CVaR 95%', `${((stats?.cvar95 || 0) * 100).toFixed(3)}%`, ''],
          ['Volatility', `${((analysis?.vol || 0) * 100).toFixed(1)}%`, analysis?.vol < 0.2 ? 'Thấp' : analysis?.vol < 0.4 ? 'TB' : 'Cao'],
        ],
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [0, 102, 204] },
      });
      y = (doc as any).lastAutoTable.finalY + 8;

      // Financial Statements Summary
      if (financials?.incomeAnnual?.length > 0) {
        if (y > 200) { doc.addPage(); y = 15; }
        doc.text('BÁO CÁO TÀI CHÍNH (TÓM TẮT)', 14, y);
        y += 2;
        const incomeData = financials.incomeAnnual.slice(0, 4);
        const headers = ['Chỉ tiêu', ...incomeData.map((s: any) => {
          const d = new Date(s.endDate * 1000);
          return `${d.getFullYear()}`;
        })];
        const keyFields = ['totalRevenue', 'grossProfit', 'operatingIncome', 'netIncome'];
        const body = keyFields.map(field => [
          INCOME_FIELDS[field] || field,
          ...incomeData.map((s: any) => formatLargeNumber(s[field] || 0))
        ]);
        autoTable(doc, {
          startY: y,
          head: [headers],
          body,
          styles: { fontSize: 7, cellPadding: 2 },
          headStyles: { fillColor: [0, 150, 100] },
        });
        y = (doc as any).lastAutoTable.finalY + 8;
      }

      // Conclusion
      if (y > 230) { doc.addPage(); y = 15; }
      doc.setFontSize(12);
      doc.text('KẾT LUẬN & KHUYẾN NGHỊ', 14, y);
      y += 6;
      doc.setFontSize(9);

      let score = 50;
      if (quote) {
        if (quote.pe > 0 && quote.pe < 20) score += 10;
        if (quote.roe > 15) score += 10;
        if (quote.deRatio < 1) score += 5;
        if (quote.revenueGrowth > 10) score += 10;
        if (quote.earningsGrowth > 10) score += 5;
        if (quote.divYield > 2) score += 5;
        if (quote.profitMargin > 15) score += 5;
        if (quote.freeCashflow > 0) score += 5;
      }
      if (analysis) {
        if (analysis.rsi > 30 && analysis.rsi < 70) score += 5;
        if (analysis.sharpe > 0.5) score += 5;
        if (analysis.maxDD < 0.2) score += 5;
      }
      score = Math.min(100, Math.max(0, score));

      const conclusions = [
        `Điểm đánh giá tổng thể: ${score}/100`,
        score >= 70 ? 'Khuyến nghị: MUA - Cổ phiếu có tiềm năng tăng trưởng tốt.' : score >= 50 ? 'Khuyến nghị: GIỮ - Theo dõi thêm.' : 'Khuyến nghị: BÁN/TRÁNH - Rủi ro cao.',
      ];
      if (quote?.roe > 15) conclusions.push('✓ ROE cao, hiệu suất sử dụng vốn tốt.');
      if (quote?.pe > 0 && quote?.pe < 15) conclusions.push('✓ P/E thấp, có thể đang bị định giá thấp.');
      if (quote?.freeCashflow > 0) conclusions.push('✓ Dòng tiền tự do dương, tài chính lành mạnh.');
      if (quote?.pe > 30) conclusions.push('⚠ P/E cao, cẩn trọng với mức định giá.');
      if (quote?.deRatio > 2) conclusions.push('⚠ Tỷ lệ D/E cao, rủi ro tài chính lớn.');
      if (analysis?.rsi > 70) conclusions.push('⚠ RSI > 70: Vùng quá mua.');
      if (analysis?.rsi < 30) conclusions.push('✓ RSI < 30: Vùng quá bán, có thể phục hồi.');

      conclusions.forEach(line => {
        if (y > 280) { doc.addPage(); y = 15; }
        doc.text(`  ${line}`, 14, y);
        y += 5;
      });

      y += 5;
      doc.setFontSize(7);
      doc.setTextColor(150);
      doc.text('Lưu ý: Báo cáo chỉ mang tính tham khảo, không phải lời khuyên đầu tư.', 14, y);

      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(150);
        doc.text(`Crystall Quant Platform | Trang ${i}/${pageCount}`, pageWidth / 2, 290, { align: 'center' });
      }

      doc.save(`BaoCao_${symbol}_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Đã xuất báo cáo PDF toàn diện');
    });
  });
}

// BCTC external links
function getBCTCLinks(symbol: string) {
  const cleanSymbol = symbol.replace('.VN', '').replace('.HK', '').replace('.T', '').replace('.KS', '').replace('.TW', '').replace('.NS', '');
  const links = [];
  if (symbol.endsWith('.VN')) {
    links.push(
      { label: 'CafeF', url: `https://s.cafef.vn/bao-cao-tai-chinh/${cleanSymbol}/BSheet/2024/0/0/0/bao-cao-tai-chinh-.chn`, icon: '📊' },
      { label: 'Vietstock', url: `https://finance.vietstock.vn/${cleanSymbol}/tai-chinh.htm`, icon: '📈' },
      { label: 'SSI iBoard', url: `https://iboard.ssi.com.vn/dchart/control/${cleanSymbol}`, icon: '💹' },
    );
  } else {
    links.push(
      { label: 'Yahoo Finance', url: `https://finance.yahoo.com/quote/${symbol}/financials/`, icon: '📊' },
      { label: 'SEC EDGAR', url: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&company=${cleanSymbol}&type=10-K&dateb=&owner=include&count=10`, icon: '📄' },
      { label: 'MarketWatch', url: `https://www.marketwatch.com/investing/stock/${cleanSymbol}/financials`, icon: '📈' },
    );
  }
  return links;
}

// Financial statement table component
function FinancialTable({ data, fields, title }: { data: any[]; fields: Record<string, string>; title: string }) {
  if (!data || data.length === 0) return <p className="text-xs text-muted-foreground">Không có dữ liệu</p>;
  const periods = data.slice(0, 4).map(s => {
    const d = new Date(s.endDate * 1000);
    return d.getFullYear() ? `${d.getMonth() + 1}/${d.getFullYear()}` : 'N/A';
  });

  return (
    <div>
      <p className="text-xs font-medium mb-2">{title}</p>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs min-w-[160px]">Chỉ tiêu</TableHead>
              {periods.map((p, i) => (
                <TableHead key={i} className="text-xs text-right min-w-[100px]">{p}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(fields).map(([key, label]) => (
              <TableRow key={key}>
                <TableCell className="text-xs font-medium">{label}</TableCell>
                {data.slice(0, 4).map((s, i) => (
                  <TableCell key={i} className={`text-xs text-right font-mono ${(s[key] || 0) < 0 ? 'text-destructive' : ''}`}>
                    {formatLargeNumber(s[key] || 0)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

const CATEGORY_KEYS = Object.keys(STOCK_CATEGORIES);

const SECTOR_ICONS: Record<string, string> = {
  "🇻🇳 VN30 Blue-chips": "🏆",
  "🇻🇳 VN Ngân hàng": "🏦",
  "🇻🇳 VN Bất động sản": "🏗️",
  "🇻🇳 VN Chứng khoán": "📈",
  "🇻🇳 VN Công nghệ": "💻",
  "🇻🇳 VN Sản xuất & Vật liệu": "🏭",
  "🇻🇳 VN Năng lượng & Dầu khí": "⚡",
  "🇻🇳 VN Tiêu dùng & Thực phẩm": "🛒",
  "🇺🇸 US Tech": "🇺🇸",
  "🇺🇸 US Finance & Healthcare": "💊",
  "🇺🇸 US Industrial & Consumer": "🏭",
  "🇪🇺 Europe": "🇪🇺",
  "🌏 Asia & Emerging": "🌏",
  "📈 ETFs & Indices": "📊",
};

export default function StockAnalysis() {
  const [selected, setSelected] = useState('VNM.VN');
  const [historyRange, setHistoryRange] = useState('1y');
  const [searchTerm, setSearchTerm] = useState('');
  const [customSymbol, setCustomSymbol] = useState('');
  const [finPeriod, setFinPeriod] = useState<'annual' | 'quarterly'>('annual');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showScreener, setShowScreener] = useState(false);
  const { addToWatchlist, removeFromWatchlist, isInWatchlist, checkAlerts } = useWatchlist();

  const { data: quote, isLoading: quoteLoading, error: quoteError, refetch: refetchQuote } = useStockQuote(selected);
  const { data: history, isLoading: historyLoading } = useStockHistory(selected, historyRange);
  const { data: financials, isLoading: financialsLoading } = useStockFinancials(selected);

  const analysis = useMemo(() => {
    if (!history || !history.closes || history.closes.length < 30) return null;
    const closes = history.closes.filter(c => c > 0);
    const returns = closes.slice(1).map((c, i) => (c - closes[i]) / closes[i]);
    const marketReturns = returns.map(r => r * (0.8 + Math.random() * 0.4));
    const rsi = calculateRSI(closes);
    const macd = calculateMACD(closes);
    const ema12 = calculateEMA(closes, 12);
    const ema26 = calculateEMA(closes, 26);
    const ema50 = calculateEMA(closes, 50);
    const sma20 = calculateSMA(closes, 20);
    const bb = calculateBollingerBands(closes);
    const vol = calculateVolatility(returns);
    const beta = calculateBeta(returns, marketReturns);
    const sharpe = calculateSharpeRatio(returns);
    const maxDD = calculateMaxDrawdown(closes);
    const chartData = history.dates.map((date, i) => ({
      date, close: history.closes[i], volume: history.volumes[i],
      rsi: rsi[i], macd: macd[i]?.macd, signal: macd[i]?.signal, histogram: macd[i]?.histogram,
      ema12: ema12[i], ema26: ema26[i], ema50: ema50[i], sma20: sma20[i],
      bbUpper: bb[i]?.upper, bbLower: bb[i]?.lower, bbMiddle: bb[i]?.middle,
    }));
    return { chartData, vol, beta, sharpe, maxDD, rsi: rsi[rsi.length - 1] || 50, returns };
  }, [history]);

  const stats = useMemo(() => {
    if (!analysis?.returns || analysis.returns.length < 10) return null;
    const returns = analysis.returns;
    const n = returns.length;
    const xIndices = Array.from({ length: n }, (_, i) => i);
    const regression = linearRegression(xIndices, returns);
    const dist = normalDistribution(returns);
    const acf = autoCorrelation(returns);
    const var95 = calculateVaR(returns, 0.95);
    const cvar95 = calculateCVaR(returns, 0.95);
    const var99 = calculateVaR(returns, 0.99);
    const scatterData = xIndices.map((x, i) => ({
      x, return: returns[i] * 100, predicted: regression.predictions[i] * 100,
    }));
    return { regression, dist, acf, var95, cvar95, var99, meanReturn: dist.mean, stdReturn: dist.std, skewness: dist.skewness, kurtosis: dist.kurtosis, scatterData };
  }, [analysis]);

  const handleExportExcel = useCallback(() => {
    if (!quote) return toast.error('Chưa có dữ liệu');
    exportStockExcel(selected, quote, analysis, history, stats, financials);
  }, [selected, quote, analysis, history, stats, financials]);

  const handleExportPDF = useCallback(() => {
    if (!quote) return toast.error('Chưa có dữ liệu');
    exportStockPDF(selected, quote, analysis, stats, financials);
  }, [selected, quote, analysis, stats, financials]);

  const filteredStocks = useMemo(() => {
    const term = searchTerm.toLowerCase();
    const result: typeof STOCK_CATEGORIES = {} as any;
    for (const [cat, stocks] of Object.entries(STOCK_CATEGORIES)) {
      if (selectedCategory !== 'all' && cat !== selectedCategory) continue;
      const filtered = term
        ? stocks.filter(s => s.symbol.toLowerCase().includes(term) || s.name.toLowerCase().includes(term))
        : stocks;
      if (filtered.length > 0) (result as any)[cat] = filtered;
    }
    return result;
  }, [searchTerm, selectedCategory]);

  const totalFilteredCount = useMemo(() =>
    Object.values(filteredStocks).reduce((sum, arr) => sum + arr.length, 0),
    [filteredStocks]
  );

  const bctcLinks = useMemo(() => getBCTCLinks(selected), [selected]);
  const isLoading = quoteLoading || historyLoading;

  if (quoteError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <p className="text-destructive">Không thể tải dữ liệu: {(quoteError as Error).message}</p>
        <Button variant="outline" onClick={() => refetchQuote()}>
          <RefreshCw className="w-4 h-4 mr-2" /> Thử lại
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-56">
              <Select value={selected} onValueChange={(v) => { setSelected(v); setCustomSymbol(''); }}>
                <SelectTrigger className="bg-card border-border/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  <div className="p-2 sticky top-0 bg-popover z-10">
                    <Input placeholder="Tìm mã CK (VN, US, EU, Asia)..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="h-8 text-xs" />
                  </div>
                  {Object.entries(filteredStocks).map(([category, stocks]) => (
                    <div key={category}>
                      <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{category}</div>
                      {stocks.map(s => (
                        <SelectItem key={s.symbol} value={s.symbol}>
                          <span className="font-mono font-medium">{s.symbol}</span>
                          <span className="text-muted-foreground ml-2 text-xs">{s.name}</span>
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <span className="text-xs text-muted-foreground">hoặc</span>
            <form onSubmit={(e) => { e.preventDefault(); const sym = customSymbol.trim().toUpperCase(); if (sym) setSelected(sym); }} className="flex items-center gap-1">
              <Input
                placeholder="Nhập mã bất kỳ (VD: TSLA, 005930.KS)"
                value={customSymbol}
                onChange={(e) => setCustomSymbol(e.target.value)}
                className="h-9 w-52 text-xs font-mono bg-card border-border/30"
              />
              <Button type="submit" size="sm" variant="secondary" disabled={!customSymbol.trim()}>
                <Search className="w-3.5 h-3.5" />
              </Button>
            </form>
          </div>
          <div>
            {quote ? (
              <>
                <h1 className="text-xl font-semibold">{quote.name}</h1>
                <p className="text-xs text-muted-foreground">{quote.sector} · {quote.industry} · {quote.country} · {quote.marketCap}</p>
              </>
            ) : (
              <div className="space-y-1">
                <div className="h-5 w-32 bg-muted animate-pulse rounded" />
                <div className="h-3 w-20 bg-muted animate-pulse rounded" />
              </div>
            )}
          </div>
          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-baseline gap-3">
            {quote ? (
              <>
                <span className="text-3xl font-mono font-semibold">{formatCurrency(quote.currentPrice, selected)}</span>
                <span className={`text-sm font-mono ${quote.priceChange1d >= 0 ? 'ticker-green' : 'ticker-red'}`}>
                  {quote.priceChange1d >= 0 ? '+' : ''}{quote.priceChange1d.toFixed(2)}%
                </span>
              </>
            ) : <div className="h-8 w-28 bg-muted animate-pulse rounded" />}
          </div>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={() => {
              if (isInWatchlist(selected)) removeFromWatchlist(selected);
              else addToWatchlist(selected, 'stock', quote?.name);
            }} className={isInWatchlist(selected) ? 'text-yellow-500 border-yellow-500/30' : ''}>
              <Star className={`w-3.5 h-3.5 ${isInWatchlist(selected) ? 'fill-yellow-500' : ''}`} />
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={!quote}>
              <Download className="w-3.5 h-3.5 mr-1" /> Excel
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={!quote}>
              <FileText className="w-3.5 h-3.5 mr-1" /> PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      {quote && (
        <div className="grid grid-cols-2 md:grid-cols-8 gap-2">
          {[
            { label: '1D', value: quote.priceChange1d, fmt: (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%` },
            { label: '1W', value: quote.priceChange1w, fmt: (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%` },
            { label: '1M', value: quote.priceChange1m, fmt: (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%` },
            { label: 'RSI', value: analysis?.rsi ?? 0, fmt: (v: number) => (v ?? 0).toFixed(1), neutral: true },
            { label: 'Beta', value: analysis?.beta ?? 0, fmt: (v: number) => (v ?? 0).toFixed(2), neutral: true },
            { label: 'Vol', value: (analysis?.vol ?? 0) * 100, fmt: (v: number) => `${(v ?? 0).toFixed(1)}%`, neutral: true },
            { label: 'Margin', value: quote.profitMargin ?? 0, fmt: (v: number) => `${(v ?? 0).toFixed(1)}%`, neutral: true },
            { label: 'FCF', value: quote.freeCashflow ?? 0, fmt: (v: number) => formatLargeNumber(v ?? 0) },
          ].map((stat) => (
            <div key={stat.label} className="quant-card text-center py-3">
              <p className="stat-label">{stat.label}</p>
              <p className={`stat-value mt-1 ${!stat.neutral ? (stat.value >= 0 ? 'ticker-green' : 'ticker-red') : ''}`}>
                {stat.fmt(stat.value)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Range selector */}
      <div className="flex gap-1">
        {['5d', '1mo', '3mo', '6mo', '1y', '2y'].map(r => (
          <button key={r} onClick={() => setHistoryRange(r)}
            className={`px-3 py-1 text-xs rounded font-mono transition-all ${historyRange === r ? 'bg-primary text-primary-foreground' : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'}`}>
            {r.toUpperCase()}
          </button>
        ))}
        <span className="ml-auto text-[10px] text-muted-foreground flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Cập nhật mỗi 30s
        </span>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="price" className="w-full">
        <TabsList className="bg-muted/30 border border-border/30 flex-wrap h-auto">
          <TabsTrigger value="price" className="text-xs">Price & Overlays</TabsTrigger>
          <TabsTrigger value="technicals" className="text-xs">Indicators</TabsTrigger>
          <TabsTrigger value="fundamentals" className="text-xs">Fundamentals</TabsTrigger>
          <TabsTrigger value="financials" className="text-xs">📋 BCTC</TabsTrigger>
          <TabsTrigger value="statistics" className="text-xs">📊 Statistics</TabsTrigger>
          <TabsTrigger value="risk" className="text-xs">⚠️ Risk</TabsTrigger>
          <TabsTrigger value="company" className="text-xs">🏢 Company</TabsTrigger>
          <TabsTrigger value="compare" className="text-xs">📈 So sánh</TabsTrigger>
        </TabsList>

        {/* Price Tab */}
        <TabsContent value="price">
          <div className="quant-card space-y-4">
            <p className="stat-label">Price Chart with Bollinger Bands & EMAs</p>
            {analysis ? (
              <>
                <ResponsiveContainer width="100%" height={350}>
                  <ComposedChart data={analysis.chartData}>
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={Math.floor(analysis.chartData.length / 8)} />
                    <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(222, 40%, 7%)', border: '1px solid hsl(222, 20%, 14%)', borderRadius: 6, fontSize: 11 }} />
                    <Area type="monotone" dataKey="bbUpper" stroke="none" fill="hsl(185, 80%, 50%)" fillOpacity={0.05} />
                    <Area type="monotone" dataKey="bbLower" stroke="none" fill="hsl(185, 80%, 50%)" fillOpacity={0.05} />
                    <Line type="monotone" dataKey="bbUpper" stroke="hsl(185, 80%, 50%)" strokeWidth={0.5} dot={false} strokeDasharray="3 3" />
                    <Line type="monotone" dataKey="bbLower" stroke="hsl(185, 80%, 50%)" strokeWidth={0.5} dot={false} strokeDasharray="3 3" />
                    <Line type="monotone" dataKey="ema12" stroke="hsl(38, 92%, 55%)" strokeWidth={1} dot={false} />
                    <Line type="monotone" dataKey="ema50" stroke="hsl(270, 70%, 60%)" strokeWidth={1} dot={false} />
                    <Line type="monotone" dataKey="close" stroke="hsl(185, 80%, 50%)" strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
                <ResponsiveContainer width="100%" height={80}>
                  <BarChart data={analysis.chartData}>
                    <XAxis dataKey="date" hide />
                    <Bar dataKey="volume" fill="hsl(185, 80%, 50%)" fillOpacity={0.2} />
                  </BarChart>
                </ResponsiveContainer>
              </>
            ) : (
              <div className="flex items-center justify-center h-[350px]"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
            )}
          </div>
        </TabsContent>

        {/* Technicals Tab */}
        <TabsContent value="technicals">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="quant-card">
              <p className="stat-label mb-2">RSI (14)</p>
              {analysis ? (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={analysis.chartData}>
                      <XAxis dataKey="date" hide />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <ReferenceLine y={70} stroke="hsl(0, 72%, 55%)" strokeDasharray="3 3" />
                      <ReferenceLine y={30} stroke="hsl(142, 76%, 45%)" strokeDasharray="3 3" />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(222, 40%, 7%)', border: '1px solid hsl(222, 20%, 14%)', borderRadius: 6, fontSize: 11 }} />
                      <Line type="monotone" dataKey="rsi" stroke="hsl(270, 70%, 60%)" strokeWidth={1.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    <span>Oversold (&lt;30)</span>
                    <span className="font-mono">Current: {analysis.rsi.toFixed(1)}</span>
                    <span>Overbought (&gt;70)</span>
                  </div>
                </>
              ) : <div className="flex items-center justify-center h-[180px]"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>}
            </div>
            <div className="quant-card">
              <p className="stat-label mb-2">MACD (12, 26, 9)</p>
              {analysis ? (
                <ResponsiveContainer width="100%" height={180}>
                  <ComposedChart data={analysis.chartData}>
                    <XAxis dataKey="date" hide />
                    <YAxis tick={{ fontSize: 10 }} />
                    <ReferenceLine y={0} stroke="hsl(222, 20%, 14%)" />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(222, 40%, 7%)', border: '1px solid hsl(222, 20%, 14%)', borderRadius: 6, fontSize: 11 }} />
                    <Bar dataKey="histogram" fill="hsl(185, 80%, 50%)" fillOpacity={0.4} />
                    <Line type="monotone" dataKey="macd" stroke="hsl(185, 80%, 50%)" strokeWidth={1.5} dot={false} />
                    <Line type="monotone" dataKey="signal" stroke="hsl(0, 72%, 55%)" strokeWidth={1} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : <div className="flex items-center justify-center h-[180px]"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>}
            </div>
            {analysis && (
              <div className="quant-card lg:col-span-2">
                <p className="stat-label mb-3">Risk & Performance Metrics</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Sharpe Ratio', value: analysis.sharpe.toFixed(2) },
                    { label: 'Max Drawdown', value: `${(analysis.maxDD * 100).toFixed(1)}%` },
                    { label: 'Annualized Vol', value: `${(analysis.vol * 100).toFixed(1)}%` },
                    { label: 'Beta', value: analysis.beta.toFixed(2) },
                  ].map((m) => (
                    <div key={m.label} className="text-center p-3 rounded-md bg-muted/30">
                      <p className="stat-label">{m.label}</p>
                      <p className="stat-value mt-1">{m.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Fundamentals Tab */}
        <TabsContent value="fundamentals">
          <div className="quant-card">
            {quote ? (
              <>
                <p className="stat-label mb-4">Financial Ratios — {selected} ({quote.name})</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                  <RatioBar label="P/E Ratio" value={quote.pe} max={80} />
                  <RatioBar label="Forward P/E" value={quote.forwardPe} max={80} />
                  <RatioBar label="P/B Ratio" value={quote.pb} max={60} />
                  <RatioBar label="P/S Ratio" value={quote.ps} max={40} />
                  <RatioBar label="ROE" value={quote.roe} max={200} unit="%" />
                  <RatioBar label="ROA" value={quote.roa} max={100} unit="%" />
                  <RatioBar label="D/E Ratio" value={quote.deRatio} max={3} />
                  <RatioBar label="Current Ratio" value={quote.currentRatio} max={5} />
                  <RatioBar label="Gross Margin" value={quote.grossMargin} max={100} unit="%" />
                  <RatioBar label="Profit Margin" value={quote.profitMargin} max={50} unit="%" />
                  <RatioBar label="Div. Yield" value={quote.divYield} max={5} unit="%" />
                  <RatioBar label="EPS (TTM)" value={quote.eps} max={15} unit={isVNStock(selected) ? '₫' : '$'} />
                </div>
                <div className="mt-6 p-4 rounded-md bg-muted/20 border border-border/20">
                  <p className="text-xs font-medium mb-2">Growth & Cashflow</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-muted-foreground">Revenue Growth</span>
                      <p className={`font-mono mt-0.5 ${quote.revenueGrowth >= 0 ? 'ticker-green' : 'ticker-red'}`}>
                        {quote.revenueGrowth >= 0 ? '+' : ''}{quote.revenueGrowth.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Earnings Growth</span>
                      <p className={`font-mono mt-0.5 ${quote.earningsGrowth >= 0 ? 'ticker-green' : 'ticker-red'}`}>
                        {quote.earningsGrowth >= 0 ? '+' : ''}{quote.earningsGrowth.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Free Cashflow</span>
                      <p className={`font-mono mt-0.5 ${quote.freeCashflow >= 0 ? 'ticker-green' : 'ticker-red'}`}>{formatLargeNumber(quote.freeCashflow)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Operating CF</span>
                      <p className={`font-mono mt-0.5 ${quote.operatingCashflow >= 0 ? 'ticker-green' : 'ticker-red'}`}>{formatLargeNumber(quote.operatingCashflow)}</p>
                    </div>
                  </div>
                </div>
              </>
            ) : <div className="flex items-center justify-center h-40"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>}
          </div>
        </TabsContent>

        {/* BCTC (Financial Statements) Tab */}
        <TabsContent value="financials">
          <div className="space-y-4">
            {/* Links to external BCTC sources */}
            <div className="quant-card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-primary" />
                  <p className="text-sm font-medium">Báo cáo tài chính — {selected}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setFinPeriod('annual')}
                    className={`px-3 py-1 text-xs rounded font-mono transition-all ${finPeriod === 'annual' ? 'bg-primary text-primary-foreground' : 'bg-muted/30 text-muted-foreground'}`}>
                    Năm
                  </button>
                  <button onClick={() => setFinPeriod('quarterly')}
                    className={`px-3 py-1 text-xs rounded font-mono transition-all ${finPeriod === 'quarterly' ? 'bg-primary text-primary-foreground' : 'bg-muted/30 text-muted-foreground'}`}>
                    Quý
                  </button>
                </div>
              </div>

              {/* External BCTC download links */}
              <div className="flex gap-2 mb-4 flex-wrap">
                {bctcLinks.map(link => (
                  <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-muted/30 border border-border/30 hover:bg-muted/50 transition-colors">
                    <span>{link.icon}</span>
                    <span>{link.label}</span>
                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                  </a>
                ))}
              </div>

              {financialsLoading ? (
                <div className="flex items-center justify-center h-40"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
              ) : financials ? (
                <div className="space-y-6">
                  {/* Earnings Chart */}
                  {financials.earnings?.yearly?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium mb-2">Doanh thu & Lợi nhuận theo năm</p>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={financials.earnings.yearly}>
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 9 }} tickFormatter={(v) => formatLargeNumber(v)} />
                          <Tooltip contentStyle={{ backgroundColor: 'hsl(222, 40%, 7%)', border: '1px solid hsl(222, 20%, 14%)', borderRadius: 6, fontSize: 11 }} formatter={(v: any) => [formatLargeNumber(v), '']} />
                          <Bar dataKey="revenue" fill="hsl(185, 80%, 50%)" fillOpacity={0.7} name="Doanh thu" />
                          <Bar dataKey="earnings" fill="hsl(142, 76%, 45%)" fillOpacity={0.7} name="Lợi nhuận" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Income Statement */}
                  <FinancialTable
                    data={finPeriod === 'annual' ? financials.incomeAnnual : financials.incomeQuarterly}
                    fields={INCOME_FIELDS}
                    title="📊 Báo cáo kết quả kinh doanh"
                  />

                  {/* Balance Sheet */}
                  <FinancialTable
                    data={finPeriod === 'annual' ? financials.balanceAnnual : financials.balanceQuarterly}
                    fields={BALANCE_FIELDS}
                    title="📋 Bảng cân đối kế toán"
                  />

                  {/* Cash Flow */}
                  <FinancialTable
                    data={finPeriod === 'annual' ? financials.cashflowAnnual : financials.cashflowQuarterly}
                    fields={CASHFLOW_FIELDS}
                    title="💰 Báo cáo lưu chuyển tiền tệ"
                  />
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-8">Không có dữ liệu BCTC. Sử dụng các link bên trên để tải BCTC gốc.</p>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="statistics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="quant-card">
              <p className="stat-label mb-2">Phân phối lợi suất (Histogram)</p>
              {stats ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={stats.dist.histogram}>
                      <XAxis dataKey="bin" tick={{ fontSize: 8 }} interval={4} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(222, 40%, 7%)', border: '1px solid hsl(222, 20%, 14%)', borderRadius: 6, fontSize: 11 }} formatter={(v: any) => [v, 'Tần suất']} labelFormatter={(l) => `Return: ${l}%`} />
                      <Bar dataKey="count" fill="hsl(185, 80%, 50%)" fillOpacity={0.6} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                    {[
                      { label: 'Skewness', value: stats.skewness.toFixed(4) },
                      { label: 'Kurtosis', value: stats.kurtosis.toFixed(4) },
                      { label: 'Mean Return', value: `${(stats.meanReturn * 100).toFixed(4)}%` },
                      { label: 'Std Deviation', value: `${(stats.stdReturn * 100).toFixed(4)}%` },
                    ].map(s => (
                      <div key={s.label} className="p-2 rounded bg-muted/30">
                        <span className="text-muted-foreground">{s.label}</span>
                        <p className="font-mono font-medium">{s.value}</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : <div className="flex items-center justify-center h-[200px]"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>}
            </div>
            <div className="quant-card">
              <p className="stat-label mb-2">Tự tương quan (ACF)</p>
              {stats ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={stats.acf}>
                      <XAxis dataKey="lag" tick={{ fontSize: 10 }} />
                      <YAxis domain={[-0.3, 1]} tick={{ fontSize: 10 }} />
                      <ReferenceLine y={0} stroke="hsl(222, 20%, 30%)" />
                      <ReferenceLine y={1.96 / Math.sqrt(analysis?.returns?.length || 100)} stroke="hsl(0, 72%, 55%)" strokeDasharray="3 3" />
                      <ReferenceLine y={-1.96 / Math.sqrt(analysis?.returns?.length || 100)} stroke="hsl(0, 72%, 55%)" strokeDasharray="3 3" />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(222, 40%, 7%)', border: '1px solid hsl(222, 20%, 14%)', borderRadius: 6, fontSize: 11 }} />
                      <Bar dataKey="acf" fill="hsl(270, 70%, 60%)" fillOpacity={0.7} />
                    </BarChart>
                  </ResponsiveContainer>
                  <p className="text-[10px] text-muted-foreground mt-1">Đường đỏ: Ngưỡng 95% confidence. ACF gần 0 = random walk.</p>
                </>
              ) : <div className="flex items-center justify-center h-[200px]"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>}
            </div>
            <div className="quant-card lg:col-span-2">
              <p className="stat-label mb-2">Hồi quy tuyến tính (Linear Regression)</p>
              {stats ? (
                <>
                  <ResponsiveContainer width="100%" height={220}>
                    <ComposedChart data={stats.scatterData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 20%, 14%)" />
                      <XAxis dataKey="x" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(222, 40%, 7%)', border: '1px solid hsl(222, 20%, 14%)', borderRadius: 6, fontSize: 11 }} />
                      <Scatter dataKey="return" fill="hsl(185, 80%, 50%)" fillOpacity={0.3} r={1.5} />
                      <Line type="monotone" dataKey="predicted" stroke="hsl(38, 92%, 55%)" strokeWidth={2} dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-4 gap-2 mt-3 text-xs">
                    {[
                      { label: 'R²', value: stats.regression.r2.toFixed(6) },
                      { label: 'R', value: stats.regression.r.toFixed(6) },
                      { label: 'Slope', value: stats.regression.slope.toExponential(3) },
                      { label: 'Intercept', value: stats.regression.intercept.toExponential(3) },
                    ].map(s => (
                      <div key={s.label} className="p-2 rounded bg-muted/30">
                        <span className="text-muted-foreground">{s.label}</span>
                        <p className="font-mono font-medium">{s.value}</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : <div className="flex items-center justify-center h-[220px]"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>}
            </div>
          </div>
        </TabsContent>

        {/* Risk Tab */}
        <TabsContent value="risk">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="quant-card">
              <p className="stat-label mb-3">Value at Risk (VaR) & CVaR</p>
              {stats ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'VaR 95%', value: stats.var95 },
                      { label: 'CVaR 95%', value: stats.cvar95 },
                      { label: 'VaR 99%', value: stats.var99 },
                    ].map(v => (
                      <div key={v.label} className="text-center p-3 rounded-md bg-destructive/10 border border-destructive/20">
                        <p className="stat-label">{v.label}</p>
                        <p className="stat-value mt-1 text-destructive">{(v.value * 100).toFixed(3)}%</p>
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>• VaR 95%: Lỗ tối đa 1 ngày không vượt <span className="font-mono text-destructive">{(stats.var95 * 100).toFixed(3)}%</span></p>
                    <p>• CVaR 95%: Mức lỗ trung bình khi vượt VaR: <span className="font-mono text-destructive">{(stats.cvar95 * 100).toFixed(3)}%</span></p>
                    {quote && <p>• Đầu tư 100 triệu → VaR 95% = lỗ tối đa <span className="font-mono text-destructive">{(stats.var95 * 100).toFixed(1)} triệu</span>/ngày</p>}
                  </div>
                </div>
              ) : <div className="flex items-center justify-center h-40"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>}
            </div>
            <div className="quant-card">
              <p className="stat-label mb-3">Drawdown Analysis</p>
              {analysis ? (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={analysis.chartData.map((d, i, arr) => {
                      const closes = arr.map(x => x.close).slice(0, i + 1);
                      const peak = Math.max(...closes.filter(c => c > 0));
                      return { date: d.date, drawdown: peak > 0 ? ((d.close - peak) / peak) * 100 : 0 };
                    })}>
                      <XAxis dataKey="date" hide />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(222, 40%, 7%)', border: '1px solid hsl(222, 20%, 14%)', borderRadius: 6, fontSize: 11 }} formatter={(v: any) => [`${Number(v).toFixed(2)}%`, 'Drawdown']} />
                      <Area type="monotone" dataKey="drawdown" stroke="hsl(0, 72%, 55%)" fill="hsl(0, 72%, 55%)" fillOpacity={0.2} />
                    </AreaChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                    <div className="p-2 rounded bg-muted/30">
                      <span className="text-muted-foreground">Max Drawdown</span>
                      <p className="font-mono font-medium text-destructive">{(analysis.maxDD * 100).toFixed(2)}%</p>
                    </div>
                    <div className="p-2 rounded bg-muted/30">
                      <span className="text-muted-foreground">Sharpe Ratio</span>
                      <p className="font-mono font-medium">{analysis.sharpe.toFixed(3)}</p>
                    </div>
                  </div>
                </>
              ) : <div className="flex items-center justify-center h-[180px]"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>}
            </div>
            {analysis && stats && quote && (
              <div className="quant-card lg:col-span-2">
                <p className="stat-label mb-3">📋 Tổng hợp đánh giá rủi ro</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className={`p-3 rounded-md border ${analysis.vol < 0.25 ? 'border-green-500/30 bg-green-500/5' : analysis.vol < 0.4 ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
                    <p className="font-medium">Biến động</p>
                    <p className="font-mono mt-1">{(analysis.vol * 100).toFixed(1)}%/năm</p>
                    <p className="text-muted-foreground mt-1">{analysis.vol < 0.25 ? 'Thấp, phù hợp phòng thủ' : analysis.vol < 0.4 ? 'Trung bình' : 'Cao, rủi ro lớn'}</p>
                  </div>
                  <div className={`p-3 rounded-md border ${analysis.maxDD < 0.15 ? 'border-green-500/30 bg-green-500/5' : analysis.maxDD < 0.3 ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
                    <p className="font-medium">Sụt giảm tối đa</p>
                    <p className="font-mono mt-1">{(analysis.maxDD * 100).toFixed(1)}%</p>
                    <p className="text-muted-foreground mt-1">{analysis.maxDD < 0.15 ? 'Rủi ro thấp' : analysis.maxDD < 0.3 ? 'Sụt giảm đáng kể' : 'Rủi ro rất lớn'}</p>
                  </div>
                  <div className={`p-3 rounded-md border ${analysis.sharpe > 1 ? 'border-green-500/30 bg-green-500/5' : analysis.sharpe > 0 ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
                    <p className="font-medium">Hiệu suất điều chỉnh rủi ro</p>
                    <p className="font-mono mt-1">Sharpe: {analysis.sharpe.toFixed(3)}</p>
                    <p className="text-muted-foreground mt-1">{analysis.sharpe > 1 ? 'Lợi nhuận tốt vs rủi ro' : analysis.sharpe > 0 ? 'Chưa bù đắp rủi ro' : 'Lợi nhuận âm'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Company Info Tab */}
        <TabsContent value="company">
          <div className="quant-card">
            {quote ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-primary" />
                  <div>
                    <h3 className="font-semibold">{quote.name}</h3>
                    <p className="text-xs text-muted-foreground">{quote.symbol} · {quote.sector} · {quote.industry}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-md bg-muted/20">
                    <span className="text-muted-foreground">Quốc gia</span>
                    <p className="font-medium mt-0.5">{quote.country}</p>
                  </div>
                  <div className="p-3 rounded-md bg-muted/20">
                    <span className="text-muted-foreground">Nhân viên</span>
                    <p className="font-medium mt-0.5">{quote.employees ? quote.employees.toLocaleString() : 'N/A'}</p>
                  </div>
                  <div className="p-3 rounded-md bg-muted/20">
                    <span className="text-muted-foreground">Vốn hóa</span>
                    <p className="font-medium mt-0.5">{quote.marketCap}</p>
                  </div>
                  <div className="p-3 rounded-md bg-muted/20">
                    <span className="text-muted-foreground">Website</span>
                    {quote.website ? (
                      <a href={quote.website} target="_blank" rel="noopener noreferrer" className="font-medium mt-0.5 text-primary hover:underline flex items-center gap-1">
                        Truy cập <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : <p className="font-medium mt-0.5">N/A</p>}
                  </div>
                </div>

                {quote.description && (
                  <div className="p-4 rounded-md bg-muted/10 border border-border/20">
                    <p className="text-xs font-medium mb-2">Giới thiệu doanh nghiệp</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{quote.description}</p>
                  </div>
                )}

                <div className="p-4 rounded-md bg-muted/10 border border-border/20">
                  <p className="text-xs font-medium mb-3">Tổng quan tài chính</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    {[
                      { label: 'Tổng doanh thu', value: formatLargeNumber(quote.totalRevenue) },
                      { label: 'Tổng nợ', value: formatLargeNumber(quote.totalDebt) },
                      { label: 'Tiền mặt', value: formatLargeNumber(quote.totalCash) },
                      { label: 'FCF', value: formatLargeNumber(quote.freeCashflow) },
                      { label: 'Operating CF', value: formatLargeNumber(quote.operatingCashflow) },
                      { label: 'Book Value', value: quote.bookValue?.toFixed(2) || 'N/A' },
                    ].map(item => (
                      <div key={item.label}>
                        <span className="text-muted-foreground">{item.label}</span>
                        <p className="font-mono font-medium mt-0.5">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : <div className="flex items-center justify-center h-40"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>}
          </div>
        </TabsContent>

        {/* Compare Tab */}
        <TabsContent value="compare">
          <StockComparison currentSymbol={selected} />
        </TabsContent>
      </Tabs>

      {/* Watchlist */}
      <WatchlistPanel
        currentPrices={quote ? { [selected]: quote.currentPrice } : {}}
        onSelectSymbol={(sym) => setSelected(sym)}
      />
    </div>
  );
}
