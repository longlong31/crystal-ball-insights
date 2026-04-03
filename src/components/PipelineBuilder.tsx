import { useState, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { SimulationCard } from "@/components/SimulationCard";
import {
  Play, Trash2, Plus, ArrowRight, X, GripVertical,
  FlaskConical, TrendingUp, Brain, Settings2, Cpu,
  BarChart3, Target, Zap, GitBranch, Layers, Sigma, Download,
  Link2, Unlink, ChevronRight, Workflow, RotateCcw,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

// ─── Types ────────────────────────────────────────────────────────
interface AlgorithmParam {
  key: string;
  label: string;
  defaultValue: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  description?: string;
  unit?: string;
}

interface AlgorithmResult {
  outputs: Record<string, { label: string; value: number | string; unit?: string }>;
  chartData?: { name: string; value: number }[];
  interpretation?: string;
}

interface Algorithm {
  id: string;
  name: string;
  nameVi: string;
  category: "financial" | "optimization" | "ml";
  icon: any;
  params: AlgorithmParam[];
  run: (params: Record<string, number>) => AlgorithmResult;
}

interface PipelineNode {
  instanceId: string;
  algoId: string;
  x: number;
  y: number;
  params: Record<string, number>;
  result?: AlgorithmResult;
  status: "idle" | "running" | "done" | "error";
}

interface PipelineConnection {
  id: string;
  fromNodeId: string;
  fromOutputKey: string;
  toNodeId: string;
  toParamKey: string;
}

interface PipelineBuilderProps {
  algorithms: Algorithm[];
}

const categoryColors: Record<string, { border: string; bg: string; text: string }> = {
  financial: { border: "border-emerald-500/40", bg: "bg-emerald-500/10", text: "text-emerald-400" },
  optimization: { border: "border-amber-500/40", bg: "bg-amber-500/10", text: "text-amber-400" },
  ml: { border: "border-violet-500/40", bg: "bg-violet-500/10", text: "text-violet-400" },
};

let nodeCounter = 0;
const genNodeId = () => `node-${++nodeCounter}-${Date.now()}`;

export function PipelineBuilder({ algorithms }: PipelineBuilderProps) {
  const { language } = useLanguage();
  const [nodes, setNodes] = useState<PipelineNode[]>([]);
  const [connections, setConnections] = useState<PipelineConnection[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<{ nodeId: string; outputKey: string } | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [dragInfo, setDragInfo] = useState<{ nodeId: string; offsetX: number; offsetY: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const selectedNode = useMemo(() => nodes.find(n => n.instanceId === selectedNodeId), [nodes, selectedNodeId]);
  const selectedAlgo = useMemo(() => selectedNode ? algorithms.find(a => a.id === selectedNode.algoId) : null, [selectedNode, algorithms]);

  // ─── Add node from palette ──────────────────────────────────────
  const addNode = useCallback((algo: Algorithm) => {
    const node: PipelineNode = {
      instanceId: genNodeId(),
      algoId: algo.id,
      x: 60 + (nodes.length % 3) * 280,
      y: 60 + Math.floor(nodes.length / 3) * 200,
      params: Object.fromEntries(algo.params.map(p => [p.key, p.defaultValue])),
      status: "idle",
    };
    setNodes(prev => [...prev, node]);
    setSelectedNodeId(node.instanceId);
  }, [nodes.length]);

  const removeNode = useCallback((nodeId: string) => {
    setNodes(prev => prev.filter(n => n.instanceId !== nodeId));
    setConnections(prev => prev.filter(c => c.fromNodeId !== nodeId && c.toNodeId !== nodeId));
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
  }, [selectedNodeId]);

  // ─── Drag nodes ─────────────────────────────────────────────────
  const handleMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    const node = nodes.find(n => n.instanceId === nodeId);
    if (!node || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    setDragInfo({ nodeId, offsetX: e.clientX - rect.left - node.x, offsetY: e.clientY - rect.top - node.y });
  }, [nodes]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragInfo || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(0, e.clientX - rect.left - dragInfo.offsetX);
    const y = Math.max(0, e.clientY - rect.top - dragInfo.offsetY);
    setNodes(prev => prev.map(n => n.instanceId === dragInfo.nodeId ? { ...n, x, y } : n));
  }, [dragInfo]);

  const handleMouseUp = useCallback(() => setDragInfo(null), []);

  // ─── Connections ────────────────────────────────────────────────
  const startConnection = useCallback((nodeId: string, outputKey: string) => {
    setConnecting({ nodeId, outputKey });
  }, []);

  const completeConnection = useCallback((toNodeId: string, toParamKey: string) => {
    if (!connecting || connecting.nodeId === toNodeId) { setConnecting(null); return; }
    // Prevent duplicate
    const exists = connections.some(c => c.toNodeId === toNodeId && c.toParamKey === toParamKey);
    if (exists) { setConnecting(null); return; }
    // Prevent cycles (simple: no self-loops or direct back-loops)
    const wouldCycle = connections.some(c => c.fromNodeId === toNodeId && c.toNodeId === connecting.nodeId);
    if (wouldCycle) { setConnecting(null); return; }

    setConnections(prev => [...prev, {
      id: `conn-${Date.now()}`,
      fromNodeId: connecting.nodeId,
      fromOutputKey: connecting.outputKey,
      toNodeId,
      toParamKey,
    }]);
    setConnecting(null);
  }, [connecting, connections]);

  const removeConnection = useCallback((connId: string) => {
    setConnections(prev => prev.filter(c => c.id !== connId));
  }, []);

  // ─── Topological sort & run pipeline ────────────────────────────
  const topoSort = useCallback((): string[] | null => {
    const inDeg: Record<string, number> = {};
    const adj: Record<string, string[]> = {};
    nodes.forEach(n => { inDeg[n.instanceId] = 0; adj[n.instanceId] = []; });
    connections.forEach(c => {
      inDeg[c.toNodeId] = (inDeg[c.toNodeId] || 0) + 1;
      adj[c.fromNodeId] = adj[c.fromNodeId] || [];
      adj[c.fromNodeId].push(c.toNodeId);
    });
    const queue = nodes.filter(n => inDeg[n.instanceId] === 0).map(n => n.instanceId);
    const order: string[] = [];
    while (queue.length > 0) {
      const cur = queue.shift()!;
      order.push(cur);
      (adj[cur] || []).forEach(next => {
        inDeg[next]--;
        if (inDeg[next] === 0) queue.push(next);
      });
    }
    return order.length === nodes.length ? order : null;
  }, [nodes, connections]);

  const runPipeline = useCallback(async () => {
    const order = topoSort();
    if (!order) return;
    setIsRunning(true);
    setNodes(prev => prev.map(n => ({ ...n, status: "idle" as const, result: undefined })));

    const results: Record<string, AlgorithmResult> = {};

    for (const nodeId of order) {
      setNodes(prev => prev.map(n => n.instanceId === nodeId ? { ...n, status: "running" as const } : n));
      await new Promise(r => setTimeout(r, 400));

      const node = nodes.find(n => n.instanceId === nodeId)!;
      const algo = algorithms.find(a => a.id === node.algoId)!;

      // Build params: start with node defaults, override with connections
      const params = { ...node.params };
      connections
        .filter(c => c.toNodeId === nodeId)
        .forEach(c => {
          const fromResult = results[c.fromNodeId];
          if (fromResult?.outputs[c.fromOutputKey]) {
            const val = fromResult.outputs[c.fromOutputKey].value;
            params[c.toParamKey] = typeof val === "number" ? val : parseFloat(String(val)) || 0;
          }
        });

      try {
        const result = algo.run(params);
        results[nodeId] = result;
        setNodes(prev => prev.map(n => n.instanceId === nodeId ? { ...n, status: "done" as const, result, params } : n));
      } catch {
        setNodes(prev => prev.map(n => n.instanceId === nodeId ? { ...n, status: "error" as const } : n));
      }
    }
    setIsRunning(false);
  }, [topoSort, nodes, algorithms, connections]);

  const clearPipeline = useCallback(() => {
    setNodes([]);
    setConnections([]);
    setSelectedNodeId(null);
    setConnecting(null);
  }, []);

  // ─── SVG connection lines ──────────────────────────────────────
  const getNodeCenter = (nodeId: string, type: "out" | "in") => {
    const node = nodes.find(n => n.instanceId === nodeId);
    if (!node) return { x: 0, y: 0 };
    return type === "out"
      ? { x: node.x + 240, y: node.y + 50 }
      : { x: node.x, y: node.y + 50 };
  };

  const statusColors: Record<string, string> = {
    idle: "border-border/60",
    running: "border-primary animate-pulse",
    done: "border-emerald-500/60",
    error: "border-destructive/60",
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <SimulationCard>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Workflow className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-sm">
              {language === "vi" ? "Pipeline Builder" : "Pipeline Builder"}
            </h3>
            <span className="text-xs text-muted-foreground">
              ({nodes.length} {language === "vi" ? "nút" : "nodes"}, {connections.length} {language === "vi" ? "kết nối" : "connections"})
            </span>
          </div>
          <div className="flex items-center gap-2">
            {connecting && (
              <span className="text-xs text-primary animate-pulse flex items-center gap-1">
                <Link2 className="w-3 h-3" />
                {language === "vi" ? "Nhấn input để kết nối..." : "Click an input to connect..."}
                <button onClick={() => setConnecting(null)} className="ml-1">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <Button variant="glow" size="sm" onClick={runPipeline} disabled={isRunning || nodes.length === 0}>
              <Play className="w-3.5 h-3.5 mr-1" />
              {isRunning ? (language === "vi" ? "Đang chạy..." : "Running...") : (language === "vi" ? "Chạy Pipeline" : "Run Pipeline")}
            </Button>
            <Button variant="outline" size="sm" onClick={clearPipeline} disabled={nodes.length === 0}>
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              {language === "vi" ? "Xóa hết" : "Clear"}
            </Button>
          </div>
        </div>
      </SimulationCard>

      <div className="grid lg:grid-cols-[240px_1fr_280px] gap-4">
        {/* Algorithm palette */}
        <SimulationCard>
          <h4 className="text-xs font-semibold mb-3 flex items-center gap-1.5 text-muted-foreground uppercase tracking-wider">
            <Plus className="w-3.5 h-3.5" />
            {language === "vi" ? "Kéo thả thuật toán" : "Add Algorithms"}
          </h4>
          <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
            {algorithms.map(algo => {
              const Icon = algo.icon;
              const colors = categoryColors[algo.category];
              return (
                <motion.button
                  key={algo.id}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => addNode(algo)}
                  className={`w-full text-left p-2.5 rounded-lg border transition-all hover:shadow-md ${colors.border} ${colors.bg}`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`w-3.5 h-3.5 ${colors.text}`} />
                    <span className="text-xs font-medium truncate">
                      {language === "vi" ? algo.nameVi.split("(")[0].trim() : algo.name}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </SimulationCard>

        {/* Canvas */}
        <div
          ref={canvasRef}
          className="relative min-h-[500px] rounded-xl border border-border/50 bg-muted/20 overflow-hidden cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Grid pattern */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
                <path d="M 24 0 L 0 0 0 24" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.3" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* Connection lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
            <defs>
              <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="hsl(var(--primary))" opacity="0.7" />
              </marker>
            </defs>
            {connections.map(conn => {
              const from = getNodeCenter(conn.fromNodeId, "out");
              const to = getNodeCenter(conn.toNodeId, "in");
              const midX = (from.x + to.x) / 2;
              return (
                <g key={conn.id}>
                  <path
                    d={`M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`}
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="2"
                    opacity="0.5"
                    markerEnd="url(#arrowhead)"
                    strokeDasharray="6 3"
                  />
                </g>
              );
            })}
          </svg>

          {/* Nodes */}
          {nodes.map(node => {
            const algo = algorithms.find(a => a.id === node.algoId)!;
            const Icon = algo.icon;
            const colors = categoryColors[algo.category];
            const isSelected = selectedNodeId === node.instanceId;

            return (
              <motion.div
                key={node.instanceId}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`absolute w-[240px] rounded-xl border-2 shadow-lg backdrop-blur-sm cursor-grab active:cursor-grabbing transition-colors ${
                  isSelected ? "border-primary shadow-primary/20" : statusColors[node.status]
                } bg-card/90`}
                style={{ left: node.x, top: node.y, zIndex: isSelected ? 10 : 2 }}
                onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, node.instanceId); }}
                onClick={(e) => { e.stopPropagation(); setSelectedNodeId(node.instanceId); }}
              >
                {/* Header */}
                <div className={`flex items-center gap-2 px-3 py-2 rounded-t-[10px] ${colors.bg} border-b border-border/30`}>
                  <GripVertical className="w-3 h-3 text-muted-foreground/50" />
                  <Icon className={`w-3.5 h-3.5 ${colors.text}`} />
                  <span className="text-xs font-semibold flex-1 truncate">{language === "vi" ? algo.nameVi.split("(")[0].trim() : algo.name}</span>
                  {node.status === "done" && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
                  {node.status === "running" && <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                  {node.status === "error" && <span className="w-2 h-2 rounded-full bg-destructive" />}
                  <button
                    onClick={(e) => { e.stopPropagation(); removeNode(node.instanceId); }}
                    className="text-muted-foreground/50 hover:text-destructive transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Input ports */}
                <div className="px-3 py-2 space-y-1">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Inputs</div>
                  {algo.params.slice(0, 3).map(param => {
                    const hasConn = connections.some(c => c.toNodeId === node.instanceId && c.toParamKey === param.key);
                    return (
                      <button
                        key={param.key}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (connecting) completeConnection(node.instanceId, param.key);
                        }}
                        className={`flex items-center gap-1.5 w-full text-left px-1.5 py-0.5 rounded text-[11px] transition-colors ${
                          connecting ? "hover:bg-primary/20 cursor-pointer" : "cursor-default"
                        } ${hasConn ? "text-primary font-medium" : "text-muted-foreground"}`}
                      >
                        <span className={`w-2 h-2 rounded-full border ${hasConn ? "bg-primary border-primary" : "border-muted-foreground/40"}`} />
                        <span className="truncate">{param.label.split("(")[0].trim()}</span>
                        {hasConn && <Link2 className="w-2.5 h-2.5 ml-auto text-primary" />}
                      </button>
                    );
                  })}
                  {algo.params.length > 3 && (
                    <span className="text-[10px] text-muted-foreground/50 pl-4">+{algo.params.length - 3} more</span>
                  )}
                </div>

                {/* Output ports */}
                {node.result && (
                  <div className="px-3 py-2 border-t border-border/30 space-y-1">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Outputs</div>
                    {Object.entries(node.result.outputs).slice(0, 3).map(([key, output]) => (
                      <button
                        key={key}
                        onClick={(e) => { e.stopPropagation(); startConnection(node.instanceId, key); }}
                        className="flex items-center gap-1.5 w-full text-left px-1.5 py-0.5 rounded text-[11px] text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        <span className="truncate flex-1">{output.label}: <span className="font-mono">{output.value}{output.unit || ""}</span></span>
                        <ChevronRight className="w-2.5 h-2.5 shrink-0" />
                      </button>
                    ))}
                    {Object.keys(node.result.outputs).length > 3 && (
                      <span className="text-[10px] text-muted-foreground/50 pl-4">+{Object.keys(node.result.outputs).length - 3} more</span>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}

          {/* Empty state */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Workflow className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground/50">
                  {language === "vi" ? "Nhấn thuật toán ở panel trái để thêm vào canvas" : "Click an algorithm from the left panel to add it"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Properties panel */}
        <div className="space-y-4">
          {selectedNode && selectedAlgo ? (
            <>
              <SimulationCard>
                <h4 className="text-xs font-semibold mb-3 flex items-center gap-1.5 text-muted-foreground uppercase tracking-wider">
                  <Settings2 className="w-3.5 h-3.5" />
                  {language === "vi" ? "Tham số" : "Parameters"}
                </h4>
                <div className="space-y-2.5">
                  {selectedAlgo.params.map(param => {
                    const hasConn = connections.some(c => c.toNodeId === selectedNode.instanceId && c.toParamKey === param.key);
                    return (
                      <div key={param.key}>
                        <label className="text-[11px] text-muted-foreground flex items-center justify-between">
                          <span>{param.label}</span>
                          {hasConn && (
                            <span className="text-primary flex items-center gap-0.5">
                              <Link2 className="w-2.5 h-2.5" /> linked
                            </span>
                          )}
                        </label>
                        <input
                          type="number"
                          value={selectedNode.params[param.key] ?? param.defaultValue}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setNodes(prev => prev.map(n =>
                              n.instanceId === selectedNode.instanceId
                                ? { ...n, params: { ...n.params, [param.key]: val } }
                                : n
                            ));
                          }}
                          disabled={hasConn}
                          min={param.min}
                          max={param.max}
                          step={param.step}
                          className="w-full mt-1 px-2 py-1.5 text-xs font-mono rounded-md border border-border/50 bg-background focus:border-primary focus:outline-none disabled:opacity-50"
                        />
                      </div>
                    );
                  })}
                </div>
              </SimulationCard>

              {/* Connections for this node */}
              {connections.filter(c => c.toNodeId === selectedNode.instanceId || c.fromNodeId === selectedNode.instanceId).length > 0 && (
                <SimulationCard>
                  <h4 className="text-xs font-semibold mb-3 flex items-center gap-1.5 text-muted-foreground uppercase tracking-wider">
                    <Link2 className="w-3.5 h-3.5" />
                    {language === "vi" ? "Kết nối" : "Connections"}
                  </h4>
                  <div className="space-y-1.5">
                    {connections
                      .filter(c => c.toNodeId === selectedNode.instanceId || c.fromNodeId === selectedNode.instanceId)
                      .map(c => {
                        const fromNode = nodes.find(n => n.instanceId === c.fromNodeId);
                        const toNode = nodes.find(n => n.instanceId === c.toNodeId);
                        const fromAlgo = algorithms.find(a => a.id === fromNode?.algoId);
                        const toAlgo = algorithms.find(a => a.id === toNode?.algoId);
                        return (
                          <div key={c.id} className="flex items-center gap-1.5 text-[11px] p-1.5 rounded bg-muted/30">
                            <span className="truncate text-muted-foreground">{fromAlgo?.name}</span>
                            <ArrowRight className="w-3 h-3 text-primary shrink-0" />
                            <span className="truncate text-muted-foreground">{toAlgo?.name}</span>
                            <button onClick={() => removeConnection(c.id)} className="ml-auto text-muted-foreground/50 hover:text-destructive">
                              <Unlink className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                  </div>
                </SimulationCard>
              )}

              {/* Node result */}
              {selectedNode.result && (
                <SimulationCard>
                  <h4 className="text-xs font-semibold mb-3 flex items-center gap-1.5 text-muted-foreground uppercase tracking-wider">
                    <BarChart3 className="w-3.5 h-3.5" />
                    {language === "vi" ? "Kết quả" : "Results"}
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(selectedNode.result.outputs).map(([key, output]) => (
                      <div key={key} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground truncate">{output.label}</span>
                        <span className="font-mono font-medium">
                          {typeof output.value === "number" ? output.value.toLocaleString() : output.value}
                          {output.unit || ""}
                        </span>
                      </div>
                    ))}
                  </div>
                  {selectedNode.result.interpretation && (
                    <p className="mt-3 text-[11px] text-muted-foreground/70 leading-relaxed border-t border-border/30 pt-2">
                      {selectedNode.result.interpretation}
                    </p>
                  )}
                </SimulationCard>
              )}
            </>
          ) : (
            <SimulationCard>
              <div className="text-center py-8">
                <Settings2 className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground/50">
                  {language === "vi" ? "Chọn một nút để chỉnh tham số" : "Select a node to edit parameters"}
                </p>
              </div>
            </SimulationCard>
          )}
        </div>
      </div>

      {/* Pipeline execution results summary */}
      <AnimatePresence>
        {nodes.some(n => n.status === "done") && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <SimulationCard>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                {language === "vi" ? "Tổng kết Pipeline" : "Pipeline Summary"}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {nodes.filter(n => n.status === "done").map(node => {
                  const algo = algorithms.find(a => a.id === node.algoId)!;
                  const Icon = algo.icon;
                  const colors = categoryColors[algo.category];
                  return (
                    <div key={node.instanceId} className={`p-3 rounded-lg border ${colors.border} ${colors.bg}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className={`w-3.5 h-3.5 ${colors.text}`} />
                        <span className="text-xs font-semibold">{language === "vi" ? algo.nameVi.split("(")[0].trim() : algo.name}</span>
                        <span className="ml-auto w-2 h-2 rounded-full bg-emerald-400" />
                      </div>
                      {node.result && (
                        <div className="space-y-0.5">
                          {Object.entries(node.result.outputs).slice(0, 2).map(([k, o]) => (
                            <div key={k} className="flex justify-between text-[11px]">
                              <span className="text-muted-foreground truncate">{o.label}</span>
                              <span className="font-mono">{o.value}{o.unit || ""}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </SimulationCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
