-- Drop the existing check constraint
ALTER TABLE favorites DROP CONSTRAINT favorites_type_check;

-- Add updated check constraint with show and podcast types
ALTER TABLE favorites ADD CONSTRAINT favorites_type_check 
CHECK (type = ANY (ARRAY['art'::text, 'movie'::text, 'article'::text, 'research'::text, 'music'::text, 'book'::text, 'creator'::text, 'other'::text, 'show'::text, 'podcast'::text]));