import { Request, Response, NextFunction } from 'express';
import { db } from '@common/database/DatabaseClient';
import { sendSuccess } from '@/responses/apiResponse';
import { puranService } from '@services/PuranService';
import { isShortVideo } from '@utils/videoUtils';

export class PublicController {
  // 1. Home Payload
  public getHomeData = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // FeaturedBhajans
      const bhajansQuery = `
        SELECT b.id, b.title, b.hindi_title, b.english_title, b.title_en, b.slug, b.short_description, COALESCE(b.thumbnail_url, b.image_url, b.open_graph_image) as thumbnail_url, b.youtube_video_id,
               b.views, b.duration, b.published_date, b.popularity_score,
               d.name as god_name, c.name as category_name
        FROM bhajans b
        LEFT JOIN deities d ON b.god_id = d.id
        LEFT JOIN categories c ON b.category_id = c.id
        WHERE b.status = 'PUBLISHED' AND b.deleted_at IS NULL
        ORDER BY b.popularity_score DESC, b.created_at DESC
        LIMIT 8
      `;

      // Featured Articles
      const articlesQuery = `
        SELECT a.id, a.title, a.title_en, a.slug, a.excerpt, a.excerpt_en, a.publish_date, a.view_count, a.featured,
               au.name as author_name, c.name as category_name, m.url as featured_image_url
        FROM articles a
        LEFT JOIN authors au ON a.author_id = au.id
        LEFT JOIN categories c ON a.category_id = c.id
        LEFT JOIN media_files m ON a.featured_image_id = m.id
        WHERE a.status = 'PUBLISHED' AND a.deleted_at IS NULL
        ORDER BY a.featured DESC, a.created_at DESC
        LIMIT 6
      `;

      // Festivals
      const festivalsQuery = `
        SELECT id, name, name_en, slug, short_description, short_description_en, banner_image, festival_date, category, featured
        FROM festivals
        WHERE status ILIKE 'published'
        ORDER BY festival_date ASC NULLS LAST, created_at DESC
        LIMIT 6
      `;

      // Puranas
      const puranasQuery = `
        SELECT id, title, title_en, slug, short_description, description_en, cover_image, pdf_file, language, author, view_count, download_count
        FROM puranas
        WHERE status = 'PUBLISHED' AND deleted_at IS NULL
        ORDER BY display_order ASC, created_at DESC
        LIMIT 6
      `;

      // Deities
      const deitiesQuery = `
        SELECT id, name, slug, short_description, image, featured
        FROM deities
        WHERE status = 'ACTIVE' OR status IS NULL
        ORDER BY display_order ASC, name ASC
        LIMIT 12
      `;

      // Categories
      const categoriesQuery = `
        SELECT id, name, slug, description, image_url, icon_url, is_featured
        FROM categories
        WHERE status = 'PUBLISHED' OR status IS NULL
        ORDER BY display_order ASC, name ASC
      `;

      // Featured YouTube Videos (excluding Shorts)
      const videosQuery = `
        SELECT id, youtube_video_id, title, description, thumbnail, channel_name, duration, view_count, published_at
        FROM youtube_videos
        WHERE import_status != 'IGNORED'
        ORDER BY published_at DESC NULLS LAST, created_at DESC
        LIMIT 500
      `;

      const [bhajans, articles, festivals, puranas, deities, categories, videos] = await Promise.all([
        db.query(bhajansQuery),
        db.query(articlesQuery),
        db.query(festivalsQuery),
        db.query(puranasQuery),
        db.query(deitiesQuery),
        db.query(categoriesQuery),
        db.query(videosQuery).catch(() => ({ rows: [] }))
      ]);

      const featuredVideos = (videos.rows || []).filter((v: any) => !isShortVideo(v)).slice(0, 10);

