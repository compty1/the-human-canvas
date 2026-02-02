-- Add start_date and end_date to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS end_date DATE;

-- Create lead_search_profiles table for skills-based lead discovery
CREATE TABLE IF NOT EXISTS lead_search_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  skills TEXT[] DEFAULT '{}',
  terms TEXT[] DEFAULT '{}',
  industries TEXT[] DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on lead_search_profiles
ALTER TABLE lead_search_profiles ENABLE ROW LEVEL SECURITY;

-- Admin can manage search profiles
CREATE POLICY "Admin can manage search profiles" 
ON lead_search_profiles FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));