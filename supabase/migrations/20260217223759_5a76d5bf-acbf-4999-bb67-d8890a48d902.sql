
ALTER TABLE artwork ADD COLUMN images text[] DEFAULT '{}'::text[];

ALTER TABLE ai_conversations 
  ADD COLUMN entity_type text,
  ADD COLUMN entity_id uuid;
