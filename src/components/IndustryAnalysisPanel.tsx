import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Factory, Building2, Cpu, Zap, ShoppingBag, Truck, HeartPulse, Sprout,
  Info, TrendingUp, TrendingDown, Minus, Layers, Check
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useLanguage } from "@/contexts/LanguageContext";
import { ProjectParams, ProjectResults } from "@/lib/projectModel";
import {
  IndustryKey, IndustryKPI, industryProfiles, getIndustryProfile,
  applyIndustryPreset, industryHurdleRate,
} from "@/lib/industryProfiles";

const iconMap: Record<string, any> = {
  Factory, Building2, Cpu, Zap, ShoppingBag, Truck, HeartPulse, Sprout,
};

const fmt = (v: number, unit: IndustryKPI["unit"]) => {
  if (!Number.isFinite(v)) return "—";
  switch (unit) {
    case "%": return `${v.toFixed(1)}%`;
    case "x": return `${v.toFixed(2)}x`;
    case "years": return `${v.toFixed(1)}`;
    case "money":
      return v >= 1000 ? v.toLocaleString("vi-VN", { maximumFractionDigits: 0 })
        : v.toFixed(v < 1 ? 4 : 2);
    default: return v.toLocaleString("vi-VN", { maximumFractionDigits: 1 });
  }
};

const statusOf = (k: IndustryKPI) => {
  const ok = k.higherIsBetter ? k.value >= k.benchmark : k.value <= k.benchmark;
  const near = k.higherIsBetter
    ? k.value >= k.benchmark * 0.8
    : k.value <= k.benchmark * 1.2;
  return ok ? "good" : near ? "warn" : "bad";
};

interface Props {
  params: ProjectParams;
  results: ProjectResults | null;
  onApplyPreset: (params: ProjectParams) => void;
}

