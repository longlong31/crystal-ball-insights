import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RealtimeChannel } from "@supabase/supabase-js";

interface UseCommunityRealtimeOptions {
  onNewPost?: () => void;
  onNewComment?: () => void;
  enabled?: boolean;
}

export function useCommunityRealtime(options: UseCommunityRealtimeOptions = {}) {
  const { onNewPost, onNewComment, enabled = true } = options;
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // Create a channel for community updates
    const channel = supabase
      .channel('community-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'community_posts',
          filter: 'status=eq.approved'
        },
        (payload) => {
          console.log('New approved post:', payload);
          toast.info("📝 Có bài viết mới trong cộng đồng!", {
            description: "Nhấn để xem bài viết mới",
            duration: 5000,
          });
          onNewPost?.();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'community_posts',
        },
        (payload) => {
          // Check if status changed to approved
          if (payload.new && (payload.new as any).status === 'approved' && 
              payload.old && (payload.old as any).status !== 'approved') {
            console.log('Post approved:', payload);
            toast.info("📝 Có bài viết mới được duyệt!", {
              description: "Nhấn để xem bài viết mới",
              duration: 5000,
            });
            onNewPost?.();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'community_comments',
        },
        (payload) => {
          console.log('New comment:', payload);
          toast.info("💬 Có bình luận mới!", {
            description: "Ai đó vừa bình luận trong cộng đồng",
            duration: 4000,
          });
          onNewComment?.();
        }
      )
      .subscribe((status) => {
        console.log('Community realtime subscription status:', status);
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [enabled, onNewPost, onNewComment]);

  return {
    unsubscribe: () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    }
  };
}
