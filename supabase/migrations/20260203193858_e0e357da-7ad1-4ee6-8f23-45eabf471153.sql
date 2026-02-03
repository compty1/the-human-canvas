-- Quick Entries for daily highlights
CREATE TABLE public.quick_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  mood TEXT,
  tags TEXT[],
  aggregated_to_update_id UUID REFERENCES updates(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quick_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin-only access
CREATE POLICY "Admins can manage quick entries"
  ON public.quick_entries
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Media Library
CREATE TABLE public.media_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  filename TEXT NOT NULL,
  alt_text TEXT,
  tags TEXT[],
  file_size INTEGER,
  width INTEGER,
  height INTEGER,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.media_library ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin-only access
CREATE POLICY "Admins can manage media library"
  ON public.media_library
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Content Templates
CREATE TABLE public.content_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  content_type TEXT NOT NULL,
  template_data JSONB NOT NULL DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.content_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin-only access
CREATE POLICY "Admins can manage content templates"
  ON public.content_templates
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Content Versions for version history
CREATE TABLE public.content_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL,
  content_id UUID NOT NULL,
  version_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.content_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin-only access
CREATE POLICY "Admins can manage content versions"
  ON public.content_versions
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Indexes for better performance
CREATE INDEX idx_quick_entries_created ON quick_entries(created_at DESC);
CREATE INDEX idx_media_library_tags ON media_library USING GIN(tags);
CREATE INDEX idx_content_versions_lookup ON content_versions(content_type, content_id, created_at DESC);
CREATE INDEX idx_content_templates_type ON content_templates(content_type);