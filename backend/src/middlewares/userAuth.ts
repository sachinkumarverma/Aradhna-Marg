import { Request, Response, NextFunction } from 'express';
import { verifyUserToken, UserJwtPayload } from '@utils/auth';
import { AppError } from '@/errors/appError';
import { userRepository } from '@repositories/UserRepository';

export interface AuthenticatedUserRequest extends Request {
  user?: UserJwtPayload;
}

export async function requireUser(req: AuthenticatedUserRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('लॉग इन आवश्यक है। कृपया पहले लॉग इन करें।', 401));
  }

  const token = authHeader.split(' ')[1];
  let decoded: UserJwtPayload;
  try {
    decoded = verifyUserToken(token);
    if (!decoded || decoded.role !== 'user') {
      return next(new AppError('अमान्य या समाप्त सत्र। कृपया पुनः लॉग इन करें।', 401));
    }
  } catch {
    return next(new AppError('आपका सत्र समाप्त हो गया है। कृपया पुनः लॉग इन करें।', 401));
  }

  try {
    const user = await userRepository.findById(decoded.id);
    if (!user) {
      return next(new AppError('उपयोगकर्ता खाता उपलब्ध नहीं है। कृपया पुनः लॉग इन करें।', 401));
    }
    if (!user.is_active) {
      return next(new AppError('Your account has been deactivated. Please contact support.', 401));
    }
    if (!user.is_verified) {
      return next(new AppError('Your email address has not been verified yet.', 403));
    }

    req.user = decoded;
    return next();
  } catch (error) {
    return next(error);
  }
}

export async function optionalUser(req: AuthenticatedUserRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = verifyUserToken(token);
      if (decoded && decoded.role === 'user') {
        const user = await userRepository.findById(decoded.id);
        if (user?.is_active) {
          req.user = decoded;
        }
      }
    } catch {
      // Ignore token failure in optional middleware
    }
  }
  next();
}
