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
import { Slider } from "@/components/ui/slider";
import { 
  FileText, Upload, Table2, TrendingUp, AlertCircle, CheckCircle, 
  Download, Trash2, FileSpreadsheet, File, Calculator, Sparkles,
  DollarSign, Percent, TrendingDown, BarChart3, PieChart, Activity,
  Brain, Lightbulb, Loader2, Wand2
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  AreaChart,
  Area,
  PieChart as RechartsPieChart,
  Pie,
} from "recharts";

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
  operatingCashFlow?: number;
  investingCashFlow?: number;
  financingCashFlow?: number;
  depreciation?: number;
  interestExpense?: number;
  taxExpense?: number;
  ebitda?: number;
  grossProfit?: number;
  operatingIncome?: number;
  detectedMetrics: { name: string; value: number; unit: string }[];
}

interface CrystalBallAnalysis {
  // Dòng tiền dự kiến
  cashFlows: number[];
  // Các chỉ số đầu vào
  initialInvestment: number;
  discountRate: number;
  projectYears: number;
  // Kết quả Crystal Ball
  npv: number;
  irr: number;
  paybackPeriod: number;
  profitabilityIndex: number;
  // Phân tích tài chính
  ratios: {
    currentRatio: number;
    debtToEquity: number;
    returnOnEquity: number;
    returnOnAssets: number;
    grossMargin: number;
    operatingMargin: number;
    netMargin: number;
    assetTurnover: number;
  };
  // Đánh giá
  recommendation: "strong_buy" | "buy" | "hold" | "sell" | "strong_sell";
  riskLevel: "low" | "medium" | "high" | "very_high";
  strengths: string[];
  weaknesses: string[];
}

