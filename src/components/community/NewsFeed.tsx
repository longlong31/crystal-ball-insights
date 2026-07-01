import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNewsArticles, NewsArticle } from "@/hooks/useNewsArticles";
import { useNewsRealtime } from "@/hooks/useNewsRealtime";
import { useLanguage } from "@/contexts/LanguageContext";
import { ExternalLink, Newspaper, RefreshCw, Clock, Search, Filter, X, ChevronLeft, ChevronRight, Globe } from "lucide-react";
import { formatDistanceToNow, subDays, subWeeks, subMonths, isAfter } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import { toast } from "sonner";
import { useState, useMemo, useCallback } from "react";
import { Badge } from "@/components/ui/badge";

type TimeFilter = "all" | "today" | "week" | "month";
const ITEMS_PER_PAGE = 9;

interface NewsFeedProps {
  category?: string;
  /** Optional topic key that filters articles by keyword matching in title/description/content. */
  topic?: "stocks" | "crypto" | "banking" | "realestate" | "tech" | "events";
}

// Vietnamese + English keyword sets — matched case-insensitively against title/description/content.
const TOPIC_KEYWORDS: Record<NonNullable<NewsFeedProps["topic"]>, string[]> = {
  stocks: ["cổ phiếu", "chứng khoán", "vn-index", "vnindex", "hose", "hnx", "upcom", "cp ", "mã ck", " stock", "equity", "ipo", "cổ tức", "thị trường chứng khoán"],
  crypto: ["bitcoin", "btc", "eth", "ethereum", "crypto", "blockchain", " coin", "altcoin", "tiền số", "tiền mã hóa", "tiền điện tử", "defi", "nft", "binance", "solana"],
  banking: ["ngân hàng", "sbv", "tín dụng", " bank", "lãi suất", "nợ xấu", "credit", "vietcombank", "bidv", "vietinbank", "techcombank", "mb bank", "acb", "vpbank", "sacombank"],
  realestate: ["bất động sản", "bđs", "nhà đất", "chung cư", "real estate", "property", "căn hộ", "đất nền", "vinhomes", "novaland", "nhà ở"],
  tech: ["công nghệ", " ai ", "artificial intelligence", "fintech", "technology", "phần mềm", "startup", "khởi nghiệp", "chuyển đổi số", "digital", "cloud", "chatgpt", "openai", "microsoft", "google", "apple"],
  events: ["sự kiện", "hội thảo", "hội nghị", "event", "conference", "workshop", "webinar", "diễn đàn", "triển lãm"],
};

export const NewsFeed = ({ category = "news", topic }: NewsFeedProps) => {
  const { articles, loading, refreshNews, refetch } = useNewsArticles(category, 100);
  const { t, language } = useLanguage();
  const dateLocale = language === 'vi' ? vi : enUS;
  
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
      toast.success(`${t('news.updated')} ${result.inserted || 0} ${t('news.newArticles')}`);
    } else {
      toast.error(t('news.updateFailed'));
    }
    setRefreshing(false);
  };

  const getTitle = () => {
    switch (category) {
      case "event": return t('news.latestEvents');
      case "blog": return t('news.latestBlogs');
      default: return t('news.latest');
    }
  };

  const getTimeFilterLabel = (filter: TimeFilter) => {
    switch (filter) {
      case "today": return t('news.today');
      case "week": return t('news.thisWeek');
      case "month": return t('news.thisMonth');
      default: return t('news.allTime');
    }
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
          <h3 className="text-lg font-medium mb-2">{t('news.noArticles')}</h3>
          <p className="text-muted-foreground mb-4">
            {t('news.noArticlesDesc')}
          </p>
          <Button onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            {t('news.loadNews')}
          </Button>
        </CardContent>
      </Card>
    );
  }

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
          {t('news.refresh')}
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
                placeholder={t('news.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Source Filter */}
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder={t('filter.source')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('news.allSources')}</SelectItem>
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
                <SelectValue placeholder={t('filter.time')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('news.allTime')}</SelectItem>
                <SelectItem value="today">{t('news.today')}</SelectItem>
                <SelectItem value="week">{t('news.thisWeek')}</SelectItem>
                <SelectItem value="month">{t('news.thisMonth')}</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button variant="ghost" size="icon" onClick={clearFilters} title={t('news.clearFilters')}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {hasActiveFilters && (
            <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
              <Filter className="w-4 h-4" />
              <span>
                {t('news.showing')} {filteredArticles.length} {t('news.results')}
                {searchQuery && ` ${t('news.for')} "${searchQuery}"`}
                {sourceFilter !== "all" && ` ${t('news.from')} ${sourceFilter}`}
                {timeFilter !== "all" && ` ${t('news.in')} ${getTimeFilterLabel(timeFilter)}`}
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
            <h4 className="font-medium mb-1">{t('news.noResults')}</h4>
            <p className="text-sm text-muted-foreground mb-3">
              {t('news.tryDifferent')}
            </p>
            <Button variant="outline" size="sm" onClick={clearFilters}>
              {t('news.clearFilters')}
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
                <Link to={`/news/${article.id}`}>
                  <Card className="bg-card/50 border-border/50 hover:border-primary/50 hover:shadow-lg transition-all h-full group cursor-pointer">
                    <CardContent className="p-4 flex flex-col h-full">
                      {/* Cover Image */}
                      <div className="w-full h-40 rounded-lg overflow-hidden mb-3 bg-gradient-to-br from-primary/20 to-purple-500/20 relative">
                        {article.image_url ? (
                          <img 
                            src={article.image_url} 
                            alt={article.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                              target.parentElement!.classList.add("flex", "items-center", "justify-center");
                              const icon = document.createElement("div");
                              icon.innerHTML = `<svg class="w-12 h-12 text-primary/40" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/></svg>`;
                              target.parentElement!.appendChild(icon);
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Newspaper className="w-12 h-12 text-primary/40" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2 flex-wrap">
                        <Badge variant="secondary" className="bg-primary/10 text-primary font-medium">
                          {article.source}
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                          <Globe className="w-3 h-3" />
                          {article.language === 'vi' ? 'VI' : 'EN'}
                        </Badge>
                        {article.published_at && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(article.published_at), {
                              addSuffix: true,
                              locale: dateLocale
                            })}
                          </span>
                        )}
                      </div>

                      <h4 className="font-medium text-sm mb-2 line-clamp-2 flex-grow group-hover:text-primary transition-colors">
                        {article.title}
                      </h4>

                      {article.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                          {article.description}
                        </p>
                      )}

                      <span className="inline-flex items-center gap-1 text-xs text-primary group-hover:underline mt-auto">
                        {t('news.readMore')} <ExternalLink className="w-3 h-3" />
                      </span>
                    </CardContent>
                  </Card>
                </Link>
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
                {t('news.prev')}
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
                {t('news.next')}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          {/* Page info */}
          {totalPages > 1 && (
            <p className="text-center text-sm text-muted-foreground mt-2">
              {t('news.page')} {currentPage} / {totalPages} ({filteredArticles.length} {t('news.articles')})
            </p>
          )}
        </>
      )}
    </div>
  );
};
