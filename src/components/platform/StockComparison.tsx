import { useState, useMemo } from "react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, Loader2, BarChart3 } from "lucide-react";
import { useStockHistory, useStockQuote } from "@/hooks/useStockData";
import { useQueries } from "@tanstack/react-query";
import { PortfolioOptimizerPanel } from "./PortfolioOptimizerPanel";

const COLORS = [
  "hsl(var(--primary))",
  "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6",
  "#06b6d4", "#ec4899", "#f97316",
];

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function fetchHistoryRaw(symbol: string, range: string = "1y") {
  const resp = await fetch(`${SUPABASE_URL}/functions/v1/fetch-stock-data`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify({ type: "history", symbol, range }),
  });
  if (!resp.ok) throw new Error(`API error: ${resp.status}`);
  const result = await resp.json();
  if (result.error) throw new Error(result.error);
  return result.data;
}

interface StockComparisonProps {
  currentSymbol: string;
}

export function StockComparison({ currentSymbol }: StockComparisonProps) {
  const [symbols, setSymbols] = useState<string[]>([currentSymbol]);
  const [newSymbol, setNewSymbol] = useState("");

  const addSymbol = () => {
    const sym = newSymbol.trim().toUpperCase();
    if (sym && !symbols.includes(sym) && symbols.length < 8) {
      setSymbols([...symbols, sym]);
      setNewSymbol("");
    }
  };

  const removeSymbol = (sym: string) => {
    setSymbols(symbols.filter(s => s !== sym));
  };

  // Fetch all histories in parallel
  const historyQueries = useQueries({
    queries: symbols.map(sym => ({
      queryKey: ["stock-history-compare", sym, "1y"],
      queryFn: () => fetchHistoryRaw(sym, "1y"),
      staleTime: 300000,
      retry: 2,
    })),
  });

  const allLoaded = historyQueries.every(q => !q.isLoading);
  const anyLoading = historyQueries.some(q => q.isLoading);

  // Build normalized chart data (base 100)
  const { chartData, correlationMatrix } = useMemo(() => {
    if (!allLoaded) return { chartData: [], correlationMatrix: null };

    const validData: { symbol: string; dates: string[]; closes: number[]; returns: number[] }[] = [];

    symbols.forEach((sym, i) => {
      const data = historyQueries[i]?.data;
      if (data?.dates && data?.closes) {
        const closes = data.closes.filter((c: number) => c > 0);
        const returns = closes.slice(1).map((c: number, j: number) => (c - closes[j]) / closes[j]);
        validData.push({ symbol: sym, dates: data.dates, closes, returns });
      }
    });

    if (validData.length === 0) return { chartData: [], correlationMatrix: null };

    // Use shortest common date range
    const minLen = Math.min(...validData.map(d => d.closes.length));
    
    // Normalized price chart (base = 100)
    const chartData = Array.from({ length: minLen }, (_, i) => {
      const entry: Record<string, any> = {
        date: validData[0]?.dates[validData[0].dates.length - minLen + i] || i,
      };
      validData.forEach(d => {
        const offset = d.closes.length - minLen;
        const basePrice = d.closes[offset];
        entry[d.symbol] = basePrice > 0 ? (d.closes[offset + i] / basePrice) * 100 : 100;
      });
      return entry;
    });

    // Correlation matrix
    let correlationMatrix: { labels: string[]; matrix: number[][] } | null = null;
    if (validData.length >= 2) {
      const minRetLen = Math.min(...validData.map(d => d.returns.length));
      const labels = validData.map(d => d.symbol);
      const matrix = labels.map((_, i) =>
        labels.map((_, j) => {
          if (i === j) return 1;
          const ri = validData[i].returns.slice(-minRetLen);
          const rj = validData[j].returns.slice(-minRetLen);
          return pearsonCorrelation(ri, rj);
        })
      );
      correlationMatrix = { labels, matrix };
    }

    return { chartData, correlationMatrix };
  }, [allLoaded, symbols, historyQueries]);

  return (
    <div className="space-y-4">
      {/* Symbol selector */}
      <div className="flex flex-wrap items-center gap-2">
        {symbols.map((sym, i) => (
          <span key={sym} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-medium border border-border/30 bg-card">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
            {sym}
            <button onClick={() => removeSymbol(sym)} className="ml-1 text-muted-foreground hover:text-destructive">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <form onSubmit={(e) => { e.preventDefault(); addSymbol(); }} className="flex items-center gap-1">
          <Input
            placeholder="Thêm mã (VD: AAPL)"
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value)}
            className="h-8 w-40 text-xs font-mono bg-card border-border/30"
          />
          <Button type="submit" size="sm" variant="outline" disabled={!newSymbol.trim() || symbols.length >= 8}>
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </form>
        {anyLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
      </div>

      {/* Normalized price chart */}
      {chartData.length > 0 && (
        <div className="quant-card">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Hiệu suất tương đối (Base = 100)
          </h3>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v?.slice(5) || ''} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }}
                formatter={(value: number) => `${value.toFixed(2)}`}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {symbols.map((sym, i) => (
                <Line
                  key={sym}
                  type="monotone"
                  dataKey={sym}
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth={1.5}
                  dot={false}
                  name={sym}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Correlation Matrix */}
      {correlationMatrix && correlationMatrix.labels.length >= 2 && (
        <div className="quant-card">
          <h3 className="text-sm font-semibold mb-3">Ma trận tương quan (Correlation Matrix)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="p-2 text-left font-mono text-muted-foreground"></th>
                  {correlationMatrix.labels.map(l => (
                    <th key={l} className="p-2 text-center font-mono font-medium">{l}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {correlationMatrix.labels.map((row, i) => (
                  <tr key={row}>
                    <td className="p-2 font-mono font-medium">{row}</td>
                    {correlationMatrix!.matrix[i].map((corr, j) => (
                      <td key={j} className="p-2 text-center font-mono" style={{
                        backgroundColor: getCorrelationColor(corr),
                        color: Math.abs(corr) > 0.6 ? 'white' : 'inherit',
                        borderRadius: 4,
                      }}>
                        {corr.toFixed(3)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            Giá trị gần +1: tương quan dương mạnh · Gần -1: tương quan âm mạnh · Gần 0: không tương quan
          </p>
        </div>
      )}

      {symbols.length < 2 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Thêm ít nhất 2 mã cổ phiếu để so sánh hiệu suất và tính ma trận tương quan.
        </div>
      )}
    </div>
  );
}

function pearsonCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 2) return 0;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += x[i]; sumY += y[i];
    sumXY += x[i] * y[i];
    sumX2 += x[i] * x[i]; sumY2 += y[i] * y[i];
  }
  const denom = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  return denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
}

function getCorrelationColor(corr: number): string {
  const abs = Math.abs(corr);
  if (corr > 0) {
    if (abs > 0.7) return "hsl(142, 76%, 36%)";
    if (abs > 0.4) return "hsl(142, 50%, 50%, 0.5)";
    return "hsl(142, 40%, 60%, 0.2)";
  } else {
    if (abs > 0.7) return "hsl(0, 84%, 40%)";
    if (abs > 0.4) return "hsl(0, 60%, 55%, 0.5)";
    return "hsl(0, 40%, 60%, 0.2)";
  }
}
