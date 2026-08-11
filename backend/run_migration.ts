import { db } from './src/common/database/DatabaseClient';

async function run() {
  try {
    await db.query(`ALTER TABLE festivals RENAME COLUMN description TO short_description;`).catch(() => {});
    await db.query(`ALTER TABLE festivals RENAME COLUMN image_url TO banner_image;`).catch(() => {});
    await db.query(`ALTER TABLE festivals RENAME COLUMN start_date TO festival_date;`).catch(() => {});

    await db.query(`
      ALTER TABLE festivals 
      ADD COLUMN IF NOT EXISTS content TEXT,
      ADD COLUMN IF NOT EXISTS category TEXT,
      ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Draft',
      ADD COLUMN IF NOT EXISTS short_description_en TEXT,
      ADD COLUMN IF NOT EXISTS content_en TEXT,
      ADD COLUMN IF NOT EXISTS name_en VARCHAR(255),
      ADD COLUMN IF NOT EXISTS seo_title_en VARCHAR(255),
      ADD COLUMN IF NOT EXISTS seo_description_en TEXT;
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS festival_bhajans (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          festival_id UUID REFERENCES festivals(id) ON DELETE CASCADE,
          bhajan_id UUID REFERENCES bhajans(id) ON DELETE CASCADE,
          UNIQUE(festival_id, bhajan_id)
      );

      CREATE TABLE IF NOT EXISTS festival_articles (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          festival_id UUID REFERENCES festivals(id) ON DELETE CASCADE,
          article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
          UNIQUE(festival_id, article_id)
      );
    `).catch(() => {});

    console.log("MIGRATION SUCCESSFUL");
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
}
run();
