import { useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { Plus, X, Loader2, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PortfolioOptimizerPanel } from "@/components/platform/PortfolioOptimizerPanel";
import { toast } from "sonner";

interface StockHistoryResp {
  closes: number[];
}

async function fetchHistory(symbol: string): Promise<StockHistoryResp> {
  const { supabase } = await import("@/integrations/supabase/client");
  const { data, error } = await supabase.functions.invoke("fetch-stock-data", {
    body: { type: "history", symbol, range: "1y" },
  });
  if (error) throw error;
  return data as StockHistoryResp;
}

function closesToReturns(closes: number[]): number[] {
  const r: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    if (closes[i - 1] > 0) r.push((closes[i] - closes[i - 1]) / closes[i - 1]);
  }
  return r;
}

interface Props {
  initialSymbols?: string[];
}

export function PortfolioLabInline({ initialSymbols = [] }: Props) {
  const [symbols, setSymbols] = useState<string[]>(initialSymbols);
  const [input, setInput] = useState("");

  const queries = useQueries({
    queries: symbols.map((s) => ({
      queryKey: ["portfolio-history", s],
      queryFn: () => fetchHistory(s),
      staleTime: 300_000,
      retry: 1,
    })),
  });

  const loading = queries.some((q) => q.isLoading);
  const ready = symbols.length >= 2 && queries.every((q) => q.data && (q.data as StockHistoryResp).closes?.length > 5);

  const assetsData = ready
    ? symbols.map((s, i) => {
        const closes = (queries[i].data as StockHistoryResp).closes;
        return { symbol: s, returns: closesToReturns(closes), closes };
      })
    : [];

  const addSymbol = () => {
    const sym = input.trim().toUpperCase();
    if (!sym) return;
    if (symbols.includes(sym)) {
      toast.warning(`${sym} đã có trong danh mục`);
      return;
    }
    if (symbols.length >= 10) {
      toast.warning("Tối đa 10 mã");
      return;
    }
    setSymbols([...symbols, sym]);
    setInput("");
  };

  const removeSymbol = (s: string) => setSymbols(symbols.filter((x) => x !== s));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="quant-card">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold flex items-center gap-2">
              Portfolio Lab
              <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/30">
                INLINE
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground font-mono">
              Efficient Frontier · Max Sharpe · Min Vol · Correlation · Monte Carlo
            </div>
          </div>
        </div>

        {/* Input */}
        <div className="flex gap-2 mb-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addSymbol()}
            placeholder="Nhập mã (ví dụ: AAPL, VNM.VN, 7203.T)..."
            className="font-mono text-xs h-9"
          />
          <Button onClick={addSymbol} size="sm" disabled={symbols.length >= 10}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Thêm
          </Button>
        </div>

        {/* Pills */}
        <div className="flex flex-wrap gap-2">
          {symbols.length === 0 && (
            <div className="text-[11px] text-muted-foreground italic">
              Thêm ít nhất 2 mã để chạy optimization
            </div>
          )}
          {symbols.map((s, i) => {
            const q = queries[i];
            return (
              <div
                key={s}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px] font-mono ${
                  q?.isError
                    ? "border-destructive/40 bg-destructive/10 text-destructive"
                    : q?.isLoading
                    ? "border-amber-500/40 bg-amber-500/10 text-amber-500"
                    : "border-primary/40 bg-primary/10 text-primary"
                }`}
              >
                {q?.isLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                {s}
                <button onClick={() => removeSymbol(s)} className="hover:text-foreground">
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>

        {symbols.length === 1 && (
          <div className="mt-3 text-[11px] text-amber-500/80">
            ⚠ Cần tối thiểu 2 mã để tính Efficient Frontier
          </div>
        )}
      </div>

      {/* Optimizer */}
      {loading && symbols.length >= 2 && (
        <div className="quant-card text-center py-10 text-xs text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
          Đang tải dữ liệu lịch sử {symbols.length} mã...
        </div>
      )}

      {ready && <PortfolioOptimizerPanel symbols={symbols} assetsData={assetsData} />}
    </div>
  );
}
