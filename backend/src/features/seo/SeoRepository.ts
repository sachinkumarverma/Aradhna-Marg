import { db } from '@common/database/DatabaseClient';

export class SeoRepository {
  async getTableStats(table: string, isBhajans: boolean = false) {
    const hasDeletedAt = table === 'bhajans' || table === 'articles' || table === 'puranas';
    const whereClauses: string[] = [];

    if (hasDeletedAt) {
      whereClauses.push('deleted_at IS NULL');
    }

    if (isBhajans) {
      whereClauses.push('youtube_video_id IS NULL');
    }

    const whereStr = whereClauses.length > 0 ? whereClauses.join(' AND ') : '1=1';

    // In PostgreSQL, title column might be different per table?
    // Wait, bhajans, articles, festivals, puranas have `title`. categories has `name`.
    const titleCol =
      table === 'categories' || table === 'festivals' || table === 'deities' || table === 'tags' || table === 'authors'
        ? 'name'
        : 'title';

    const seoTitleCol = 'seo_title';
    const seoDescCol = 'seo_description';

    const totalQuery = `SELECT COUNT(*) as total FROM ${table} WHERE ${whereStr}`;
    const missingTitleQuery = `SELECT COUNT(*) as total FROM ${table} WHERE ${whereStr} AND (${seoTitleCol} IS NULL OR ${seoTitleCol} = '')`;
    const missingDescQuery = `SELECT COUNT(*) as total FROM ${table} WHERE ${whereStr} AND (${seoDescCol} IS NULL OR ${seoDescCol} = '')`;

    const [totalRes, missingTitleRes, missingDescRes] = await Promise.all([
      db.query(totalQuery),
      db.query(missingTitleQuery),
      db.query(missingDescQuery)
    ]);

    return {
      total: parseInt(totalRes.rows[0].total, 10),
      missingTitle: parseInt(missingTitleRes.rows[0].total, 10),
      missingDesc: parseInt(missingDescRes.rows[0].total, 10)
    };
  }

  async getMissingSeoIssues(table: string, issueType: 'title' | 'description', isBhajans: boolean = false) {
    const hasDeletedAt = table === 'bhajans' || table === 'articles' || table === 'puranas';
    const whereClauses: string[] = [];

    if (hasDeletedAt) {
      whereClauses.push('deleted_at IS NULL');
    }

    if (isBhajans) {
      whereClauses.push('youtube_video_id IS NULL');
    }

    const titleCol =
      table === 'categories' || table === 'festivals' || table === 'deities' || table === 'tags' || table === 'authors'
        ? 'name'
        : 'title';
    const seoTitleCol = 'seo_title';
    const seoDescCol = 'seo_description';

    const condition =
      issueType === 'title'
        ? `(${seoTitleCol} IS NULL OR ${seoTitleCol} = '')`
        : `(${seoDescCol} IS NULL OR ${seoDescCol} = '')`;

    whereClauses.push(condition);

    const query = `
      SELECT id, ${titleCol} as title 
      FROM ${table} 
      WHERE ${whereClauses.join(' AND ')} 
      LIMIT 10
    `;

    const res = await db.query(query);
    return res.rows.map((row) => ({
      id: row.id,
      title: row.title,
      type: table,
      issue: issueType === 'title' ? 'Missing SEO Title' : 'Missing Meta Description'
    }));
  }
}

export const seoRepository = new SeoRepository();
