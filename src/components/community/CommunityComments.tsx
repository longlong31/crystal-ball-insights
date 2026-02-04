import { useState, useEffect } from "react";
import { Send, Loader2, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles?: {
    full_name: string;
    avatar_url: string | null;
  };
}

interface CommunityCommentsProps {
  postId: string;
  onCommentAdded?: () => void;
}

export function CommunityComments({ postId, onCommentAdded }: CommunityCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchComments();
    checkUser();
  }, [postId]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchComments = async () => {
    try {
      const { data: commentsData, error } = await supabase
        .from("community_comments")
        .select("*")
        .eq("post_id", postId)
        .eq("status", "approved")
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Fetch profiles separately
      const userIds = [...new Set((commentsData || []).map(c => c.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
      
      const commentsWithProfiles = (commentsData || []).map(comment => ({
        ...comment,
        profiles: profilesMap.get(comment.user_id) || { full_name: "Người dùng", avatar_url: null }
      }));

      setComments(commentsWithProfiles);
    } catch (error) {
      console.error("Fetch comments error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;
    if (!user) {
      toast({
        title: "Vui lòng đăng nhập",
        description: "Bạn cần đăng nhập để bình luận",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      // Moderate comment
      const { data: modResult } = await supabase.functions.invoke("moderate-content", {
        body: { content: newComment, title: "" },
      });

      if (modResult && !modResult.safe) {
        toast({
          title: "Nội dung không phù hợp",
          description: modResult.reason || "Vui lòng chỉnh sửa bình luận",
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }

      const { error } = await supabase.from("community_comments").insert({
        post_id: postId,
        user_id: user.id,
        content: newComment.trim(),
        status: "approved", // Comments are auto-approved after AI check
      });

      if (error) throw error;

      setNewComment("");
      fetchComments();
      onCommentAdded?.();
      toast({
        title: "Đã gửi bình luận",
      });
    } catch (error) {
      console.error("Submit comment error:", error);
      toast({
        title: "Lỗi",
        description: "Không thể gửi bình luận",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-border space-y-4">
      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {comments.length > 0 && (
            <div className="space-y-3">
              {comments.map(comment => (
                <div key={comment.id} className="flex gap-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={comment.profiles?.avatar_url || ""} />
                    <AvatarFallback className="bg-muted">
                      <UserIcon className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 bg-muted rounded-lg px-3 py-2">
                    <p className="text-xs font-medium">
                      {comment.profiles?.full_name || "Người dùng"}
                      <span className="text-muted-foreground font-normal ml-2">
                        {formatDistanceToNow(new Date(comment.created_at), { 
                          addSuffix: true, 
                          locale: vi 
                        })}
                      </span>
                    </p>
                    <p className="text-sm mt-1">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {user ? (
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Viết bình luận..."
                className="flex-1 bg-background"
                maxLength={500}
              />
              <Button 
                type="submit" 
                size="icon" 
                disabled={submitting || !newComment.trim()}
                className="bg-primary"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </form>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-2">
              Đăng nhập để bình luận
            </p>
          )}
        </>
      )}
    </div>
  );
}
