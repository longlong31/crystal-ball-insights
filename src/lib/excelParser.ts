import * as XLSX from "xlsx";

export interface ParsedExcelData {
  headers: string[];
  rows: Record<string, number>[];
  columnStats: Record<string, { min: number; max: number; mean: number }>;
}

export const parseExcelFile = async (file: File): Promise<ParsedExcelData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);
        
        if (jsonData.length === 0) {
          reject(new Error("File Excel không có dữ liệu"));
          return;
        }
        
        const headers = Object.keys(jsonData[0]);
        const numericHeaders = headers.filter((header) => {
          return jsonData.some((row) => typeof row[header] === "number");
        });
        
        const rows = jsonData.map((row) => {
          const numericRow: Record<string, number> = {};
          numericHeaders.forEach((header) => {
            const value = row[header];
            if (typeof value === "number") {
              numericRow[header] = value;
            } else if (typeof value === "string") {
              const parsed = parseFloat(value);
              if (!isNaN(parsed)) {
                numericRow[header] = parsed;
              }
            }
          });
          return numericRow;
        });
        
        const columnStats: Record<string, { min: number; max: number; mean: number }> = {};
        numericHeaders.forEach((header) => {
          const values = rows
            .map((row) => row[header])
            .filter((v) => v !== undefined && !isNaN(v));
          
          if (values.length > 0) {
            columnStats[header] = {
              min: Math.min(...values),
              max: Math.max(...values),
              mean: values.reduce((a, b) => a + b, 0) / values.length,
            };
          }
        });
        
        resolve({
          headers: numericHeaders,
          rows,
          columnStats,
        });
      } catch (error) {
        reject(new Error("Không thể đọc file Excel"));
      }
    };
    
    reader.onerror = () => {
      reject(new Error("Lỗi khi đọc file"));
    };
    
    reader.readAsBinaryString(file);
  });
};

export const exportToExcel = (
  data: number[],
  stats: Record<string, number>,
  filename: string = "simulation-results.xlsx"
): void => {
  const resultsData = data.map((value, index) => ({
    "Lần mô phỏng": index + 1,
    "Giá trị": value,
  }));
  
  const statsData = Object.entries(stats).map(([key, value]) => ({
    "Thống kê": key,
    "Giá trị": value,
  }));
  
  const workbook = XLSX.utils.book_new();
  
  const resultsSheet = XLSX.utils.json_to_sheet(resultsData);
  XLSX.utils.book_append_sheet(workbook, resultsSheet, "Kết quả mô phỏng");
  
  const statsSheet = XLSX.utils.json_to_sheet(statsData);
  XLSX.utils.book_append_sheet(workbook, statsSheet, "Thống kê");
  
  XLSX.writeFile(workbook, filename);
};

// Export kết quả phân tích dự án
export interface ProjectExportData {
  projectName: string;
  npvTIPV: number;
  irrTIPV: number;
  dppTIPV: number;
  dscrAverage: number;
  npvEPV: number;
  irrEPV: number;
  dppEPV: number;
  waccAverage: number;
  yearlyData: Array<{
    year: number;
    revenue: number;
    ncfTIPV: number;
    ncfEPV: number;
    cumulativePV_TIPV: number;
    cumulativePV_EPV: number;
    dscr: number;
  }>;
}

export interface MonteCarloExportData {
  iterations: number;
  resultVariable: string;
  statistics: {
    min: number;
    max: number;
    mean: number;
    stdDev: number;
    median: number;
    percentile5: number;
    percentile95: number;
  };
  values: number[];
}

export const exportProjectResults = (
  data: ProjectExportData,
  filename: string = "project-analysis-results.xlsx"
): void => {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Kết quả tổng hợp
  const summaryData = [
    { "Chỉ số": "Tên dự án", "Giá trị": data.projectName },
    { "Chỉ số": "NPV (TIPV)", "Giá trị": data.npvTIPV, "Đơn vị": "triệu đồng" },
    { "Chỉ số": "IRR (TIPV)", "Giá trị": (data.irrTIPV * 100).toFixed(2), "Đơn vị": "%" },
    { "Chỉ số": "DPP (TIPV)", "Giá trị": data.dppTIPV.toFixed(2), "Đơn vị": "năm" },
    { "Chỉ số": "DSCR bình quân", "Giá trị": data.dscrAverage.toFixed(2), "Đơn vị": "" },
    { "Chỉ số": "NPV (EPV)", "Giá trị": data.npvEPV, "Đơn vị": "triệu đồng" },
    { "Chỉ số": "IRR (EPV)", "Giá trị": (data.irrEPV * 100).toFixed(2), "Đơn vị": "%" },
    { "Chỉ số": "DPP (EPV)", "Giá trị": data.dppEPV.toFixed(2), "Đơn vị": "năm" },
    { "Chỉ số": "WACC bình quân", "Giá trị": (data.waccAverage * 100).toFixed(2), "Đơn vị": "%" },
  ];
  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Kết quả tổng hợp");

  // Sheet 2: Dữ liệu theo năm
  const yearlySheetData = data.yearlyData.map((year) => ({
    "Năm": year.year,
    "Doanh thu (tr)": year.revenue,
    "NCF TIPV (tr)": year.ncfTIPV,
    "NCF EPV (tr)": year.ncfEPV,
    "PV tích lũy TIPV (tr)": year.cumulativePV_TIPV,
    "PV tích lũy EPV (tr)": year.cumulativePV_EPV,
    "DSCR": year.dscr,
  }));
  const yearlySheet = XLSX.utils.json_to_sheet(yearlySheetData);
  XLSX.utils.book_append_sheet(workbook, yearlySheet, "Dữ liệu theo năm");

  XLSX.writeFile(workbook, filename);
};

