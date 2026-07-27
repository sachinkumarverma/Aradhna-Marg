-- Create Puranas Table
CREATE TABLE IF NOT EXISTS puranas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    short_description TEXT,
    cover_image TEXT,
    pdf_file TEXT,
    language VARCHAR(100),
    author VARCHAR(255),
    status content_status DEFAULT 'DRAFT',
    seo_title VARCHAR(255),
    seo_description TEXT,
    view_count BIGINT DEFAULT 0,
    download_count BIGINT DEFAULT 0,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_by UUID,
    updated_by UUID
);

CREATE INDEX idx_puranas_slug ON puranas(slug);
CREATE INDEX idx_puranas_language ON puranas(language);
CREATE INDEX idx_puranas_status ON puranas(status);
