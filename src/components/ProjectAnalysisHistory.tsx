 import { useState } from "react";
 import { motion, AnimatePresence } from "framer-motion";
 import { Button } from "@/components/ui/button";
 import { SimulationCard } from "./SimulationCard";
 import { useProjectAnalysisHistory, AnalysisHistoryItem } from "@/hooks/useProjectAnalysisHistory";
 import { ProjectParams, ProjectResults } from "@/lib/projectModel";
 import { History, Trash2, Download, ChevronDown, ChevronUp, Save, Clock } from "lucide-react";
 import { formatDistanceToNow } from "date-fns";
 import { vi } from "date-fns/locale";
 
 interface ProjectAnalysisHistoryProps {
   currentParams: ProjectParams;
   currentResults: ProjectResults | null;
   aiAnalysis?: any;
   onLoadHistory: (params: ProjectParams, results: ProjectResults) => void;
 }
 
 export const ProjectAnalysisHistory = ({
   currentParams,
   currentResults,
   aiAnalysis,
   onLoadHistory
 }: ProjectAnalysisHistoryProps) => {
   const { history, loading, user, saveAnalysis, deleteAnalysis } = useProjectAnalysisHistory();
   const [isExpanded, setIsExpanded] = useState(false);
 
   const handleSave = async () => {
     if (!currentResults) {
       return;
     }
     await saveAnalysis(currentParams, currentResults, aiAnalysis);
   };
 
   const formatNumber = (num: number) => {
     return new Intl.NumberFormat("vi-VN").format(Math.round(num));
   };
 
   if (!user) {
     return (
       <SimulationCard>
         <div className="text-center py-4">
           <History className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
           <p className="text-sm text-muted-foreground">
             Đăng nhập để lưu và xem lịch sử phân tích
           </p>
         </div>
       </SimulationCard>
     );
   }
 
   return (
     <SimulationCard>
       <div className="space-y-4">
         <div className="flex items-center justify-between">
           <div className="flex items-center gap-2">
             <History className="w-5 h-5 text-primary" />
             <h3 className="font-semibold">Lịch sử phân tích</h3>
           </div>
           {currentResults && (
             <Button size="sm" variant="glow" onClick={handleSave}>
               <Save className="w-4 h-4 mr-2" />
               Lưu kết quả
             </Button>
           )}
         </div>
 
         <Button
           variant="ghost"
           className="w-full justify-between"
           onClick={() => setIsExpanded(!isExpanded)}
         >
           <span>{isExpanded ? "Thu gọn" : `Xem lịch sử (${history.length})`}</span>
           {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
         </Button>
 
         <AnimatePresence>
           {isExpanded && (
             <motion.div
               initial={{ opacity: 0, height: 0 }}
               animate={{ opacity: 1, height: "auto" }}
               exit={{ opacity: 0, height: 0 }}
               className="space-y-3 max-h-[400px] overflow-y-auto"
             >
               {loading ? (
                 <p className="text-sm text-center text-muted-foreground py-4">Đang tải...</p>
               ) : history.length === 0 ? (
                 <p className="text-sm text-center text-muted-foreground py-4">
                   Chưa có lịch sử phân tích nào
                 </p>
               ) : (
                 history.map((item) => (
                   <motion.div
                     key={item.id}
                     initial={{ opacity: 0, x: -20 }}
                     animate={{ opacity: 1, x: 0 }}
                     className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-2"
                   >
                     <div className="flex items-start justify-between">
                       <div className="flex-1">
                         <h4 className="font-medium">{item.project_name}</h4>
                         <div className="flex items-center gap-1 text-xs text-muted-foreground">
                           <Clock className="w-3 h-3" />
                           <span>
                             {formatDistanceToNow(new Date(item.created_at), {
                               addSuffix: true,
                               locale: vi
                             })}
                           </span>
                         </div>
                       </div>
                       <div className="flex gap-1">
                         <Button
                           size="sm"
                           variant="ghost"
                           onClick={() => onLoadHistory(item.params, item.results)}
                           title="Tải kết quả"
                         >
                           <Download className="w-4 h-4" />
                         </Button>
                         <Button
                           size="sm"
                           variant="ghost"
                           onClick={() => deleteAnalysis(item.id)}
                           className="text-destructive hover:text-destructive"
                           title="Xóa"
                         >
                           <Trash2 className="w-4 h-4" />
                         </Button>
                       </div>
                     </div>
                     <div className="text-xs text-muted-foreground grid grid-cols-2 gap-1">
                       <span>NPV: {formatNumber(item.results.npvTIPV)} tr</span>
                       <span>IRR: {(item.results.irrTIPV * 100).toFixed(2)}%</span>
                       <span>PI: {item.results.pi.toFixed(2)}</span>
                       <span>DPP: {item.results.dppTIPV.toFixed(1)} năm</span>
                     </div>
                     {item.ai_analysis && (
                       <div className="text-xs text-primary">
                         ✨ Có phân tích AI
                       </div>
                     )}
                   </motion.div>
                 ))
               )}
             </motion.div>
           )}
         </AnimatePresence>
       </div>
     </SimulationCard>
   );
 };