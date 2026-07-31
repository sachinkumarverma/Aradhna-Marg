import { Router, Request, Response, NextFunction } from 'express';
import { db } from '@common/database/DatabaseClient';
import { sendSuccess } from '@/responses/apiResponse';

const router = Router();

// Get Youtube Video by ID (or slug)
router.get('/videos/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    
    // First try to find a bhajan with this slug
    let query = `SELECT * FROM bhajans WHERE slug = $1 LIMIT 1`;
    let result = await db.query(query, [slug]);
    
    if (result.rows.length === 0) {
      // If no bhajan, try youtube_videos by youtube_video_id
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
          string_duration: ytData.duration || "00:00",
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
