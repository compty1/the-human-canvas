-- Create funding_campaigns table for development, research, and supplies funding
CREATE TABLE public.funding_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_type TEXT NOT NULL CHECK (campaign_type IN ('development', 'research', 'supplies')),
  title TEXT NOT NULL,
  description TEXT,
  target_amount NUMERIC NOT NULL DEFAULT 0,
  raised_amount NUMERIC NOT NULL DEFAULT 0,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create supplies_needed table for equipment wishlist
CREATE TABLE public.supplies_needed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  product_url TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  funded_amount NUMERIC NOT NULL DEFAULT 0,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  category TEXT NOT NULL DEFAULT 'Equipment',
  status TEXT NOT NULL DEFAULT 'needed' CHECK (status IN ('needed', 'partially_funded', 'funded', 'purchased')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add new columns to projects table for enhanced content
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS architecture_notes TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS performance_notes TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS accessibility_notes TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS github_url TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS github_stats JSONB;

-- Enable RLS on new tables
ALTER TABLE public.funding_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplies_needed ENABLE ROW LEVEL SECURITY;

-- RLS policies for funding_campaigns
CREATE POLICY "Public can view active funding campaigns" 
ON public.funding_campaigns 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage funding campaigns" 
ON public.funding_campaigns 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for supplies_needed
CREATE POLICY "Public can view supplies" 
ON public.supplies_needed 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage supplies" 
ON public.supplies_needed 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update trigger for funding_campaigns
CREATE TRIGGER update_funding_campaigns_updated_at
BEFORE UPDATE ON public.funding_campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();