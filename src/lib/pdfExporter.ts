import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { ProjectParams, ProjectResults, YearlyData } from './projectModel';

export interface PDFExportOptions {
  params: ProjectParams;
  results: ProjectResults;
  chartRef?: HTMLDivElement | null;
}

// Format number for display
const formatNumber = (num: number, decimals: number = 0): string => {
  return new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: decimals,
  }).format(num);
};

const formatPercent = (num: number): string => {
  return `${(num * 100).toFixed(2)}%`;
};

// Expert analysis functions
const analyzeNPV = (npv: number, investmentValue: number): string => {
  const ratio = npv / investmentValue;
  if (npv > 0) {
    if (ratio > 0.5) {
      return `NPV đạt ${formatNumber(npv)} triệu đồng, tương đương ${formatPercent(ratio)} giá trị đầu tư ban đầu. Đây là mức sinh lời xuất sắc, cho thấy dự án có tiềm năng tạo giá trị gia tăng rất cao. Dự án đáng được ưu tiên đầu tư.`;
    } else if (ratio > 0.2) {
      return `NPV đạt ${formatNumber(npv)} triệu đồng (${formatPercent(ratio)} giá trị đầu tư). Mức sinh lời tốt, dự án tạo được giá trị gia tăng đáng kể và đáp ứng kỳ vọng đầu tư.`;
    } else {
      return `NPV đạt ${formatNumber(npv)} triệu đồng (${formatPercent(ratio)} giá trị đầu tư). Mặc dù dương nhưng biên lợi nhuận khá mỏng, cần cân nhắc các rủi ro tiềm ẩn.`;
    }
  } else {
    return `NPV âm ${formatNumber(Math.abs(npv))} triệu đồng cho thấy dự án không tạo ra giá trị kinh tế. Khuyến nghị xem xét lại cơ cấu chi phí, giá bán hoặc nguồn vốn.`;
  }
};

const analyzeIRR = (irr: number, wacc: number, debtRate: number): string => {
  const spread = irr - wacc;
  if (irr > wacc) {
    if (spread > 0.15) {
      return `IRR đạt ${formatPercent(irr)}, cao hơn WACC (${formatPercent(wacc)}) ${formatPercent(spread)}. Spread lớn cho thấy dự án có khả năng sinh lời vượt trội và độ an toàn cao trước biến động chi phí vốn.`;
    } else if (spread > 0.05) {
      return `IRR ${formatPercent(irr)} cao hơn WACC ${formatPercent(spread)}. Dự án sinh lời ổn định, tuy nhiên cần theo dõi biến động lãi suất vì spread ở mức vừa phải.`;
    } else {
      return `IRR ${formatPercent(irr)} chỉ cao hơn WACC ${formatPercent(spread)}. Spread mỏng khiến dự án nhạy cảm với rủi ro lãi suất và chi phí vốn.`;
    }
  } else {
    return `IRR ${formatPercent(irr)} thấp hơn WACC ${formatPercent(wacc)}, cho thấy tỷ suất sinh lời không đủ bù đắp chi phí vốn. Dự án không đạt hiệu quả tài chính tối thiểu.`;
  }
};

const analyzeDPP = (dpp: number, projectLife: number): string => {
  const ratio = dpp / projectLife;
  if (ratio < 0.3) {
    return `Thời gian hoàn vốn ${dpp.toFixed(2)} năm (${formatPercent(ratio)} vòng đời dự án). Hoàn vốn rất nhanh, rủi ro thanh khoản thấp, dòng tiền ổn định sớm.`;
  } else if (ratio < 0.5) {
    return `Thời gian hoàn vốn ${dpp.toFixed(2)} năm, chiếm ${formatPercent(ratio)} vòng đời. Mức hoàn vốn hợp lý, cân bằng giữa rủi ro và lợi nhuận.`;
  } else if (ratio < 0.7) {
    return `Thời gian hoàn vốn ${dpp.toFixed(2)} năm (${formatPercent(ratio)} vòng đời). Hoàn vốn chậm, cần theo dõi sát dòng tiền và các biến động thị trường.`;
  } else {
    return `Thời gian hoàn vốn ${dpp.toFixed(2)} năm, chiếm phần lớn vòng đời dự án. Rủi ro cao, khuyến nghị xem xét tối ưu chi phí hoặc tăng doanh thu.`;
  }
};

