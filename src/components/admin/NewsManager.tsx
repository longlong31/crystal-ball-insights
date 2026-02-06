import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, RefreshCw, Newspaper, Calendar, FileText, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface NewsArticle {
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
  is_active: boolean;
  created_at: string;
}

interface NewsFormData {
  source: string;
  source_url: string;
  title: string;
  description: string;
  content: string;
  image_url: string;
  category: string;
  is_active: boolean;
}

const defaultFormData: NewsFormData = {
  source: "",
  source_url: "",
  title: "",
  description: "",
  content: "",
  image_url: "",
  category: "news",
  is_active: true
};

export const NewsManager = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<NewsFormData>(defaultFormData);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchArticles();
  }, [filter]);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("news_articles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (filter !== "all") {
        query = query.eq("category", filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      console.error("Error fetching articles:", error);
      toast.error("Không thể tải danh sách bài viết");
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshNews = async () => {
    setRefreshing(true);
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
        toast.success(`Đã cập nhật ${result.inserted || 0} bài viết mới`);
        fetchArticles();
      } else {
        toast.error("Không thể cập nhật tin tức");
      }
    } catch (error) {
      console.error("Error refreshing news:", error);
      toast.error("Lỗi khi cập nhật tin tức");
    } finally {
      setRefreshing(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.source) {
      toast.error("Vui lòng điền tiêu đề và nguồn");
      return;
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from("news_articles")
          .update({
            source: formData.source,
            source_url: formData.source_url || null,
            title: formData.title,
            description: formData.description || null,
            content: formData.content || null,
            image_url: formData.image_url || null,
            category: formData.category,
            is_active: formData.is_active
          })
          .eq("id", editingId);

        if (error) throw error;
        toast.success("Đã cập nhật bài viết");
      } else {
        const { error } = await supabase
          .from("news_articles")
          .insert({
            source: formData.source,
            source_url: formData.source_url || null,
            title: formData.title,
            description: formData.description || null,
            content: formData.content || null,
            image_url: formData.image_url || null,
            category: formData.category,
            is_active: formData.is_active,
            language: "vi",
            published_at: new Date().toISOString()
          });

        if (error) throw error;
        toast.success("Đã thêm bài viết mới");
      }

      setShowForm(false);
      setEditingId(null);
      setFormData(defaultFormData);
      fetchArticles();
    } catch (error) {
      console.error("Error saving article:", error);
      toast.error("Không thể lưu bài viết");
    }
  };

  const handleEdit = (article: NewsArticle) => {
    setEditingId(article.id);
    setFormData({
      source: article.source,
      source_url: article.source_url || "",
      title: article.title,
      description: article.description || "",
      content: article.content || "",
      image_url: article.image_url || "",
      category: article.category,
      is_active: article.is_active
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa bài viết này?")) return;

    try {
      const { error } = await supabase
        .from("news_articles")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Đã xóa bài viết");
      fetchArticles();
    } catch (error) {
      console.error("Error deleting article:", error);
      toast.error("Không thể xóa bài viết");
    }
  };

  const handleToggleActive = async (id: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from("news_articles")
        .update({ is_active: !currentState })
        .eq("id", id);

      if (error) throw error;
      toast.success(currentState ? "Đã ẩn bài viết" : "Đã hiển thị bài viết");
      fetchArticles();
    } catch (error) {
      console.error("Error toggling article:", error);
      toast.error("Không thể cập nhật trạng thái");
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "news": return <Newspaper className="w-4 h-4" />;
      case "event": return <Calendar className="w-4 h-4" />;
      case "blog": return <FileText className="w-4 h-4" />;
      default: return <Newspaper className="w-4 h-4" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "news": return "Tin tức";
      case "event": return "Sự kiện";
      case "blog": return "Blog";
      default: return category;
    }
  };

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-primary" />
            Quản lý Tin tức / Sự kiện / Blog
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="news">Tin tức</SelectItem>
                <SelectItem value="event">Sự kiện</SelectItem>
                <SelectItem value="blog">Blog</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefreshNews}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Fetch mới
            </Button>
            <Dialog open={showForm} onOpenChange={(open) => {
              setShowForm(open);
              if (!open) {
                setEditingId(null);
                setFormData(defaultFormData);
              }
            }}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-gradient-to-r from-primary to-purple-500">
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm mới
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingId ? "Chỉnh sửa bài viết" : "Thêm bài viết mới"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Loại bài viết</Label>
                      <Select 
                        value={formData.category} 
                        onValueChange={(v) => setFormData({ ...formData, category: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="news">Tin tức</SelectItem>
                          <SelectItem value="event">Sự kiện</SelectItem>
                          <SelectItem value="blog">Blog</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Nguồn</Label>
                      <Input
                        value={formData.source}
                        onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                        placeholder="VD: VnExpress, Tuổi Trẻ..."
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Tiêu đề *</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Nhập tiêu đề bài viết"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Link nguồn</Label>
                    <Input
                      value={formData.source_url}
                      onChange={(e) => setFormData({ ...formData, source_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Link hình ảnh</Label>
                    <Input
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Mô tả ngắn</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Mô tả ngắn gọn về bài viết"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Nội dung</Label>
                    <Textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="Nội dung chi tiết"
                      rows={5}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.is_active}
                        onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                      />
                      <Label>Hiển thị công khai</Label>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setShowForm(false)}>
                        Hủy
                      </Button>
                      <Button onClick={handleSubmit}>
                        {editingId ? "Cập nhật" : "Thêm mới"}
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Đang tải...
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Chưa có bài viết nào. Nhấn "Fetch mới" để lấy tin tức hoặc "Thêm mới" để tạo bài viết.
          </div>
        ) : (
          <div className="space-y-3">
            {articles.map((article, index) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className={`p-4 rounded-lg border ${
                  article.is_active 
                    ? "bg-card/50 border-border/50" 
                    : "bg-muted/30 border-muted opacity-60"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                        article.category === "news" ? "bg-blue-500/20 text-blue-400" :
                        article.category === "event" ? "bg-green-500/20 text-green-400" :
                        "bg-purple-500/20 text-purple-400"
                      }`}>
                        {getCategoryIcon(article.category)}
                        {getCategoryLabel(article.category)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {article.source}
                      </span>
                      {article.published_at && (
                        <span className="text-xs text-muted-foreground">
                          • {formatDistanceToNow(new Date(article.published_at), {
                            addSuffix: true,
                            locale: vi
                          })}
                        </span>
                      )}
                      {!article.is_active && (
                        <span className="text-xs text-red-400">(Đã ẩn)</span>
                      )}
                    </div>
                    <h4 className="font-medium text-sm line-clamp-2">{article.title}</h4>
                    {article.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                        {article.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {article.source_url && (
                      <a
                        href={article.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                      >
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                      </a>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleActive(article.id, article.is_active)}
                      title={article.is_active ? "Ẩn bài viết" : "Hiện bài viết"}
                    >
                      <Switch checked={article.is_active} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(article)}
                    >
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(article.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
