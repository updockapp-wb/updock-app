-- Add 'height' column for Dropstart
alter table spots 
add column if not exists height numeric;

-- Add 'difficulty' column
alter table spots 
add column if not exists difficulty text;

-- Add 'image_url' column just in case
alter table spots 
add column if not exists image_url text;

-- Ensure 'type' column is text (to store JSON array) or update it
-- Note: If 'type' exists as a different format, this might need care.
-- Assuming standard text column is fine for our JSON.stringify usage.
