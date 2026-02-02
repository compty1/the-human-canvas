-- ==================================================
-- PHASE 1: Create experiences table
-- ==================================================
CREATE TABLE public.experiences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL, -- 'creative', 'business', 'technical', 'service', 'other'
  subcategory TEXT,
  description TEXT,
  long_description TEXT,
  image_url TEXT,
  screenshots TEXT[] DEFAULT '{}',
  
  -- Time period
  start_date DATE,
  end_date DATE,
  is_ongoing BOOLEAN DEFAULT false,
  
  -- Skills and tools
  skills_used TEXT[] DEFAULT '{}',
  tools_used TEXT[] DEFAULT '{}',
  
  -- Outcomes
  key_achievements TEXT[] DEFAULT '{}',
  lessons_learned TEXT[] DEFAULT '{}',
  challenges_overcome TEXT[] DEFAULT '{}',
  
  -- Metrics
  clients_served INTEGER,
  revenue_generated NUMERIC(10,2),
  projects_completed INTEGER,
  
  -- Admin
  admin_notes TEXT,
  order_index INTEGER DEFAULT 0,
  published BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;

-- Public read access for published experiences
CREATE POLICY "Public can view published experiences" 
  ON public.experiences 
  FOR SELECT 
  USING (published = true);

-- Admin full access
CREATE POLICY "Admins can manage experiences" 
  ON public.experiences 
  FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Update trigger
CREATE TRIGGER update_experiences_updated_at
  BEFORE UPDATE ON public.experiences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ==================================================
-- PHASE 2: Create certifications table
-- ==================================================
CREATE TABLE public.certifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  issuer TEXT NOT NULL,
  category TEXT, -- 'technical', 'creative', 'business', 'health'
  description TEXT,
  image_url TEXT,
  
  -- Status
  status TEXT DEFAULT 'planned', -- 'earned', 'in_progress', 'planned', 'wanted'
  earned_date DATE,
  expiration_date DATE,
  credential_url TEXT,
  credential_id TEXT,
  
  -- Funding
  estimated_cost NUMERIC(10,2),
  funded_amount NUMERIC(10,2) DEFAULT 0,
  funding_enabled BOOLEAN DEFAULT true,
  
  -- Skills
  skills TEXT[] DEFAULT '{}',
  
  -- Admin
  admin_notes TEXT,
  order_index INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public can view certifications" 
  ON public.certifications 
  FOR SELECT 
  USING (true);

-- Admin full access
CREATE POLICY "Admins can manage certifications" 
  ON public.certifications 
  FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Update trigger
CREATE TRIGGER update_certifications_updated_at
  BEFORE UPDATE ON public.certifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ==================================================
-- PHASE 3: Add childhood roots columns to favorites
-- ==================================================
ALTER TABLE public.favorites 
  ADD COLUMN IF NOT EXISTS is_childhood_root BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS childhood_age_range TEXT,
  ADD COLUMN IF NOT EXISTS childhood_impact TEXT;

-- ==================================================
-- PHASE 4: Add financial tracking to projects
-- ==================================================
ALTER TABLE public.projects 
  ADD COLUMN IF NOT EXISTS expenses JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS income_data JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS analytics_notes TEXT;