export const exportMonteCarloResults = (
  data: MonteCarloExportData,
  filename: string = "monte-carlo-results.xlsx"
): void => {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Thống kê
  const statsData = [
    { "Chỉ số": "Biến kết quả", "Giá trị": data.resultVariable },
    { "Chỉ số": "Số lần lặp", "Giá trị": data.iterations },
    { "Chỉ số": "Giá trị nhỏ nhất", "Giá trị": data.statistics.min },
    { "Chỉ số": "Giá trị lớn nhất", "Giá trị": data.statistics.max },
    { "Chỉ số": "Trung bình", "Giá trị": data.statistics.mean },
    { "Chỉ số": "Độ lệch chuẩn", "Giá trị": data.statistics.stdDev },
    { "Chỉ số": "Trung vị", "Giá trị": data.statistics.median },
    { "Chỉ số": "Phân vị 5%", "Giá trị": data.statistics.percentile5 },
    { "Chỉ số": "Phân vị 95%", "Giá trị": data.statistics.percentile95 },
  ];
  const statsSheet = XLSX.utils.json_to_sheet(statsData);
  XLSX.utils.book_append_sheet(workbook, statsSheet, "Thống kê");

  // Sheet 2: Dữ liệu mô phỏng
  const simulationData = data.values.map((value, index) => ({
    "Lần mô phỏng": index + 1,
    "Giá trị": value,
  }));
  const simulationSheet = XLSX.utils.json_to_sheet(simulationData);
  XLSX.utils.book_append_sheet(workbook, simulationSheet, "Dữ liệu mô phỏng");

  XLSX.writeFile(workbook, filename);
};

export const exportFullProjectAnalysis = (
  projectData: ProjectExportData,
  monteCarloData: MonteCarloExportData | null,
  filename: string = "full-project-analysis.xlsx"
): void => {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Kết quả dự án
  const summaryData = [
    { "Chỉ số": "Tên dự án", "Giá trị": projectData.projectName, "Đơn vị": "" },
    { "Chỉ số": "NPV (TIPV)", "Giá trị": projectData.npvTIPV, "Đơn vị": "triệu đồng" },
    { "Chỉ số": "IRR (TIPV)", "Giá trị": (projectData.irrTIPV * 100).toFixed(2), "Đơn vị": "%" },
    { "Chỉ số": "DPP (TIPV)", "Giá trị": projectData.dppTIPV.toFixed(2), "Đơn vị": "năm" },
    { "Chỉ số": "DSCR bình quân", "Giá trị": projectData.dscrAverage.toFixed(2), "Đơn vị": "" },
    { "Chỉ số": "NPV (EPV)", "Giá trị": projectData.npvEPV, "Đơn vị": "triệu đồng" },
    { "Chỉ số": "IRR (EPV)", "Giá trị": (projectData.irrEPV * 100).toFixed(2), "Đơn vị": "%" },
    { "Chỉ số": "DPP (EPV)", "Giá trị": projectData.dppEPV.toFixed(2), "Đơn vị": "năm" },
    { "Chỉ số": "WACC bình quân", "Giá trị": (projectData.waccAverage * 100).toFixed(2), "Đơn vị": "%" },
  ];
  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Kết quả dự án");

  // Sheet 2: Dữ liệu theo năm
  const yearlySheetData = projectData.yearlyData.map((year) => ({
    "Năm": year.year,
    "Doanh thu (tr)": year.revenue,
    "NCF TIPV (tr)": year.ncfTIPV,
    "NCF EPV (tr)": year.ncfEPV,
    "PV tích lũy TIPV (tr)": year.cumulativePV_TIPV,
    "PV tích lũy EPV (tr)": year.cumulativePV_EPV,
    "DSCR": year.dscr,
  }));
  const yearlySheet = XLSX.utils.json_to_sheet(yearlySheetData);
  XLSX.utils.book_append_sheet(workbook, yearlySheet, "Dữ liệu theo năm");

  // Sheet 3 & 4: Monte Carlo (nếu có)
  if (monteCarloData) {
    const mcStatsData = [
      { "Chỉ số": "Biến kết quả", "Giá trị": monteCarloData.resultVariable },
      { "Chỉ số": "Số lần lặp", "Giá trị": monteCarloData.iterations },
      { "Chỉ số": "Giá trị nhỏ nhất", "Giá trị": monteCarloData.statistics.min },
      { "Chỉ số": "Giá trị lớn nhất", "Giá trị": monteCarloData.statistics.max },
      { "Chỉ số": "Trung bình", "Giá trị": monteCarloData.statistics.mean },
      { "Chỉ số": "Độ lệch chuẩn", "Giá trị": monteCarloData.statistics.stdDev },
      { "Chỉ số": "Trung vị", "Giá trị": monteCarloData.statistics.median },
      { "Chỉ số": "Phân vị 5%", "Giá trị": monteCarloData.statistics.percentile5 },
      { "Chỉ số": "Phân vị 95%", "Giá trị": monteCarloData.statistics.percentile95 },
    ];
    const mcStatsSheet = XLSX.utils.json_to_sheet(mcStatsData);
    XLSX.utils.book_append_sheet(workbook, mcStatsSheet, "Monte Carlo - Thống kê");

    const mcSimData = monteCarloData.values.map((value, index) => ({
      "Lần mô phỏng": index + 1,
      "Giá trị": value,
    }));
    const mcSimSheet = XLSX.utils.json_to_sheet(mcSimData);
    XLSX.utils.book_append_sheet(workbook, mcSimSheet, "Monte Carlo - Dữ liệu");
  }

  XLSX.writeFile(workbook, filename);
};
