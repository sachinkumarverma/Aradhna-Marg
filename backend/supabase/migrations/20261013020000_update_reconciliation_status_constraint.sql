-- ========================================================
-- UPDATE RECONCILIATION STATUS CONSTRAINT
-- ========================================================

ALTER TABLE payment_reconciliations DROP CONSTRAINT IF EXISTS payment_reconciliations_status_check;
ALTER TABLE payment_reconciliations ADD CONSTRAINT payment_reconciliations_status_check
  CHECK (status IN ('RECONCILED', 'MISMATCH', 'UNAVAILABLE', 'ERROR'));
