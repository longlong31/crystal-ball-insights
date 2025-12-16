import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { SimulationCard } from "./SimulationCard";
import { ProjectParams, ProjectResults, defaultProjectParams } from "@/lib/projectModel";
import { calculateProject } from "@/lib/projectCalculator";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  Plus,
  Trash2,
  Play,
  Copy,
  GitCompare,
  TrendingUp,
  Percent,
  Clock,
  Shield,
} from "lucide-react";
import { toast } from "sonner";

interface SavedProject {
  id: string;
  name: string;
  params: ProjectParams;
  results: ProjectResults | null;
}

interface ProjectComparisonProps {
  currentParams: ProjectParams;
}

export const ProjectComparison = ({ currentParams }: ProjectComparisonProps) => {
  const [projects, setProjects] = useState<SavedProject[]>([
    {
      id: "1",
      name: "Dự án A",
      params: { ...currentParams, projectName: "Dự án A" },
      results: null,
    },
  ]);
  const [isCalculating, setIsCalculating] = useState(false);

  const addProject = useCallback(() => {
    const newId = Date.now().toString();
    const projectCount = projects.length + 1;
    setProjects((prev) => [
      ...prev,
      {
        id: newId,
        name: `Dự án ${String.fromCharCode(64 + projectCount)}`,
        params: { ...defaultProjectParams, projectName: `Dự án ${String.fromCharCode(64 + projectCount)}` },
        results: null,
      },
    ]);
  }, [projects.length]);

  const duplicateProject = useCallback((project: SavedProject) => {
    const newId = Date.now().toString();
    setProjects((prev) => [
      ...prev,
      {
        id: newId,
        name: `${project.name} (Copy)`,
        params: { ...project.params, projectName: `${project.name} (Copy)` },
        results: null,
      },
    ]);
    toast.success("Đã sao chép dự án");
  }, []);

  const removeProject = useCallback((id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const updateProjectName = useCallback((id: string, name: string) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name, params: { ...p.params, projectName: name } } : p))
    );
  }, []);

  const updateProjectParam = useCallback(
    (id: string, key: keyof ProjectParams, value: number) => {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, params: { ...p.params, [key]: value }, results: null } : p
        )
      );
    },
    []
  );

  const calculateAllProjects = useCallback(() => {
    setIsCalculating(true);
    setTimeout(() => {
      setProjects((prev) =>
        prev.map((p) => ({
          ...p,
          results: calculateProject(p.params),
        }))
      );
      setIsCalculating(false);
      toast.success("Đã tính toán tất cả dự án");
    }, 100);
  }, []);

  const formatNumber = (num: number) =>
    new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(num);

  const formatPercent = (num: number) => `${(num * 100).toFixed(2)}%`;

  const projectsWithResults = projects.filter((p) => p.results !== null);

  const comparisonChartData = projectsWithResults.map((p) => ({
    name: p.name,
    "NPV TIPV": p.results!.npvTIPV,
    "NPV EPV": p.results!.npvEPV,
  }));

  const irrChartData = projectsWithResults.map((p) => ({
    name: p.name,
    "IRR TIPV": p.results!.irrTIPV * 100,
    "IRR EPV": p.results!.irrEPV * 100,
    WACC: p.results!.waccAverage * 100,
  }));

  const radarData = projectsWithResults.length > 0
    ? [
        { metric: "NPV", fullMark: 100, ...Object.fromEntries(
          projectsWithResults.map((p) => [
            p.name,
            Math.min(100, Math.max(0, ((p.results!.npvTIPV + 500000) / 1000000) * 100)),
          ])
        )},
        { metric: "IRR", fullMark: 100, ...Object.fromEntries(
          projectsWithResults.map((p) => [p.name, Math.min(100, p.results!.irrTIPV * 100 * 3)])
        )},
        { metric: "DPP", fullMark: 100, ...Object.fromEntries(
          projectsWithResults.map((p) => [p.name, Math.max(0, 100 - p.results!.dppTIPV * 10)])
        )},
        { metric: "DSCR", fullMark: 100, ...Object.fromEntries(
          projectsWithResults.map((p) => [p.name, Math.min(100, p.results!.dscrAverage * 40)])
        )},
      ]
    : [];

  const radarColors = ["hsl(var(--primary))", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (
    <div className="space-y-6">
      {/* Project Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <SimulationCard key={project.id}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Input
                  value={project.name}
                  onChange={(e) => updateProjectName(project.id, e.target.value)}
                  className="text-lg font-semibold h-auto py-1 px-2 border-transparent hover:border-border focus:border-primary"
                />
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => duplicateProject(project)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  {projects.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => removeProject(project.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Key Parameters */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <label className="text-xs text-muted-foreground">Giá bán (tr)</label>
                  <Input
                    type="number"
                    value={project.params.basePrice}
                    onChange={(e) =>
                      updateProjectParam(project.id, "basePrice", parseFloat(e.target.value) || 0)
                    }
                    className="h-8 mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Chi phí LK (tr)</label>
                  <Input
                    type="number"
                    value={project.params.componentCost}
                    onChange={(e) =>
                      updateProjectParam(project.id, "componentCost", parseFloat(e.target.value) || 0)
                    }
                    className="h-8 mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Sản lượng</label>
                  <Input
                    type="number"
                    value={project.params.designCapacity}
                    onChange={(e) =>
                      updateProjectParam(project.id, "designCapacity", parseInt(e.target.value) || 0)
                    }
                    className="h-8 mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Tỷ lệ vay (%)</label>
                  <Input
                    type="number"
                    value={project.params.debtRatio}
                    onChange={(e) =>
                      updateProjectParam(project.id, "debtRatio", parseFloat(e.target.value) || 0)
                    }
                    className="h-8 mt-1"
                  />
                </div>
              </div>

              {/* Results Preview */}
              {project.results && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="pt-3 border-t border-border space-y-2"
                >
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-3 h-3 text-primary" />
                      <span className="text-muted-foreground">NPV:</span>
                      <span
                        className={`font-medium ${
                          project.results.npvTIPV > 0 ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {formatNumber(project.results.npvTIPV)} tr
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Percent className="w-3 h-3 text-primary" />
                      <span className="text-muted-foreground">IRR:</span>
                      <span className="font-medium">{formatPercent(project.results.irrTIPV)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3 text-primary" />
                      <span className="text-muted-foreground">DPP:</span>
                      <span className="font-medium">{project.results.dppTIPV.toFixed(2)} năm</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="w-3 h-3 text-primary" />
                      <span className="text-muted-foreground">DSCR:</span>
                      <span className="font-medium">{project.results.dscrAverage.toFixed(2)}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </SimulationCard>
        ))}

        {/* Add Project Button */}
        <button
          onClick={addProject}
          className="min-h-[200px] border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
        >
          <Plus className="w-8 h-8" />
          <span className="font-medium">Thêm dự án</span>
        </button>
      </div>

      {/* Calculate Button */}
      <div className="flex justify-center">
        <Button variant="glow" size="lg" onClick={calculateAllProjects} disabled={isCalculating}>
          <Play className="w-4 h-4 mr-2" />
          {isCalculating ? "Đang tính toán..." : "Tính toán tất cả"}
        </Button>
      </div>

      {/* Comparison Charts */}
      {projectsWithResults.length > 1 && (
        <>
          {/* NPV Comparison */}
          <SimulationCard>
            <div className="flex items-center gap-2 mb-4">
              <GitCompare className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">So sánh NPV các dự án</h3>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={formatNumber} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => `${formatNumber(value)} triệu`}
                  />
                  <Legend />
                  <Bar dataKey="NPV TIPV" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="NPV EPV" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SimulationCard>

          {/* IRR Comparison */}
          <SimulationCard>
            <div className="flex items-center gap-2 mb-4">
              <Percent className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">So sánh IRR và WACC</h3>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={irrChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => `${value.toFixed(2)}%`}
                  />
                  <Legend />
                  <Bar dataKey="IRR TIPV" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="IRR EPV" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="WACC" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SimulationCard>

          {/* Radar Chart */}
          <SimulationCard>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Đánh giá tổng hợp</h3>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="metric" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  {projectsWithResults.map((project, index) => (
                    <Radar
                      key={project.id}
                      name={project.name}
                      dataKey={project.name}
                      stroke={radarColors[index % radarColors.length]}
                      fill={radarColors[index % radarColors.length]}
                      fillOpacity={0.2}
                    />
                  ))}
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </SimulationCard>

          {/* Comparison Table */}
          <SimulationCard>
            <div className="flex items-center gap-2 mb-4">
              <GitCompare className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Bảng so sánh chi tiết</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="p-3 text-left bg-muted/50 border border-border">Chỉ tiêu</th>
                    {projectsWithResults.map((p) => (
                      <th key={p.id} className="p-3 text-center bg-muted/50 border border-border">
                        {p.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-3 border border-border font-medium">NPV (TIPV)</td>
                    {projectsWithResults.map((p) => (
                      <td
                        key={p.id}
                        className={`p-3 text-center border border-border font-mono ${
                          p.results!.npvTIPV > 0 ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {formatNumber(p.results!.npvTIPV)} tr
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 border border-border font-medium">IRR (TIPV)</td>
                    {projectsWithResults.map((p) => (
                      <td key={p.id} className="p-3 text-center border border-border font-mono">
                        {formatPercent(p.results!.irrTIPV)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 border border-border font-medium">DPP (TIPV)</td>
                    {projectsWithResults.map((p) => (
                      <td key={p.id} className="p-3 text-center border border-border font-mono">
                        {p.results!.dppTIPV.toFixed(2)} năm
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 border border-border font-medium">DSCR</td>
                    {projectsWithResults.map((p) => (
                      <td
                        key={p.id}
                        className={`p-3 text-center border border-border font-mono ${
                          p.results!.dscrAverage > 1.2 ? "text-green-500" : "text-yellow-500"
                        }`}
                      >
                        {p.results!.dscrAverage.toFixed(2)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 border border-border font-medium">NPV (EPV)</td>
                    {projectsWithResults.map((p) => (
                      <td
                        key={p.id}
                        className={`p-3 text-center border border-border font-mono ${
                          p.results!.npvEPV > 0 ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {formatNumber(p.results!.npvEPV)} tr
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 border border-border font-medium">IRR (EPV)</td>
                    {projectsWithResults.map((p) => (
                      <td key={p.id} className="p-3 text-center border border-border font-mono">
                        {formatPercent(p.results!.irrEPV)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 border border-border font-medium">WACC</td>
                    {projectsWithResults.map((p) => (
                      <td key={p.id} className="p-3 text-center border border-border font-mono">
                        {formatPercent(p.results!.waccAverage)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 border border-border font-medium">Kết luận</td>
                    {projectsWithResults.map((p) => (
                      <td
                        key={p.id}
                        className={`p-3 text-center border border-border font-medium ${
                          p.results!.npvTIPV > 0 ? "text-green-500 bg-green-500/10" : "text-red-500 bg-red-500/10"
                        }`}
                      >
                        {p.results!.npvTIPV > 0 ? "Khả thi" : "Không khả thi"}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Recommendation */}
            {projectsWithResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 p-4 rounded-lg bg-primary/10 border border-primary/20"
              >
                <h4 className="font-medium text-primary mb-2">Khuyến nghị</h4>
                <p className="text-sm text-muted-foreground">
                  {(() => {
                    const bestProject = projectsWithResults.reduce((best, current) =>
                      current.results!.npvTIPV > best.results!.npvTIPV ? current : best
                    );
                    return `Dự án "${bestProject.name}" có NPV cao nhất (${formatNumber(
                      bestProject.results!.npvTIPV
                    )} triệu) và IRR ${formatPercent(
                      bestProject.results!.irrTIPV
                    )}, là lựa chọn tốt nhất về mặt tài chính.`;
                  })()}
                </p>
              </motion.div>
            )}
          </SimulationCard>
        </>
      )}
    </div>
  );
};
