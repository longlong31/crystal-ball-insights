import { useState } from "react";
import { motion } from "framer-motion";
import { 
  X, Image, Video, FileText, Send, Loader2, AlertTriangle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CommunityPostFormProps {
  onClose: () => void;
  isAdmin: boolean;
}

export function CommunityPostForm({ onClose, isAdmin }: CommunityPostFormProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState<"discussion" | "blog" | "event">("discussion");
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [moderationWarning, setModerationWarning] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles].slice(0, 5)); // Max 5 files
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async (userId: string) => {
    const mediaUrls: string[] = [];
    const fileUrls: string[] = [];

    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('community')
        .upload(fileName, file);

      if (error) {
        console.error("Upload error:", error);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('community')
        .getPublicUrl(fileName);

      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        mediaUrls.push(publicUrl);
      } else {
        fileUrls.push(publicUrl);
      }
    }

    return { mediaUrls, fileUrls };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tiêu đề và nội dung",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    setModerationWarning(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Lỗi",
          description: "Vui lòng đăng nhập để đăng bài",
          variant: "destructive",
        });
        return;
      }

      // AI Moderation check
      const { data: moderationResult, error: modError } = await supabase.functions.invoke("moderate-content", {
        body: { title, content },
      });

      if (modError) {
        console.error("Moderation error:", modError);
      }

      if (moderationResult && !moderationResult.safe) {
        setModerationWarning(moderationResult.reason || "Nội dung vi phạm quy định cộng đồng");
        setIsSubmitting(false);
        toast({
          title: "Nội dung không phù hợp",
          description: moderationResult.reason || "Vui lòng chỉnh sửa nội dung và thử lại",
          variant: "destructive",
        });
        return;
      }

      // Upload files
      const { mediaUrls, fileUrls } = await uploadFiles(user.id);

      // Create post
      const { error } = await supabase.from("community_posts").insert({
        user_id: user.id,
        title,
        content,
        post_type: postType,
        status: isAdmin ? "approved" : "pending",
        media_urls: mediaUrls,
        file_urls: fileUrls,
      });

      if (error) throw error;

      toast({
        title: isAdmin ? "Đã đăng bài!" : "Đã gửi bài!",
        description: isAdmin 
          ? "Bài viết của bạn đã được đăng thành công" 
          : "Bài viết của bạn đang chờ admin duyệt",
      });

      onClose();
    } catch (error) {
      console.error("Submit error:", error);
      toast({
        title: "Lỗi",
        description: "Không thể đăng bài. Vui lòng thử lại",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold">Đăng bài mới</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {moderationWarning && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="text-sm text-destructive">{moderationWarning}</div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Loại bài viết</Label>
            <Select value={postType} onValueChange={(v: any) => setPostType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="discussion">Thảo luận</SelectItem>
                {isAdmin && <SelectItem value="blog">Blog</SelectItem>}
                {isAdmin && <SelectItem value="event">Sự kiện</SelectItem>}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tiêu đề</Label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề bài viết..."
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label>Nội dung</Label>
            <Textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Chia sẻ suy nghĩ của bạn..."
              rows={6}
              maxLength={5000}
            />
          </div>

          <div className="space-y-2">
            <Label>Đính kèm (tối đa 5 files)</Label>
            <div className="flex gap-2">
              <label className="flex-1 cursor-pointer">
                <div className="border border-dashed border-border rounded-lg p-3 text-center hover:border-primary/50 transition-colors">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Image className="w-4 h-4" />
                    <Video className="w-4 h-4" />
                    <FileText className="w-4 h-4" />
                    <span>Chọn file</span>
                  </div>
                </div>
                <input
                  type="file"
                  accept="image/*,video/*,.pdf"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
            
            {files.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {files.map((file, index) => (
                  <div key={index} className="bg-muted rounded-lg px-3 py-1.5 text-sm flex items-center gap-2">
                    <span className="truncate max-w-[150px]">{file.name}</span>
                    <button 
                      type="button" 
                      onClick={() => removeFile(index)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {!isAdmin && (
            <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">
              ⚠️ Bài viết của bạn sẽ được kiểm duyệt bởi AI và admin trước khi hiển thị công khai.
            </p>
          )}

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-primary to-purple-500"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                {isAdmin ? "Đăng bài" : "Gửi duyệt"}
              </>
            )}
          </Button>
        </form>
      </motion.div>
    </motion.div>
  );
}
