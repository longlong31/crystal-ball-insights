import { DistributionType, distributionInfo } from "@/lib/distributions";
import { SimulationCard } from "./SimulationCard";
import { ChevronDown, Info } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface DistributionSelectorProps {
  selectedType: DistributionType;
  onTypeChange: (type: DistributionType) => void;
  params: Record<string, number>;
  onParamsChange: (params: Record<string, number>) => void;
}

const paramLabels: Record<string, string> = {
  min: "Giá trị tối thiểu",
  max: "Giá trị tối đa",
  mode: "Giá trị có khả năng nhất",
  mean: "Giá trị trung bình (μ)",
  stdDev: "Độ lệch chuẩn (σ)",
  alpha: "Alpha (α)",
  beta: "Beta (β)",
};

export const DistributionSelector = ({
  selectedType,
  onTypeChange,
  params,
  onParamsChange,
}: DistributionSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const currentDist = distributionInfo[selectedType];
  const types = Object.keys(distributionInfo) as DistributionType[];

  const handleParamChange = (key: string, value: string) => {
    onParamsChange({ ...params, [key]: parseFloat(value) || 0 });
  };

  return (
    <div className="space-y-4">
      {/* Distribution Type Dropdown */}
      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">Loại phân phối</label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full h-11 px-4 rounded-lg bg-muted/50 border border-border hover:border-primary/50 flex items-center justify-between text-left transition-all"
          >
            <span className="font-medium">{currentDist.name}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute z-50 w-full mt-2 py-2 rounded-lg bg-card border border-border shadow-xl"
              >
                {types.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      onTypeChange(type);
                      setIsOpen(false);
                    }}
                    className={`w-full px-4 py-2.5 text-left hover:bg-muted/50 transition-colors ${
                      type === selectedType ? 'bg-primary/10 text-primary' : ''
                    }`}
                  >
                    <div className="font-medium">{distributionInfo[type].name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {distributionInfo[type].description}
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Info Box */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
        <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
        <p className="text-xs text-muted-foreground">{currentDist.description}</p>
      </div>

      {/* Distribution Parameters */}
      <div className="space-y-4">
        {currentDist.params.map((param) => (
          <div key={param} className="space-y-2">
            <label className="text-sm text-muted-foreground">
              {paramLabels[param] || param}
            </label>
            <input
              type="number"
              value={params[param] || ""}
              onChange={(e) => handleParamChange(param, e.target.value)}
              className="w-full h-11 px-4 rounded-lg bg-muted/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-mono"
              step={param === 'alpha' || param === 'beta' ? 0.1 : undefined}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
