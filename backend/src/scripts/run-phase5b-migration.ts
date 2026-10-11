import fs from 'fs';
import path from 'path';
import { db } from '../common/database/DatabaseClient';

async function runMigration() {
  const migrationPath = path.join(__dirname, '../../supabase/migrations/20261011010000_create_agent_schedules.sql');
  console.log(`Reading Phase 5B migration file: ${migrationPath}`);
  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log('Executing migration on database...');
  await db.query(sql);
  console.log('✓ Phase 5B migration executed successfully!');
  process.exit(0);
}

runMigration().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
