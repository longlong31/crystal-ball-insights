import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { ProjectParamsForm } from "@/components/ProjectParamsForm";
import { ProjectResultsDisplay } from "@/components/ProjectResultsDisplay";
import { AdvancedSensitivityPanel } from "@/components/AdvancedSensitivityPanel";
import { ProjectMonteCarloPanel } from "@/components/ProjectMonteCarloPanel";
import { ProjectComparison } from "@/components/ProjectComparison";
import { ProjectScenarioManager } from "@/components/ProjectScenarioManager";
import { ProjectExcelImporter } from "@/components/ProjectExcelImporter";
import { FinancialStatementReader } from "@/components/FinancialStatementReader";
import { StressTestingPanel } from "@/components/StressTestingPanel";
import { ProjectAnalysisHistory } from "@/components/ProjectAnalysisHistory";
import { Footer } from "@/components/Footer";
import { BackToTop } from "@/components/BackToTop";
import { ProjectParams, ProjectResults, defaultProjectParams } from "@/lib/projectModel";
import { calculateProject } from "@/lib/projectCalculator";
import {
  Calculator, Activity, Play, RotateCcw, Dice5, GitCompare, FileText,
  AlertTriangle, Sparkles, ArrowRight, FlaskConical, TrendingUp,
  BarChart3, Shield, Target, Brain, Layers, ChevronRight
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

type TabType = "calculate" | "sensitivity" | "montecarlo" | "stress" | "compare" | "financial";

const tabs: { key: TabType; icon: any; labelVi: string; labelEn: string; desc: string }[] = [
  { key: "calculate", icon: Calculator, labelVi: "Tính toán dự án", labelEn: "Project Calc", desc: "NPV, IRR, DPP" },
  { key: "sensitivity", icon: Activity, labelVi: "Phân tích độ nhạy", labelEn: "Sensitivity", desc: "Tornado & Spider" },
  { key: "montecarlo", icon: Dice5, labelVi: "Monte Carlo", labelEn: "Monte Carlo", desc: "10,000+ scenarios" },
  { key: "stress", icon: AlertTriangle, labelVi: "Stress Testing", labelEn: "Stress Test", desc: "Crisis simulation" },
  { key: "compare", icon: GitCompare, labelVi: "So sánh dự án", labelEn: "Compare", desc: "Multi-project" },
  { key: "financial", icon: FileText, labelVi: "Báo cáo tài chính", labelEn: "Financials", desc: "Excel/PDF import" },
];

// ─── Mini sparkline ──────────────────────────────────────────────
const Sparkline = ({ data, color }: { data: number[]; color: string }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 80, h = 24;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
  return (
    <svg width={w} height={h} className="overflow-visible opacity-60">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const genData = (n: number) => {
  const d: number[] = [50];
  for (let i = 1; i < n; i++) d.push(Math.max(5, d[i - 1] + (Math.random() - 0.45) * 6));
  return d;
};

const ProjectAnalysis = () => {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>("calculate");
  const [params, setParams] = useState<ProjectParams>(defaultProjectParams);
  const [results, setResults] = useState<ProjectResults | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);

  const handleCalculate = useCallback(() => {
    setIsCalculating(true);
    setTimeout(() => {
      const projectResults = calculateProject(params);
      setResults(projectResults);
      setIsCalculating(false);
    }, 100);
  }, [params]);

  const handleReset = useCallback(() => {
    setParams(defaultProjectParams);
    setResults(null);
    setAiAnalysis(null);
  }, []);

  const handleLoadHistory = useCallback((loadedParams: ProjectParams, loadedResults: ProjectResults) => {
    setParams(loadedParams);
    setResults(loadedResults);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      {/* ─── Hero Section ─────────────────────────────────────── */}
      <section className="relative py-12 lg:py-16 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.04] via-transparent to-transparent" />
          <div className="absolute top-0 left-1/3 w-[600px] h-[600px] rounded-full bg-primary/[0.05] blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-secondary/[0.04] blur-[100px]" />
          <div className="absolute inset-0 opacity-[0.02]" style={{
            backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
            backgroundSize: '48px 48px'
          }} />
          {/* Scan line */}
          <motion.div
            className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent pointer-events-none"
            animate={{ top: ["-5%", "105%"] }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
          />
        </div>

        <div className="container relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-10">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="flex-1 text-center lg:text-left"
            >
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-4"
              >
                <Calculator className="w-4 h-4" />
                {language === "vi" ? "Phân tích dự án đầu tư" : "Investment Project Analysis"}
              </motion.div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-[1.1] tracking-tight">
                <motion.span
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="block text-foreground"
                >
                  {language === "vi" ? "Phân tích" : "Analyze"}
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="block bg-gradient-to-r from-primary via-[hsl(var(--crystal-glow))] to-secondary bg-clip-text text-transparent"
                >
                  {language === "vi" ? "Dự án thông minh" : "Smart Projects"}
                </motion.span>
              </h1>

              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-muted-foreground text-lg max-w-xl mx-auto lg:mx-0 mb-6"
              >
                {language === "vi"
                  ? "Tính NPV, IRR, DPP — mô phỏng Monte Carlo — stress testing — so sánh đa dự án. Tất cả trong một nền tảng."
                  : "NPV, IRR, DPP calculation — Monte Carlo simulation — stress testing — multi-project comparison. All in one platform."}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-wrap justify-center lg:justify-start gap-3"
              >
                <Link to="/algorithms">
                  <Button variant="crystal" className="gap-2">
                    <FlaskConical className="w-4 h-4" />
                    {language === "vi" ? "Phòng thí nghiệm thuật toán" : "Algorithm Lab"}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </motion.div>
            </motion.div>

            {/* Right - quick stats cards */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="grid grid-cols-2 gap-3 max-w-sm"
            >
              {[
                { label: "NPV", value: "$2.4M", icon: TrendingUp, color: "hsl(var(--quant-green))", data: genData(15) },
                { label: "IRR", value: "24.5%", icon: Target, color: "hsl(var(--quant-cyan))", data: genData(15) },
                { label: "VaR 95%", value: "$890K", icon: Shield, color: "hsl(var(--quant-amber))", data: genData(15) },
                { label: "Sharpe", value: "2.18", icon: BarChart3, color: "hsl(var(--quant-violet))", data: genData(15) },
              ].map((card, i) => {
                const Icon = card.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + i * 0.1, type: "spring" }}
                    whileHover={{ scale: 1.03, y: -2 }}
                    className="relative overflow-hidden rounded-xl border border-border/40 bg-card/80 backdrop-blur-sm p-4 cursor-default"
                  >
                    <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-[30px] opacity-10" style={{ backgroundColor: card.color }} />
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-4 h-4" style={{ color: card.color }} />
                      <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{card.label}</span>
                    </div>
                    <div className="flex items-end justify-between">
                      <span className="text-xl font-bold font-mono text-foreground">{card.value}</span>
                      <Sparkline data={card.data} color={card.color} />
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Tabs ─────────────────────────────────────────────── */}
      <main className="container pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {/* Tab bar */}
          <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-thin">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`group relative flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                      : "bg-card/60 border border-border/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:border-primary/20"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <div className="flex flex-col items-start">
                    <span>{language === "vi" ? tab.labelVi : tab.labelEn}</span>
                    {isActive && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.7 }}
                        className="text-[10px] font-normal"
                      >
                        {tab.desc}
                      </motion.span>
                    )}
                  </div>
                </button>
              );
            })}

            {/* Algorithm Lab link */}
            <Link
              to="/algorithms"
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium bg-card/60 border border-dashed border-primary/30 text-primary hover:bg-primary/10 transition-all whitespace-nowrap"
            >
              <FlaskConical className="w-4 h-4" />
              <span>{language === "vi" ? "Thuật toán" : "Algorithms"}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === "calculate" && (
                <div className="grid lg:grid-cols-[400px_1fr] gap-6">
                  <div className="space-y-4">
                    <ProjectExcelImporter onImport={setParams} currentParams={params} />
                    <ProjectScenarioManager currentParams={params} onLoadScenario={setParams} />
                    <ProjectAnalysisHistory
                      currentParams={params}
                      currentResults={results}
                      aiAnalysis={aiAnalysis}
                      onLoadHistory={handleLoadHistory}
                    />
                    <ProjectParamsForm params={params} onParamsChange={setParams} />
                    <div className="flex gap-3">
                      <Button variant="glow" size="lg" className="flex-1" onClick={handleCalculate} disabled={isCalculating}>
                        <Play className="w-4 h-4 mr-2" />
                        {isCalculating
                          ? (language === "vi" ? "Đang tính..." : "Calculating...")
                          : (language === "vi" ? "Tính toán" : "Calculate")}
                      </Button>
                      <Button variant="outline" size="lg" onClick={handleReset}>
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <ProjectResultsDisplay results={results} params={params} loading={isCalculating} />
                </div>
              )}

              {activeTab === "sensitivity" && (
                <>
                  <SectionHeader
                    titleVi="Phân tích độ nhạy nâng cao"
                    titleEn="Advanced Sensitivity Analysis"
                    descVi="Tornado chart, Spider chart và phân tích đa biến để đánh giá ảnh hưởng của từng tham số"
                    descEn="Tornado chart, Spider chart and multivariate analysis to evaluate parameter impact"
                    language={language}
                  />
                  <AdvancedSensitivityPanel params={params} />
                </>
              )}

              {activeTab === "montecarlo" && (
                <>
                  <SectionHeader
                    titleVi="Mô phỏng Monte Carlo"
                    titleEn="Monte Carlo Simulation"
                    descVi="Mô phỏng hàng nghìn kịch bản để đánh giá phân phối xác suất của các chỉ số tài chính"
                    descEn="Simulate thousands of scenarios to assess probability distribution of financial metrics"
                    language={language}
                  />
                  <ProjectMonteCarloPanel params={params} />
                </>
              )}

              {activeTab === "stress" && (
                <>
                  <SectionHeader
                    titleVi="Stress Testing"
                    titleEn="Stress Testing"
                    descVi="Kiểm tra độ bền vững của dự án trước các kịch bản khủng hoảng"
                    descEn="Test project resilience against crisis scenarios"
                    language={language}
                  />
                  {results ? (
                    <StressTestingPanel params={params} baseResults={results} />
                  ) : (
                    <EmptyState
                      messageVi="Vui lòng tính toán dự án trước khi chạy Stress Testing"
                      messageEn="Please calculate the project first before running Stress Testing"
                      language={language}
                    />
                  )}
                </>
              )}

              {activeTab === "compare" && (
                <>
                  <SectionHeader
                    titleVi="So sánh nhiều dự án"
                    titleEn="Multi-Project Comparison"
                    descVi="Thêm và so sánh các phương án đầu tư khác nhau để chọn dự án tối ưu"
                    descEn="Add and compare different investment options to select the optimal project"
                    language={language}
                  />
                  <ProjectComparison currentParams={params} />
                </>
              )}

              {activeTab === "financial" && (
                <>
                  <SectionHeader
                    titleVi="Đọc báo cáo tài chính"
                    titleEn="Financial Statement Reader"
                    descVi="Upload và phân tích báo cáo tài chính từ file Excel hoặc PDF"
                    descEn="Upload and analyze financial statements from Excel or PDF files"
                    language={language}
                  />
                  <FinancialStatementReader />
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </main>

      <Footer />
      <BackToTop />
    </div>
  );
};

// ─── Subcomponents ───────────────────────────────────────────────
const SectionHeader = ({ titleVi, titleEn, descVi, descEn, language }: {
  titleVi: string; titleEn: string; descVi: string; descEn: string; language: string;
}) => (
  <div className="text-center mb-8">
    <h2 className="text-2xl md:text-3xl font-bold mb-3">
      {language === "vi" ? titleVi : titleEn}
    </h2>
    <p className="text-muted-foreground max-w-2xl mx-auto">
      {language === "vi" ? descVi : descEn}
    </p>
  </div>
);

const EmptyState = ({ messageVi, messageEn, language }: { messageVi: string; messageEn: string; language: string }) => (
  <div className="flex items-center justify-center min-h-[300px]">
    <div className="text-center">
      <AlertTriangle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
      <p className="text-muted-foreground">{language === "vi" ? messageVi : messageEn}</p>
    </div>
  </div>
);

export default ProjectAnalysis;
