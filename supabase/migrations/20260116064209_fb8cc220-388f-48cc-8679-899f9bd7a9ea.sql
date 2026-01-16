-- Create function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create chatbot Q&A table
CREATE TABLE public.chatbot_qa (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  keywords TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chatbot_qa ENABLE ROW LEVEL SECURITY;

-- Everyone can read active Q&A
CREATE POLICY "Everyone can read active Q&A" 
ON public.chatbot_qa 
FOR SELECT 
USING (is_active = true);

-- Only admins can manage Q&A
CREATE POLICY "Admins can manage Q&A" 
ON public.chatbot_qa 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_chatbot_qa_updated_at
BEFORE UPDATE ON public.chatbot_qa
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();