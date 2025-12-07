import { motion } from "framer-motion";
import { SensitivityResult, TornadoData } from "@/lib/sensitivityAnalysis";
import { SimulationCard } from "./SimulationCard";
import { BarChart3, TrendingUp, TrendingDown } from "lucide-react";

interface SensitivityChartProps {
  results: SensitivityResult[];
  tornadoData?: TornadoData[];
}

export const SensitivityChart = ({ results, tornadoData }: SensitivityChartProps) => {
  const maxContribution = Math.max(...results.map(r => r.contribution), 1);

  if (results.length === 0) {
    return (
      <SimulationCard>
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Phân tích độ nhạy</h3>
        </div>
        <div className="h-40 flex items-center justify-center text-muted-foreground">
          Thêm biến và chạy phân tích để xem kết quả
        </div>
      </SimulationCard>
    );
  }

  return (
    <SimulationCard glowing>
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Phân tích độ nhạy</h3>
      </div>

      {/* Contribution Chart */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-muted-foreground">
          Đóng góp vào phương sai đầu ra (%)
        </h4>
        
        <div className="space-y-3">
          {results.map((result, index) => (
            <motion.div
              key={result.variableId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="space-y-1"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">
                    {result.rank}
                  </span>
                  {result.variableName}
                </span>
                <span className="font-mono text-muted-foreground">
                  {result.contribution.toFixed(1)}%
                </span>
              </div>
              
              <div className="h-6 bg-muted/30 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(result.contribution / maxContribution) * 100}%` }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`h-full rounded-full ${
                    result.correlation >= 0 
                      ? 'bg-gradient-to-r from-primary/50 to-primary' 
                      : 'bg-gradient-to-r from-destructive/50 to-destructive'
                  }`}
                />
              </div>
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {result.correlation >= 0 ? (
                  <TrendingUp className="w-3 h-3 text-success" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-destructive" />
                )}
                <span>
                  Tương quan: {result.correlation >= 0 ? '+' : ''}{result.correlation.toFixed(3)}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Tornado Chart */}
      {tornadoData && tornadoData.length > 0 && (
        <div className="mt-8 pt-6 border-t border-border">
          <h4 className="text-sm font-medium text-muted-foreground mb-4">
            Biểu đồ Tornado (±10%)
          </h4>
          
          <div className="space-y-3">
            {tornadoData.slice(0, 5).map((item, index) => {
              const maxSwing = Math.max(...tornadoData.map(t => t.swing));
              const lowOffset = item.baseOutput - Math.min(item.lowOutput, item.highOutput);
              const highOffset = Math.max(item.lowOutput, item.highOutput) - item.baseOutput;
              const totalRange = lowOffset + highOffset;
              const leftPercent = (lowOffset / maxSwing) * 50;
              const rightPercent = (highOffset / maxSwing) * 50;

              return (
                <motion.div
                  key={item.variableId}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="space-y-1"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.variableName}</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      Swing: {item.swing.toLocaleString('vi-VN', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  
                  <div className="h-5 bg-muted/20 rounded relative flex items-center">
                    {/* Center line */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-foreground/30" />
                    
                    {/* Left bar (decrease) */}
                    <div 
                      className="absolute h-full rounded-l bg-destructive/70"
                      style={{ 
                        right: '50%', 
                        width: `${leftPercent}%` 
                      }}
                    />
                    
                    {/* Right bar (increase) */}
                    <div 
                      className="absolute h-full rounded-r bg-success/70"
                      style={{ 
                        left: '50%', 
                        width: `${rightPercent}%` 
                      }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-6 mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-destructive/70" />
              <span>Giảm 10%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-success/70" />
              <span>Tăng 10%</span>
            </div>
          </div>
        </div>
      )}
    </SimulationCard>
  );
};
