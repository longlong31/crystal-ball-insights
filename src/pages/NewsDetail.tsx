import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Globe, ExternalLink, Share2, Clock, BookOpen } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import { AppHeader } from "@/components/layout/AppHeader";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import type { NewsArticle } from "@/hooks/useNewsArticles";

export default function NewsDetail() {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedArticles, setRelatedArticles] = useState<NewsArticle[]>([]);
  const { t, language } = useLanguage();

  const dateLocale = language === 'vi' ? vi : enUS;

  useEffect(() => {
    if (id) {
      fetchArticle();
    }
  }, [id]);

  const fetchArticle = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("news_articles")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setArticle(data);

      // Fetch related articles from same source or category
      if (data) {
        const { data: related } = await supabase
          .from("news_articles")
          .select("*")
          .eq("is_active", true)
          .neq("id", id)
          .or(`source.eq.${data.source},category.eq.${data.category}`)
          .order("published_at", { ascending: false })
          .limit(4);

        setRelatedArticles(related || []);
      }
    } catch (error) {
      console.error("Error fetching article:", error);
      toast.error(t('news.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share && article) {
      try {
        await navigator.share({
          title: article.title,
          text: article.description || "",
          url: window.location.href,
        });
      } catch (error) {
        // User cancelled or error
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success(t('news.linkCopied'));
  };

  const getReadingTime = (content: string | null) => {
    if (!content) return 1;
    const wordsPerMinute = 200;
    const words = content.split(/\s+/).length;
    return Math.max(1, Math.ceil(words / wordsPerMinute));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container py-8">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-64 w-full mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container py-8">
          <Card className="bg-card/50 border-border/50">
            <CardContent className="py-12 text-center">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">{t('news.notFound')}</h3>
              <p className="text-muted-foreground mb-4">
                {t('news.notFoundDesc')}
              </p>
              <Link to="/community">
                <Button>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t('news.backToList')}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="container py-8">
        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Link 
            to="/community" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('news.backToList')}
          </Link>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2"
          >
            {/* Article Header */}
            <header className="mb-6">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  {article.source}
                </Badge>
                <Badge variant="outline">
                  <Globe className="w-3 h-3 mr-1" />
                  {article.language === 'vi' ? 'Tiếng Việt' : 'English'}
                </Badge>
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {getReadingTime(article.content)} {t('news.minRead')}
                </span>
              </div>

              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 leading-tight">
                {article.title}
              </h1>

              {article.description && (
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {article.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 mt-6 pt-4 border-t border-border/50">
                {article.published_at && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {format(new Date(article.published_at), "dd MMMM yyyy, HH:mm", { locale: dateLocale })}
                    </span>
                    <span className="text-xs">
                      ({formatDistanceToNow(new Date(article.published_at), {
                        addSuffix: true,
                        locale: dateLocale
                      })})
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  <Button variant="outline" size="sm" onClick={handleShare}>
                    <Share2 className="w-4 h-4 mr-2" />
                    {t('news.share')}
                  </Button>
                  {article.source_url && (
                    <a href={article.source_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        {t('news.viewOriginal')}
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            </header>

            {/* Cover Image */}
            {article.image_url && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="mb-8 rounded-xl overflow-hidden bg-muted"
              >
                <img
                  src={article.image_url}
                  alt={article.title}
                  className="w-full h-auto max-h-[500px] object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </motion.div>
            )}

            {/* Article Content */}
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-6 md:p-8">
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  {article.content ? (
                    <div className="whitespace-pre-wrap leading-relaxed text-foreground">
                      {article.content}
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">
                      {t('news.noContent')}
                    </p>
                  )}
                </div>

                {/* Source Link */}
                {article.source_url && (
                  <div className="mt-8 pt-6 border-t border-border/50">
                    <a
                      href={article.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-primary hover:underline"
                    >
                      <ExternalLink className="w-4 h-4" />
                      {t('news.readFullArticle')} {article.source}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.article>

          {/* Sidebar - Related Articles */}
          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            <Card className="bg-card/50 border-border/50 sticky top-24">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  {t('news.relatedArticles')}
                </h3>

                {relatedArticles.length > 0 ? (
                  <div className="space-y-4">
                    {relatedArticles.map((related) => (
                      <Link
                        key={related.id}
                        to={`/news/${related.id}`}
                        className="block group"
                      >
                        <div className="flex gap-3">
                          {related.image_url && (
                            <div className="w-20 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                              <img
                                src={related.image_url}
                                alt={related.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = "none";
                                }}
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                              {related.title}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              {related.source}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {t('news.noRelatedArticles')}
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
