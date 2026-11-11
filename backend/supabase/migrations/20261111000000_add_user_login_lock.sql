-- Migration: Persist user login lock state for security review and admin unlocks
-- Date: 2026-11-11

ALTER TABLE users ADD COLUMN IF NOT EXISTS login_failed_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS login_locked_until TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_login_locked_until ON users(login_locked_until);
