
-- Create status enum for algorithm submissions
CREATE TYPE public.algorithm_status AS ENUM ('pending', 'approved', 'rejected');

-- Create community_algorithms table
CREATE TABLE public.community_algorithms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  name_vi TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'financial',
  description TEXT NOT NULL DEFAULT '',
  description_vi TEXT NOT NULL DEFAULT '',
  params JSONB NOT NULL DEFAULT '[]'::jsonb,
  code TEXT NOT NULL DEFAULT '',
  status public.algorithm_status NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.community_algorithms ENABLE ROW LEVEL SECURITY;

-- Everyone can view approved algorithms
CREATE POLICY "Everyone can view approved algorithms"
ON public.community_algorithms
FOR SELECT
USING (status = 'approved'::algorithm_status);

-- Users can view their own submissions
CREATE POLICY "Users can view own submissions"
ON public.community_algorithms
FOR SELECT
USING (auth.uid() = user_id);

-- Authenticated users can submit algorithms
CREATE POLICY "Authenticated users can submit algorithms"
ON public.community_algorithms
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own pending submissions
CREATE POLICY "Users can delete own pending submissions"
ON public.community_algorithms
FOR DELETE
USING (auth.uid() = user_id AND status = 'pending'::algorithm_status);

-- Admins can view all algorithms
CREATE POLICY "Admins can view all algorithms"
ON public.community_algorithms
FOR SELECT
USING (public.is_admin());

-- Admins can update all algorithms (approve/reject)
CREATE POLICY "Admins can update all algorithms"
ON public.community_algorithms
FOR UPDATE
USING (public.is_admin());

-- Admins can delete any algorithm
CREATE POLICY "Admins can delete any algorithm"
ON public.community_algorithms
FOR DELETE
USING (public.is_admin());

-- Trigger for updated_at
CREATE TRIGGER update_community_algorithms_updated_at
BEFORE UPDATE ON public.community_algorithms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
