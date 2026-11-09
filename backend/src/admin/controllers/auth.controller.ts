import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { sendSuccess } from '@/responses/apiResponse';
import { UnauthorizedError } from '@/errors/appError';
import { config } from '@/config';
import { logger } from '@utils/logger';
import { verifyGoogleToken } from '@utils/auth';

class AuthController {
  /**
   * POST /api/auth/login
   * Validates username/password from env and returns a signed JWT.
   */
  public login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        throw new UnauthorizedError('Username and password are required');
      }

      // Compare against env-configured admin credentials
      if (username !== config.ADMIN_USERNAME || password !== config.ADMIN_PASSWORD) {
        throw new UnauthorizedError('Invalid credentials');
      }

      // Sign a JWT valid for 24 hours
      const token = jwt.sign({ username, role: 'admin' }, config.JWT_SECRET, { expiresIn: '24h' });

      logger.info(`Admin login successful for user: ${username}`);

      return sendSuccess(res, 'Login successful', {
        token,
        user: { username, role: 'admin' },
        expiresIn: '24h'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/admin/auth/google
   * Verifies Google token and checks if email is an authorized admin.
   */
  public googleLogin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { credential } = req.body;
      if (!credential) {
        throw new UnauthorizedError('Google credential is required');
      }

      const googleUser = await verifyGoogleToken(credential);
      const email = googleUser.email.toLowerCase();

      // Check against allowed admin emails in env
      const allowedEmails = (process.env.ADMIN_ALLOWED_EMAILS || process.env.ADMIN_EMAIL || config.ADMIN_USERNAME || '')
        .toLowerCase()
        .split(',')
        .map((e) => e.trim())
        .filter(Boolean);

      const isAllowed = allowedEmails.some(
        (allowed) => allowed === email || (allowed.includes('@') && allowed === email)
      );

      if (!isAllowed) {
        logger.warn({ email }, 'Unauthorized admin Google login attempt');
        throw new UnauthorizedError(`ईमेल ${email} एडमिन के रूप में अधिकृत नहीं है। (Unauthorized admin email)`);
      }

      // Sign Admin JWT valid for 24 hours
      const token = jwt.sign({ username: googleUser.name || email, email, role: 'admin' }, config.JWT_SECRET, {
        expiresIn: '24h'
      });

      logger.info(`Admin Google login successful for email: ${email}`);

      return sendSuccess(res, 'Admin Google login successful', {
        token,
        user: { username: googleUser.name || email, email, role: 'admin' },
        expiresIn: '24h'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/auth/logout
   * Stateless JWT logout — client simply drops the token.
   */
  public logout = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      return sendSuccess(res, 'Logged out successfully', {});
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/auth/me
   * Returns decoded user info from the JWT attached by requireAdmin middleware.
   */
  public me = async (req: Request, res: Response, next: NextFunction) => {
    try {
      return sendSuccess(res, 'User info', { user: req.user });
    } catch (error) {
      next(error);
    }
  };
}

export const authController = new AuthController();
