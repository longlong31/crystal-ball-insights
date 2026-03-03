import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { AppHeader } from "@/components/layout/AppHeader";
import { HeroSection } from "@/components/HeroSection";
import { SimulationForm } from "@/components/SimulationForm";
import { ResultsPanel } from "@/components/ResultsPanel";
import { SensitivityPanel } from "@/components/SensitivityPanel";
import { ScenarioManager } from "@/components/ScenarioManager";
import { ExcelUploader } from "@/components/ExcelUploader";
import { Footer } from "@/components/Footer";
import { runSimulation, DistributionType, DistributionParams } from "@/lib/distributions";
import { calculateStatistics } from "@/lib/monteCarlo";
import { SimulationScenario } from "@/lib/scenarioManager";
import { BarChart2, Activity } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

type TabType = 'simulation' | 'sensitivity';

const defaultDistParams: Record<DistributionType, Record<string, number>> = {
  triangular: { min: 1000000, mode: 2500000, max: 5000000 },
  normal: { mean: 2500000, stdDev: 500000 },
  lognormal: { mean: 2500000, stdDev: 500000 },
  uniform: { min: 1000000, max: 5000000 },
  beta: { alpha: 2, beta: 5, min: 1000000, max: 5000000 },
};

const Index = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>('simulation');
  const [distributionType, setDistributionType] = useState<DistributionType>('triangular');
  const [distParams, setDistParams] = useState<Record<string, number>>(
    defaultDistParams.triangular
  );
  const [iterations, setIterations] = useState(10000);

  const [simulationData, setSimulationData] = useState<number[]>([]);
  const [stats, setStats] = useState(calculateStatistics([]));
  const [isRunning, setIsRunning] = useState(false);

  const handleDistributionTypeChange = (type: DistributionType) => {
    setDistributionType(type);
    setDistParams(defaultDistParams[type]);
  };

  const handleRunSimulation = useCallback(() => {
    setIsRunning(true);
    
    setTimeout(() => {
      const params: DistributionParams = {
        type: distributionType,
        ...distParams,
      };
      
      const results = runSimulation(params, iterations);
      
      setSimulationData(results);
      setStats(calculateStatistics(results));
      setIsRunning(false);
    }, 100);
  }, [distributionType, distParams, iterations]);

  const handleReset = useCallback(() => {
    setSimulationData([]);
    setStats(calculateStatistics([]));
    setDistributionType('triangular');
    setDistParams(defaultDistParams.triangular);
    setIterations(10000);
  }, []);

  const handleLoadScenario = useCallback((scenario: SimulationScenario) => {
    setDistributionType(scenario.distributionType);
    setDistParams(scenario.params);
    setIterations(scenario.iterations);
    
    if (scenario.results && scenario.results.length > 0) {
      setSimulationData(scenario.results);
      setStats(calculateStatistics(scenario.results));
    }
  }, []);

  const handleExcelDataImport = useCallback((columnName: string, columnStats: { min: number; max: number; mean: number }) => {
    // Set to triangular distribution with imported stats
    setDistributionType('triangular');
    setDistParams({
      min: columnStats.min,
      mode: columnStats.mean,
      max: columnStats.max,
    });
  }, []);

  const currentScenario = {
    distributionType,
    params: distParams,
    iterations,
    results: simulationData.length > 0 ? simulationData : undefined,
    stats: simulationData.length > 0 ? stats : undefined,
  };

  const simulationStatsForExport = simulationData.length > 0 ? {
    [t("stats.min")]: stats.min,
    [t("stats.max")]: stats.max,
    [t("stats.mean")]: stats.mean,
    [t("stats.stdDev")]: stats.stdDev,
    "P5": stats.percentile5,
    "P25": stats.percentile25,
    [t("stats.median")]: stats.percentile50,
    "P75": stats.percentile75,
    "P95": stats.percentile95,
  } : undefined;

  return (
    <div className="min-h-screen bg-background">
       <AppHeader />

      {/* Hero Section */}
      <HeroSection />

      {/* Main Content */}
      <main className="container pb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          {/* Tabs */}
          <div className="flex items-center justify-center gap-4 mb-10">
            <button
              onClick={() => setActiveTab('simulation')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'simulation'
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              {t("tab.simulation")}
            </button>
            <button
              onClick={() => setActiveTab('sensitivity')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'sensitivity'
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              <Activity className="w-4 h-4" />
              {t("tab.sensitivity")}
            </button>
          </div>

          {activeTab === 'simulation' && (
            <>
              <div className="text-center mb-10">
               <h2 className="text-2xl md:text-3xl font-bold mb-3">
                  {t("simulation.title")}
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  {t("simulation.description")}
                </p>
              </div>

              <div className="grid lg:grid-cols-[380px_1fr] gap-6">
                <div className="space-y-0">
                  <ScenarioManager
                    currentScenario={currentScenario}
                    onLoadScenario={handleLoadScenario}
                  />
                  <ExcelUploader
                    onDataImport={handleExcelDataImport}
                    simulationResults={simulationData}
                    simulationStats={simulationStatsForExport}
                  />
                  <SimulationForm
                    distributionType={distributionType}
                    onDistributionTypeChange={handleDistributionTypeChange}
                    params={distParams}
                    onParamsChange={setDistParams}
                    iterations={iterations}
                    onIterationsChange={setIterations}
                    onRunSimulation={handleRunSimulation}
                    onReset={handleReset}
                    isRunning={isRunning}
                  />
                </div>
                <ResultsPanel data={simulationData} stats={stats} />
              </div>
            </>
          )}

          {activeTab === 'sensitivity' && (
            <>
              <div className="text-center mb-10">
               <h2 className="text-2xl md:text-3xl font-bold mb-3">
                  {t("sensitivity.title")}
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  {t("sensitivity.description")}
                </p>
              </div>

              <SensitivityPanel />
            </>
          )}
        </motion.div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;
