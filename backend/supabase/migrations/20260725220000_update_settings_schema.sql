-- Update Settings table for full schema

-- General
ALTER TABLE settings ADD COLUMN IF NOT EXISTS site_description TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS site_logo TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS favicon TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS default_language VARCHAR(50) DEFAULT 'en';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS default_theme VARCHAR(50) DEFAULT 'light';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS copyright_text TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS date_format VARCHAR(50) DEFAULT 'MM/DD/YYYY';

-- Contact
ALTER TABLE settings ADD COLUMN IF NOT EXISTS contact_address TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(50);

-- Social (Some might be inside social_links JSON, but let's add explicitly if requested)
ALTER TABLE settings ADD COLUMN IF NOT EXISTS facebook_url VARCHAR(255);
ALTER TABLE settings ADD COLUMN IF NOT EXISTS instagram_url VARCHAR(255);
ALTER TABLE settings ADD COLUMN IF NOT EXISTS youtube_url VARCHAR(255);
ALTER TABLE settings ADD COLUMN IF NOT EXISTS twitter_url VARCHAR(255);
ALTER TABLE settings ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(255);

-- YouTube Automation
ALTER TABLE settings ADD COLUMN IF NOT EXISTS youtube_channel_url VARCHAR(255);
ALTER TABLE settings ADD COLUMN IF NOT EXISTS youtube_auto_sync BOOLEAN DEFAULT false;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS youtube_sync_interval VARCHAR(50) DEFAULT 'daily';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS youtube_incremental_sync BOOLEAN DEFAULT true;

-- AI Settings
ALTER TABLE settings ADD COLUMN IF NOT EXISTS groq_api_key TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS ai_default_model VARCHAR(100) DEFAULT 'mixtral-8x7b-32768';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS ai_temperature NUMERIC DEFAULT 0.7;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS ai_max_tokens INTEGER DEFAULT 2048;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS enable_ai BOOLEAN DEFAULT false;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS ai_retry_count INTEGER DEFAULT 3;

-- SEO
ALTER TABLE settings ADD COLUMN IF NOT EXISTS seo_site_title VARCHAR(255);
ALTER TABLE settings ADD COLUMN IF NOT EXISTS seo_meta_description TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS seo_meta_keywords TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS seo_robots VARCHAR(100) DEFAULT 'index, follow';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS seo_canonical_domain VARCHAR(255);
ALTER TABLE settings ADD COLUMN IF NOT EXISTS seo_og_image TEXT;

-- Analytics
ALTER TABLE settings ADD COLUMN IF NOT EXISTS google_search_console VARCHAR(255);
ALTER TABLE settings ADD COLUMN IF NOT EXISTS microsoft_clarity VARCHAR(255);
ALTER TABLE settings ADD COLUMN IF NOT EXISTS enable_analytics BOOLEAN DEFAULT false;

-- Reading
ALTER TABLE settings ADD COLUMN IF NOT EXISTS reading_default_font_size VARCHAR(50) DEFAULT 'medium';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS reading_default_theme VARCHAR(50) DEFAULT 'light';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS reading_auto_scroll_speed INTEGER DEFAULT 1;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS reading_mode BOOLEAN DEFAULT true;

-- Advertisement
ALTER TABLE settings ADD COLUMN IF NOT EXISTS enable_ads BOOLEAN DEFAULT false;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS ad_top_banner TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS ad_inline TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS ad_sidebar TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS ad_footer TEXT;

-- System
ALTER TABLE settings ADD COLUMN IF NOT EXISTS maintenance_mode BOOLEAN DEFAULT false;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS enable_registration BOOLEAN DEFAULT false;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS enable_comments BOOLEAN DEFAULT false;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS enable_cache BOOLEAN DEFAULT true;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS enable_pdf_generation BOOLEAN DEFAULT false;
