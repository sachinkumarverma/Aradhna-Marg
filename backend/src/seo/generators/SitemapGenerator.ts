import { db } from '@common/database/DatabaseClient';
import { logger } from '@utils/logger';

export class SitemapGenerator {
  private readonly baseUrl = 'https://aradhnamarg.com';

  /**
   * Generates the Master Single Sitemap with all public URLs or Sitemap Index.
   */
  public async generateFullSitemap(): Promise<string> {
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
    <loc>${r.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`
      )
      .join('\n');

    try {
      const [bhajans, articles, festivals, puranas, categories, deities] = await Promise.all([
        db.query(`SELECT slug, updated_at FROM bhajans WHERE status = 'PUBLISHED'`).catch(() => ({ rows: [] })),
        db.query(`SELECT slug, updated_at FROM articles WHERE status = 'PUBLISHED'`).catch(() => ({ rows: [] })),
        db.query(`SELECT slug, id, updated_at FROM festivals WHERE status = 'PUBLISHED'`).catch(() => ({ rows: [] })),
        db.query(`SELECT slug, updated_at FROM puranas WHERE status = 'PUBLISHED'`).catch(() => ({ rows: [] })),
        db.query(`SELECT slug, id, updated_at FROM categories`).catch(() => ({ rows: [] })),
        db.query(`SELECT slug, id, updated_at FROM deities`).catch(() => ({ rows: [] }))
      ]);

      const appendRows = (rows: any[], pathPrefix: string, priority: string, changefreq: string) => {
        for (const r of rows) {
          const identifier = r.slug || r.id;
          if (!identifier) continue;
          const date = (r.updated_at ? new Date(r.updated_at) : new Date()).toISOString().split('T')[0];
          entries += `\n  <url>\n    <loc>${this.baseUrl}/${pathPrefix}/${identifier}</loc>\n    <lastmod>${date}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
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

    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>`;
  }

  /**
   * Generates the Master Sitemap Index referencing split sitemaps.
   */
  public generateIndex(): string {
    const today = new Date().toISOString().split('T')[0];
    return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${this.baseUrl}/sitemaps/bhajans.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${this.baseUrl}/sitemaps/categories.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${this.baseUrl}/sitemaps/gods.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
</sitemapindex>`;
  }

  /**
   * Generates Bhajans Sitemap dynamically from Database.
   */
  public async generateBhajansSitemap(): Promise<string> {
    try {
      const { rows: bhajans } = await db.query(`SELECT slug, updated_at FROM bhajans WHERE status = 'PUBLISHED'`);

      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

      for (const bhajan of bhajans) {
        const date = (bhajan.updated_at ? new Date(bhajan.updated_at) : new Date()).toISOString().split('T')[0];
        xml += `  <url>\n    <loc>${this.baseUrl}/bhajans/${bhajan.slug}</loc>\n    <lastmod>${date}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
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
