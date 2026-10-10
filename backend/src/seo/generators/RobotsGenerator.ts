import fs from 'fs';
import path from 'path';
import { logger } from '@utils/logger';

export class RobotsGenerator {
  private readonly baseUrl = 'https://aradhnamarg.com';

  public generate(): string {
    const robots = `# robots.txt for Aradhna Marg (https://aradhnamarg.com)
User-agent: *
Allow: /

# Disallowed internal, admin, and search endpoints
Disallow: /admin
Disallow: /admin/
Disallow: /api/
Disallow: /search
Disallow: /preview/

# Canonical Sitemaps
Sitemap: ${this.baseUrl}/sitemap.xml
`;

    this.saveToFiles(robots);
    return robots;
  }

  private saveToFiles(content: string): void {
    const targetDirs = [path.join(process.cwd(), 'public'), path.join(process.cwd(), '..', 'frontend', 'public')];

    for (const dir of targetDirs) {
      try {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(path.join(dir, 'robots.txt'), content, 'utf8');
      } catch (err: any) {
        logger.warn({ dir, error: err.message }, 'Could not save robots.txt to disk');
      }
    }
  }
}

export const robotsGenerator = new RobotsGenerator();
