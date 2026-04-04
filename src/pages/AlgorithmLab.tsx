import { useState, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppHeader } from "@/components/layout/AppHeader";
import { Footer } from "@/components/Footer";
import { BackToTop } from "@/components/BackToTop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SimulationCard } from "@/components/SimulationCard";
import {
  FlaskConical, Play, RotateCcw, Brain, Settings2,
  ArrowRight, ChevronDown, ChevronUp, BarChart3,
  GitBranch, Download, Workflow, FileText, FileSpreadsheet
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { PipelineBuilder } from "@/components/PipelineBuilder";
import { AlgorithmContributeForm } from "@/components/AlgorithmContributeForm";
import { algorithms, categoryInfo, type Algorithm, type AlgorithmResult } from "@/lib/algorithmRegistry";
import { exportAlgorithmPDF, exportAlgorithmExcel } from "@/lib/algorithmExporter";
import html2canvas from "html2canvas";

// ─── Page Component ───────────────────────────────────────────────
const AlgorithmLab = () => {
  const { language } = useLanguage();
  const [mode, setMode] = useState<"single" | "pipeline">("single");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedAlgo, setSelectedAlgo] = useState<Algorithm>(algorithms[0]);
  const [params, setParams] = useState<Record<string, number>>(() => {
    const p: Record<string, number> = {};
    algorithms[0].params.forEach(param => { p[param.key] = param.defaultValue; });
    return p;
  });
  const [result, setResult] = useState<AlgorithmResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = useCallback(async () => {
    let chartImage: string | null = null;
    if (chartRef.current) {
      try {
        const canvas = await html2canvas(chartRef.current, { backgroundColor: null });
        chartImage = canvas.toDataURL("image/png");
      } catch { /* skip */ }
    }
    if (result) exportAlgorithmPDF(selectedAlgo, params, result, chartImage);
  }, [selectedAlgo, params, result]);

  const handleExportExcel = useCallback(() => {
    if (result) exportAlgorithmExcel(selectedAlgo, params, result);
  }, [selectedAlgo, params, result]);

  const filteredAlgos = useMemo(() =>
    selectedCategory === "all" ? algorithms : algorithms.filter(a => a.category === selectedCategory),
    [selectedCategory]
  );

  const selectAlgorithm = useCallback((algo: Algorithm) => {
    setSelectedAlgo(algo);
    const p: Record<string, number> = {};
    algo.params.forEach(param => { p[param.key] = param.defaultValue; });
    setParams(p);
    setResult(null);
  }, []);

  const runAlgorithm = useCallback(() => {
    setIsRunning(true);
    setTimeout(() => {
      const res = selectedAlgo.run(params);
      setResult(res);
      setIsRunning(false);
    }, 300);
  }, [selectedAlgo, params]);

  const resetParams = useCallback(() => {
    const p: Record<string, number> = {};
    selectedAlgo.params.forEach(param => { p[param.key] = param.defaultValue; });
    setParams(p);
    setResult(null);
  }, [selectedAlgo]);

  const Icon = selectedAlgo.icon;
  const catInfo = categoryInfo[selectedAlgo.category];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      {/* Hero */}
      <section className="relative py-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-1/2 left-1/3 w-[400px] h-[400px] rounded-full bg-violet-500/[0.05] blur-[80px]" />
        <div className="container relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-4">
              <FlaskConical className="w-4 h-4" />
              {language === "vi" ? "Phòng thí nghiệm thuật toán" : "Algorithm Laboratory"}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              {language === "vi" ? "Khám phá & Chạy Thuật toán" : "Explore & Run Algorithms"}
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-4">
              {language === "vi"
                ? `${algorithms.length} thuật toán chuyên sâu: Tài chính, Rủi ro, Chiến lược, Tối ưu hóa và Machine Learning. Đóng góp mô hình của bạn!`
                : `${algorithms.length} advanced algorithms: Financial, Risk, Strategy, Optimization and ML. Contribute your own!`}
            </p>
            <AlgorithmContributeForm />
          </motion.div>
        </div>
      </section>

      <main className="container pb-16">
        {/* Mode tabs */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <button
            onClick={() => setMode("single")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              mode === "single"
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
          >
            <FlaskConical className="w-4 h-4" />
            {language === "vi" ? "Chạy đơn lẻ" : "Single Run"}
          </button>
          <button
            onClick={() => setMode("pipeline")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              mode === "pipeline"
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
          >
            <Workflow className="w-4 h-4" />
            Pipeline Builder
          </button>
        </div>

        {mode === "pipeline" ? (
          <PipelineBuilder algorithms={algorithms} />
        ) : (
        <>
        {/* Category filter */}
        <div className="flex items-center justify-center gap-3 mb-8 flex-wrap">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedCategory === "all"
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
          >
            {language === "vi" ? "Tất cả" : "All"} ({algorithms.length})
          </button>
          {Object.entries(categoryInfo).map(([key, info]) => {
            const CatIcon = info.icon;
            const count = algorithms.filter(a => a.category === key).length;
            return (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedCategory === key
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                }`}
              >
                <CatIcon className="w-4 h-4" />
                {language === "vi" ? info.label : info.labelEn} ({count})
              </button>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-[320px_1fr] gap-6">
          {/* Algorithm selector */}
          <div className="space-y-4">
            <SimulationCard>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-primary" />
                {language === "vi" ? "Chọn thuật toán" : "Select Algorithm"}
              </h3>
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {filteredAlgos.map(algo => {
                  const AlgoIcon = algo.icon;
                  const cat = categoryInfo[algo.category];
                  const isSelected = selectedAlgo.id === algo.id;
                  return (
                    <motion.button
                      key={algo.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => selectAlgorithm(algo)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        isSelected
                          ? "bg-primary/10 border-primary/30 shadow-md"
                          : "bg-muted/30 border-border/50 hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-1.5 rounded-md ${cat?.bg || ''} border`}>
                          <AlgoIcon className={`w-4 h-4 ${cat?.color || ''}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{language === "vi" ? algo.nameVi : algo.name}</div>
                          <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {language === "vi" ? algo.descriptionVi : algo.description}
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </SimulationCard>

            {/* Params form */}
            <SimulationCard>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-primary" />
                  {language === "vi" ? "Tham số đầu vào" : "Input Parameters"}
                </h3>
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {language === "vi" ? "Chi tiết" : "Details"}
                </button>
              </div>

              <div className="space-y-3">
                {selectedAlgo.params.map((param) => (
                  <div key={param.key}>
                    <Label className="text-xs flex items-center justify-between">
                      <span>{param.label}</span>
                      {param.unit && <span className="text-muted-foreground">{param.unit}</span>}
                    </Label>
                    <Input
                      type="number"
                      value={params[param.key] ?? param.defaultValue}
                      onChange={(e) => setParams(prev => ({ ...prev, [param.key]: parseFloat(e.target.value) || 0 }))}
                      min={param.min}
                      max={param.max}
                      step={param.step}
                      className="mt-1 font-mono text-sm"
                    />
                    {showAdvanced && param.description && (
                      <p className="text-[11px] text-muted-foreground mt-1">{param.description}</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mt-4">
                <Button variant="glow" className="flex-1" onClick={runAlgorithm} disabled={isRunning}>
                  <Play className="w-4 h-4 mr-1" />
                  {isRunning ? (language === "vi" ? "Đang chạy..." : "Running...") : (language === "vi" ? "Chạy" : "Run")}
                </Button>
                <Button variant="outline" size="icon" onClick={resetParams}>
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </SimulationCard>
          </div>

          {/* Results panel */}
          <div className="space-y-4">
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <SimulationCard>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-2 rounded-lg ${catInfo?.bg || ''} border`}>
                        <Icon className={`w-5 h-5 ${catInfo?.color || ''}`} />
                      </div>
                      <div className="flex-1">
                        <h2 className="font-bold text-lg">{language === "vi" ? selectedAlgo.nameVi : selectedAlgo.name}</h2>
                        <p className="text-xs text-muted-foreground">{language === "vi" ? selectedAlgo.descriptionVi : selectedAlgo.description}</p>
                      </div>
                      <div className="flex gap-1.5">
                        <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-1.5 text-xs">
                          <FileText className="w-3.5 h-3.5" /> PDF
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleExportExcel} className="gap-1.5 text-xs">
                          <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {Object.entries(result.outputs).map(([key, output]) => (
                        <div key={key} className="p-3 rounded-lg bg-muted/30 border border-border/50">
                          <div className="text-xs text-muted-foreground mb-1">{output.label}</div>
                          <div className="text-lg font-bold font-mono text-foreground">
                            {typeof output.value === 'number' ? output.value.toLocaleString() : output.value}
                            {output.unit && <span className="text-sm text-muted-foreground ml-1">{output.unit}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </SimulationCard>

                  {result.chartData && result.chartData.length > 0 && (
                    <SimulationCard>
                      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-primary" />
                        {language === "vi" ? "Biểu đồ kết quả" : "Result Chart"}
                      </h3>
                      <div className="h-64">
                        <ResultChart data={result.chartData} />
                      </div>
                    </SimulationCard>
                  )}

                  {result.interpretation && (
                    <SimulationCard>
                      <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <Brain className="w-4 h-4 text-primary" />
                        {language === "vi" ? "Giải thích kết quả" : "Interpretation"}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{result.interpretation}</p>
                    </SimulationCard>
                  )}

                  <SimulationCard>
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <GitBranch className="w-4 h-4 text-primary" />
                      {language === "vi" ? "Quy trình thuật toán" : "Algorithm Flow"}
                    </h3>
                    <AlgorithmFlowDiagram algo={selectedAlgo} params={params} result={result} />
                  </SimulationCard>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center min-h-[400px]"
                >
                  <div className="text-center">
                    <FlaskConical className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                      {language === "vi" ? "Chọn thuật toán và nhấn Chạy" : "Select an algorithm and press Run"}
                    </h3>
                    <p className="text-sm text-muted-foreground/60">
                      {language === "vi"
                        ? "Tùy chỉnh tham số đầu vào để xem kết quả trực quan"
                        : "Customize input parameters to see visual results"}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        </>
        )}
      </main>

      <Footer />
      <BackToTop />
    </div>
  );
};

// ─── Sub-components ───────────────────────────────────────────────
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

function ResultChart({ data }: { data: { name: string; value: number }[] }) {
  const isBarStyle = data.length <= 12;
  return (
    <ResponsiveContainer width="100%" height="100%">
      {isBarStyle ? (
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
          <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        </BarChart>
      ) : (
        <AreaChart data={data}>
          <defs>
            <linearGradient id="algoGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
          <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fill="url(#algoGrad)" strokeWidth={2} />
        </AreaChart>
      )}
    </ResponsiveContainer>
  );
}

function AlgorithmFlowDiagram({ algo, params, result }: { algo: Algorithm; params: Record<string, number>; result: AlgorithmResult }) {
  const steps = [
    { label: "Input", icon: Download, items: algo.params.map(p => `${p.label}: ${params[p.key]}`) },
    { label: algo.name, icon: algo.icon, items: ["Processing..."] },
    { label: "Output", icon: BarChart3, items: Object.values(result.outputs).map(o => `${o.label}: ${o.value}${o.unit || ''}`) },
  ];

  return (
    <div className="flex flex-col md:flex-row items-stretch gap-3">
      {steps.map((step, i) => {
        const StepIcon = step.icon;
        return (
          <div key={i} className="flex-1 flex items-center gap-3">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.15 }}
              className="flex-1 p-3 rounded-lg bg-muted/30 border border-border/50"
            >
              <div className="flex items-center gap-2 mb-2">
                <StepIcon className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-foreground">{step.label}</span>
              </div>
              <div className="space-y-1">
                {step.items.slice(0, 4).map((item, j) => (
                  <div key={j} className="text-[11px] text-muted-foreground font-mono truncate">{item}</div>
                ))}
                {step.items.length > 4 && (
                  <div className="text-[11px] text-muted-foreground">+{step.items.length - 4} more...</div>
                )}
              </div>
            </motion.div>
            {i < steps.length - 1 && (
              <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 hidden md:block" />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default AlgorithmLab;
