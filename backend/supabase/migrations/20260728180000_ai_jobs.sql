-- AI Jobs Table
CREATE TABLE IF NOT EXISTS ai_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL, -- e.g., 'Bhajans', 'Articles', 'Festivals'
    action_type VARCHAR(100) NOT NULL, -- e.g., 'GENERATE_SEO', 'GENERATE_SUMMARY'
    status VARCHAR(50) DEFAULT 'PENDING', -- 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'
    progress INTEGER DEFAULT 0,
    total_items INTEGER DEFAULT 1,
    processed_items INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to auto-update updated_at column
CREATE TRIGGER trg_ai_jobs_updated_at BEFORE UPDATE ON ai_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes for efficient querying
CREATE INDEX idx_ai_jobs_status ON ai_jobs(status);
CREATE INDEX idx_ai_jobs_created_at ON ai_jobs(created_at DESC);
