
-- Knowledge Base entries table
CREATE TABLE public.knowledge_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  title TEXT NOT NULL,
  content TEXT,
  category TEXT DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.knowledge_entries ENABLE ROW LEVEL SECURITY;

-- Admin-only management
CREATE POLICY "Admins can manage knowledge entries"
ON public.knowledge_entries
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Public read access (for potential public knowledge display)
CREATE POLICY "Public can view knowledge entries"
ON public.knowledge_entries
FOR SELECT
USING (true);

-- Timestamp trigger
CREATE TRIGGER update_knowledge_entries_updated_at
BEFORE UPDATE ON public.knowledge_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
