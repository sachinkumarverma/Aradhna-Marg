-- Remove AI and Reading columns from Settings table

-- AI Settings
ALTER TABLE settings DROP COLUMN IF EXISTS ai_provider;
ALTER TABLE settings DROP COLUMN IF EXISTS prompt_version;
ALTER TABLE settings DROP COLUMN IF EXISTS fallback_provider;
ALTER TABLE settings DROP COLUMN IF EXISTS ai_default_model;
ALTER TABLE settings DROP COLUMN IF EXISTS ai_temperature;
ALTER TABLE settings DROP COLUMN IF EXISTS ai_max_tokens;
ALTER TABLE settings DROP COLUMN IF EXISTS enable_ai;
ALTER TABLE settings DROP COLUMN IF EXISTS ai_retry_count;

-- Reading Settings
ALTER TABLE settings DROP COLUMN IF EXISTS reading_default_font_size;
ALTER TABLE settings DROP COLUMN IF EXISTS reading_default_theme;
ALTER TABLE settings DROP COLUMN IF EXISTS reading_auto_scroll_speed;
ALTER TABLE settings DROP COLUMN IF EXISTS reading_mode;
