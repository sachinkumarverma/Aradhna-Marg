import fs from 'fs';
import path from 'path';
import { db } from '../common/database/DatabaseClient';

const migrationPath = path.join(__dirname, '../../supabase/migrations/20261111000000_add_user_login_lock.sql');

async function runMigration(): Promise<void> {
  console.log(`Reading migration file: ${migrationPath}`);
  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log('Applying user login lock migration...');
  await db.query(sql);
  console.log('User login lock migration applied successfully.');
  await db.close();
}

runMigration().catch(async (error) => {
  console.error('User login lock migration failed:', error);
  await db.close().catch(() => undefined);
  process.exitCode = 1;
});
