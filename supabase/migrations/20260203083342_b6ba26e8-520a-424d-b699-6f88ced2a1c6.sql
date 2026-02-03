-- Add images array column to life_periods for multi-image gallery support
ALTER TABLE life_periods ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';