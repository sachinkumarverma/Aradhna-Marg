-- ========================================================
-- FINANCIAL HARDENING & RECONCILIATION MIGRATION
-- ========================================================

-- 1. Unique index on gateway_order_id to prevent duplicate order records
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_gateway_order_id_unique
ON payments(gateway_order_id)
WHERE gateway_order_id IS NOT NULL;

-- 2. Payment Refunds table for detailed tracking of partial and full refunds
CREATE TABLE IF NOT EXISTS payment_refunds (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id uuid NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  gateway_refund_id VARCHAR(255),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  status VARCHAR(50) NOT NULL DEFAULT 'PROCESSED' CHECK (
    status IN ('PENDING', 'PROCESSED', 'FAILED')
  ),
  reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_refunds_payment_id ON payment_refunds(payment_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_refunds_gateway_refund_id ON payment_refunds(gateway_refund_id) WHERE gateway_refund_id IS NOT NULL;

-- 3. Webhook idempotency events table to prevent duplicate processing of gateway events
CREATE TABLE IF NOT EXISTS payment_webhook_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id VARCHAR(255) NOT NULL UNIQUE,
  event_type VARCHAR(100) NOT NULL,
  gateway_payment_id VARCHAR(255),
  gateway_order_id VARCHAR(255),
  payload_summary JSONB DEFAULT '{}'::jsonb,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_webhook_events_payment_id ON payment_webhook_events(gateway_payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_webhook_events_processed_at ON payment_webhook_events(processed_at DESC);

-- 4. Financial Audit Trail table
CREATE TABLE IF NOT EXISTS payment_audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id uuid REFERENCES payments(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  actor_type VARCHAR(50) NOT NULL DEFAULT 'SYSTEM' CHECK (
    actor_type IN ('ADMIN', 'GATEWAY_WEBHOOK', 'SYSTEM')
  ),
  actor_id VARCHAR(100),
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_audit_logs_payment_id ON payment_audit_logs(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_audit_logs_action ON payment_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_payment_audit_logs_created_at ON payment_audit_logs(created_at DESC);

-- 5. Gateway Reconciliation runs table
CREATE TABLE IF NOT EXISTS payment_reconciliations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  status VARCHAR(50) NOT NULL DEFAULT 'RECONCILED' CHECK (
    status IN ('RECONCILED', 'MISMATCH')
  ),
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  records_checked INTEGER NOT NULL DEFAULT 0,
  mismatches_count INTEGER NOT NULL DEFAULT 0,
  local_count INTEGER NOT NULL DEFAULT 0,
  local_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  gateway_count INTEGER NOT NULL DEFAULT 0,
  gateway_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  difference NUMERIC(12, 2) NOT NULL DEFAULT 0,
  discrepancies JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  performed_by VARCHAR(100) DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_reconciliations_created_at ON payment_reconciliations(created_at DESC);
