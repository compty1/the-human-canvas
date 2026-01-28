-- Sales data table for tracking sticker/art sales
CREATE TABLE public.sales_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period TEXT NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  units_sold INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.sales_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view sales data" ON public.sales_data FOR SELECT USING (true);
CREATE POLICY "Admin can manage sales data" ON public.sales_data FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Work logs table for time tracking
CREATE TABLE public.work_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  hours NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'development',
  week_number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.work_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can manage work logs" ON public.work_logs FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Public can view work logs" ON public.work_logs FOR SELECT USING (true);

-- Client projects table
CREATE TABLE public.client_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  project_name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  long_description TEXT,
  image_url TEXT,
  screenshots TEXT[] DEFAULT '{}',
  tech_stack TEXT[] DEFAULT '{}',
  features TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('completed', 'in_progress')),
  start_date DATE,
  end_date DATE,
  testimonial TEXT,
  testimonial_author TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.client_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view public client projects" ON public.client_projects FOR SELECT USING (is_public = true);
CREATE POLICY "Admin can manage client projects" ON public.client_projects FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_client_projects_updated_at
  BEFORE UPDATE ON public.client_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Favorites table for content the artist enjoys
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('art', 'movie', 'article', 'research', 'music', 'book', 'creator', 'other')),
  source_url TEXT,
  image_url TEXT,
  creator_name TEXT,
  creator_url TEXT,
  creator_location TEXT,
  description TEXT,
  impact_statement TEXT,
  is_current BOOLEAN DEFAULT false,
  discovered_date DATE,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view favorites" ON public.favorites FOR SELECT USING (true);
CREATE POLICY "Admin can manage favorites" ON public.favorites FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Inspirations table
CREATE TABLE public.inspirations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('person', 'concept', 'movement', 'experience')),
  description TEXT,
  detailed_content TEXT,
  image_url TEXT,
  related_links JSONB DEFAULT '[]',
  influence_areas TEXT[] DEFAULT '{}',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.inspirations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view inspirations" ON public.inspirations FOR SELECT USING (true);
CREATE POLICY "Admin can manage inspirations" ON public.inspirations FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Life periods/themes timeline table
CREATE TABLE public.life_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  description TEXT,
  detailed_content TEXT,
  themes TEXT[] DEFAULT '{}',
  key_works UUID[] DEFAULT '{}',
  image_url TEXT,
  is_current BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.life_periods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view life periods" ON public.life_periods FOR SELECT USING (true);
CREATE POLICY "Admin can manage life periods" ON public.life_periods FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Add columns to projects table for cost tracking
ALTER TABLE public.projects 
  ADD COLUMN IF NOT EXISTS money_spent NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS money_needed NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cost_breakdown JSONB DEFAULT '{}';