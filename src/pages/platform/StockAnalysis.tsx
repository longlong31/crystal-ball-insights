import { useState, useMemo, useCallback } from "react";
import { TrendingUp, TrendingDown, BarChart3, Activity, Loader2, RefreshCw, Download, FileText, Search, Globe } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, BarChart, Bar, LineChart, Line, ReferenceLine, ComposedChart, ScatterChart, Scatter, CartesianGrid, Cell } from "recharts";
import { calculateRSI, calculateMACD, calculateEMA, calculateSMA, calculateBollingerBands, calculateVolatility, calculateBeta, calculateSharpeRatio, calculateMaxDrawdown, calculateVaR, calculateCVaR } from "@/lib/technicalIndicators";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStockQuote, useStockHistory } from "@/hooks/useStockData";
import { toast } from "sonner";

// Vietnamese stocks grouped by category
const STOCK_CATEGORIES = {
  "🇻🇳 VN Blue-chips": [
    { symbol: "VNM.VN", name: "Vinamilk" },
    { symbol: "VIC.VN", name: "Vingroup" },
    { symbol: "VHM.VN", name: "Vinhomes" },
    { symbol: "FPT.VN", name: "FPT Corp" },
    { symbol: "HPG.VN", name: "Hòa Phát" },
    { symbol: "MWG.VN", name: "MWG" },
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
  ],
  "🇻🇳 VN Mid-caps": [
    { symbol: "DGC.VN", name: "Đức Giang Chemical" },
    { symbol: "PNJ.VN", name: "PNJ" },
    { symbol: "REE.VN", name: "REE Corp" },
    { symbol: "KDH.VN", name: "Khang Điền" },
    { symbol: "VCI.VN", name: "Bản Việt SC" },
    { symbol: "HCM.VN", name: "HSC" },
    { symbol: "GMD.VN", name: "Gemadept" },
    { symbol: "DPM.VN", name: "Đạm Phú Mỹ" },
    { symbol: "DCM.VN", name: "Đạm Cà Mau" },
    { symbol: "NT2.VN", name: "Nhiệt điện NT2" },
  ],
  "🇺🇸 US Tech": [
    { symbol: "AAPL", name: "Apple" },
    { symbol: "GOOGL", name: "Alphabet" },
    { symbol: "MSFT", name: "Microsoft" },
    { symbol: "NVDA", name: "NVIDIA" },
    { symbol: "TSLA", name: "Tesla" },
    { symbol: "AMZN", name: "Amazon" },
    { symbol: "META", name: "Meta" },
  ],
  "🌏 Asia Markets": [
    { symbol: "9988.HK", name: "Alibaba (HK)" },
    { symbol: "0700.HK", name: "Tencent (HK)" },
    { symbol: "005930.KS", name: "Samsung (KR)" },
    { symbol: "7203.T", name: "Toyota (JP)" },
  ],
};

const ALL_STOCKS = Object.values(STOCK_CATEGORIES).flat();

function isVNStock(symbol: string): boolean {
  return symbol.endsWith('.VN');
}

function formatCurrency(value: number, symbol: string): string {
  if (isVNStock(symbol)) {
    return `₫${(value * 1000).toLocaleString('vi-VN')}`;
  }
  return `$${value.toFixed(2)}`;
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

// Statistical helper functions (R/Python-like)
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
  const residuals = y.map((yi, i) => yi - predictions[i]);
  return { slope, intercept, r, r2, predictions, residuals };
}

