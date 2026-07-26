-- ==========================================
-- ARADHNA MARG DATABASE SCHEMA
-- ==========================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For advanced text search if needed

-- 2. ENUMS
CREATE TYPE content_status AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE ad_position AS ENUM ('HEADER', 'SIDEBAR', 'INLINE', 'BOTTOM', 'MOBILE_STICKY');

-- ==========================================
-- 3. CORE TABLES (No Foreign Dependencies)
-- ==========================================

-- CATEGORIES
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    icon_url TEXT,
    seo_title VARCHAR(255),
    seo_description TEXT,
    display_order INTEGER DEFAULT 0,
    status content_status DEFAULT 'PUBLISHED',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- GODS
CREATE TABLE gods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    banner_url TEXT,
    color_theme VARCHAR(50),
    seo_title VARCHAR(255),
    seo_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- FESTIVALS
CREATE TABLE festivals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    start_date DATE,
    end_date DATE,
    seo_title VARCHAR(255),
    seo_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AUTHORS
CREATE TABLE authors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    biography TEXT,
    photo_url TEXT,
    website_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TAGS
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ADVERTISEMENTS
CREATE TABLE advertisements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    position ad_position NOT NULL,
    desktop_code TEXT,
    tablet_code TEXT,
    mobile_code TEXT,
    status content_status DEFAULT 'PUBLISHED',
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SETTINGS (Singleton Pattern via constraint)
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_name VARCHAR(255) NOT NULL DEFAULT 'Aradhna Marg',
    logo_url TEXT,
    favicon_url TEXT,
    theme VARCHAR(50) DEFAULT 'default',
    google_analytics_id VARCHAR(50),
    google_adsense_id VARCHAR(50),
    youtube_channel_id VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    social_links JSONB DEFAULT '{}',
    default_seo JSONB DEFAULT '{}',
    is_singleton BOOLEAN DEFAULT TRUE UNIQUE CHECK (is_singleton),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 4. BHAJANS TABLE (Main Entity)
-- ==========================================
CREATE TABLE bhajans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    youtube_video_id VARCHAR(255) UNIQUE, -- Nullable if not from YouTube
    title VARCHAR(255) NOT NULL,
    hindi_title VARCHAR(255),
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    lyrics TEXT,
    clean_lyrics TEXT,
    short_description TEXT,
    thumbnail_url TEXT,
    pdf_url TEXT,
    embedded_video_url TEXT,
    language VARCHAR(50) DEFAULT 'Hindi',
    views BIGINT DEFAULT 0,
    reading_time INTEGER DEFAULT 0, -- in seconds
    duration INTEGER DEFAULT 0, -- in seconds (video duration)
    status content_status DEFAULT 'PUBLISHED',
    published_date TIMESTAMPTZ,
    seo_title VARCHAR(255),
    seo_description TEXT,
    meta_keywords TEXT,
    canonical_url TEXT,
    open_graph_image TEXT,
    category_id UUID REFERENCES categories(id) ON DELETE RESTRICT,
    god_id UUID REFERENCES gods(id) ON DELETE RESTRICT,
    festival_id UUID REFERENCES festivals(id) ON DELETE SET NULL,
    author_id UUID REFERENCES authors(id) ON DELETE SET NULL,
    popularity_score NUMERIC DEFAULT 0,
    ai_generated_flag BOOLEAN DEFAULT FALSE,
    manual_override_flag BOOLEAN DEFAULT FALSE,
    search_vector tsvector,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 5. JUNCTION & RELATED TABLES
-- ==========================================

-- BHAJAN TAGS
CREATE TABLE bhajan_tags (
    bhajan_id UUID REFERENCES bhajans(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (bhajan_id, tag_id)
);

-- RELATED BHAJANS
CREATE TABLE related_bhajans (
    bhajan_id UUID REFERENCES bhajans(id) ON DELETE CASCADE,
    related_bhajan_id UUID REFERENCES bhajans(id) ON DELETE CASCADE,
    similarity_score NUMERIC DEFAULT 0,
    PRIMARY KEY (bhajan_id, related_bhajan_id),
    CHECK (bhajan_id != related_bhajan_id)
);

-- ==========================================
-- 6. LOGS & ANALYTICS TABLES
-- ==========================================

CREATE TABLE youtube_sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_id VARCHAR(255) NOT NULL,
    video_id VARCHAR(255),
    status VARCHAR(50) NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    error_message TEXT
);

CREATE TABLE pdf_generation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bhajan_id UUID REFERENCES bhajans(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    storage_path TEXT,
    generation_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE seo_generation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bhajan_id UUID REFERENCES bhajans(id) ON DELETE CASCADE,
    ai_model VARCHAR(100),
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE search_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    search_term VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    country VARCHAR(100),
    device VARCHAR(100),
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE page_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_type VARCHAR(100),
    slug VARCHAR(255),
    ip_hash VARCHAR(255),
    country VARCHAR(100),
    city VARCHAR(100),
    device VARCHAR(100),
    browser VARCHAR(100),
    referrer TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE cron_job_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    duration_ms INTEGER,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    finished_at TIMESTAMPTZ
);

