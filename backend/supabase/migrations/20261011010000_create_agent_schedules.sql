-- ==============================================================
-- PHASE 5B: SCHEDULED AUTONOMOUS MONITORING SCHEMA
-- ADR 007: Autonomous Read/Analyze Agent Infrastructure
-- ==============================================================

-- 1. Agent Schedules: Tracks autonomous monitoring schedule states and multi-instance concurrency locks
CREATE TABLE IF NOT EXISTS agent_schedules (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id VARCHAR(100) UNIQUE NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  cron_expression VARCHAR(100) NOT NULL,
  schedule_interval VARCHAR(50) NOT NULL, -- 'hourly', 'every_2_hours', 'every_6_hours', 'every_12_hours', 'daily', 'weekly'
  last_run_at TIMESTAMPTZ,
  last_run_status VARCHAR(50), -- 'COMPLETED', 'FAILED', 'SKIPPED'
  last_successful_run_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,
  last_error_message TEXT,
  consecutive_failures INTEGER NOT NULL DEFAULT 0,
  is_running BOOLEAN NOT NULL DEFAULT false,
  current_run_id uuid REFERENCES agent_runs(id) ON DELETE SET NULL,
  next_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE agent_schedules ADD COLUMN IF NOT EXISTS last_run_status VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_agent_schedules_agent_id ON agent_schedules(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_schedules_enabled ON agent_schedules(enabled);

-- 2. Seed Default Schedulable Read/Analyze Monitoring Agents
INSERT INTO agent_schedules (agent_id, enabled, cron_expression, schedule_interval, next_run_at)
VALUES 
  ('seo_audit_agent', true, '0 4 * * *', 'daily', NOW() + INTERVAL '1 day'),
  ('system_health_agent', true, '0 */6 * * *', 'every_6_hours', NOW() + INTERVAL '6 hours'),
  ('content_quality_agent', true, '0 4 * * 0', 'weekly', NOW() + INTERVAL '7 days')
ON CONFLICT (agent_id) DO NOTHING;
