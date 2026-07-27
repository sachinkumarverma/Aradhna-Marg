-- Add Original Youtube URL if we don't have it
ALTER TABLE bhajans ADD COLUMN IF NOT EXISTS original_youtube_url TEXT;
ALTER TABLE bhajans ADD COLUMN IF NOT EXISTS seo_keywords TEXT;
ALTER TABLE bhajans ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Create Junction Table for Additional Deities
CREATE TABLE IF NOT EXISTS bhajan_gods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bhajan_id UUID REFERENCES bhajans(id) ON DELETE CASCADE,
    god_id UUID REFERENCES gods(id) ON DELETE CASCADE,
    UNIQUE(bhajan_id, god_id)
);
