-- ==============================================================================
-- MIGRATION: 20261014030000_add_performance_indexes.sql
-- PURPOSE: High-performance B-tree and functional indexes for public queries & joins
-- TARGET: articles, bhajans, festivals, puranas, deities, categories, youtube, junction tables
-- ==============================================================================

-- 1. Articles Performance Indexes
CREATE INDEX IF NOT EXISTS idx_articles_status_deleted_featured 
  ON articles(status, deleted_at, featured DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_articles_slug 
  ON articles(slug);

CREATE INDEX IF NOT EXISTS idx_articles_category_status 
  ON articles(category_id, status, deleted_at);

CREATE INDEX IF NOT EXISTS idx_articles_author_status 
  ON articles(author_id, status, deleted_at);

CREATE INDEX IF NOT EXISTS idx_articles_featured_image 
  ON articles(featured_image_id);

CREATE INDEX IF NOT EXISTS idx_articles_id_text 
  ON articles((id::text));

CREATE INDEX IF NOT EXISTS idx_articles_published_lookup 
  ON articles(slug) 
  WHERE deleted_at IS NULL AND status = 'PUBLISHED';

-- 2. Bhajans Performance Indexes
CREATE INDEX IF NOT EXISTS idx_bhajans_status_deleted_popularity 
  ON bhajans(status, deleted_at, popularity_score DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bhajans_slug 
  ON bhajans(slug);

CREATE INDEX IF NOT EXISTS idx_bhajans_god_category 
  ON bhajans(god_id, category_id, status);

CREATE INDEX IF NOT EXISTS idx_bhajans_category_status 
  ON bhajans(category_id, status, deleted_at);

CREATE INDEX IF NOT EXISTS idx_bhajans_god_status 
  ON bhajans(god_id, status, deleted_at);

CREATE INDEX IF NOT EXISTS idx_bhajans_festival_status 
  ON bhajans(festival_id, status, deleted_at);

CREATE INDEX IF NOT EXISTS idx_bhajans_id_text 
  ON bhajans((id::text));

CREATE INDEX IF NOT EXISTS idx_bhajans_published_lookup 
  ON bhajans(slug) 
  WHERE deleted_at IS NULL AND status = 'PUBLISHED';

CREATE INDEX IF NOT EXISTS idx_bhajans_published_yt 
  ON bhajans(youtube_video_id) 
  WHERE deleted_at IS NULL AND status = 'PUBLISHED';

-- 3. Festivals Performance Indexes
CREATE INDEX IF NOT EXISTS idx_festivals_status_date 
  ON festivals(status, festival_date ASC NULLS LAST, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_festivals_slug 
  ON festivals(slug);

-- 4. Puranas Performance Indexes
CREATE INDEX IF NOT EXISTS idx_puranas_status_deleted_order 
  ON puranas(status, deleted_at, display_order ASC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_puranas_status_deleted_views 
  ON puranas(status, deleted_at, view_count DESC, created_at DESC);

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

CREATE INDEX IF NOT EXISTS idx_youtube_videos_id_text 
  ON youtube_videos((id::text));

-- 8. Junction Table Indexes for fast eager joins and inverse foreign key lookups
CREATE INDEX IF NOT EXISTS idx_article_gods_article 
  ON article_gods(article_id);

CREATE INDEX IF NOT EXISTS idx_article_gods_god 
  ON article_gods(god_id, article_id);

CREATE INDEX IF NOT EXISTS idx_article_festivals_article 
  ON article_festivals(article_id);

CREATE INDEX IF NOT EXISTS idx_article_festivals_festival 
  ON article_festivals(festival_id, article_id);

CREATE INDEX IF NOT EXISTS idx_article_bhajans_article 
  ON article_bhajans(article_id);

CREATE INDEX IF NOT EXISTS idx_article_bhajans_bhajan 
  ON article_bhajans(bhajan_id, article_id);

CREATE INDEX IF NOT EXISTS idx_article_tags_article 
  ON article_tags(article_id);

CREATE INDEX IF NOT EXISTS idx_article_tags_tag 
  ON article_tags(tag_id, article_id);

CREATE INDEX IF NOT EXISTS idx_bhajan_gods_bhajan 
  ON bhajan_gods(bhajan_id);

CREATE INDEX IF NOT EXISTS idx_bhajan_gods_god 
  ON bhajan_gods(god_id, bhajan_id);

CREATE INDEX IF NOT EXISTS idx_bhajan_tags_bhajan 
  ON bhajan_tags(bhajan_id);

CREATE INDEX IF NOT EXISTS idx_bhajan_tags_tag 
  ON bhajan_tags(tag_id, bhajan_id);

CREATE INDEX IF NOT EXISTS idx_festival_bhajans_festival 
  ON festival_bhajans(festival_id, bhajan_id);

CREATE INDEX IF NOT EXISTS idx_festival_bhajans_bhajan 
  ON festival_bhajans(bhajan_id, festival_id);

CREATE INDEX IF NOT EXISTS idx_festival_articles_festival 
  ON festival_articles(festival_id, article_id);

CREATE INDEX IF NOT EXISTS idx_festival_articles_article 
  ON festival_articles(article_id, festival_id);
