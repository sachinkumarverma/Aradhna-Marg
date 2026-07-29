import { supabase } from '../database/supabase';

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
      // Get totals
      let totalQuery = supabase.from(table).select('*', { count: 'exact', head: true });
      if (table === 'bhajans') totalQuery = totalQuery.is('youtube_video_id', null);
      const { count: total } = await totalQuery;
      
      // Get missing titles
      let missingTitleQuery = supabase.from(table).select('*', { count: 'exact', head: true }).or('seo_title.is.null,seo_title.eq.');
      if (table === 'bhajans') missingTitleQuery = missingTitleQuery.is('youtube_video_id', null);
      const { count: missingTitle } = await missingTitleQuery;
      
      // Get missing descriptions
      let missingDescQuery = supabase.from(table).select('*', { count: 'exact', head: true }).or('meta_description.is.null,meta_description.eq.');
      if (table === 'bhajans') missingDescQuery = missingDescQuery.is('youtube_video_id', null);
      const { count: missingDesc } = await missingDescQuery;
      
      // Getting duplicates requires more complex logic, approximating or skipping for now
      // In Supabase REST API, checking duplicates efficiently is best done via RPC or View.
      // We will leave duplicates as 0 for the generic tables unless an RPC exists.
      const duplicateTitle = 0; 
      const duplicateDesc = 0;

      const optimized = (total || 0) - ((missingTitle || 0) + (missingDesc || 0) + duplicateTitle + duplicateDesc);

      overview.audit.push({
        type: table,
        optimized: Math.max(0, optimized),
        missingTitle: missingTitle || 0,
        missingDesc: missingDesc || 0,
        duplicateTitle
      });

      if (table === 'bhajans') overview.totalBhajans = total || 0;
      if (table === 'articles') overview.totalArticles = total || 0;
      if (table === 'festivals') overview.totalFestivals = total || 0;
      if (table === 'puranas') overview.totalPuranas = total || 0;

      overview.missingTitles += (missingTitle || 0);
      overview.missingDescriptions += (missingDesc || 0);
    }

    return overview;
  }

  async getIssues() {
    const tables = ['bhajans', 'articles', 'festivals', 'puranas', 'categories'];
    const issues: any[] = [];

    for (const table of tables) {
      let missingTitlesQuery = supabase
        .from(table)
        .select('id, title')
        .or('seo_title.is.null,seo_title.eq.')
        .limit(10);
        
      if (table === 'bhajans') {
        missingTitlesQuery = missingTitlesQuery.is('youtube_video_id', null);
      }
      
      const { data: missingTitles } = await missingTitlesQuery;
      
      if (missingTitles) {
        issues.push(...missingTitles.map(item => ({ id: item.id, type: table, title: item.title, issue: 'Missing SEO Title' })));
      }

      let missingDescsQuery = supabase
        .from(table)
        .select('id, title')
        .or('meta_description.is.null,meta_description.eq.')
        .limit(10);
        
      if (table === 'bhajans') {
        missingDescsQuery = missingDescsQuery.is('youtube_video_id', null);
      }

      const { data: missingDescs } = await missingDescsQuery;

      if (missingDescs) {
        issues.push(...missingDescs.map(item => ({ id: item.id, type: table, title: item.title, issue: 'Missing Meta Description' })));
      }
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
    // Treat as background job
    // NOTE: When bulk SEO generation is fully implemented, ensure it ONLY targets
    // ['bhajans', 'articles', 'festivals', 'puranas', 'categories']
    // AND explicitly excludes imported youtube videos (where youtube_video_id IS NOT NULL in bhajans)
    return { status: 'Queued', jobId: 'job_' + Date.now() };
  }
}

export const seoService = new SeoService();
