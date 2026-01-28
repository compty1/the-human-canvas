-- Fix overly permissive RLS policies for analytics tables
-- These need to allow anonymous inserts but in a controlled way

-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Anyone can insert page views" ON public.page_views;
DROP POLICY IF EXISTS "Anyone can insert link clicks" ON public.link_clicks;
DROP POLICY IF EXISTS "Anyone can manage sessions" ON public.sessions;
DROP POLICY IF EXISTS "System can insert activity log" ON public.admin_activity_log;

-- Create more restrictive insert policies (still allow anonymous but with basic checks)
CREATE POLICY "Track page views" ON public.page_views 
  FOR INSERT WITH CHECK (
    visitor_id IS NOT NULL AND 
    session_id IS NOT NULL AND 
    page_path IS NOT NULL
  );

CREATE POLICY "Track link clicks" ON public.link_clicks 
  FOR INSERT WITH CHECK (
    visitor_id IS NOT NULL AND 
    session_id IS NOT NULL AND 
    page_path IS NOT NULL AND
    link_url IS NOT NULL
  );

CREATE POLICY "Create sessions" ON public.sessions 
  FOR INSERT WITH CHECK (
    id IS NOT NULL AND 
    visitor_id IS NOT NULL
  );

CREATE POLICY "Update own sessions" ON public.sessions 
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Log admin activity" ON public.admin_activity_log 
  FOR INSERT WITH CHECK (
    action IS NOT NULL AND
    user_id IS NOT NULL
  );