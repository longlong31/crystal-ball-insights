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

// Mapping tên tiếng Việt sang key ProjectParams
export const projectParamLabels: Record<string, keyof import("./projectModel").ProjectParams> = {
  "Tên dự án": "projectName",
  "Năm đầu tư": "investmentYear",
  "Số năm hoạt động": "operationYears",
  "Năm thanh lý": "liquidationYear",
  "Diện tích đất (m2)": "landArea",
  "Giá thuê đất (tr/m2/năm)": "landRentPrice",
  "Điều chỉnh sau (năm)": "landRentAdjustmentYears",
  "Giá trị TSCĐ (triệu)": "fixedAssetValue",
  "Đời sống TSCĐ (năm)": "fixedAssetLife",
  "Giá trị TSVH (triệu)": "intangibleAssetValue",
  "Số năm phân bổ TSVH": "intangibleAssetLife",
  "Công suất thiết kế": "designCapacity",
  "Tỷ lệ tồn kho (%)": "inventoryRate",
  "Giá bán năm 0 (triệu)": "basePrice",
  "Thay đổi giá thực (%/năm)": "realPriceChange",
  "Chi phí linh kiện (triệu)": "componentCost",
  "Điện và bao bì (triệu)": "electricityPackaging",
  "Số công nhân": "workers",
  "Lương công nhân (triệu/tháng)": "workerSalary",
  "Số kỹ sư": "engineers",
  "Lương kỹ sư (triệu/tháng)": "engineerSalary",
  "Tăng lương thực (%/năm)": "realSalaryIncrease",
  "Chi phí quản lý (triệu/năm)": "adminCost",
  "Chi phí QL năm thanh lý (%)": "adminCostLiquidationRate",
  "Khoản phải thu (% DT)": "arRate",
  "Khoản phải trả (% CP LK)": "apRate",
  "Số dư tiền mặt (% DT)": "cashBalanceRate",
  "Tỷ lệ vay (%)": "debtRatio",
  "Lãi suất danh nghĩa (%)": "nominalInterestRate",
  "Số năm trả nợ": "loanTerm",
  "Suất sinh lời thực VCSH (%)": "realEquityReturn",
  "Thuế TNDN (%)": "corporateTaxRate",
  "Lạm phát (%/năm)": "inflationRate",
};

// Interface cho dữ liệu dự án nhập từ Excel
export interface ParsedProjectData {
  params: Partial<import("./projectModel").ProjectParams>;
  capacitySchedule?: number[];
  warnings: string[];
}

