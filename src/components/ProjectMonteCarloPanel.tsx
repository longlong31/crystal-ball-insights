import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ProjectParams } from "@/lib/projectModel";
import { defaultRiskVariables, ResultVariable } from "@/lib/sensitivityAnalysisAdvanced";
import {
  MonteCarloConfig,
  MonteCarloResult,
  MonteCarloVariable,
  createDefaultMonteCarloConfig,
  runMonteCarloSimulation,
  calculateProbability,
  getValueAtPercentile,
} from "@/lib/monteCarloAdvanced";
import { DistributionType } from "@/lib/distributions";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { Play, RotateCcw, Settings, BarChart2, TrendingUp, Target, Zap } from "lucide-react";

interface ProjectMonteCarloPanelProps {
  params: ProjectParams;
}

const formatNumber = (value: number, decimals: number = 0): string => {
  if (Math.abs(value) >= 1e9) {
    return (value / 1e9).toFixed(decimals + 1) + " tỷ";
  }
  if (Math.abs(value) >= 1e6) {
    return (value / 1e6).toFixed(decimals + 1) + " triệu";
  }
  return value.toLocaleString("vi-VN", { maximumFractionDigits: decimals });
};

const distributionOptions: { value: DistributionType; label: string }[] = [
  { value: "triangular", label: "Tam giác (Triangular)" },
  { value: "normal", label: "Chuẩn (Normal)" },
  { value: "uniform", label: "Đều (Uniform)" },
  { value: "lognormal", label: "Log-Normal" },
  { value: "beta", label: "Beta" },
];

const resultVariableLabels: Record<ResultVariable, string> = {
  npvTIPV: "NPV (TIPV)",
  irrTIPV: "IRR (TIPV)",
  dppTIPV: "DPP (TIPV)",
  dscrAverage: "DSCR Trung bình",
  npvEPV: "NPV (EPV)",
  irrEPV: "IRR (EPV)",
  dppEPV: "DPP (EPV)",
};

