import { seoRepository } from './SeoRepository';
import { sitemapGenerator } from '@/seo/generators/SitemapGenerator';
import { robotsGenerator } from '@/seo/generators/RobotsGenerator';
import { settingsService } from '@services/SettingsService';
import { AiJobService } from '@admin/services/AiJobService';
import { db } from '@common/database/DatabaseClient';

const aiJobService = new AiJobService();

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
    const { count } = await sitemapGenerator.generateFullSitemapWithStats();
    const nowIso = new Date().toISOString();

    await settingsService
      .updateSettings({
        sitemapLastGenerated: nowIso,
        sitemapUrlsCount: count
      })
      .catch(() => {});

    return {
      status: 'Generated',
      url: '/sitemap.xml',
      count,
      lastGenerated: nowIso
    };
  }

  async generateRobots() {
    robotsGenerator.generate();
    return {
      status: 'Generated',
      url: '/robots.txt',
      lastGenerated: new Date().toISOString()
    };
  }

  async generateBulkSEO(data: any) {
    // Count actual eligible records
    const [bhajanSeo, articleSeo] = await Promise.all([
      db.query(`SELECT COUNT(*) FROM bhajans WHERE seo_description IS NULL OR trim(seo_description) = ''`),
      db.query(`SELECT COUNT(*) FROM articles WHERE seo_description IS NULL OR trim(seo_description) = ''`)
    ]);

    const totalEligible = parseInt(bhajanSeo.rows[0].count, 10) + parseInt(articleSeo.rows[0].count, 10);

    const job = await aiJobService.queueJob({
      job_name: 'Bulk SEO Meta Generation',
      content_type: 'Global',
      action_type: 'BULK_SEO',
      total_items: totalEligible || 1
    });

    return {
      status: 'Queued',
      jobId: job.id,
      totalItems: totalEligible
    };
  }
}

export const seoService = new SeoService();
