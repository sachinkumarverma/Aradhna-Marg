import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '@/errors/appError';
import { logger } from '@utils/logger';
import jwt from 'jsonwebtoken';
import { config } from '@/config';

export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid authorization token');
    }

    const token = authHeader.split(' ')[1];

    // Verify token using our own JWT_SECRET
    let decoded: any;
    try {
      decoded = jwt.verify(token, config.JWT_SECRET);
    } catch (jwtError) {
      throw new UnauthorizedError('Invalid or expired token');
    }

    if (!decoded) {
      throw new UnauthorizedError('Invalid or expired token');
    }

    req.user = decoded;
    next();
  } catch (error) {
    logger.warn({ error }, 'Admin access denied');
    next(error);
  }
};

// Types extension for Express Request
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}
