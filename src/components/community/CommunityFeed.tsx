import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  MessageSquare, Heart, Share2, Clock, User, 
  FileText, Loader2, Link2, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { CommunityComments } from "./CommunityComments";
import { useToast } from "@/hooks/use-toast";

interface Post {
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
  likes_count?: number;
  comments_count?: number;
  user_liked?: boolean;
}

interface CommunityFeedProps {
  postType: "discussion" | "event" | "blog";
}

export function CommunityFeed({ postType }: CommunityFeedProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPosts();
    checkUser();
  }, [postType]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: postsData, error } = await supabase
        .from("community_posts")
        .select("*")
        .eq("post_type", postType)
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles separately
      const userIds = [...new Set((postsData || []).map(p => p.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);

      // Fetch reactions for all posts
      const postIds = (postsData || []).map(p => p.id);
      const { data: reactionsData } = await supabase
        .from("post_reactions")
        .select("post_id, user_id")
        .in("post_id", postIds);

      // Fetch comments count
      const { data: commentsData } = await supabase
        .from("community_comments")
        .select("post_id")
        .in("post_id", postIds)
        .eq("status", "approved");

      // Count reactions and comments per post
      const likesMap = new Map<string, number>();
      const userLikesMap = new Map<string, boolean>();
      const commentsMap = new Map<string, number>();

      (reactionsData || []).forEach(r => {
        likesMap.set(r.post_id, (likesMap.get(r.post_id) || 0) + 1);
        if (user && r.user_id === user.id) {
          userLikesMap.set(r.post_id, true);
        }
      });

      (commentsData || []).forEach(c => {
        commentsMap.set(c.post_id, (commentsMap.get(c.post_id) || 0) + 1);
      });
      
      const postsWithProfiles = (postsData || []).map(post => ({
        ...post,
        profiles: profilesMap.get(post.user_id) || { full_name: "Người dùng", avatar_url: null },
        likes_count: likesMap.get(post.id) || 0,
        comments_count: commentsMap.get(post.id) || 0,
        user_liked: userLikesMap.get(post.id) || false,
      }));

      setPosts(postsWithProfiles);
    } catch (error) {
      console.error("Fetch posts error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!currentUser) {
      toast({
        title: "Vui lòng đăng nhập",
        description: "Bạn cần đăng nhập để thích bài viết",
        variant: "destructive",
      });
      return;
    }

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    try {
      if (post.user_liked) {
        // Unlike
        await supabase
          .from("post_reactions")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", currentUser.id);

        setPosts(prev => prev.map(p => 
          p.id === postId 
            ? { ...p, likes_count: (p.likes_count || 1) - 1, user_liked: false }
            : p
        ));
      } else {
        // Like
        await supabase
          .from("post_reactions")
          .insert({ post_id: postId, user_id: currentUser.id, reaction_type: "like" });

        setPosts(prev => prev.map(p => 
          p.id === postId 
            ? { ...p, likes_count: (p.likes_count || 0) + 1, user_liked: true }
            : p
        ));
      }
    } catch (error) {
      console.error("Like error:", error);
    }
  };

  const handleShare = async (postId: string) => {
    const url = `${window.location.origin}/community?post=${postId}`;
    
    try {
      await navigator.clipboard.writeText(url);
      setCopiedPostId(postId);
      toast({
        title: "Đã sao chép liên kết",
        description: "Link bài viết đã được sao chép vào clipboard",
      });
      setTimeout(() => setCopiedPostId(null), 2000);
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement("textarea");
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopiedPostId(postId);
      toast({
        title: "Đã sao chép liên kết",
      });
      setTimeout(() => setCopiedPostId(null), 2000);
    }
  };

  const getPostTypeLabel = () => {
    switch (postType) {
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

  if (posts.length === 0) {
    return (
      <Card className="bg-card/50 border-border">
        <CardContent className="py-12 text-center">
          <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Chưa có {getPostTypeLabel().toLowerCase()} nào</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post, index) => (
        <motion.div
          key={post.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card className="bg-card/50 border-border hover:border-primary/30 transition-colors">
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
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(post.created_at), { 
                      addSuffix: true, 
                      locale: vi 
                    })}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {getPostTypeLabel()}
                </Badge>
              </div>

              {/* Content */}
              <h3 className="font-semibold text-lg mb-2">{post.title}</h3>
              <p className="text-muted-foreground text-sm whitespace-pre-wrap mb-3">
                {post.content.length > 300 && expandedPost !== post.id
                  ? `${post.content.slice(0, 300)}...`
                  : post.content
                }
                {post.content.length > 300 && (
                  <button
                    onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                    className="text-primary ml-1 hover:underline"
                  >
                    {expandedPost === post.id ? "Thu gọn" : "Xem thêm"}
                  </button>
                )}
              </p>

              {/* Media */}
              {post.media_urls && post.media_urls.length > 0 && (
                <div className={`grid gap-2 mb-3 ${
                  post.media_urls.length === 1 ? "grid-cols-1" :
                  post.media_urls.length === 2 ? "grid-cols-2" :
                  "grid-cols-3"
                }`}>
                  {post.media_urls.slice(0, 4).map((url, idx) => (
                    <div key={idx} className="relative rounded-lg overflow-hidden aspect-video bg-muted">
                      {url.includes('.mp4') || url.includes('.webm') ? (
                        <video 
                          src={url} 
                          controls 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img 
                          src={url} 
                          alt="" 
                          className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                          onClick={() => window.open(url, '_blank')}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Files */}
              {post.file_urls && post.file_urls.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {post.file_urls.map((url, idx) => (
                    <a
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 text-sm hover:bg-muted/80 transition-colors"
                    >
                      <FileText className="w-4 h-4 text-primary" />
                      <span>Tài liệu {idx + 1}</span>
                    </a>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-border">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`${post.user_liked ? "text-red-500" : "text-muted-foreground"} hover:text-red-500`}
                  onClick={() => handleLike(post.id)}
                >
                  <Heart className={`w-4 h-4 mr-1 ${post.user_liked ? "fill-red-500" : ""}`} />
                  {post.likes_count || 0}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-muted-foreground hover:text-primary"
                  onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                >
                  <MessageSquare className="w-4 h-4 mr-1" />
                  {post.comments_count || 0}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-muted-foreground hover:text-primary"
                  onClick={() => handleShare(post.id)}
                >
                  {copiedPostId === post.id ? (
                    <>
                      <Check className="w-4 h-4 mr-1 text-green-500" />
                      <span className="text-green-500">Đã sao chép</span>
                    </>
                  ) : (
                    <>
                      <Link2 className="w-4 h-4 mr-1" />
                      Chia sẻ
                    </>
                  )}
                </Button>
              </div>

              {/* Comments section */}
              {expandedPost === post.id && (
                <CommunityComments postId={post.id} onCommentAdded={fetchPosts} />
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
