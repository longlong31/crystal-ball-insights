import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { SimulationCard } from "./SimulationCard";
import { ProjectParams, defaultProjectParams } from "@/lib/projectModel";
import { calculateProject } from "@/lib/projectCalculator";
import {
  runOneDimensionalSensitivity,
  runTwoDimensionalSensitivity,
  runScenarioAnalysis,
  calculateTornadoData,
  defaultRiskVariables,
  defaultScenarios,
  SensitivityVariable,
  ResultVariable,
  OneDimensionalResult,
  TwoDimensionalResult,
  ScenarioResult,
  TornadoData,
} from "@/lib/sensitivityAnalysisAdvanced";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  ReferenceLine,
} from "recharts";
import {
  Activity,
  BarChart2,
  Grid3X3,
  FileText,
  Play,
  Settings2,
} from "lucide-react";

interface AdvancedSensitivityPanelProps {
  params: ProjectParams;
}

type AnalysisType = "oneDim" | "twoDim" | "scenario" | "tornado";

export const AdvancedSensitivityPanel = ({ params }: AdvancedSensitivityPanelProps) => {
  const [analysisType, setAnalysisType] = useState<AnalysisType>("oneDim");
  const [selectedVar1, setSelectedVar1] = useState<string>(defaultRiskVariables[0].key);
  const [selectedVar2, setSelectedVar2] = useState<string>(defaultRiskVariables[1].key);
  const [selectedResult, setSelectedResult] = useState<ResultVariable>("npvTIPV");
  const [isRunning, setIsRunning] = useState(false);

  const [oneDimResult, setOneDimResult] = useState<OneDimensionalResult | null>(null);
  const [twoDimResult, setTwoDimResult] = useState<TwoDimensionalResult | null>(null);
  const [scenarioResults, setScenarioResults] = useState<ScenarioResult[] | null>(null);
  const [tornadoData, setTornadoData] = useState<TornadoData[] | null>(null);

  const runAnalysis = useCallback(() => {
    setIsRunning(true);

    setTimeout(() => {
      const var1 = defaultRiskVariables.find((v) => v.key === selectedVar1);
      const var2 = defaultRiskVariables.find((v) => v.key === selectedVar2);

      switch (analysisType) {
        case "oneDim":
          if (var1) {
            const result = runOneDimensionalSensitivity(params, var1);
            setOneDimResult(result);
          }
          break;
        case "twoDim":
          if (var1 && var2) {
            const result = runTwoDimensionalSensitivity(params, var1, var2, selectedResult);
            setTwoDimResult(result);
          }
          break;
        case "scenario":
          const scenarios = runScenarioAnalysis(params, defaultScenarios);
          setScenarioResults(scenarios);
          break;
        case "tornado":
          const tornado = calculateTornadoData(params, defaultRiskVariables, selectedResult);
          setTornadoData(tornado);
          break;
      }

      setIsRunning(false);
    }, 100);
  }, [analysisType, params, selectedVar1, selectedVar2, selectedResult]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(num);
  };

  const formatPercent = (num: number) => `${(num * 100).toFixed(2)}%`;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <SimulationCard>
        <div className="flex items-center gap-3 mb-6">
          <Settings2 className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Phân tích độ nhạy nâng cao</h3>
        </div>

        {/* Analysis Type Selection */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {[
            { key: "oneDim", label: "1 chiều", icon: <Activity className="w-4 h-4" /> },
            { key: "twoDim", label: "2 chiều", icon: <Grid3X3 className="w-4 h-4" /> },
            { key: "scenario", label: "Kịch bản", icon: <FileText className="w-4 h-4" /> },
            { key: "tornado", label: "Tornado", icon: <BarChart2 className="w-4 h-4" /> },
          ].map((type) => (
            <button
              key={type.key}
              onClick={() => setAnalysisType(type.key as AnalysisType)}
              className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${
                analysisType === type.key
                  ? "bg-primary/20 border-primary text-primary"
                  : "bg-muted/30 border-border hover:border-primary/50"
              }`}
            >
              {type.icon}
              <span className="text-sm font-medium">{type.label}</span>
            </button>
          ))}
        </div>

        {/* Variable Selection */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Biến rủi ro 1</label>
            <select
              value={selectedVar1}
              onChange={(e) => setSelectedVar1(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-border focus:border-primary outline-none text-sm"
            >
              {defaultRiskVariables.map((v) => (
                <option key={v.key} value={v.key}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          {analysisType === "twoDim" && (
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Biến rủi ro 2</label>
              <select
                value={selectedVar2}
                onChange={(e) => setSelectedVar2(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-border focus:border-primary outline-none text-sm"
              >
                {defaultRiskVariables.map((v) => (
                  <option key={v.key} value={v.key}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Biến kết quả</label>
            <select
              value={selectedResult}
              onChange={(e) => setSelectedResult(e.target.value as ResultVariable)}
              className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-border focus:border-primary outline-none text-sm"
            >
              <option value="npvTIPV">NPV (TIPV)</option>
              <option value="irrTIPV">IRR (TIPV)</option>
              <option value="npvEPV">NPV (EPV)</option>
              <option value="irrEPV">IRR (EPV)</option>
            </select>
          </div>
        </div>

        <Button variant="glow" onClick={runAnalysis} disabled={isRunning} className="w-full">
          <Play className="w-4 h-4 mr-2" />
          {isRunning ? "Đang phân tích..." : "Chạy phân tích"}
        </Button>
      </SimulationCard>

      {/* Results */}
      {analysisType === "oneDim" && oneDimResult && (
        <OneDimChart result={oneDimResult} formatNumber={formatNumber} />
      )}

      {analysisType === "twoDim" && twoDimResult && (
        <TwoDimTable result={twoDimResult} formatNumber={formatNumber} />
      )}

      {analysisType === "scenario" && scenarioResults && (
        <ScenarioTable results={scenarioResults} formatNumber={formatNumber} formatPercent={formatPercent} />
      )}

      {analysisType === "tornado" && tornadoData && (
        <TornadoChart data={tornadoData} formatNumber={formatNumber} />
      )}
    </div>
  );
};

// One-Dimensional Chart
const OneDimChart = ({
  result,
  formatNumber,
}: {
  result: OneDimensionalResult;
  formatNumber: (n: number) => string;
}) => {
  const chartData = result.values.map((val, idx) => ({
    value: val,
    npvTIPV: result.results.npvTIPV[idx],
    irrTIPV: result.results.irrTIPV[idx] * 100,
    npvEPV: result.results.npvEPV[idx],
    irrEPV: result.results.irrEPV[idx] * 100,
  }));

  return (
    <SimulationCard>
      <h4 className="font-semibold mb-4">
        Phân tích độ nhạy 1 chiều: {result.variable.name}
      </h4>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="value"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickFormatter={(v) => `${v} ${result.variable.unit}`}
            />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={formatNumber} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              formatter={(value: number) => formatNumber(value)}
            />
            <Legend />
            <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
            <Line type="monotone" dataKey="npvTIPV" name="NPV (TIPV)" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="npvEPV" name="NPV (EPV)" stroke="#22c55e" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </SimulationCard>
  );
};

// Two-Dimensional Table
const TwoDimTable = ({
  result,
  formatNumber,
}: {
  result: TwoDimensionalResult;
  formatNumber: (n: number) => string;
}) => {
  return (
    <SimulationCard>
      <h4 className="font-semibold mb-4">
        Phân tích độ nhạy 2 chiều: {result.variable1.name} vs {result.variable2.name}
      </h4>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="p-2 text-left bg-muted/50 border border-border">
                {result.variable2.name} \ {result.variable1.name}
              </th>
              {result.values1.map((v1) => (
                <th key={v1} className="p-2 text-center bg-muted/50 border border-border font-mono">
                  {v1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.values2.map((v2, i) => (
              <tr key={v2}>
                <td className="p-2 bg-muted/30 border border-border font-mono">{v2}</td>
                {result.results.npvTIPV[i]?.map((val, j) => (
                  <td
                    key={j}
                    className={`p-2 text-center border border-border font-mono ${
                      val > 0 ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                    }`}
                  >
                    {formatNumber(val)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SimulationCard>
  );
};

// Scenario Table
const ScenarioTable = ({
  results,
  formatNumber,
  formatPercent,
}: {
  results: ScenarioResult[];
  formatNumber: (n: number) => string;
  formatPercent: (n: number) => string;
}) => {
  return (
    <SimulationCard>
      <h4 className="font-semibold mb-4">Phân tích kịch bản</h4>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="p-3 text-left bg-muted/50 border border-border">Kịch bản</th>
              <th className="p-3 text-center bg-muted/50 border border-border">NPV (TIPV)</th>
              <th className="p-3 text-center bg-muted/50 border border-border">IRR (TIPV)</th>
              <th className="p-3 text-center bg-muted/50 border border-border">NPV (EPV)</th>
              <th className="p-3 text-center bg-muted/50 border border-border">IRR (EPV)</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.scenario.name}>
                <td className="p-3 border border-border">
                  <div className="font-medium">{r.scenario.name}</div>
                  <div className="text-xs text-muted-foreground">{r.scenario.description}</div>
                </td>
                <td className={`p-3 text-center border border-border font-mono ${r.comparison.npvTIPV.value > 0 ? "text-green-500" : "text-red-500"}`}>
                  {formatNumber(r.comparison.npvTIPV.value)}
                </td>
                <td className="p-3 text-center border border-border font-mono">
                  {formatPercent(r.comparison.irrTIPV.value)}
                </td>
                <td className={`p-3 text-center border border-border font-mono ${r.comparison.npvEPV.value > 0 ? "text-green-500" : "text-red-500"}`}>
                  {formatNumber(r.comparison.npvEPV.value)}
                </td>
                <td className="p-3 text-center border border-border font-mono">
                  {formatPercent(r.comparison.irrEPV.value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SimulationCard>
  );
};

// Tornado Chart
const TornadoChart = ({
  data,
  formatNumber,
}: {
  data: TornadoData[];
  formatNumber: (n: number) => string;
}) => {
  const chartData = data.map((d) => ({
    variable: d.variable,
    low: d.lowValue - d.baseValue,
    high: d.highValue - d.baseValue,
    range: d.range,
  }));

  return (
    <SimulationCard>
      <h4 className="font-semibold mb-4">Biểu đồ Tornado - Mức độ ảnh hưởng của các biến</h4>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={formatNumber} />
            <YAxis type="category" dataKey="variable" stroke="hsl(var(--muted-foreground))" fontSize={12} width={120} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              formatter={(value: number) => formatNumber(value)}
            />
            <ReferenceLine x={0} stroke="hsl(var(--muted-foreground))" />
            <Bar dataKey="low" stackId="a" fill="#ef4444" />
            <Bar dataKey="high" stackId="a" fill="#22c55e" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 text-sm text-muted-foreground">
        Biến có ảnh hưởng nhiều nhất: <span className="font-medium text-foreground">{data[0]?.variable}</span>
      </div>
    </SimulationCard>
  );
};
