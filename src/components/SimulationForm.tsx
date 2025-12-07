import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { Play, RotateCcw, Settings2 } from "lucide-react";
import { SimulationCard } from "./SimulationCard";

interface SimulationFormProps {
  params: {
    minValue: number;
    maxValue: number;
    mostLikely: number;
    iterations: number;
  };
  onParamsChange: (params: any) => void;
  onRunSimulation: () => void;
  onReset: () => void;
  isRunning: boolean;
}

export const SimulationForm = ({
  params,
  onParamsChange,
  onRunSimulation,
  onReset,
  isRunning,
}: SimulationFormProps) => {
  const handleChange = (field: string, value: string) => {
    onParamsChange({ ...params, [field]: parseFloat(value) || 0 });
  };

  return (
    <SimulationCard className="h-full">
      <div className="flex items-center gap-3 mb-6">
        <Settings2 className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Thông số mô phỏng</h3>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Giá trị tối thiểu</label>
          <input
            type="number"
            value={params.minValue}
            onChange={(e) => handleChange("minValue", e.target.value)}
            className="w-full h-11 px-4 rounded-lg bg-muted/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-mono"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Giá trị có khả năng nhất</label>
          <input
            type="number"
            value={params.mostLikely}
            onChange={(e) => handleChange("mostLikely", e.target.value)}
            className="w-full h-11 px-4 rounded-lg bg-muted/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-mono"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Giá trị tối đa</label>
          <input
            type="number"
            value={params.maxValue}
            onChange={(e) => handleChange("maxValue", e.target.value)}
            className="w-full h-11 px-4 rounded-lg bg-muted/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-mono"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Số lần mô phỏng</label>
          <input
            type="number"
            value={params.iterations}
            onChange={(e) => handleChange("iterations", e.target.value)}
            min={100}
            max={100000}
            step={100}
            className="w-full h-11 px-4 rounded-lg bg-muted/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-mono"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            variant="glow"
            size="lg"
            className="flex-1"
            onClick={onRunSimulation}
            disabled={isRunning}
          >
            {isRunning ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <RotateCcw className="w-4 h-4" />
              </motion.div>
            ) : (
              <Play className="w-4 h-4" />
            )}
            {isRunning ? "Đang chạy..." : "Chạy mô phỏng"}
          </Button>
          <Button variant="outline" size="lg" onClick={onReset}>
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </SimulationCard>
  );
};
