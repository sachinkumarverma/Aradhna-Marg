import path from 'path';
import fs from 'fs';
import { spawnSync } from 'child_process';
import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment from backend/.env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const rawDbUrl = process.env.DATABASE_URL;

if (!rawDbUrl) {
  console.error('❌ Error: DATABASE_URL is not set in backend/.env');
  process.exit(1);
}

// Convert transaction pooler port (6543) to session pooler port (5432) for pg_dump and long queries
const sessionDbUrl = rawDbUrl.replace(':6543/', ':5432/');

const rootDir = path.resolve(__dirname, '../../../');
const backupsBaseDir = path.join(rootDir, 'backups');

const now = new Date();
const timestampStr = now.toISOString().replace(/T/, '_').replace(/\..+/, '').replace(/:/g, '-');

const backupDir = path.join(backupsBaseDir, `backup_${timestampStr}`);
const jsonDir = path.join(backupDir, 'json');
const sqlDir = path.join(backupDir, 'sql');

fs.mkdirSync(jsonDir, { recursive: true });
fs.mkdirSync(sqlDir, { recursive: true });

async function runBackup() {
  console.log(`=======================================================`);
  console.log(`🛡️  Aradhna Marg - Supabase Database Backup`);
  console.log(`📅 Timestamp: ${now.toISOString()}`);
  console.log(`📂 Output Directory: ${backupDir}`);
  console.log(`=======================================================\n`);

  // Connect via session pooler port (5432) with generous timeout
  const pool = new Pool({
    connectionString: sessionDbUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 30000,
    statement_timeout: 60000
  });

  try {
    // 1. Check DB Connection and Version
    console.log('📡 Step 1: Connecting to PostgreSQL / Supabase...');
    const versionRes = await pool.query('SELECT version()');
    const dbVersion = versionRes.rows[0].version;
    console.log(`✅ Connected successfully!`);
    console.log(`   Engine: ${dbVersion}\n`);

    // 2. Discover Public Tables & Row Counts
    console.log('📋 Step 2: Discovering public schema tables...');
    const tablesRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      ORDER BY table_name ASC;
    `);

    const tableNames = tablesRes.rows.map((r: { table_name: string }) => r.table_name);
    console.log(`   Found ${tableNames.length} tables in 'public' schema.\n`);

    // 3. PostgreSQL SQL Dumps via Docker pg_dump 17
    console.log('🗄️  Step 3: Creating PostgreSQL SQL dumps using pg_dump 17...');

    const runDockerPgDumpToFile = (args: string[], outputFileName: string, label: string) => {
      console.log(`   Generating ${label}...`);
      const t0 = Date.now();
      const outputPath = path.join(sqlDir, outputFileName);

      // Mount the sql directory into container at /out so pg_dump writes directly to disk
      const cmdArgs = [
        'run',
        '--rm',
        '-v',
        `${sqlDir}:/out`,
        '-e',
        `DB_URL=${sessionDbUrl}`,
        'postgres:17-alpine',
        'sh',
        '-c',
        `pg_dump "$DB_URL" ${args.join(' ')} -f /out/${outputFileName}`
      ];

      const res = spawnSync('docker', cmdArgs, {
        stdio: 'inherit'
      });

      if (res.status !== 0) {
        console.error(`   ❌ Failed to generate ${label} (exit code ${res.status})`);
        return false;
      }

      if (fs.existsSync(outputPath)) {
        const sizeMb = (fs.statSync(outputPath).size / (1024 * 1024)).toFixed(2);
        console.log(
          `   ✅ ${label} saved: ${outputFileName} (${sizeMb} MB) in ${((Date.now() - t0) / 1000).toFixed(1)}s`
        );
        return true;
      }
      return false;
    };

    // A. Schema Only (DDL)
    runDockerPgDumpToFile(
      ['--schema=public', '--schema-only', '--no-owner', '--no-privileges', '--quote-all-identifiers'],
      'schema.sql',
      'Schema DDL (schema.sql)'
    );

    // B. Data Only (SQL Inserts)
    runDockerPgDumpToFile(
      ['--schema=public', '--data-only', '--inserts', '--no-owner', '--no-privileges'],
      'data.sql',
      'Data Inserts (data.sql)'
    );

    // C. Full Backup (DDL + Data)
    runDockerPgDumpToFile(
      ['--schema=public', '--no-owner', '--no-privileges', '--quote-all-identifiers'],
      'full_backup.sql',
      'Complete Backup (full_backup.sql)'
    );

    // D. Storage Schema & Metadata Dump
    runDockerPgDumpToFile(
      ['--schema=storage', '--no-owner', '--no-privileges'],
      'storage_backup.sql',
      'Storage Backup (storage_backup.sql)'
    );

    // 4. Export Tables to JSON (Focusing on Devotional & Content Entities)
    console.log('\n📦 Step 4: Exporting table data to human-readable JSON...');
    const tableSummary: Record<string, { rows: number; sizeBytes: number }> = {};
    let totalPublicRows = 0;

    for (const table of tableNames) {
      try {
        const countRes = await pool.query(`SELECT COUNT(*) FROM "${table}"`);
        const rowCount = parseInt(countRes.rows[0].count, 10);
        totalPublicRows += rowCount;

        // For massive internal agent execution logs (>500 rows with huge JSON blobs), limit or export summary for readability
        // Note: The FULL data is already completely preserved in data.sql and full_backup.sql
        const isHugeLogTable = ['agent_tool_calls', 'agent_runs'].includes(table);
        const query = isHugeLogTable
          ? `SELECT * FROM "${table}" ORDER BY created_at DESC LIMIT 200`
          : `SELECT * FROM "${table}"`;

        const rowsRes = await pool.query(query);
        const rows = rowsRes.rows;
        const filePath = path.join(jsonDir, `${table}.json`);
        fs.writeFileSync(filePath, JSON.stringify(rows, null, 2), 'utf8');

        const stat = fs.statSync(filePath);
        tableSummary[table] = {
          rows: rowCount,
          sizeBytes: stat.size
        };

        const note = isHugeLogTable ? ` (latest ${rows.length} rows; all ${rowCount} in SQL)` : '';
        console.log(
          `   ✓ ${table.padEnd(28)} : ${rowCount.toString().padStart(6)} rows (${(stat.size / 1024).toFixed(1)} KB)${note}`
        );
      } catch (err: any) {
        console.warn(`   ⚠️ Warning: Failed to export table "${table}": ${err.message}`);
      }
    }

    // Storage metadata export
    try {
      const storageBucketsRes = await pool.query('SELECT * FROM storage.buckets');
      const bucketsPath = path.join(jsonDir, 'storage_buckets.json');
      fs.writeFileSync(bucketsPath, JSON.stringify(storageBucketsRes.rows, null, 2), 'utf8');
      tableSummary['storage.buckets'] = {
        rows: storageBucketsRes.rows.length,
        sizeBytes: fs.statSync(bucketsPath).size
      };
      console.log(`   ✓ storage.buckets              : ${storageBucketsRes.rows.length.toString().padStart(6)} rows`);
    } catch {
      // non-fatal
    }

    try {
      const storageObjectsRes = await pool.query('SELECT * FROM storage.objects');
      const objectsPath = path.join(jsonDir, 'storage_objects.json');
      fs.writeFileSync(objectsPath, JSON.stringify(storageObjectsRes.rows, null, 2), 'utf8');
      tableSummary['storage.objects'] = {
        rows: storageObjectsRes.rows.length,
        sizeBytes: fs.statSync(objectsPath).size
      };
      console.log(`   ✓ storage.objects              : ${storageObjectsRes.rows.length.toString().padStart(6)} rows`);
    } catch {
      // non-fatal
    }

    // 5. Generate Manifest / Summary
    console.log('\n📝 Step 5: Generating backup summary and restore guide...');

    const summary = {
      backupTimestamp: now.toISOString(),
      backupFolder: path.basename(backupDir),
      databaseVersion: dbVersion,
      totalPublicTables: tableNames.length,
      totalPublicRows,
      tableBreakdown: tableSummary,
      files: {
        sql: {
          schema: 'sql/schema.sql',
          data: 'sql/data.sql',
          fullBackup: 'sql/full_backup.sql',
          storageBackup: 'sql/storage_backup.sql'
        },
        jsonDirectory: 'json/'
      }
    };

    fs.writeFileSync(path.join(backupDir, 'summary.json'), JSON.stringify(summary, null, 2), 'utf8');

    // 6. Generate Restore Guide
    const restoreGuide = `# Aradhna Marg Database Backup & Recovery Guide

**Backup Timestamp:** ${now.toISOString()}  
**Database Engine:** ${dbVersion}  
**Public Tables Backed Up:** ${tableNames.length}  
**Total Records:** ${totalPublicRows}

---

## 📁 Backup Contents

\`\`\`
${path.basename(backupDir)}/
├── summary.json                  # Complete table breakdown and row counts
├── RESTORE_GUIDE.md              # This recovery guide
├── sql/
│   ├── full_backup.sql           # Complete schema + all data (Public schema)
│   ├── schema.sql                # DDL only (Tables, views, sequences, triggers)
│   ├── data.sql                  # Data only (INSERT statements)
│   └── storage_backup.sql        # Supabase storage schema & metadata
└── json/                         # Table-by-table human-readable JSON exports
    ├── bhajans.json              # All devotional bhajans (${tableSummary['bhajans']?.rows || 0} rows)
    ├── articles.json             # All bilingual articles (${tableSummary['articles']?.rows || 0} rows)
    ├── festivals.json            # All festival entries (${tableSummary['festivals']?.rows || 0} rows)
    ├── puranas.json              # All purana metadata (${tableSummary['puranas']?.rows || 0} rows)
    ├── deities.json              # Deities catalog (${tableSummary['deities']?.rows || 0} rows)
    ├── categories.json           # Content categories (${tableSummary['categories']?.rows || 0} rows)
    ├── tags.json                 # Master tags (${tableSummary['tags']?.rows || 0} rows)
    ├── settings.json             # System & site settings (${tableSummary['settings']?.rows || 0} rows)
    ├── youtube_videos.json       # YouTube media (${tableSummary['youtube_videos']?.rows || 0} rows)
    └── ...                       # All junction & log tables
\`\`\`

---

## 🚀 How to Restore

### Option 1: Full Database Restore (Docker / psql)

To restore the complete public schema and data into your Supabase database or a new PostgreSQL instance:

\`\`\`bash
# From repository root using Docker:
docker run --rm -v "$(pwd)/backups/${path.basename(backupDir)}/sql:/sql" -e DB_URL="$DATABASE_URL" postgres:17-alpine sh -c 'psql "$DB_URL" -f /sql/full_backup.sql'
\`\`\`

Or directly with \`psql\` (if installed locally):
\`\`\`bash
psql "$DATABASE_URL" -f backups/${path.basename(backupDir)}/sql/full_backup.sql
\`\`\`

---

### Option 2: Restore Only Schema or Only Data

- **To recreate tables and schema only:**
  \`\`\`bash
  docker run --rm -v "$(pwd)/backups/${path.basename(backupDir)}/sql:/sql" -e DB_URL="$DATABASE_URL" postgres:17-alpine sh -c 'psql "$DB_URL" -f /sql/schema.sql'
  \`\`\`

- **To restore data into existing tables:**
  \`\`\`bash
  docker run --rm -v "$(pwd)/backups/${path.basename(backupDir)}/sql:/sql" -e DB_URL="$DATABASE_URL" postgres:17-alpine sh -c 'psql "$DB_URL" -f /sql/data.sql'
  \`\`\`

---

### Option 3: Restore a Single Table or Recover Deleted Items

If an accidental deletion occurs for a specific table (e.g. \`bhajans\` or \`articles\`), you do NOT need to wipe your entire database:

1. **Inspect the JSON file directly:**
   Open \`json/bhajans.json\` or \`json/articles.json\` in your editor to locate the deleted record.
2. **Restore via SQL data dump:**
   \`\`\`bash
   # Extract only the INSERT statements for the table:
   grep -E '^INSERT INTO "?public"?\\."?bhajans"?' backups/${path.basename(backupDir)}/sql/data.sql > restore_bhajans.sql
   psql "$DATABASE_URL" -f restore_bhajans.sql
   \`\`\`

---

## 🔄 Taking Future Backups

To create a new backup at any time, run:

\`\`\`bash
# From project root:
npm run db:backup

# Or from backend directory:
npm run db:backup --prefix backend
\`\`\`
`;

    fs.writeFileSync(path.join(backupDir, 'RESTORE_GUIDE.md'), restoreGuide, 'utf8');

    // 7. Update 'latest' pointer
    const latestDir = path.join(backupsBaseDir, 'latest');
    try {
      if (fs.existsSync(latestDir)) {
        fs.rmSync(latestDir, { recursive: true, force: true });
      }
      fs.cpSync(backupDir, latestDir, { recursive: true });
      console.log(`   Updated backups/latest copy.`);
    } catch (e: any) {
      console.warn(`   Note: Could not update latest link: ${e.message}`);
    }

    console.log(`\n🎉 Backup Completed Successfully!`);
    console.log(`📍 Saved at: ${backupDir}`);
  } finally {
    await pool.end();
  }
}

runBackup().catch((err) => {
  console.error('\n❌ Backup failed with error:', err);
  process.exit(1);
});
