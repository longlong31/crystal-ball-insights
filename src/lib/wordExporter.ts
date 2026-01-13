import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  WidthType,
  ShadingType,
  Header,
  Footer,
  PageNumber,
  NumberFormat,
} from "docx";
import { saveAs } from "file-saver";
import { ProjectParams, ProjectResults } from "./projectModel";
import { MonteCarloResult } from "./monteCarloAdvanced";

interface RiskReportData {
  params: ProjectParams;
  results: ProjectResults;
  monteCarloResult?: MonteCarloResult | null;
  selectedVariable?: string;
}

const formatNumber = (num: number, decimals: number = 0): string => {
  return new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: decimals,
  }).format(num);
};

const formatPercent = (num: number): string => {
  return `${(num * 100).toFixed(2)}%`;
};

// Phân tích đánh giá rủi ro tổng hợp
const generateRiskAssessment = (results: ProjectResults, mcResult?: MonteCarloResult | null): string => {
  let assessment = "";
  
  // Đánh giá NPV
  if (results.npvTIPV > 0) {
    assessment += "NPV dương cho thấy dự án tạo ra giá trị kinh tế. ";
  } else {
    assessment += "Cảnh báo: NPV âm cho thấy dự án không tạo ra giá trị kinh tế. ";
  }
  
  // Đánh giá IRR vs WACC
  const spread = results.irrTIPV - results.waccAverage;
  if (spread > 0.1) {
    assessment += "IRR vượt xa WACC, an toàn về mặt sinh lời. ";
  } else if (spread > 0.05) {
    assessment += "IRR cao hơn WACC ở mức trung bình. ";
  } else if (spread > 0) {
    assessment += "Spread IRR-WACC mỏng, cần theo dõi biến động lãi suất. ";
  } else {
    assessment += "Cảnh báo: IRR thấp hơn WACC, dự án không đạt hiệu quả tài chính. ";
  }
  
  // Đánh giá DSCR
  if (results.dscrAverage >= 1.5) {
    assessment += "DSCR cao, khả năng trả nợ an toàn. ";
  } else if (results.dscrAverage >= 1.2) {
    assessment += "DSCR đạt yêu cầu ngân hàng. ";
  } else {
    assessment += "Cảnh báo: DSCR thấp, rủi ro thanh khoản. ";
  }
  
  // Đánh giá Monte Carlo nếu có
  if (mcResult) {
    const npvStats = mcResult.results.npvTIPV?.statistics;
    if (npvStats) {
      const probPositive = mcResult.results.npvTIPV?.values.filter(v => v > 0).length / mcResult.results.npvTIPV?.values.length * 100;
      assessment += `Mô phỏng Monte Carlo: ${probPositive?.toFixed(1)}% xác suất NPV dương. `;
      
      if (npvStats.var95 >= 0) {
        assessment += "VaR 95% dương, rủi ro thấp. ";
      } else {
        assessment += `VaR 95% âm (${formatNumber(npvStats.var95)} triệu), có rủi ro thua lỗ. `;
      }
    }
  }
  
  return assessment;
};

// Đánh giá mức độ rủi ro
const getRiskLevel = (results: ProjectResults, mcResult?: MonteCarloResult | null): { level: string; color: string } => {
  let score = 0;
  
  // NPV
  if (results.npvTIPV > 0) score += 25;
  
  // IRR spread
  const spread = results.irrTIPV - results.waccAverage;
  if (spread > 0.1) score += 25;
  else if (spread > 0.05) score += 20;
  else if (spread > 0) score += 10;
  
  // DSCR
  if (results.dscrAverage >= 1.5) score += 25;
  else if (results.dscrAverage >= 1.2) score += 20;
  else if (results.dscrAverage >= 1.0) score += 10;
  
  // Monte Carlo
  if (mcResult) {
    const npvStats = mcResult.results.npvTIPV?.statistics;
    if (npvStats?.var95 && npvStats.var95 >= 0) score += 25;
    else if (npvStats?.percentile25 && npvStats.percentile25 >= 0) score += 15;
  } else {
    score += 12; // Không có MC thì cho điểm trung bình
  }
  
  if (score >= 80) return { level: "THẤP", color: "00FF00" };
  if (score >= 60) return { level: "TRUNG BÌNH", color: "FFFF00" };
  if (score >= 40) return { level: "CAO", color: "FFA500" };
  return { level: "RẤT CAO", color: "FF0000" };
};

