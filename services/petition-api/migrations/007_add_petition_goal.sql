-- 007_add_petition_goal.sql
-- Add goal column to petitions table
ALTER TABLE petitions ADD COLUMN goal INT NOT NULL DEFAULT 5000;
