-- Create table for project analysis history
CREATE TABLE public.project_analysis_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_name TEXT NOT NULL,
  params JSONB NOT NULL,
  results JSONB NOT NULL,
  ai_analysis JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.project_analysis_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own analysis history"
ON public.project_analysis_history
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analysis history"
ON public.project_analysis_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analysis history"
ON public.project_analysis_history
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all analysis history"
ON public.project_analysis_history
FOR SELECT
USING (is_admin());

-- Trigger for updated_at
CREATE TRIGGER update_project_analysis_history_updated_at
BEFORE UPDATE ON public.project_analysis_history
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create table for news articles
CREATE TABLE public.news_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source TEXT NOT NULL,
  source_url TEXT,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  image_url TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  category TEXT NOT NULL DEFAULT 'news',
  language TEXT NOT NULL DEFAULT 'vi',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;

-- Create policies for news articles
CREATE POLICY "Everyone can view active news"
ON public.news_articles
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage news"
ON public.news_articles
FOR ALL
USING (is_admin());

-- Create index for better performance
CREATE INDEX idx_news_articles_category ON public.news_articles(category);
CREATE INDEX idx_news_articles_published_at ON public.news_articles(published_at DESC);
CREATE INDEX idx_news_articles_language ON public.news_articles(language);