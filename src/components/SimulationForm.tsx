import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { Play, RotateCcw, Settings2 } from "lucide-react";
import { SimulationCard } from "./SimulationCard";
import { DistributionSelector } from "./DistributionSelector";
import { DistributionType, distributionInfo } from "@/lib/distributions";
import { useLanguage } from "@/contexts/LanguageContext";

interface SimulationFormProps {
  distributionType: DistributionType;
  onDistributionTypeChange: (type: DistributionType) => void;
  params: Record<string, number>;
  onParamsChange: (params: Record<string, number>) => void;
  iterations: number;
  onIterationsChange: (iterations: number) => void;
  onRunSimulation: () => void;
  onReset: () => void;
  isRunning: boolean;
}

export const SimulationForm = ({
  distributionType,
  onDistributionTypeChange,
  params,
  onParamsChange,
  iterations,
  onIterationsChange,
  onRunSimulation,
  onReset,
  isRunning,
}: SimulationFormProps) => {
  const { t } = useLanguage();

  return (
    <SimulationCard className="h-full">
      <div className="flex items-center gap-3 mb-6">
        <Settings2 className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">{t("form.params")}</h3>
      </div>

      <div className="space-y-5">
        <DistributionSelector
          selectedType={distributionType}
          onTypeChange={onDistributionTypeChange}
          params={params}
          onParamsChange={onParamsChange}
        />

        <div className="pt-2 border-t border-border">
          <div className="space-y-2 mt-4">
            <label className="text-sm text-muted-foreground">{t("form.iterations")}</label>
            <input
              type="number"
              value={iterations}
              onChange={(e) => onIterationsChange(parseInt(e.target.value) || 1000)}
              min={100}
              max={100000}
              step={100}
              className="w-full h-11 px-4 rounded-lg bg-muted/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-mono"
            />
          </div>
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
            {isRunning ? t("form.running") : t("form.run")}
          </Button>
          <Button variant="outline" size="lg" onClick={onReset}>
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </SimulationCard>
  );
};
