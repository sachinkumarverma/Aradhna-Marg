-- Migration: create_pwa_installs
-- Description: Records real-time PWA application installation events

CREATE TABLE IF NOT EXISTS pwa_installs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform VARCHAR(20) NOT NULL,
    user_agent TEXT,
    ip_hash VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pwa_installs_created_at ON pwa_installs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pwa_installs_platform ON pwa_installs (platform);