      return sendSuccess(res, 'Home data fetched successfully', {
        featuredBhajans: bhajans.rows,
        featuredArticles: articles.rows,
        festivals: festivals.rows,
        puranas: puranas.rows,
        deities: deities.rows,
        categories: categories.rows,
        featuredVideos
      });
    } catch (error) {
      next(error);
    }
  };

  // 2. Bhajans List
  public getBhajans = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 12;
      const offset = (page - 1) * limit;
      const search = req.query.search as string;
      const category = req.query.category as string;
      const deity = req.query.deity as string;
      const sort = req.query.sort as string;

      const whereClauses = ["b.status = 'PUBLISHED'", 'b.deleted_at IS NULL'];
      const queryParams: any[] = [];

      if (search) {
        queryParams.push(`%${search}%`);
        whereClauses.push(
          `(b.title ILIKE $${queryParams.length} OR b.hindi_title ILIKE $${queryParams.length} OR b.description ILIKE $${queryParams.length})`
        );
      }

      if (category) {
        queryParams.push(category);
        whereClauses.push(`(b.category_id = $${queryParams.length} OR c.slug = $${queryParams.length})`);
      }

      if (deity) {
        queryParams.push(deity);
        whereClauses.push(`(b.god_id = $${queryParams.length} OR d.slug = $${queryParams.length})`);
      }

      let orderBy = 'ORDER BY b.created_at DESC';
      if (sort === 'views') orderBy = 'ORDER BY b.views DESC';
      if (sort === 'popular') orderBy = 'ORDER BY b.popularity_score DESC';
      if (sort === 'oldest') orderBy = 'ORDER BY b.created_at ASC';

      const whereStr = `WHERE ${whereClauses.join(' AND ')}`;

      const dataQuery = `
        SELECT b.id, b.title, b.hindi_title, b.english_title, b.title_en, b.slug, b.short_description, COALESCE(b.thumbnail_url, b.image_url, b.open_graph_image) as thumbnail_url, b.youtube_video_id,
               b.views, b.duration, b.published_date, b.popularity_score,
               d.name as god_name, d.slug as god_slug, c.name as category_name, c.slug as category_slug
        FROM bhajans b
        LEFT JOIN deities d ON b.god_id = d.id
        LEFT JOIN categories c ON b.category_id = c.id
        ${whereStr}
        ${orderBy}
        LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
      `;

      const countQuery = `
        SELECT COUNT(*) as total
        FROM bhajans b
        LEFT JOIN deities d ON b.god_id = d.id
        LEFT JOIN categories c ON b.category_id = c.id
        ${whereStr}
      `;

      const [dataRes, countRes] = await Promise.all([
        db.query(dataQuery, [...queryParams, limit, offset]),
        db.query(countQuery, queryParams)
      ]);

      const total = parseInt(countRes.rows[0].total, 10) || 0;

      return sendSuccess(res, 'Bhajans fetched successfully', dataRes.rows, {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      });
    } catch (error) {
      next(error);
    }
  };

  // 3. Bhajan By Slug
  public getBhajanBySlug = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { slug } = req.params;

      const query = `
        SELECT b.*,
               d.name as god_name, d.slug as god_slug, d.image as god_image,
               c.name as category_name, c.slug as category_slug,
               f.name as festival_name, f.slug as festival_slug,
               au.name as author_name
        FROM bhajans b
        LEFT JOIN deities d ON b.god_id = d.id
        LEFT JOIN categories c ON b.category_id = c.id
        LEFT JOIN festivals f ON b.festival_id = f.id
        LEFT JOIN authors au ON b.author_id = au.id
        WHERE (b.slug = $1 OR b.id::text = $1) AND b.status = 'PUBLISHED' AND b.deleted_at IS NULL
        LIMIT 1
      `;
      const { rows } = await db.query(query, [slug]);

      if (rows.length === 0) {
        // Fallback to youtube_videos if present
        const ytQuery = `SELECT * FROM youtube_videos WHERE youtube_video_id = $1 LIMIT 1`;
        const ytRes = await db.query(ytQuery, [slug]);

        if (ytRes.rows.length > 0) {
          const yt = ytRes.rows[0];
          return sendSuccess(res, 'Video bhajan retrieved', {
            id: yt.id,
            title: yt.title,
            hindi_title: yt.title,
            slug: yt.youtube_video_id,
            description: yt.description,
            lyrics: yt.description,
            thumbnail_url: yt.thumbnail,
            youtube_video_id: yt.youtube_video_id,
            views: yt.view_count || 0,
            god_name: yt.channel_name || 'Devotional',
            duration: yt.duration,
            published_at: yt.published_at,
            publish_date: yt.published_at,
            created_at: yt.published_at || yt.created_at
          });
        }
        return sendSuccess(res, 'Bhajan not found', null);
      }

      const bhajan = rows[0];

      // Async increment view count
      db.query(`UPDATE bhajans SET views = COALESCE(views, 0) + 1 WHERE id = $1`, [bhajan.id]).catch(() => {});

      return sendSuccess(res, 'Bhajan retrieved successfully', bhajan);
    } catch (error) {
      next(error);
    }
  };

  // 4. Bhajan Related Content
  public getBhajanRelated = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { slug } = req.params;

      const bhajanRes = await db.query(
        `SELECT id, god_id, category_id, festival_id FROM bhajans WHERE slug = $1 OR id::text = $1 LIMIT 1`,
        [slug]
      );

      let bhajanId = '00000000-0000-0000-0000-000000000000';
      let godId = '00000000-0000-0000-0000-000000000000';
      let categoryId = '00000000-0000-0000-0000-000000000000';
      let festivalId = '00000000-0000-0000-0000-000000000000';

      if (bhajanRes.rows.length > 0) {
        bhajanId = bhajanRes.rows[0].id || bhajanId;
        godId = bhajanRes.rows[0].god_id || godId;
        categoryId = bhajanRes.rows[0].category_id || categoryId;
        festivalId = bhajanRes.rows[0].festival_id || festivalId;
      }

      // Related Bhajans (same deity/category or fallback popular)
      const relatedBhajansQuery = `
        SELECT b.id, b.title, b.slug, COALESCE(b.thumbnail_url, b.image_url, b.open_graph_image) as thumbnail_url, b.youtube_video_id, b.views, b.duration,
               d.name as god_name, c.name as category_name
        FROM bhajans b
        LEFT JOIN deities d ON b.god_id = d.id
        LEFT JOIN categories c ON b.category_id = c.id
        WHERE b.id != $1 AND b.status = 'PUBLISHED' AND b.deleted_at IS NULL
          AND ($2::uuid = '00000000-0000-0000-0000-000000000000' OR b.god_id = $2 OR b.category_id = $3 OR b.festival_id = $4)
        ORDER BY b.popularity_score DESC, b.created_at DESC
        LIMIT 6
      `;

      // Related Articles (same deity / category or fallback recent)
      const relatedArticlesQuery = `
        SELECT a.id, a.title, a.title_en, a.slug, a.excerpt, a.excerpt_en, m.url as featured_image_url, a.publish_date, a.created_at
        FROM articles a
        LEFT JOIN media_files m ON a.featured_image_id = m.id
        WHERE a.status = 'PUBLISHED' AND a.deleted_at IS NULL
          AND ($1::uuid = '00000000-0000-0000-0000-000000000000' OR a.category_id = $1 OR EXISTS (SELECT 1 FROM article_gods WHERE article_id = a.id AND god_id = $2))
        ORDER BY a.created_at DESC
        LIMIT 4
      `;

      // Related Sacred Scriptures / Puranas (PDFs)
      const relatedPuranasQuery = `
        SELECT id, title, title_en, slug, short_description, cover_image, pdf_file, language, author, view_count, download_count
        FROM puranas
        WHERE status = 'PUBLISHED' AND deleted_at IS NULL
        ORDER BY view_count DESC, created_at DESC
        LIMIT 4
      `;

      const [bhajans, articles, puranas] = await Promise.all([
        db.query(relatedBhajansQuery, [bhajanId, godId, categoryId, festivalId]),
        db.query(relatedArticlesQuery, [categoryId, godId]),
        db.query(relatedPuranasQuery)
      ]);

      return sendSuccess(res, 'Related content fetched', {
        relatedBhajans: bhajans.rows,
        relatedArticles: articles.rows,
        relatedPuranas: puranas.rows
      });
    } catch (error) {
      next(error);
    }
  };

  // 5. Articles List
  public getArticles = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 9;
      const offset = (page - 1) * limit;
      const search = req.query.search as string;
      const category = req.query.category as string;
      const author = req.query.author as string;
      const featured = req.query.featured === 'true';
      const lang = (req.query.lang as string) || 'hi';

      const whereClauses = ["a.status = 'PUBLISHED'", 'a.deleted_at IS NULL'];
      const queryParams: any[] = [];

      if (search) {
        queryParams.push(`%${search}%`);
        whereClauses.push(
          `(a.title ILIKE $${queryParams.length} OR a.content ILIKE $${queryParams.length} OR a.title_en ILIKE $${queryParams.length})`
        );
      }

      if (category) {
        queryParams.push(category);
        whereClauses.push(`(a.category_id = $${queryParams.length} OR c.slug = $${queryParams.length})`);
      }

      if (author) {
        queryParams.push(author);
        whereClauses.push(`(a.author_id = $${queryParams.length})`);
      }

      if (featured) {
        whereClauses.push(`a.featured = true`);
      }

      const whereStr = `WHERE ${whereClauses.join(' AND ')}`;

      const dataQuery = `
        SELECT a.id, a.title, a.title_en, a.slug, a.excerpt, a.excerpt_en, a.publish_date, a.view_count, a.featured, a.created_at,
               au.name as author_name, au.photo as author_photo, c.name as category_name, c.slug as category_slug,
               m.url as featured_image_url
        FROM articles a
        LEFT JOIN authors au ON a.author_id = au.id
        LEFT JOIN categories c ON a.category_id = c.id
        LEFT JOIN media_files m ON a.featured_image_id = m.id
        ${whereStr}
        ORDER BY a.featured DESC, a.created_at DESC
        LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
      `;

      const countQuery = `
        SELECT COUNT(*) as total
        FROM articles a
        LEFT JOIN categories c ON a.category_id = c.id
        ${whereStr}
      `;

      const [dataRes, countRes] = await Promise.all([
        db.query(dataQuery, [...queryParams, limit, offset]),
        db.query(countQuery, queryParams)
      ]);

      const total = parseInt(countRes.rows[0].total, 10) || 0;

      // Handle translation fallback if lang === 'en'
      const rows = dataRes.rows.map((art) => ({
        ...art,
        displayTitle: lang === 'en' && art.title_en ? art.title_en : art.title,
        displayExcerpt: lang === 'en' && art.excerpt_en ? art.excerpt_en : art.excerpt
      }));

      return sendSuccess(res, 'Articles fetched successfully', rows, {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      });
    } catch (error) {
      next(error);
    }
  };

  // 6. Article By Slug
  public getArticleBySlug = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { slug } = req.params;
      const lang = (req.query.lang as string) || 'hi';

      const query = `
        SELECT a.*,
               au.name as author_name, au.photo as author_photo, au.short_description as author_bio,
               c.name as category_name, c.slug as category_slug,
               m.url as featured_image_url,
               COALESCE((SELECT json_agg(json_build_object('id', d.id, 'name', d.name, 'slug', d.slug))
                         FROM article_gods ag JOIN deities d ON ag.god_id = d.id WHERE ag.article_id = a.id), '[]'::json) as deities,
               COALESCE((SELECT json_agg(json_build_object('id', f.id, 'name', f.name, 'slug', f.slug))
                         FROM article_festivals af JOIN festivals f ON af.festival_id = f.id WHERE af.article_id = a.id), '[]'::json) as festivals
        FROM articles a
        LEFT JOIN authors au ON a.author_id = au.id
        LEFT JOIN categories c ON a.category_id = c.id
        LEFT JOIN media_files m ON a.featured_image_id = m.id
        WHERE (a.slug = $1 OR a.id::text = $1) AND a.status = 'PUBLISHED' AND a.deleted_at IS NULL
        LIMIT 1
      `;

      const { rows } = await db.query(query, [slug]);

      if (rows.length === 0) {
        return sendSuccess(res, 'Article not found', null);
      }

      const article = rows[0];

      // Increment view count
      db.query(`UPDATE articles SET view_count = COALESCE(view_count, 0) + 1 WHERE id = $1`, [article.id]).catch(
        () => {}
      );

      // Apply language translation fallback (Rule 23: Fallback)
      const result = {
        ...article,
        displayTitle: lang === 'en' && article.title_en ? article.title_en : article.title,
        displayExcerpt: lang === 'en' && article.excerpt_en ? article.excerpt_en : article.excerpt,
        displayContent: lang === 'en' && article.content_en ? article.content_en : article.content,
        displaySeoTitle: lang === 'en' && article.seo_title_en ? article.seo_title_en : article.seo_title,
        displaySeoDescription:
          lang === 'en' && article.seo_description_en ? article.seo_description_en : article.seo_description
      };

      return sendSuccess(res, 'Article retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  };

  // 7. Article Related Content
  public getArticleRelated = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { slug } = req.params;

      const artRes = await db.query(`SELECT id, category_id FROM articles WHERE slug = $1 OR id::text = $1 LIMIT 1`, [
        slug
      ]);

      if (artRes.rows.length === 0) {
        return sendSuccess(res, 'Related content fetched', {
          relatedArticles: [],
          relatedBhajans: [],
          relatedFestivals: []
        });
      }

      const { id, category_id } = artRes.rows[0];

      // Related Articles
      const relatedArticlesQuery = `
        SELECT a.id, a.title, a.title_en, a.slug, a.excerpt, a.excerpt_en, m.url as featured_image_url
        FROM articles a
        LEFT JOIN media_files m ON a.featured_image_id = m.id
        WHERE a.id != $1 AND a.status = 'PUBLISHED' AND a.deleted_at IS NULL
          AND a.category_id = $2
        ORDER BY a.created_at DESC
        LIMIT 4
      `;

      // Related Bhajans
      const relatedBhajansQuery = `
        SELECT b.id, b.title, b.slug, COALESCE(b.thumbnail_url, b.image_url, b.open_graph_image) as thumbnail_url, b.youtube_video_id, b.views, b.duration,
               d.name as god_name, c.name as category_name
        FROM bhajans b
        LEFT JOIN deities d ON b.god_id = d.id
        LEFT JOIN categories c ON b.category_id = c.id
        WHERE b.status = 'PUBLISHED' AND b.deleted_at IS NULL
          AND b.category_id = $1
        ORDER BY b.popularity_score DESC, b.created_at DESC
        LIMIT 4
      `;

      // Related Festivals
      const relatedFestivalsQuery = `
        SELECT id, name, name_en, slug, short_description, banner_image, festival_date
        FROM festivals
        WHERE status ILIKE 'published'
        ORDER BY created_at DESC
        LIMIT 3
      `;

      const [articles, bhajans, festivals] = await Promise.all([
        db.query(relatedArticlesQuery, [id, category_id || '00000000-0000-0000-0000-000000000000']),
        db.query(relatedBhajansQuery, [category_id || '00000000-0000-0000-0000-000000000000']),
        db.query(relatedFestivalsQuery)
      ]);

      return sendSuccess(res, 'Related content fetched', {
        relatedArticles: articles.rows,
        relatedBhajans: bhajans.rows,
        relatedFestivals: festivals.rows
      });
    } catch (error) {
      next(error);
    }
  };

  // 8. Festivals List
  public getFestivals = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 12;
      const offset = (page - 1) * limit;
      const search = req.query.search as string;
      const lang = (req.query.lang as string) || 'hi';

      const whereClauses = ["status ILIKE 'published'"];
      const queryParams: any[] = [];

      if (search) {
        queryParams.push(`%${search}%`);
        whereClauses.push(
          `(name ILIKE $${queryParams.length} OR content ILIKE $${queryParams.length} OR name_en ILIKE $${queryParams.length})`
        );
      }

      const whereStr = `WHERE ${whereClauses.join(' AND ')}`;

      const dataQuery = `
        SELECT id, name, name_en, slug, short_description, short_description_en, banner_image, festival_date, category, featured
        FROM festivals
        ${whereStr}
        ORDER BY festival_date ASC NULLS LAST, created_at DESC
        LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
      `;

      const countQuery = `SELECT COUNT(*) as total FROM festivals ${whereStr}`;

      const [dataRes, countRes] = await Promise.all([
        db.query(dataQuery, [...queryParams, limit, offset]),
        db.query(countQuery, queryParams)
      ]);

      const total = parseInt(countRes.rows[0].total, 10) || 0;

      const rows = dataRes.rows.map((f) => ({
        ...f,
        displayName: lang === 'en' && f.name_en ? f.name_en : f.name,
        displayDescription: lang === 'en' && f.short_description_en ? f.short_description_en : f.short_description
      }));

      return sendSuccess(res, 'Festivals fetched successfully', rows, {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      });
    } catch (error) {
      next(error);
    }
  };

  // 9. Festival By Slug
  public getFestivalBySlug = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { slug } = req.params;
      const lang = (req.query.lang as string) || 'hi';

      const query = `
        SELECT f.*,
               COALESCE((SELECT json_agg(json_build_object('id', b.id, 'title', b.title, 'slug', b.slug, 'thumbnail_url', COALESCE(b.thumbnail_url, b.image_url, b.open_graph_image), 'views', b.views))
                         FROM festival_bhajans fb JOIN bhajans b ON fb.bhajan_id = b.id WHERE fb.festival_id = f.id AND b.status = 'PUBLISHED'), '[]'::json) as related_bhajans,
               COALESCE((SELECT json_agg(json_build_object('id', a.id, 'title', a.title, 'slug', a.slug))
                         FROM festival_articles fa JOIN articles a ON fa.article_id = a.id WHERE fa.festival_id = f.id AND a.status = 'PUBLISHED'), '[]'::json) as related_articles
        FROM festivals f
        WHERE (f.slug = $1 OR f.id::text = $1) AND (f.status IS NULL OR f.status ILIKE 'published')
        LIMIT 1
      `;

      const { rows } = await db.query(query, [slug]);

      if (rows.length === 0) {
        return sendSuccess(res, 'Festival not found', null);
      }

      const festival = rows[0];

      const result = {
        ...festival,
        displayName: lang === 'en' && festival.name_en ? festival.name_en : festival.name,
        displayDescription:
          lang === 'en' && festival.short_description_en ? festival.short_description_en : festival.short_description,
        displayContent: lang === 'en' && festival.content_en ? festival.content_en : festival.content
      };

      return sendSuccess(res, 'Festival retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  };

  // 9b. Festival Related Content
  public getFestivalRelated = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { slug } = req.params;

      const festRes = await db.query(
        `SELECT id, deity_id, category FROM festivals WHERE (slug = $1 OR id::text = $1) LIMIT 1`,
        [slug]
      );

      if (festRes.rows.length === 0) {
        return sendSuccess(res, 'Related content fetched', {
          relatedArticles: [],
          relatedBhajans: [],
          relatedFestivals: []
        });
      }

      const { id, deity_id } = festRes.rows[0];

      // Related Bhajans
      const relatedBhajansQuery = `
        SELECT b.id, b.title, b.slug, COALESCE(b.thumbnail_url, b.image_url, b.open_graph_image) as thumbnail_url, b.youtube_video_id, b.views, b.duration,
               d.name as god_name, c.name as category_name
        FROM bhajans b
        LEFT JOIN festival_bhajans fb ON b.id = fb.bhajan_id
        LEFT JOIN deities d ON b.god_id = d.id
        LEFT JOIN categories c ON b.category_id = c.id
        WHERE b.status = 'PUBLISHED' AND b.deleted_at IS NULL
          AND (fb.festival_id = $1 OR ($2::uuid IS NOT NULL AND b.god_id = $2::uuid))
        ORDER BY b.popularity_score DESC, b.created_at DESC
        LIMIT 4
      `;

      // Related Articles
      const relatedArticlesQuery = `
        SELECT a.id, a.title, a.title_en, a.slug, a.excerpt, a.excerpt_en, m.url as featured_image_url
        FROM articles a
        LEFT JOIN festival_articles fa ON a.id = fa.article_id
        LEFT JOIN media_files m ON a.featured_image_id = m.id
        WHERE a.status = 'PUBLISHED' AND a.deleted_at IS NULL
          AND (fa.festival_id = $1 OR a.status = 'PUBLISHED')
        ORDER BY a.created_at DESC
        LIMIT 4
      `;

      // Related Festivals
      const relatedFestivalsQuery = `
        SELECT id, name, name_en, slug, short_description, banner_image, festival_date
        FROM festivals
        WHERE id != $1 AND (status IS NULL OR status ILIKE 'published')
        ORDER BY created_at DESC
        LIMIT 3
      `;

      const [bhajans, articles, festivals] = await Promise.all([
        db.query(relatedBhajansQuery, [id, deity_id || null]),
        db.query(relatedArticlesQuery, [id]),
        db.query(relatedFestivalsQuery, [id])
      ]);

      return sendSuccess(res, 'Related festival content fetched', {
        relatedBhajans: bhajans.rows,
        relatedArticles: articles.rows,
        relatedFestivals: festivals.rows
      });
    } catch (error) {
      next(error);
    }
  };

  // 10. Puranas List
  public getPuranas = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 12;
      const offset = (page - 1) * limit;
      const search = req.query.search as string;
      const lang = (req.query.lang as string) || 'hi';

      const whereClauses = ["status = 'PUBLISHED'", 'deleted_at IS NULL'];
      const queryParams: any[] = [];

      if (search) {
        queryParams.push(`%${search}%`);
        whereClauses.push(
          `(title ILIKE $${queryParams.length} OR short_description ILIKE $${queryParams.length} OR title_en ILIKE $${queryParams.length})`
        );
      }

      const whereStr = `WHERE ${whereClauses.join(' AND ')}`;

      const dataQuery = `
        SELECT id, title, title_en, slug, short_description, description_en, cover_image, pdf_file, language, author, view_count, download_count
        FROM puranas
        ${whereStr}
        ORDER BY display_order ASC, created_at DESC
        LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
      `;

      const countQuery = `SELECT COUNT(*) as total FROM puranas ${whereStr}`;

      const [dataRes, countRes] = await Promise.all([
        db.query(dataQuery, [...queryParams, limit, offset]),
        db.query(countQuery, queryParams)
      ]);

      const total = parseInt(countRes.rows[0].total, 10) || 0;

      const rows = dataRes.rows.map((p) => ({
        ...p,
        displayTitle: lang === 'en' && p.title_en ? p.title_en : p.title,
        displayDescription: lang === 'en' && p.description_en ? p.description_en : p.short_description
      }));

      return sendSuccess(res, 'Puranas fetched successfully', rows, {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      });
    } catch (error) {
      next(error);
    }
  };

  // 11. Purana By Slug
  public getPuranBySlug = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const slug = req.params.slug as string;
      const lang = (req.query.lang as string) || 'hi';

      const data = await puranService.getBySlug(slug);
      if (!data) return sendSuccess(res, 'Purana not found', null);

      const result = {
        ...data,
        displayTitle: lang === 'en' && data.title_en ? data.title_en : data.title,
        displayDescription:
          lang === 'en' && data.description_en
            ? data.description_en
            : data.short_description || data.shortDescription || data.description
      };

      return sendSuccess(res, 'Purana fetched successfully', result);
    } catch (error) {
      next(error);
    }
  };

  // 12. Purana PDF URL
  public getPuranPdfUrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const isDownload = req.query.download === 'true';
      const url = await puranService.getPdfUrl(req.params.id as string, isDownload);
      return sendSuccess(res, 'PDF URL generated', { url });
    } catch (error) {
      next(error);
    }
  };

  // 13. Deities List
  public getDeities = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = `
        SELECT id, name, slug, short_description, image, featured, display_order
        FROM deities
        WHERE status = 'ACTIVE' OR status IS NULL
        ORDER BY display_order ASC, name ASC
      `;
      const { rows } = await db.query(query);
      return sendSuccess(res, 'Deities fetched successfully', rows);
    } catch (error) {
      next(error);
    }
  };

  // 14. Deity By Slug
  public getDeityBySlug = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { slug } = req.params;

      const deityRes = await db.query(
        `SELECT * FROM deities WHERE (slug = $1 OR id::text = $1) AND (status = 'ACTIVE' OR status IS NULL) LIMIT 1`,
        [slug]
      );

      if (deityRes.rows.length === 0) {
        return sendSuccess(res, 'Deity not found', null);
      }

      const deity = deityRes.rows[0];

      // Fetch related Bhajans
      const bhajansRes = await db.query(
        `SELECT b.id, b.title, b.slug, COALESCE(b.thumbnail_url, b.image_url, b.open_graph_image) as thumbnail_url, b.youtube_video_id, b.views, b.duration
         FROM bhajans b
         WHERE (b.god_id = $1 OR b.god_id::text = $1::text) AND b.status = 'PUBLISHED' AND b.deleted_at IS NULL
         ORDER BY b.popularity_score DESC NULLS LAST, b.created_at DESC LIMIT 8`,
        [deity.id]
      );

      // Fetch related Articles
      const articlesRes = await db.query(
        `SELECT a.id, a.title, a.title_en, a.slug, a.excerpt, m.url as featured_image_url
         FROM articles a
         JOIN article_gods ag ON a.id = ag.article_id
         LEFT JOIN media_files m ON a.featured_image_id = m.id
         WHERE ag.god_id = $1 AND a.status = 'PUBLISHED' AND a.deleted_at IS NULL
         ORDER BY a.created_at DESC LIMIT 6`,
        [deity.id]
      );

      // Fetch related Festivals
      const festivalsRes = await db.query(
        `SELECT f.id, f.name, f.name_en, f.slug, f.short_description, f.banner_image, f.festival_date, f.category
         FROM festivals f
         WHERE (f.deity_id = $1 OR f.deity_id::text = $1::text) AND (f.status = 'PUBLISHED' OR f.status IS NULL)
         ORDER BY f.festival_date ASC NULLS LAST LIMIT 6`,
        [deity.id]
      );

      return sendSuccess(res, 'Deity retrieved successfully', {
        deity,
        relatedBhajans: bhajansRes.rows,
        relatedArticles: articlesRes.rows,
        relatedFestivals: festivalsRes.rows
      });
    } catch (error) {
      next(error);
    }
  };

  // 15. Categories List
  public getCategories = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = `
        SELECT id, name, slug, description, image_url, icon_url, show_in_navigation, is_featured, display_order
        FROM categories
        WHERE status = 'PUBLISHED' OR status IS NULL
        ORDER BY display_order ASC, name ASC
      `;
      const { rows } = await db.query(query);
      return sendSuccess(res, 'Categories fetched successfully', rows);
    } catch (error) {
      next(error);
    }
  };

  // 16. Category By Slug
  public getCategoryBySlug = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { slug } = req.params;

      const catRes = await db.query(`SELECT * FROM categories WHERE (slug = $1 OR id::text = $1) LIMIT 1`, [slug]);

      if (catRes.rows.length === 0) {
        return sendSuccess(res, 'Category not found', null);
      }

      const category = catRes.rows[0];

      // Fetch associated Bhajans
      const bhajansRes = await db.query(
        `SELECT b.id, b.title, b.slug, COALESCE(b.thumbnail_url, b.image_url, b.open_graph_image) as thumbnail_url, b.youtube_video_id, b.views, b.duration
         FROM bhajans b
         WHERE b.category_id = $1 AND b.status = 'PUBLISHED' AND b.deleted_at IS NULL
         ORDER BY b.created_at DESC LIMIT 12`,
        [category.id]
      );

      // Fetch associated Articles
      const articlesRes = await db.query(
        `SELECT a.id, a.title, a.title_en, a.slug, a.excerpt, m.url as featured_image_url
         FROM articles a
         LEFT JOIN media_files m ON a.featured_image_id = m.id
         WHERE a.category_id = $1 AND a.status = 'PUBLISHED' AND a.deleted_at IS NULL
         ORDER BY a.created_at DESC LIMIT 12`,
        [category.id]
      );

      return sendSuccess(res, 'Category retrieved successfully', {
        category,
        bhajans: bhajansRes.rows,
        articles: articlesRes.rows
      });
    } catch (error) {
      next(error);
    }
  };

  // 17. Authors List & Detail
  public getAuthors = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { rows } = await db.query(
        `SELECT id, name, short_description, photo, website_url FROM authors WHERE status = 'ACTIVE' AND deleted_at IS NULL ORDER BY name ASC`
      );
      return sendSuccess(res, 'Authors fetched', rows);
    } catch (error) {
      next(error);
    }
  };

  public getAuthorById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { rows } = await db.query(
        `SELECT * FROM authors WHERE (id::text = $1 OR name ILIKE $1) AND deleted_at IS NULL LIMIT 1`,
        [id]
      );
      if (rows.length === 0) return sendSuccess(res, 'Author not found', null);

      const author = rows[0];

      const articlesRes = await db.query(
        `SELECT a.id, a.title, a.slug, a.excerpt, m.url as featured_image_url
         FROM articles a LEFT JOIN media_files m ON a.featured_image_id = m.id
         WHERE a.author_id = $1 AND a.status = 'PUBLISHED' AND a.deleted_at IS NULL
         ORDER BY a.created_at DESC LIMIT 10`,
        [author.id]
      );

      return sendSuccess(res, 'Author fetched', { author, articles: articlesRes.rows });
    } catch (error) {
      next(error);
    }
  };
}

export const publicController = new PublicController();
