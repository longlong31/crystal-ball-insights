import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { HeroSection } from "@/components/HeroSection";
import { SimulationForm } from "@/components/SimulationForm";
import { ResultsPanel } from "@/components/ResultsPanel";
import { runMonteCarloSimulation, calculateStatistics } from "@/lib/monteCarlo";
import { Sparkles } from "lucide-react";

const Index = () => {
  const [params, setParams] = useState({
    minValue: 1000000,
    maxValue: 5000000,
    mostLikely: 2500000,
    iterations: 10000,
  });

  const [simulationData, setSimulationData] = useState<number[]>([]);
  const [stats, setStats] = useState(calculateStatistics([]));
  const [isRunning, setIsRunning] = useState(false);

  const handleRunSimulation = useCallback(() => {
    setIsRunning(true);
    
    // Use setTimeout to allow UI to update
    setTimeout(() => {
      const results = runMonteCarloSimulation(
        params.minValue,
        params.maxValue,
        params.mostLikely,
        params.iterations
      );
      
      setSimulationData(results);
      setStats(calculateStatistics(results));
      setIsRunning(false);
    }, 100);
  }, [params]);

  const handleReset = useCallback(() => {
    setSimulationData([]);
    setStats(calculateStatistics([]));
    setParams({
      minValue: 1000000,
      maxValue: 5000000,
      mostLikely: 2500000,
      iterations: 10000,
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold">Crystal Ball</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Hướng dẫn
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Ví dụ
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Tài liệu
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <HeroSection />

      {/* Main Content */}
      <main className="container pb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              Bắt đầu mô phỏng
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Nhập các thông số của bạn và chạy mô phỏng Monte Carlo để xem phân phối 
              xác suất của các kết quả có thể xảy ra.
            </p>
          </div>

          <div className="grid lg:grid-cols-[380px_1fr] gap-6">
            <SimulationForm
              params={params}
              onParamsChange={setParams}
              onRunSimulation={handleRunSimulation}
              onReset={handleReset}
              isRunning={isRunning}
            />
            <ResultsPanel data={simulationData} stats={stats} />
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>Crystal Ball - Công cụ phân tích rủi ro và dự báo Monte Carlo</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