const analyzeDSCR = (dscr: number): string => {
  if (dscr >= 1.5) {
    return `DSCR bình quân ${dscr.toFixed(2)} - Xuất sắc. Dòng tiền dư dả để trả nợ, an toàn cao với các tổ chức cho vay. Có khả năng huy động thêm vốn vay nếu cần.`;
  } else if (dscr >= 1.25) {
    return `DSCR bình quân ${dscr.toFixed(2)} - Tốt. Khả năng trả nợ ổn định, đáp ứng yêu cầu của đa số ngân hàng thương mại.`;
  } else if (dscr >= 1.0) {
    return `DSCR bình quân ${dscr.toFixed(2)} - Chấp nhận được nhưng căng. Dòng tiền vừa đủ trả nợ, không có dự phòng, rủi ro nếu doanh thu giảm.`;
  } else {
    return `DSCR bình quân ${dscr.toFixed(2)} - Rủi ro cao. Dòng tiền không đủ trả nợ, có nguy cơ mất khả năng thanh toán. Cần tái cơ cấu nợ hoặc bổ sung vốn.`;
  }
};

const generateStrategicRecommendations = (results: ProjectResults, params: ProjectParams): string[] => {
  const recommendations: string[] = [];
  
  // NPV recommendations
  if (results.npvTIPV > 0) {
    if (results.irrTIPV > results.waccAverage * 1.5) {
      recommendations.push('Dự án có IRR cao, xem xét tăng quy mô đầu tư hoặc nhân rộng mô hình.');
    }
  } else {
    recommendations.push('Xem xét giảm chi phí đầu tư ban đầu hoặc tái đàm phán giá thuê đất.');
    recommendations.push('Tối ưu hóa cơ cấu vốn: tăng tỷ lệ vốn chủ sở hữu hoặc tìm nguồn vay ưu đãi.');
  }
  
  // DPP recommendations
  if (results.dppTIPV > params.operationYears * 0.6) {
    recommendations.push('Thời gian hoàn vốn dài, cân nhắc tăng công suất năm đầu hoặc điều chỉnh giá bán.');
  }
  
  // DSCR recommendations
  if (results.dscrAverage < 1.25) {
    recommendations.push('DSCR thấp, khuyến nghị kéo dài kỳ hạn vay hoặc tăng vốn chủ sở hữu để giảm áp lực trả nợ.');
  }
  
  // Revenue optimization
  if (params.realPriceChange < 0) {
    recommendations.push('Giá bán thực giảm qua các năm, cần chiến lược giữ giá hoặc nâng cao giá trị sản phẩm.');
  }
  
  // Cost optimization
  if (params.componentCost / params.basePrice > 0.7) {
    recommendations.push('Tỷ lệ chi phí linh kiện/giá bán cao, tìm kiếm nhà cung cấp thay thế hoặc đàm phán giá tốt hơn.');
  }
  
  // Capacity utilization
  const avgCapacity = params.capacitySchedule.reduce((a, b) => a + b, 0) / params.capacitySchedule.length;
  if (avgCapacity < 90) {
    recommendations.push(`Công suất trung bình ${avgCapacity.toFixed(0)}%, xem xét đẩy mạnh marketing để tăng sản lượng tiêu thụ.`);
  }
  
  return recommendations.slice(0, 5);
};