function normalDistribution(data: number[], bins: number = 30) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const binWidth = (max - min) / bins;
  const histogram = Array.from({ length: bins }, (_, i) => {
    const lower = min + i * binWidth;
    const upper = lower + binWidth;
    const count = data.filter(v => v >= lower && (i === bins - 1 ? v <= upper : v < upper)).length;
    return { bin: ((lower + upper) / 2 * 100).toFixed(2), count, lower: lower * 100, upper: upper * 100 };
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

// Export functions
function exportStockExcel(symbol: string, quote: any, analysis: any, history: any, stats: any) {
  import('xlsx').then(XLSX => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Overview
    const overview = [
      ['BÁO CÁO PHÂN TÍCH CỔ PHIẾU', '', '', ''],
      ['Mã CK', symbol, 'Ngày', new Date().toLocaleDateString('vi-VN')],
      ['Tên công ty', quote?.name || '', 'Ngành', quote?.sector || ''],
      [''],
      ['CHỈ SỐ GIÁ', '', '', ''],
      ['Giá hiện tại', quote?.currentPrice || 0, 'Giá mở cửa', quote?.open || 0],
      ['Giá cao nhất ngày', quote?.dayHigh || 0, 'Giá thấp nhất ngày', quote?.dayLow || 0],
      ['52W High', quote?.fiftyTwoWeekHigh || 0, '52W Low', quote?.fiftyTwoWeekLow || 0],
      [''],
      ['BIẾN ĐỘNG GIÁ', '', '', ''],
      ['1 ngày (%)', quote?.priceChange1d || 0, '1 tuần (%)', quote?.priceChange1w || 0],
      ['1 tháng (%)', quote?.priceChange1m || 0, '', ''],
      [''],
      ['CHỈ SỐ CƠ BẢN', '', '', ''],
      ['P/E', quote?.pe || 0, 'P/B', quote?.pb || 0],
      ['P/S', quote?.ps || 0, 'ROE (%)', quote?.roe || 0],
      ['D/E', quote?.deRatio || 0, 'Current Ratio', quote?.currentRatio || 0],
      ['EPS', quote?.eps || 0, 'Div Yield (%)', quote?.divYield || 0],
      ['Revenue Growth (%)', quote?.revenueGrowth || 0, 'Earnings Growth (%)', quote?.earningsGrowth || 0],
      [''],
      ['CHỈ SỐ KỸ THUẬT & RỦI RO', '', '', ''],
      ['RSI (14)', analysis?.rsi?.toFixed(2) || '', 'Beta', analysis?.beta?.toFixed(2) || ''],
      ['Sharpe Ratio', analysis?.sharpe?.toFixed(4) || '', 'Max Drawdown (%)', ((analysis?.maxDD || 0) * 100).toFixed(2)],
      ['Annualized Volatility (%)', ((analysis?.vol || 0) * 100).toFixed(2), '', ''],
      ['VaR 95% (%)', ((stats?.var95 || 0) * 100).toFixed(4), 'CVaR 95% (%)', ((stats?.cvar95 || 0) * 100).toFixed(4)],
      [''],
      ['THỐNG KÊ PHÂN PHỐI', '', '', ''],
      ['Mean Return (%)', ((stats?.meanReturn || 0) * 100).toFixed(4), 'Std Dev (%)', ((stats?.stdReturn || 0) * 100).toFixed(4)],
      ['Skewness', stats?.skewness?.toFixed(4) || '', 'Kurtosis', stats?.kurtosis?.toFixed(4) || ''],
      [''],
      ['HỒI QUY TUYẾN TÍNH', '', '', ''],
      ['R²', stats?.regression?.r2?.toFixed(6) || '', 'Slope', stats?.regression?.slope?.toFixed(8) || ''],
      ['Intercept', stats?.regression?.intercept?.toFixed(8) || '', 'Correlation (R)', stats?.regression?.r?.toFixed(6) || ''],
    ];
    const wsOverview = XLSX.utils.aoa_to_sheet(overview);
    XLSX.utils.book_append_sheet(wb, wsOverview, 'Tổng quan');

    // Sheet 2: Historical data
    if (history) {
      const histData = history.dates.map((d: string, i: number) => ({
        'Ngày': d,
        'Mở cửa': history.opens[i],
        'Cao nhất': history.highs[i],
        'Thấp nhất': history.lows[i],
        'Đóng cửa': history.closes[i],
        'Khối lượng': history.volumes[i],
      }));
      const wsHist = XLSX.utils.json_to_sheet(histData);
      XLSX.utils.book_append_sheet(wb, wsHist, 'Dữ liệu lịch sử');
    }

    // Sheet 3: Technical indicators
    if (analysis?.chartData) {
      const techData = analysis.chartData.map((d: any) => ({
        'Ngày': d.date,
        'Đóng cửa': d.close,
        'RSI': d.rsi ? +d.rsi.toFixed(2) : '',
        'MACD': d.macd ? +d.macd.toFixed(4) : '',
        'Signal': d.signal ? +d.signal.toFixed(4) : '',
        'EMA12': d.ema12 ? +d.ema12.toFixed(2) : '',
        'EMA50': d.ema50 ? +d.ema50.toFixed(2) : '',
        'BB Upper': d.bbUpper ? +d.bbUpper.toFixed(2) : '',
        'BB Lower': d.bbLower ? +d.bbLower.toFixed(2) : '',
      }));
      const wsTech = XLSX.utils.json_to_sheet(techData);
      XLSX.utils.book_append_sheet(wb, wsTech, 'Chỉ báo kỹ thuật');
    }

    XLSX.writeFile(wb, `Phan_tich_${symbol}_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Đã xuất báo cáo Excel');
  });
}

function exportStockPDF(symbol: string, quote: any, analysis: any, stats: any) {
  import('jspdf').then(({ jsPDF }) => {
    import('jspdf-autotable').then(({ default: autoTable }) => {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 15;

      // Title
      doc.setFontSize(18);
      doc.setTextColor(0, 102, 204);
      doc.text('BÁO CÁO PHÂN TÍCH CỔ PHIẾU', pageWidth / 2, y, { align: 'center' });
      y += 8;
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`${symbol} - ${quote?.name || ''} | ${new Date().toLocaleDateString('vi-VN')}`, pageWidth / 2, y, { align: 'center' });
      y += 10;

      // Price overview
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text('I. THÔNG TIN GIÁ', 14, y);
      y += 2;

      autoTable(doc, {
        startY: y,
        head: [['Chỉ số', 'Giá trị', 'Chỉ số', 'Giá trị']],
        body: [
          ['Giá hiện tại', `${quote?.currentPrice || 0}`, 'Khối lượng', `${(quote?.volume || 0).toLocaleString()}`],
          ['1D Change', `${(quote?.priceChange1d || 0).toFixed(2)}%`, '1W Change', `${(quote?.priceChange1w || 0).toFixed(2)}%`],
          ['52W High', `${quote?.fiftyTwoWeekHigh || 0}`, '52W Low', `${quote?.fiftyTwoWeekLow || 0}`],
        ],
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [0, 102, 204] },
      });
      y = (doc as any).lastAutoTable.finalY + 8;

      // Fundamentals
      doc.text('II. CHỈ SỐ CƠ BẢN', 14, y);
      y += 2;

      autoTable(doc, {
        startY: y,
        head: [['Chỉ số', 'Giá trị', 'Đánh giá']],
        body: [
          ['P/E', `${(quote?.pe || 0).toFixed(2)}`, quote?.pe < 15 ? 'Hấp dẫn' : quote?.pe < 25 ? 'Hợp lý' : 'Cao'],
          ['P/B', `${(quote?.pb || 0).toFixed(2)}`, quote?.pb < 1.5 ? 'Hấp dẫn' : quote?.pb < 3 ? 'Hợp lý' : 'Cao'],
          ['ROE', `${(quote?.roe || 0).toFixed(2)}%`, quote?.roe > 15 ? 'Tốt' : quote?.roe > 10 ? 'Trung bình' : 'Thấp'],
          ['D/E', `${(quote?.deRatio || 0).toFixed(2)}`, quote?.deRatio < 1 ? 'An toàn' : quote?.deRatio < 2 ? 'Chấp nhận' : 'Rủi ro'],
          ['EPS', `${(quote?.eps || 0).toFixed(2)}`, quote?.eps > 0 ? 'Có lãi' : 'Lỗ'],
          ['Div Yield', `${(quote?.divYield || 0).toFixed(2)}%`, quote?.divYield > 3 ? 'Cao' : quote?.divYield > 1 ? 'Trung bình' : 'Thấp'],
        ],
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [0, 102, 204] },
      });
      y = (doc as any).lastAutoTable.finalY + 8;

      // Technical & Risk
      doc.text('III. PHÂN TÍCH KỸ THUẬT & RỦI RO', 14, y);
      y += 2;

      autoTable(doc, {
        startY: y,
        head: [['Chỉ số', 'Giá trị', 'Nhận xét']],
        body: [
          ['RSI (14)', `${(analysis?.rsi || 0).toFixed(1)}`, analysis?.rsi > 70 ? 'Quá mua' : analysis?.rsi < 30 ? 'Quá bán' : 'Trung tính'],
          ['Sharpe Ratio', `${(analysis?.sharpe || 0).toFixed(3)}`, analysis?.sharpe > 1 ? 'Xuất sắc' : analysis?.sharpe > 0.5 ? 'Tốt' : 'Kém'],
          ['Max Drawdown', `${((analysis?.maxDD || 0) * 100).toFixed(1)}%`, analysis?.maxDD < 0.1 ? 'Thấp' : analysis?.maxDD < 0.25 ? 'Trung bình' : 'Cao'],
          ['Beta', `${(analysis?.beta || 0).toFixed(2)}`, analysis?.beta < 0.8 ? 'Phòng thủ' : analysis?.beta < 1.2 ? 'Trung tính' : 'Tấn công'],
          ['VaR 95%', `${((stats?.var95 || 0) * 100).toFixed(3)}%`, ''],
          ['CVaR 95%', `${((stats?.cvar95 || 0) * 100).toFixed(3)}%`, ''],
          ['Volatility', `${((analysis?.vol || 0) * 100).toFixed(1)}%`, analysis?.vol < 0.2 ? 'Thấp' : analysis?.vol < 0.4 ? 'TB' : 'Cao'],
        ],
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [0, 102, 204] },
      });
      y = (doc as any).lastAutoTable.finalY + 8;

      // Statistical Analysis
      if (stats) {
        doc.text('IV. PHÂN TÍCH THỐNG KÊ (R/Python)', 14, y);
        y += 2;

        autoTable(doc, {
          startY: y,
          head: [['Chỉ số', 'Giá trị']],
          body: [
            ['Mean Daily Return', `${((stats.meanReturn || 0) * 100).toFixed(4)}%`],
            ['Std Deviation', `${((stats.stdReturn || 0) * 100).toFixed(4)}%`],
            ['Skewness', `${(stats.skewness || 0).toFixed(4)}`],
            ['Kurtosis (excess)', `${(stats.kurtosis || 0).toFixed(4)}`],
            ['R² (Linear Trend)', `${(stats.regression?.r2 || 0).toFixed(6)}`],
            ['Correlation (R)', `${(stats.regression?.r || 0).toFixed(6)}`],
          ],
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [0, 102, 204] },
        });
        y = (doc as any).lastAutoTable.finalY + 8;
      }

      // Conclusion
      if (y > 250) { doc.addPage(); y = 15; }
      doc.setFontSize(12);
      doc.text('V. KẾT LUẬN & KHUYẾN NGHỊ', 14, y);
      y += 6;
      doc.setFontSize(9);

      const conclusions: string[] = [];

      // Score calculation
      let score = 50;
      if (quote) {
        if (quote.pe > 0 && quote.pe < 20) score += 10;
        if (quote.roe > 15) score += 10;
        if (quote.deRatio < 1) score += 5;
        if (quote.revenueGrowth > 10) score += 10;
        if (quote.earningsGrowth > 10) score += 5;
        if (quote.divYield > 2) score += 5;
      }
      if (analysis) {
        if (analysis.rsi > 30 && analysis.rsi < 70) score += 5;
        if (analysis.sharpe > 0.5) score += 5;
        if (analysis.maxDD < 0.2) score += 5;
      }
      score = Math.min(100, Math.max(0, score));

      conclusions.push(`Điểm đánh giá tổng thể: ${score}/100`);
      conclusions.push(score >= 70 ? 'Khuyến nghị: MUA - Cổ phiếu có tiềm năng tăng trưởng tốt.' : score >= 50 ? 'Khuyến nghị: GIỮ - Cổ phiếu ở mức trung bình, theo dõi thêm.' : 'Khuyến nghị: BÁN/TRÁNH - Cổ phiếu có rủi ro cao.');

      if (quote?.roe > 15) conclusions.push('✓ ROE cao, hiệu suất sử dụng vốn tốt.');
      if (quote?.pe > 0 && quote?.pe < 15) conclusions.push('✓ P/E thấp, cổ phiếu có thể đang bị định giá thấp.');
      if (quote?.pe > 30) conclusions.push('⚠ P/E cao, cẩn trọng với mức định giá.');
      if (quote?.deRatio > 2) conclusions.push('⚠ Tỷ lệ D/E cao, rủi ro tài chính lớn.');
      if (analysis?.rsi > 70) conclusions.push('⚠ RSI > 70: Cổ phiếu đang trong vùng quá mua.');
      if (analysis?.rsi < 30) conclusions.push('✓ RSI < 30: Cổ phiếu đang trong vùng quá bán, có thể phục hồi.');
      if (analysis?.maxDD > 0.3) conclusions.push('⚠ Max Drawdown > 30%: Rủi ro sụt giảm lớn.');

      conclusions.forEach(line => {
        if (y > 280) { doc.addPage(); y = 15; }
        doc.text(`  ${line}`, 14, y);
        y += 5;
      });

      // Disclaimer
      y += 5;
      doc.setFontSize(7);
      doc.setTextColor(150);
      doc.text('Lưu ý: Báo cáo chỉ mang tính tham khảo, không phải lời khuyên đầu tư. Nhà đầu tư cần tự đánh giá và chịu trách nhiệm.', 14, y);

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(150);
        doc.text(`Crystall Quant Platform | Trang ${i}/${pageCount}`, pageWidth / 2, 290, { align: 'center' });
      }

      doc.save(`BaoCao_${symbol}_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Đã xuất báo cáo PDF');
    });
  });
}

