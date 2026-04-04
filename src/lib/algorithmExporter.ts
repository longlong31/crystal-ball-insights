import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import type { Algorithm, AlgorithmResult } from "./algorithmRegistry";

export function exportAlgorithmPDF(
  algo: Algorithm,
  params: Record<string, number>,
  result: AlgorithmResult,
  chartImage?: string | null
) {
  const doc = new jsPDF("p", "mm", "a4");
  const w = doc.internal.pageSize.getWidth();
  let y = 15;

  // Header
  doc.setFillColor(88, 28, 135);
  doc.rect(0, 0, w, 35, "F");
  doc.setTextColor(255);
  doc.setFontSize(18);
  doc.text(algo.name, 15, 18);
  doc.setFontSize(10);
  doc.text(algo.description, 15, 26);
  doc.setFontSize(8);
  doc.text(`Crystall Quant Platform • ${new Date().toLocaleDateString("vi-VN")}`, 15, 32);
  y = 45;

  // Input params table
  doc.setTextColor(0);
  doc.setFontSize(13);
  doc.text("Tham so dau vao", 15, y);
  y += 3;

  const paramRows = algo.params.map(p => [
    p.label,
    String(params[p.key] ?? p.defaultValue),
    p.unit || "-",
    p.description || "-",
  ]);

  autoTable(doc, {
    startY: y,
    head: [["Tham so", "Gia tri", "Don vi", "Mo ta"]],
    body: paramRows,
    theme: "grid",
    headStyles: { fillColor: [88, 28, 135], fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    margin: { left: 15, right: 15 },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // Output results table
  doc.setFontSize(13);
  doc.text("Ket qua", 15, y);
  y += 3;

  const outputRows = Object.entries(result.outputs).map(([, o]) => [
    o.label,
    String(o.value),
    o.unit || "-",
  ]);

  autoTable(doc, {
    startY: y,
    head: [["Chi so", "Gia tri", "Don vi"]],
    body: outputRows,
    theme: "grid",
    headStyles: { fillColor: [16, 185, 129], fontSize: 9 },
    bodyStyles: { fontSize: 9, font: "courier" },
    margin: { left: 15, right: 15 },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // Chart image
  if (chartImage) {
    if (y + 90 > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      y = 15;
    }
    doc.setFontSize(13);
    doc.text("Bieu do", 15, y);
    y += 5;
    try {
      doc.addImage(chartImage, "PNG", 15, y, w - 30, 80);
      y += 85;
    } catch { /* skip */ }
  }

  // Interpretation
  if (result.interpretation) {
    if (y + 40 > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      y = 15;
    }
    doc.setFontSize(13);
    doc.text("Giai thich ket qua", 15, y);
    y += 7;
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(result.interpretation, w - 30);
    doc.text(lines, 15, y);
    y += lines.length * 5 + 5;
  }

  // Chart data table
  if (result.chartData && result.chartData.length > 0) {
    if (y + 30 > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      y = 15;
    }
    doc.setFontSize(13);
    doc.text("Du lieu bieu do", 15, y);
    y += 3;

    autoTable(doc, {
      startY: y,
      head: [["X", "Gia tri"]],
      body: result.chartData.map(d => [d.name, d.value.toFixed(4)]),
      theme: "grid",
      headStyles: { fillColor: [59, 130, 246], fontSize: 8 },
      bodyStyles: { fontSize: 7, font: "courier" },
      margin: { left: 15, right: 15 },
    });
  }

  // Footer on each page
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(`Crystall Quant Platform | Trang ${i}/${totalPages}`, w / 2, doc.internal.pageSize.getHeight() - 8, { align: "center" });
  }

  doc.save(`algorithm-${algo.id}-${Date.now()}.pdf`);
}

export function exportAlgorithmExcel(
  algo: Algorithm,
  params: Record<string, number>,
  result: AlgorithmResult
) {
  const wb = XLSX.utils.book_new();

  // Summary sheet
  const summaryData = [
    ["Thuat toan", algo.name],
    ["Mo ta", algo.description],
    ["Ngay", new Date().toLocaleDateString("vi-VN")],
    [""],
    ["=== THAM SO DAU VAO ==="],
    ["Tham so", "Gia tri", "Don vi"],
    ...algo.params.map(p => [p.label, params[p.key] ?? p.defaultValue, p.unit || ""]),
    [""],
    ["=== KET QUA ==="],
    ["Chi so", "Gia tri", "Don vi"],
    ...Object.entries(result.outputs).map(([, o]) => [o.label, o.value, o.unit || ""]),
  ];

  if (result.interpretation) {
    summaryData.push([""], ["=== GIAI THICH ==="], [result.interpretation]);
  }

  const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
  ws1["!cols"] = [{ wch: 30 }, { wch: 20 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, ws1, "Ket qua");

  // Chart data sheet
  if (result.chartData && result.chartData.length > 0) {
    const chartSheet = [
      ["X", "Gia tri"],
      ...result.chartData.map(d => [d.name, d.value]),
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(chartSheet);
    ws2["!cols"] = [{ wch: 15 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, ws2, "Bieu do Data");
  }

  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  saveAs(new Blob([buf]), `algorithm-${algo.id}-${Date.now()}.xlsx`);
}
