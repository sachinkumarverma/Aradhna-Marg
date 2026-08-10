"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sitemapGenerator = exports.SitemapGenerator = void 0;
const DatabaseClient_1 = require("@common/database/DatabaseClient");
const logger_1 = require("@utils/logger");
class SitemapGenerator {
    baseUrl = 'https://aradhnamarg.com';
    /**
     * Generates the Master Sitemap Index referencing split sitemaps.
     */
    generateIndex() {
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
    async generateBhajansSitemap() {
        try {
            const { rows: bhajans } = await DatabaseClient_1.db.query(`SELECT slug, updated_at FROM bhajans WHERE status = 'PUBLISHED'`);
            let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
            for (const bhajan of bhajans) {
                const date = (bhajan.updated_at ? new Date(bhajan.updated_at) : new Date()).toISOString().split('T')[0];
                xml += `  <url>\n    <loc>${this.baseUrl}/bhajans/${bhajan.slug}</loc>\n    <lastmod>${date}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
            }
            xml += `</urlset>`;
            return xml;
        }
        catch (error) {
            logger_1.logger.error({ error }, 'Failed to generate bhajans sitemap');
            throw error;
        }
    }
}
exports.SitemapGenerator = SitemapGenerator;
exports.sitemapGenerator = new SitemapGenerator();
