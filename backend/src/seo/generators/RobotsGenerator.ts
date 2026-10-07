export class RobotsGenerator {
  private readonly baseUrl = 'https://aradhnamarg.com';

  public generate(): string {
    return `# robots.txt for Aradhna Marg (https://aradhnamarg.com)
User-agent: *
Allow: /
Disallow: /admin
Disallow: /admin/
Disallow: /search
Disallow: /api/
Disallow: /preview/

# Sitemaps
Sitemap: ${this.baseUrl}/sitemap.xml
`;
  }
}

export const robotsGenerator = new RobotsGenerator();
