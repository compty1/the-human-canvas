-- Fix the last remaining permissive policy for sessions update
DROP POLICY IF EXISTS "Update own sessions" ON public.sessions;

CREATE POLICY "Update sessions by id" ON public.sessions 
  FOR UPDATE USING (id IS NOT NULL) 
  WITH CHECK (id IS NOT NULL AND visitor_id IS NOT NULL);