export const IndustryAnalysisPanel = ({ params, results, onApplyPreset }: Props) => {
  const { language } = useLanguage();
  const vi = language === "vi";
  const [industry, setIndustry] = useState<IndustryKey>("manufacturing");
  const [open, setOpen] = useState(true);

  const profile = getIndustryProfile(industry);
  const kpis = useMemo(
    () => (results ? profile.kpis(params, results) : []),
    [profile, params, results]
  );

  const score = useMemo(() => {
    if (!kpis.length) return 0;
    const pts = kpis.map((k) => {
      const s = statusOf(k);
      return s === "good" ? 100 : s === "warn" ? 60 : 25;
    });
    return Math.round(pts.reduce((a, b) => a + b, 0) / pts.length);
  }, [kpis]);

  const hurdle = results ? industryHurdleRate(industry, results.waccAverage) : null;

  return (
    <Card className="p-5 border-border/40 bg-card/70 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Layers className="w-4 h-4 text-primary" />
            <h3 className="font-semibold">
              {vi ? "Phân tích chuyên sâu theo ngành" : "Industry Deep-Dive Analysis"}
            </h3>
          </div>
          <p className="text-xs text-muted-foreground">
            {vi
              ? "Chọn ngành để nạp bộ tham số chuẩn và xem các chỉ số đặc thù kèm ngưỡng chuẩn ngành."
              : "Pick an industry to load benchmark parameters and view sector-specific KPIs."}
          </p>
        </div>
        {results && (
          <div className="text-right shrink-0">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {vi ? "Điểm ngành" : "Sector score"}
            </div>
            <div className="text-2xl font-bold font-mono text-primary">{score}</div>
          </div>
        )}
      </div>

      {/* Industry picker */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        {industryProfiles.map((p) => {
          const Icon = iconMap[p.icon] ?? Factory;
          const active = p.key === industry;
          return (
            <motion.button
              key={p.key}
              whileHover={{ y: -2 }}
              onClick={() => setIndustry(p.key)}
              className={`relative flex flex-col items-start gap-1.5 rounded-lg border p-2.5 text-left transition-all ${
                active
                  ? "border-primary/60 bg-primary/10"
                  : "border-border/40 bg-muted/20 hover:border-primary/30"
              }`}
            >
              <Icon className="w-4 h-4" style={{ color: p.color }} />
              <span className="text-[11px] font-medium leading-tight">
                {vi ? p.nameVi : p.nameEn}
              </span>
              {active && <Check className="absolute top-2 right-2 w-3 h-3 text-primary" />}
            </motion.button>
          );
        })}
      </div>

      {/* Profile summary */}
      <div className="rounded-lg border border-border/40 bg-muted/20 p-3 mb-4">
        <p className="text-xs text-muted-foreground mb-2">
          {vi ? profile.descVi : profile.descEn}
        </p>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Badge variant="outline" className="text-[10px] font-mono">
            {vi ? "Phần bù rủi ro" : "Risk premium"}: +{profile.riskPremium}%
          </Badge>
          {hurdle !== null && (
            <Badge variant="outline" className="text-[10px] font-mono">
              {vi ? "Ngưỡng chấp nhận" : "Hurdle rate"}: {hurdle.toFixed(1)}%
            </Badge>
          )}
          {results && (
            <Badge
              variant="outline"
              className={`text-[10px] font-mono ${
                hurdle !== null && results.irrTIPV * 100 >= hurdle
                  ? "text-[hsl(var(--quant-green))] border-[hsl(var(--quant-green))]/40"
                  : "text-[hsl(var(--quant-amber))] border-[hsl(var(--quant-amber))]/40"
              }`}
            >
              IRR {(results.irrTIPV * 100).toFixed(1)}%
            </Badge>
          )}
        </div>
        <ul className="space-y-1 mb-3">
          {profile.drivers.map((d, i) => (
            <li key={i} className="text-[11px] text-muted-foreground flex gap-2">
              <span className="text-primary">▹</span>
              {vi ? d.vi : d.en}
            </li>
          ))}
        </ul>
        <Button
          size="sm"
          variant="outline"
          className="w-full text-xs"
          onClick={() => onApplyPreset(applyIndustryPreset(industry))}
        >
          {vi ? "Nạp bộ tham số mẫu của ngành" : "Load industry preset parameters"}
        </Button>
      </div>

      {/* KPIs */}
      {!results ? (
        <div className="rounded-lg border border-dashed border-border/50 p-6 text-center text-xs text-muted-foreground">
          {vi
            ? "Bấm “Tính toán” để xem các chỉ số đặc thù của ngành."
            : "Run “Calculate” to see sector-specific KPIs."}
        </div>
      ) : (
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between text-xs font-medium text-muted-foreground mb-2 hover:text-foreground">
              <span>{vi ? "Chỉ số đặc thù ngành" : "Sector KPIs"} ({kpis.length})</span>
              <span>{open ? "−" : "+"}</span>
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <TooltipProvider delayDuration={150}>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {kpis.map((k) => {
                  const s = statusOf(k);
                  const color =
                    s === "good" ? "hsl(var(--quant-green))"
                      : s === "warn" ? "hsl(var(--quant-amber))"
                        : "hsl(var(--destructive))";
                  const Arrow = s === "good" ? TrendingUp : s === "warn" ? Minus : TrendingDown;
                  return (
                    <div
                      key={k.key}
                      className="rounded-lg border border-border/40 bg-muted/20 p-3"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-[11px] text-muted-foreground leading-tight">
                          {vi ? k.labelVi : k.labelEn}
                        </span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button aria-label="info">
                              <Info className="w-3 h-3 text-muted-foreground/60 hover:text-primary" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[260px]">
                            <p className="text-xs mb-1">{vi ? k.descVi : k.descEn}</p>
                            <p className="text-[10px] font-mono text-muted-foreground">
                              {k.formula}
                            </p>
                            <p className="text-[10px] mt-1 text-muted-foreground">
                              {vi ? "Chuẩn ngành" : "Benchmark"}: {k.higherIsBetter ? "≥" : "≤"}{" "}
                              {fmt(k.benchmark, k.unit)}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="flex items-end justify-between">
                        <span className="text-lg font-bold font-mono" style={{ color }}>
                          {fmt(k.value, k.unit)}
                        </span>
                        <Arrow className="w-3.5 h-3.5" style={{ color }} />
                      </div>
                      <div className="mt-2 h-1 rounded-full bg-border/40 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, Math.max(4,
                              k.higherIsBetter
                                ? (k.value / (k.benchmark || 1)) * 70
                                : (k.benchmark / (k.value || 1)) * 70))}%`,
                            backgroundColor: color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </TooltipProvider>
          </CollapsibleContent>
        </Collapsible>
      )}
    </Card>
  );
};