export function ProjectMonteCarloPanel({ params }: ProjectMonteCarloPanelProps) {
  const [config, setConfig] = useState<MonteCarloConfig>(() =>
    createDefaultMonteCarloConfig(defaultRiskVariables)
  );
  const [result, setResult] = useState<MonteCarloResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedResult, setSelectedResult] = useState<ResultVariable>("npvTIPV");
  const [threshold, setThreshold] = useState<number>(0);

  const handleRunSimulation = useCallback(() => {
    setIsRunning(true);
    setProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 10, 90));
    }, 100);

    setTimeout(() => {
      const simResult = runMonteCarloSimulation(params, config);
      setResult(simResult);
      setProgress(100);
      clearInterval(progressInterval);
      setTimeout(() => setIsRunning(false), 200);
    }, 1500);
  }, [params, config]);

  const handleReset = useCallback(() => {
    setResult(null);
    setProgress(0);
    setConfig(createDefaultMonteCarloConfig(defaultRiskVariables));
  }, []);

  const updateVariable = (index: number, updates: Partial<MonteCarloVariable>) => {
    setConfig((prev) => ({
      ...prev,
      variables: prev.variables.map((v, i) => (i === index ? { ...v, ...updates } : v)),
    }));
  };

  const updateVariableParams = (index: number, paramKey: string, value: number) => {
    setConfig((prev) => ({
      ...prev,
      variables: prev.variables.map((v, i) =>
        i === index ? { ...v, params: { ...v.params, [paramKey]: value } } : v
      ),
    }));
  };

  const currentResultData = result?.results[selectedResult];

  return (
    <div className="space-y-6">
      {/* Config Panel */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Cấu hình mô phỏng Monte Carlo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Iterations */}
          <div className="flex items-center gap-4">
            <Label className="w-32">Số lần lặp:</Label>
            <Select
              value={config.iterations.toString()}
              onValueChange={(v) => setConfig((prev) => ({ ...prev, iterations: parseInt(v) }))}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1000">1,000</SelectItem>
                <SelectItem value="5000">5,000</SelectItem>
                <SelectItem value="10000">10,000</SelectItem>
                <SelectItem value="50000">50,000</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Variables */}
          <div>
            <Label className="mb-3 block text-sm font-medium">Biến đầu vào (Rủi ro):</Label>
            <div className="grid gap-4">
              {config.variables.map((variable, index) => (
                <div key={variable.key} className="p-4 rounded-lg bg-muted/30 border border-border/50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium">{variable.name}</span>
                    <Select
                      value={variable.distribution}
                      onValueChange={(v) => updateVariable(index, { distribution: v as DistributionType })}
                    >
                      <SelectTrigger className="w-44">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {distributionOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {variable.distribution === "triangular" && (
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Min</Label>
                        <Input
                          type="number"
                          value={variable.params.min}
                          onChange={(e) => updateVariableParams(index, "min", parseFloat(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Mode</Label>
                        <Input
                          type="number"
                          value={variable.params.mode}
                          onChange={(e) => updateVariableParams(index, "mode", parseFloat(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Max</Label>
                        <Input
                          type="number"
                          value={variable.params.max}
                          onChange={(e) => updateVariableParams(index, "max", parseFloat(e.target.value))}
                        />
                      </div>
                    </div>
                  )}

                  {variable.distribution === "normal" && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Mean</Label>
                        <Input
                          type="number"
                          value={variable.params.mean || variable.params.mode}
                          onChange={(e) => updateVariableParams(index, "mean", parseFloat(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Std Dev</Label>
                        <Input
                          type="number"
                          value={variable.params.stdDev || (variable.params.max - variable.params.min) / 6}
                          onChange={(e) => updateVariableParams(index, "stdDev", parseFloat(e.target.value))}
                        />
                      </div>
                    </div>
                  )}

                  {variable.distribution === "uniform" && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Min</Label>
                        <Input
                          type="number"
                          value={variable.params.min}
                          onChange={(e) => updateVariableParams(index, "min", parseFloat(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Max</Label>
                        <Input
                          type="number"
                          value={variable.params.max}
                          onChange={(e) => updateVariableParams(index, "max", parseFloat(e.target.value))}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Run Button */}
          <div className="flex gap-3">
            <Button variant="glow" className="flex-1" onClick={handleRunSimulation} disabled={isRunning}>
              <Play className="w-4 h-4 mr-2" />
              {isRunning ? "Đang chạy..." : "Chạy mô phỏng"}
            </Button>
            <Button variant="outline" onClick={handleReset} disabled={isRunning}>
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>

          {isRunning && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-muted-foreground text-center">
                Đang chạy {config.iterations.toLocaleString()} lần mô phỏng...
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Result Selector */}
          <Card className="glass">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-primary" />
                  Kết quả mô phỏng
                </CardTitle>
                <Select value={selectedResult} onValueChange={(v) => setSelectedResult(v as ResultVariable)}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {config.resultVariables.map((rv) => (
                      <SelectItem key={rv} value={rv}>
                        {resultVariableLabels[rv]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="histogram">
                <TabsList className="grid grid-cols-4 w-full max-w-lg mx-auto mb-6">
                  <TabsTrigger value="histogram">Histogram</TabsTrigger>
                  <TabsTrigger value="cdf">CDF</TabsTrigger>
                  <TabsTrigger value="stats">Thống kê</TabsTrigger>
                  <TabsTrigger value="convergence">Hội tụ</TabsTrigger>
                </TabsList>

                {/* Histogram */}
                <TabsContent value="histogram">
                  {currentResultData && (
                    <div className="space-y-4">
                      <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={currentResultData.histogram}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                          <XAxis
                            dataKey="bin"
                            tickFormatter={(v) => formatNumber(v)}
                            className="text-xs fill-muted-foreground"
                          />
                          <YAxis
                            tickFormatter={(v) => `${(v * 100).toFixed(1)}%`}
                            className="text-xs fill-muted-foreground"
                          />
                          <Tooltip
                            formatter={(value: number) => [`${(value * 100).toFixed(2)}%`, "Tần suất"]}
                            labelFormatter={(v) => `Giá trị: ${formatNumber(v as number)}`}
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                            }}
                          />
                          <ReferenceLine x={currentResultData.statistics.mean} stroke="hsl(var(--primary))" strokeDasharray="5 5" />
                          <Bar dataKey="frequency" fill="hsl(var(--primary))" opacity={0.8}>
                            {currentResultData.histogram.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.bin >= 0 ? "hsl(var(--chart-2))" : "hsl(var(--destructive))"}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>

                      {/* Threshold Analysis */}
                      <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                        <div className="flex items-center gap-4 mb-3">
                          <Target className="w-5 h-5 text-primary" />
                          <span className="font-medium">Phân tích ngưỡng</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <Label>Ngưỡng:</Label>
                          <Input
                            type="number"
                            value={threshold}
                            onChange={(e) => setThreshold(parseFloat(e.target.value) || 0)}
                            className="w-40"
                          />
                          <div className="flex-1 text-right">
                            <span className="text-lg font-bold text-primary">
                              {calculateProbability(currentResultData.values, threshold, true).toFixed(1)}%
                            </span>
                            <span className="text-sm text-muted-foreground ml-2">xác suất ≥ ngưỡng</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* CDF */}
                <TabsContent value="cdf">
                  {currentResultData && (
                    <ResponsiveContainer width="100%" height={350}>
                      <AreaChart data={currentResultData.cdf}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                        <XAxis
                          dataKey="value"
                          tickFormatter={(v) => formatNumber(v)}
                          className="text-xs fill-muted-foreground"
                        />
                        <YAxis
                          tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                          domain={[0, 1]}
                          className="text-xs fill-muted-foreground"
                        />
                        <Tooltip
                          formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, "Xác suất tích lũy"]}
                          labelFormatter={(v) => `Giá trị: ${formatNumber(v as number)}`}
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <ReferenceLine y={0.5} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" />
                        <Area type="monotone" dataKey="probability" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </TabsContent>

                {/* Statistics */}
                <TabsContent value="stats">
                  {currentResultData && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: "Giá trị nhỏ nhất", value: currentResultData.statistics.min },
                        { label: "Giá trị lớn nhất", value: currentResultData.statistics.max },
                        { label: "Trung bình", value: currentResultData.statistics.mean },
                        { label: "Độ lệch chuẩn", value: currentResultData.statistics.stdDev },
                        { label: "P5", value: currentResultData.statistics.percentile5 },
                        { label: "P25", value: currentResultData.statistics.percentile25 },
                        { label: "Trung vị (P50)", value: currentResultData.statistics.median },
                        { label: "P75", value: currentResultData.statistics.percentile75 },
                        { label: "P90", value: currentResultData.statistics.percentile90 },
                        { label: "P95", value: currentResultData.statistics.percentile95 },
                        { label: "Skewness", value: currentResultData.statistics.skewness, decimals: 3 },
                        { label: "Kurtosis", value: currentResultData.statistics.kurtosis, decimals: 3 },
                      ].map((stat) => (
                        <div key={stat.label} className="p-3 rounded-lg bg-muted/30 border border-border/50">
                          <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                          <p className="text-lg font-bold">{formatNumber(stat.value, stat.decimals || 0)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Convergence */}
                <TabsContent value="convergence">
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={result.convergenceData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                      <XAxis dataKey="iteration" className="text-xs fill-muted-foreground" />
                      <YAxis tickFormatter={(v) => formatNumber(v)} className="text-xs fill-muted-foreground" />
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          formatNumber(value),
                          name === "mean" ? "Trung bình" : "Độ lệch chuẩn",
                        ]}
                        labelFormatter={(v) => `Lần lặp: ${v}`}
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Line type="monotone" dataKey="mean" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Correlation Analysis */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Phân tích tương quan (Contribution to Variance)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={Object.entries(result.correlations.contributions)
                    .map(([key, value]) => {
                      const variable = config.variables.find((v) => v.key === key);
                      return { name: variable?.name || key, contribution: value };
                    })
                    .sort((a, b) => b.contribution - a.contribution)}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis type="number" tickFormatter={(v) => `${v.toFixed(1)}%`} domain={[0, "auto"]} />
                  <YAxis type="category" dataKey="name" width={150} className="text-xs fill-muted-foreground" />
                  <Tooltip
                    formatter={(value: number) => [`${value.toFixed(2)}%`, "Đóng góp"]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="contribution" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
