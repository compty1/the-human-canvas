-- Create updates table for microblog entries
CREATE TABLE public.updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT,
  excerpt TEXT,
  tags TEXT[],
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on updates
ALTER TABLE public.updates ENABLE ROW LEVEL SECURITY;

-- RLS policies for updates
CREATE POLICY "Published updates are viewable by everyone"
ON public.updates FOR SELECT
USING ((published = true) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage updates"
ON public.updates FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_updates_updated_at
BEFORE UPDATE ON public.updates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add featured_image column to articles table
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS featured_image TEXT;

-- Create storage bucket for content images
INSERT INTO storage.buckets (id, name, public)
VALUES ('content-images', 'content-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for content-images bucket
CREATE POLICY "Content images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'content-images');

CREATE POLICY "Admins can upload content images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'content-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update content images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'content-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete content images"
ON storage.objects FOR DELETE
USING (bucket_id = 'content-images' AND has_role(auth.uid(), 'admin'::app_role));