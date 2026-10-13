-- ========================================================
-- PAYMENTS & DONATIONS FOUNDATION SCHEMA
-- ========================================================

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  supporter_name VARCHAR(255),
  supporter_email VARCHAR(255),
  supporter_phone VARCHAR(50),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  status VARCHAR(50) NOT NULL DEFAULT 'CREATED' CHECK (
    status IN ('CREATED', 'PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED')
  ),
  payment_gateway VARCHAR(50) NOT NULL DEFAULT 'RAZORPAY',
  gateway_order_id VARCHAR(255),
  gateway_payment_id VARCHAR(255),
  gateway_signature VARCHAR(500),
  payment_method VARCHAR(50),
  is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
  source VARCHAR(100) NOT NULL DEFAULT 'WEBSITE_DONATION',
  notes TEXT,
  receipt_number VARCHAR(100),
  failure_reason TEXT,
  refund_amount NUMERIC(12, 2) DEFAULT 0,
  refund_reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  paid_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance and lookup indexes
CREATE INDEX IF NOT EXISTS idx_payments_gateway_order_id ON payments(gateway_order_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_gateway_payment_id ON payments(gateway_payment_id) WHERE gateway_payment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_supporter_email ON payments(supporter_email);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_paid_at ON payments(paid_at DESC);

-- Backward-compatible alias / view for donations
CREATE OR REPLACE VIEW donations AS SELECT * FROM payments;
