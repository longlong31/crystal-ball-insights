 import { motion } from "framer-motion";
 import { Card, CardContent } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Skeleton } from "@/components/ui/skeleton";
 import { useNewsArticles, NewsArticle } from "@/hooks/useNewsArticles";
 import { ExternalLink, Newspaper, RefreshCw, Clock } from "lucide-react";
 import { formatDistanceToNow } from "date-fns";
 import { vi } from "date-fns/locale";
 import { toast } from "sonner";
 import { useState } from "react";
 
 export const NewsFeed = () => {
   const { articles, loading, refreshNews } = useNewsArticles("news", 15);
   const [refreshing, setRefreshing] = useState(false);
 
   const handleRefresh = async () => {
     setRefreshing(true);
     const result = await refreshNews();
     if (result.success) {
       toast.success(`Đã cập nhật ${result.inserted || 0} bài viết mới`);
     } else {
       toast.error("Không thể cập nhật tin tức");
     }
     setRefreshing(false);
   };
 
   if (loading) {
     return (
       <div className="space-y-4">
         {[1, 2, 3].map((i) => (
           <Card key={i} className="bg-card/50 border-border/50">
             <CardContent className="p-4">
               <Skeleton className="h-5 w-3/4 mb-2" />
               <Skeleton className="h-4 w-full mb-2" />
               <Skeleton className="h-4 w-1/2" />
             </CardContent>
           </Card>
         ))}
       </div>
     );
   }
 
   if (articles.length === 0) {
     return (
       <Card className="bg-card/50 border-border/50">
         <CardContent className="py-12 text-center">
           <Newspaper className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
           <h3 className="text-lg font-medium mb-2">Chưa có tin tức</h3>
           <p className="text-muted-foreground mb-4">
             Nhấn nút bên dưới để tải tin tức mới nhất
           </p>
           <Button onClick={handleRefresh} disabled={refreshing}>
             <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
             Tải tin tức
           </Button>
         </CardContent>
       </Card>
     );
   }
 
   return (
     <div className="space-y-4">
       <div className="flex justify-between items-center">
         <h3 className="text-lg font-semibold flex items-center gap-2">
           <Newspaper className="w-5 h-5 text-primary" />
           Tin tức mới nhất
         </h3>
         <Button 
           variant="outline" 
           size="sm" 
           onClick={handleRefresh} 
           disabled={refreshing}
         >
           <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
           Cập nhật
         </Button>
       </div>
 
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
         {articles.map((article, index) => (
           <motion.div
             key={article.id}
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: index * 0.05 }}
           >
             <Card className="bg-card/50 border-border/50 hover:border-primary/50 transition-all h-full">
               <CardContent className="p-4 flex flex-col h-full">
                 {article.image_url && (
                   <div className="w-full h-32 rounded-lg overflow-hidden mb-3 bg-muted">
                     <img 
                       src={article.image_url} 
                       alt={article.title}
                       className="w-full h-full object-cover"
                       onError={(e) => {
                         (e.target as HTMLImageElement).style.display = "none";
                       }}
                     />
                   </div>
                 )}
                 
                 <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                   <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">
                     {article.source}
                   </span>
                   {article.published_at && (
                     <span className="flex items-center gap-1">
                       <Clock className="w-3 h-3" />
                       {formatDistanceToNow(new Date(article.published_at), {
                         addSuffix: true,
                         locale: vi
                       })}
                     </span>
                   )}
                 </div>
 
                 <h4 className="font-medium text-sm mb-2 line-clamp-2 flex-grow">
                   {article.title}
                 </h4>
 
                 {article.description && (
                   <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                     {article.description}
                   </p>
                 )}
 
                 {article.source_url && (
                   <a
                     href={article.source_url}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-auto"
                   >
                     Đọc tiếp <ExternalLink className="w-3 h-3" />
                   </a>
                 )}
               </CardContent>
             </Card>
           </motion.div>
         ))}
       </div>
     </div>
   );
 };