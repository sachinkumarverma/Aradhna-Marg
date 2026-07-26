"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.robotsGenerator = exports.RobotsGenerator = void 0;
class RobotsGenerator {
    baseUrl = 'https://aradhnamarg.com';
    generate() {
        return `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /preview/

# Sitemaps
Sitemap: ${this.baseUrl}/sitemap.xml
`;
    }
}
exports.RobotsGenerator = RobotsGenerator;
exports.robotsGenerator = new RobotsGenerator();
