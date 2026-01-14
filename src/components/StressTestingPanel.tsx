import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { ProjectParams, ProjectResults } from "@/lib/projectModel";
import { calculateProject } from "@/lib/projectCalculator";
import { 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp, 
  Percent, 
  DollarSign,
  Activity,
  Play,
  RotateCcw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Zap
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

interface StressTestingPanelProps {
  params: ProjectParams;
  baseResults: ProjectResults;
}

interface StressScenario {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  enabled: boolean;
  changes: Partial<StressChange>;
}

interface StressChange {
  revenueChange: number; // % change
  costChange: number; // % change
  interestRateChange: number; // absolute change in percentage points
  inflationChange: number; // absolute change
  productionChange: number; // % change
}

interface StressResult {
  scenario: StressScenario;
  results: ProjectResults;
  impact: {
    npvChange: number;
    npvChangePercent: number;
    irrChange: number;
    dscrChange: number;
    stillViable: boolean;
  };
}

const defaultScenarios: StressScenario[] = [
  {
    id: "revenue_drop_30",
    name: "Doanh thu giảm 30%",
    description: "Kịch bản suy thoái kinh tế hoặc mất thị trường lớn",
    icon: TrendingDown,
    color: "text-red-500",
    enabled: true,
    changes: { revenueChange: -30 },
  },
  {
    id: "cost_increase_50",
    name: "Chi phí tăng 50%",
    description: "Lạm phát cao, giá nguyên vật liệu tăng mạnh",
    icon: TrendingUp,
    color: "text-orange-500",
    enabled: true,
    changes: { costChange: 50 },
  },
  {
    id: "interest_spike",
    name: "Lãi suất tăng đột ngột",
    description: "Ngân hàng trung ương tăng lãi suất 5%",
    icon: Percent,
    color: "text-purple-500",
    enabled: true,
    changes: { interestRateChange: 5 },
  },
  {
    id: "combined_mild",
    name: "Khủng hoảng nhẹ",
    description: "Doanh thu -15%, Chi phí +20%, Lãi suất +2%",
    icon: AlertCircle,
    color: "text-yellow-500",
    enabled: true,
    changes: { revenueChange: -15, costChange: 20, interestRateChange: 2 },
  },
  {
    id: "combined_severe",
    name: "Khủng hoảng nghiêm trọng",
    description: "Doanh thu -30%, Chi phí +50%, Lãi suất +5%",
    icon: AlertTriangle,
    color: "text-red-600",
    enabled: true,
    changes: { revenueChange: -30, costChange: 50, interestRateChange: 5 },
  },
  {
    id: "stagflation",
    name: "Đình lạm (Stagflation)",
    description: "Lạm phát cao +5%, Sản lượng giảm 20%",
    icon: Activity,
    color: "text-rose-500",
    enabled: false,
    changes: { inflationChange: 5, productionChange: -20 },
  },
];

const formatNumber = (value: number, decimals: number = 0): string => {
  if (Math.abs(value) >= 1e9) {
    return (value / 1e9).toFixed(decimals + 1) + " tỷ";
  }
  if (Math.abs(value) >= 1e6) {
    return (value / 1e6).toFixed(decimals + 1) + " triệu";
  }
  return value.toLocaleString("vi-VN", { maximumFractionDigits: decimals });
};

export function StressTestingPanel({ params, baseResults }: StressTestingPanelProps) {
  const [scenarios, setScenarios] = useState<StressScenario[]>(defaultScenarios);
  const [results, setResults] = useState<StressResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [customScenario, setCustomScenario] = useState<StressChange>({
    revenueChange: 0,
    costChange: 0,
    interestRateChange: 0,
    inflationChange: 0,
    productionChange: 0,
  });

  const toggleScenario = (id: string) => {
    setScenarios(prev => 
      prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s)
    );
  };

  const applyStressChanges = (baseParams: ProjectParams, changes: Partial<StressChange>): ProjectParams => {
    const stressedParams = { ...baseParams };
    
    if (changes.revenueChange) {
      stressedParams.basePrice = baseParams.basePrice * (1 + changes.revenueChange / 100);
    }
    
    if (changes.costChange) {
      stressedParams.componentCost = baseParams.componentCost * (1 + changes.costChange / 100);
      stressedParams.adminCost = baseParams.adminCost * (1 + changes.costChange / 100);
    }
    
    if (changes.interestRateChange) {
      stressedParams.nominalInterestRate = baseParams.nominalInterestRate + changes.interestRateChange;
    }
    
    if (changes.inflationChange) {
      stressedParams.inflationRate = baseParams.inflationRate + changes.inflationChange;
    }
    
    if (changes.productionChange) {
      stressedParams.designCapacity = baseParams.designCapacity * (1 + changes.productionChange / 100);
    }
    
    return stressedParams;
  };

  const runStressTests = useCallback(() => {
    setIsRunning(true);
    setProgress(0);
    setResults([]);

    const enabledScenarios = scenarios.filter(s => s.enabled);
    const totalScenarios = enabledScenarios.length;
    let completedScenarios = 0;

    const stressResults: StressResult[] = [];

    const runNext = () => {
      if (completedScenarios >= totalScenarios) {
        setResults(stressResults);
        setProgress(100);
        setTimeout(() => setIsRunning(false), 300);
        return;
      }

      const scenario = enabledScenarios[completedScenarios];
      const stressedParams = applyStressChanges(params, scenario.changes);
      const stressedResults = calculateProject(stressedParams);

      const npvChange = stressedResults.npvTIPV - baseResults.npvTIPV;
      const npvChangePercent = baseResults.npvTIPV !== 0 
        ? (npvChange / Math.abs(baseResults.npvTIPV)) * 100 
        : 0;

      stressResults.push({
        scenario,
        results: stressedResults,
        impact: {
          npvChange,
          npvChangePercent,
          irrChange: stressedResults.irrTIPV - baseResults.irrTIPV,
          dscrChange: stressedResults.dscrAverage - baseResults.dscrAverage,
          stillViable: stressedResults.npvTIPV > 0 && stressedResults.dscrAverage >= 1.0,
        },
      });

      completedScenarios++;
      setProgress((completedScenarios / totalScenarios) * 100);

      setTimeout(runNext, 200);
    };

    setTimeout(runNext, 100);
  }, [params, baseResults, scenarios]);

  const runCustomScenario = useCallback(() => {
    const stressedParams = applyStressChanges(params, customScenario);
    const stressedResults = calculateProject(stressedParams);

    const npvChange = stressedResults.npvTIPV - baseResults.npvTIPV;
    const npvChangePercent = baseResults.npvTIPV !== 0 
      ? (npvChange / Math.abs(baseResults.npvTIPV)) * 100 
      : 0;

    const customResult: StressResult = {
      scenario: {
        id: "custom",
        name: "Kịch bản tùy chỉnh",
        description: "Kịch bản do người dùng tạo",
        icon: Zap,
        color: "text-blue-500",
        enabled: true,
        changes: customScenario,
      },
      results: stressedResults,
      impact: {
        npvChange,
        npvChangePercent,
        irrChange: stressedResults.irrTIPV - baseResults.irrTIPV,
        dscrChange: stressedResults.dscrAverage - baseResults.dscrAverage,
        stillViable: stressedResults.npvTIPV > 0 && stressedResults.dscrAverage >= 1.0,
      },
    };

    setResults(prev => {
      const filtered = prev.filter(r => r.scenario.id !== "custom");
      return [...filtered, customResult];
    });
  }, [params, baseResults, customScenario]);

  const handleReset = () => {
    setResults([]);
    setProgress(0);
    setScenarios(defaultScenarios);
  };

  const chartData = results.map(r => ({
    name: r.scenario.name.length > 15 ? r.scenario.name.substring(0, 15) + "..." : r.scenario.name,
    fullName: r.scenario.name,
    npv: r.results.npvTIPV,
    npvChange: r.impact.npvChangePercent,
    viable: r.impact.stillViable,
  }));

  const radarData = results.length > 0 ? [
    { metric: "NPV", base: 100, ...Object.fromEntries(results.map((r, i) => [`s${i}`, Math.max(0, (r.results.npvTIPV / baseResults.npvTIPV) * 100)])) },
    { metric: "IRR", base: 100, ...Object.fromEntries(results.map((r, i) => [`s${i}`, Math.max(0, (r.results.irrTIPV / baseResults.irrTIPV) * 100)])) },
    { metric: "DSCR", base: 100, ...Object.fromEntries(results.map((r, i) => [`s${i}`, Math.max(0, (r.results.dscrAverage / baseResults.dscrAverage) * 100)])) },
    { metric: "DPP", base: 100, ...Object.fromEntries(results.map((r, i) => [`s${i}`, Math.max(0, (baseResults.dppTIPV / r.results.dppTIPV) * 100)])) },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Scenario Selection */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-primary" />
            Kịch bản Stress Testing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Chọn các kịch bản khủng hoảng để kiểm tra độ bền vững của dự án
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scenarios.map(scenario => {
              const Icon = scenario.icon;
              return (
                <div
                  key={scenario.id}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    scenario.enabled 
                      ? "border-primary/50 bg-primary/5" 
                      : "border-border/50 bg-muted/20 opacity-60"
                  }`}
                  onClick={() => toggleScenario(scenario.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-5 h-5 ${scenario.color}`} />
                      <span className="font-medium text-sm">{scenario.name}</span>
                    </div>
                    <Switch checked={scenario.enabled} />
                  </div>
                  <p className="text-xs text-muted-foreground">{scenario.description}</p>
                </div>
              );
            })}
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              variant="glow" 
              className="flex-1" 
              onClick={runStressTests}
              disabled={isRunning || scenarios.filter(s => s.enabled).length === 0}
            >
              <Play className="w-4 h-4 mr-2" />
              {isRunning ? "Đang chạy..." : "Chạy Stress Test"}
            </Button>
            <Button variant="outline" onClick={handleReset} disabled={isRunning}>
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>

          {isRunning && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-muted-foreground text-center">
                Đang phân tích {scenarios.filter(s => s.enabled).length} kịch bản...
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Custom Scenario */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Kịch bản tùy chỉnh
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
            <div>
              <Label className="text-xs text-muted-foreground">Doanh thu (%)</Label>
              <Input
                type="number"
                value={customScenario.revenueChange}
                onChange={e => setCustomScenario(prev => ({ ...prev, revenueChange: parseFloat(e.target.value) || 0 }))}
                placeholder="-30"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Chi phí (%)</Label>
              <Input
                type="number"
                value={customScenario.costChange}
                onChange={e => setCustomScenario(prev => ({ ...prev, costChange: parseFloat(e.target.value) || 0 }))}
                placeholder="+50"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Lãi suất (+%)</Label>
              <Input
                type="number"
                value={customScenario.interestRateChange}
                onChange={e => setCustomScenario(prev => ({ ...prev, interestRateChange: parseFloat(e.target.value) || 0 }))}
                placeholder="+5"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Lạm phát (+%)</Label>
              <Input
                type="number"
                value={customScenario.inflationChange}
                onChange={e => setCustomScenario(prev => ({ ...prev, inflationChange: parseFloat(e.target.value) || 0 }))}
                placeholder="+3"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Sản lượng (%)</Label>
              <Input
                type="number"
                value={customScenario.productionChange}
                onChange={e => setCustomScenario(prev => ({ ...prev, productionChange: parseFloat(e.target.value) || 0 }))}
                placeholder="-20"
              />
            </div>
          </div>
          <Button onClick={runCustomScenario} variant="outline" className="w-full">
            <Zap className="w-4 h-4 mr-2" />
            Chạy kịch bản tùy chỉnh
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Summary Cards */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="glass">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Kịch bản khả thi</p>
                    <p className="text-3xl font-bold text-green-600">
                      {results.filter(r => r.impact.stillViable).length}/{results.length}
                    </p>
                  </div>
                  <CheckCircle className="w-10 h-10 text-green-500/50" />
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">NPV tệ nhất</p>
                    <p className="text-2xl font-bold text-red-600">
                      {formatNumber(Math.min(...results.map(r => r.results.npvTIPV)))}
                    </p>
                  </div>
                  <TrendingDown className="w-10 h-10 text-red-500/50" />
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Biến động NPV lớn nhất</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {Math.min(...results.map(r => r.impact.npvChangePercent)).toFixed(1)}%
                    </p>
                  </div>
                  <Activity className="w-10 h-10 text-orange-500/50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <Tabs defaultValue="bar">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-4">
              <TabsTrigger value="bar">Biểu đồ cột</TabsTrigger>
              <TabsTrigger value="radar">Radar</TabsTrigger>
              <TabsTrigger value="detail">Chi tiết</TabsTrigger>
            </TabsList>

            <TabsContent value="bar">
              <Card className="glass">
                <CardHeader>
                  <CardTitle>So sánh NPV các kịch bản</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={chartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                      <XAxis type="number" tickFormatter={v => formatNumber(v)} />
                      <YAxis type="category" dataKey="name" width={120} className="text-xs" />
                      <Tooltip
                        formatter={(value: number) => [formatNumber(value), "NPV"]}
                        labelFormatter={(_, payload) => payload[0]?.payload?.fullName || ""}
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="npv" radius={[0, 4, 4, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.viable ? "hsl(var(--chart-2))" : "hsl(var(--destructive))"} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="radar">
              <Card className="glass">
                <CardHeader>
                  <CardTitle>Phân tích đa chiều (% so với cơ sở)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="metric" />
                      <PolarRadiusAxis domain={[0, 120]} />
                      <Radar name="Cơ sở" dataKey="base" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.1} />
                      {results.map((r, i) => (
                        <Radar 
                          key={r.scenario.id}
                          name={r.scenario.name} 
                          dataKey={`s${i}`} 
                          stroke={r.impact.stillViable ? "hsl(var(--chart-2))" : "hsl(var(--destructive))"}
                          fill={r.impact.stillViable ? "hsl(var(--chart-2))" : "hsl(var(--destructive))"}
                          fillOpacity={0.2}
                        />
                      ))}
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="detail">
              <Card className="glass">
                <CardHeader>
                  <CardTitle>Chi tiết các kịch bản</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {results.map(r => {
                      const Icon = r.scenario.icon;
                      return (
                        <div
                          key={r.scenario.id}
                          className={`p-4 rounded-xl border ${
                            r.impact.stillViable 
                              ? "border-green-500/30 bg-green-500/5" 
                              : "border-red-500/30 bg-red-500/5"
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <Icon className={`w-6 h-6 ${r.scenario.color}`} />
                              <div>
                                <h4 className="font-medium">{r.scenario.name}</h4>
                                <p className="text-xs text-muted-foreground">{r.scenario.description}</p>
                              </div>
                            </div>
                            <Badge variant={r.impact.stillViable ? "default" : "destructive"}>
                              {r.impact.stillViable ? (
                                <><CheckCircle className="w-3 h-3 mr-1" /> Khả thi</>
                              ) : (
                                <><XCircle className="w-3 h-3 mr-1" /> Rủi ro cao</>
                              )}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">NPV</p>
                              <p className={`font-bold ${r.results.npvTIPV >= 0 ? "text-green-600" : "text-red-600"}`}>
                                {formatNumber(r.results.npvTIPV)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                ({r.impact.npvChangePercent >= 0 ? "+" : ""}{r.impact.npvChangePercent.toFixed(1)}%)
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">IRR</p>
                              <p className="font-bold">{(r.results.irrTIPV * 100).toFixed(2)}%</p>
                              <p className="text-xs text-muted-foreground">
                                ({r.impact.irrChange >= 0 ? "+" : ""}{(r.impact.irrChange * 100).toFixed(2)}%)
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">DSCR</p>
                              <p className={`font-bold ${r.results.dscrAverage >= 1.0 ? "text-green-600" : "text-red-600"}`}>
                                {r.results.dscrAverage.toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">DPP</p>
                              <p className="font-bold">{r.results.dppTIPV.toFixed(1)} năm</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Risk Summary */}
          <Card className="glass border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-primary" />
                Đánh giá tổng quan Stress Testing
              </h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                {results.filter(r => r.impact.stillViable).length === results.length ? (
                  <p className="text-green-600 font-medium">
                    ✅ Dự án vượt qua tất cả các kịch bản stress testing. Độ bền vững tài chính cao.
                  </p>
                ) : results.filter(r => r.impact.stillViable).length >= results.length / 2 ? (
                  <p className="text-yellow-600 font-medium">
                    ⚠️ Dự án vượt qua {results.filter(r => r.impact.stillViable).length}/{results.length} kịch bản. 
                    Cần xem xét các biện pháp phòng ngừa rủi ro.
                  </p>
                ) : (
                  <p className="text-red-600 font-medium">
                    ❌ Dự án chỉ vượt qua {results.filter(r => r.impact.stillViable).length}/{results.length} kịch bản. 
                    Rủi ro cao - cần cải thiện cấu trúc tài chính.
                  </p>
                )}
                
                <div className="mt-3 p-3 rounded-lg bg-background/50">
                  <p className="font-medium text-foreground mb-2">Khuyến nghị:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {results.some(r => r.scenario.id === "revenue_drop_30" && !r.impact.stillViable) && (
                      <li>Đa dạng hóa nguồn thu và thị trường để giảm phụ thuộc doanh thu</li>
                    )}
                    {results.some(r => r.scenario.id === "cost_increase_50" && !r.impact.stillViable) && (
                      <li>Ký hợp đồng dài hạn với nhà cung cấp, tối ưu hóa chi phí vận hành</li>
                    )}
                    {results.some(r => r.scenario.id === "interest_spike" && !r.impact.stillViable) && (
                      <li>Xem xét cố định lãi suất hoặc giảm tỷ lệ nợ vay</li>
                    )}
                    <li>Duy trì quỹ dự phòng tối thiểu 10-15% tổng đầu tư</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