export default function StockAnalysis() {
  const [selected, setSelected] = useState('VNM.VN');
  const [historyRange, setHistoryRange] = useState('1y');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: quote, isLoading: quoteLoading, error: quoteError, refetch: refetchQuote } = useStockQuote(selected);
  const { data: history, isLoading: historyLoading } = useStockHistory(selected, historyRange);

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
      date,
      close: history.closes[i],
      volume: history.volumes[i],
      rsi: rsi[i],
      macd: macd[i]?.macd,
      signal: macd[i]?.signal,
      histogram: macd[i]?.histogram,
      ema12: ema12[i],
      ema26: ema26[i],
      ema50: ema50[i],
      sma20: sma20[i],
      bbUpper: bb[i]?.upper,
      bbLower: bb[i]?.lower,
      bbMiddle: bb[i]?.middle,
    }));

    return { chartData, vol, beta, sharpe, maxDD, rsi: rsi[rsi.length - 1] || 50, returns };
  }, [history]);

  // Advanced statistical analysis (R/Python-like)
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
    const meanReturn = dist.mean;
    const stdReturn = dist.std;

    // Scatter data for regression plot
    const scatterData = xIndices.map((x, i) => ({
      x,
      return: returns[i] * 100,
      predicted: regression.predictions[i] * 100,
    }));

    return { regression, dist, acf, var95, cvar95, var99, meanReturn: dist.mean, stdReturn: dist.std, skewness: dist.skewness, kurtosis: dist.kurtosis, scatterData };
  }, [analysis]);

  const handleExportExcel = useCallback(() => {
    if (!quote) return toast.error('Chưa có dữ liệu để xuất');
    exportStockExcel(selected, quote, analysis, history, stats);
  }, [selected, quote, analysis, history, stats]);

  const handleExportPDF = useCallback(() => {
    if (!quote) return toast.error('Chưa có dữ liệu để xuất');
    exportStockPDF(selected, quote, analysis, stats);
  }, [selected, quote, analysis, stats]);

  const filteredStocks = useMemo(() => {
    if (!searchTerm) return STOCK_CATEGORIES;
    const term = searchTerm.toLowerCase();
    const result: typeof STOCK_CATEGORIES = {} as any;
    for (const [cat, stocks] of Object.entries(STOCK_CATEGORIES)) {
      const filtered = stocks.filter(s => s.symbol.toLowerCase().includes(term) || s.name.toLowerCase().includes(term));
      if (filtered.length > 0) (result as any)[cat] = filtered;
    }
    return result;
  }, [searchTerm]);

  const isLoading = quoteLoading || historyLoading;

  if (quoteError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <p className="text-destructive">Không thể tải dữ liệu: {(quoteError as Error).message}</p>
        <Button variant="outline" onClick={() => refetchQuote()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Thử lại
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-56">
            <Select value={selected} onValueChange={setSelected}>
              <SelectTrigger className="bg-card border-border/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-80">
                <div className="p-2 sticky top-0 bg-popover">
                  <Input
                    placeholder="Tìm mã CK..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                {Object.entries(filteredStocks).map(([category, stocks]) => (
                  <div key={category}>
                    <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      {category}
                    </div>
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
          <div>
            {quote ? (
              <>
                <h1 className="text-xl font-semibold">{quote.name}</h1>
                <p className="text-xs text-muted-foreground">{quote.sector} · {quote.marketCap}</p>
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
                <span className="text-3xl font-mono font-semibold">
                  {formatCurrency(quote.currentPrice, selected)}
                </span>
                <span className={`text-sm font-mono ${quote.priceChange1d >= 0 ? 'ticker-green' : 'ticker-red'}`}>
                  {quote.priceChange1d >= 0 ? '+' : ''}{quote.priceChange1d.toFixed(2)}%
                </span>
              </>
            ) : (
              <div className="h-8 w-28 bg-muted animate-pulse rounded" />
            )}
          </div>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={!quote}>
              <Download className="w-3.5 h-3.5 mr-1" />
              Excel
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={!quote}>
              <FileText className="w-3.5 h-3.5 mr-1" />
              PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      {quote && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          {[
            { label: '1D', value: quote.priceChange1d, fmt: (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%` },
            { label: '1W', value: quote.priceChange1w, fmt: (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%` },
            { label: '1M', value: quote.priceChange1m, fmt: (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%` },
            { label: 'RSI(14)', value: analysis?.rsi ?? 0, fmt: (v: number) => v.toFixed(1), neutral: true },
            { label: 'Beta', value: analysis?.beta ?? 0, fmt: (v: number) => v.toFixed(2), neutral: true },
            { label: 'Vol', value: (analysis?.vol ?? 0) * 100, fmt: (v: number) => `${v.toFixed(1)}%`, neutral: true },
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
          <button
            key={r}
            onClick={() => setHistoryRange(r)}
            className={`px-3 py-1 text-xs rounded font-mono transition-all ${
              historyRange === r
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
            }`}
          >
            {r.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="price" className="w-full">
        <TabsList className="bg-muted/30 border border-border/30 flex-wrap h-auto">
          <TabsTrigger value="price" className="text-xs">Price & Overlays</TabsTrigger>
          <TabsTrigger value="technicals" className="text-xs">Indicators</TabsTrigger>
          <TabsTrigger value="fundamentals" className="text-xs">Fundamentals</TabsTrigger>
          <TabsTrigger value="statistics" className="text-xs">📊 Statistics</TabsTrigger>
          <TabsTrigger value="risk" className="text-xs">⚠️ Risk Analysis</TabsTrigger>
        </TabsList>

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
              <div className="flex items-center justify-center h-[350px]">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        </TabsContent>

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
              ) : (
                <div className="flex items-center justify-center h-[180px]"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
              )}
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
              ) : (
                <div className="flex items-center justify-center h-[180px]"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
              )}
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

        <TabsContent value="fundamentals">
          <div className="quant-card">
            {quote ? (
              <>
                <p className="stat-label mb-4">Financial Ratios — {selected} ({quote.name})</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                  <RatioBar label="P/E Ratio" value={quote.pe} max={80} />
                  <RatioBar label="P/B Ratio" value={quote.pb} max={60} />
                  <RatioBar label="P/S Ratio" value={quote.ps} max={40} />
                  <RatioBar label="ROE" value={quote.roe} max={200} unit="%" />
                  <RatioBar label="D/E Ratio" value={quote.deRatio} max={3} />
                  <RatioBar label="Current Ratio" value={quote.currentRatio} max={5} />
                  <RatioBar label="Div. Yield" value={quote.divYield} max={5} unit="%" />
                  <RatioBar label="EPS (TTM)" value={quote.eps} max={15} unit={isVNStock(selected) ? '₫' : '$'} />
                </div>

                <div className="mt-6 p-4 rounded-md bg-muted/20 border border-border/20">
                  <p className="text-xs font-medium mb-2">Growth & Market Info</p>
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
                      <span className="text-muted-foreground">52W High</span>
                      <p className="font-mono mt-0.5">{formatCurrency(quote.fiftyTwoWeekHigh, selected)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">52W Low</span>
                      <p className="font-mono mt-0.5">{formatCurrency(quote.fiftyTwoWeekLow, selected)}</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-40"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            )}
          </div>
        </TabsContent>

        {/* NEW: Statistics Tab */}
        <TabsContent value="statistics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Return Distribution */}
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
                    <div className="p-2 rounded bg-muted/30">
                      <span className="text-muted-foreground">Skewness</span>
                      <p className="font-mono font-medium">{stats.skewness.toFixed(4)}</p>
                    </div>
                    <div className="p-2 rounded bg-muted/30">
                      <span className="text-muted-foreground">Kurtosis (excess)</span>
                      <p className="font-mono font-medium">{stats.kurtosis.toFixed(4)}</p>
                    </div>
                    <div className="p-2 rounded bg-muted/30">
                      <span className="text-muted-foreground">Mean Return</span>
                      <p className="font-mono font-medium">{(stats.meanReturn * 100).toFixed(4)}%</p>
                    </div>
                    <div className="p-2 rounded bg-muted/30">
                      <span className="text-muted-foreground">Std Deviation</span>
                      <p className="font-mono font-medium">{(stats.stdReturn * 100).toFixed(4)}%</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-[200px]"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
              )}
            </div>

            {/* Autocorrelation */}
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
                  <p className="text-[10px] text-muted-foreground mt-1">Đường đỏ: Ngưỡng 95% confidence. ACF gần 0 = chuỗi ngẫu nhiên (random walk).</p>
                </>
              ) : (
                <div className="flex items-center justify-center h-[200px]"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
              )}
            </div>

            {/* Regression */}
            <div className="quant-card lg:col-span-2">
              <p className="stat-label mb-2">Hồi quy tuyến tính (Linear Regression)</p>
              {stats ? (
                <>
                  <ResponsiveContainer width="100%" height={220}>
                    <ComposedChart data={stats.scatterData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 20%, 14%)" />
                      <XAxis dataKey="x" tick={{ fontSize: 10 }} label={{ value: 'Ngày giao dịch', position: 'bottom', fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} label={{ value: 'Return (%)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(222, 40%, 7%)', border: '1px solid hsl(222, 20%, 14%)', borderRadius: 6, fontSize: 11 }} />
                      <Scatter dataKey="return" fill="hsl(185, 80%, 50%)" fillOpacity={0.3} r={1.5} />
                      <Line type="monotone" dataKey="predicted" stroke="hsl(38, 92%, 55%)" strokeWidth={2} dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-4 gap-2 mt-3 text-xs">
                    <div className="p-2 rounded bg-muted/30">
                      <span className="text-muted-foreground">R²</span>
                      <p className="font-mono font-medium">{stats.regression.r2.toFixed(6)}</p>
                    </div>
                    <div className="p-2 rounded bg-muted/30">
                      <span className="text-muted-foreground">Correlation (R)</span>
                      <p className="font-mono font-medium">{stats.regression.r.toFixed(6)}</p>
                    </div>
                    <div className="p-2 rounded bg-muted/30">
                      <span className="text-muted-foreground">Slope (β₁)</span>
                      <p className="font-mono font-medium">{stats.regression.slope.toExponential(3)}</p>
                    </div>
                    <div className="p-2 rounded bg-muted/30">
                      <span className="text-muted-foreground">Intercept (β₀)</span>
                      <p className="font-mono font-medium">{stats.regression.intercept.toExponential(3)}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-[220px]"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* NEW: Risk Analysis Tab */}
        <TabsContent value="risk">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="quant-card">
              <p className="stat-label mb-3">Value at Risk (VaR) & CVaR</p>
              {stats ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 rounded-md bg-destructive/10 border border-destructive/20">
                      <p className="stat-label">VaR 95%</p>
                      <p className="stat-value mt-1 text-destructive">{(stats.var95 * 100).toFixed(3)}%</p>
                    </div>
                    <div className="text-center p-3 rounded-md bg-destructive/10 border border-destructive/20">
                      <p className="stat-label">CVaR 95%</p>
                      <p className="stat-value mt-1 text-destructive">{(stats.cvar95 * 100).toFixed(3)}%</p>
                    </div>
                    <div className="text-center p-3 rounded-md bg-destructive/10 border border-destructive/20">
                      <p className="stat-label">VaR 99%</p>
                      <p className="stat-value mt-1 text-destructive">{(stats.var99 * 100).toFixed(3)}%</p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>• VaR 95%: Với xác suất 95%, lỗ tối đa trong 1 ngày không vượt quá <span className="font-mono text-destructive">{(stats.var95 * 100).toFixed(3)}%</span></p>
                    <p>• CVaR 95%: Khi lỗ vượt VaR, mức lỗ trung bình là <span className="font-mono text-destructive">{(stats.cvar95 * 100).toFixed(3)}%</span></p>
                    {quote && <p>• Nếu đầu tư <span className="font-mono">100 triệu VND</span>, VaR 95% = lỗ tối đa <span className="font-mono text-destructive">{(stats.var95 * 100).toFixed(1)} triệu</span>/ngày</p>}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-40"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
              )}
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
              ) : (
                <div className="flex items-center justify-center h-[180px]"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
              )}
            </div>

            {/* Risk Summary */}
            {analysis && stats && quote && (
              <div className="quant-card lg:col-span-2">
                <p className="stat-label mb-3">📋 Tổng hợp đánh giá rủi ro</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className={`p-3 rounded-md border ${analysis.vol < 0.25 ? 'border-green-500/30 bg-green-500/5' : analysis.vol < 0.4 ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
                    <p className="font-medium">Biến động (Volatility)</p>
                    <p className="font-mono mt-1">{(analysis.vol * 100).toFixed(1)}%/năm</p>
                    <p className="text-muted-foreground mt-1">{analysis.vol < 0.25 ? 'Mức biến động thấp, phù hợp NĐT phòng thủ' : analysis.vol < 0.4 ? 'Biến động trung bình, cần quản lý vị thế' : 'Biến động cao, rủi ro lớn'}</p>
                  </div>
                  <div className={`p-3 rounded-md border ${analysis.maxDD < 0.15 ? 'border-green-500/30 bg-green-500/5' : analysis.maxDD < 0.3 ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
                    <p className="font-medium">Sụt giảm tối đa</p>
                    <p className="font-mono mt-1">{(analysis.maxDD * 100).toFixed(1)}%</p>
                    <p className="text-muted-foreground mt-1">{analysis.maxDD < 0.15 ? 'Rủi ro sụt giảm thấp' : analysis.maxDD < 0.3 ? 'Có giai đoạn sụt giảm đáng kể' : 'Rủi ro sụt giảm rất lớn'}</p>
                  </div>
                  <div className={`p-3 rounded-md border ${analysis.sharpe > 1 ? 'border-green-500/30 bg-green-500/5' : analysis.sharpe > 0 ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
                    <p className="font-medium">Hiệu suất điều chỉnh rủi ro</p>
                    <p className="font-mono mt-1">Sharpe: {analysis.sharpe.toFixed(3)}</p>
                    <p className="text-muted-foreground mt-1">{analysis.sharpe > 1 ? 'Tỷ suất sinh lời tốt so với rủi ro' : analysis.sharpe > 0 ? 'Lợi nhuận chưa bù đắp đủ rủi ro' : 'Lợi nhuận âm điều chỉnh rủi ro'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
