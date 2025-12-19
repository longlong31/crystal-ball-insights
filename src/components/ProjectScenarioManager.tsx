import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SimulationCard } from "./SimulationCard";
import {
  ProjectScenario,
  saveProjectScenario,
  loadAllProjectScenarios,
  deleteProjectScenario,
  generateProjectScenarioId,
} from "@/lib/projectScenarioManager";
import { ProjectParams } from "@/lib/projectModel";
import { Save, FolderOpen, Trash2, Copy, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

interface ProjectScenarioManagerProps {
  currentParams: ProjectParams;
  onLoadScenario: (params: ProjectParams) => void;
}

export const ProjectScenarioManager = ({
  currentParams,
  onLoadScenario,
}: ProjectScenarioManagerProps) => {
  const [scenarios, setScenarios] = useState<ProjectScenario[]>([]);
  const [scenarioName, setScenarioName] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setScenarios(loadAllProjectScenarios());
  }, []);

  const handleSaveScenario = () => {
    if (!scenarioName.trim()) {
      toast.error("Vui lòng nhập tên kịch bản");
      return;
    }

    const scenario: ProjectScenario = {
      id: generateProjectScenarioId(),
      name: scenarioName.trim(),
      createdAt: Date.now(),
      params: { ...currentParams },
    };

    saveProjectScenario(scenario);
    setScenarios(loadAllProjectScenarios());
    setScenarioName("");
    toast.success("Đã lưu kịch bản dự án");
  };

  const handleDeleteScenario = (id: string) => {
    deleteProjectScenario(id);
    setScenarios(loadAllProjectScenarios());
    toast.success("Đã xóa kịch bản");
  };

  const handleLoadScenario = (scenario: ProjectScenario) => {
    onLoadScenario(scenario.params);
    toast.success(`Đã tải kịch bản: ${scenario.name}`);
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
    return new Intl.NumberFormat("vi-VN").format(num);
  };

  return (
    <SimulationCard>
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <FolderOpen className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Quản lý kịch bản</h3>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-between"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span>{isExpanded ? "Thu gọn" : "Mở rộng"}</span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </Button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 overflow-hidden"
            >
              <div className="flex gap-2">
                <Input
                  placeholder="Tên kịch bản..."
                  value={scenarioName}
                  onChange={(e) => setScenarioName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveScenario()}
                />
                <Button onClick={handleSaveScenario} variant="glow">
                  <Save className="w-4 h-4 mr-2" />
                  Lưu
                </Button>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {scenarios.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Chưa có kịch bản nào được lưu
                  </p>
                ) : (
                  scenarios.map((scenario) => (
                    <motion.div
                      key={scenario.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{scenario.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(scenario.createdAt)}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleLoadScenario(scenario)}
                            title="Tải kịch bản"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteScenario(scenario.id)}
                            title="Xóa kịch bản"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground grid grid-cols-2 gap-1">
                        <span>Dự án: {scenario.params.projectName}</span>
                        <span>Vốn: {formatNumber(scenario.params.fixedAssetValue)} tr</span>
                        <span>Thời gian: {scenario.params.operationYears} năm</span>
                        <span>Vay: {scenario.params.debtRatio}%</span>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </SimulationCard>
  );
};
