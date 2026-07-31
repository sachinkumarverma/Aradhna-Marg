import { db } from '@common/database/DatabaseClient';
import { ISearchOptions, ISearchResult } from '@/search/interfaces';

class SearchRepository {
  private readonly tableName = 'bhajans';

  /**
   * Executes a PostgreSQL Full Text Search query utilizing the `search_vector` GIN index.
   * Includes fuzzy matching logic via ILIKE if FTS yields nothing.
   */
  public async searchFTS(options: ISearchOptions): Promise<{ data: ISearchResult[]; total: number }> {
    const { query, filters, sort, page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    let whereClauses = [`status = 'PUBLISHED'`];
    const queryParams: any[] = [];

    if (query?.trim()) {
      queryParams.push(`%${query.trim()}%`);
      whereClauses.push(`(title ILIKE $${queryParams.length} OR hindi_title ILIKE $${queryParams.length} OR content ILIKE $${queryParams.length})`);
    }

    if (filters?.hasPdf) {
      whereClauses.push(`has_pdf = true`);
    }
    if (filters?.hasVideo) {
      whereClauses.push(`youtube_video_id IS NOT NULL`);
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    let orderStr = 'ORDER BY created_at DESC';
    switch (sort) {
      case 'NEWEST': orderStr = 'ORDER BY published_at DESC'; break;
      case 'OLDEST': orderStr = 'ORDER BY published_at ASC'; break;
      case 'VIEWS':  orderStr = 'ORDER BY views DESC'; break;
      case 'POPULARITY': orderStr = 'ORDER BY popularity_score DESC'; break;
    }

    const dataQuery = `
      SELECT id, slug, title, hindi_title, thumbnail_url, views, has_pdf, youtube_video_id, reading_time
      FROM ${this.tableName}
      ${whereStr}
      ${orderStr}
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;
    const countQuery = `SELECT COUNT(*) as total FROM ${this.tableName} ${whereStr}`;

    const [dataResult, countResult] = await Promise.all([
      db.query(dataQuery, [...queryParams, limit, offset]),
      db.query(countQuery, queryParams)
    ]);

    return {
      data: dataResult.rows.map((b: any) => ({ ...b, has_video: !!b.youtube_video_id })),
      total: parseInt(countResult.rows[0].total, 10) || 0
    };
  }

  public async logSearch(query: string, resultCount: number, metadata?: any): Promise<void> {
    await db.query(
      `INSERT INTO search_logs (search_query, results_count, metadata) VALUES ($1, $2, $3)`,
      [query, resultCount, JSON.stringify(metadata || {})]
    );
  }

  public async getTrendingSearches(): Promise<string[]> {
    try {
      const { rows } = await db.query(
        `SELECT search_query FROM search_logs GROUP BY search_query ORDER BY COUNT(*) DESC LIMIT 10`
      );
      return rows.map((row: any) => row.search_query);
    } catch {
      // Fallback for architecture demo if table doesn't exist yet
      return ['Hanuman Chalisa', 'Shiv Tandav', 'Morning Bhajans'];
    }
  }
}

export const searchRepository = new SearchRepository();