// Tạo header
const createHeader = (projectName: string): Header => {
  return new Header({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: `BÁO CÁO PHÂN TÍCH RỦI RO - ${projectName}`,
            size: 20,
            color: "666666",
          }),
        ],
      }),
    ],
  });
};

// Tạo footer
const createFooter = (): Footer => {
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: "Trang ", size: 20 }),
          new TextRun({
            children: [PageNumber.CURRENT],
            size: 20,
          }),
          new TextRun({ text: " / ", size: 20 }),
          new TextRun({
            children: [PageNumber.TOTAL_PAGES],
            size: 20,
          }),
          new TextRun({ text: " | Crystal Ball - Phân tích dự án đầu tư | quachthanhlong.com", size: 18, color: "888888" }),
        ],
      }),
    ],
  });
};

// Tạo bảng thông số dự án
const createProjectInfoTable = (params: ProjectParams): Table => {
  const rows = [
    ["Thông số", "Giá trị"],
    ["Tên dự án", params.projectName],
    ["Số năm hoạt động", `${params.operationYears} năm`],
    ["Giá trị TSCĐ", `${formatNumber(params.fixedAssetValue)} triệu đồng`],
    ["Giá trị TSVH", `${formatNumber(params.intangibleAssetValue)} triệu đồng`],
    ["Tỷ lệ vay", `${params.debtRatio}%`],
    ["Lãi suất vay", `${params.nominalInterestRate}%/năm`],
    ["Thuế TNDN", `${params.corporateTaxRate}%`],
    ["Lạm phát", `${params.inflationRate}%/năm`],
  ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map((row, index) =>
      new TableRow({
        children: row.map((cell) =>
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: cell,
                    bold: index === 0,
                    size: 22,
                  }),
                ],
              }),
            ],
            shading: index === 0 ? { fill: "1a73e8", type: ShadingType.SOLID, color: "1a73e8" } : undefined,
          })
        ),
      })
    ),
  });
};

// Tạo bảng chỉ số tài chính
const createFinancialMetricsTable = (results: ProjectResults): Table => {
  const rows = [
    ["Chỉ tiêu", "TIPV", "EPV", "Đánh giá"],
    ["NPV (triệu đồng)", formatNumber(results.npvTIPV), formatNumber(results.npvEPV), results.npvTIPV > 0 ? "✓ Đạt" : "✗ Không đạt"],
    ["IRR", formatPercent(results.irrTIPV), formatPercent(results.irrEPV), results.irrTIPV > results.waccAverage ? "✓ Đạt" : "✗ Không đạt"],
    ["DPP (năm)", results.dppTIPV.toFixed(2), results.dppEPV.toFixed(2), "-"],
    ["DSCR bình quân", results.dscrAverage.toFixed(2), "-", results.dscrAverage >= 1.2 ? "✓ Đạt" : "⚠ Cảnh báo"],
    ["WACC bình quân", formatPercent(results.waccAverage), "-", "-"],
    ["PI (Chỉ số sinh lời)", results.pi.toFixed(3), "-", results.pi > 1 ? "✓ Đạt" : "✗ Không đạt"],
    ["ROI", formatPercent(results.roi / 100), "-", "-"],
    ["ROE", formatPercent(results.roe / 100), "-", "-"],
  ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map((row, index) =>
      new TableRow({
        children: row.map((cell, cellIndex) =>
          new TableCell({
            children: [
              new Paragraph({
                alignment: cellIndex > 0 ? AlignmentType.RIGHT : AlignmentType.LEFT,
                children: [
                  new TextRun({
                    text: cell,
                    bold: index === 0,
                    size: 22,
                    color: index === 0 ? "FFFFFF" : undefined,
                  }),
                ],
              }),
            ],
            shading: index === 0 ? { fill: "1a73e8", type: ShadingType.SOLID, color: "1a73e8" } : undefined,
          })
        ),
      })
    ),
  });
};

