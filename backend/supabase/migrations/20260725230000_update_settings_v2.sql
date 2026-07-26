-- Update Settings table for V2 architecture (removing secrets, adding providers/health)

-- Remove secrets
ALTER TABLE settings DROP COLUMN IF EXISTS groq_api_key;
ALTER TABLE settings DROP COLUMN IF EXISTS youtube_api_key;

-- Add AI Settings
ALTER TABLE settings ADD COLUMN IF NOT EXISTS ai_provider VARCHAR(50) DEFAULT 'Groq';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS prompt_version VARCHAR(50) DEFAULT '1.0';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS fallback_provider VARCHAR(50);

-- Add YouTube Sync Tracking
ALTER TABLE settings ADD COLUMN IF NOT EXISTS youtube_last_sync TIMESTAMP WITH TIME ZONE;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS youtube_next_sync TIMESTAMP WITH TIME ZONE;
