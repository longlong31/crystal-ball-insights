-- Enable realtime for community_posts table
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_posts;

-- Enable realtime for community_comments table
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_comments;