// Tạo bảng VaR/CVaR
const createVaRTable = (mcResult: MonteCarloResult, selectedVariable: string): Table => {
  const stats = mcResult.results[selectedVariable as keyof typeof mcResult.results]?.statistics;
  if (!stats) {
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: "Không có dữ liệu VaR/CVaR", size: 22 })] })],
            }),
          ],
        }),
      ],
    });
  }

  const rows = [
    ["Chỉ số rủi ro", "Giá trị", "Giải thích"],
    ["VaR 95%", formatNumber(stats.var95), "5% xác suất kết quả thấp hơn mức này"],
    ["VaR 99%", formatNumber(stats.var99), "1% xác suất kết quả thấp hơn mức này"],
    ["CVaR 95% (ES)", formatNumber(stats.cvar95), "Trung bình tổn thất trong 5% kịch bản xấu nhất"],
    ["CVaR 99% (ES)", formatNumber(stats.cvar99), "Trung bình tổn thất trong 1% kịch bản xấu nhất"],
    ["Percentile 5%", formatNumber(stats.percentile5), "Giá trị tại phân vị 5%"],
    ["Percentile 95%", formatNumber(stats.percentile95), "Giá trị tại phân vị 95%"],
    ["Độ lệch chuẩn", formatNumber(stats.stdDev), "Độ biến động của kết quả"],
  ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map((row, index) =>
      new TableRow({
        children: row.map((cell, cellIndex) =>
          new TableCell({
            children: [
              new Paragraph({
                alignment: cellIndex === 1 ? AlignmentType.RIGHT : AlignmentType.LEFT,
                children: [
                  new TextRun({
                    text: cell,
                    bold: index === 0,
                    size: 22,
                    color: index === 0 ? "FFFFFF" : undefined,
                  }),
                ],
              }),
            ],
            shading: index === 0 ? { fill: "9c27b0", type: ShadingType.SOLID, color: "9c27b0" } : undefined,
          })
        ),
      })
    ),
  });
};

// Tạo bảng thống kê Monte Carlo
const createMonteCarloStatsTable = (mcResult: MonteCarloResult, selectedVariable: string): Table => {
  const stats = mcResult.results[selectedVariable as keyof typeof mcResult.results]?.statistics;
  if (!stats) {
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: "Không có dữ liệu thống kê", size: 22 })] })],
            }),
          ],
        }),
      ],
    });
  }

  const rows = [
    ["Thống kê", "Giá trị"],
    ["Số lần mô phỏng", mcResult.iterations.toString()],
    ["Giá trị nhỏ nhất", formatNumber(stats.min)],
    ["Giá trị lớn nhất", formatNumber(stats.max)],
    ["Trung bình (Mean)", formatNumber(stats.mean)],
    ["Trung vị (Median)", formatNumber(stats.median)],
    ["Độ lệch chuẩn", formatNumber(stats.stdDev)],
    ["Skewness", stats.skewness.toFixed(4)],
    ["Kurtosis", stats.kurtosis.toFixed(4)],
  ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map((row, index) =>
      new TableRow({
        children: row.map((cell, cellIndex) =>
          new TableCell({
            children: [
              new Paragraph({
                alignment: cellIndex === 1 ? AlignmentType.RIGHT : AlignmentType.LEFT,
                children: [
                  new TextRun({
                    text: cell,
                    bold: index === 0,
                    size: 22,
                    color: index === 0 ? "FFFFFF" : undefined,
                  }),
                ],
              }),
            ],
            shading: index === 0 ? { fill: "ff9800", type: ShadingType.SOLID, color: "ff9800" } : undefined,
          })
        ),
      })
    ),
  });
};

