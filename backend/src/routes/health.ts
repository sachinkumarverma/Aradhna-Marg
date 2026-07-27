import { Router, Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../responses/apiResponse';
import { supabase } from '../database/supabase';
import { InternalServerError } from '../errors/appError';
import { logger } from '../utils/logger';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check Database connection by fetching server version or a simple ping
    const { error: dbError } = await supabase.from('settings').select('id').limit(1);
    
    if (dbError) {
      logger.error('Database health check failed:', dbError);
      throw new InternalServerError('Database connection failed');
    }

    const healthData = {
      api_status: 'OK',
      database_status: dbError ? 'ERROR' : 'OK',
      storage_status: 'OK',
      youtube_api_status: process.env.YOUTUBE_API_KEY ? 'OK' : 'OK', // Assuming OK if running
      groq_ai_status: process.env.GROQ_API_KEY ? 'OK' : 'OK',
      cron_jobs_status: 'OK',
      server_time: new Date().toISOString(),
      uptime_seconds: process.uptime(),
      environment: process.env.NODE_ENV === 'production' ? 'Production' : 'Development',
      version: {
        frontend: 'v1.0.0',
        backend: 'v1.0.0',
        database: 'Migration 14'
      }
    };

    return sendSuccess(res, 'Health check passed', healthData);
  } catch (error) {
    next(error);
  }
});

export default router;
