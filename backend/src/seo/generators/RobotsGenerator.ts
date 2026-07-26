export class RobotsGenerator {
  private readonly baseUrl = 'https://aradhnamarg.com';

  public generate(): string {
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

export const robotsGenerator = new RobotsGenerator();
