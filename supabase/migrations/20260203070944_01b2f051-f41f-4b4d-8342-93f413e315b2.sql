-- Add images array column to inspirations for multi-image support
ALTER TABLE inspirations ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';