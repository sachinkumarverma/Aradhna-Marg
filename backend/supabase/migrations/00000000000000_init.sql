-- ==========================================
-- ARADHNA MARG DATABASE SCHEMA
-- ==========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

CREATE TYPE content_status AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE ad_position AS ENUM ('HEADER', 'SIDEBAR', 'INLINE', 'BOTTOM', 'MOBILE_STICKY');

CREATE TABLE IF NOT EXISTS advertisements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  position TEXT NOT NULL,
  desktop_code text,
  tablet_code text,
  mobile_code text,
  status TEXT DEFAULT 'PUBLISHED'::content_status,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  priority integer DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_jobs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_name VARCHAR(255) NOT NULL,
  content_type VARCHAR(100) NOT NULL,
  action_type VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'PENDING'::character varying,
  progress integer DEFAULT 0,
  total_items integer DEFAULT 1,
  processed_items integer DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message text,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS article_bhajans (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id uuid UNIQUE REFERENCES articles(id) ON DELETE CASCADE,
  bhajan_id uuid UNIQUE REFERENCES bhajans(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS article_festivals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id uuid UNIQUE REFERENCES articles(id) ON DELETE CASCADE,
  festival_id uuid UNIQUE REFERENCES festivals(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS article_gods (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id uuid UNIQUE REFERENCES articles(id) ON DELETE CASCADE,
  god_id uuid UNIQUE REFERENCES gods(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS article_tags (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id uuid UNIQUE REFERENCES articles(id) ON DELETE CASCADE,
  tag_id uuid UNIQUE REFERENCES tags(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS articles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  excerpt text,
  content text,
  featured_image_id uuid REFERENCES media_files(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  author_id uuid REFERENCES authors(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'DRAFT'::content_status,
  featured boolean DEFAULT false,
  publish_date TIMESTAMPTZ,
  seo_title VARCHAR(255),
  seo_description text,
  view_count bigint DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  search_vector tsvector,
  title_en VARCHAR(255),
  excerpt_en text,
  content_en text,
  seo_title_en VARCHAR(255),
  seo_description_en text
);

CREATE TABLE IF NOT EXISTS authors (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  short_description text,
  photo text,
  website_url text,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'ACTIVE'::character varying,
  seo_title VARCHAR(255),
  seo_description text,
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS bhajan_gods (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  bhajan_id uuid UNIQUE REFERENCES bhajans(id) ON DELETE CASCADE,
  god_id uuid UNIQUE REFERENCES gods(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS bhajan_tags (
  bhajan_id uuid PRIMARY KEY REFERENCES bhajans(id) ON DELETE CASCADE,
  tag_id uuid PRIMARY KEY REFERENCES tags(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS bhajans (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  youtube_video_id VARCHAR(255) UNIQUE,
  title VARCHAR(255) NOT NULL,
  hindi_title VARCHAR(255),
  slug VARCHAR(255) UNIQUE NOT NULL,
  description text,
  lyrics text,
  clean_lyrics text,
  short_description text,
  thumbnail_url text,
  pdf_url text,
  embedded_video_url text,
  language VARCHAR(50) DEFAULT 'Hindi'::character varying,
  views bigint DEFAULT 0,
  reading_time integer DEFAULT 0,
  duration integer DEFAULT 0,
  status TEXT DEFAULT 'PUBLISHED'::content_status,
  published_date TIMESTAMPTZ,
  seo_title VARCHAR(255),
  seo_description text,
  meta_keywords text,
  canonical_url text,
  open_graph_image text,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  god_id uuid REFERENCES gods(id) ON DELETE CASCADE,
  festival_id uuid REFERENCES festivals(id) ON DELETE CASCADE,
  author_id uuid REFERENCES authors(id) ON DELETE CASCADE,
  popularity_score numeric DEFAULT 0,
  ai_generated_flag boolean DEFAULT false,
  manual_override_flag boolean DEFAULT false,
  search_vector tsvector,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  original_youtube_url text,
  seo_keywords text,
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description text,
  image_url text,
  icon_url text,
  seo_title VARCHAR(255),
  seo_description text,
  display_order integer DEFAULT 0,
  status TEXT DEFAULT 'PUBLISHED'::content_status,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  show_in_navigation boolean DEFAULT false,
  is_featured boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS content_translations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_type VARCHAR(50) UNIQUE NOT NULL,
  content_id uuid UNIQUE NOT NULL,
  source_language VARCHAR(10) NOT NULL,
  target_language VARCHAR(10) UNIQUE NOT NULL,
  title VARCHAR(255),
  excerpt text,
  description text,
  content text,
  festival_details text,
  seo_title VARCHAR(255),
  seo_description text,
  provider VARCHAR(50),
  translation_status VARCHAR(50) DEFAULT 'NOT_TRANSLATED'::character varying,
  source_version integer DEFAULT 1,
  translated_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cron_job_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_name VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  duration_ms integer,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS deities (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  short_description text,
  image text,
  display_order integer DEFAULT 0,
  featured boolean DEFAULT false,
  status VARCHAR(20) DEFAULT 'ACTIVE'::character varying,
  seo_title VARCHAR(255),
  seo_description text,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  created_by uuid,
  updated_by uuid
);

CREATE TABLE IF NOT EXISTS festival_articles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  festival_id uuid UNIQUE REFERENCES festivals(id) ON DELETE CASCADE,
  article_id uuid UNIQUE REFERENCES articles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS festival_bhajans (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  festival_id uuid UNIQUE REFERENCES festivals(id) ON DELETE CASCADE,
  bhajan_id uuid UNIQUE REFERENCES bhajans(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS festivals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  short_description text,
  banner_image text,
  festival_date date,
  end_date date,
  seo_title VARCHAR(255),
  seo_description text,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  name_en VARCHAR(255),
  short_description_en text,
  content_en text,
  seo_title_en VARCHAR(255),
  seo_description_en text,
  content text,
  category text,
  featured boolean DEFAULT false,
  status text DEFAULT 'Draft'::text
);

CREATE TABLE IF NOT EXISTS gods (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description text,
  image_url text,
  banner_url text,
  color_theme VARCHAR(50),
  seo_title VARCHAR(255),
  seo_description text,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS media_files (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  folder_id uuid REFERENCES media_folders(id) ON DELETE CASCADE,
  mime_type VARCHAR(100) NOT NULL,
  size_bytes bigint NOT NULL,
  url text NOT NULL,
  thumbnail_url text,
  dimensions VARCHAR(50),
  storage_path text NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS media_folders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  parent_id uuid REFERENCES media_folders(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS page_views (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_type VARCHAR(100),
  slug VARCHAR(255),
  ip_hash VARCHAR(255),
  country VARCHAR(100),
  city VARCHAR(100),
  device VARCHAR(100),
  browser VARCHAR(100),
  referrer text,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pdf_generation_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  bhajan_id uuid REFERENCES bhajans(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL,
  storage_path text,
  generation_time_ms integer,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS puranas (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  short_description text,
  cover_image text,
  pdf_file text,
  language VARCHAR(100),
  author VARCHAR(255),
  status TEXT DEFAULT 'DRAFT'::content_status,
  seo_title VARCHAR(255),
  seo_description text,
  view_count bigint DEFAULT 0,
  download_count bigint DEFAULT 0,
  display_order integer DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  created_by uuid,
  updated_by uuid,
  title_en VARCHAR(255),
  description_en text,
  seo_title_en VARCHAR(255),
  seo_description_en text
);

CREATE TABLE IF NOT EXISTS related_articles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id uuid UNIQUE REFERENCES articles(id) ON DELETE CASCADE,
  related_id uuid UNIQUE REFERENCES articles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS related_bhajans (
  bhajan_id uuid PRIMARY KEY REFERENCES bhajans(id) ON DELETE CASCADE,
  related_bhajan_id uuid PRIMARY KEY REFERENCES bhajans(id) ON DELETE CASCADE,
  similarity_score numeric DEFAULT 0
);

CREATE TABLE IF NOT EXISTS search_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  search_term VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45),
  country VARCHAR(100),
  device VARCHAR(100),
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seo_generation_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  bhajan_id uuid REFERENCES bhajans(id) ON DELETE CASCADE,
  ai_model VARCHAR(100),
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_name VARCHAR(255) NOT NULL DEFAULT 'Aradhna Marg'::character varying,
  logo_url text,
  favicon_url text,
  theme VARCHAR(50) DEFAULT 'default'::character varying,
  google_analytics_id VARCHAR(50),
  google_adsense_id VARCHAR(50),
  youtube_channel_id VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  social_links jsonb DEFAULT '{}'::jsonb,
  default_seo jsonb DEFAULT '{}'::jsonb,
  is_singleton boolean UNIQUE DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  site_description text,
  site_logo text,
  favicon text,
  default_language VARCHAR(50) DEFAULT 'en'::character varying,
  default_theme VARCHAR(50) DEFAULT 'light'::character varying,
  copyright_text text,
  timezone VARCHAR(50) DEFAULT 'UTC'::character varying,
  date_format VARCHAR(50) DEFAULT 'MM/DD/YYYY'::character varying,
  contact_address text,
  whatsapp_number VARCHAR(50),
  facebook_url VARCHAR(255),
  instagram_url VARCHAR(255),
  youtube_url VARCHAR(255),
  twitter_url VARCHAR(255),
  linkedin_url VARCHAR(255),
  youtube_channel_url VARCHAR(255),
  youtube_auto_sync boolean DEFAULT false,
  youtube_sync_interval VARCHAR(50) DEFAULT 'daily'::character varying,
  youtube_incremental_sync boolean DEFAULT true,
  seo_site_title VARCHAR(255),
  seo_meta_description text,
  seo_meta_keywords text,
  seo_robots VARCHAR(100) DEFAULT 'index, follow'::character varying,
  seo_canonical_domain VARCHAR(255),
  seo_og_image text,
  google_search_console VARCHAR(255),
  microsoft_clarity VARCHAR(255),
  enable_analytics boolean DEFAULT false,
  enable_ads boolean DEFAULT false,
  ad_top_banner text,
  ad_inline text,
  ad_sidebar text,
  ad_footer text,
  maintenance_mode boolean DEFAULT false,
  enable_registration boolean DEFAULT false,
  enable_comments boolean DEFAULT false,
  enable_cache boolean DEFAULT true,
  enable_pdf_generation boolean DEFAULT false,
  youtube_last_sync TIMESTAMPTZ,
  youtube_next_sync TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  description text,
  color VARCHAR(50),
  status VARCHAR(20) DEFAULT 'ACTIVE'::character varying,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  created_by uuid,
  updated_by uuid
);

CREATE TABLE IF NOT EXISTS youtube_sync_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id VARCHAR(255) NOT NULL,
  video_id VARCHAR(255),
  status VARCHAR(50) NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_message text
);

CREATE TABLE IF NOT EXISTS youtube_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_video_id text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  thumbnail text,
  youtube_url text,
  published_at TIMESTAMPTZ,
  duration text,
  channel_id text,
  channel_name text,
  view_count integer DEFAULT 0,
  like_count integer DEFAULT 0,
  tags ARRAY,
  playlist text,
  import_status text DEFAULT 'NEW'::text,
  linked_bhajan_id uuid REFERENCES bhajans(id) ON DELETE CASCADE,
  last_synced TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