// Parse file Excel để lấy thông số dự án
export const parseProjectExcelFile = async (file: File): Promise<ParsedProjectData> => {
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

        const params: Partial<import("./projectModel").ProjectParams> = {};
        const capacitySchedule: number[] = [];
        const warnings: string[] = [];

        // Tìm cột chứa tên tham số và giá trị
        const firstRow = jsonData[0];
        const keys = Object.keys(firstRow);

        // Thử nhiều format khác nhau
        // Format 1: Dữ liệu dọc với cột "Tham số" và "Giá trị"
        const paramColName = keys.find((k) =>
          k.toLowerCase().includes("tham số") || k.toLowerCase().includes("thông số") || k.toLowerCase() === "tên"
        );
        const valueColName = keys.find((k) =>
          k.toLowerCase().includes("giá trị") || k.toLowerCase() === "value"
        );

        if (paramColName && valueColName) {
          // Format dọc
          jsonData.forEach((row) => {
            const label = String(row[paramColName] || "").trim();
            const value = row[valueColName];

            // Xử lý công suất theo năm
            if (label.startsWith("Công suất năm")) {
              const yearMatch = label.match(/năm\s*(\d+)/i);
              if (yearMatch) {
                const yearIndex = parseInt(yearMatch[1]) - 1;
                const numValue = typeof value === "number" ? value : parseFloat(String(value));
                if (!isNaN(numValue)) {
                  while (capacitySchedule.length <= yearIndex) {
                    capacitySchedule.push(0);
                  }
                  capacitySchedule[yearIndex] = numValue;
                }
              }
              return;
            }

            const paramKey = projectParamLabels[label];
            if (paramKey) {
              if (paramKey === "projectName") {
                (params as Record<string, unknown>)[paramKey] = String(value);
              } else {
                const numValue = typeof value === "number" ? value : parseFloat(String(value));
                if (!isNaN(numValue)) {
                  (params as Record<string, unknown>)[paramKey] = numValue;
                } else {
                  warnings.push(`Không thể chuyển đổi giá trị "${value}" cho "${label}"`);
                }
              }
            }
          });
        } else {
          // Format 2: Dữ liệu ngang với tên cột là tên tham số
          keys.forEach((key) => {
            const label = key.trim();
            const value = firstRow[key];

            // Xử lý công suất theo năm
            if (label.startsWith("Công suất năm")) {
              const yearMatch = label.match(/năm\s*(\d+)/i);
              if (yearMatch) {
                const yearIndex = parseInt(yearMatch[1]) - 1;
                const numValue = typeof value === "number" ? value : parseFloat(String(value));
                if (!isNaN(numValue)) {
                  while (capacitySchedule.length <= yearIndex) {
                    capacitySchedule.push(0);
                  }
                  capacitySchedule[yearIndex] = numValue;
                }
              }
              return;
            }

            const paramKey = projectParamLabels[label];
            if (paramKey) {
              if (paramKey === "projectName") {
                (params as Record<string, unknown>)[paramKey] = String(value);
              } else {
                const numValue = typeof value === "number" ? value : parseFloat(String(value));
                if (!isNaN(numValue)) {
                  (params as Record<string, unknown>)[paramKey] = numValue;
                }
              }
            }
          });
        }

        if (Object.keys(params).length === 0) {
          reject(new Error("Không tìm thấy thông số dự án hợp lệ trong file"));
          return;
        }

        resolve({
          params,
          capacitySchedule: capacitySchedule.length > 0 ? capacitySchedule : undefined,
          warnings,
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

// Xuất template Excel cho nhập dữ liệu dự án
export const exportProjectTemplate = (filename: string = "project-template.xlsx"): void => {
  const workbook = XLSX.utils.book_new();

  const templateData = [
    { "Tham số": "Tên dự án", "Giá trị": "Dự án mới", "Ghi chú": "Tên dự án" },
    { "Tham số": "Năm đầu tư", "Giá trị": 0, "Ghi chú": "Năm 0" },
    { "Tham số": "Số năm hoạt động", "Giá trị": 8, "Ghi chú": "Số năm" },
    { "Tham số": "Năm thanh lý", "Giá trị": 9, "Ghi chú": "Năm cuối" },
    { "Tham số": "Diện tích đất (m2)", "Giá trị": 4000, "Ghi chú": "m2" },
    { "Tham số": "Giá thuê đất (tr/m2/năm)", "Giá trị": 0.2, "Ghi chú": "triệu đồng/m2/năm" },
    { "Tham số": "Điều chỉnh sau (năm)", "Giá trị": 3, "Ghi chú": "năm" },
    { "Tham số": "Giá trị TSCĐ (triệu)", "Giá trị": 50000, "Ghi chú": "triệu đồng" },
    { "Tham số": "Đời sống TSCĐ (năm)", "Giá trị": 10, "Ghi chú": "năm" },
    { "Tham số": "Giá trị TSVH (triệu)", "Giá trị": 20000, "Ghi chú": "triệu đồng" },
    { "Tham số": "Số năm phân bổ TSVH", "Giá trị": 8, "Ghi chú": "năm" },
    { "Tham số": "Công suất thiết kế", "Giá trị": 45000, "Ghi chú": "sản phẩm/năm" },
    { "Tham số": "Tỷ lệ tồn kho (%)", "Giá trị": 10, "Ghi chú": "%" },
    { "Tham số": "Công suất năm 1", "Giá trị": 80, "Ghi chú": "% công suất" },
    { "Tham số": "Công suất năm 2", "Giá trị": 80, "Ghi chú": "% công suất" },
    { "Tham số": "Công suất năm 3", "Giá trị": 90, "Ghi chú": "% công suất" },
    { "Tham số": "Công suất năm 4", "Giá trị": 90, "Ghi chú": "% công suất" },
    { "Tham số": "Công suất năm 5", "Giá trị": 90, "Ghi chú": "% công suất" },
    { "Tham số": "Công suất năm 6", "Giá trị": 95, "Ghi chú": "% công suất" },
    { "Tham số": "Công suất năm 7", "Giá trị": 95, "Ghi chú": "% công suất" },
    { "Tham số": "Công suất năm 8", "Giá trị": 95, "Ghi chú": "% công suất" },
    { "Tham số": "Giá bán năm 0 (triệu)", "Giá trị": 12, "Ghi chú": "triệu đồng/SP" },
    { "Tham số": "Thay đổi giá thực (%/năm)", "Giá trị": -6, "Ghi chú": "%/năm" },
    { "Tham số": "Chi phí linh kiện (triệu)", "Giá trị": 9, "Ghi chú": "triệu đồng/SP" },
    { "Tham số": "Điện và bao bì (triệu)", "Giá trị": 0.4, "Ghi chú": "triệu đồng/SP" },
    { "Tham số": "Số công nhân", "Giá trị": 40, "Ghi chú": "người" },
    { "Tham số": "Lương công nhân (triệu/tháng)", "Giá trị": 10, "Ghi chú": "triệu đồng/tháng" },
    { "Tham số": "Số kỹ sư", "Giá trị": 20, "Ghi chú": "người" },
    { "Tham số": "Lương kỹ sư (triệu/tháng)", "Giá trị": 15, "Ghi chú": "triệu đồng/tháng" },
    { "Tham số": "Tăng lương thực (%/năm)", "Giá trị": 6, "Ghi chú": "%/năm" },
    { "Tham số": "Chi phí quản lý (triệu/năm)", "Giá trị": 15000, "Ghi chú": "triệu đồng/năm" },
    { "Tham số": "Chi phí QL năm thanh lý (%)", "Giá trị": 10, "Ghi chú": "%" },
    { "Tham số": "Khoản phải thu (% DT)", "Giá trị": 6, "Ghi chú": "% doanh thu" },
    { "Tham số": "Khoản phải trả (% CP LK)", "Giá trị": 5, "Ghi chú": "% chi phí linh kiện" },
    { "Tham số": "Số dư tiền mặt (% DT)", "Giá trị": 0.2, "Ghi chú": "% doanh thu" },
    { "Tham số": "Tỷ lệ vay (%)", "Giá trị": 60, "Ghi chú": "%" },
    { "Tham số": "Lãi suất danh nghĩa (%)", "Giá trị": 12, "Ghi chú": "%/năm" },
    { "Tham số": "Số năm trả nợ", "Giá trị": 3, "Ghi chú": "năm" },
    { "Tham số": "Suất sinh lời thực VCSH (%)", "Giá trị": 12, "Ghi chú": "%/năm" },
    { "Tham số": "Thuế TNDN (%)", "Giá trị": 20, "Ghi chú": "%" },
    { "Tham số": "Lạm phát (%/năm)", "Giá trị": 5, "Ghi chú": "%/năm" },
  ];

  const templateSheet = XLSX.utils.json_to_sheet(templateData);
  XLSX.utils.book_append_sheet(workbook, templateSheet, "Thông số dự án");

  XLSX.writeFile(workbook, filename);
};