// Danh sách từ khóa để nhận diện các chỉ số tài chính
const financialKeywords: Record<string, string[]> = {
  revenue: ["doanh thu", "revenue", "sales", "tổng doanh thu", "doanh số", "net sales", "doanh thu thuần"],
  expenses: ["chi phí", "expense", "cost", "giá vốn", "operating expenses", "tổng chi phí", "chi phí hoạt động"],
  netIncome: ["lợi nhuận ròng", "net income", "profit", "lãi ròng", "thu nhập ròng", "lợi nhuận sau thuế", "lãi sau thuế"],
  assets: ["tài sản", "assets", "total assets", "tổng tài sản"],
  liabilities: ["nợ phải trả", "liabilities", "total liabilities", "công nợ", "tổng nợ"],
  equity: ["vốn chủ sở hữu", "equity", "shareholders equity", "vốn cổ đông"],
  cashFlow: ["dòng tiền", "cash flow", "tiền mặt", "lưu chuyển tiền"],
  operatingCashFlow: ["dòng tiền hoạt động", "operating cash flow", "lưu chuyển tiền hoạt động"],
  investingCashFlow: ["dòng tiền đầu tư", "investing cash flow", "lưu chuyển tiền đầu tư"],
  depreciation: ["khấu hao", "depreciation", "amortization"],
  interestExpense: ["chi phí lãi vay", "interest expense", "lãi vay"],
  taxExpense: ["thuế", "tax expense", "chi phí thuế"],
  ebit: ["ebit", "thu nhập trước thuế và lãi", "operating income", "lợi nhuận hoạt động"],
  ebitda: ["ebitda", "thu nhập trước thuế lãi và khấu hao"],
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

const formatPercent = (value: number): string => {
  return (value * 100).toFixed(2) + "%";
};

const detectFinancialMetrics = (data: SheetData[]): FinancialSummary => {
  const detectedMetrics: { name: string; value: number; unit: string }[] = [];
  const summary: Partial<FinancialSummary> = {};

  data.forEach((sheet) => {
    sheet.rows.forEach((row) => {
      const rowText = Object.keys(row)
        .map((key) => String(row[key]).toLowerCase())
        .join(" ");

      Object.entries(financialKeywords).forEach(([metricKey, keywords]) => {
        keywords.forEach((keyword) => {
          if (rowText.includes(keyword.toLowerCase())) {
            Object.values(row).forEach((cellValue) => {
              const numValue = typeof cellValue === "number" ? cellValue : parseFloat(String(cellValue).replace(/[,\.]/g, ""));
              if (!isNaN(numValue) && numValue !== 0) {
                detectedMetrics.push({
                  name: keyword,
                  value: numValue,
                  unit: numValue >= 1e6 ? "triệu" : "",
                });

                // Map to summary
                const mappings: Record<string, keyof FinancialSummary> = {
                  revenue: "totalRevenue",
                  expenses: "totalExpenses",
                  netIncome: "netIncome",
                  assets: "totalAssets",
                  liabilities: "totalLiabilities",
                  equity: "equity",
                  cashFlow: "cashFlow",
                  operatingCashFlow: "operatingCashFlow",
                  investingCashFlow: "investingCashFlow",
                  depreciation: "depreciation",
                  interestExpense: "interestExpense",
                  taxExpense: "taxExpense",
                  ebitda: "ebitda",
                  grossProfit: "grossProfit",
                  ebit: "operatingIncome",
                };

                const summaryKey = mappings[metricKey];
                if (summaryKey && !(summaryKey in summary)) {
                  (summary as Record<string, number>)[summaryKey] = numValue;
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
    detectedMetrics: detectedMetrics.slice(0, 30),
  };
};

// Tính IRR bằng phương pháp Newton-Raphson
const calculateIRR = (cashFlows: number[], guess: number = 0.1): number => {
  const maxIterations = 100;
  const tolerance = 0.0001;
  let rate = guess;

  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let dnpv = 0;

    for (let j = 0; j < cashFlows.length; j++) {
      npv += cashFlows[j] / Math.pow(1 + rate, j);
      dnpv -= j * cashFlows[j] / Math.pow(1 + rate, j + 1);
    }

    const newRate = rate - npv / dnpv;
    
    if (Math.abs(newRate - rate) < tolerance) {
      return newRate;
    }
    
    rate = newRate;
  }

  return rate;
};

// Tính NPV
const calculateNPV = (cashFlows: number[], discountRate: number): number => {
  return cashFlows.reduce((npv, cf, i) => npv + cf / Math.pow(1 + discountRate, i), 0);
};

// Tính Payback Period
const calculatePaybackPeriod = (cashFlows: number[]): number => {
  let cumulative = 0;
  for (let i = 0; i < cashFlows.length; i++) {
    cumulative += cashFlows[i];
    if (cumulative >= 0) {
      const prevCumulative = cumulative - cashFlows[i];
      return i - prevCumulative / cashFlows[i];
    }
  }
  return cashFlows.length;
};

interface SelectedMetric {
  id?: string;
  name: string;
  value: number;
  unit: string;
  category: string;
  selected: boolean;
  useAs?: string; // Which analysis field to map to
  confidence?: number; // AI confidence 0-1
  source?: "rule" | "ai";
}

interface FinancialStatementReaderProps {
  onAnalysisComplete?: (analysis: CrystalBallAnalysis) => void;
}

export function FinancialStatementReader({ onAnalysisComplete }: FinancialStatementReaderProps) {
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeSheet, setActiveSheet] = useState(0);
  const [activeTab, setActiveTab] = useState("upload");
  
  // Metric selection
  const [selectedMetrics, setSelectedMetrics] = useState<SelectedMetric[]>([]);
  
  // Crystal Ball analysis parameters
  const [discountRate, setDiscountRate] = useState(12);
  const [projectYears, setProjectYears] = useState(10);
  const [initialInvestment, setInitialInvestment] = useState(0);
  const [growthRate, setGrowthRate] = useState(5);
  const [analysis, setAnalysis] = useState<CrystalBallAnalysis | null>(null);

  // AI extraction state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiExtraction, setAiExtraction] = useState<{
    insights: string[];
    warnings?: string[];
    dataQuality?: string;
    currency?: string;
    period?: string;
    unitMultiplier?: number;
    addedCount: number;
  } | null>(null);

  const runAIExtraction = useCallback(async () => {
    if (!financialData) {
      toast.error("Vui lòng upload file trước");
      return;
    }
    setAiLoading(true);
    try {
      // Send compact sheets (cap rows per sheet)
      const compactSheets = financialData.sheets.map(s => ({
        name: s.name,
        headers: s.headers,
        rows: s.rows.slice(0, 200),
      }));
      const { data, error } = await supabase.functions.invoke("ai-extract-financials", {
        body: { sheets: compactSheets, fileName: financialData.fileName },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const ext = data?.extraction;
      if (!ext?.metrics) throw new Error("AI không trả về dữ liệu hợp lệ");

      const mult = ext.unitMultiplier && ext.unitMultiplier > 0 ? ext.unitMultiplier : 1;
      const newMetrics: SelectedMetric[] = ext.metrics
        .filter((m: any) => typeof m.value === "number" && !isNaN(m.value))
        .map((m: any, i: number) => ({
          id: `ai-${Date.now()}-${i}`,
          name: m.name,
          value: m.value * mult,
          unit: Math.abs(m.value * mult) >= 1e6 ? "triệu" : "",
          category: m.category || "AI",
          selected: (m.confidence ?? 0) >= 0.6,
          useAs: m.useAs || undefined,
          confidence: typeof m.confidence === "number" ? m.confidence : undefined,
          source: "ai" as const,
        }));

      setSelectedMetrics(prev => {
        // Avoid exact duplicates by value+useAs
        const existing = new Set(prev.map(p => `${p.useAs || ""}_${p.value}`));
        const merged = [...prev];
        let added = 0;
        for (const nm of newMetrics) {
          const key = `${nm.useAs || ""}_${nm.value}`;
          if (!existing.has(key)) {
            merged.push(nm);
            existing.add(key);
            added++;
          }
        }
        setAiExtraction({
          insights: ext.insights || [],
          warnings: ext.warnings,
          dataQuality: ext.dataQuality,
          currency: ext.currency,
          period: ext.period,
          unitMultiplier: mult,
          addedCount: added,
        });
        toast.success(`AI trích xuất ${newMetrics.length} chỉ số (${added} mới)`);
        return merged;
      });
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "AI phân tích thất bại");
    } finally {
      setAiLoading(false);
    }
  }, [financialData]);

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

          // Build selectable metrics from summary
          const metrics: SelectedMetric[] = [];
          const categoryMap: Record<string, string> = {
            totalRevenue: "Doanh thu", totalExpenses: "Chi phí", netIncome: "Lợi nhuận",
            totalAssets: "Tài sản", totalLiabilities: "Nợ", equity: "Vốn",
            cashFlow: "Dòng tiền", operatingCashFlow: "Dòng tiền", investingCashFlow: "Dòng tiền",
            depreciation: "Khấu hao", interestExpense: "Chi phí", taxExpense: "Thuế",
            ebitda: "Lợi nhuận", grossProfit: "Lợi nhuận", operatingIncome: "Lợi nhuận",
          };
          const useAsMap: Record<string, string> = {
            totalRevenue: "revenue", totalExpenses: "expenses", netIncome: "netIncome",
            totalAssets: "assets", totalLiabilities: "liabilities", equity: "equity",
            cashFlow: "cashFlow", operatingCashFlow: "operatingCashFlow",
            investingCashFlow: "investingCashFlow", depreciation: "depreciation",
            interestExpense: "interestExpense", taxExpense: "taxExpense",
            ebitda: "ebitda", grossProfit: "grossProfit", operatingIncome: "operatingIncome",
          };
          
          Object.entries(summary).forEach(([key, value]) => {
            if (key === "detectedMetrics" || value === undefined || value === null) return;
            if (typeof value === "number" && value !== 0) {
              metrics.push({
                name: key,
                value: value as number,
                unit: Math.abs(value as number) >= 1e6 ? "triệu" : "",
                category: categoryMap[key] || "Khác",
                selected: true, // Auto-select all
                useAs: useAsMap[key],
              });
            }
          });
          
          // Add detected metrics that weren't in summary
          if (summary.detectedMetrics) {
            summary.detectedMetrics.forEach((m) => {
              if (!metrics.find(em => em.value === m.value && em.name === m.name)) {
                metrics.push({
                  name: m.name,
                  value: m.value,
                  unit: m.unit,
                  category: "Phát hiện tự động",
                  selected: false,
                  useAs: undefined,
                });
              }
            });
          }

          setSelectedMetrics(metrics);

          setFinancialData({
            fileName: file.name,
            fileType: "excel",
            sheets,
            summary,
          });

          if (summary.totalAssets) {
            setInitialInvestment(summary.totalAssets * 0.3);
          }

          clearInterval(progressInterval);
          setProgress(100);
          toast.success(`Đã đọc thành công ${sheets.length} sheet từ file Excel`);
          setActiveTab("summary");
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

      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      const allText: string[] = [];
      const extractedRows: Record<string, string | number>[] = [];

      for (let i = 1; i <= Math.min(pdf.numPages, 50); i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: unknown) => (item as { str: string }).str).join(" ");
        allText.push(pageText);

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
      setActiveTab("summary");
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
    setAnalysis(null);
    setSelectedMetrics([]);
    setActiveTab("upload");
  }, []);

  const runCrystalBallAnalysis = useCallback(() => {
    if (!financialData?.summary) {
      toast.error("Vui lòng upload báo cáo tài chính trước");
      return;
    }

    const active = selectedMetrics.filter(m => m.selected);
    if (active.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 chỉ số tài chính");
      return;
    }

    // Build summary from selected metrics
    const summary: Partial<FinancialSummary> = {};
    const useAsToSummary: Record<string, keyof FinancialSummary> = {
      revenue: "totalRevenue", expenses: "totalExpenses", netIncome: "netIncome",
      assets: "totalAssets", liabilities: "totalLiabilities", equity: "equity",
      cashFlow: "cashFlow", operatingCashFlow: "operatingCashFlow",
      investingCashFlow: "investingCashFlow", depreciation: "depreciation",
      interestExpense: "interestExpense", taxExpense: "taxExpense",
      ebitda: "ebitda", grossProfit: "grossProfit", operatingIncome: "operatingIncome",
    };
    active.forEach(m => {
      if (m.useAs && useAsToSummary[m.useAs]) {
        (summary as Record<string, number>)[useAsToSummary[m.useAs]] = m.value;
      }
    });

    const baseCashFlow = (summary as any).operatingCashFlow || (summary as any).netIncome || (summary as any).cashFlow || 0;
    const cashFlows: number[] = [-initialInvestment];
    
    for (let i = 1; i <= projectYears; i++) {
      const projectedCF = baseCashFlow * Math.pow(1 + growthRate / 100, i);
      cashFlows.push(projectedCF);
    }

    // Tính các chỉ số Crystal Ball
    const npv = calculateNPV(cashFlows, discountRate / 100);
    const irr = calculateIRR(cashFlows) * 100;
    const paybackPeriod = calculatePaybackPeriod(cashFlows);
    const profitabilityIndex = initialInvestment > 0 ? (npv + initialInvestment) / initialInvestment : 0;

    // Tính các tỷ số tài chính
    const revenue = summary.totalRevenue || 1;
    const assets = summary.totalAssets || 1;
    const equity = summary.equity || 1;
    const liabilities = summary.totalLiabilities || 0;

    const ratios = {
      currentRatio: assets / (liabilities || 1),
      debtToEquity: liabilities / equity,
      returnOnEquity: (summary.netIncome || 0) / equity,
      returnOnAssets: (summary.netIncome || 0) / assets,
      grossMargin: (summary.grossProfit || 0) / revenue,
      operatingMargin: (summary.operatingIncome || summary.ebitda || 0) / revenue,
      netMargin: (summary.netIncome || 0) / revenue,
      assetTurnover: revenue / assets,
    };

    // Đánh giá tổng thể
    let score = 0;
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    if (npv > 0) { score += 2; strengths.push("NPV dương - Dự án tạo giá trị"); }
    else { score -= 2; weaknesses.push("NPV âm - Dự án có thể không khả thi"); }

    if (irr > discountRate) { score += 2; strengths.push(`IRR (${irr.toFixed(1)}%) > Chi phí vốn (${discountRate}%)`); }
    else { score -= 1; weaknesses.push("IRR thấp hơn chi phí vốn"); }

    if (paybackPeriod < projectYears / 2) { score += 1; strengths.push(`Hoàn vốn nhanh (${paybackPeriod.toFixed(1)} năm)`); }
    else if (paybackPeriod > projectYears) { score -= 1; weaknesses.push("Thời gian hoàn vốn quá dài"); }

    if (ratios.currentRatio > 1.5) { score += 1; strengths.push("Thanh khoản tốt"); }
    else if (ratios.currentRatio < 1) { score -= 1; weaknesses.push("Rủi ro thanh khoản"); }

    if (ratios.debtToEquity < 1) { score += 1; strengths.push("Đòn bẩy tài chính an toàn"); }
    else if (ratios.debtToEquity > 2) { score -= 1; weaknesses.push("Nợ cao - rủi ro tài chính"); }

    if (ratios.returnOnEquity > 0.15) { score += 1; strengths.push("ROE cao > 15%"); }
    if (ratios.netMargin > 0.1) { score += 1; strengths.push("Biên lợi nhuận tốt > 10%"); }

    let recommendation: CrystalBallAnalysis["recommendation"];
    if (score >= 5) recommendation = "strong_buy";
    else if (score >= 2) recommendation = "buy";
    else if (score >= 0) recommendation = "hold";
    else if (score >= -2) recommendation = "sell";
    else recommendation = "strong_sell";

    let riskLevel: CrystalBallAnalysis["riskLevel"];
    if (ratios.debtToEquity < 0.5 && ratios.currentRatio > 2) riskLevel = "low";
    else if (ratios.debtToEquity < 1.5 && ratios.currentRatio > 1) riskLevel = "medium";
    else if (ratios.debtToEquity < 3) riskLevel = "high";
    else riskLevel = "very_high";

    const result: CrystalBallAnalysis = {
      cashFlows,
      initialInvestment,
      discountRate,
      projectYears,
      npv,
      irr,
      paybackPeriod,
      profitabilityIndex,
      ratios,
      recommendation,
      riskLevel,
      strengths,
      weaknesses,
    };

    setAnalysis(result);
    onAnalysisComplete?.(result);
    toast.success("Phân tích Crystal Ball hoàn tất!");
    setActiveTab("crystal-ball");
  }, [financialData, selectedMetrics, discountRate, projectYears, initialInvestment, growthRate, onAnalysisComplete]);

  const currentSheet = financialData?.sheets[activeSheet];

  const recommendationLabels = {
    strong_buy: { text: "Mua mạnh", color: "text-green-600", bg: "bg-green-500/10" },
    buy: { text: "Nên mua", color: "text-green-500", bg: "bg-green-500/10" },
    hold: { text: "Giữ", color: "text-yellow-500", bg: "bg-yellow-500/10" },
    sell: { text: "Nên bán", color: "text-orange-500", bg: "bg-orange-500/10" },
    strong_sell: { text: "Bán mạnh", color: "text-red-600", bg: "bg-red-500/10" },
  };

  const riskLabels = {
    low: { text: "Thấp", color: "text-green-600" },
    medium: { text: "Trung bình", color: "text-yellow-500" },
    high: { text: "Cao", color: "text-orange-500" },
    very_high: { text: "Rất cao", color: "text-red-600" },
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-3xl mx-auto grid-cols-6 mb-6">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="summary" disabled={!financialData}>Tổng quan</TabsTrigger>
          <TabsTrigger value="select-metrics" disabled={!financialData}>Chọn chỉ số</TabsTrigger>
          <TabsTrigger value="data" disabled={!financialData}>Dữ liệu</TabsTrigger>
          <TabsTrigger value="params" disabled={selectedMetrics.filter(m => m.selected).length === 0}>Tham số</TabsTrigger>
          <TabsTrigger value="crystal-ball" disabled={!analysis}>Crystal Ball</TabsTrigger>
        </TabsList>

        {/* Upload Tab */}
        <TabsContent value="upload">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Đọc báo cáo tài chính
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
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
        </TabsContent>

        {/* Summary Tab */}
        <TabsContent value="summary">
          {financialData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
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
              {financialData.summary && (
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
                          <div className="flex items-center gap-2 mb-1">
                            <DollarSign className="w-4 h-4 text-green-600" />
                            <p className="text-xs text-muted-foreground">Tổng doanh thu</p>
                          </div>
                          <p className="text-lg font-bold text-green-600">
                            {formatNumber(financialData.summary.totalRevenue)}
                          </p>
                        </div>
                      )}
                      {financialData.summary.totalExpenses && (
                        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                          <div className="flex items-center gap-2 mb-1">
                            <TrendingDown className="w-4 h-4 text-red-600" />
                            <p className="text-xs text-muted-foreground">Tổng chi phí</p>
                          </div>
                          <p className="text-lg font-bold text-red-600">
                            {formatNumber(financialData.summary.totalExpenses)}
                          </p>
                        </div>
                      )}
                      {financialData.summary.netIncome && (
                        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                          <div className="flex items-center gap-2 mb-1">
                            <Activity className="w-4 h-4 text-blue-600" />
                            <p className="text-xs text-muted-foreground">Lợi nhuận ròng</p>
                          </div>
                          <p className="text-lg font-bold text-blue-600">
                            {formatNumber(financialData.summary.netIncome)}
                          </p>
                        </div>
                      )}
                      {financialData.summary.totalAssets && (
                        <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                          <div className="flex items-center gap-2 mb-1">
                            <BarChart3 className="w-4 h-4 text-purple-600" />
                            <p className="text-xs text-muted-foreground">Tổng tài sản</p>
                          </div>
                          <p className="text-lg font-bold text-purple-600">
                            {formatNumber(financialData.summary.totalAssets)}
                          </p>
                        </div>
                      )}
                      {financialData.summary.equity && (
                        <div className="p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                          <div className="flex items-center gap-2 mb-1">
                            <PieChart className="w-4 h-4 text-indigo-600" />
                            <p className="text-xs text-muted-foreground">Vốn chủ sở hữu</p>
                          </div>
                          <p className="text-lg font-bold text-indigo-600">
                            {formatNumber(financialData.summary.equity)}
                          </p>
                        </div>
                      )}
                      {financialData.summary.totalLiabilities && (
                        <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                          <div className="flex items-center gap-2 mb-1">
                            <AlertCircle className="w-4 h-4 text-orange-600" />
                            <p className="text-xs text-muted-foreground">Tổng nợ</p>
                          </div>
                          <p className="text-lg font-bold text-orange-600">
                            {formatNumber(financialData.summary.totalLiabilities)}
                          </p>
                        </div>
                      )}
                      {financialData.summary.cashFlow && (
                        <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                          <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="w-4 h-4 text-cyan-600" />
                            <p className="text-xs text-muted-foreground">Dòng tiền</p>
                          </div>
                          <p className="text-lg font-bold text-cyan-600">
                            {formatNumber(financialData.summary.cashFlow)}
                          </p>
                        </div>
                      )}
                      {financialData.summary.ebitda && (
                        <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                          <div className="flex items-center gap-2 mb-1">
                            <Activity className="w-4 h-4 text-amber-600" />
                            <p className="text-xs text-muted-foreground">EBITDA</p>
                          </div>
                          <p className="text-lg font-bold text-amber-600">
                            {formatNumber(financialData.summary.ebitda)}
                          </p>
                        </div>
                      )}
                    </div>

                    {financialData.summary.detectedMetrics.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium mb-2">Các chỉ số khác:</p>
                        <div className="flex flex-wrap gap-2">
                          {financialData.summary.detectedMetrics.slice(0, 15).map((metric, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {metric.name}: {formatNumber(metric.value)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <Button 
                      onClick={() => setActiveTab("select-metrics")} 
                      className="w-full mt-6"
                      variant="glow"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Chọn chỉ số để phân tích
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* AI Super Extraction Card */}
              <Card className="glass border-primary/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-primary" />
                    AI phân tích siêu đỉnh
                    <Badge variant="secondary" className="ml-2 text-xs">Gemini</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Dùng AI đọc toàn bộ file, tự động trích xuất các chỉ số tài chính (kể cả khi tên cột không chuẩn),
                    suy luận đơn vị (đồng/triệu/tỷ) và đưa ra nhận định chuyên sâu.
                  </p>
                  <Button
                    onClick={runAIExtraction}
                    disabled={aiLoading}
                    className="w-full"
                    variant="glow"
                  >
                    {aiLoading ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />AI đang đọc file...</>
                    ) : (
                      <><Wand2 className="w-4 h-4 mr-2" />Trích xuất bằng AI</>
                    )}
                  </Button>

                  {aiExtraction && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3"
                    >
                      <div className="flex flex-wrap gap-2 text-xs">
                        {aiExtraction.currency && (
                          <Badge variant="outline">Tiền tệ: {aiExtraction.currency}</Badge>
                        )}
                        {aiExtraction.period && (
                          <Badge variant="outline">Kỳ: {aiExtraction.period}</Badge>
                        )}
                        {aiExtraction.unitMultiplier && aiExtraction.unitMultiplier !== 1 && (
                          <Badge variant="outline">Đơn vị: ×{aiExtraction.unitMultiplier.toLocaleString()}</Badge>
                        )}
                        {aiExtraction.dataQuality && (
                          <Badge variant={aiExtraction.dataQuality === "high" ? "default" : "secondary"}>
                            Chất lượng: {aiExtraction.dataQuality}
                          </Badge>
                        )}
                        <Badge className="bg-primary/20 text-primary border-primary/30">
                          +{aiExtraction.addedCount} chỉ số mới
                        </Badge>
                      </div>

                      {aiExtraction.insights.length > 0 && (
                        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                          <div className="flex items-center gap-2 mb-2 text-sm font-medium text-primary">
                            <Lightbulb className="w-4 h-4" />
                            Nhận định AI
                          </div>
                          <ul className="space-y-1.5 text-sm text-muted-foreground">
                            {aiExtraction.insights.map((ins, i) => (
                              <li key={i} className="flex gap-2">
                                <span className="text-primary mt-0.5">▸</span>
                                <span>{ins}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {aiExtraction.warnings && aiExtraction.warnings.length > 0 && (
                        <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                          <div className="flex items-center gap-2 mb-2 text-sm font-medium text-yellow-600">
                            <AlertCircle className="w-4 h-4" />
                            Cảnh báo
                          </div>
                          <ul className="space-y-1 text-sm text-muted-foreground">
                            {aiExtraction.warnings.map((w, i) => (
                              <li key={i}>• {w}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* AI extracted metrics table */}
                      {(() => {
                        const aiRows = selectedMetrics.filter(m => m.source === "ai");
                        if (aiRows.length === 0) return null;
                        const setAllAi = (val: boolean) =>
                          setSelectedMetrics(prev => prev.map(m => m.source === "ai" ? { ...m, selected: val } : m));
                        const toggleOne = (id?: string) =>
                          setSelectedMetrics(prev => prev.map(m => m.id === id ? { ...m, selected: !m.selected } : m));
                        const setUseAs = (id: string | undefined, useAs: string) =>
                          setSelectedMetrics(prev => prev.map(m => m.id === id ? { ...m, useAs: useAs || undefined } : m));

                        const useAsOptions = [
                          { v: "", label: "—" },
                          { v: "revenue", label: "Doanh thu" },
                          { v: "expenses", label: "Chi phí" },
                          { v: "netIncome", label: "Lợi nhuận ròng" },
                          { v: "grossProfit", label: "Lợi nhuận gộp" },
                          { v: "operatingIncome", label: "LN hoạt động" },
                          { v: "ebitda", label: "EBITDA" },
                          { v: "assets", label: "Tài sản" },
                          { v: "liabilities", label: "Nợ" },
                          { v: "equity", label: "Vốn CSH" },
                          { v: "cashFlow", label: "Dòng tiền" },
                          { v: "operatingCashFlow", label: "DT hoạt động" },
                          { v: "investingCashFlow", label: "DT đầu tư" },
                          { v: "financingCashFlow", label: "DT tài trợ" },
                          { v: "depreciation", label: "Khấu hao" },
                          { v: "interestExpense", label: "Chi phí lãi vay" },
                          { v: "taxExpense", label: "Thuế" },
                        ];
                        const selectedCount = aiRows.filter(m => m.selected).length;

                        return (
                          <div className="rounded-lg border border-border/50 overflow-hidden">
                            <div className="flex items-center justify-between gap-2 px-3 py-2 bg-muted/30 border-b border-border/50">
                              <div className="flex items-center gap-2 text-sm font-medium">
                                <Brain className="w-4 h-4 text-primary" />
                                Chỉ số AI trích xuất
                                <Badge variant="secondary" className="text-[10px]">
                                  {selectedCount}/{aiRows.length}
                                </Badge>
                              </div>
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setAllAi(true)}>Chọn hết</Button>
                                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setAllAi(false)}>Bỏ hết</Button>
                              </div>
                            </div>
                            <div className="max-h-[420px] overflow-auto">
                              <Table>
                                <TableHeader className="sticky top-0 bg-card/95 backdrop-blur z-10">
                                  <TableRow>
                                    <TableHead className="w-10"></TableHead>
                                    <TableHead>Chỉ số</TableHead>
                                    <TableHead className="text-right">Giá trị</TableHead>
                                    <TableHead>Đơn vị</TableHead>
                                    <TableHead>Nhóm</TableHead>
                                    <TableHead>Map sang</TableHead>
                                    <TableHead className="w-28">Confidence</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {aiRows.map((m) => {
                                    const conf = m.confidence ?? 0;
                                    const confColor = conf >= 0.8 ? "bg-green-500" : conf >= 0.6 ? "bg-yellow-500" : "bg-red-500";
                                    return (
                                      <TableRow key={m.id} className={m.selected ? "" : "opacity-50"}>
                                        <TableCell>
                                          <input
                                            type="checkbox"
                                            checked={m.selected}
                                            onChange={() => toggleOne(m.id)}
                                            className="w-4 h-4 cursor-pointer accent-primary"
                                          />
                                        </TableCell>
                                        <TableCell className="font-medium text-sm">{m.name}</TableCell>
                                        <TableCell className="text-right font-mono text-sm">
                                          {formatNumber(m.value)}
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                          {m.unit || "—"}
                                        </TableCell>
                                        <TableCell>
                                          <Badge variant="outline" className="text-[10px]">{m.category}</Badge>
                                        </TableCell>
                                        <TableCell>
                                          <select
                                            value={m.useAs || ""}
                                            onChange={(e) => setUseAs(m.id, e.target.value)}
                                            className="h-7 text-xs rounded border border-border bg-background px-1.5 max-w-[130px]"
                                          >
                                            {useAsOptions.map(o => (
                                              <option key={o.v} value={o.v}>{o.label}</option>
                                            ))}
                                          </select>
                                        </TableCell>
                                        <TableCell>
                                          <div className="flex items-center gap-2">
                                            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                                              <div className={`h-full ${confColor}`} style={{ width: `${conf * 100}%` }} />
                                            </div>
                                            <span className="text-[10px] font-mono text-muted-foreground w-8 text-right">
                                              {(conf * 100).toFixed(0)}%
                                            </span>
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        );
                      })()}

                      <Button
                        onClick={() => setActiveTab("select-metrics")}
                        variant="outline"
                        className="w-full"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Tiếp tục với {selectedMetrics.filter(m => m.selected).length} chỉ số đã chọn
                      </Button>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </TabsContent>

        {/* Select Metrics Tab */}
        <TabsContent value="select-metrics">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary" />
                Chọn chỉ số cho phân tích
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Chọn các chỉ số tài chính bạn muốn sử dụng cho phân tích Crystal Ball. 
                Bạn có thể bật/tắt từng chỉ số.
              </p>
              
              <div className="flex gap-2 mb-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedMetrics(prev => prev.map(m => ({ ...m, selected: true })))}
                >
                  Chọn tất cả
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedMetrics(prev => prev.map(m => ({ ...m, selected: false })))}
                >
                  Bỏ chọn tất cả
                </Button>
                <Badge variant="secondary" className="ml-auto">
                  {selectedMetrics.filter(m => m.selected).length}/{selectedMetrics.length} đã chọn
                </Badge>
              </div>

              {/* Group metrics by category */}
              {Object.entries(
                selectedMetrics.reduce<Record<string, SelectedMetric[]>>((acc, m) => {
                  const cat = m.category;
                  if (!acc[cat]) acc[cat] = [];
                  acc[cat].push(m);
                  return acc;
                }, {})
              ).map(([category, metrics]) => (
                <div key={category} className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <BarChart3 className="w-3.5 h-3.5 text-primary" />
                    {category}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {metrics.map((metric, idx) => {
                      const globalIdx = selectedMetrics.findIndex(m => m === metric);
                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            setSelectedMetrics(prev => {
                              const next = [...prev];
                              next[globalIdx] = { ...next[globalIdx], selected: !next[globalIdx].selected };
                              return next;
                            });
                          }}
                          className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                            metric.selected
                              ? "border-primary/50 bg-primary/5"
                              : "border-border/30 bg-muted/10 opacity-60"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                              metric.selected ? "bg-primary border-primary" : "border-muted-foreground/30"
                            }`}>
                              {metric.selected && <CheckCircle className="w-3 h-3 text-primary-foreground" />}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{metric.useAs || metric.name}</p>
                              {metric.useAs && <p className="text-xs text-muted-foreground">{metric.name}</p>}
                            </div>
                          </div>
                          <span className="font-mono text-sm font-semibold">
                            {formatNumber(metric.value)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {selectedMetrics.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>Không phát hiện được chỉ số tài chính nào từ file</p>
                </div>
              )}

              <Button 
                onClick={() => setActiveTab("params")} 
                className="w-full mt-4"
                variant="glow"
                disabled={selectedMetrics.filter(m => m.selected).length === 0}
              >
                <Calculator className="w-4 h-4 mr-2" />
                Tiếp tục cấu hình tham số ({selectedMetrics.filter(m => m.selected).length} chỉ số đã chọn)
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Tab */}
        <TabsContent value="data">
          {financialData && (
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Table2 className="w-5 h-5 text-primary" />
                  Dữ liệu chi tiết
                </CardTitle>
              </CardHeader>
              <CardContent>
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
          )}
        </TabsContent>

        {/* Parameters Tab */}
        <TabsContent value="params">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" />
                Tham số phân tích Crystal Ball
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="flex items-center justify-between mb-2">
                      <span>Vốn đầu tư ban đầu (triệu đồng)</span>
                      <span className="text-primary font-bold">{formatNumber(initialInvestment)}</span>
                    </Label>
                    <Input
                      type="number"
                      value={initialInvestment}
                      onChange={(e) => setInitialInvestment(parseFloat(e.target.value) || 0)}
                      placeholder="Nhập vốn đầu tư"
                    />
                  </div>

                  <div>
                    <Label className="flex items-center justify-between mb-2">
                      <span>Tỷ suất chiết khấu (%)</span>
                      <span className="text-primary font-bold">{discountRate}%</span>
                    </Label>
                    <Slider
                      value={[discountRate]}
                      onValueChange={([v]) => setDiscountRate(v)}
                      min={5}
                      max={25}
                      step={0.5}
                      className="py-2"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="flex items-center justify-between mb-2">
                      <span>Số năm dự án</span>
                      <span className="text-primary font-bold">{projectYears} năm</span>
                    </Label>
                    <Slider
                      value={[projectYears]}
                      onValueChange={([v]) => setProjectYears(v)}
                      min={3}
                      max={30}
                      step={1}
                      className="py-2"
                    />
                  </div>

                  <div>
                    <Label className="flex items-center justify-between mb-2">
                      <span>Tốc độ tăng trưởng dòng tiền (%/năm)</span>
                      <span className="text-primary font-bold">{growthRate}%</span>
                    </Label>
                    <Slider
                      value={[growthRate]}
                      onValueChange={([v]) => setGrowthRate(v)}
                      min={-10}
                      max={20}
                      step={0.5}
                      className="py-2"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                <h4 className="font-medium mb-2">Chỉ số đã chọn ({selectedMetrics.filter(m => m.selected).length})</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedMetrics.filter(m => m.selected).map((m, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {m.useAs || m.name}: {formatNumber(m.value)}
                    </Badge>
                  ))}
                </div>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="mt-2 p-0 h-auto"
                  onClick={() => setActiveTab("select-metrics")}
                >
                  Thay đổi chỉ số
                </Button>
              </div>

              <Button 
                onClick={runCrystalBallAnalysis} 
                className="w-full"
                variant="glow"
                size="lg"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Chạy phân tích Crystal Ball
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Crystal Ball Analysis Tab */}
        <TabsContent value="crystal-ball">
          {analysis && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Key Metrics */}
              <div className="grid md:grid-cols-4 gap-4">
                <Card className={`${analysis.npv >= 0 ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"}`}>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-1">NPV</p>
                      <p className={`text-2xl font-bold ${analysis.npv >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatNumber(analysis.npv)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {analysis.npv >= 0 ? "✓ Dự án tạo giá trị" : "✗ Dự án phá hủy giá trị"}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className={`${analysis.irr > discountRate ? "border-green-500/30 bg-green-500/5" : "border-orange-500/30 bg-orange-500/5"}`}>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-1">IRR</p>
                      <p className={`text-2xl font-bold ${analysis.irr > discountRate ? "text-green-600" : "text-orange-600"}`}>
                        {analysis.irr.toFixed(2)}%
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Chi phí vốn: {discountRate}%
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-blue-500/30 bg-blue-500/5">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-1">Thời gian hoàn vốn</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {analysis.paybackPeriod.toFixed(1)} năm
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Tổng {projectYears} năm
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-purple-500/30 bg-purple-500/5">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-1">Profitability Index</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {analysis.profitabilityIndex.toFixed(2)}x
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {analysis.profitabilityIndex > 1 ? "✓ Sinh lời" : "✗ Thua lỗ"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recommendation & Risk */}
              <div className="grid md:grid-cols-2 gap-4">
                <Card className={`glass ${recommendationLabels[analysis.recommendation].bg}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Khuyến nghị đầu tư</p>
                        <p className={`text-2xl font-bold ${recommendationLabels[analysis.recommendation].color}`}>
                          {recommendationLabels[analysis.recommendation].text}
                        </p>
                      </div>
                      <Sparkles className={`w-10 h-10 ${recommendationLabels[analysis.recommendation].color} opacity-50`} />
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Mức độ rủi ro</p>
                        <p className={`text-2xl font-bold ${riskLabels[analysis.riskLevel].color}`}>
                          {riskLabels[analysis.riskLevel].text}
                        </p>
                      </div>
                      <AlertCircle className={`w-10 h-10 ${riskLabels[analysis.riskLevel].color} opacity-50`} />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Cash Flow Chart */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle>Dòng tiền dự kiến</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analysis.cashFlows.map((cf, i) => ({ year: i, cashFlow: cf }))}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                      <XAxis dataKey="year" label={{ value: "Năm", position: "insideBottom", offset: -5 }} />
                      <YAxis tickFormatter={v => formatNumber(v)} />
                      <Tooltip
                        formatter={(value: number) => [formatNumber(value), "Dòng tiền"]}
                        labelFormatter={(v) => `Năm ${v}`}
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
                      <Bar dataKey="cashFlow" radius={[4, 4, 0, 0]}>
                        {analysis.cashFlows.map((cf, index) => (
                          <Cell key={`cell-${index}`} fill={cf >= 0 ? "hsl(var(--chart-2))" : "hsl(var(--destructive))"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Financial Ratios */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle>Các tỷ số tài chính</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                      <p className="text-xs text-muted-foreground">Current Ratio</p>
                      <p className="text-lg font-bold">{analysis.ratios.currentRatio.toFixed(2)}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                      <p className="text-xs text-muted-foreground">Debt/Equity</p>
                      <p className="text-lg font-bold">{analysis.ratios.debtToEquity.toFixed(2)}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                      <p className="text-xs text-muted-foreground">ROE</p>
                      <p className="text-lg font-bold">{formatPercent(analysis.ratios.returnOnEquity)}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                      <p className="text-xs text-muted-foreground">ROA</p>
                      <p className="text-lg font-bold">{formatPercent(analysis.ratios.returnOnAssets)}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                      <p className="text-xs text-muted-foreground">Gross Margin</p>
                      <p className="text-lg font-bold">{formatPercent(analysis.ratios.grossMargin)}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                      <p className="text-xs text-muted-foreground">Operating Margin</p>
                      <p className="text-lg font-bold">{formatPercent(analysis.ratios.operatingMargin)}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                      <p className="text-xs text-muted-foreground">Net Margin</p>
                      <p className="text-lg font-bold">{formatPercent(analysis.ratios.netMargin)}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                      <p className="text-xs text-muted-foreground">Asset Turnover</p>
                      <p className="text-lg font-bold">{analysis.ratios.assetTurnover.toFixed(2)}x</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Strengths & Weaknesses */}
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="glass border-green-500/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      Điểm mạnh
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysis.strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="glass border-red-500/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="w-5 h-5" />
                      Điểm yếu / Rủi ro
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysis.weaknesses.length > 0 ? analysis.weaknesses.map((w, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                          {w}
                        </li>
                      )) : (
                        <li className="text-sm text-muted-foreground">Không phát hiện điểm yếu đáng kể</li>
                      )}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
