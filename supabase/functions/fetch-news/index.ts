 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
 };
 
 // Free news sources (RSS feeds converted to JSON)
 const NEWS_SOURCES = [
   {
     name: "VnExpress",
     url: "https://vnexpress.net/rss/tin-moi-nhat.rss",
     category: "news",
     language: "vi"
   },
   {
     name: "Tuổi Trẻ",
     url: "https://tuoitre.vn/rss/tin-moi-nhat.rss",
     category: "news",
     language: "vi"
   },
   {
     name: "Dân Trí",
     url: "https://dantri.com.vn/rss/home.rss",
     category: "news",
     language: "vi"
   }
 ];
 
 interface NewsItem {
   source: string;
   source_url: string;
   title: string;
   description: string;
   content: string;
   image_url: string | null;
   published_at: string;
   category: string;
   language: string;
 }
 
 function parseRSSItem(item: string, source: string, category: string, language: string): NewsItem | null {
   try {
     const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/s);
     const linkMatch = item.match(/<link>(.*?)<\/link>/);
     const descMatch = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/s);
     const pubDateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/);
     const imageMatch = item.match(/<enclosure[^>]*url="([^"]*)"[^>]*type="image/);
 
     const title = titleMatch ? (titleMatch[1] || titleMatch[2])?.trim() : null;
     const link = linkMatch ? linkMatch[1]?.trim() : null;
     const description = descMatch ? (descMatch[1] || descMatch[2])?.replace(/<[^>]*>/g, "").trim() : "";
 
     if (!title || !link) return null;
 
     return {
       source,
       source_url: link,
       title,
       description: description.substring(0, 500),
       content: description,
       image_url: imageMatch ? imageMatch[1] : null,
       published_at: pubDateMatch ? new Date(pubDateMatch[1]).toISOString() : new Date().toISOString(),
       category,
       language
     };
   } catch {
     return null;
   }
 }
 
 async function fetchRSSFeed(source: typeof NEWS_SOURCES[0]): Promise<NewsItem[]> {
   try {
     const response = await fetch(source.url, {
       headers: {
         "User-Agent": "Mozilla/5.0 (compatible; CrystalBall/1.0)"
       }
     });
 
     if (!response.ok) {
       console.error(`Failed to fetch ${source.name}: ${response.status}`);
       return [];
     }
 
     const xml = await response.text();
     const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];
 
     return items
       .slice(0, 5) // Get 5 items per source
       .map(item => parseRSSItem(item, source.name, source.category, source.language))
       .filter((item): item is NewsItem => item !== null);
   } catch (error) {
     console.error(`Error fetching ${source.name}:`, error);
     return [];
   }
 }
 
 serve(async (req) => {
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
     const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
     const supabase = createClient(supabaseUrl, supabaseKey);
 
     // Fetch news from all sources in parallel
     const allNewsPromises = NEWS_SOURCES.map(fetchRSSFeed);
     const allNewsArrays = await Promise.all(allNewsPromises);
     const allNews = allNewsArrays.flat();
 
     if (allNews.length === 0) {
       return new Response(
         JSON.stringify({ success: false, message: "No news fetched" }),
         { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
       );
     }
 
     // Check for duplicates by source_url
     const existingUrls = new Set<string>();
     const { data: existing } = await supabase
       .from("news_articles")
       .select("source_url")
       .in("source_url", allNews.map(n => n.source_url));
 
     if (existing) {
       existing.forEach(e => existingUrls.add(e.source_url));
     }
 
     // Filter out duplicates
     const newArticles = allNews.filter(n => !existingUrls.has(n.source_url));
 
     if (newArticles.length === 0) {
       return new Response(
         JSON.stringify({ success: true, message: "No new articles", inserted: 0 }),
         { headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     // Insert new articles
     const { data, error } = await supabase
       .from("news_articles")
       .insert(newArticles)
       .select();
 
     if (error) {
       console.error("Insert error:", error);
       throw error;
     }
 
     return new Response(
       JSON.stringify({ 
         success: true, 
         message: `Inserted ${data?.length || 0} new articles`,
         inserted: data?.length || 0
       }),
       { headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   } catch (error) {
     const errorMessage = error instanceof Error ? error.message : "Unknown error";
     console.error("Error:", errorMessage);
     return new Response(
       JSON.stringify({ success: false, error: errorMessage }),
       { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
     );
   }
 });