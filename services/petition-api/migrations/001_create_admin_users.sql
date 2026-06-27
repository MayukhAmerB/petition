-- 001_create_admin_users.sql
-- Create table for administration dashboard users

CREATE TABLE IF NOT EXISTS admin_users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username    TEXT NOT NULL UNIQUE,
    pass_hash   TEXT NOT NULL,         -- bcrypt hash
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
