import { db } from '@common/database/DatabaseClient';
import { ISearchOptions, ISearchResult } from '@/search/interfaces';

class SearchRepository {
  /**
   * Multi-content search across Bhajans, Videos, Articles, Festivals, Puranas, Deities, and Categories.
   */
  public async searchFTS(options: ISearchOptions): Promise<{ data: any[]; total: number }> {
    const { query, sort, page = 1, limit = 20, filters, type: directType } = options;
    const offset = (page - 1) * limit;

    const searchTerm = query?.trim() ? `%${query.trim()}%` : '%';
    const targetType = (directType || filters?.type || 'ALL').toUpperCase();

    const unionQuery = `
      SELECT * FROM (
        -- 1. Bhajans
        SELECT 
          b.id, 
          b.slug, 
          b.title, 
          COALESCE(b.title_en, b.english_title) as title_en,
          'BHAJAN' as type, 
          COALESCE(b.thumbnail_url, b.image_url, b.open_graph_image) as image, 
          COALESCE(b.views, 0) as views, 
          b.short_description as excerpt, 
          NULL as excerpt_en,
          b.created_at, 
          '🪔 भजन' as type_label
        FROM bhajans b
        WHERE (b.status = 'PUBLISHED' OR b.status IS NULL) AND b.deleted_at IS NULL
          AND ($1 = '%' OR b.title ILIKE $1 OR b.hindi_title ILIKE $1 OR b.english_title ILIKE $1 OR b.title_en ILIKE $1 OR b.description ILIKE $1 OR b.lyrics ILIKE $1 OR b.lyrics_english ILIKE $1 OR b.slug ILIKE $1
               OR EXISTS (
                 SELECT 1 FROM festivals f
                 WHERE (f.name ILIKE $1 OR f.name_en ILIKE $1)
                   AND (
                     b.festival_id = f.id
                     OR EXISTS (SELECT 1 FROM festival_bhajans fb WHERE fb.bhajan_id = b.id AND fb.festival_id = f.id)
                   )
               )
          )

        UNION ALL

        -- 2. YouTube Videos
        SELECT 
          y.id, 
          y.youtube_video_id as slug, 
          y.title, 
          NULL as title_en,
          'VIDEO' as type, 
          y.thumbnail as image, 
          COALESCE(y.view_count, 0) as views, 
          y.description as excerpt, 
          NULL as excerpt_en,
          COALESCE(y.published_at, y.created_at) as created_at, 
          '▶ वीडियो' as type_label
        FROM youtube_videos y
        WHERE ($1 = '%' OR y.title ILIKE $1 OR y.description ILIKE $1 OR y.channel_name ILIKE $1 OR y.youtube_video_id ILIKE $1)

        UNION ALL

        -- 3. Articles
        SELECT 
          a.id, 
          a.slug, 
          a.title, 
          a.title_en,
          'ARTICLE' as type, 
          m.url as image, 
          COALESCE(a.view_count, 0) as views, 
          a.excerpt as excerpt, 
          a.excerpt_en as excerpt_en,
          a.created_at, 
          '📖 लेख' as type_label
        FROM articles a
        LEFT JOIN media_files m ON a.featured_image_id = m.id
        WHERE (a.status = 'PUBLISHED' OR a.status IS NULL) AND a.deleted_at IS NULL
          AND ($1 = '%' OR a.title ILIKE $1 OR a.title_en ILIKE $1 OR a.content ILIKE $1 OR a.content_en ILIKE $1 OR a.excerpt ILIKE $1 OR a.excerpt_en ILIKE $1 OR a.slug ILIKE $1
               OR EXISTS (
                 SELECT 1 FROM festivals f
                 WHERE (f.name ILIKE $1 OR f.name_en ILIKE $1)
                   AND (
                     EXISTS (SELECT 1 FROM article_festivals af WHERE af.article_id = a.id AND af.festival_id = f.id)
                     OR EXISTS (SELECT 1 FROM festival_articles fa WHERE fa.article_id = a.id AND fa.festival_id = f.id)
                   )
               )
          )

        UNION ALL

        -- 4. Festivals
        SELECT 
          f.id, 
          f.slug, 
          f.name as title, 
          f.name_en as title_en,
          'FESTIVAL' as type, 
          f.banner_image as image, 
          0 as views, 
          f.short_description as excerpt, 
          f.short_description_en as excerpt_en,
          f.created_at, 
          '🌸 त्यौहार' as type_label
        FROM festivals f
        WHERE (f.status ILIKE 'published' OR f.status IS NULL)
          AND ($1 = '%' OR f.name ILIKE $1 OR f.name_en ILIKE $1 OR f.content ILIKE $1 OR f.content_en ILIKE $1 OR f.short_description ILIKE $1 OR f.short_description_en ILIKE $1 OR f.slug ILIKE $1)

        UNION ALL

        -- 5. Puranas / Scriptures
        SELECT 
          p.id, 
          p.slug, 
          p.title, 
          p.title_en,
          'PURANA' as type, 
          p.cover_image as image, 
          COALESCE(p.view_count, 0) as views, 
          p.short_description as excerpt, 
          p.description_en as excerpt_en,
          p.created_at, 
          '📜 पुराण' as type_label
        FROM puranas p
        WHERE (p.status = 'PUBLISHED' OR p.status IS NULL) AND p.deleted_at IS NULL
          AND ($1 = '%' OR p.title ILIKE $1 OR p.title_en ILIKE $1 OR p.short_description ILIKE $1 OR p.description_en ILIKE $1 OR p.slug ILIKE $1)

        UNION ALL

        -- 6. Deities
        SELECT 
          d.id, 
          d.slug, 
          d.name as title, 
          NULL as title_en,
          'DEITY' as type, 
          d.image, 
          0 as views, 
          d.short_description as excerpt, 
          NULL as excerpt_en,
          d.created_at, 
          '🙏 देवी-देवता' as type_label
        FROM deities d
        WHERE (d.status = 'ACTIVE' OR d.status IS NULL) AND d.deleted_at IS NULL
          AND ($1 = '%' OR d.name ILIKE $1 OR d.short_description ILIKE $1 OR d.slug ILIKE $1)

        UNION ALL

        -- 7. Categories
        SELECT 
          c.id, 
          c.slug, 
          c.name as title, 
          NULL as title_en,
          'CATEGORY' as type, 
          c.image_url as image, 
          0 as views, 
          c.description as excerpt, 
          NULL as excerpt_en,
          c.created_at, 
          '📂 श्रेणी' as type_label
        FROM categories c
        WHERE ($1 = '%' OR c.name ILIKE $1 OR c.description ILIKE $1 OR c.slug ILIKE $1)
      ) combined
      WHERE ($4 = 'ALL' OR type = $4)
      ORDER BY 
        CASE 
          WHEN title ILIKE $1 OR title_en ILIKE $1 THEN 1 
          WHEN excerpt ILIKE $1 THEN 2 
          ELSE 3 
        END,
        CASE 
          WHEN type = 'BHAJAN' THEN 1 
          WHEN type = 'PURANA' THEN 2 
          WHEN type = 'ARTICLE' THEN 3 
          WHEN type = 'FESTIVAL' THEN 4 
          WHEN type = 'DEITY' THEN 5 
          WHEN type = 'CATEGORY' THEN 6 
          ELSE 7 
        END,
        views DESC,
        created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const countQuery = `
      SELECT COUNT(*) as total FROM (
        SELECT b.id, 'BHAJAN' as type FROM bhajans b WHERE (b.status = 'PUBLISHED' OR b.status IS NULL) AND b.deleted_at IS NULL AND ($1 = '%' OR b.title ILIKE $1 OR b.hindi_title ILIKE $1 OR b.english_title ILIKE $1 OR b.title_en ILIKE $1 OR b.description ILIKE $1 OR b.lyrics ILIKE $1 OR b.lyrics_english ILIKE $1 OR b.slug ILIKE $1 OR EXISTS (SELECT 1 FROM festivals f WHERE (f.name ILIKE $1 OR f.name_en ILIKE $1) AND (b.festival_id = f.id OR EXISTS (SELECT 1 FROM festival_bhajans fb WHERE fb.bhajan_id = b.id AND fb.festival_id = f.id))))
        UNION ALL
        SELECT y.id, 'VIDEO' as type FROM youtube_videos y WHERE ($1 = '%' OR y.title ILIKE $1 OR y.description ILIKE $1 OR y.channel_name ILIKE $1 OR y.youtube_video_id ILIKE $1)
        UNION ALL
        SELECT a.id, 'ARTICLE' as type FROM articles a WHERE (a.status = 'PUBLISHED' OR a.status IS NULL) AND a.deleted_at IS NULL AND ($1 = '%' OR a.title ILIKE $1 OR a.title_en ILIKE $1 OR a.content ILIKE $1 OR a.content_en ILIKE $1 OR a.excerpt ILIKE $1 OR a.excerpt_en ILIKE $1 OR a.slug ILIKE $1 OR EXISTS (SELECT 1 FROM festivals f WHERE (f.name ILIKE $1 OR f.name_en ILIKE $1) AND (EXISTS (SELECT 1 FROM article_festivals af WHERE af.article_id = a.id AND af.festival_id = f.id) OR EXISTS (SELECT 1 FROM festival_articles fa WHERE fa.article_id = a.id AND fa.festival_id = f.id))))
        UNION ALL
        SELECT f.id, 'FESTIVAL' as type FROM festivals f WHERE (f.status ILIKE 'published' OR f.status IS NULL) AND ($1 = '%' OR f.name ILIKE $1 OR f.name_en ILIKE $1 OR f.content ILIKE $1 OR f.content_en ILIKE $1 OR f.short_description ILIKE $1 OR f.short_description_en ILIKE $1 OR f.slug ILIKE $1)
        UNION ALL
        SELECT p.id, 'PURANA' as type FROM puranas p WHERE (p.status = 'PUBLISHED' OR p.status IS NULL) AND p.deleted_at IS NULL AND ($1 = '%' OR p.title ILIKE $1 OR p.title_en ILIKE $1 OR p.short_description ILIKE $1 OR p.description_en ILIKE $1 OR p.slug ILIKE $1)
        UNION ALL
        SELECT d.id, 'DEITY' as type FROM deities d WHERE (d.status = 'ACTIVE' OR d.status IS NULL) AND d.deleted_at IS NULL AND ($1 = '%' OR d.name ILIKE $1 OR d.short_description ILIKE $1 OR d.slug ILIKE $1)
        UNION ALL
        SELECT c.id, 'CATEGORY' as type FROM categories c WHERE ($1 = '%' OR c.name ILIKE $1 OR c.description ILIKE $1 OR c.slug ILIKE $1)
      ) combined_count
      WHERE ($2 = 'ALL' OR type = $2)
    `;

    const [dataResult, countResult] = await Promise.all([
      db.query(unionQuery, [searchTerm, limit, offset, targetType]),
      db.query(countQuery, [searchTerm, targetType])
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
      return ['Hanuman Chalisa', 'Shiv Tandav', 'Deepawali', 'Krishna Janmashtami', 'Bhagavad Gita', 'Vishnu Purana'];
    }
  }
}

export const searchRepository = new SearchRepository();
