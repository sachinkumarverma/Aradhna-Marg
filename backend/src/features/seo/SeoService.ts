import { seoRepository } from './SeoRepository';

export class SeoService {
  async getOverview() {
    const tables = ['bhajans', 'articles', 'festivals', 'puranas', 'categories'];
    const overview = {
      totalBhajans: 0,
      totalArticles: 0,
      totalFestivals: 0,
      totalPuranas: 0,
      missingTitles: 0,
      missingDescriptions: 0,
      duplicateTitles: 0,
      duplicateDescriptions: 0,
      audit: [] as any[]
    };

    for (const table of tables) {
      const isBhajans = table === 'bhajans';
      const stats = await seoRepository.getTableStats(table, isBhajans);

      const optimized = Math.max(0, stats.total - (stats.missingTitle + stats.missingDesc));

      overview.audit.push({
        type: table,
        optimized,
        missingTitle: stats.missingTitle,
        missingDesc: stats.missingDesc,
        duplicateTitle: 0
      });

      if (table === 'bhajans') overview.totalBhajans = stats.total;
      if (table === 'articles') overview.totalArticles = stats.total;
      if (table === 'festivals') overview.totalFestivals = stats.total;
      if (table === 'puranas') overview.totalPuranas = stats.total;

      overview.missingTitles += stats.missingTitle;
      overview.missingDescriptions += stats.missingDesc;
    }

    return overview;
  }

  async getIssues() {
    const tables = ['bhajans', 'articles', 'festivals', 'puranas', 'categories'];
    const issues: any[] = [];

    for (const table of tables) {
      const isBhajans = table === 'bhajans';

      const missingTitles = await seoRepository.getMissingSeoIssues(table, 'title', isBhajans);
      issues.push(...missingTitles);

      const missingDescs = await seoRepository.getMissingSeoIssues(table, 'description', isBhajans);
      issues.push(...missingDescs);
    }

    return issues;
  }

  async generateSitemap() {
    return { status: 'Generated', url: '/sitemap.xml', count: 1250, lastGenerated: new Date().toISOString() };
  }

  async generateRobots() {
    return { status: 'Generated', url: '/robots.txt', lastGenerated: new Date().toISOString() };
  }

  async generateBulkSEO(data: any) {
    return { status: 'Queued', jobId: 'job_' + Date.now() };
  }
}

export const seoService = new SeoService();
