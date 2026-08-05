import { Suspense, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Float, Stars } from "@react-three/drei";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Building2, RefreshCw, ExternalLink, X, Info } from "lucide-react";
import { useStockQuotes } from "@/hooks/useStockData";
import { GLOBAL_STOCKS } from "@/data/globalMarkets";
import { useLanguage } from "@/contexts/LanguageContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const UP = "#22c55e";
const DOWN = "#ef4444";

type ViewMode = "city" | "sector" | "scatter";
type Basket = "US" | "Vietnam" | "Europe" | "Asia";

interface SNode {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  change: number;
  change1m: number;
  cap: number;
  volume: number;
  pe: number;
}

function fmt(n: number) {
  if (!isFinite(n) || n <= 0) return "—";
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toFixed(0)}`;
}

/** Market cap arrives as a formatted string from Yahoo — normalise to a number. */
function parseCap(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v !== "string") return 0;
  const m = v.replace(/[$,\s]/g, "").match(/^([\d.]+)([TBMK])?$/i);
  if (!m) return Number(v.replace(/[^\d.]/g, "")) || 0;
  const mult: Record<string, number> = { T: 1e12, B: 1e9, M: 1e6, K: 1e3 };
  return parseFloat(m[1]) * (m[2] ? mult[m[2].toUpperCase()] : 1);
}

function Tower({
  node,
  pos,
  height,
  active,
  dimmed,
  onSelect,
  seed,
}: {
  node: SNode;
  pos: [number, number, number];
  height: number;
  active: boolean;
  dimmed: boolean;
  onSelect: (n: SNode) => void;
  seed: number;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const color = node.change >= 0 ? UP : DOWN;
  const intensity = Math.min(Math.abs(node.change) / 5, 1);

  useFrame(({ clock }) => {
    if (!mesh.current) return;
    const t = clock.getElapsedTime();
    mesh.current.scale.y = 1 + Math.sin(t * 1.8 + seed) * 0.03 * (0.4 + intensity);
  });

  return (
    <group position={pos}>
      <mesh
        ref={mesh}
        position={[0, height / 2, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(node);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "auto";
        }}
      >
        <boxGeometry args={[0.52, height, 0.52]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered || active ? 1.3 : 0.3 + intensity * 0.6}
          metalness={0.55}
          roughness={0.3}
          transparent
          opacity={dimmed ? 0.25 : 0.9}
        />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.4, active ? 0.72 : 0.55, 20]} />
        <meshBasicMaterial color={color} transparent opacity={active ? 0.7 : 0.28} side={THREE.DoubleSide} />
      </mesh>
      {(hovered || active || !dimmed) && (
        <Text position={[0, height + 0.34, 0]} fontSize={0.24} color={color} anchorX="center" anchorY="middle">
          {node.symbol.replace(".VN", "")}
        </Text>
      )}
    </group>
  );
}

/** Risk–return–valuation scatter: x = |1d move| (risk), y = 1m return, z = P/E. */
function ScatterPoint({
  node,
  pos,
  size,
  active,
  dimmed,
  onSelect,
}: {
  node: SNode;
  pos: [number, number, number];
  size: number;
  active: boolean;
  dimmed: boolean;
  onSelect: (n: SNode) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const color = node.change1m >= 0 ? UP : DOWN;
  return (
    <group position={pos}>
      <Float speed={1.4} floatIntensity={0.35} rotationIntensity={0.2}>
        <mesh
          onClick={(e) => {
            e.stopPropagation();
            onSelect(node);
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            setHovered(false);
            document.body.style.cursor = "auto";
          }}
        >
          <sphereGeometry args={[size, 20, 20]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={hovered || active ? 1.2 : 0.5}
            transparent
            opacity={dimmed ? 0.25 : 0.85}
          />
        </mesh>
      </Float>
      {(hovered || active) && (
        <Text position={[0, size + 0.32, 0]} fontSize={0.24} color="#e2e8f0" anchorX="center">
          {node.symbol.replace(".VN", "")}
        </Text>
      )}
    </group>
  );
}

function Axes() {
  return (
    <group>
      <gridHelper args={[14, 28, "#1e293b", "#111827"]} position={[0, -0.01, 0]} />
      <Text position={[6.6, 0.3, 0]} fontSize={0.28} color="#64748b">
        RISK
      </Text>
      <Text position={[0, 5.4, 0]} fontSize={0.28} color="#64748b">
        RETURN 1M
      </Text>
      <Text position={[0, 0.3, 6.6]} fontSize={0.28} color="#64748b">
        P/E
      </Text>
    </group>
  );
}

const BASKETS: { id: Basket; label: string }[] = [
  { id: "US", label: "US" },
  { id: "Vietnam", label: "VN" },
  { id: "Europe", label: "EU" },
  { id: "Asia", label: "ASIA" },
];

export function Stock3DUniverse() {
  const { language } = useLanguage();
  const vi = language === "vi";
  const [basket, setBasket] = useState<Basket>("US");
  const [view, setView] = useState<ViewMode>("city");
  const [selected, setSelected] = useState<SNode | null>(null);

  const symbols = useMemo(
    () =>
      GLOBAL_STOCKS.filter((s) => s.region === basket && s.cap === "Large")
        .slice(0, 16)
        .map((s) => s.symbol),
    [basket],
  );

  const { data, isLoading, isFetching, dataUpdatedAt } = useStockQuotes(symbols);

  const nodes: SNode[] = useMemo(
    () =>
      (data ?? [])
        .filter((q) => q && q.symbol)
        .map((q) => ({
          symbol: q.symbol,
          name: q.name || q.symbol,
          sector: q.sector || "Other",
          price: q.currentPrice ?? 0,
          change: q.priceChange1d ?? 0,
          change1m: q.priceChange1m ?? 0,
          cap: parseCap(q.marketCap as unknown),
          volume: q.volume ?? 0,
          pe: q.pe ?? 0,
        })),
    [data],
  );

  const maxCap = Math.max(...nodes.map((n) => n.cap), 1);
  const avgChange = nodes.length ? nodes.reduce((s, n) => s + n.change, 0) / nodes.length : 0;
  const breadth = nodes.length ? nodes.filter((n) => n.change >= 0).length / nodes.length : 0.5;

  const sectors = useMemo(() => Array.from(new Set(nodes.map((n) => n.sector))), [nodes]);
  const maxPe = Math.max(...nodes.map((n) => (n.pe > 0 ? n.pe : 0)), 1);
  const maxAbsRet = Math.max(...nodes.map((n) => Math.abs(n.change1m)), 1);
  const maxRisk = Math.max(...nodes.map((n) => Math.abs(n.change)), 1);

  const layout = (n: SNode, i: number): { pos: [number, number, number]; h: number } => {
    const h = 0.5 + (n.cap / maxCap) * 4.5;
    if (view === "city") {
      const cols = 4;
      const gap = 1.7;
      const x = ((i % cols) - (cols - 1) / 2) * gap;
      const z = (Math.floor(i / cols) - 1.5) * gap;
      return { pos: [x, 0, z], h };
    }
    // sector rings
    const si = Math.max(sectors.indexOf(n.sector), 0);
    const inSector = nodes.filter((m) => m.sector === n.sector);
    const k = inSector.findIndex((m) => m.symbol === n.symbol);
    const radius = 2.2 + si * 1.15;
    const angle = (k / Math.max(inSector.length, 1)) * Math.PI * 2 + si * 0.4;
    return { pos: [Math.cos(angle) * radius, 0, Math.sin(angle) * radius], h };
  };

  return (
    <TooltipProvider delayDuration={120}>
      <div className="quant-card overflow-hidden">
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" />
            <div>
              <p className="stat-label flex items-center gap-1">
                {vi ? "Vũ trụ cổ phiếu 3D" : "3D Equity Universe"}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" aria-label="info">
                      <Info className="w-3 h-3 text-muted-foreground" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-[11px] font-mono">
                    {vi
                      ? "Thành phố: mỗi toà = 1 cổ phiếu, chiều cao ∝ vốn hoá, màu = biến động phiên. Ngành: xếp theo vòng ngành. Rủi ro–Lợi nhuận: X = biên độ phiên, Y = lợi nhuận 1 tháng, Z = P/E, kích thước = vốn hoá."
                      : "City: each tower = a stock, height ∝ market cap, colour = daily move. Sector: grouped into sector rings. Risk–Return: X = daily range, Y = 1M return, Z = P/E, size = market cap."}
                  </TooltipContent>
                </Tooltip>
              </p>
              <p className="text-[10px] text-muted-foreground font-mono">
                {vi ? "Dữ liệu Yahoo Finance · làm mới 30s · bấm để xem chi tiết" : "Yahoo Finance · 30s refresh · click for details"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono flex-wrap">
            <div className="flex rounded-md border border-border/60 overflow-hidden">
              {BASKETS.map((b) => (
                <button
                  key={b.id}
                  onClick={() => {
                    setBasket(b.id);
                    setSelected(null);
                  }}
                  className={`px-2 py-1 transition-colors ${basket === b.id ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {b.label}
                </button>
              ))}
            </div>
            <div className="flex rounded-md border border-border/60 overflow-hidden">
              {(
                [
                  { id: "city", label: vi ? "Thành phố" : "City" },
                  { id: "sector", label: vi ? "Ngành" : "Sector" },
                  { id: "scatter", label: vi ? "Rủi ro–LN" : "Risk–Ret" },
                ] as { id: ViewMode; label: string }[]
              ).map((v) => (
                <button
                  key={v.id}
                  onClick={() => setView(v.id)}
                  className={`px-2 py-1 transition-colors ${view === v.id ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {v.label}
                </button>
              ))}
            </div>
            <span className={avgChange >= 0 ? "ticker-green" : "ticker-red"}>
              {vi ? "TB" : "AVG"} {avgChange >= 0 ? "+" : ""}
              {avgChange.toFixed(2)}%
            </span>
            <span className="text-muted-foreground">
              {vi ? "Tăng" : "Up"} {(breadth * 100).toFixed(0)}%
            </span>
            <span className="inline-flex items-center gap-1 text-emerald-500">
              <RefreshCw className={`w-3 h-3 ${isFetching ? "animate-spin" : ""}`} /> LIVE
            </span>
          </div>
        </div>

        <div className="relative h-[400px] rounded-lg border border-border/40 bg-background/40">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}
          <Canvas camera={{ position: [0, 6.5, 12], fov: 45 }} dpr={[1, 1.75]} onPointerMissed={() => setSelected(null)}>
            <color attach="background" args={["#05080f"]} />
            <fog attach="fog" args={["#05080f", 16, 30]} />
            <ambientLight intensity={0.55} />
            <pointLight position={[7, 11, 7]} intensity={80} color="#38bdf8" />
            <pointLight position={[-7, 7, -7]} intensity={50} color="#f59e0b" />
            <Suspense fallback={null}>
              <Stars radius={45} depth={30} count={700} factor={3} fade speed={0.5} />
              {view === "scatter" ? (
                <>
                  <Axes />
                  {nodes.map((n) => (
                    <ScatterPoint
                      key={n.symbol}
                      node={n}
                      pos={[
                        (Math.abs(n.change) / maxRisk) * 5.5 - 2.5,
                        (n.change1m / maxAbsRet) * 2.4 + 2.6,
                        ((n.pe > 0 ? n.pe : 0) / maxPe) * 5.5 - 2.5,
                      ]}
                      size={0.22 + (n.cap / maxCap) * 0.4}
                      active={selected?.symbol === n.symbol}
                      dimmed={!!selected && selected.symbol !== n.symbol}
                      onSelect={(node) => setSelected((p) => (p?.symbol === node.symbol ? null : node))}
                    />
                  ))}
                </>
              ) : (
                <>
                  <gridHelper args={[16, 32, "#1e293b", "#111827"]} position={[0, -0.01, 0]} />
                  {nodes.map((n, i) => {
                    const { pos, h } = layout(n, i);
                    return (
                      <Tower
                        key={n.symbol}
                        node={n}
                        pos={pos}
                        height={h}
                        seed={i}
                        active={selected?.symbol === n.symbol}
                        dimmed={!!selected && selected.symbol !== n.symbol}
                        onSelect={(node) => setSelected((p) => (p?.symbol === node.symbol ? null : node))}
                      />
                    );
                  })}
                </>
              )}
            </Suspense>
            <OrbitControls
              enablePan={false}
              enableDamping
              minDistance={7}
              maxDistance={22}
              maxPolarAngle={Math.PI / 2.1}
              autoRotate={!selected}
              autoRotateSpeed={0.45}
            />
          </Canvas>

          <AnimatePresence>
            {selected && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                className="absolute top-3 left-3 w-[248px] rounded-lg border border-border/60 bg-background/85 backdrop-blur-md p-3 shadow-xl"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-sm text-foreground">{selected.symbol}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{selected.name}</p>
                  </div>
                  <button onClick={() => setSelected(null)} aria-label="close">
                    <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                  </button>
                </div>
                <div className="mt-2 space-y-1 text-[11px] font-mono">
                  <Row l={vi ? "Giá" : "Price"} v={selected.price ? `$${selected.price.toLocaleString()}` : "—"} />
                  <Row
                    l={vi ? "Biến động phiên" : "1D change"}
                    v={`${selected.change >= 0 ? "+" : ""}${selected.change.toFixed(2)}%`}
                    c={selected.change >= 0 ? "ticker-green" : "ticker-red"}
                  />
                  <Row
                    l={vi ? "Lợi nhuận 1 tháng" : "1M return"}
                    v={`${selected.change1m >= 0 ? "+" : ""}${selected.change1m.toFixed(2)}%`}
                    c={selected.change1m >= 0 ? "ticker-green" : "ticker-red"}
                  />
                  <Row l={vi ? "Vốn hoá" : "Market cap"} v={fmt(selected.cap)} />
                  <Row l="P/E" v={selected.pe > 0 ? selected.pe.toFixed(2) : "—"} />
                  <Row l={vi ? "Ngành" : "Sector"} v={selected.sector} />
                  <Row l={vi ? "Khối lượng" : "Volume"} v={selected.volume ? selected.volume.toLocaleString() : "—"} />
                </div>
                <a
                  href={`https://finance.yahoo.com/quote/${encodeURIComponent(selected.symbol)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-[10px] font-mono text-primary hover:underline"
                >
                  {vi ? "Nguồn: Yahoo Finance" : "Source: Yahoo Finance"} <ExternalLink className="w-3 h-3" />
                </a>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="absolute bottom-2 left-3 text-[10px] font-mono text-muted-foreground">
            {vi ? "Kéo để xoay · Cuộn để zoom · Bấm để xem chi tiết" : "Drag to rotate · Scroll to zoom · Click for details"}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 mt-2 flex-wrap text-[10px] font-mono text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <i className="w-2 h-2 rounded-sm bg-emerald-500 inline-block" /> {vi ? "Tăng" : "Up"}
            </span>
            <span className="inline-flex items-center gap-1">
              <i className="w-2 h-2 rounded-sm bg-red-500 inline-block" /> {vi ? "Giảm" : "Down"}
            </span>
            <span>{vi ? "Chiều cao / kích thước = vốn hoá" : "Height / size = market cap"}</span>
          </div>
          <span>
            {vi ? "Nguồn: Yahoo Finance · làm mới 30s" : "Source: Yahoo Finance · 30s refresh"}
            {dataUpdatedAt ? ` · ${new Date(dataUpdatedAt).toLocaleTimeString()}` : ""}
          </span>
        </div>
      </div>
    </TooltipProvider>
  );
}

function Row({ l, v, c }: { l: string; v: string; c?: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{l}</span>
      <span className={c ?? "text-foreground"}>{v}</span>
    </div>
  );
}

export default Stock3DUniverse;
