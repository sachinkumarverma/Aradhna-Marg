import { NextFunction, Request, RequestHandler, Response, Router } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '@common/database/DatabaseClient';
import { logger } from '@utils/logger';
import { config } from '@/config';
import { requireAdmin } from '@/middlewares/auth';
import { systemHealthService } from '@/services/SystemHealthService';

const createRateLimiter = (windowMs: number, maxRequests: number): RequestHandler => {
  const requests = new Map<string, { count: number; resetAt: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const key = req.ip || 'unknown';

    if (requests.size > 1_000) {
      for (const [entryKey, entry] of requests) {
        if (entry.resetAt <= now) requests.delete(entryKey);
      }
    }

    const current = requests.get(key);

    if (!current || current.resetAt <= now) {
      requests.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (current.count >= maxRequests) {
      res.setHeader('Retry-After', Math.ceil((current.resetAt - now) / 1000));
      return res.status(429).json({
        success: false,
        message: 'Too many health checks',
        status: 'RATE_LIMITED'
      });
    }

    current.count += 1;
    return next();
  };
};

const publicHealthRateLimiter = createRateLimiter(60_000, 60);
const internalHealthRateLimiter = createRateLimiter(60_000, 30);

const publicHealthRouter = Router();

publicHealthRouter.get('/', publicHealthRateLimiter, async (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  // If request contains admin Authorization token, return detailed diagnostics
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, config.JWT_SECRET);
      if (decoded) {
        const health = await systemHealthService.getDetailedHealth();
        const healthy = health.api_status === 'OK';
        return res.status(healthy ? 200 : 503).json({
          success: healthy,
          message: healthy ? 'Detailed health check passed' : 'Service diagnostics detected a failure',
          status: healthy ? 'OK' : 'ERROR',
          data: health
        });
      }
    } catch {
      // Fall through to public ping if token is invalid
    }
  }

  try {
    await db.query('SELECT 1');
    return res.status(200).json({
      success: true,
      message: 'Service is healthy',
      status: 'OK'
    });
  } catch (error) {
    logger.error({ err: error }, 'Public health check failed');
    return res.status(503).json({
      success: false,
      message: 'Service unavailable',
      status: 'ERROR'
    });
  }
});

export const internalHealthRoutes = Router();

internalHealthRoutes.get('/', internalHealthRateLimiter, requireAdmin, async (_req: Request, res: Response) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const health = await systemHealthService.getDetailedHealth();
    const healthy = health.api_status === 'OK';

    return res.status(healthy ? 200 : 503).json({
      success: healthy,
      message: healthy ? 'Detailed health check passed' : 'Service diagnostics detected a failure',
      status: healthy ? 'OK' : 'ERROR',
      data: health
    });
  } catch (error) {
    logger.error({ err: error }, 'Internal health diagnostics failed');
    return res.status(503).json({
      success: false,
      message: 'Health diagnostics unavailable',
      status: 'ERROR'
    });
  }
});

export default publicHealthRouter;
