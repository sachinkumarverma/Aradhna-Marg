-- 1. Update Categories
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS show_in_navigation BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- 2. Update Tags
ALTER TABLE tags
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS color VARCHAR(50),
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ACTIVE',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS updated_by UUID;

-- Add updated_at trigger for tags
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_tags_updated_at') THEN
    CREATE TRIGGER trg_tags_updated_at BEFORE UPDATE ON tags FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- 3. Update Authors
-- Rename existing columns to match TS models
ALTER TABLE authors RENAME COLUMN photo_url TO photo;
ALTER TABLE authors RENAME COLUMN biography TO short_description;

ALTER TABLE authors
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ACTIVE',
ADD COLUMN IF NOT EXISTS seo_title VARCHAR(255),
ADD COLUMN IF NOT EXISTS seo_description TEXT,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 4. Create Deities (Replaces 'gods')
CREATE TABLE IF NOT EXISTS deities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    short_description TEXT,
    image TEXT,
    display_order INTEGER DEFAULT 0,
    featured BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    seo_title VARCHAR(255),
    seo_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_by UUID,
    updated_by UUID
);

CREATE TRIGGER trg_deities_updated_at BEFORE UPDATE ON deities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