-- ==========================================
-- 7. INDEXES
-- ==========================================
-- B-Tree for fast exact matches and ordering
CREATE INDEX idx_bhajans_slug ON bhajans(slug);
CREATE INDEX idx_bhajans_video_id ON bhajans(youtube_video_id);
CREATE INDEX idx_bhajans_category ON bhajans(category_id);
CREATE INDEX idx_bhajans_god ON bhajans(god_id);
CREATE INDEX idx_bhajans_festival ON bhajans(festival_id);
CREATE INDEX idx_bhajans_status ON bhajans(status);
CREATE INDEX idx_bhajans_published ON bhajans(published_date DESC);
CREATE INDEX idx_bhajans_views ON bhajans(views DESC);
CREATE INDEX idx_bhajans_popularity ON bhajans(popularity_score DESC);

-- GIN Index for Full Text Search
CREATE INDEX idx_bhajans_fts ON bhajans USING GIN(search_vector);

-- Indexes for page views scaling
CREATE INDEX idx_page_views_slug ON page_views(slug, timestamp);
CREATE INDEX idx_search_logs_term ON search_logs(search_term);

-- ==========================================
-- 8. FUNCTIONS & TRIGGERS
-- ==========================================

-- Function: Auto-update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER trg_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_gods_updated_at BEFORE UPDATE ON gods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_festivals_updated_at BEFORE UPDATE ON festivals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_authors_updated_at BEFORE UPDATE ON authors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_advertisements_updated_at BEFORE UPDATE ON advertisements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_bhajans_updated_at BEFORE UPDATE ON bhajans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Full Text Search Vector Generation
CREATE OR REPLACE FUNCTION bhajans_search_vector_trigger()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.hindi_title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.clean_lyrics, NEW.lyrics, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bhajans_fts
BEFORE INSERT OR UPDATE OF title, hindi_title, description, lyrics, clean_lyrics
ON bhajans
FOR EACH ROW
EXECUTE FUNCTION bhajans_search_vector_trigger();

-- Function: Generate Unique Slug
CREATE OR REPLACE FUNCTION generate_unique_slug(target_slug text, table_name text)
RETURNS text AS $$
DECLARE
    final_slug text := target_slug;
    counter integer := 2;
    slug_exists boolean;
BEGIN
    LOOP
        EXECUTE format('SELECT EXISTS(SELECT 1 FROM %I WHERE slug = $1)', table_name)
        INTO slug_exists USING final_slug;
        
        IF NOT slug_exists THEN
            RETURN final_slug;
        END IF;
        
        final_slug := target_slug || '-' || counter;
        counter := counter + 1;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function: Increment Views
CREATE OR REPLACE FUNCTION increment_bhajan_views(bhajan_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE bhajans SET views = views + 1 WHERE id = bhajan_uuid;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 9. VIEWS
-- ==========================================

CREATE OR REPLACE VIEW view_latest_bhajans AS
SELECT id, title, slug, thumbnail_url, published_date, views
FROM bhajans
WHERE status = 'PUBLISHED'
ORDER BY published_date DESC;

CREATE OR REPLACE VIEW view_popular_bhajans AS
SELECT id, title, slug, thumbnail_url, published_date, views, popularity_score
FROM bhajans
WHERE status = 'PUBLISHED'
ORDER BY popularity_score DESC, views DESC;

CREATE OR REPLACE VIEW view_recently_synced AS
SELECT id, title, slug, youtube_video_id, created_at
FROM bhajans
WHERE youtube_video_id IS NOT NULL
ORDER BY created_at DESC;

-- ==========================================
-- 10. MATERIALIZED VIEWS
-- ==========================================

-- Trending Bhajans (High views in last 7 days)
CREATE MATERIALIZED VIEW mv_trending_bhajans AS
SELECT b.id, b.title, b.slug, b.thumbnail_url, COUNT(pv.id) as recent_views
FROM bhajans b
LEFT JOIN page_views pv ON pv.slug = b.slug AND pv.timestamp >= NOW() - INTERVAL '7 days'
WHERE b.status = 'PUBLISHED'
GROUP BY b.id
ORDER BY recent_views DESC
WITH DATA;

CREATE UNIQUE INDEX idx_mv_trending_bhajans_id ON mv_trending_bhajans(id);

-- Popular Categories
CREATE MATERIALIZED VIEW mv_popular_categories AS
SELECT c.id, c.name, c.slug, c.image_url, SUM(b.views) as total_category_views
FROM categories c
JOIN bhajans b ON b.category_id = c.id
WHERE c.status = 'PUBLISHED' AND b.status = 'PUBLISHED'
GROUP BY c.id
ORDER BY total_category_views DESC
WITH DATA;

CREATE UNIQUE INDEX idx_mv_popular_categories_id ON mv_popular_categories(id);

-- Function to refresh Materialized Views
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_trending_bhajans;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_popular_categories;
END;
$$ LANGUAGE plpgsql;
