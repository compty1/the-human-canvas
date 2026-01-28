-- Fix user_roles RLS policy (was missing)
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Fix function search_path issues
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_like_count(p_type TEXT, p_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.likes
  WHERE likeable_type = p_type AND likeable_id = p_id
$$;