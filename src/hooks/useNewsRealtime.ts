import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RealtimeChannel } from "@supabase/supabase-js";

interface UseNewsRealtimeOptions {
  onNewArticle?: () => void;
  category?: string;
  enabled?: boolean;
}

export function useNewsRealtime(options: UseNewsRealtimeOptions = {}) {
  const { onNewArticle, category, enabled = true } = options;
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const channelName = category ? `news-${category}` : 'news-all';
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'news_articles',
          ...(category ? { filter: `category=eq.${category}` } : {})
        },
        (payload) => {
          console.log('New article:', payload);
          const categoryLabel = getCategoryLabel(category);
          toast.info(`📰 ${categoryLabel} mới!`, {
            description: (payload.new as any)?.title?.slice(0, 50) + "...",
            duration: 5000,
          });
          onNewArticle?.();
        }
      )
      .subscribe((status) => {
        console.log(`News realtime (${channelName}) status:`, status);
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [enabled, category, onNewArticle]);

  return {
    unsubscribe: () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    }
  };
}

function getCategoryLabel(category?: string): string {
  switch (category) {
    case "event": return "Sự kiện";
    case "blog": return "Bài blog";
    default: return "Tin tức";
  }
}
