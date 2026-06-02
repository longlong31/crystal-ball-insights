-- Fix REALTIME_CROSS_USER_DATA_LEAK: Remove n8n_runs from realtime publication
-- The n8n_runs table broadcasts sensitive workflow data to all authenticated users via Realtime
-- because the realtime.messages policy only covers community-posts, community-comments, and news-articles topics.
ALTER PUBLICATION supabase_realtime DROP TABLE public.n8n_runs;

-- Fix MISSING_RLS_PROTECTION: Allow users to view their own pending/rejected comments
CREATE POLICY "Users can view their own comments"
ON public.community_comments
FOR SELECT
TO public
USING (auth.uid() = user_id);