const generateRiskAnalysis = (results: ProjectResults, params: ProjectParams): string[] => {
  const risks: string[] = [];
  
  // Financial risks
  if (results.irrTIPV - results.waccAverage < 0.05) {
    risks.push('Rủi ro lãi suất: IRR gần WACC, biến động lãi suất nhỏ có thể làm dự án lỗ.');
  }
  
  if (results.dscrAverage < 1.2) {
    risks.push('Rủi ro thanh khoản: DSCR thấp, có thể gặp khó khăn trả nợ khi doanh thu giảm.');
  }
  
  // Market risks
  if (params.realPriceChange < -5) {
    risks.push('Rủi ro giá bán: Giá thực giảm mạnh theo năm, cần chiến lược duy trì giá.');
  }
  
  // Operational risks
  if (params.operationYears > 10) {
    risks.push('Rủi ro vận hành: Dự án dài hạn, khó dự đoán biến động thị trường và công nghệ.');
  }
  
  // Capital structure risks
  if (params.debtRatio > 70) {
    risks.push('Rủi ro đòn bẩy tài chính: Tỷ lệ nợ cao, áp lực trả nợ lớn trong giai đoạn đầu.');
  }
  
  // Inflation risks
  if (params.inflationRate > 5) {
    risks.push('Rủi ro lạm phát: Lạm phát cao ảnh hưởng đến chi phí đầu vào và giá trị thực dòng tiền.');
  }
  
  return risks;
};

const generateOverallConclusion = (results: ProjectResults, params: ProjectParams): string => {
  const score = calculateProjectScore(results, params);
  
  if (score >= 80) {
    return `DỰ ÁN RẤT KHẢ THI - Điểm đánh giá: ${score}/100. Dự án "${params.projectName}" đạt hiệu quả tài chính xuất sắc trên tất cả các chỉ tiêu. NPV dương lớn, IRR vượt xa chi phí vốn, thời gian hoàn vốn ngắn và khả năng trả nợ an toàn. Khuyến nghị mạnh mẽ: Tiến hành đầu tư và có thể xem xét mở rộng quy mô.`;
  } else if (score >= 60) {
    return `DỰ ÁN KHẢ THI - Điểm đánh giá: ${score}/100. Dự án "${params.projectName}" đạt hiệu quả tài chính tốt với một số điểm cần lưu ý. Khuyến nghị: Tiến hành đầu tư, đồng thời theo dõi sát các chỉ số và có kế hoạch ứng phó rủi ro.`;
  } else if (score >= 40) {
    return `DỰ ÁN CẦN XEM XÉT - Điểm đánh giá: ${score}/100. Dự án "${params.projectName}" có hiệu quả tài chính ở mức trung bình với nhiều rủi ro tiềm ẩn. Khuyến nghị: Tái cấu trúc các thông số đầu vào, tối ưu chi phí trước khi quyết định đầu tư.`;
  } else {
    return `DỰ ÁN KHÔNG KHẢ THI - Điểm đánh giá: ${score}/100. Dự án "${params.projectName}" không đạt hiệu quả tài chính tối thiểu. Khuyến nghị: Không tiến hành đầu tư trong điều kiện hiện tại, cần thay đổi căn bản cơ cấu vốn, giá bán hoặc chi phí.`;
  }
};

const calculateProjectScore = (results: ProjectResults, params: ProjectParams): number => {
  let score = 0;
  
  // NPV score (max 30)
  if (results.npvTIPV > 0) {
    const npvRatio = results.npvTIPV / (params.fixedAssetValue + params.intangibleAssetValue);
    score += Math.min(30, npvRatio * 60);
  }
  
  // IRR vs WACC score (max 25)
  const spread = results.irrTIPV - results.waccAverage;
  if (spread > 0) {
    score += Math.min(25, spread * 100);
  }
  
  // DPP score (max 20)
  const dppRatio = results.dppTIPV / params.operationYears;
  if (dppRatio < 0.5) {
    score += 20;
  } else if (dppRatio < 0.7) {
    score += 15;
  } else if (dppRatio < 1) {
    score += 10;
  }
  
  // DSCR score (max 25)
  if (results.dscrAverage >= 1.5) {
    score += 25;
  } else if (results.dscrAverage >= 1.25) {
    score += 20;
  } else if (results.dscrAverage >= 1.0) {
    score += 10;
  }
  
  return Math.min(100, Math.round(score));
};

