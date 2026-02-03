import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  CheckCircle, XCircle, Clock, Eye, Loader2, 
  AlertTriangle, Image as ImageIcon, FileText, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface PendingPost {
  id: string;
  user_id: string;
  title: string;
  content: string;
  post_type: string;
  media_urls: string[];
  file_urls: string[];
  created_at: string;
  profiles?: {
    full_name: string;
    avatar_url: string | null;
  };
}

export function CommunityAdminPanel() {
  const [pendingPosts, setPendingPosts] = useState<PendingPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<PendingPost | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingPosts();
  }, []);

  const fetchPendingPosts = async () => {
    setLoading(true);
    try {
      const { data: postsData, error } = await supabase
        .from("community_posts")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Fetch profiles separately
      const userIds = [...new Set((postsData || []).map(p => p.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
      
      const postsWithProfiles = (postsData || []).map(post => ({
        ...post,
        profiles: profilesMap.get(post.user_id) || { full_name: "Người dùng", avatar_url: null }
      }));

      setPendingPosts(postsWithProfiles);
    } catch (error) {
      console.error("Fetch pending posts error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (postId: string) => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from("community_posts")
        .update({ status: "approved" })
        .eq("id", postId);

      if (error) throw error;

      toast({ title: "Đã duyệt bài viết" });
      fetchPendingPosts();
    } catch (error) {
      console.error("Approve error:", error);
      toast({
        title: "Lỗi",
        description: "Không thể duyệt bài viết",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPost) return;
    
    setProcessing(true);
    try {
      const { error } = await supabase
        .from("community_posts")
        .update({ 
          status: "rejected",
          rejection_reason: rejectionReason || "Vi phạm quy định cộng đồng"
        })
        .eq("id", selectedPost.id);

      if (error) throw error;

      toast({ title: "Đã từ chối bài viết" });
      setSelectedPost(null);
      setRejectionReason("");
      fetchPendingPosts();
    } catch (error) {
      console.error("Reject error:", error);
      toast({
        title: "Lỗi",
        description: "Không thể từ chối bài viết",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const getPostTypeLabel = (type: string) => {
    switch (type) {
      case "event": return "Sự kiện";
      case "blog": return "Blog";
      default: return "Thảo luận";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="bg-card/50 border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-500" />
            Bài viết chờ duyệt ({pendingPosts.length})
          </CardTitle>
        </CardHeader>
      </Card>

      {pendingPosts.length === 0 ? (
        <Card className="bg-card/50 border-border">
          <CardContent className="py-12 text-center">
            <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
            <p className="text-muted-foreground">Không có bài viết nào chờ duyệt</p>
          </CardContent>
        </Card>
      ) : (
        pendingPosts.map((post, index) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="bg-card/50 border-border">
              <CardContent className="p-4">
                {/* Author info */}
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={post.profiles?.avatar_url || ""} />
                    <AvatarFallback className="bg-primary/20">
                      <User className="w-5 h-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {post.profiles?.full_name || "Người dùng"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(post.created_at), { 
                        addSuffix: true, 
                        locale: vi 
                      })}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-500 border-yellow-500/30">
                    Chờ duyệt
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {getPostTypeLabel(post.post_type)}
                  </Badge>
                </div>

                {/* Content */}
                <h3 className="font-semibold mb-2">{post.title}</h3>
                <p className="text-muted-foreground text-sm whitespace-pre-wrap mb-3">
                  {post.content.slice(0, 500)}
                  {post.content.length > 500 && "..."}
                </p>

                {/* Media preview */}
                {(post.media_urls?.length > 0 || post.file_urls?.length > 0) && (
                  <div className="flex items-center gap-4 mb-3 text-sm text-muted-foreground">
                    {post.media_urls?.length > 0 && (
                      <span className="flex items-center gap-1">
                        <ImageIcon className="w-4 h-4" />
                        {post.media_urls.length} ảnh/video
                      </span>
                    )}
                    {post.file_urls?.length > 0 && (
                      <span className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        {post.file_urls.length} file
                      </span>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-border">
                  <Button
                    onClick={() => handleApprove(post.id)}
                    disabled={processing}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Duyệt
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setSelectedPost(post)}
                    disabled={processing}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Từ chối
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))
      )}

      {/* Rejection Dialog */}
      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Từ chối bài viết
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Bài viết: <strong>{selectedPost?.title}</strong>
            </p>
            <Textarea
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              placeholder="Lý do từ chối (không bắt buộc)..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedPost(null)}>
              Hủy
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={processing}
            >
              {processing ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              Xác nhận từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
