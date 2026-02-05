-- Add experimentation fields to experiences table
ALTER TABLE public.experiences 
ADD COLUMN IF NOT EXISTS is_experimentation BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS experimentation_goal TEXT;

-- Create email subscribers table
CREATE TABLE public.email_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  subscribed_at TIMESTAMPTZ DEFAULT now(),
  confirmed BOOLEAN DEFAULT false,
  confirmation_token UUID DEFAULT gen_random_uuid(),
  unsubscribed_at TIMESTAMPTZ,
  source TEXT DEFAULT 'website'
);

-- Enable RLS for email_subscribers
ALTER TABLE email_subscribers ENABLE ROW LEVEL SECURITY;

-- Anyone can subscribe (insert)
CREATE POLICY "Anyone can subscribe" ON email_subscribers 
  FOR INSERT WITH CHECK (true);

-- Admins can view all subscribers
CREATE POLICY "Admins can view subscribers" ON email_subscribers 
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Admins can manage subscribers
CREATE POLICY "Admins can manage subscribers" ON email_subscribers 
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Add updated_at trigger for subscribers
CREATE TRIGGER update_email_subscribers_updated_at
  BEFORE UPDATE ON public.email_subscribers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();