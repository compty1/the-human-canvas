ALTER TABLE client_projects
  ADD COLUMN project_type text NOT NULL DEFAULT 'web_design',
  ADD COLUMN type_metadata jsonb DEFAULT '{}'::jsonb;