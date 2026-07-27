-- Festivals Table
CREATE TABLE IF NOT EXISTS festivals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    short_description TEXT,
    content TEXT,
    banner_image TEXT,
    festival_date DATE,
    category TEXT,
    featured BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'Draft',
    seo_title TEXT,
    seo_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Junction table for Festival <-> Bhajans
CREATE TABLE IF NOT EXISTS festival_bhajans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    festival_id UUID REFERENCES festivals(id) ON DELETE CASCADE,
    bhajan_id UUID REFERENCES bhajans(id) ON DELETE CASCADE,
    UNIQUE(festival_id, bhajan_id)
);

-- Junction table for Festival <-> Articles
CREATE TABLE IF NOT EXISTS festival_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    festival_id UUID REFERENCES festivals(id) ON DELETE CASCADE,
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    UNIQUE(festival_id, article_id)
);
