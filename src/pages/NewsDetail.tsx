import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, useScroll, useSpring } from "framer-motion";
import {
  ArrowLeft, Calendar, Globe, ExternalLink, Share2, Clock, BookOpen,
  Loader2, Sparkles, Type, AlignLeft, CheckCircle2, AlertTriangle,
} from "lucide-react";
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
import { classifyTopic, TOPIC_META } from "@/lib/newsTopics";
import type { NewsArticle } from "@/hooks/useNewsArticles";
import { cn } from "@/lib/utils";

type FontSize = "sm" | "md" | "lg";
const FONT_CLASS: Record<FontSize, string> = {
  sm: "text-[15px] leading-7",
  md: "text-[17px] leading-8",
  lg: "text-[19px] leading-9",
};

/** Renders extractor output: "## heading", "- bullet", "> quote", plain paragraph. */
function ArticleBody({ content, size }: { content: string; size: FontSize }) {
  const blocks = useMemo(
    () => content.split(/\n{2,}|\n(?=[-#>])/).map((b) => b.trim()).filter(Boolean),
    [content],
  );

  return (
    <div className={cn("space-y-5 text-foreground/90", FONT_CLASS[size])}>
      {blocks.map((block, i) => {
        if (block.startsWith("## ")) {
          return (
            <h2 key={i} className="text-xl md:text-2xl font-semibold text-foreground pt-2 border-l-2 border-primary pl-3">
              {block.slice(3)}
            </h2>
          );
        }
        if (block.startsWith("> ")) {
          return (
            <blockquote key={i} className="border-l-4 border-primary/60 bg-primary/5 rounded-r-lg px-4 py-3 italic">
              {block.slice(2)}
            </blockquote>
          );
        }
        if (block.startsWith("- ")) {
          return (
            <li key={i} className="ml-5 list-disc marker:text-primary">
              {block.slice(2)}
            </li>
          );
        }
        // First paragraph gets a drop-cap for editorial feel.
        return (
          <p key={i} className={i === 0 ? "first-letter:text-5xl first-letter:font-bold first-letter:text-primary first-letter:mr-2 first-letter:float-left first-letter:leading-none" : undefined}>
            {block}
          </p>
        );
      })}
    </div>
  );
}

export default function NewsDetail() {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedArticles, setRelatedArticles] = useState<NewsArticle[]>([]);
  const [fullContent, setFullContent] = useState<string | null>(null);
  const [extraImages, setExtraImages] = useState<string[]>([]);
  const [fetchingFull, setFetchingFull] = useState(false);
  const [fullFailed, setFullFailed] = useState(false);
  const [fontSize, setFontSize] = useState<FontSize>(
    () => (localStorage.getItem("news:font") as FontSize) || "md",
  );
  const { t, language } = useLanguage();

  const dateLocale = language === "vi" ? vi : enUS;
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });

  useEffect(() => {
    localStorage.setItem("news:font", fontSize);
  }, [fontSize]);

  useEffect(() => {
    if (id) {
      setFullContent(null);
      setExtraImages([]);
      setFullFailed(false);
      fetchArticle();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      if (data) {
        const { data: related } = await supabase
          .from("news_articles")
          .select("*")
          .eq("is_active", true)
          .neq("id", id)
          .or(`source.eq.${data.source},category.eq.${data.category}`)
          .order("published_at", { ascending: false })
          .limit(6);

        setRelatedArticles(related || []);

        // Auto-load the full article when the stored body is only an RSS teaser.
        if ((data.content?.length ?? 0) < 1200 && data.source_url) {
          loadFullArticle(data.id);
        }
      }
    } catch (error) {
      console.error("Error fetching article:", error);
      toast.error(t("news.loadError"));
    } finally {
      setLoading(false);
    }
  };

  const loadFullArticle = async (articleId: string) => {
    setFetchingFull(true);
    setFullFailed(false);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-article-content", {
        body: { articleId },
      });
      if (error) throw error;
      if (data?.content && data.content.length > 200) {
        setFullContent(data.content);
        setExtraImages(Array.isArray(data.images) ? data.images.slice(0, 4) : []);
      } else {
        setFullFailed(true);
      }
    } catch (e) {
      console.error("Full article fetch failed:", e);
      setFullFailed(true);
    } finally {
      setFetchingFull(false);
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
      } catch {
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success(t("news.linkCopied"));
  };

  const body = fullContent ?? article?.content ?? "";
  const wordCount = body ? body.split(/\s+/).filter(Boolean).length : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));
  const topic = article ? classifyTopic(article) : "general";
  const topicMeta = TOPIC_META[topic];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container py-8 max-w-4xl">
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
              <h3 className="text-lg font-medium mb-2">{t("news.notFound")}</h3>
              <p className="text-muted-foreground mb-4">{t("news.notFoundDesc")}</p>
              <Link to="/community">
                <Button>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t("news.backToList")}
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
      {/* Reading progress */}
      <motion.div
        style={{ scaleX: progress }}
        className="fixed top-0 left-0 right-0 h-[3px] origin-left bg-gradient-to-r from-primary via-primary/70 to-primary/30 z-50"
      />

      <AppHeader />

      <main className="container py-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <Link
            to="/community"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("news.backToList")}
          </Link>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2"
          >
            <header className="mb-6">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className={cn("rounded-full border px-2.5 py-1 text-xs font-mono", topicMeta.className)}>
                  {language === "vi" ? topicMeta.label : topicMeta.labelEn}
                </span>
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  {article.source.split(" · ")[0]}
                </Badge>
                <Badge variant="outline">
                  <Globe className="w-3 h-3 mr-1" />
                  {article.language === "vi" ? "Tiếng Việt" : "English"}
                </Badge>
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {readingTime} {t("news.minRead")}
                </span>
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <AlignLeft className="w-3 h-3" />
                  {wordCount.toLocaleString()} từ
                </span>
              </div>

              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 leading-tight">
                {article.title}
              </h1>

              {article.description && (
                <p className="text-lg text-muted-foreground leading-relaxed">{article.description}</p>
              )}

              <div className="flex flex-wrap items-center gap-3 mt-6 pt-4 border-t border-border/50">
                {article.published_at && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{format(new Date(article.published_at), "dd MMMM yyyy, HH:mm", { locale: dateLocale })}</span>
                    <span className="text-xs">
                      ({formatDistanceToNow(new Date(article.published_at), { addSuffix: true, locale: dateLocale })})
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  {/* Font size control */}
                  <div className="flex items-center rounded-md border border-border/60 overflow-hidden">
                    <Type className="w-3.5 h-3.5 mx-2 text-muted-foreground" />
                    {(["sm", "md", "lg"] as FontSize[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => setFontSize(s)}
                        className={cn(
                          "px-2.5 py-1.5 text-xs font-mono transition-colors",
                          fontSize === s ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-muted",
                        )}
                      >
                        {s.toUpperCase()}
                      </button>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" onClick={handleShare}>
                    <Share2 className="w-4 h-4 mr-2" />
                    {t("news.share")}
                  </Button>
                  {article.source_url && (
                    <a href={article.source_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        {t("news.viewOriginal")}
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            </header>

            {article.image_url && (
              <motion.figure
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="mb-8 rounded-xl overflow-hidden bg-muted ring-1 ring-border/50"
              >
                <img
                  src={article.image_url}
                  alt={article.title}
                  className="w-full h-auto max-h-[500px] object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </motion.figure>
            )}

            <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
              <CardContent className="p-6 md:p-8">
                {/* Full-text status bar */}
                <div className="flex flex-wrap items-center gap-2 mb-6 text-xs">
                  {fetchingFull ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 text-primary px-3 py-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Đang tải toàn văn bài viết từ {article.source.split(" · ")[0]}…
                    </span>
                  ) : fullContent ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 px-3 py-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Đã đọc toàn văn ({wordCount.toLocaleString()} từ)
                    </span>
                  ) : fullFailed ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-500 px-3 py-1">
                      <AlertTriangle className="w-3 h-3" />
                      Nguồn chặn bóc tách — hiển thị bản tóm tắt
                    </span>
                  ) : null}

                  {!fullContent && !fetchingFull && article.source_url && (
                    <Button size="sm" variant="outline" onClick={() => loadFullArticle(article.id)}>
                      <Sparkles className="w-3.5 h-3.5 mr-2" />
                      Đọc toàn văn tại đây
                    </Button>
                  )}
                </div>

                {body ? (
                  <ArticleBody content={body} size={fontSize} />
                ) : (
                  <p className="text-muted-foreground italic">{t("news.noContent")}</p>
                )}

                {/* Images pulled from the original article */}
                {extraImages.length > 1 && (
                  <div className="mt-8 grid grid-cols-2 gap-3">
                    {extraImages.slice(1).map((src) => (
                      <img
                        key={src}
                        src={src}
                        alt={article.title}
                        loading="lazy"
                        className="rounded-lg w-full h-40 object-cover ring-1 ring-border/50"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ))}
                  </div>
                )}

                {article.source_url && (
                  <div className="mt-8 pt-6 border-t border-border/50 flex flex-wrap items-center gap-3">
                    <a
                      href={article.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-primary hover:underline"
                    >
                      <ExternalLink className="w-4 h-4" />
                      {t("news.readFullArticle")} {article.source.split(" · ")[0]}
                    </a>
                    {fullContent && (
                      <span className="text-xs text-muted-foreground">
                        Nội dung được bóc tách tự động từ trang gốc, bản quyền thuộc về {article.source.split(" · ")[0]}.
                      </span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.article>

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
                  {t("news.relatedArticles")}
                </h3>

                {relatedArticles.length > 0 ? (
                  <div className="space-y-4">
                    {relatedArticles.map((related) => {
                      const rTopic = TOPIC_META[classifyTopic(related)];
                      return (
                        <Link key={related.id} to={`/news/${related.id}`} className="block group">
                          <div className="flex gap-3">
                            {related.image_url && (
                              <div className="w-20 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                                <img
                                  src={related.image_url}
                                  alt={related.title}
                                  loading="lazy"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = "none";
                                  }}
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <span className={cn("inline-block rounded-full border px-1.5 py-[1px] text-[10px] font-mono mb-1", rTopic.className)}>
                                {language === "vi" ? rTopic.label : rTopic.labelEn}
                              </span>
                              <h4 className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                                {related.title}
                              </h4>
                              <p className="text-xs text-muted-foreground mt-1">
                                {related.source.split(" · ")[0]}
                              </p>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{t("news.noRelatedArticles")}</p>
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
