-- Migration: Add persistent translation cache and monthly quota tracking

CREATE TABLE IF NOT EXISTS translation_cache (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  text_hash VARCHAR(64) UNIQUE NOT NULL,
  source_lang VARCHAR(10) NOT NULL,
  target_lang VARCHAR(10) NOT NULL,
  format VARCHAR(10) DEFAULT 'text' NOT NULL,
  source_text text NOT NULL,
  translated_text text NOT NULL,
  character_count integer NOT NULL,
  provider VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_translation_cache_hash ON translation_cache(text_hash);

CREATE TABLE IF NOT EXISTS translation_usage (
  month VARCHAR(7) PRIMARY KEY, -- 'YYYY-MM'
  characters_used bigint DEFAULT 0 NOT NULL,
  translations_count integer DEFAULT 0 NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

