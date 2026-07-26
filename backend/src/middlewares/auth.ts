import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../errors/appError';
import { supabase } from '../database/supabase';
import { logger } from '../utils/logger';

export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid authorization token');
    }

    const token = authHeader.split(' ')[1];

    // Verify token with Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new UnauthorizedError('Invalid or expired token');
    }

    // In a single-admin system, you can verify the email or a role claim
    // For this architecture, we assume any valid user in this Supabase project is the admin
    // as registrations are disabled globally.

    req.user = user;
    next();
  } catch (error) {
    logger.warn('Admin access denied', error);
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
