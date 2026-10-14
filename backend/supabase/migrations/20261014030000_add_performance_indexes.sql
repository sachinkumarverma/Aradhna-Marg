-- ==============================================================================
-- MIGRATION: 20261014030000_add_performance_indexes.sql
-- PURPOSE: High-performance B-tree indexes for public queries & joins
-- TARGET: articles, bhajans, festivals, puranas, deities, categories, youtube
-- ==============================================================================

-- 1. Articles Performance Indexes
CREATE INDEX IF NOT EXISTS idx_articles_status_deleted_featured 
  ON articles(status, deleted_at, featured DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_articles_slug 
  ON articles(slug);

CREATE INDEX IF NOT EXISTS idx_articles_category_status 
  ON articles(category_id, status);

CREATE INDEX IF NOT EXISTS idx_articles_author_status 
  ON articles(author_id, status);

-- 2. Bhajans Performance Indexes
CREATE INDEX IF NOT EXISTS idx_bhajans_status_deleted_popularity 
  ON bhajans(status, deleted_at, popularity_score DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bhajans_slug 
  ON bhajans(slug);

CREATE INDEX IF NOT EXISTS idx_bhajans_god_category 
  ON bhajans(god_id, category_id, status);

-- 3. Festivals Performance Indexes
CREATE INDEX IF NOT EXISTS idx_festivals_status_date 
  ON festivals(status, festival_date ASC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_festivals_slug 
  ON festivals(slug);

-- 4. Puranas Performance Indexes
CREATE INDEX IF NOT EXISTS idx_puranas_status_deleted_order 
  ON puranas(status, deleted_at, display_order ASC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_puranas_slug 
  ON puranas(slug);

-- 5. Deities Performance Indexes
CREATE INDEX IF NOT EXISTS idx_deities_status_order 
  ON deities(status, display_order ASC, name ASC);

CREATE INDEX IF NOT EXISTS idx_deities_slug 
  ON deities(slug);

-- 6. Categories Performance Indexes
CREATE INDEX IF NOT EXISTS idx_categories_status_order 
  ON categories(status, display_order ASC, name ASC);

CREATE INDEX IF NOT EXISTS idx_categories_slug 
  ON categories(slug);

-- 7. YouTube Videos Performance Indexes
CREATE INDEX IF NOT EXISTS idx_youtube_videos_status_published 
  ON youtube_videos(import_status, published_at DESC NULLS LAST, created_at DESC);

-- 8. Junction Table Indexes for fast eager joins
CREATE INDEX IF NOT EXISTS idx_article_gods_article 
  ON article_gods(article_id);

CREATE INDEX IF NOT EXISTS idx_article_festivals_article 
  ON article_festivals(article_id);

CREATE INDEX IF NOT EXISTS idx_article_bhajans_article 
  ON article_bhajans(article_id);

CREATE INDEX IF NOT EXISTS idx_article_tags_article 
  ON article_tags(article_id);

CREATE INDEX IF NOT EXISTS idx_bhajan_gods_bhajan 
  ON bhajan_gods(bhajan_id);

CREATE INDEX IF NOT EXISTS idx_bhajan_tags_bhajan 
  ON bhajan_tags(bhajan_id);
