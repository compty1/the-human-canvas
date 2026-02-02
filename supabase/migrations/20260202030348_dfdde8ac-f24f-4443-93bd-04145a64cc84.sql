-- Add new columns for enhanced media favorites
ALTER TABLE favorites ADD COLUMN streaming_links JSONB DEFAULT '{}';
ALTER TABLE favorites ADD COLUMN media_subtype TEXT;
ALTER TABLE favorites ADD COLUMN release_year INTEGER;
ALTER TABLE favorites ADD COLUMN season_count INTEGER;
ALTER TABLE favorites ADD COLUMN album_name TEXT;
ALTER TABLE favorites ADD COLUMN artist_name TEXT;