import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FileText, Upload, Table2, TrendingUp, AlertCircle, CheckCircle, Download, Trash2, FileSpreadsheet, File } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface FinancialData {
  fileName: string;
  fileType: "excel" | "pdf";
  sheets: SheetData[];
  summary?: FinancialSummary;
}

interface SheetData {
  name: string;
  headers: string[];
  rows: Record<string, string | number>[];
}

interface FinancialSummary {
  totalRevenue?: number;
  totalExpenses?: number;
  netIncome?: number;
  totalAssets?: number;
  totalLiabilities?: number;
  equity?: number;
  cashFlow?: number;
  detectedMetrics: { name: string; value: number; unit: string }[];
}

// Danh sách từ khóa để nhận diện các chỉ số tài chính
const financialKeywords: Record<string, string[]> = {
  revenue: ["doanh thu", "revenue", "sales", "tổng doanh thu", "doanh số", "net sales"],
  expenses: ["chi phí", "expense", "cost", "giá vốn", "operating expenses", "tổng chi phí"],
  netIncome: ["lợi nhuận ròng", "net income", "profit", "lãi ròng", "thu nhập ròng", "lợi nhuận sau thuế"],
  assets: ["tài sản", "assets", "total assets", "tổng tài sản"],
  liabilities: ["nợ phải trả", "liabilities", "total liabilities", "công nợ"],
  equity: ["vốn chủ sở hữu", "equity", "shareholders equity", "vốn cổ đông"],
  cashFlow: ["dòng tiền", "cash flow", "tiền mặt", "lưu chuyển tiền"],
  ebit: ["ebit", "thu nhập trước thuế và lãi", "operating income"],
  ebitda: ["ebitda"],
  grossProfit: ["lợi nhuận gộp", "gross profit", "lãi gộp"],
};

const formatNumber = (value: number): string => {
  if (Math.abs(value) >= 1e9) {
    return (value / 1e9).toFixed(2) + " tỷ";
  }
  if (Math.abs(value) >= 1e6) {
    return (value / 1e6).toFixed(2) + " triệu";
  }
  return value.toLocaleString("vi-VN");
};

const detectFinancialMetrics = (data: SheetData[]): FinancialSummary => {
  const detectedMetrics: { name: string; value: number; unit: string }[] = [];
  let summary: Partial<FinancialSummary> = {};

  data.forEach((sheet) => {
    sheet.rows.forEach((row) => {
      const rowText = Object.keys(row)
        .map((key) => String(row[key]).toLowerCase())
        .join(" ");

      Object.entries(financialKeywords).forEach(([metricKey, keywords]) => {
        keywords.forEach((keyword) => {
          if (rowText.includes(keyword.toLowerCase())) {
            // Tìm giá trị số trong row
            Object.values(row).forEach((cellValue) => {
              const numValue = typeof cellValue === "number" ? cellValue : parseFloat(String(cellValue).replace(/[,\.]/g, ""));
              if (!isNaN(numValue) && numValue !== 0) {
                detectedMetrics.push({
                  name: keyword,
                  value: numValue,
                  unit: numValue >= 1e6 ? "triệu" : "",
                });

                // Map to summary
                if (metricKey === "revenue" && !summary.totalRevenue) {
                  summary.totalRevenue = numValue;
                } else if (metricKey === "expenses" && !summary.totalExpenses) {
                  summary.totalExpenses = numValue;
                } else if (metricKey === "netIncome" && !summary.netIncome) {
                  summary.netIncome = numValue;
                } else if (metricKey === "assets" && !summary.totalAssets) {
                  summary.totalAssets = numValue;
                } else if (metricKey === "liabilities" && !summary.totalLiabilities) {
                  summary.totalLiabilities = numValue;
                } else if (metricKey === "equity" && !summary.equity) {
                  summary.equity = numValue;
                } else if (metricKey === "cashFlow" && !summary.cashFlow) {
                  summary.cashFlow = numValue;
                }
              }
            });
          }
        });
      });
    });
  });

  return {
    ...summary,
    detectedMetrics: detectedMetrics.slice(0, 20), // Giới hạn 20 chỉ số
  };
};

