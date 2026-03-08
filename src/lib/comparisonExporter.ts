import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface ComparisonAsset {
  symbol: string;
  closes: number[];
  returns: number[];
  dates: string[];
}

interface CorrelationData {
  labels: string[];
  matrix: number[][];
}

interface ComparisonExportData {
  assets: ComparisonAsset[];
  correlationMatrix: CorrelationData | null;
  chartData: Record<string, any>[];
  chartImage?: string;
  correlationImage?: string;
}

const fmt = (n: number, d = 2) => Number(n.toFixed(d));
const fmtPct = (n: number) => `${(n * 100).toFixed(2)}%`;

function calcStats(returns: number[], closes: number[]) {
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const annReturn = mean * 252;
  const vol = Math.sqrt(returns.reduce((a, b) => a + (b - mean) ** 2, 0) / (returns.length - 1)) * Math.sqrt(252);
  const sharpe = vol === 0 ? 0 : (annReturn - 0.04) / vol;
  
  // Max drawdown
  let peak = closes[0], maxDD = 0;
  for (const p of closes) {
    if (p > peak) peak = p;
    const dd = (peak - p) / peak;
    if (dd > maxDD) maxDD = dd;
  }

  // Performance
  const perf1m = closes.length > 21 ? (closes[closes.length - 1] / closes[closes.length - 22] - 1) : 0;
  const perf3m = closes.length > 63 ? (closes[closes.length - 1] / closes[closes.length - 64] - 1) : 0;
  const perfTotal = closes.length > 1 ? (closes[closes.length - 1] / closes[0] - 1) : 0;

  return { annReturn, vol, sharpe, maxDD, perf1m, perf3m, perfTotal, lastPrice: closes[closes.length - 1] };
}

