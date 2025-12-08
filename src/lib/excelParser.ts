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
