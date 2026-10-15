-- Migration: Add bilingual English meaning / description to bhajans table
ALTER TABLE bhajans ADD COLUMN IF NOT EXISTS short_description_en text;
ALTER TABLE bhajans ADD COLUMN IF NOT EXISTS description_en text;
