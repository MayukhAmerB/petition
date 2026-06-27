-- 005_add_petition_image_url.sql
-- Optional image URL shown on public petition pages

ALTER TABLE petitions
    ADD COLUMN IF NOT EXISTS image_url TEXT;
