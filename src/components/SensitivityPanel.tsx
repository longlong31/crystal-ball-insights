import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { SimulationCard } from "./SimulationCard";
import { SensitivityChart } from "./SensitivityChart";
import { DistributionSelector } from "./DistributionSelector";
import { Button } from "./ui/button";
import { 
  SensitivityVariable, 
  SensitivityResult, 
  TornadoData,
  runSensitivityAnalysis,
  calculateTornadoData 
} from "@/lib/sensitivityAnalysis";
import { DistributionType, distributionInfo, DistributionParams } from "@/lib/distributions";
import { Plus, Trash2, Play, Variable, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";

interface SensitivityPanelProps {
  onAnalysisComplete?: (results: SensitivityResult[]) => void;
}

const defaultParams: Record<DistributionType, Record<string, number>> = {
  triangular: { min: 100, mode: 150, max: 200 },
  normal: { mean: 150, stdDev: 25 },
  lognormal: { mean: 150, stdDev: 30 },
  uniform: { min: 100, max: 200 },
  beta: { alpha: 2, beta: 5, min: 100, max: 200 },
};

export const SensitivityPanel = ({ onAnalysisComplete }: SensitivityPanelProps) => {
  const [variables, setVariables] = useState<Array<{
    id: string;
    name: string;
    type: DistributionType;
    params: Record<string, number>;
    expanded: boolean;
  }>>([
    {
      id: 'cost',
      name: 'Chi phí nguyên vật liệu',
      type: 'triangular',
      params: { min: 1000000, mode: 1500000, max: 2000000 },
      expanded: true,
    },
    {
      id: 'labor',
      name: 'Chi phí nhân công',
      type: 'triangular',
      params: { min: 500000, mode: 750000, max: 1000000 },
      expanded: false,
    },
    {
      id: 'overhead',
      name: 'Chi phí quản lý',
      type: 'uniform',
      params: { min: 200000, max: 400000 },
      expanded: false,
    },
  ]);

  const [results, setResults] = useState<SensitivityResult[]>([]);
  const [tornadoData, setTornadoData] = useState<TornadoData[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [iterations, setIterations] = useState(5000);

  const addVariable = () => {
    const newId = `var_${Date.now()}`;
    setVariables([
      ...variables,
      {
        id: newId,
        name: `Biến ${variables.length + 1}`,
        type: 'triangular',
        params: { ...defaultParams.triangular },
        expanded: true,
      },
    ]);
  };

  const removeVariable = (id: string) => {
    setVariables(variables.filter((v) => v.id !== id));
  };

  const updateVariable = (id: string, updates: Partial<typeof variables[0]>) => {
    setVariables(
      variables.map((v) => (v.id === id ? { ...v, ...updates } : v))
    );
  };

  const toggleExpanded = (id: string) => {
    setVariables(
      variables.map((v) => (v.id === id ? { ...v, expanded: !v.expanded } : v))
    );
  };

  const handleTypeChange = (id: string, type: DistributionType) => {
    updateVariable(id, { 
      type, 
      params: { ...defaultParams[type] } 
    });
  };

  const runAnalysis = useCallback(() => {
    setIsRunning(true);

    setTimeout(() => {
      // Convert to SensitivityVariable format
      const sensitivityVars: SensitivityVariable[] = variables.map((v) => {
        const distParams: DistributionParams = {
          type: v.type,
          ...v.params,
        };

        // Calculate base value
        let baseValue = v.params.mean || v.params.mode || 
          ((v.params.min || 0) + (v.params.max || 0)) / 2;

        return {
          id: v.id,
          name: v.name,
          baseValue,
          distribution: distParams,
        };
      });

      // Simple sum formula for demonstration
      const outputFormula = (values: Record<string, number>) => {
        return Object.values(values).reduce((sum, val) => sum + val, 0);
      };

      const analysisResults = runSensitivityAnalysis(
        sensitivityVars,
        outputFormula,
        iterations
      );

      const tornado = calculateTornadoData(sensitivityVars, outputFormula);

      setResults(analysisResults);
      setTornadoData(tornado);
      onAnalysisComplete?.(analysisResults);
      setIsRunning(false);
    }, 100);
  }, [variables, iterations, onAnalysisComplete]);

  return (
    <div className="space-y-6">
      {/* Variables Configuration */}
      <SimulationCard>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Variable className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Biến đầu vào</h3>
          </div>
          <Button variant="outline" size="sm" onClick={addVariable}>
            <Plus className="w-4 h-4 mr-1" />
            Thêm biến
          </Button>
        </div>

        <div className="space-y-4">
          {variables.map((variable, index) => (
            <motion.div
              key={variable.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="border border-border rounded-lg overflow-hidden"
            >
              {/* Variable Header */}
              <div 
                className="flex items-center gap-3 p-3 bg-muted/30 cursor-pointer"
                onClick={() => toggleExpanded(variable.id)}
              >
                <button className="p-1 hover:bg-muted rounded">
                  {variable.expanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                
                <input
                  type="text"
                  value={variable.name}
                  onChange={(e) => updateVariable(variable.id, { name: e.target.value })}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 bg-transparent border-none outline-none font-medium"
                />
                
                <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">
                  {distributionInfo[variable.type].name.split(' ')[0]}
                </span>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeVariable(variable.id);
                  }}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              {/* Variable Details */}
              {variable.expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="p-4 border-t border-border"
                >
                  <DistributionSelector
                    selectedType={variable.type}
                    onTypeChange={(type) => handleTypeChange(variable.id, type)}
                    params={variable.params}
                    onParamsChange={(params) => updateVariable(variable.id, { params })}
                  />
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Iterations Input */}
        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex items-center gap-4">
            <div className="flex-1 space-y-2">
              <label className="text-sm text-muted-foreground">Số lần lặp</label>
              <input
                type="number"
                value={iterations}
                onChange={(e) => setIterations(parseInt(e.target.value) || 1000)}
                min={100}
                max={50000}
                step={100}
                className="w-full h-10 px-4 rounded-lg bg-muted/50 border border-border focus:border-primary outline-none font-mono"
              />
            </div>
            
            <div className="pt-6">
              <Button
                variant="glow"
                size="lg"
                onClick={runAnalysis}
                disabled={isRunning || variables.length === 0}
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
                {isRunning ? "Đang phân tích..." : "Phân tích"}
              </Button>
            </div>
          </div>
        </div>
      </SimulationCard>

      {/* Results */}
      <SensitivityChart results={results} tornadoData={tornadoData} />
    </div>
  );
};
