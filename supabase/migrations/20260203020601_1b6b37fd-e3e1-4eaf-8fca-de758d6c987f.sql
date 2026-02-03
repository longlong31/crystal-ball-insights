-- Create enum for post types and status
CREATE TYPE public.post_type AS ENUM ('discussion', 'blog', 'event');
CREATE TYPE public.post_status AS ENUM ('pending', 'approved', 'rejected');

-- Create community_posts table
CREATE TABLE public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  post_type post_type NOT NULL DEFAULT 'discussion',
  status post_status NOT NULL DEFAULT 'pending',
  media_urls TEXT[] DEFAULT '{}',
  file_urls TEXT[] DEFAULT '{}',
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create community_comments table
CREATE TABLE public.community_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  status post_status NOT NULL DEFAULT 'approved',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;

-- Policies for community_posts
CREATE POLICY "Everyone can view approved posts"
ON public.community_posts FOR SELECT
USING (status = 'approved');

CREATE POLICY "Users can view their own posts"
ON public.community_posts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all posts"
ON public.community_posts FOR SELECT
USING (is_admin());

CREATE POLICY "Authenticated users can create posts"
ON public.community_posts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending posts"
ON public.community_posts FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can update all posts"
ON public.community_posts FOR UPDATE
USING (is_admin());

CREATE POLICY "Users can delete their own posts"
ON public.community_posts FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any post"
ON public.community_posts FOR DELETE
USING (is_admin());

-- Policies for community_comments
CREATE POLICY "Everyone can view approved comments"
ON public.community_comments FOR SELECT
USING (status = 'approved');

CREATE POLICY "Authenticated users can create comments"
ON public.community_comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
ON public.community_comments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can update all comments"
ON public.community_comments FOR UPDATE
USING (is_admin());

CREATE POLICY "Users can delete their own comments"
ON public.community_comments FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any comment"
ON public.community_comments FOR DELETE
USING (is_admin());

-- Create triggers for updated_at
CREATE TRIGGER update_community_posts_updated_at
BEFORE UPDATE ON public.community_posts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_community_comments_updated_at
BEFORE UPDATE ON public.community_comments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for community files
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('community', 'community', true, 52428800);

-- Storage policies
CREATE POLICY "Anyone can view community files"
ON storage.objects FOR SELECT
USING (bucket_id = 'community');

CREATE POLICY "Authenticated users can upload community files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'community' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own community files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'community' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own community files"
ON storage.objects FOR DELETE
USING (bucket_id = 'community' AND auth.uid()::text = (storage.foldername(name))[1]);