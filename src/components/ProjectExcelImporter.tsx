import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { SimulationCard } from "./SimulationCard";
import { parseProjectExcelFile, exportProjectTemplate, ParsedProjectData } from "@/lib/excelParser";
import { ProjectParams, defaultProjectParams } from "@/lib/projectModel";
import {
  Upload,
  FileSpreadsheet,
  Download,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertCircle,
  X,
  FileDown,
} from "lucide-react";
import { toast } from "sonner";

interface ProjectExcelImporterProps {
  onImport: (params: ProjectParams) => void;
  currentParams: ProjectParams;
}

export const ProjectExcelImporter = ({ onImport, currentParams }: ProjectExcelImporterProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedProjectData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setFileName(file.name);

    try {
      const data = await parseProjectExcelFile(file);
      setParsedData(data);
      const paramCount = Object.keys(data.params).length;
      toast.success(`Đã đọc ${paramCount} thông số từ file`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lỗi đọc file");
      setParsedData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = () => {
    if (!parsedData) return;

    // Merge với params mặc định để đảm bảo có đủ tất cả các trường
    const newParams: ProjectParams = {
      ...defaultProjectParams,
      ...currentParams,
      ...parsedData.params,
    };

    // Cập nhật capacitySchedule nếu có
    if (parsedData.capacitySchedule && parsedData.capacitySchedule.length > 0) {
      newParams.capacitySchedule = parsedData.capacitySchedule;
    }

    onImport(newParams);
    toast.success("Đã nhập dữ liệu dự án thành công");
  };

  const handleDownloadTemplate = () => {
    exportProjectTemplate();
    toast.success("Đã tải template Excel");
  };

  const handleClearFile = () => {
    setParsedData(null);
    setFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatValue = (value: unknown): string => {
    if (typeof value === "number") {
      return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(value);
    }
    return String(value);
  };

  const getParamLabel = (key: string): string => {
    const labels: Record<string, string> = {
      projectName: "Tên dự án",
      investmentYear: "Năm đầu tư",
      operationYears: "Số năm hoạt động",
      liquidationYear: "Năm thanh lý",
      landArea: "Diện tích đất",
      landRentPrice: "Giá thuê đất",
      landRentAdjustmentYears: "Điều chỉnh sau",
      fixedAssetValue: "Giá trị TSCĐ",
      fixedAssetLife: "Đời sống TSCĐ",
      intangibleAssetValue: "Giá trị TSVH",
      intangibleAssetLife: "Số năm phân bổ TSVH",
      designCapacity: "Công suất thiết kế",
      inventoryRate: "Tỷ lệ tồn kho",
      basePrice: "Giá bán năm 0",
      realPriceChange: "Thay đổi giá thực",
      componentCost: "Chi phí linh kiện",
      electricityPackaging: "Điện và bao bì",
      workers: "Số công nhân",
      workerSalary: "Lương công nhân",
      engineers: "Số kỹ sư",
      engineerSalary: "Lương kỹ sư",
      realSalaryIncrease: "Tăng lương thực",
      adminCost: "Chi phí quản lý",
      adminCostLiquidationRate: "CP QL năm thanh lý",
      arRate: "Khoản phải thu",
      apRate: "Khoản phải trả",
      cashBalanceRate: "Số dư tiền mặt",
      debtRatio: "Tỷ lệ vay",
      nominalInterestRate: "Lãi suất danh nghĩa",
      loanTerm: "Số năm trả nợ",
      realEquityReturn: "Suất sinh lời VCSH",
      corporateTaxRate: "Thuế TNDN",
      inflationRate: "Lạm phát",
    };
    return labels[key] || key;
  };

  return (
    <SimulationCard className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <FileSpreadsheet className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Nhập từ Excel</h3>
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
              {/* Download template */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadTemplate}
                className="w-full"
              >
                <FileDown className="w-4 h-4 mr-2" />
                Tải template Excel
              </Button>

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
                    id="project-excel-upload"
                  />
                  <label
                    htmlFor="project-excel-upload"
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

              {/* Parsed data preview */}
              {parsedData && !isLoading && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-green-500">
                    <CheckCircle className="w-4 h-4" />
                    <span>Đã đọc {Object.keys(parsedData.params).length} thông số</span>
                  </div>

                  {/* Warnings */}
                  {parsedData.warnings.length > 0 && (
                    <div className="space-y-1">
                      {parsedData.warnings.map((warning, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-yellow-500">
                          <AlertCircle className="w-3 h-3" />
                          <span>{warning}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Preview params */}
                  <div className="max-h-48 overflow-y-auto space-y-1 text-sm">
                    {Object.entries(parsedData.params).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex justify-between items-center py-1 px-2 rounded bg-muted/30"
                      >
                        <span className="text-muted-foreground">{getParamLabel(key)}</span>
                        <span className="font-medium">{formatValue(value)}</span>
                      </div>
                    ))}
                    {parsedData.capacitySchedule && (
                      <div className="flex justify-between items-center py-1 px-2 rounded bg-muted/30">
                        <span className="text-muted-foreground">Công suất các năm</span>
                        <span className="font-medium">{parsedData.capacitySchedule.join(", ")}%</span>
                      </div>
                    )}
                  </div>

                  {/* Import button */}
                  <Button onClick={handleImport} className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Nhập dữ liệu vào dự án
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </SimulationCard>
  );
};
