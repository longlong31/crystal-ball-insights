 import { useState, useEffect } from "react";
 import { supabase } from "@/integrations/supabase/client";
 
 export interface NewsArticle {
   id: string;
   source: string;
   source_url: string | null;
   title: string;
   description: string | null;
   content: string | null;
   image_url: string | null;
   published_at: string | null;
   category: string;
   language: string;
   created_at: string;
 }
 
 export function useNewsArticles(category?: string, limit: number = 10) {
   const [articles, setArticles] = useState<NewsArticle[]>([]);
   const [loading, setLoading] = useState(true);
 
   useEffect(() => {
     fetchArticles();
   }, [category, limit]);
 
   const fetchArticles = async () => {
     setLoading(true);
     try {
       let query = supabase
         .from("news_articles")
         .select("*")
         .eq("is_active", true)
         .order("published_at", { ascending: false })
         .limit(limit);
 
       if (category) {
         query = query.eq("category", category);
       }
 
       const { data, error } = await query;
 
       if (error) throw error;
       setArticles(data || []);
     } catch (error) {
       console.error("Error fetching news:", error);
     } finally {
       setLoading(false);
     }
   };
 
   const refreshNews = async () => {
     try {
       const response = await fetch(
         `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-news`,
         {
           method: "POST",
           headers: {
             "Content-Type": "application/json",
             "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
           }
         }
       );
       const result = await response.json();
       if (result.success) {
         await fetchArticles();
       }
       return result;
     } catch (error) {
       console.error("Error refreshing news:", error);
       return { success: false, error };
     }
   };
 
   return { articles, loading, refreshNews, refetch: fetchArticles };
 }