export function FinancialStatementReader() {
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeSheet, setActiveSheet] = useState(0);

  const handleExcelUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast.error("Vui lòng chọn file Excel (.xlsx, .xls) hoặc CSV");
      return;
    }

    setIsLoading(true);
    setProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 15, 90));
      }, 100);

      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: "binary" });

          const sheets: SheetData[] = workbook.SheetNames.map((sheetName) => {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: "" });

            if (jsonData.length === 0) {
              return { name: sheetName, headers: [], rows: [] };
            }

            const headers = Object.keys(jsonData[0]);
            const rows = jsonData.map((row) => {
              const processedRow: Record<string, string | number> = {};
              headers.forEach((header) => {
                const value = row[header];
                if (typeof value === "number") {
                  processedRow[header] = value;
                } else {
                  processedRow[header] = String(value || "");
                }
              });
              return processedRow;
            });

            return { name: sheetName, headers, rows };
          });

          const summary = detectFinancialMetrics(sheets);

          setFinancialData({
            fileName: file.name,
            fileType: "excel",
            sheets,
            summary,
          });

          clearInterval(progressInterval);
          setProgress(100);
          toast.success(`Đã đọc thành công ${sheets.length} sheet từ file Excel`);
        } catch (error) {
          toast.error("Không thể đọc file Excel");
        } finally {
          setTimeout(() => {
            setIsLoading(false);
            setProgress(0);
          }, 500);
        }
      };

      reader.onerror = () => {
        clearInterval(progressInterval);
        toast.error("Lỗi khi đọc file");
        setIsLoading(false);
      };

      reader.readAsBinaryString(file);
    } catch (error) {
      toast.error("Có lỗi xảy ra khi xử lý file");
      setIsLoading(false);
    }

    event.target.value = "";
  }, []);

  const handlePDFUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.pdf$/i)) {
      toast.error("Vui lòng chọn file PDF");
      return;
    }

    setIsLoading(true);
    setProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 85));
      }, 150);

      // Dynamic import for pdfjs-dist
      const pdfjsLib = await import("pdfjs-dist");
      
      // Set worker source
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      const allText: string[] = [];
      const extractedRows: Record<string, string | number>[] = [];

      for (let i = 1; i <= Math.min(pdf.numPages, 50); i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(" ");
        allText.push(pageText);

        // Cố gắng parse các dòng thành bảng
        const lines = pageText.split(/[\n\r]+/);
        lines.forEach((line, lineIndex) => {
          const parts = line.split(/\s{2,}|\t/);
          if (parts.length >= 2) {
            const row: Record<string, string | number> = {
              STT: lineIndex + 1,
              "Nội dung": parts[0] || "",
            };
            parts.slice(1).forEach((part, idx) => {
              const numValue = parseFloat(part.replace(/[,\.]/g, "").replace(/\s/g, ""));
              row[`Cột ${idx + 2}`] = !isNaN(numValue) ? numValue : part;
            });
            extractedRows.push(row);
          }
        });
      }

      const sheets: SheetData[] = [
        {
          name: "Nội dung PDF",
          headers: extractedRows.length > 0 ? Object.keys(extractedRows[0]) : ["Nội dung"],
          rows: extractedRows.length > 0 ? extractedRows : [{ "Nội dung": allText.join("\n\n") }],
        },
      ];

      const summary = detectFinancialMetrics(sheets);

      setFinancialData({
        fileName: file.name,
        fileType: "pdf",
        sheets,
        summary,
      });

      clearInterval(progressInterval);
      setProgress(100);
      toast.success(`Đã đọc thành công ${pdf.numPages} trang PDF`);
    } catch (error) {
      console.error("PDF parsing error:", error);
      toast.error("Không thể đọc file PDF. Vui lòng thử file khác.");
    } finally {
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 500);
    }

    event.target.value = "";
  }, []);

  const handleClear = useCallback(() => {
    setFinancialData(null);
    setActiveSheet(0);
  }, []);

  const currentSheet = financialData?.sheets[activeSheet];

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Đọc báo cáo tài chính
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Excel Upload */}
            <div className="p-6 rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors">
              <div className="text-center">
                <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 text-green-600" />
                <h3 className="font-medium mb-2">File Excel / CSV</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Hỗ trợ .xlsx, .xls, .csv
                </p>
                <Label htmlFor="excel-upload" className="cursor-pointer">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    <Upload className="w-4 h-4" />
                    Chọn file Excel
                  </div>
                  <Input
                    id="excel-upload"
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={handleExcelUpload}
                    disabled={isLoading}
                  />
                </Label>
              </div>
            </div>

            {/* PDF Upload */}
            <div className="p-6 rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors">
              <div className="text-center">
                <File className="w-12 h-12 mx-auto mb-3 text-red-600" />
                <h3 className="font-medium mb-2">File PDF</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Báo cáo tài chính dạng PDF
                </p>
                <Label htmlFor="pdf-upload" className="cursor-pointer">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                    <Upload className="w-4 h-4" />
                    Chọn file PDF
                  </div>
                  <Input
                    id="pdf-upload"
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={handlePDFUpload}
                    disabled={isLoading}
                  />
                </Label>
              </div>
            </div>
          </div>

          {/* Loading Progress */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 space-y-2"
              >
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-center text-muted-foreground">
                  Đang xử lý file... {progress}%
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Results Section */}
      <AnimatePresence>
        {financialData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* File Info */}
            <Card className="glass">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {financialData.fileType === "excel" ? (
                      <FileSpreadsheet className="w-8 h-8 text-green-600" />
                    ) : (
                      <File className="w-8 h-8 text-red-600" />
                    )}
                    <div>
                      <h3 className="font-medium">{financialData.fileName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {financialData.sheets.length} sheet(s) •{" "}
                        {financialData.sheets.reduce((acc, s) => acc + s.rows.length, 0)} dòng dữ liệu
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleClear}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Xóa
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Financial Summary */}
            {financialData.summary && financialData.summary.detectedMetrics.length > 0 && (
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Chỉ số tài chính nhận diện được
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {financialData.summary.totalRevenue && (
                      <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                        <p className="text-xs text-muted-foreground mb-1">Tổng doanh thu</p>
                        <p className="text-lg font-bold text-green-600">
                          {formatNumber(financialData.summary.totalRevenue)}
                        </p>
                      </div>
                    )}
                    {financialData.summary.totalExpenses && (
                      <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                        <p className="text-xs text-muted-foreground mb-1">Tổng chi phí</p>
                        <p className="text-lg font-bold text-red-600">
                          {formatNumber(financialData.summary.totalExpenses)}
                        </p>
                      </div>
                    )}
                    {financialData.summary.netIncome && (
                      <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <p className="text-xs text-muted-foreground mb-1">Lợi nhuận ròng</p>
                        <p className="text-lg font-bold text-blue-600">
                          {formatNumber(financialData.summary.netIncome)}
                        </p>
                      </div>
                    )}
                    {financialData.summary.totalAssets && (
                      <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                        <p className="text-xs text-muted-foreground mb-1">Tổng tài sản</p>
                        <p className="text-lg font-bold text-purple-600">
                          {formatNumber(financialData.summary.totalAssets)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Detected Metrics List */}
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Các chỉ số khác:</p>
                    <div className="flex flex-wrap gap-2">
                      {financialData.summary.detectedMetrics.slice(0, 12).map((metric, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {metric.name}: {formatNumber(metric.value)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Data Table */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Table2 className="w-5 h-5 text-primary" />
                  Dữ liệu chi tiết
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Sheet Tabs */}
                {financialData.sheets.length > 1 && (
                  <Tabs
                    value={activeSheet.toString()}
                    onValueChange={(v) => setActiveSheet(parseInt(v))}
                    className="mb-4"
                  >
                    <TabsList className="flex-wrap h-auto">
                      {financialData.sheets.map((sheet, idx) => (
                        <TabsTrigger key={idx} value={idx.toString()}>
                          {sheet.name}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                )}

                {/* Data Table */}
                {currentSheet && currentSheet.rows.length > 0 ? (
                  <div className="max-h-[500px] overflow-auto border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {currentSheet.headers.map((header, idx) => (
                            <TableHead key={idx} className="whitespace-nowrap">
                              {header}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentSheet.rows.slice(0, 100).map((row, rowIdx) => (
                          <TableRow key={rowIdx}>
                            {currentSheet.headers.map((header, cellIdx) => (
                              <TableCell key={cellIdx} className="whitespace-nowrap">
                                {typeof row[header] === "number"
                                  ? formatNumber(row[header] as number)
                                  : String(row[header] || "")}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {currentSheet.rows.length > 100 && (
                      <div className="p-3 text-center text-sm text-muted-foreground border-t">
                        Hiển thị 100/{currentSheet.rows.length} dòng đầu tiên
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Không có dữ liệu trong sheet này</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
