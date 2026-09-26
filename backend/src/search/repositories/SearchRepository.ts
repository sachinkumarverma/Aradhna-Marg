import { db } from '@common/database/DatabaseClient';
import { ISearchOptions, ISearchResult } from '@/search/interfaces';

class SearchRepository {
  /**
   * Multi-content search across Bhajans, Articles, Festivals, Puranas, and Deities.
   */
  public async searchFTS(options: ISearchOptions): Promise<{ data: any[]; total: number }> {
    const { query, sort, page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const searchTerm = query?.trim() ? `%${query.trim()}%` : '%';

    const unionQuery = `
      SELECT * FROM (
        SELECT id, slug, title, 'BHAJAN' as type, thumbnail_url as image, views, short_description as excerpt, created_at, '🪔 Bhajan' as type_label
        FROM bhajans
        WHERE status = 'PUBLISHED' AND deleted_at IS NULL
          AND ($1 = '%' OR title ILIKE $1 OR hindi_title ILIKE $1 OR description ILIKE $1 OR lyrics ILIKE $1)

        UNION ALL

        SELECT id, slug, title, 'ARTICLE' as type, NULL as image, view_count as views, excerpt, created_at, '📖 Article' as type_label
        FROM articles
        WHERE status = 'PUBLISHED' AND deleted_at IS NULL
          AND ($1 = '%' OR title ILIKE $1 OR title_en ILIKE $1 OR content ILIKE $1 OR excerpt ILIKE $1)

        UNION ALL

        SELECT id, slug, name as title, 'FESTIVAL' as type, banner_image as image, 0 as views, short_description as excerpt, created_at, '🌸 Festival' as type_label
        FROM festivals
        WHERE status ILIKE 'published'
          AND ($1 = '%' OR name ILIKE $1 OR name_en ILIKE $1 OR content ILIKE $1 OR short_description ILIKE $1)

        UNION ALL

        SELECT id, slug, title, 'PURANA' as type, cover_image as image, view_count as views, short_description as excerpt, created_at, '📜 Purana' as type_label
        FROM puranas
        WHERE status = 'PUBLISHED' AND deleted_at IS NULL
          AND ($1 = '%' OR title ILIKE $1 OR title_en ILIKE $1 OR short_description ILIKE $1)

        UNION ALL

        SELECT id, slug, name as title, 'DEITY' as type, image, 0 as views, short_description as excerpt, created_at, '🙏 Deity' as type_label
        FROM deities
        WHERE (status = 'ACTIVE' OR status IS NULL)
          AND ($1 = '%' OR name ILIKE $1 OR short_description ILIKE $1)
      ) combined
      ORDER BY 
        CASE WHEN title ILIKE $1 THEN 1 ELSE 2 END,
        created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const countQuery = `
      SELECT COUNT(*) as total FROM (
        SELECT id FROM bhajans WHERE status = 'PUBLISHED' AND deleted_at IS NULL AND ($1 = '%' OR title ILIKE $1 OR hindi_title ILIKE $1 OR description ILIKE $1)
        UNION ALL
        SELECT id FROM articles WHERE status = 'PUBLISHED' AND deleted_at IS NULL AND ($1 = '%' OR title ILIKE $1 OR title_en ILIKE $1 OR content ILIKE $1)
        UNION ALL
        SELECT id FROM festivals WHERE status ILIKE 'published' AND ($1 = '%' OR name ILIKE $1 OR name_en ILIKE $1)
        UNION ALL
        SELECT id FROM puranas WHERE status = 'PUBLISHED' AND deleted_at IS NULL AND ($1 = '%' OR title ILIKE $1 OR title_en ILIKE $1)
        UNION ALL
        SELECT id FROM deities WHERE (status = 'ACTIVE' OR status IS NULL) AND ($1 = '%' OR name ILIKE $1)
      ) combined_count
    `;

    const [dataResult, countResult] = await Promise.all([
      db.query(unionQuery, [searchTerm, limit, offset]),
      db.query(countQuery, [searchTerm])
    ]);

    return {
      data: dataResult.rows,
      total: parseInt(countResult.rows[0]?.total || '0', 10)
    };
  }

  public async logSearch(query: string, resultCount: number, metadata?: any): Promise<void> {
    try {
      await db.query(`INSERT INTO search_logs (search_term, results_count) VALUES ($1, $2)`, [query, resultCount]);
    } catch (err) {
      // Ignore search log insert errors
    }
  }

  public async getTrendingSearches(): Promise<string[]> {
    try {
      const { rows } = await db.query(
        `SELECT search_term FROM search_logs GROUP BY search_term ORDER BY COUNT(*) DESC LIMIT 10`
      );
      return rows.map((row: any) => row.search_term);
    } catch {
      return ['Hanuman Chalisa', 'Shiv Tandav', 'Deepawali', 'Krishna Janmashtami', 'Bhagavad Gita'];
    }
  }
}

export const searchRepository = new SearchRepository();
