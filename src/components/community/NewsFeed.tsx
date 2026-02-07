import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNewsArticles, NewsArticle } from "@/hooks/useNewsArticles";
import { useNewsRealtime } from "@/hooks/useNewsRealtime";
import { ExternalLink, Newspaper, RefreshCw, Clock, Search, Filter, X, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDistanceToNow, subDays, subWeeks, subMonths, isAfter } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";
import { useState, useMemo, useCallback } from "react";

type TimeFilter = "all" | "today" | "week" | "month";
const ITEMS_PER_PAGE = 9;

export const NewsFeed = ({ category = "news" }: { category?: string }) => {
  const { articles, loading, refreshNews, refetch } = useNewsArticles(category, 100);
  
  // Realtime subscription for new articles
  const handleNewArticle = useCallback(() => {
    refetch();
  }, [refetch]);

  useNewsRealtime({
    onNewArticle: handleNewArticle,
    category,
    enabled: true,
  });

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Get unique sources from articles
  const sources = useMemo(() => {
    const uniqueSources = [...new Set(articles.map(a => a.source))];
    return uniqueSources.sort();
  }, [articles]);

  // Filter articles based on search, source, and time
  const filteredArticles = useMemo(() => {
    return articles.filter(article => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = article.title.toLowerCase().includes(query);
        const matchesDescription = article.description?.toLowerCase().includes(query);
        const matchesContent = article.content?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDescription && !matchesContent) {
          return false;
        }
      }

      // Source filter
      if (sourceFilter !== "all" && article.source !== sourceFilter) {
        return false;
      }

      // Time filter
      if (timeFilter !== "all" && article.published_at) {
        const publishedDate = new Date(article.published_at);
        const now = new Date();
        let cutoffDate: Date;

        switch (timeFilter) {
          case "today":
            cutoffDate = subDays(now, 1);
            break;
          case "week":
            cutoffDate = subWeeks(now, 1);
            break;
          case "month":
            cutoffDate = subMonths(now, 1);
            break;
          default:
            cutoffDate = new Date(0);
        }

        if (!isAfter(publishedDate, cutoffDate)) {
          return false;
        }
      }

      return true;
    });
  }, [articles, searchQuery, sourceFilter, timeFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredArticles.length / ITEMS_PER_PAGE);
  const paginatedArticles = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredArticles.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredArticles, currentPage]);

  // Reset to page 1 when filters change
  const hasActiveFilters = searchQuery || sourceFilter !== "all" || timeFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setSourceFilter("all");
    setTimeFilter("all");
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

  const getTitle = () => {
    switch (category) {
      case "event": return "Sự kiện mới nhất";
      case "blog": return "Blog mới nhất";
      default: return "Tin tức mới nhất";
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-primary" />
          {getTitle()}
          <span className="text-sm font-normal text-muted-foreground">
            ({filteredArticles.length}/{articles.length})
          </span>
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

      {/* Search and Filters */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo từ khóa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Source Filter */}
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Nguồn" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả nguồn</SelectItem>
                {sources.map(source => (
                  <SelectItem key={source} value={source}>
                    {source}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Time Filter */}
            <Select value={timeFilter} onValueChange={(v) => setTimeFilter(v as TimeFilter)}>
              <SelectTrigger className="w-full md:w-36">
                <SelectValue placeholder="Thời gian" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Mọi lúc</SelectItem>
                <SelectItem value="today">Hôm nay</SelectItem>
                <SelectItem value="week">Tuần này</SelectItem>
                <SelectItem value="month">Tháng này</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button variant="ghost" size="icon" onClick={clearFilters} title="Xóa bộ lọc">
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {hasActiveFilters && (
            <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
              <Filter className="w-4 h-4" />
              <span>
                Đang hiển thị {filteredArticles.length} kết quả
                {searchQuery && ` cho "${searchQuery}"`}
                {sourceFilter !== "all" && ` từ ${sourceFilter}`}
                {timeFilter !== "all" && ` trong ${timeFilter === "today" ? "hôm nay" : timeFilter === "week" ? "tuần này" : "tháng này"}`}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Articles Grid */}
      {filteredArticles.length === 0 ? (
        <Card className="bg-card/50 border-border/50">
          <CardContent className="py-8 text-center">
            <Search className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <h4 className="font-medium mb-1">Không tìm thấy kết quả</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Thử thay đổi từ khóa hoặc bộ lọc
            </p>
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Xóa bộ lọc
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {paginatedArticles.map((article, index) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Trước
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    // Show first, last, current, and adjacent pages
                    return page === 1 || 
                           page === totalPages || 
                           Math.abs(page - currentPage) <= 1;
                  })
                  .map((page, index, array) => {
                    // Add ellipsis if there's a gap
                    const showEllipsisBefore = index > 0 && page - array[index - 1] > 1;
                    return (
                      <div key={page} className="flex items-center gap-1">
                        {showEllipsisBefore && (
                          <span className="px-2 text-muted-foreground">...</span>
                        )}
                        <Button
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => goToPage(page)}
                          className="w-9 h-9"
                        >
                          {page}
                        </Button>
                      </div>
                    );
                  })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Sau
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          {/* Page info */}
          {totalPages > 1 && (
            <p className="text-center text-sm text-muted-foreground mt-2">
              Trang {currentPage} / {totalPages} ({filteredArticles.length} bài viết)
            </p>
          )}
        </>
      )}
    </div>
  );
};