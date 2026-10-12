import fs from 'fs';
import path from 'path';
import { db } from '../common/database/DatabaseClient';

async function runMigration() {
  const migrationPath = path.join(__dirname, '../../supabase/migrations/20261011000000_create_agent_foundation.sql');
  console.log(`Reading migration file: ${migrationPath}`);
  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log('Executing migration on database...');
  await db.query(sql);
  console.log('✓ Migration executed successfully!');
  process.exit(0);
}

runMigration().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
