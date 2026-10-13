import fs from 'fs';
import path from 'path';
import { db } from '../common/database/DatabaseClient';

async function runMigration() {
  const dir = path.join(__dirname, '../../supabase/migrations');
  const files = [
    '20261013000000_create_payments_foundation.sql',
    '20261013010000_harden_payments_and_reconciliation.sql',
    '20261013020000_update_reconciliation_status_constraint.sql'
  ];

  for (const file of files) {
    const migrationPath = path.join(dir, file);
    console.log(`Reading migration file: ${migrationPath}`);
    const sql = fs.readFileSync(migrationPath, 'utf8');
    console.log(`Executing ${file} on database...`);
    await db.query(sql);
    console.log(`✓ ${file} executed successfully!`);
  }

  process.exit(0);
}

runMigration().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
