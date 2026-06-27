-- 003_create_signatures.sql
-- Create core table for signatures and associated optimization indexes

CREATE TABLE IF NOT EXISTS signatures (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    petition_id     UUID NOT NULL REFERENCES petitions(id) ON DELETE CASCADE,
    first_name      TEXT NOT NULL,
    last_name       TEXT NOT NULL,
    phone_number    TEXT NOT NULL,
    phone_verified  BOOLEAN DEFAULT FALSE,
    agreed_terms    BOOLEAN DEFAULT FALSE,
    signed_at       TIMESTAMPTZ DEFAULT NOW(),
    ip_address      INET,
    user_agent      TEXT
);

-- CRITICAL INDEXES
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_sig
    ON signatures(petition_id, phone_number);  -- Bottleneck 9: prevent duplicate signatures

CREATE INDEX IF NOT EXISTS idx_sig_petition
    ON signatures(petition_id);                -- Bottleneck 5: speed up admin list views

CREATE INDEX IF NOT EXISTS idx_sig_phone
    ON signatures(phone_number);               -- Bottleneck 5: speed up lookup of phone signatures
