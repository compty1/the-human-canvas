-- Phase 3: Add case_study column to experiments table
ALTER TABLE public.experiments ADD COLUMN IF NOT EXISTS case_study TEXT;

-- Phase 5 & 6: Create content review status enum and add review/scheduling columns
DO $$ BEGIN
    CREATE TYPE public.content_review_status AS ENUM ('draft', 'pending_review', 'approved', 'scheduled', 'published', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add review/scheduling columns to articles
ALTER TABLE public.articles 
ADD COLUMN IF NOT EXISTS review_status public.content_review_status DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reviewer_notes TEXT;

-- Add review/scheduling columns to updates
ALTER TABLE public.updates 
ADD COLUMN IF NOT EXISTS review_status public.content_review_status DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reviewer_notes TEXT;

-- Add review/scheduling columns to projects
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS review_status public.content_review_status DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reviewer_notes TEXT;

-- Add review/scheduling columns to experiments
ALTER TABLE public.experiments 
ADD COLUMN IF NOT EXISTS review_status public.content_review_status DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reviewer_notes TEXT;

-- Add review/scheduling columns to product_reviews
ALTER TABLE public.product_reviews 
ADD COLUMN IF NOT EXISTS review_status public.content_review_status DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reviewer_notes TEXT;

-- Phase 7: Enhance leads table for comprehensive lead management
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS lead_type TEXT DEFAULT 'work',
ADD COLUMN IF NOT EXISTS estimated_pay NUMERIC,
ADD COLUMN IF NOT EXISTS work_description TEXT,
ADD COLUMN IF NOT EXISTS benefits TEXT[],
ADD COLUMN IF NOT EXISTS contact_person TEXT,
ADD COLUMN IF NOT EXISTS contact_title TEXT,
ADD COLUMN IF NOT EXISTS is_accepted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS suggested_services TEXT[];

-- Create lead_plans table for managing accepted lead projects
CREATE TABLE IF NOT EXISTS public.lead_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  timeline TEXT,
  steps JSONB DEFAULT '[]'::jsonb,
  ai_suggestions JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'draft',
  estimated_hours NUMERIC,
  estimated_cost NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on lead_plans
ALTER TABLE public.lead_plans ENABLE ROW LEVEL SECURITY;

-- RLS policies for lead_plans (admin only)
CREATE POLICY "Admin can view lead_plans" ON public.lead_plans
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can insert lead_plans" ON public.lead_plans
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update lead_plans" ON public.lead_plans
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete lead_plans" ON public.lead_plans
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Add trigger for updating updated_at on lead_plans
CREATE TRIGGER update_lead_plans_updated_at
  BEFORE UPDATE ON public.lead_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();