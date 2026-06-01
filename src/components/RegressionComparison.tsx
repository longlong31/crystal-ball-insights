import { useState, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SimulationCard } from "@/components/SimulationCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Play, RotateCcw, BarChart3, Trophy, AlertTriangle, CheckCircle2,
  TrendingUp, Brain, Layers, Download
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
  ScatterChart, Scatter, LineChart, Line
} from "recharts";

// ─── Shared dataset generator using seeded RNG ───────────────────
function seededRandom(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

function seededBoxMuller(rng: () => number): number {
  let u = 0, v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

interface DataPoint { x: number; y: number; }
interface ModelResult {
  id: string;
  name: string;
  nameVi: string;
  color: string;
  r2: number;
  rmse: number;
  mae: number;
  adjustedR2: number;
  predictions: number[];
  slope: number;
  intercept: number;
  penalty: string;
  extraInfo?: string;
}

const MODELS = [
  { id: "ols", name: "Linear (OLS)", nameVi: "Tuyến tính (OLS)", color: "hsl(var(--primary))" },
  { id: "ridge", name: "Ridge (L2)", nameVi: "Ridge (L2)", color: "#f59e0b" },
  { id: "lasso", name: "Lasso (L1)", nameVi: "Lasso (L1)", color: "#ef4444" },
  { id: "elastic", name: "Elastic Net", nameVi: "Elastic Net", color: "#8b5cf6" },
  { id: "polynomial", name: "Polynomial", nameVi: "Đa thức", color: "#06b6d4" },
  { id: "decision_tree", name: "Decision Tree", nameVi: "Cây quyết định", color: "#10b981" },
  { id: "random_forest", name: "Random Forest", nameVi: "Random Forest", color: "#ec4899" },
  { id: "svr", name: "SVR", nameVi: "SVR", color: "#f97316" },
];

const CHART_COLORS = ["hsl(var(--primary))", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#10b981", "#ec4899", "#f97316"];

function generateDataset(n: number, noise: number, trueSlope: number, trueIntercept: number, seed: number): DataPoint[] {
  const rng = seededRandom(seed);
  const data: DataPoint[] = [];
  for (let i = 0; i < n; i++) {
    const x = (i / n) * 10;
    const y = trueSlope * x + trueIntercept + Math.sin(x) * 1.5 + seededBoxMuller(rng) * noise;
    data.push({ x, y });
  }
  return data;
}

// ─── Model runners (all use same dataset) ────────────────────────
function runOLS(data: DataPoint[]): Omit<ModelResult, 'id' | 'name' | 'nameVi' | 'color'> {
  const n = data.length;
  const meanX = data.reduce((s, d) => s + d.x, 0) / n;
  const meanY = data.reduce((s, d) => s + d.y, 0) / n;
  let num = 0, den = 0;
  for (const d of data) { num += (d.x - meanX) * (d.y - meanY); den += (d.x - meanX) ** 2; }
  const w = den ? num / den : 0;
  const b = meanY - w * meanX;
  const preds = data.map(d => w * d.x + b);
  return { ...computeMetrics(data, preds, 1), predictions: preds, slope: w, intercept: b, penalty: "None" };
}

function runRidge(data: DataPoint[], lambda: number): Omit<ModelResult, 'id' | 'name' | 'nameVi' | 'color'> {
  const n = data.length;
  const meanX = data.reduce((s, d) => s + d.x, 0) / n;
  const meanY = data.reduce((s, d) => s + d.y, 0) / n;
  let num = 0, den = 0;
  for (const d of data) { num += (d.x - meanX) * (d.y - meanY); den += (d.x - meanX) ** 2; }
  const w = num / (den + lambda * n);
  const b = meanY - w * meanX;
  const preds = data.map(d => w * d.x + b);
  return { ...computeMetrics(data, preds, 1), predictions: preds, slope: w, intercept: b, penalty: `L2 (λ=${lambda})`, extraInfo: `Shrinkage: ${((1 - Math.abs(w) / Math.abs(num / den)) * 100).toFixed(1)}%` };
}

function runLasso(data: DataPoint[], lambda: number): Omit<ModelResult, 'id' | 'name' | 'nameVi' | 'color'> {
  const n = data.length;
  const meanX = data.reduce((s, d) => s + d.x, 0) / n;
  const meanY = data.reduce((s, d) => s + d.y, 0) / n;
  let w = 0, b = meanY;
  for (let iter = 0; iter < 500; iter++) {
    let rho = 0;
    for (const d of data) rho += d.x * (d.y - b);
    rho /= n;
    const xSq = data.reduce((s, d) => s + d.x * d.x, 0) / n;
    if (rho > lambda / 2) w = (rho - lambda / 2) / xSq;
    else if (rho < -lambda / 2) w = (rho + lambda / 2) / xSq;
    else w = 0;
    b = meanY - w * meanX;
  }
  const preds = data.map(d => w * d.x + b);
  return { ...computeMetrics(data, preds, 1), predictions: preds, slope: w, intercept: b, penalty: `L1 (λ=${lambda})`, extraInfo: w === 0 ? "Feature zeroed!" : "" };
}

function runElasticNet(data: DataPoint[], alpha: number, l1Ratio: number): Omit<ModelResult, 'id' | 'name' | 'nameVi' | 'color'> {
  const n = data.length;
  const meanX = data.reduce((s, d) => s + d.x, 0) / n;
  const meanY = data.reduce((s, d) => s + d.y, 0) / n;
  let w = 0, b = meanY;
  for (let iter = 0; iter < 500; iter++) {
    let rho = 0;
    for (const d of data) rho += d.x * (d.y - b);
    rho /= n;
    const l1 = alpha * l1Ratio;
    const l2 = alpha * (1 - l1Ratio);
    const xSq = data.reduce((s, d) => s + d.x * d.x, 0) / n;
    if (rho > l1 / 2) w = (rho - l1 / 2) / (xSq + l2);
    else if (rho < -l1 / 2) w = (rho + l1 / 2) / (xSq + l2);
    else w = 0;
    b = meanY - w * meanX;
  }
  const preds = data.map(d => w * d.x + b);
  return { ...computeMetrics(data, preds, 1), predictions: preds, slope: w, intercept: b, penalty: `L1+L2 (α=${alpha}, ratio=${l1Ratio})` };
}

function runPolynomial(data: DataPoint[], degree: number): Omit<ModelResult, 'id' | 'name' | 'nameVi' | 'color'> {
  const n = data.length;
  const deg = Math.min(Math.max(degree, 2), 5);
  // Simple polynomial via gradient descent
  const coeffs = new Array(deg + 1).fill(0);
  const lr = 0.00001;
  for (let epoch = 0; epoch < 2000; epoch++) {
    const grads = new Array(deg + 1).fill(0);
    for (const d of data) {
      let pred = 0;
      for (let j = 0; j <= deg; j++) pred += coeffs[j] * Math.pow(d.x, j);
      const err = pred - d.y;
      for (let j = 0; j <= deg; j++) grads[j] += (2 / n) * err * Math.pow(d.x, j);
    }
    for (let j = 0; j <= deg; j++) coeffs[j] -= lr * grads[j];
  }
  const preds = data.map(d => {
    let v = 0;
    for (let j = 0; j <= deg; j++) v += coeffs[j] * Math.pow(d.x, j);
    return v;
  });
  return { ...computeMetrics(data, preds, deg), predictions: preds, slope: coeffs[1] || 0, intercept: coeffs[0] || 0, penalty: `Degree ${deg}` };
}

function runDecisionTree(data: DataPoint[], maxDepth: number): Omit<ModelResult, 'id' | 'name' | 'nameVi' | 'color'> {
  const n = data.length;
  type Node = { value: number; left?: Node; right?: Node; splitX?: number };
  const build = (indices: number[], depth: number): Node => {
    const mean = indices.reduce((s, i) => s + data[i].y, 0) / indices.length;
    if (depth >= maxDepth || indices.length <= 4) return { value: mean };
    let bestSSE = Infinity, bestSplit = 0, bestL: number[] = [], bestR: number[] = [];
    const sorted = [...indices].sort((a, b) => data[a].x - data[b].x);
    for (let s = 2; s < sorted.length - 2; s++) {
      const left = sorted.slice(0, s), right = sorted.slice(s);
      const lM = left.reduce((a, i) => a + data[i].y, 0) / left.length;
      const rM = right.reduce((a, i) => a + data[i].y, 0) / right.length;
      const sse = left.reduce((a, i) => a + (data[i].y - lM) ** 2, 0) + right.reduce((a, i) => a + (data[i].y - rM) ** 2, 0);
      if (sse < bestSSE) { bestSSE = sse; bestSplit = data[sorted[s]].x; bestL = left; bestR = right; }
    }
    if (!bestL.length) return { value: mean };
    return { value: mean, splitX: bestSplit, left: build(bestL, depth + 1), right: build(bestR, depth + 1) };
  };
  const tree = build(Array.from({ length: n }, (_, i) => i), 0);
  const predict = (x: number, node: Node): number => {
    if (!node.left || node.splitX === undefined) return node.value;
    return x < node.splitX ? predict(x, node.left) : predict(x, node.right!);
  };
  const preds = data.map(d => predict(d.x, tree));
  return { ...computeMetrics(data, preds, maxDepth), predictions: preds, slope: 0, intercept: 0, penalty: `Depth ${maxDepth}` };
}

function runRandomForest(data: DataPoint[], nTrees: number, maxDepth: number): Omit<ModelResult, 'id' | 'name' | 'nameVi' | 'color'> {
  const n = data.length;
  const nT = Math.min(Math.max(nTrees, 3), 30);
  const allPreds: number[][] = [];
  for (let t = 0; t < nT; t++) {
    const sampleIdx = Array.from({ length: Math.round(n * 0.7) }, () => Math.floor(Math.random() * n));
    const nBins = Math.min(2 ** maxDepth, 16);
    const binSize = 10 / nBins;
    const binMeans: number[] = [];
    for (let b = 0; b < nBins; b++) {
      const pts = sampleIdx.filter(i => data[i].x >= b * binSize && data[i].x < (b + 1) * binSize);
      binMeans.push(pts.length ? pts.reduce((s, i) => s + data[i].y, 0) / pts.length : 0);
    }
    allPreds.push(data.map(d => { const b = Math.min(Math.floor(d.x / binSize), nBins - 1); return binMeans[b]; }));
  }
  const preds = data.map((_, i) => allPreds.reduce((s, tp) => s + tp[i], 0) / nT);
  return { ...computeMetrics(data, preds, nT), predictions: preds, slope: 0, intercept: 0, penalty: `${nT} trees, depth ${maxDepth}` };
}

function runSVR(data: DataPoint[], epsilon: number, C: number): Omit<ModelResult, 'id' | 'name' | 'nameVi' | 'color'> {
  const n = data.length;
  let w = 0, b = 0;
  const lr = 0.001;
  for (let epoch = 0; epoch < 2000; epoch++) {
    let dw = 0, db = 0;
    for (const d of data) {
      const diff = d.y - (w * d.x + b);
      if (Math.abs(diff) > epsilon) {
        const sign = diff > 0 ? 1 : -1;
        dw += -C * sign * d.x; db += -C * sign;
      }
    }
    dw = dw / n + w; db /= n;
    w -= lr * dw; b -= lr * db;
  }
  const preds = data.map(d => w * d.x + b);
  return { ...computeMetrics(data, preds, 1), predictions: preds, slope: w, intercept: b, penalty: `ε=${epsilon}, C=${C}` };
}

function computeMetrics(data: DataPoint[], preds: number[], k: number) {
  const n = data.length;
  const meanY = data.reduce((s, d) => s + d.y, 0) / n;
  const ssRes = data.reduce((s, d, i) => s + (d.y - preds[i]) ** 2, 0);
  const ssTot = data.reduce((s, d) => s + (d.y - meanY) ** 2, 0);
  const r2 = ssTot ? 1 - ssRes / ssTot : 0;
  const adjustedR2 = n > k + 1 ? 1 - (1 - r2) * (n - 1) / (n - k - 1) : r2;
  const rmse = Math.sqrt(ssRes / n);
  const mae = data.reduce((s, d, i) => s + Math.abs(d.y - preds[i]), 0) / n;
  return { r2, adjustedR2, rmse, mae };
}

// ─── Component ───────────────────────────────────────────────────
export function RegressionComparison() {
  const { language } = useLanguage();
  const [selectedModels, setSelectedModels] = useState<string[]>(["ols", "ridge", "lasso", "elastic"]);
  const [params, setParams] = useState({ n: 100, noise: 3, slope: 2.5, intercept: 5, seed: 42, lambda: 1, alpha: 0.5, l1Ratio: 0.5, degree: 3, maxDepth: 4, nTrees: 10, epsilon: 0.5, C: 1 });
  const [results, setResults] = useState<ModelResult[] | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [dataset, setDataset] = useState<DataPoint[] | null>(null);

  const toggleModel = useCallback((id: string) => {
    setSelectedModels(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  }, []);

  const runComparison = useCallback(() => {
    setIsRunning(true);
    setTimeout(() => {
      const data = generateDataset(params.n, params.noise, params.slope, params.intercept, params.seed);
      setDataset(data);
      const modelResults: ModelResult[] = [];
      for (const modelId of selectedModels) {
        const meta = MODELS.find(m => m.id === modelId)!;
        let res: Omit<ModelResult, 'id' | 'name' | 'nameVi' | 'color'>;
        switch (modelId) {
          case "ols": res = runOLS(data); break;
          case "ridge": res = runRidge(data, params.lambda); break;
          case "lasso": res = runLasso(data, params.lambda); break;
          case "elastic": res = runElasticNet(data, params.alpha, params.l1Ratio); break;
          case "polynomial": res = runPolynomial(data, params.degree); break;
          case "decision_tree": res = runDecisionTree(data, params.maxDepth); break;
          case "random_forest": res = runRandomForest(data, params.nTrees, params.maxDepth); break;
          case "svr": res = runSVR(data, params.epsilon, params.C); break;
          default: continue;
        }
        modelResults.push({ ...meta, ...res });
      }
      modelResults.sort((a, b) => b.r2 - a.r2);
      setResults(modelResults);
      setIsRunning(false);
    }, 200);
  }, [selectedModels, params]);

  const bestModel = results?.[0];
  const worstModel = results?.[results.length - 1];

  const radarData = useMemo(() => {
    if (!results) return [];
    const maxRMSE = Math.max(...results.map(r => r.rmse));
    const maxMAE = Math.max(...results.map(r => r.mae));
    const metrics = [
      { metric: "R²", ...Object.fromEntries(results.map(r => [r.id, Math.max(0, r.r2) * 100])) },
      { metric: "Adj R²", ...Object.fromEntries(results.map(r => [r.id, Math.max(0, r.adjustedR2) * 100])) },
      { metric: language === "vi" ? "Độ chính xác" : "Accuracy", ...Object.fromEntries(results.map(r => [r.id, maxRMSE ? (1 - r.rmse / maxRMSE) * 100 : 50])) },
      { metric: "MAE Score", ...Object.fromEntries(results.map(r => [r.id, maxMAE ? (1 - r.mae / maxMAE) * 100 : 50])) },
    ];
    return metrics;
  }, [results, language]);

  const barData = useMemo(() => {
    if (!results) return [];
    return results.map(r => ({
      name: r.name,
      R2: +(r.r2 * 100).toFixed(2),
      RMSE: +r.rmse.toFixed(4),
      MAE: +r.mae.toFixed(4),
    }));
  }, [results]);

  return (
    <div className="space-y-6">
      {/* Config panel */}
      <div className="grid lg:grid-cols-[320px_1fr] gap-6">
        <div className="space-y-4">
          {/* Model selection */}
          <SimulationCard>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              {language === "vi" ? "Chọn mô hình" : "Select Models"}
            </h3>
            <div className="space-y-2">
              {MODELS.map(model => (
                <label key={model.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                  <Checkbox
                    checked={selectedModels.includes(model.id)}
                    onCheckedChange={() => toggleModel(model.id)}
                  />
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: model.color }} />
                  <span className="text-sm font-medium">{language === "vi" ? model.nameVi : model.name}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {language === "vi" ? `Đã chọn ${selectedModels.length} mô hình` : `${selectedModels.length} models selected`}
            </p>
          </SimulationCard>

          {/* Dataset params */}
          <SimulationCard>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              {language === "vi" ? "Bộ dữ liệu chung" : "Shared Dataset"}
            </h3>
            <div className="space-y-3">
              {[
                { key: "n", label: language === "vi" ? "Số mẫu (n)" : "Samples (n)", min: 20, max: 500, step: 10 },
                { key: "noise", label: language === "vi" ? "Nhiễu (σ)" : "Noise (σ)", min: 0, max: 20, step: 0.5 },
                { key: "slope", label: language === "vi" ? "Slope thực" : "True Slope", min: -10, max: 10, step: 0.1 },
                { key: "intercept", label: "Intercept", min: -20, max: 20, step: 0.5 },
                { key: "seed", label: "Seed", min: 1, max: 9999, step: 1 },
              ].map(p => (
                <div key={p.key}>
                  <Label className="text-xs">{p.label}</Label>
                  <Input
                    type="number"
                    value={(params as any)[p.key]}
                    onChange={e => setParams(prev => ({ ...prev, [p.key]: parseFloat(e.target.value) || 0 }))}
                    min={p.min} max={p.max} step={p.step}
                    className="mt-1 font-mono text-sm"
                  />
                </div>
              ))}
            </div>

            {/* Model-specific params */}
            {selectedModels.some(m => ["ridge", "lasso"].includes(m)) && (
              <div className="mt-3 pt-3 border-t border-border/50">
                <Label className="text-xs">Lambda (λ) - Ridge/Lasso</Label>
                <Input type="number" value={params.lambda} onChange={e => setParams(p => ({ ...p, lambda: parseFloat(e.target.value) || 0 }))} min={0} max={100} step={0.1} className="mt-1 font-mono text-sm" />
              </div>
            )}
            {selectedModels.includes("elastic") && (
              <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                <div>
                  <Label className="text-xs">Alpha (α)</Label>
                  <Input type="number" value={params.alpha} onChange={e => setParams(p => ({ ...p, alpha: parseFloat(e.target.value) || 0 }))} min={0} max={10} step={0.1} className="mt-1 font-mono text-sm" />
                </div>
                <div>
                  <Label className="text-xs">L1 Ratio</Label>
                  <Input type="number" value={params.l1Ratio} onChange={e => setParams(p => ({ ...p, l1Ratio: parseFloat(e.target.value) || 0 }))} min={0} max={1} step={0.05} className="mt-1 font-mono text-sm" />
                </div>
              </div>
            )}
            {selectedModels.includes("polynomial") && (
              <div className="mt-3 pt-3 border-t border-border/50">
                <Label className="text-xs">{language === "vi" ? "Bậc đa thức" : "Degree"}</Label>
                <Input type="number" value={params.degree} onChange={e => setParams(p => ({ ...p, degree: parseInt(e.target.value) || 2 }))} min={2} max={5} step={1} className="mt-1 font-mono text-sm" />
              </div>
            )}
            {selectedModels.some(m => ["decision_tree", "random_forest"].includes(m)) && (
              <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                <div>
                  <Label className="text-xs">Max Depth</Label>
                  <Input type="number" value={params.maxDepth} onChange={e => setParams(p => ({ ...p, maxDepth: parseInt(e.target.value) || 3 }))} min={1} max={10} step={1} className="mt-1 font-mono text-sm" />
                </div>
                {selectedModels.includes("random_forest") && (
                  <div>
                    <Label className="text-xs">{language === "vi" ? "Số cây" : "Trees"}</Label>
                    <Input type="number" value={params.nTrees} onChange={e => setParams(p => ({ ...p, nTrees: parseInt(e.target.value) || 5 }))} min={3} max={30} step={1} className="mt-1 font-mono text-sm" />
                  </div>
                )}
              </div>
            )}
            {selectedModels.includes("svr") && (
              <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                <div>
                  <Label className="text-xs">Epsilon (ε)</Label>
                  <Input type="number" value={params.epsilon} onChange={e => setParams(p => ({ ...p, epsilon: parseFloat(e.target.value) || 0.1 }))} min={0.01} max={5} step={0.1} className="mt-1 font-mono text-sm" />
                </div>
                <div>
                  <Label className="text-xs">C (Regularization)</Label>
                  <Input type="number" value={params.C} onChange={e => setParams(p => ({ ...p, C: parseFloat(e.target.value) || 1 }))} min={0.01} max={100} step={0.1} className="mt-1 font-mono text-sm" />
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <Button variant="glow" className="flex-1" onClick={runComparison} disabled={isRunning || selectedModels.length < 2}>
                <Play className="w-4 h-4 mr-1" />
                {isRunning ? (language === "vi" ? "Đang chạy..." : "Running...") : (language === "vi" ? "So sánh" : "Compare")}
              </Button>
              <Button variant="outline" size="icon" onClick={() => { setResults(null); setDataset(null); }}>
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </SimulationCard>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {results && results.length > 0 ? (
              <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                {/* Winner banner */}
                <SimulationCard>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-6 h-6 text-yellow-500" />
                      <div>
                        <div className="text-xs text-muted-foreground">{language === "vi" ? "Mô hình tốt nhất" : "Best Model"}</div>
                        <div className="font-bold text-lg" style={{ color: bestModel?.color }}>{language === "vi" ? bestModel?.nameVi : bestModel?.name}</div>
                      </div>
                    </div>
                    <div className="flex gap-3 flex-wrap">
                      <Badge variant="outline" className="gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> R² = {bestModel?.r2.toFixed(4)}</Badge>
                      <Badge variant="outline" className="gap-1">RMSE = {bestModel?.rmse.toFixed(4)}</Badge>
                      <Badge variant="outline" className="gap-1">MAE = {bestModel?.mae.toFixed(4)}</Badge>
                    </div>
                    {worstModel && worstModel.id !== bestModel?.id && (
                      <div className="flex items-center gap-2 ml-auto">
                        <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{language === "vi" ? "Yếu nhất" : "Weakest"}: {language === "vi" ? worstModel.nameVi : worstModel.name} (R²={worstModel.r2.toFixed(4)})</span>
                      </div>
                    )}
                  </div>
                </SimulationCard>

                {/* Metrics table */}
                <SimulationCard>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    {language === "vi" ? "Bảng so sánh chi tiết" : "Detailed Comparison Table"}
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/50">
                          <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">#</th>
                          <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">{language === "vi" ? "Mô hình" : "Model"}</th>
                          <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">R²</th>
                          <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">Adj R²</th>
                          <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">RMSE</th>
                          <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">MAE</th>
                          <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">{language === "vi" ? "Regularization" : "Penalty"}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((r, i) => (
                          <tr key={r.id} className={`border-b border-border/30 ${i === 0 ? "bg-primary/5" : ""}`}>
                            <td className="py-2 px-3 font-mono text-xs">
                              {i === 0 ? <Trophy className="w-4 h-4 text-yellow-500" /> : i + 1}
                            </td>
                            <td className="py-2 px-3">
                              <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                                <span className="font-medium">{language === "vi" ? r.nameVi : r.name}</span>
                              </div>
                            </td>
                            <td className="py-2 px-3 text-right font-mono">{r.r2.toFixed(4)}</td>
                            <td className="py-2 px-3 text-right font-mono">{r.adjustedR2.toFixed(4)}</td>
                            <td className="py-2 px-3 text-right font-mono">{r.rmse.toFixed(4)}</td>
                            <td className="py-2 px-3 text-right font-mono">{r.mae.toFixed(4)}</td>
                            <td className="py-2 px-3 text-xs text-muted-foreground">{r.penalty}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </SimulationCard>

                {/* Charts row */}
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Bar chart - R² comparison */}
                  <SimulationCard>
                    <h3 className="text-sm font-semibold mb-3">{language === "vi" ? "So sánh R²" : "R² Comparison"}</h3>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" angle={-20} textAnchor="end" height={50} />
                          <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" domain={[0, 100]} />
                          <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                          <Bar dataKey="R2" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="R² (%)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </SimulationCard>

                  {/* Radar chart */}
                  <SimulationCard>
                    <h3 className="text-sm font-semibold mb-3">{language === "vi" ? "Radar đa chiều" : "Multi-Metric Radar"}</h3>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData}>
                          <PolarGrid stroke="hsl(var(--border))" />
                          <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                          <PolarRadiusAxis tick={{ fontSize: 9 }} domain={[0, 100]} />
                          {results.map(r => (
                            <Radar key={r.id} name={r.name} dataKey={r.id} stroke={r.color} fill={r.color} fillOpacity={0.1} strokeWidth={2} />
                          ))}
                          <Legend wrapperStyle={{ fontSize: 10 }} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </SimulationCard>
                </div>

                {/* Prediction overlay scatter */}
                {dataset && (
                  <SimulationCard>
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      {language === "vi" ? "Dự đoán vs Dữ liệu thực" : "Predictions vs Actual Data"}
                    </h3>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis
                            dataKey="x"
                            type="number"
                            domain={["dataMin", "dataMax"]}
                            tick={{ fontSize: 10 }}
                            stroke="hsl(var(--muted-foreground))"
                          />
                          <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                          <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
                          <Legend wrapperStyle={{ fontSize: 10 }} />
                          {/* Actual data as dots */}
                          <Line
                            data={dataset.filter((_, i) => i % Math.max(1, Math.floor(dataset.length / 60)) === 0).map(d => ({ x: d.x, y: d.y }))}
                            dataKey="y"
                            name={language === "vi" ? "Dữ liệu thực" : "Actual"}
                            stroke="hsl(var(--muted-foreground))"
                            strokeWidth={0}
                            dot={{ r: 2, fill: "hsl(var(--muted-foreground))" }}
                            isAnimationActive={false}
                          />
                          {/* Model predictions as lines */}
                          {results.map(r => {
                            const step = Math.max(1, Math.floor(dataset.length / 60));
                            const lineData = dataset.filter((_, i) => i % step === 0).map((d, i) => ({ x: d.x, y: r.predictions[i * step] }));
                            return (
                              <Line
                                key={r.id}
                                data={lineData}
                                dataKey="y"
                                name={r.name}
                                stroke={r.color}
                                strokeWidth={2}
                                dot={false}
                                isAnimationActive={false}
                              />
                            );
                          })}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </SimulationCard>
                )}

                {/* Interpretation */}
                <SimulationCard>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-primary" />
                    {language === "vi" ? "Phân tích & Khuyến nghị" : "Analysis & Recommendations"}
                  </h3>
                  <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                    {results.map((r, i) => (
                      <div key={r.id} className="flex gap-3 items-start">
                        <div className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: r.color }} />
                        <div>
                          <span className="font-medium text-foreground">{r.name}</span>
                          {": "}
                          {r.r2 > 0.95
                            ? (language === "vi" ? "⚠️ R² rất cao – có thể overfitting" : "⚠️ Very high R² – possible overfitting")
                            : r.r2 > 0.8
                            ? (language === "vi" ? "✅ Fit tốt" : "✅ Good fit")
                            : r.r2 > 0.5
                            ? (language === "vi" ? "🟡 Fit trung bình" : "🟡 Moderate fit")
                            : (language === "vi" ? "❌ Fit yếu" : "❌ Poor fit")}
                          {r.extraInfo && ` — ${r.extraInfo}`}
                          {i === 0 && (
                            <Badge variant="secondary" className="ml-2 text-[10px]">
                              {language === "vi" ? "🏆 Tốt nhất" : "🏆 Best"}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                    <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/10 text-xs">
                      💡 {language === "vi"
                        ? `Trên bộ dữ liệu ${params.n} mẫu (noise σ=${params.noise}), ${bestModel?.name} cho kết quả tốt nhất với R²=${bestModel?.r2.toFixed(4)}. ${params.noise > 5 ? "Noise cao – regularization (Ridge/Lasso) có thể giúp giảm overfitting." : "Noise thấp – các mô hình tuyến tính cơ bản đã đủ tốt."}`
                        : `On ${params.n} samples (noise σ=${params.noise}), ${bestModel?.name} performs best with R²=${bestModel?.r2.toFixed(4)}. ${params.noise > 5 ? "High noise – regularization (Ridge/Lasso) may help reduce overfitting." : "Low noise – basic linear models are sufficient."}`}
                    </div>
                  </div>
                </SimulationCard>
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <Layers className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                    {language === "vi" ? "Chọn ≥2 mô hình và nhấn So sánh" : "Select ≥2 models and press Compare"}
                  </h3>
                  <p className="text-sm text-muted-foreground/60">
                    {language === "vi"
                      ? "Tất cả mô hình sẽ chạy trên cùng một bộ dữ liệu để so sánh công bằng"
                      : "All models run on the same dataset for fair comparison"}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
