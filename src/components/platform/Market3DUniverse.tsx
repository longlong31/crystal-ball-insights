import { Suspense, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Float, Stars } from "@react-three/drei";
import * as THREE from "three";
import { Loader2, Boxes, RefreshCw } from "lucide-react";
import { useTopCryptoMarkets } from "@/hooks/useMarketData";
import { useLanguage } from "@/contexts/LanguageContext";

const UP = "#22c55e";
const DOWN = "#ef4444";

interface Node {
  symbol: string;
  cap: number;
  change: number;
  price: number;
  volume: number;
}

/** Pulsing market-cap pillar. Height = market cap, colour = 24h change. */
function Pillar({ node, index, total, maxCap }: { node: Node; index: number; total: number; maxCap: number }) {
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
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <cylinderGeometry args={[0.34, 0.34, h, 6]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 1.4 : 0.35 + intensity * 0.6}
          metalness={0.6}
          roughness={0.25}
          transparent
          opacity={0.92}
        />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.42, 0.62, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0.35} side={THREE.DoubleSide} />
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
  const { data, isLoading, isFetching, dataUpdatedAt } = useTopCryptoMarkets(12);

  const nodes: Node[] = useMemo(
    () =>
      (data ?? []).slice(0, 12).map((d) => ({
        symbol: d.symbol.toUpperCase(),
        cap: d.marketCap || 1,
        change: d.priceChangePercentage24h ?? 0,
        price: d.currentPrice,
        volume: d.totalVolume,
      })),
    [data],
  );

  const maxCap = Math.max(...nodes.map((n) => n.cap), 1);
  const breadth = nodes.length ? nodes.filter((n) => n.change >= 0).length / nodes.length : 0.5;
  const avgChange = nodes.length ? nodes.reduce((s, n) => s + n.change, 0) / nodes.length : 0;

  return (
    <div className="quant-card overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Boxes className="w-4 h-4 text-primary" />
          <div>
            <p className="stat-label">
              {language === "vi" ? "Vũ trụ thị trường 3D" : "3D Market Universe"}
            </p>
            <p className="text-[10px] text-muted-foreground font-mono">
              {language === "vi"
                ? "Chiều cao = vốn hoá · Màu = biến động 24h"
                : "Height = market cap · Colour = 24h change"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono">
          <span className={avgChange >= 0 ? "ticker-green" : "ticker-red"}>
            {language === "vi" ? "TB" : "AVG"} {avgChange >= 0 ? "+" : ""}{avgChange.toFixed(2)}%
          </span>
          <span className="text-muted-foreground">
            {language === "vi" ? "Tăng" : "Up"} {(breadth * 100).toFixed(0)}%
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
        <Canvas camera={{ position: [0, 6, 11], fov: 45 }} dpr={[1, 1.75]}>
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
              <Pillar key={n.symbol} node={n} index={i} total={nodes.length} maxCap={maxCap} />
            ))}
          </Suspense>
          <OrbitControls
            enablePan={false}
            enableDamping
            minDistance={7}
            maxDistance={20}
            maxPolarAngle={Math.PI / 2.1}
            autoRotate
            autoRotateSpeed={0.5}
          />
        </Canvas>
        <p className="absolute bottom-2 left-3 text-[10px] font-mono text-muted-foreground">
          {language === "vi" ? "Kéo để xoay · Cuộn để zoom" : "Drag to rotate · Scroll to zoom"}
          {dataUpdatedAt ? ` · ${new Date(dataUpdatedAt).toLocaleTimeString()}` : ""}
        </p>
      </div>
    </div>
  );
}

export default Market3DUniverse;
