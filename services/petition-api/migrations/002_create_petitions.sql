-- 002_create_petitions.sql
-- Create table for petitions

CREATE TABLE IF NOT EXISTS petitions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           TEXT NOT NULL,
    description     TEXT NOT NULL,
    terms           TEXT NOT NULL,       -- full T&C text
    created_by      UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    is_active       BOOLEAN DEFAULT TRUE,
    signature_count INT NOT NULL DEFAULT 0, -- cached count, synced from Redis periodically
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