export function exportComparisonPDF(data: ComparisonExportData) {
  const doc = new jsPDF({ orientation: 'landscape' });
  const pageW = doc.internal.pageSize.getWidth();
  
  // Title
  doc.setFontSize(18);
  doc.setTextColor(30, 58, 138);
  doc.text('Stock Comparison Report', pageW / 2, 20, { align: 'center' });
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Generated: ${new Date().toLocaleDateString('vi-VN')} | Symbols: ${data.assets.map(a => a.symbol).join(', ')}`, pageW / 2, 28, { align: 'center' });

  // Stats table
  const statsRows = data.assets.map(a => {
    const s = calcStats(a.returns, a.closes);
    return [
      a.symbol,
      fmt(s.lastPrice),
      fmtPct(s.annReturn),
      fmtPct(s.vol),
      fmt(s.sharpe, 3),
      fmtPct(s.maxDD),
      fmtPct(s.perf1m),
      fmtPct(s.perf3m),
      fmtPct(s.perfTotal),
    ];
  });

  autoTable(doc, {
    startY: 34,
    head: [['Symbol', 'Price', 'Ann. Return', 'Volatility', 'Sharpe', 'Max DD', '1M %', '3M %', 'Total %']],
    body: statsRows,
    theme: 'grid',
    headStyles: { fillColor: [30, 58, 138], fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    styles: { cellPadding: 2 },
  });

  let nextY = (doc as any).lastAutoTable?.finalY || 80;

  // Performance chart image
  if (data.chartImage) {
    if (nextY > 100) { doc.addPage(); nextY = 15; }
    doc.setFontSize(12);
    doc.setTextColor(30, 58, 138);
    doc.text('Relative Performance Chart (Base = 100)', 14, nextY + 8);
    const imgW = pageW - 28;
    const imgH = imgW * 0.45;
    doc.addImage(data.chartImage, 'PNG', 14, nextY + 12, imgW, imgH);
    nextY = nextY + 12 + imgH + 6;
  }

  // Correlation matrix image or table
  if (data.correlationImage) {
    if (nextY > 120) { doc.addPage(); nextY = 15; }
    doc.setFontSize(12);
    doc.setTextColor(30, 58, 138);
    doc.text('Correlation Matrix', 14, nextY + 8);
    const imgW = Math.min(pageW - 28, 180);
    const imgH = imgW * 0.5;
    doc.addImage(data.correlationImage, 'PNG', 14, nextY + 12, imgW, imgH);
    nextY = nextY + 12 + imgH + 6;
  } else if (data.correlationMatrix && data.correlationMatrix.labels.length >= 2) {
    // Fallback: table-based correlation
    const cm = data.correlationMatrix;
    if (nextY > 140) { doc.addPage(); nextY = 15; }
    doc.setFontSize(12);
    doc.setTextColor(30, 58, 138);
    doc.text('Correlation Matrix', 14, nextY + 8);

    const corrHead = ['', ...cm.labels];
    const corrBody = cm.labels.map((label, i) => [
      label,
      ...cm.matrix[i].map(v => v.toFixed(3)),
    ]);

    autoTable(doc, {
      startY: nextY + 12,
      head: [corrHead],
      body: corrBody,
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 138], fontSize: 8 },
      bodyStyles: { fontSize: 8, halign: 'center' },
      columnStyles: { 0: { halign: 'left', fontStyle: 'bold' } },
      didParseCell: (hookData: any) => {
        if (hookData.section === 'body' && hookData.column.index > 0) {
          const val = parseFloat(hookData.cell.raw as string);
          if (!isNaN(val)) {
            const abs = Math.abs(val);
            if (val > 0 && abs > 0.5) hookData.cell.styles.fillColor = [220, 252, 231];
            else if (val < 0 && abs > 0.5) hookData.cell.styles.fillColor = [254, 226, 226];
          }
        }
      },
    });
    nextY = (doc as any).lastAutoTable?.finalY || nextY + 50;
  }

  // Normalized performance table (sampled)
  if (data.chartData.length > 0) {
    const y2 = (doc as any).lastAutoTable?.finalY || 140;
    if (y2 > 160) doc.addPage();
    const startY = y2 > 160 ? 20 : y2 + 12;

    doc.setFontSize(12);
    doc.setTextColor(30, 58, 138);
    doc.text('Normalized Performance (Base = 100)', 14, startY);

    const syms = data.assets.map(a => a.symbol);
    const step = Math.max(1, Math.floor(data.chartData.length / 30));
    const sampled = data.chartData.filter((_, i) => i % step === 0 || i === data.chartData.length - 1);

    autoTable(doc, {
      startY: startY + 4,
      head: [['Date', ...syms]],
      body: sampled.map(row => [
        row.date || '',
        ...syms.map(s => typeof row[s] === 'number' ? row[s].toFixed(2) : '-'),
      ]),
      theme: 'striped',
      headStyles: { fillColor: [30, 58, 138], fontSize: 7 },
      bodyStyles: { fontSize: 7 },
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(`Crystal Ball Quantitative Platform — Page ${i}/${pageCount}`, pageW / 2, doc.internal.pageSize.getHeight() - 5, { align: 'center' });
  }

  doc.save(`stock-comparison-${data.assets.map(a => a.symbol).join('-')}.pdf`);
}

export function exportComparisonExcel(data: ComparisonExportData) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Stats
  const statsHeader = ['Symbol', 'Last Price', 'Ann. Return', 'Volatility', 'Sharpe Ratio', 'Max Drawdown', '1M Performance', '3M Performance', 'Total Performance'];
  const statsData = data.assets.map(a => {
    const s = calcStats(a.returns, a.closes);
    return [a.symbol, fmt(s.lastPrice), fmt(s.annReturn * 100, 2) + '%', fmt(s.vol * 100, 2) + '%', fmt(s.sharpe, 3), fmt(s.maxDD * 100, 2) + '%', fmt(s.perf1m * 100, 2) + '%', fmt(s.perf3m * 100, 2) + '%', fmt(s.perfTotal * 100, 2) + '%'];
  });
  const ws1 = XLSX.utils.aoa_to_sheet([statsHeader, ...statsData]);
  ws1['!cols'] = statsHeader.map(() => ({ wch: 16 }));
  XLSX.utils.book_append_sheet(wb, ws1, 'Statistics');

  // Sheet 2: Correlation
  if (data.correlationMatrix) {
    const cm = data.correlationMatrix;
    const corrData = [['', ...cm.labels], ...cm.labels.map((l, i) => [l, ...cm.matrix[i].map(v => fmt(v, 4))])];
    const ws2 = XLSX.utils.aoa_to_sheet(corrData);
    ws2['!cols'] = corrData[0].map(() => ({ wch: 12 }));
    XLSX.utils.book_append_sheet(wb, ws2, 'Correlation Matrix');
  }

  // Sheet 3: Normalized Performance
  if (data.chartData.length > 0) {
    const syms = data.assets.map(a => a.symbol);
    const perfHeader = ['Date', ...syms];
    const perfData = data.chartData.map(row => [row.date || '', ...syms.map(s => typeof row[s] === 'number' ? fmt(row[s]) : '')]);
    const ws3 = XLSX.utils.aoa_to_sheet([perfHeader, ...perfData]);
    ws3['!cols'] = perfHeader.map(() => ({ wch: 14 }));
    XLSX.utils.book_append_sheet(wb, ws3, 'Performance');
  }

  // Sheet 4: Daily Returns
  const syms = data.assets.map(a => a.symbol);
  const minLen = Math.min(...data.assets.map(a => a.returns.length));
  const retHeader = ['Day', ...syms];
  const retData = Array.from({ length: minLen }, (_, i) => [
    i + 1,
    ...data.assets.map(a => fmt(a.returns[a.returns.length - minLen + i] * 100, 4) + '%'),
  ]);
  const ws4 = XLSX.utils.aoa_to_sheet([retHeader, ...retData]);
  XLSX.utils.book_append_sheet(wb, ws4, 'Daily Returns');

  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([buf], { type: 'application/octet-stream' }), `stock-comparison-${syms.join('-')}.xlsx`);
}
