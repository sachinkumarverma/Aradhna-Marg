"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sitemapGenerator = exports.SitemapGenerator = void 0;
const supabase_1 = require("../../database/supabase");
const logger_1 = require("../../utils/logger");
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
        const { data: bhajans, error } = await supabase_1.supabase
            .from('bhajans')
            .select('slug, updated_at')
            .eq('status', 'PUBLISHED');
        if (error) {
            logger_1.logger.error('Failed to generate bhajans sitemap', error);
            throw error;
        }
        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
        for (const bhajan of bhajans) {
            const date = (bhajan.updated_at ? new Date(bhajan.updated_at) : new Date()).toISOString().split('T')[0];
            xml += `  <url>\n    <loc>${this.baseUrl}/bhajans/${bhajan.slug}</loc>\n    <lastmod>${date}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
        }
        xml += `</urlset>`;
        return xml;
    }
}
exports.SitemapGenerator = SitemapGenerator;
exports.sitemapGenerator = new SitemapGenerator();
