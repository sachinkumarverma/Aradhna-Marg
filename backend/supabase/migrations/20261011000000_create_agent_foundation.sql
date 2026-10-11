-- ==========================================
-- AGENT FOUNDATION & AUDIT SCHEMA
-- ADR 006: Agentic AI Permission Boundaries
-- ==========================================

-- 1. Agent Runs: Tracks every discrete agent execution lifecycle
CREATE TABLE IF NOT EXISTS agent_runs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_name VARCHAR(100) NOT NULL,
  trigger_type VARCHAR(50) NOT NULL, -- 'MANUAL', 'CRON', 'EVENT', 'WORKFLOW'
  triggered_by VARCHAR(100),          -- Admin username or system identifier
  status VARCHAR(50) NOT NULL DEFAULT 'RUNNING', -- 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'
  iteration_count integer DEFAULT 0,
  total_tokens_used integer DEFAULT 0,
  estimated_cost_usd numeric(8, 4) DEFAULT 0,
  error_message text,
  state jsonb DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_runs_name_status ON agent_runs(agent_name, status);
CREATE INDEX IF NOT EXISTS idx_agent_runs_created_at ON agent_runs(created_at DESC);

-- 2. Agent Tool Calls: Immutable audit trail of every tool invocation
CREATE TABLE IF NOT EXISTS agent_tool_calls (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id uuid NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
  tool_name VARCHAR(100) NOT NULL,
  permission_tier VARCHAR(50) NOT NULL, -- e.g. 'TIER_1_READ', 'TIER_3_PROPOSE'
  input_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  output_payload jsonb,
  duration_ms integer NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL, -- 'SUCCESS', 'FAILED', 'BLOCKED', 'PROPOSAL_STAGED'
  error_message text,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_tool_calls_run_id ON agent_tool_calls(run_id);
CREATE INDEX IF NOT EXISTS idx_agent_tool_calls_tool_name ON agent_tool_calls(tool_name);
CREATE INDEX IF NOT EXISTS idx_agent_tool_calls_created_at ON agent_tool_calls(created_at DESC);

-- 3. Agent Proposals: Staging area for mutations requiring human approval
CREATE TABLE IF NOT EXISTS agent_proposals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id uuid REFERENCES agent_runs(id) ON DELETE SET NULL,
  agent_name VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,  -- 'bhajan', 'article', 'festival', 'puran', 'category'
  entity_id uuid NOT NULL,
  target_field VARCHAR(100) NOT NULL, -- 'seo_title', 'seo_description', 'short_description', 'excerpt', 'status', etc.
  current_value text,
  proposed_value text NOT NULL,
  reasoning text,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED', 'APPLIED'
  reviewed_by VARCHAR(100),
  reviewed_at TIMESTAMPTZ,
  rejection_reason text,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_proposals_status ON agent_proposals(status);
CREATE INDEX IF NOT EXISTS idx_agent_proposals_entity ON agent_proposals(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_agent_proposals_created_at ON agent_proposals(created_at DESC);
