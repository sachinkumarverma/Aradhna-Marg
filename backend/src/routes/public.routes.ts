import { Router, Request, Response, NextFunction } from 'express';
import { db } from '@common/database/DatabaseClient';
import { sendSuccess } from '@/responses/apiResponse';
import { publicController } from '@controllers/PublicController';
import { isShortVideo } from '@utils/videoUtils';

const router = Router();

// Home payload
router.get('/home', publicController.getHomeData);

// Bhajans
router.get('/bhajans', publicController.getBhajans);
router.get('/bhajans/:slug/related', publicController.getBhajanRelated);
router.get('/bhajans/:slug', publicController.getBhajanBySlug);

// Articles
router.get('/articles', publicController.getArticles);
router.get('/articles/:slug/related', publicController.getArticleRelated);
router.get('/articles/:slug', publicController.getArticleBySlug);

// Festivals
router.get('/festivals', publicController.getFestivals);
router.get('/festivals/:slug/related', publicController.getFestivalRelated);
router.get('/festivals/:slug', publicController.getFestivalBySlug);

// Puranas / Sacred Scriptures
router.get('/puranas', publicController.getPuranas);
router.get('/puranas/:id/pdf', publicController.getPuranPdfUrl);
router.get('/puranas/:slug', publicController.getPuranBySlug);

// PDF CORS Proxy for client PDF.js rendering
router.get('/proxy-pdf', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pdfUrl = req.query.url as string;
    if (!pdfUrl) {
      return res.status(400).json({ error: 'url parameter is required' });
    }

    const { default: axios } = await import('axios');
    const response = await axios.get(pdfUrl, {
      responseType: 'arraybuffer',
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(Buffer.from(response.data));
  } catch (error) {
    next(error);
  }
});

// Deities / Gods
router.get('/deities', publicController.getDeities);
router.get('/deities/:slug', publicController.getDeityBySlug);
router.get('/gods', publicController.getDeities);
router.get('/gods/:slug', publicController.getDeityBySlug);

// Categories
router.get('/categories', publicController.getCategories);
router.get('/categories/:slug', publicController.getCategoryBySlug);

// Authors
router.get('/authors', publicController.getAuthors);
router.get('/authors/:id', publicController.getAuthorById);

// Existing YouTube Videos endpoints
router.get('/videos', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const excludeShorts = req.query.excludeShorts === 'true';
    const offset = (page - 1) * limit;

    const whereConditions = ["import_status != 'IGNORED'"];
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (search) {
      whereConditions.push(`(title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    const query = `
      SELECT * FROM youtube_videos
      WHERE ${whereClause}
      ORDER BY published_at DESC
    `;
    const { rows } = await db.query(query, queryParams);

    let filtered = rows;

    if (excludeShorts) {
      filtered = filtered.filter((row: any) => !isShortVideo(row));
    }

    const total = filtered.length;
    const paginatedRows = filtered.slice(offset, offset + limit);

    return sendSuccess(res, 'Videos retrieved', paginatedRows, {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    next(error);
  }
});

router.get('/videos/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;

    let query = `SELECT * FROM bhajans WHERE slug = $1 LIMIT 1`;
    let result = await db.query(query, [slug]);

    if (result.rows.length === 0) {
      query = `SELECT * FROM youtube_videos WHERE youtube_video_id = $1 LIMIT 1`;
      result = await db.query(query, [slug]);

      if (result.rows.length > 0) {
        const ytData = result.rows[0];
        const data = {
          id: ytData.id,
          title: ytData.title,
          description: ytData.description,
          youtube_video_id: ytData.youtube_video_id,
          god_id: ytData.channel_name,
          views: ytData.view_count,
          duration: null,
          is_string_duration: true,
          string_duration: ytData.duration || '00:00',
          published_date: ytData.published_at,
          lyrics: ytData.description
        };
        return sendSuccess(res, 'Video retrieved', data);
      }

      return sendSuccess(res, 'Not found', null);
    }

    return sendSuccess(res, 'Bhajan retrieved', result.rows[0]);
  } catch (error) {
    next(error);
  }
});

export default router;
