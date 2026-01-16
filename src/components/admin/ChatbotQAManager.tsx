import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageSquare, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Search,
  Bot,
  Sparkles,
  Tag,
  CheckCircle2,
  XCircle,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface QA {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function ChatbotQAManager() {
  const [qaList, setQaList] = useState<QA[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQA, setEditingQA] = useState<QA | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    keywords: "",
    is_active: true,
  });

  useEffect(() => {
    fetchQAList();
  }, []);

  const fetchQAList = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("chatbot_qa")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setQaList(data || []);
    } catch (error) {
      console.error("Error fetching Q&A:", error);
      toast.error("Không thể tải danh sách Q&A");
    } finally {
      setIsLoading(false);
    }
  };

  const openDialog = (qa?: QA) => {
    if (qa) {
      setEditingQA(qa);
      setFormData({
        question: qa.question,
        answer: qa.answer,
        keywords: qa.keywords?.join(", ") || "",
        is_active: qa.is_active,
      });
    } else {
      setEditingQA(null);
      setFormData({
        question: "",
        answer: "",
        keywords: "",
        is_active: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.question.trim() || !formData.answer.trim()) {
      toast.error("Vui lòng nhập câu hỏi và câu trả lời");
      return;
    }

    setIsSaving(true);
    try {
      const keywordsArray = formData.keywords
        .split(",")
        .map(k => k.trim())
        .filter(k => k.length > 0);

      const payload = {
        question: formData.question.trim(),
        answer: formData.answer.trim(),
        keywords: keywordsArray,
        is_active: formData.is_active,
      };

      if (editingQA) {
        const { error } = await supabase
          .from("chatbot_qa")
          .update(payload)
          .eq("id", editingQA.id);

        if (error) throw error;
        toast.success("Đã cập nhật câu hỏi thành công!");
      } else {
        const { error } = await supabase
          .from("chatbot_qa")
          .insert(payload);

        if (error) throw error;
        toast.success("Đã thêm câu hỏi mới thành công!");
      }

      setIsDialogOpen(false);
      fetchQAList();
    } catch (error) {
      console.error("Error saving Q&A:", error);
      toast.error("Không thể lưu câu hỏi");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa câu hỏi này?")) return;

    try {
      const { error } = await supabase
        .from("chatbot_qa")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Đã xóa câu hỏi");
      fetchQAList();
    } catch (error) {
      console.error("Error deleting Q&A:", error);
      toast.error("Không thể xóa câu hỏi");
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("chatbot_qa")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;
      
      setQaList(prev => 
        prev.map(qa => qa.id === id ? { ...qa, is_active: !currentStatus } : qa)
      );
      toast.success(`Đã ${!currentStatus ? "kích hoạt" : "tắt"} câu hỏi`);
    } catch (error) {
      console.error("Error toggling status:", error);
      toast.error("Không thể cập nhật trạng thái");
    }
  };

  const filteredQA = qaList.filter(qa =>
    qa.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    qa.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    qa.keywords?.some(k => k.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const activeCount = qaList.filter(qa => qa.is_active).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-xl">
            <Bot className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              Quản lý Chatbot Q&A
              <Sparkles className="w-5 h-5 text-yellow-400" />
            </h2>
            <p className="text-sm text-muted-foreground">
              {qaList.length} câu hỏi • {activeCount} đang hoạt động
            </p>
          </div>
        </div>
        <Button 
          onClick={() => openDialog()}
          className="bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Thêm Q&A mới
        </Button>
      </div>

      {/* Search */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="🔍 Tìm kiếm câu hỏi, câu trả lời hoặc từ khóa..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-12 h-12 border-border/50 bg-background/50"
            />
          </div>
        </CardContent>
      </Card>

      {/* Q&A List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card className="border-border/50">
            <CardContent className="py-16 text-center">
              <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
              <p className="mt-4 text-muted-foreground">Đang tải dữ liệu...</p>
            </CardContent>
          </Card>
        ) : filteredQA.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="py-16 text-center">
              <MessageSquare className="w-16 h-16 text-muted-foreground/30 mx-auto" />
              <p className="mt-4 text-muted-foreground">
                {searchTerm ? "Không tìm thấy câu hỏi phù hợp" : "Chưa có câu hỏi nào. Hãy thêm câu hỏi đầu tiên!"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <AnimatePresence>
            {filteredQA.map((qa, index) => (
              <motion.div
                key={qa.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:border-primary/30 ${!qa.is_active ? "opacity-60" : ""}`}>
                  <CardContent className="py-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${qa.is_active ? "bg-green-500/10" : "bg-muted"}`}>
                        {qa.is_active ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground mb-1">
                              {qa.question}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {qa.answer}
                            </p>
                            {qa.keywords && qa.keywords.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {qa.keywords.map((keyword, i) => (
                                  <Badge 
                                    key={i} 
                                    variant="secondary"
                                    className="text-xs bg-primary/10 text-primary border-primary/20"
                                  >
                                    <Tag className="w-3 h-3 mr-1" />
                                    {keyword}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Switch
                              checked={qa.is_active}
                              onCheckedChange={() => toggleActive(qa.id, qa.is_active)}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDialog(qa)}
                              className="hover:bg-primary/10 hover:text-primary"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(qa.id)}
                              className="hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg border-border/50 bg-background/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              {editingQA ? "Chỉnh sửa Q&A" : "Thêm Q&A mới"}
            </DialogTitle>
            <DialogDescription>
              {editingQA ? "Cập nhật câu hỏi và câu trả lời" : "Tạo câu hỏi và câu trả lời cho chatbot"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="question">Câu hỏi *</Label>
              <Textarea
                id="question"
                placeholder="Nhập câu hỏi người dùng có thể hỏi..."
                value={formData.question}
                onChange={e => setFormData(prev => ({ ...prev, question: e.target.value }))}
                className="min-h-[80px] border-border/50"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="answer">Câu trả lời *</Label>
              <Textarea
                id="answer"
                placeholder="Nhập câu trả lời của chatbot..."
                value={formData.answer}
                onChange={e => setFormData(prev => ({ ...prev, answer: e.target.value }))}
                className="min-h-[120px] border-border/50"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="keywords">Từ khóa (phân cách bằng dấu phẩy)</Label>
              <Input
                id="keywords"
                placeholder="vd: giá cả, thanh toán, hỗ trợ..."
                value={formData.keywords}
                onChange={e => setFormData(prev => ({ ...prev, keywords: e.target.value }))}
                className="border-border/50"
              />
              <p className="text-xs text-muted-foreground">
                Từ khóa giúp chatbot tìm câu trả lời chính xác hơn
              </p>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={checked => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="is_active" className="cursor-pointer">
                Kích hoạt câu hỏi này
              </Label>
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="border-border/50"
              >
                <X className="w-4 h-4 mr-2" />
                Hủy
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-gradient-to-r from-primary to-purple-500"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {editingQA ? "Cập nhật" : "Lưu"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
