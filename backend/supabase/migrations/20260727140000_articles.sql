-- Create Articles Table
CREATE TABLE IF NOT EXISTS articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT,
    featured_image_id UUID REFERENCES media_files(id) ON DELETE SET NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    author_id UUID REFERENCES authors(id) ON DELETE SET NULL,
    status content_status DEFAULT 'DRAFT',
    featured BOOLEAN DEFAULT FALSE,
    publish_date TIMESTAMPTZ,
    seo_title VARCHAR(255),
    seo_description TEXT,
    view_count BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    search_vector tsvector
);

-- Trigger for search vector
CREATE OR REPLACE FUNCTION articles_search_vector_trigger()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.excerpt, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_articles_fts
BEFORE INSERT OR UPDATE OF title, excerpt, content
ON articles
FOR EACH ROW
EXECUTE FUNCTION articles_search_vector_trigger();

CREATE INDEX idx_articles_fts ON articles USING GIN(search_vector);
CREATE INDEX idx_articles_slug ON articles(slug);
CREATE INDEX idx_articles_status ON articles(status);

-- Junction Tables
CREATE TABLE IF NOT EXISTS article_gods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    god_id UUID REFERENCES gods(id) ON DELETE CASCADE,
    UNIQUE(article_id, god_id)
);

CREATE TABLE IF NOT EXISTS article_festivals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    festival_id UUID REFERENCES festivals(id) ON DELETE CASCADE,
    UNIQUE(article_id, festival_id)
);

CREATE TABLE IF NOT EXISTS article_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    UNIQUE(article_id, tag_id)
);

CREATE TABLE IF NOT EXISTS article_bhajans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    bhajan_id UUID REFERENCES bhajans(id) ON DELETE CASCADE,
    UNIQUE(article_id, bhajan_id)
);

CREATE TABLE IF NOT EXISTS related_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    related_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    UNIQUE(article_id, related_id),
    CHECK (article_id != related_id)
);
