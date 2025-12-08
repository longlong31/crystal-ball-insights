import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { SimulationCard } from "./SimulationCard";
import {
  SimulationScenario,
  saveScenario,
  loadAllScenarios,
  deleteScenario,
  generateScenarioId,
} from "@/lib/scenarioManager";
import { DistributionType } from "@/lib/distributions";
import {
  Save,
  FolderOpen,
  Trash2,
  Clock,
  ChevronDown,
  ChevronUp,
  Copy,
} from "lucide-react";
import { toast } from "sonner";

interface ScenarioManagerProps {
  currentScenario: {
    distributionType: DistributionType;
    params: Record<string, number>;
    iterations: number;
    results?: number[];
    stats?: {
      min: number;
      max: number;
      mean: number;
      stdDev: number;
      percentile5: number;
      percentile25: number;
      percentile50: number;
      percentile75: number;
      percentile95: number;
    };
  };
  onLoadScenario: (scenario: SimulationScenario) => void;
}

export const ScenarioManager = ({
  currentScenario,
  onLoadScenario,
}: ScenarioManagerProps) => {
  const [scenarios, setScenarios] = useState<SimulationScenario[]>(loadAllScenarios());
  const [scenarioName, setScenarioName] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSaveScenario = () => {
    if (!scenarioName.trim()) {
      toast.error("Vui lòng nhập tên kịch bản");
      return;
    }

    const newScenario: SimulationScenario = {
      id: generateScenarioId(),
      name: scenarioName.trim(),
      createdAt: Date.now(),
      distributionType: currentScenario.distributionType,
      params: currentScenario.params,
      iterations: currentScenario.iterations,
      results: currentScenario.results,
      stats: currentScenario.stats,
    };

    saveScenario(newScenario);
    setScenarios(loadAllScenarios());
    setScenarioName("");
    toast.success("Đã lưu kịch bản thành công");
  };

  const handleDeleteScenario = (id: string) => {
    deleteScenario(id);
    setScenarios(loadAllScenarios());
    toast.success("Đã xóa kịch bản");
  };

  const handleLoadScenario = (scenario: SimulationScenario) => {
    onLoadScenario(scenario);
    toast.success(`Đã tải kịch bản "${scenario.name}"`);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("vi-VN").format(Math.round(num));
  };

  return (
    <SimulationCard className="mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <FolderOpen className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Quản lý kịch bản</h3>
          {scenarios.length > 0 && (
            <span className="px-2 py-0.5 text-xs bg-primary/20 text-primary rounded-full">
              {scenarios.length}
            </span>
          )}
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
              {/* Save new scenario */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={scenarioName}
                  onChange={(e) => setScenarioName(e.target.value)}
                  placeholder="Nhập tên kịch bản..."
                  className="flex-1 h-10 px-4 rounded-lg bg-muted/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
                />
                <Button onClick={handleSaveScenario} size="sm" variant="glow">
                  <Save className="w-4 h-4 mr-2" />
                  Lưu
                </Button>
              </div>

              {/* Saved scenarios list */}
              {scenarios.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {scenarios.map((scenario) => (
                    <motion.div
                      key={scenario.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-lg bg-muted/30 border border-border/50 hover:border-primary/50 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{scenario.name}</h4>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>{formatDate(scenario.createdAt)}</span>
                            <span>•</span>
                            <span className="capitalize">{scenario.distributionType}</span>
                          </div>
                          {scenario.stats && (
                            <div className="mt-2 text-xs text-muted-foreground">
                              <span>Mean: {formatNumber(scenario.stats.mean)}</span>
                              <span className="mx-2">|</span>
                              <span>
                                Range: {formatNumber(scenario.stats.min)} -{" "}
                                {formatNumber(scenario.stats.max)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleLoadScenario(scenario)}
                            className="h-8 w-8 p-0"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteScenario(scenario.id)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  Chưa có kịch bản nào được lưu
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </SimulationCard>
  );
};