export const exportToPDF = async (options: PDFExportOptions): Promise<void> => {
  const { params, results, chartRef } = options;
  
  // Create PDF document
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = margin;
  
  // Helper function to add new page if needed
  const checkNewPage = (requiredSpace: number): void => {
    if (yPos + requiredSpace > pageHeight - margin) {
      pdf.addPage();
      yPos = margin;
    }
  };
  
  // Add header with title
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(33, 37, 41);
  pdf.text('BÁO CÁO PHÂN TÍCH DỰ ÁN ĐẦU TƯ', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;
  
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(108, 117, 125);
  pdf.text(params.projectName, pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;
  
  pdf.setFontSize(10);
  pdf.text(`Ngày lập: ${new Date().toLocaleDateString('vi-VN')}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 12;
  
  // Divider line
  pdf.setDrawColor(200, 200, 200);
  pdf.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;
  
  // Section 1: Executive Summary
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(25, 135, 84);
  pdf.text('1. TÓM TẮT ĐIỀU HÀNH', margin, yPos);
  yPos += 8;
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(33, 37, 41);
  
  const conclusion = generateOverallConclusion(results, params);
  const conclusionLines = pdf.splitTextToSize(conclusion, pageWidth - 2 * margin);
  pdf.text(conclusionLines, margin, yPos);
  yPos += conclusionLines.length * 5 + 10;
  
  // Section 2: Key Metrics Summary
  checkNewPage(60);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(13, 110, 253);
  pdf.text('2. CÁC CHỈ TIÊU TÀI CHÍNH CHÍNH', margin, yPos);
  yPos += 6;
  
  // Key metrics table
  autoTable(pdf, {
    startY: yPos,
    head: [['Chỉ tiêu', 'TIPV (Tổng đầu tư)', 'EPV (Chủ đầu tư)', 'Đánh giá']],
    body: [
      [
        'NPV (Giá trị hiện tại ròng)',
        `${formatNumber(results.npvTIPV)} triệu`,
        `${formatNumber(results.npvEPV)} triệu`,
        results.npvTIPV > 0 ? '✓ Đạt' : '✗ Không đạt'
      ],
      [
        'IRR (Tỷ suất sinh lời nội bộ)',
        formatPercent(results.irrTIPV),
        formatPercent(results.irrEPV),
        results.irrTIPV > results.waccAverage ? '✓ Đạt' : '✗ Không đạt'
      ],
      [
        'DPP (Thời gian hoàn vốn)',
        `${results.dppTIPV.toFixed(2)} năm`,
        `${results.dppEPV.toFixed(2)} năm`,
        results.dppTIPV < params.operationYears ? '✓ Đạt' : '✗ Không đạt'
      ],
      [
        'DSCR (Hệ số trả nợ)',
        results.dscrAverage.toFixed(2),
        '-',
        results.dscrAverage >= 1.2 ? '✓ Đạt' : '⚠ Cảnh báo'
      ],
      [
        'WACC bình quân',
        formatPercent(results.waccAverage),
        '-',
        '-'
      ],
    ],
    theme: 'striped',
    headStyles: { fillColor: [13, 110, 253], fontSize: 10 },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      0: { fontStyle: 'bold' },
      3: { halign: 'center' }
    },
    margin: { left: margin, right: margin },
  });
  
  yPos = (pdf as any).lastAutoTable.finalY + 10;
  
  // Section 3: Detailed Analysis
  checkNewPage(80);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(111, 66, 193);
  pdf.text('3. PHÂN TÍCH CHI TIẾT CÁC CHỈ TIÊU', margin, yPos);
  yPos += 10;
  
  // NPV Analysis
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(33, 37, 41);
  pdf.text('3.1. Phân tích NPV (Net Present Value)', margin, yPos);
  yPos += 6;
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  const npvAnalysis = analyzeNPV(results.npvTIPV, params.fixedAssetValue + params.intangibleAssetValue);
  const npvLines = pdf.splitTextToSize(npvAnalysis, pageWidth - 2 * margin);
  pdf.text(npvLines, margin, yPos);
  yPos += npvLines.length * 4 + 8;
  
  // IRR Analysis
  checkNewPage(30);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('3.2. Phân tích IRR (Internal Rate of Return)', margin, yPos);
  yPos += 6;
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  const irrAnalysis = analyzeIRR(results.irrTIPV, results.waccAverage, params.nominalInterestRate);
  const irrLines = pdf.splitTextToSize(irrAnalysis, pageWidth - 2 * margin);
  pdf.text(irrLines, margin, yPos);
  yPos += irrLines.length * 4 + 8;
  
  // DPP Analysis
  checkNewPage(30);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('3.3. Phân tích DPP (Discounted Payback Period)', margin, yPos);
  yPos += 6;
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  const dppAnalysis = analyzeDPP(results.dppTIPV, params.operationYears);
  const dppLines = pdf.splitTextToSize(dppAnalysis, pageWidth - 2 * margin);
  pdf.text(dppLines, margin, yPos);
  yPos += dppLines.length * 4 + 8;
  
  // DSCR Analysis
  checkNewPage(30);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('3.4. Phân tích DSCR (Debt Service Coverage Ratio)', margin, yPos);
  yPos += 6;
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  const dscrAnalysis = analyzeDSCR(results.dscrAverage);
  const dscrLines = pdf.splitTextToSize(dscrAnalysis, pageWidth - 2 * margin);
  pdf.text(dscrLines, margin, yPos);
  yPos += dscrLines.length * 4 + 10;
  
  // Section 4: Cash Flow Table
  checkNewPage(80);
  pdf.addPage();
  yPos = margin;
  
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(220, 53, 69);
  pdf.text('4. BẢNG DÒNG TIỀN CHI TIẾT THEO NĂM', margin, yPos);
  yPos += 6;
  
  autoTable(pdf, {
    startY: yPos,
    head: [['Năm', 'Doanh thu', 'Chi phí', 'EBIT', 'Thuế', 'NCF TIPV', 'NCF EPV', 'Lũy kế TIPV']],
    body: results.yearlyData.map(row => [
      row.year.toString(),
      formatNumber(row.revenue),
      formatNumber(row.cogs + row.adminCost),
      formatNumber(row.ebit),
      formatNumber(row.tax),
      formatNumber(row.ncfTIPV),
      formatNumber(row.ncfEPV),
      formatNumber(row.cumulativePV_TIPV)
    ]),
    theme: 'striped',
    headStyles: { fillColor: [220, 53, 69], fontSize: 8 },
    bodyStyles: { fontSize: 7, halign: 'right' },
    columnStyles: {
      0: { halign: 'center' }
    },
    margin: { left: margin, right: margin },
  });
  
  yPos = (pdf as any).lastAutoTable.finalY + 10;
  
  // Section 5: Detailed Cash Flow Breakdown
  checkNewPage(80);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 193, 7);
  pdf.text('5. CHI TIẾT DÒNG TIỀN VÀ NỢ VAY', margin, yPos);
  yPos += 6;
  
  autoTable(pdf, {
    startY: yPos,
    head: [['Năm', 'Dư nợ', 'Trả gốc', 'Trả lãi', 'DSCR', 'PV TIPV', 'PV EPV']],
    body: results.yearlyData.map(row => [
      row.year.toString(),
      formatNumber(row.loanBalance),
      formatNumber(row.principalPayment),
      formatNumber(row.interestPayment),
      row.dscr > 0 ? row.dscr.toFixed(2) : '-',
      formatNumber(row.pvNCF_TIPV),
      formatNumber(row.pvNCF_EPV)
    ]),
    theme: 'striped',
    headStyles: { fillColor: [255, 193, 7], textColor: [33, 37, 41], fontSize: 8 },
    bodyStyles: { fontSize: 7, halign: 'right' },
    columnStyles: {
      0: { halign: 'center' }
    },
    margin: { left: margin, right: margin },
  });
  
  yPos = (pdf as any).lastAutoTable.finalY + 10;
  
  // Section 6: Chart capture (if ref provided)
  if (chartRef) {
    try {
      checkNewPage(100);
      pdf.addPage();
      yPos = margin;
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(13, 202, 240);
      pdf.text('6. BIỂU ĐỒ DÒNG TIỀN', margin, yPos);
      yPos += 10;
      
      const canvas = await html2canvas(chartRef, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = pageWidth - 2 * margin;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', margin, yPos, imgWidth, Math.min(imgHeight, 100));
      yPos += Math.min(imgHeight, 100) + 10;
    } catch (error) {
      console.error('Error capturing chart:', error);
    }
  }
  
  // Section 7: Risk Analysis
  checkNewPage(80);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(220, 53, 69);
  pdf.text('7. PHÂN TÍCH RỦI RO', margin, yPos);
  yPos += 8;
  
  const risks = generateRiskAnalysis(results, params);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(33, 37, 41);
  
  risks.forEach((risk, index) => {
    checkNewPage(15);
    const riskLines = pdf.splitTextToSize(`${index + 1}. ${risk}`, pageWidth - 2 * margin - 5);
    pdf.text(riskLines, margin + 5, yPos);
    yPos += riskLines.length * 4 + 4;
  });
  
  if (risks.length === 0) {
    pdf.text('Không phát hiện rủi ro đáng kể trong điều kiện phân tích hiện tại.', margin, yPos);
    yPos += 8;
  }
  
  yPos += 5;
  
  // Section 8: Strategic Recommendations
  checkNewPage(80);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(25, 135, 84);
  pdf.text('8. KHUYẾN NGHỊ CHIẾN LƯỢC', margin, yPos);
  yPos += 8;
  
  const recommendations = generateStrategicRecommendations(results, params);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(33, 37, 41);
  
  recommendations.forEach((rec, index) => {
    checkNewPage(15);
    const recLines = pdf.splitTextToSize(`${index + 1}. ${rec}`, pageWidth - 2 * margin - 5);
    pdf.text(recLines, margin + 5, yPos);
    yPos += recLines.length * 4 + 4;
  });
  
  yPos += 5;
  
  // Section 9: Project Parameters Summary
  checkNewPage(100);
  pdf.addPage();
  yPos = margin;
  
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(108, 117, 125);
  pdf.text('9. THÔNG SỐ DỰ ÁN ĐẦU VÀO', margin, yPos);
  yPos += 6;
  
  autoTable(pdf, {
    startY: yPos,
    head: [['Nhóm', 'Thông số', 'Giá trị']],
    body: [
      ['Thời gian', 'Năm hoạt động', `${params.operationYears} năm`],
      ['Thời gian', 'Năm thanh lý', `Năm ${params.liquidationYear}`],
      ['Đầu tư', 'Tài sản cố định', `${formatNumber(params.fixedAssetValue)} triệu`],
      ['Đầu tư', 'Tài sản vô hình', `${formatNumber(params.intangibleAssetValue)} triệu`],
      ['Sản xuất', 'Công suất thiết kế', `${formatNumber(params.designCapacity)} SP/năm`],
      ['Sản xuất', 'Giá bán ban đầu', `${formatNumber(params.basePrice, 2)} triệu/SP`],
      ['Chi phí', 'Chi phí linh kiện', `${formatNumber(params.componentCost, 2)} triệu/SP`],
      ['Chi phí', 'Chi phí quản lý', `${formatNumber(params.adminCost)} triệu/năm`],
      ['Nhân sự', 'Số công nhân', `${params.workers} người`],
      ['Nhân sự', 'Số kỹ sư', `${params.engineers} người`],
      ['Vốn', 'Tỷ lệ vay', `${params.debtRatio}%`],
      ['Vốn', 'Lãi suất danh nghĩa', `${params.nominalInterestRate}%`],
      ['Vốn', 'Kỳ hạn vay', `${params.loanTerm} năm`],
      ['Thuế/Lạm phát', 'Thuế TNDN', `${params.corporateTaxRate}%`],
      ['Thuế/Lạm phát', 'Tỷ lệ lạm phát', `${params.inflationRate}%`],
    ],
    theme: 'striped',
    headStyles: { fillColor: [108, 117, 125], fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      2: { halign: 'right' }
    },
    margin: { left: margin, right: margin },
  });
  
  yPos = (pdf as any).lastAutoTable.finalY + 15;
  
  // Footer
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(
      `Trang ${i}/${totalPages} | Báo cáo được tạo tự động bởi Hệ thống Phân tích Dự án Đầu tư`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }
  
  // Save PDF
  pdf.save(`${params.projectName}-BaoCaoPhanTich.pdf`);
};
