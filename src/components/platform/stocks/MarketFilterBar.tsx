import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  REGIONS,
  CAP_SIZES,
  SECTORS,
  type Region,
  type CapSize,
  type Sector,
} from "@/data/globalMarkets";

interface MarketFilterBarProps {
  region: "all" | Region;
  cap: "all" | CapSize;
  sector: "all" | Sector;
  search: string;
  totalCount: number;
  onRegion: (v: "all" | Region) => void;
  onCap: (v: "all" | CapSize) => void;
  onSector: (v: "all" | Sector) => void;
  onSearch: (v: string) => void;
}

function PillRow<T extends string>({
  options,
  value,
  onChange,
  renderLabel,
}: {
  options: { id: T; label: string; icon?: string; flag?: string }[];
  value: T;
  onChange: (v: T) => void;
  renderLabel?: (o: any) => string;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const active = value === o.id;
        const prefix = (o as any).flag || (o as any).icon || "";
        return (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            className={`px-2.5 py-1 text-[11px] rounded-full font-medium border transition-all ${
              active
                ? "bg-primary text-primary-foreground border-primary shadow-[0_0_18px_-6px_hsl(var(--primary))]"
                : "bg-muted/30 text-muted-foreground border-border/20 hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            {prefix && <span className="mr-1">{prefix}</span>}
            {renderLabel ? renderLabel(o) : o.label}
          </button>
        );
      })}
    </div>
  );
}

export function MarketFilterBar({
  region,
  cap,
  sector,
  search,
  totalCount,
  onRegion,
  onCap,
  onSector,
  onSearch,
}: MarketFilterBarProps) {
  return (
    <div className="quant-card space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-4 rounded-sm bg-primary" />
          <p className="text-xs font-semibold tracking-wide uppercase text-foreground/80">
            Global Market Coverage
          </p>
          <span className="text-[10px] text-muted-foreground font-mono bg-muted/40 px-1.5 py-0.5 rounded">
            {totalCount} symbols
          </span>
        </div>
        <div className="relative w-56">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Symbol or name..."
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="pl-8 h-8 text-xs bg-background border-border/30"
          />
          {search && (
            <button onClick={() => onSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2">
              <X className="w-3 h-3 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2 pt-1 border-t border-border/15">
        <div className="flex items-start gap-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 w-14 pt-1.5 shrink-0">
            Region
          </span>
          <PillRow options={REGIONS as any} value={region} onChange={onRegion as any} />
        </div>
        <div className="flex items-start gap-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 w-14 pt-1.5 shrink-0">
            Cap
          </span>
          <PillRow options={CAP_SIZES as any} value={cap} onChange={onCap as any} />
        </div>
        <div className="flex items-start gap-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 w-14 pt-1.5 shrink-0">
            Sector
          </span>
          <PillRow options={SECTORS as any} value={sector} onChange={onSector as any} />
        </div>
      </div>
    </div>
  );
}
