import { Suspense, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Float, Stars } from "@react-three/drei";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Boxes, RefreshCw, ExternalLink, X, Info } from "lucide-react";
import { useTopCryptoMarkets } from "@/hooks/useMarketData";
import { useLanguage } from "@/contexts/LanguageContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const UP = "#22c55e";
const DOWN = "#ef4444";

interface Node {
  id: string;
  name: string;
  symbol: string;
  cap: number;
  change: number;
  price: number;
  volume: number;
}

function fmt(n: number) {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toFixed(0)}`;
}

/** Pulsing market-cap pillar. Height = market cap, colour = 24h change. */
function Pillar({
  node,
  index,
  total,
  maxCap,
  active,
  dimmed,
  onSelect,
}: {
  node: Node;
  index: number;
  total: number;
  maxCap: number;
  active: boolean;
  dimmed: boolean;
  onSelect: (n: Node) => void;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const h = 0.6 + (node.cap / maxCap) * 4.2;
  const angle = (index / total) * Math.PI * 2;
  const radius = 4.2;
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  const color = node.change >= 0 ? UP : DOWN;
  const intensity = Math.min(Math.abs(node.change) / 6, 1);

  useFrame(({ clock }) => {
    if (!mesh.current) return;
    const t = clock.getElapsedTime();
    const pulse = 1 + Math.sin(t * 2 + index) * 0.04 * (0.3 + intensity);
    mesh.current.scale.y = pulse;
  });

  return (
    <group position={[x, 0, z]}>
      <mesh
        ref={mesh}
        position={[0, h / 2, 0]}
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
        <cylinderGeometry args={[0.34, 0.34, h, 6]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered || active ? 1.4 : 0.35 + intensity * 0.6}
          metalness={0.6}
          roughness={0.25}
          transparent
          opacity={dimmed ? 0.3 : 0.92}
        />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.42, active ? 0.78 : 0.62, 24]} />
        <meshBasicMaterial color={color} transparent opacity={active ? 0.7 : 0.35} side={THREE.DoubleSide} />
      </mesh>
      <Text position={[0, h + 0.55, 0]} fontSize={0.36} color={color} anchorX="center" anchorY="middle">
        {node.symbol}
      </Text>
      <Text position={[0, h + 0.2, 0]} fontSize={0.22} color="#94a3b8" anchorX="center" anchorY="middle">
        {`${node.change >= 0 ? "+" : ""}${node.change.toFixed(2)}%`}
      </Text>
    </group>
  );
}

/** Central rotating core representing total market liquidity. */
function Core({ score }: { score: number }) {
  const g = useRef<THREE.Group>(null);
  useFrame((_, d) => {
    if (g.current) g.current.rotation.y += d * 0.25;
  });
  const color = score >= 0 ? UP : DOWN;
  return (
    <group ref={g}>
      <Float speed={2} rotationIntensity={0.4} floatIntensity={0.6}>
        <mesh>
          <icosahedronGeometry args={[1.5, 1]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.5}
            wireframe
            transparent
            opacity={0.75}
          />
        </mesh>
        <mesh>
          <sphereGeometry args={[1.05, 32, 32]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.9} transparent opacity={0.18} />
        </mesh>
      </Float>
    </group>
  );
}

/** Particles flowing from the core out to each asset pillar = capital flow. */
function FlowParticles({ nodes }: { nodes: Node[] }) {
  const ref = useRef<THREE.Points>(null);
  const COUNT = 320;
  const seeds = useMemo(
    () =>
      Array.from({ length: COUNT }, (_, i) => ({
        target: i % Math.max(nodes.length, 1),
        offset: Math.random(),
        speed: 0.15 + Math.random() * 0.35,
      })),
    [nodes.length],
  );
  const positions = useMemo(() => new Float32Array(COUNT * 3), []);
  const colors = useMemo(() => new Float32Array(COUNT * 3), []);

  useFrame(({ clock }) => {
    if (!ref.current || !nodes.length) return;
    const t = clock.getElapsedTime();
    for (let i = 0; i < COUNT; i++) {
      const s = seeds[i];
      const node = nodes[s.target % nodes.length];
      const angle = ((s.target % nodes.length) / nodes.length) * Math.PI * 2;
      const p = (s.offset + t * s.speed) % 1;
      const r = p * 4.2;
      positions[i * 3] = Math.cos(angle) * r;
      positions[i * 3 + 1] = Math.sin(p * Math.PI) * 1.6 + 0.2;
      positions[i * 3 + 2] = Math.sin(angle) * r;
      const c = new THREE.Color(node.change >= 0 ? UP : DOWN);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    const geo = ref.current.geometry;
    geo.attributes.position.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.09} vertexColors transparent opacity={0.85} sizeAttenuation depthWrite={false} />
    </points>
  );
}

function Grid() {
  return (
    <gridHelper args={[16, 32, "#1e293b", "#111827"]} position={[0, -0.01, 0]} />
  );
}

export function Market3DUniverse() {
  const { language } = useLanguage();
  const vi = language === "vi";
  const { data, isLoading, isFetching, dataUpdatedAt } = useTopCryptoMarkets(12);
  const [selected, setSelected] = useState<Node | null>(null);

  const nodes: Node[] = useMemo(
    () =>
      (data ?? []).slice(0, 12).map((d) => ({
        id: d.id,
        name: d.name,
        symbol: d.symbol.toUpperCase(),
        cap: d.marketCap || 1,
        change: d.priceChangePercentage24h ?? 0,
        price: d.currentPrice,
        volume: d.totalVolume,
      })),
    [data],
  );

  const maxCap = Math.max(...nodes.map((n) => n.cap), 1);
  const totalCap = nodes.reduce((s, n) => s + n.cap, 0) || 1;
  const breadth = nodes.length ? nodes.filter((n) => n.change >= 0).length / nodes.length : 0.5;
  const avgChange = nodes.length ? nodes.reduce((s, n) => s + n.change, 0) / nodes.length : 0;

  return (
    <TooltipProvider delayDuration={120}>
      <div className="quant-card overflow-hidden">
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Boxes className="w-4 h-4 text-primary" />
            <div>
              <p className="stat-label flex items-center gap-1">
                {vi ? "Vũ trụ thị trường 3D" : "3D Market Universe"}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" aria-label="info">
                      <Info className="w-3 h-3 text-muted-foreground" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-[11px] font-mono">
                    {vi
                      ? "Mỗi cột = 1 tài sản top vốn hoá. Chiều cao ∝ vốn hoá, màu = biến động 24h, hạt sáng chạy từ lõi = dòng vốn. Bấm vào cột để xem chi tiết realtime."
                      : "Each pillar = a top-cap asset. Height ∝ market cap, colour = 24h change, particles from core = capital flow. Click a pillar for realtime details."}
                  </TooltipContent>
                </Tooltip>
              </p>
              <p className="text-[10px] text-muted-foreground font-mono">
                {vi
                  ? "Chiều cao = vốn hoá · Màu = biến động 24h · Bấm cột để xem chi tiết"
                  : "Height = market cap · Colour = 24h change · Click a pillar"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono">
            <span className={avgChange >= 0 ? "ticker-green" : "ticker-red"}>
              {vi ? "TB" : "AVG"} {avgChange >= 0 ? "+" : ""}{avgChange.toFixed(2)}%
            </span>
            <span className="text-muted-foreground">
              {vi ? "Tăng" : "Up"} {(breadth * 100).toFixed(0)}%
            </span>
            <span className="inline-flex items-center gap-1 text-emerald-500">
              <RefreshCw className={`w-3 h-3 ${isFetching ? "animate-spin" : ""}`} /> LIVE
            </span>
          </div>
        </div>

        <div className="relative h-[380px] rounded-lg border border-border/40 bg-background/40">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}
          <Canvas camera={{ position: [0, 6, 11], fov: 45 }} dpr={[1, 1.75]} onPointerMissed={() => setSelected(null)}>
            <color attach="background" args={["#05080f"]} />
            <fog attach="fog" args={["#05080f", 14, 26]} />
            <ambientLight intensity={0.5} />
            <pointLight position={[6, 10, 6]} intensity={80} color="#38bdf8" />
            <pointLight position={[-6, 6, -6]} intensity={50} color="#a855f7" />
            <Suspense fallback={null}>
              <Stars radius={40} depth={30} count={900} factor={3} fade speed={0.6} />
              <Grid />
              <Core score={avgChange} />
              <FlowParticles nodes={nodes} />
              {nodes.map((n, i) => (
                <Pillar
                  key={n.symbol}
                  node={n}
                  index={i}
                  total={nodes.length}
                  maxCap={maxCap}
                  active={selected?.symbol === n.symbol}
                  dimmed={!!selected && selected.symbol !== n.symbol}
                  onSelect={(node) => setSelected((p) => (p?.symbol === node.symbol ? null : node))}
                />
              ))}
            </Suspense>
            <OrbitControls
              enablePan={false}
              enableDamping
              minDistance={7}
              maxDistance={20}
              maxPolarAngle={Math.PI / 2.1}
              autoRotate={!selected}
              autoRotateSpeed={0.5}
            />
          </Canvas>

          <AnimatePresence>
            {selected && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                className="absolute top-3 left-3 w-[240px] rounded-lg border border-border/60 bg-background/85 backdrop-blur-md p-3 shadow-xl"
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
                  <Row l={vi ? "Giá" : "Price"} v={`$${selected.price?.toLocaleString()}`} />
                  <Row
                    l={vi ? "Biến động 24h" : "24h change"}
                    v={`${selected.change >= 0 ? "+" : ""}${selected.change.toFixed(2)}%`}
                    c={selected.change >= 0 ? "ticker-green" : "ticker-red"}
                  />
                  <Row l={vi ? "Vốn hoá" : "Market cap"} v={fmt(selected.cap)} />
                  <Row l={vi ? "Tỷ trọng vốn hoá" : "Cap weight"} v={`${((selected.cap / totalCap) * 100).toFixed(1)}%`} />
                  <Row l={vi ? "KL 24h" : "24h volume"} v={fmt(selected.volume || 0)} />
                  <Row
                    l={vi ? "Vòng quay (KL/Vốn hoá)" : "Turnover (Vol/Cap)"}
                    v={`${((selected.volume / Math.max(selected.cap, 1)) * 100).toFixed(2)}%`}
                  />
                </div>
                <a
                  href={`https://www.coingecko.com/en/coins/${selected.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-[10px] font-mono text-primary hover:underline"
                >
                  {vi ? "Nguồn: CoinGecko" : "Source: CoinGecko"} <ExternalLink className="w-3 h-3" />
                </a>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="absolute bottom-2 left-3 text-[10px] font-mono text-muted-foreground">
            {vi ? "Kéo để xoay · Cuộn để zoom · Bấm cột xem chi tiết" : "Drag to rotate · Scroll to zoom · Click a pillar"}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 mt-2 flex-wrap text-[10px] font-mono text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1"><i className="w-2 h-2 rounded-sm bg-emerald-500 inline-block" /> {vi ? "Tăng 24h" : "Up 24h"}</span>
            <span className="inline-flex items-center gap-1"><i className="w-2 h-2 rounded-sm bg-red-500 inline-block" /> {vi ? "Giảm 24h" : "Down 24h"}</span>
            <span className="inline-flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-cyan-400 inline-block" /> {vi ? "Hạt = dòng vốn" : "Particles = flow"}</span>
          </div>
          <a href="https://www.coingecko.com/en/api" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-primary">
            {vi ? "Nguồn: CoinGecko API · làm mới 60s" : "Source: CoinGecko API · refresh 60s"}
            <ExternalLink className="w-3 h-3" />
            {dataUpdatedAt ? ` · ${new Date(dataUpdatedAt).toLocaleTimeString()}` : ""}
          </a>
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

export default Market3DUniverse;
