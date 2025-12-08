import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { SimulationCard } from "./SimulationCard";
import { parseExcelFile, ParsedExcelData, exportToExcel } from "@/lib/excelParser";
import {
  Upload,
  FileSpreadsheet,
  Download,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertCircle,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface ExcelUploaderProps {
  onDataImport: (columnName: string, stats: { min: number; max: number; mean: number }) => void;
  simulationResults?: number[];
  simulationStats?: Record<string, number>;
}

export const ExcelUploader = ({
  onDataImport,
  simulationResults,
  simulationStats,
}: ExcelUploaderProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedExcelData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setFileName(file.name);

    try {
      const data = await parseExcelFile(file);
      setParsedData(data);
      toast.success(`Đã đọc ${data.rows.length} dòng dữ liệu từ file`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lỗi đọc file");
      setParsedData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportColumn = (columnName: string) => {
    if (!parsedData?.columnStats[columnName]) return;

    const stats = parsedData.columnStats[columnName];
    onDataImport(columnName, stats);
    toast.success(`Đã nhập dữ liệu từ cột "${columnName}"`);
  };

  const handleExportResults = () => {
    if (!simulationResults || simulationResults.length === 0) {
      toast.error("Chưa có kết quả mô phỏng để xuất");
      return;
    }

    exportToExcel(simulationResults, simulationStats || {});
    toast.success("Đã xuất kết quả ra file Excel");
  };

  const handleClearFile = () => {
    setParsedData(null);
    setFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(num);
  };

  return (
    <SimulationCard className="mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <FileSpreadsheet className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Nhập/Xuất Excel</h3>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-6 space-y-4">
              {/* Upload section */}
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Upload file Excel (.xlsx, .xls)
                </label>
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    className="hidden"
                    id="excel-upload"
                  />
                  <label
                    htmlFor="excel-upload"
                    className="flex-1 flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-muted/50 border border-dashed border-border hover:border-primary/50 cursor-pointer transition-all text-sm text-muted-foreground hover:text-foreground"
                  >
                    <Upload className="w-4 h-4" />
                    {fileName || "Chọn file Excel..."}
                  </label>
                  {fileName && (
                    <Button variant="ghost" size="sm" onClick={handleClearFile} className="h-10">
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Loading state */}
              {isLoading && (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  Đang đọc file...
                </div>
              )}

              {/* Parsed data */}
              {parsedData && !isLoading && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-green-500">
                    <CheckCircle className="w-4 h-4" />
                    <span>
                      Đã đọc {parsedData.rows.length} dòng, {parsedData.headers.length} cột số
                    </span>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {parsedData.headers.map((header) => {
                      const stats = parsedData.columnStats[header];
                      if (!stats) return null;

                      return (
                        <div
                          key={header}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50"
                        >
                          <div>
                            <div className="font-medium text-sm">{header}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Min: {formatNumber(stats.min)} | Max: {formatNumber(stats.max)} | TB:{" "}
                              {formatNumber(stats.mean)}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleImportColumn(header)}
                          >
                            Sử dụng
                          </Button>
                        </div>
                      );
                    })}
                  </div>

                  {parsedData.headers.length === 0 && (
                    <div className="flex items-center gap-2 text-sm text-yellow-500">
                      <AlertCircle className="w-4 h-4" />
                      <span>Không tìm thấy cột số trong file</span>
                    </div>
                  )}
                </div>
              )}

              {/* Export section */}
              <div className="pt-4 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportResults}
                  disabled={!simulationResults || simulationResults.length === 0}
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Xuất kết quả ra Excel
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </SimulationCard>
  );
};
