import fs from 'fs';
import path from 'path';
import { db } from '@common/database/DatabaseClient';
import { logger } from '@utils/logger';

export class SitemapGenerator {
  private readonly baseUrl = 'https://aradhnamarg.com';

  private escapeXml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Generates the Master Single Sitemap with all public URLs and returns XML and total URL count.
   */
  public async generateFullSitemapWithStats(): Promise<{ xml: string; count: number }> {
    const today = new Date().toISOString().split('T')[0];
    const staticRoutes = [
      { loc: `${this.baseUrl}/`, priority: '1.0', changefreq: 'daily' },
      { loc: `${this.baseUrl}/bhajans`, priority: '0.9', changefreq: 'daily' },
      { loc: `${this.baseUrl}/articles`, priority: '0.9', changefreq: 'daily' },
      { loc: `${this.baseUrl}/festivals`, priority: '0.9', changefreq: 'weekly' },
      { loc: `${this.baseUrl}/puranas`, priority: '0.9', changefreq: 'weekly' },
      { loc: `${this.baseUrl}/videos`, priority: '0.8', changefreq: 'daily' },
      { loc: `${this.baseUrl}/categories`, priority: '0.8', changefreq: 'weekly' },
      { loc: `${this.baseUrl}/gods`, priority: '0.8', changefreq: 'weekly' },
      { loc: `${this.baseUrl}/explore`, priority: '0.7', changefreq: 'weekly' },
      { loc: `${this.baseUrl}/about`, priority: '0.5', changefreq: 'monthly' },
      { loc: `${this.baseUrl}/contact`, priority: '0.5', changefreq: 'monthly' },
      { loc: `${this.baseUrl}/support-us`, priority: '0.4', changefreq: 'monthly' },
      { loc: `${this.baseUrl}/terms`, priority: '0.3', changefreq: 'monthly' },
      { loc: `${this.baseUrl}/privacy`, priority: '0.3', changefreq: 'monthly' },
      { loc: `${this.baseUrl}/disclaimer`, priority: '0.3', changefreq: 'monthly' }
    ];

    let entries = staticRoutes
      .map(
        (r) => `  <url>
    <loc>${this.escapeXml(r.loc)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`
      )
      .join('\n');

    let dynamicCount = 0;

    try {
      const [bhajans, articles, festivals, puranas, categories, deities] = await Promise.all([
        db
          .query(`SELECT slug, updated_at FROM bhajans WHERE UPPER(status::text) = 'PUBLISHED' AND deleted_at IS NULL`)
          .catch(() => ({ rows: [] })),
        db
          .query(`SELECT slug, updated_at FROM articles WHERE UPPER(status::text) = 'PUBLISHED' AND deleted_at IS NULL`)
          .catch(() => ({ rows: [] })),
        db
          .query(`SELECT slug, id, updated_at FROM festivals WHERE UPPER(status::text) = 'PUBLISHED'`)
          .catch(() => ({ rows: [] })),
        db
          .query(`SELECT slug, updated_at FROM puranas WHERE UPPER(status::text) = 'PUBLISHED' AND deleted_at IS NULL`)
          .catch(() => ({ rows: [] })),
        db
          .query(`SELECT slug, id, updated_at FROM categories WHERE UPPER(status::text) = 'PUBLISHED'`)
          .catch(() => ({ rows: [] })),
        db
          .query(`SELECT slug, id, updated_at FROM deities WHERE UPPER(status::text) = 'ACTIVE' AND deleted_at IS NULL`)
          .catch(() => ({ rows: [] }))
      ]);

      const appendRows = (rows: any[], pathPrefix: string, priority: string, changefreq: string) => {
        for (const r of rows) {
          const identifier = r.slug || r.id;
          if (!identifier) continue;
          dynamicCount++;
          const date = (r.updated_at ? new Date(r.updated_at) : new Date()).toISOString().split('T')[0];
          const rawUrl = `${this.baseUrl}/${pathPrefix}/${identifier}`;
          entries += `\n  <url>\n    <loc>${this.escapeXml(rawUrl)}</loc>\n    <lastmod>${date}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
        }
      };

      appendRows(bhajans.rows, 'bhajans', '0.8', 'weekly');
      appendRows(articles.rows, 'articles', '0.8', 'weekly');
      appendRows(festivals.rows, 'festivals', '0.8', 'weekly');
      appendRows(puranas.rows, 'puranas', '0.8', 'monthly');
      appendRows(categories.rows, 'categories', '0.7', 'weekly');
      appendRows(deities.rows, 'gods', '0.7', 'weekly');
    } catch (error) {
      logger.error({ error }, 'Failed to query dynamic sitemap rows from DB');
    }

    const totalCount = staticRoutes.length + dynamicCount;
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>`;

    // Persist to disk if paths exist
    this.saveToFiles(xml);

    return { xml, count: totalCount };
  }

  public async generateFullSitemap(): Promise<string> {
    const { xml } = await this.generateFullSitemapWithStats();
    return xml;
  }

  private saveToFiles(xml: string): void {
    const targetDirs = [path.join(process.cwd(), 'public'), path.join(process.cwd(), '..', 'frontend', 'public')];

    for (const dir of targetDirs) {
      try {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(path.join(dir, 'sitemap.xml'), xml, 'utf8');
      } catch (err: any) {
        logger.warn({ dir, error: err.message }, 'Could not save sitemap.xml to disk');
      }
    }
  }

  /**
   * Generates Bhajans Sitemap dynamically from Database.
   */
  public async generateBhajansSitemap(): Promise<string> {
    try {
      const { rows: bhajans } = await db.query(
        `SELECT slug, updated_at FROM bhajans WHERE UPPER(status::text) = 'PUBLISHED' AND deleted_at IS NULL`
      );

      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

      for (const bhajan of bhajans) {
        const date = (bhajan.updated_at ? new Date(bhajan.updated_at) : new Date()).toISOString().split('T')[0];
        xml += `  <url>\n    <loc>${this.escapeXml(`${this.baseUrl}/bhajans/${bhajan.slug}`)}</loc>\n    <lastmod>${date}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
      }

      xml += `</urlset>`;
      return xml;
    } catch (error) {
      logger.error({ error }, 'Failed to generate bhajans sitemap');
      throw error;
    }
  }
}

export const sitemapGenerator = new SitemapGenerator();
