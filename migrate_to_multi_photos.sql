-- Migrate from single image_url to multiple image_urls

-- 1. Add new column for multiple images
ALTER TABLE spots 
ADD COLUMN IF NOT EXISTS image_urls text[];

-- 2. Migrate existing data (convert single URL to array)
UPDATE spots 
SET image_urls = ARRAY[image_url]
WHERE image_url IS NOT NULL AND image_url != '';

-- 3. Drop old column (optional - comment out if you want to keep it temporarily)
-- ALTER TABLE spots DROP COLUMN image_url;

-- Note: If you want to keep the old column for backup, just leave it.
-- The app will use image_urls going forward.
