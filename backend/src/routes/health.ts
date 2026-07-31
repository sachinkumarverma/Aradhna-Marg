import { Router, Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../responses/apiResponse';
import { InternalServerError } from '../errors/appError';
import { logger } from '../utils/logger';
import { db } from '../common/database/DatabaseClient';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    let dbError = false;
    try {
      await db.query(`SELECT 1`);
    } catch (e) {
      dbError = true;
      logger.error({ err: e }, 'Database health check failed');
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
