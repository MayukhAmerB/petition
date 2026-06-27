-- 004_create_otp_audit.sql
-- Create table for fraud detection and OTP auditing

CREATE TABLE IF NOT EXISTS otp_audit (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone        TEXT NOT NULL,
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    verified_at  TIMESTAMPTZ,
    ip_address   INET,
    success      BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_otp_audit_phone ON otp_audit(phone);