// Tạo bảng phân tích độ nhạy
const createRiskFactorsTable = (params: ProjectParams, results: ProjectResults): Table => {
  const riskFactors = [
    {
      factor: "Rủi ro lãi suất",
      level: results.irrTIPV - results.waccAverage < 0.05 ? "Cao" : results.irrTIPV - results.waccAverage < 0.1 ? "Trung bình" : "Thấp",
      impact: "IRR gần WACC, biến động lãi suất có thể làm dự án lỗ",
      mitigation: "Đàm phán lãi suất cố định hoặc sử dụng công cụ phái sinh",
    },
    {
      factor: "Rủi ro thanh khoản",
      level: results.dscrAverage < 1.2 ? "Cao" : results.dscrAverage < 1.5 ? "Trung bình" : "Thấp",
      impact: "DSCR thấp có thể gặp khó khăn trả nợ",
      mitigation: "Kéo dài kỳ hạn vay hoặc tăng vốn chủ sở hữu",
    },
    {
      factor: "Rủi ro giá bán",
      level: params.realPriceChange < -5 ? "Cao" : params.realPriceChange < 0 ? "Trung bình" : "Thấp",
      impact: "Giá bán thực giảm theo thời gian",
      mitigation: "Chiến lược nâng cao giá trị sản phẩm",
    },
    {
      factor: "Rủi ro đòn bẩy",
      level: params.debtRatio > 70 ? "Cao" : params.debtRatio > 50 ? "Trung bình" : "Thấp",
      impact: "Tỷ lệ nợ cao, áp lực trả nợ lớn",
      mitigation: "Tái cơ cấu vốn, tăng vốn chủ sở hữu",
    },
    {
      factor: "Rủi ro lạm phát",
      level: params.inflationRate > 5 ? "Cao" : params.inflationRate > 3 ? "Trung bình" : "Thấp",
      impact: "Lạm phát cao ảnh hưởng chi phí và dòng tiền thực",
      mitigation: "Điều chỉnh giá bán theo lạm phát",
    },
  ];

  const rows = [
    ["Yếu tố rủi ro", "Mức độ", "Tác động", "Biện pháp giảm thiểu"],
    ...riskFactors.map((rf) => [rf.factor, rf.level, rf.impact, rf.mitigation]),
  ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map((row, index) =>
      new TableRow({
        children: row.map((cell) =>
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: cell,
                    bold: index === 0,
                    size: 20,
                    color: index === 0 ? "FFFFFF" : undefined,
                  }),
                ],
              }),
            ],
            shading: index === 0 ? { fill: "dc3545", type: ShadingType.SOLID, color: "dc3545" } : undefined,
          })
        ),
      })
    ),
  });
};

