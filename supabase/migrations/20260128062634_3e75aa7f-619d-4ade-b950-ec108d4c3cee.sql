-- Create enums for new tables
CREATE TYPE public.content_type AS ENUM ('text', 'rich_text', 'image', 'json');
CREATE TYPE public.note_category AS ENUM ('brand', 'marketing', 'content', 'traffic', 'ideas');
CREATE TYPE public.note_status AS ENUM ('idea', 'planned', 'in_progress', 'done');
CREATE TYPE public.lead_status AS ENUM ('new', 'contacted', 'responded', 'converted', 'archived');
CREATE TYPE public.search_status AS ENUM ('pending', 'completed', 'failed');

-- Analytics: Page Views
CREATE TABLE public.page_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_path TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  time_on_page_seconds INTEGER DEFAULT 0,
  referrer TEXT,
  user_agent TEXT,
  country TEXT,
  city TEXT,
  device_type TEXT,
  screen_size TEXT
);

-- Analytics: Link Clicks
CREATE TABLE public.link_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_path TEXT NOT NULL,
  link_url TEXT NOT NULL,
  link_text TEXT,
  visitor_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Analytics: Sessions
CREATE TABLE public.sessions (
  id TEXT PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  pages_viewed INTEGER DEFAULT 1,
  entry_page TEXT,
  exit_page TEXT,
  country TEXT,
  city TEXT
);

-- Site Content Management
CREATE TABLE public.site_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_key TEXT NOT NULL UNIQUE,
  content_type public.content_type NOT NULL DEFAULT 'text',
  content_value TEXT,
  is_draft BOOLEAN DEFAULT false,
  draft_value TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  notes TEXT
);

-- Admin Notes
CREATE TABLE public.admin_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category public.note_category NOT NULL DEFAULT 'ideas',
  title TEXT NOT NULL,
  content TEXT,
  priority INTEGER DEFAULT 0,
  related_project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  status public.note_status DEFAULT 'idea',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Leads
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  company TEXT,
  email TEXT,
  website TEXT,
  linkedin TEXT,
  industry TEXT,
  company_size TEXT,
  location TEXT,
  match_score INTEGER DEFAULT 0,
  match_reasons TEXT[],
  source TEXT,
  status public.lead_status DEFAULT 'new',
  notes TEXT,
  last_contacted TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lead Searches
CREATE TABLE public.lead_searches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  search_query TEXT,
  filters JSONB,
  results_count INTEGER DEFAULT 0,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status public.search_status DEFAULT 'pending'
);

-- Admin Activity Log
CREATE TABLE public.admin_activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add draft fields to existing content tables
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS draft_content JSONB;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS next_steps TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS last_saved_draft TIMESTAMPTZ;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS screenshots TEXT[];
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS features TEXT[];
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS color_palette TEXT[];
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS case_study TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS problem_statement TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS solution_summary TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS results_metrics JSONB;

ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS draft_content JSONB;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS next_steps TEXT;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS last_saved_draft TIMESTAMPTZ;

ALTER TABLE public.updates ADD COLUMN IF NOT EXISTS draft_content JSONB;
ALTER TABLE public.updates ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE public.updates ADD COLUMN IF NOT EXISTS next_steps TEXT;
ALTER TABLE public.updates ADD COLUMN IF NOT EXISTS last_saved_draft TIMESTAMPTZ;

ALTER TABLE public.artwork ADD COLUMN IF NOT EXISTS draft_content JSONB;
ALTER TABLE public.artwork ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Enable RLS on all new tables
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.link_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for analytics (anyone can insert, only admin can read)
CREATE POLICY "Anyone can insert page views" ON public.page_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view page views" ON public.page_views FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can insert link clicks" ON public.link_clicks FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view link clicks" ON public.link_clicks FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can manage sessions" ON public.sessions FOR ALL USING (true);
CREATE POLICY "Admins can view all sessions" ON public.sessions FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- RLS for admin-only tables
CREATE POLICY "Admins can manage site content" ON public.site_content FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage admin notes" ON public.admin_notes FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage leads" ON public.leads FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage lead searches" ON public.lead_searches FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view activity log" ON public.admin_activity_log FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "System can insert activity log" ON public.admin_activity_log FOR INSERT WITH CHECK (true);

-- Trigger to auto-assign admin role to shanealecompte@gmail.com
CREATE OR REPLACE FUNCTION public.auto_assign_admin_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email = 'shanealecompte@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_assign_admin_role();

-- Update timestamp triggers
CREATE TRIGGER update_site_content_updated_at BEFORE UPDATE ON public.site_content
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_admin_notes_updated_at BEFORE UPDATE ON public.admin_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();