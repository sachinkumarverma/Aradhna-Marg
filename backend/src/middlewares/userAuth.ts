import { Request, Response, NextFunction } from 'express';
import { verifyUserToken, UserJwtPayload } from '@utils/auth';
import { AppError } from '@/errors/appError';

export interface AuthenticatedUserRequest extends Request {
  user?: UserJwtPayload;
}

export function requireUser(req: AuthenticatedUserRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('लॉग इन आवश्यक है। कृपया पहले लॉग इन करें।', 401));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyUserToken(token);
    if (!decoded || decoded.role !== 'user') {
      return next(new AppError('अमान्य या समाप्त सत्र। कृपया पुनः लॉग इन करें।', 401));
    }
    req.user = decoded;
    next();
  } catch {
    return next(new AppError('आपका सत्र समाप्त हो गया है। कृपया पुनः लॉग इन करें।', 401));
  }
}

export function optionalUser(req: AuthenticatedUserRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = verifyUserToken(token);
      if (decoded && decoded.role === 'user') {
        req.user = decoded;
      }
    } catch {
      // Ignore token failure in optional middleware
    }
  }
  next();
}
