import { db } from '../../common/database/DatabaseClient';
import { logger } from '../../utils/logger';

export class SitemapGenerator {
  private readonly baseUrl = 'https://aradhnamarg.com';
  
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
   * If > 50,000 URLs, this should implement chunking (`bhajans-1.xml`, etc).
   */
  public async generateBhajansSitemap(): Promise<string> {
    try {
      const { rows: bhajans } = await db.query(
        `SELECT slug, updated_at FROM bhajans WHERE status = 'PUBLISHED'`
      );

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