// Xuất báo cáo Word
export const exportRiskReportToWord = async (data: RiskReportData): Promise<void> => {
  const { params, results, monteCarloResult, selectedVariable = "npvTIPV" } = data;
  const riskLevel = getRiskLevel(results, monteCarloResult);
  const riskAssessment = generateRiskAssessment(results, monteCarloResult);

  const doc = new Document({
    sections: [
      {
        properties: {},
        headers: { default: createHeader(params.projectName) },
        footers: { default: createFooter() },
        children: [
          // Title
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
            children: [
              new TextRun({
                text: "BÁO CÁO PHÂN TÍCH RỦI RO DỰ ÁN ĐẦU TƯ",
                bold: true,
                size: 48,
                color: "1a73e8",
              }),
            ],
          }),

          // Subtitle
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: "(Theo mô hình Monte Carlo & Value at Risk)",
                italics: true,
                size: 24,
                color: "666666",
              }),
            ],
          }),

          // Project name
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
            children: [
              new TextRun({
                text: params.projectName,
                bold: true,
                size: 36,
              }),
            ],
          }),

          // Date
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 600 },
            children: [
              new TextRun({
                text: `Ngày lập: ${new Date().toLocaleDateString("vi-VN")}`,
                size: 22,
                color: "888888",
              }),
            ],
          }),

          // Risk Level Summary
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
            border: {
              top: { style: BorderStyle.SINGLE, size: 1, color: riskLevel.color },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: riskLevel.color },
              left: { style: BorderStyle.SINGLE, size: 1, color: riskLevel.color },
              right: { style: BorderStyle.SINGLE, size: 1, color: riskLevel.color },
            },
            children: [
              new TextRun({
                text: `MỨC ĐỘ RỦI RO TỔNG THỂ: ${riskLevel.level}`,
                bold: true,
                size: 32,
                color: riskLevel.color,
              }),
            ],
          }),

          // Section 1: Thông tin dự án
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
            children: [
              new TextRun({
                text: "1. THÔNG TIN DỰ ÁN",
                bold: true,
                size: 28,
                color: "1a73e8",
              }),
            ],
          }),
          createProjectInfoTable(params),

          // Section 2: Chỉ số tài chính
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
            children: [
              new TextRun({
                text: "2. CHỈ SỐ TÀI CHÍNH CHÍNH",
                bold: true,
                size: 28,
                color: "1a73e8",
              }),
            ],
          }),
          createFinancialMetricsTable(results),

          // Section 3: Monte Carlo Statistics (nếu có)
          ...(monteCarloResult
            ? [
                new Paragraph({
                  heading: HeadingLevel.HEADING_1,
                  spacing: { before: 400, after: 200 },
                  children: [
                    new TextRun({
                      text: "3. KẾT QUẢ MÔ PHỎNG MONTE CARLO",
                      bold: true,
                      size: 28,
                      color: "ff9800",
                    }),
                  ],
                }),
                createMonteCarloStatsTable(monteCarloResult, selectedVariable),
              ]
            : []),

          // Section 4: VaR/CVaR (nếu có)
          ...(monteCarloResult
            ? [
                new Paragraph({
                  heading: HeadingLevel.HEADING_1,
                  spacing: { before: 400, after: 200 },
                  children: [
                    new TextRun({
                      text: "4. PHÂN TÍCH VALUE AT RISK (VaR) & CONDITIONAL VaR",
                      bold: true,
                      size: 28,
                      color: "9c27b0",
                    }),
                  ],
                }),
                createVaRTable(monteCarloResult, selectedVariable),
                new Paragraph({
                  spacing: { before: 200 },
                  children: [
                    new TextRun({
                      text: "Giải thích: VaR đo lường mức tổn thất tối đa có thể xảy ra tại một mức độ tin cậy. CVaR (Expected Shortfall) đo lường trung bình tổn thất trong các kịch bản xấu nhất, cung cấp thông tin bổ sung về đuôi phân phối rủi ro.",
                      italics: true,
                      size: 20,
                      color: "666666",
                    }),
                  ],
                }),
              ]
            : []),

          // Section 5: Risk Factors
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
            children: [
              new TextRun({
                text: monteCarloResult ? "5. PHÂN TÍCH CÁC YẾU TỐ RỦI RO" : "3. PHÂN TÍCH CÁC YẾU TỐ RỦI RO",
                bold: true,
                size: 28,
                color: "dc3545",
              }),
            ],
          }),
          createRiskFactorsTable(params, results),

          // Section 6: Risk Assessment
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
            children: [
              new TextRun({
                text: monteCarloResult ? "6. ĐÁNH GIÁ RỦI RO TỔNG HỢP" : "4. ĐÁNH GIÁ RỦI RO TỔNG HỢP",
                bold: true,
                size: 28,
                color: "28a745",
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: riskAssessment,
                size: 22,
              }),
            ],
          }),

          // Section 7: Recommendations
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
            children: [
              new TextRun({
                text: monteCarloResult ? "7. KHUYẾN NGHỊ" : "5. KHUYẾN NGHỊ",
                bold: true,
                size: 28,
                color: "17a2b8",
              }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({
                text: results.npvTIPV > 0
                  ? "Dự án có hiệu quả tài chính, có thể tiến hành đầu tư với các biện pháp quản lý rủi ro phù hợp."
                  : "Cần xem xét lại cơ cấu dự án trước khi quyết định đầu tư.",
                size: 22,
              }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({
                text: results.dscrAverage >= 1.2
                  ? "Khả năng trả nợ đảm bảo, có thể đàm phán với ngân hàng để vay vốn."
                  : "Cần tái cơ cấu kế hoạch vay vốn hoặc tăng vốn chủ sở hữu.",
                size: 22,
              }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({
                text: "Nên thực hiện đánh giá rủi ro định kỳ trong quá trình triển khai dự án.",
                size: 22,
              }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({
                text: "Xây dựng kế hoạch dự phòng cho các kịch bản xấu nhất được xác định qua phân tích Monte Carlo.",
                size: 22,
              }),
            ],
          }),

          // Signature
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { before: 600 },
            children: [
              new TextRun({
                text: "Người lập báo cáo",
                size: 22,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { before: 100 },
            children: [
              new TextRun({
                text: "(Ký và ghi rõ họ tên)",
                italics: true,
                size: 20,
                color: "888888",
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Bao-cao-rui-ro-${params.projectName.replace(/\s+/g, "-")}.docx`);
};
