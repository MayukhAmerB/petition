-- 006_add_petition_image.sql
-- Add optional columns for image upload support to petitions table
ALTER TABLE petitions ADD COLUMN IF NOT EXISTS image_data TEXT;
ALTER TABLE petitions ADD COLUMN IF NOT EXISTS eye_label TEXT;
