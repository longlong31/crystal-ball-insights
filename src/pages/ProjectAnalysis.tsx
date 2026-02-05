import { useState, useCallback } from "react";
 import { motion } from "framer-motion";
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
import { ProjectParams, ProjectResults, defaultProjectParams } from "@/lib/projectModel";
import { calculateProject } from "@/lib/projectCalculator";
 import { Calculator, Activity, Play, RotateCcw, Dice5, GitCompare, FileText, AlertTriangle } from "lucide-react";

type TabType = "calculate" | "sensitivity" | "montecarlo" | "stress" | "compare" | "financial";

const ProjectAnalysis = () => {
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

      <main className="container py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-3">Phân tích dự án đầu tư</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Tính NPV, IRR, DPP và phân tích độ nhạy cho dự án đầu tư của bạn
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 mb-8 flex-wrap">
            <button
              onClick={() => setActiveTab("calculate")}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === "calculate"
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              <Calculator className="w-4 h-4" />
              Tính toán dự án
            </button>
            <button
              onClick={() => setActiveTab("sensitivity")}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === "sensitivity"
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              <Activity className="w-4 h-4" />
              Phân tích độ nhạy
            </button>
            <button
              onClick={() => setActiveTab("montecarlo")}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === "montecarlo"
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              <Dice5 className="w-4 h-4" />
              Monte Carlo
            </button>
            <button
              onClick={() => setActiveTab("stress")}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === "stress"
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              Stress Testing
            </button>
            <button
              onClick={() => setActiveTab("compare")}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === "compare"
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              <GitCompare className="w-4 h-4" />
              So sánh dự án
            </button>
            <button
              onClick={() => setActiveTab("financial")}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === "financial"
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              <FileText className="w-4 h-4" />
              Báo cáo tài chính
            </button>
          </div>

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
                    {isCalculating ? "Đang tính..." : "Tính toán"}
                  </Button>
                  <Button variant="outline" size="lg" onClick={handleReset}>
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <ProjectResultsDisplay results={results} params={params} loading={isCalculating} />
            </div>
          )}

          {activeTab === "sensitivity" && <AdvancedSensitivityPanel params={params} />}

          {activeTab === "montecarlo" && (
            <>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-3">Mô phỏng Monte Carlo cho dự án</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Mô phỏng hàng nghìn kịch bản để đánh giá phân phối xác suất của các chỉ số tài chính
                </p>
              </div>
              <ProjectMonteCarloPanel params={params} />
            </>
          )}

          {activeTab === "stress" && results && (
            <>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-3">Stress Testing</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Kiểm tra độ bền vững của dự án trước các kịch bản khủng hoảng
                </p>
              </div>
              <StressTestingPanel params={params} baseResults={results} />
            </>
          )}

          {activeTab === "compare" && (
            <>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-3">So sánh nhiều dự án</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Thêm và so sánh các phương án đầu tư khác nhau để chọn dự án tối ưu
                </p>
              </div>
              <ProjectComparison currentParams={params} />
            </>
          )}

          {activeTab === "financial" && (
            <>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-3">Đọc báo cáo tài chính</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Upload và phân tích báo cáo tài chính từ file Excel hoặc PDF
                </p>
              </div>
              <FinancialStatementReader />
            </>
          )}

        </motion.div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ProjectAnalysis;
