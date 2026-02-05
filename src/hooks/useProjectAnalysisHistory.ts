 import { useState, useEffect, useCallback } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { ProjectParams, ProjectResults } from "@/lib/projectModel";
 import { toast } from "sonner";
 
 export interface AnalysisHistoryItem {
   id: string;
   project_name: string;
   params: ProjectParams;
   results: ProjectResults;
   ai_analysis: any;
   created_at: string;
 }
 
 export function useProjectAnalysisHistory() {
   const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
   const [loading, setLoading] = useState(false);
   const [user, setUser] = useState<any>(null);
 
   useEffect(() => {
     const checkUser = async () => {
       const { data: { user } } = await supabase.auth.getUser();
       setUser(user);
       if (user) {
         fetchHistory();
       }
     };
     checkUser();
 
     const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
       setUser(session?.user ?? null);
       if (session?.user) {
         fetchHistory();
       } else {
         setHistory([]);
       }
     });
 
     return () => subscription.unsubscribe();
   }, []);
 
   const fetchHistory = async () => {
     setLoading(true);
     try {
       const { data, error } = await supabase
         .from("project_analysis_history")
         .select("*")
         .order("created_at", { ascending: false })
         .limit(20);
 
       if (error) throw error;
       
       // Type assertion to handle JSONB columns
       const typedData = (data || []).map(item => ({
         id: item.id,
         project_name: item.project_name,
         params: item.params as unknown as ProjectParams,
         results: item.results as unknown as ProjectResults,
         ai_analysis: item.ai_analysis,
         created_at: item.created_at
       }));
       
       setHistory(typedData);
     } catch (error) {
       console.error("Error fetching history:", error);
     } finally {
       setLoading(false);
     }
   };
 
   const saveAnalysis = useCallback(async (
     params: ProjectParams,
     results: ProjectResults,
     aiAnalysis?: any
   ) => {
     if (!user) {
       toast.error("Vui lòng đăng nhập để lưu lịch sử phân tích");
       return null;
     }
 
     try {
       const { data, error } = await supabase
         .from("project_analysis_history")
         .insert({
           user_id: user.id,
           project_name: params.projectName,
           params: params as any,
           results: results as any,
           ai_analysis: aiAnalysis
         })
         .select()
         .single();
 
       if (error) throw error;
 
       toast.success("Đã lưu kết quả phân tích");
       fetchHistory();
       return data;
     } catch (error: any) {
       console.error("Error saving analysis:", error);
       toast.error("Không thể lưu kết quả phân tích");
       return null;
     }
   }, [user]);
 
   const deleteAnalysis = useCallback(async (id: string) => {
     try {
       const { error } = await supabase
         .from("project_analysis_history")
         .delete()
         .eq("id", id);
 
       if (error) throw error;
 
       toast.success("Đã xóa kết quả phân tích");
       fetchHistory();
     } catch (error) {
       console.error("Error deleting analysis:", error);
       toast.error("Không thể xóa kết quả phân tích");
     }
   }, []);
 
   return {
     history,
     loading,
     user,
     saveAnalysis,
     deleteAnalysis,
     refetch: fetchHistory
   };
 }