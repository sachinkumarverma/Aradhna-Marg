import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { sendSuccess } from '@/responses/apiResponse';
import { UnauthorizedError } from '@/errors/appError';
import { config } from '@/config';
import { logger } from '@utils/logger';
import { verifyGoogleToken } from '@utils/auth';
import { userRepository } from '@repositories/UserRepository';

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

      // Sign a JWT valid for 1 hour
      const adminEmail = config.ADMIN_EMAIL || 'admin@aradhnamarg.com';
      const expiresIn = (config.JWT_ADMIN_EXPIRES_IN || '1h') as any;
      const token = jwt.sign({ username, name: 'Admin User', email: adminEmail, role: 'admin' }, config.JWT_SECRET, {
        expiresIn
      });

      logger.info(`Admin login successful for user: ${username}`);

      return sendSuccess(res, 'Login successful', {
        token,
        user: { username, name: 'Admin User', email: adminEmail, role: 'admin' },
        expiresIn
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Helper: verify Google credential and authorize as admin
   */
  private verifyAndAuthorizeAdmin = async (
    credential: string
  ): Promise<{ token: string; user: any; email: string }> => {
    if (!credential) {
      throw new UnauthorizedError('Google credential is required');
    }

    const googleUser = await verifyGoogleToken(credential);
    const email = googleUser.email.toLowerCase();

    // Check against allowed admin emails in env (ADMIN_ALLOWED_EMAILS strictly takes priority)
    const rawAllowed = (config.ADMIN_ALLOWED_EMAILS || process.env.ADMIN_ALLOWED_EMAILS || '').trim();
    const allowedEmails = (rawAllowed ? rawAllowed : config.ADMIN_EMAIL || config.ADMIN_USERNAME || '')
      .toLowerCase()
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean);

    const isAllowed = allowedEmails.some((allowed) => allowed === email);

    if (!isAllowed) {
      logger.warn({ email }, 'Unauthorized admin Google login attempt');
      throw new UnauthorizedError(`Email ${email} is not authorized as an administrator.`);
    }

    // Check if user exists in database and ensure active status
    const user = await userRepository.findByEmail(email);
    if (user && user.is_active === false) {
      logger.warn({ email }, 'Deactivated admin Google login attempt');
      throw new UnauthorizedError('Your administrator account has been deactivated.');
    }

    // Sync Google profile data and update last login in users table
    if (user) {
      if (!user.google_id || !user.avatar_url) {
        await userRepository.updateGoogleId(user.id, googleUser.sub, googleUser.picture);
      }
      await userRepository.updateLastLogin(user.id);
    } else {
      await userRepository.create({
        name: googleUser.name || 'Admin',
        email,
        google_id: googleUser.sub,
        avatar_url: googleUser.picture,
        is_verified: true
      });
    }

    const adminName = googleUser.name || 'Admin User';
    const avatarUrl = googleUser.picture || null;
    const expiresIn = (config.JWT_ADMIN_EXPIRES_IN || '1h') as any;

    // Sign Admin JWT valid for 1 hour
    const token = jwt.sign(
      { username: adminName, name: adminName, email, avatar_url: avatarUrl, role: 'admin' },
      config.JWT_SECRET,
      { expiresIn }
    );

    return {
      token,
      user: { username: adminName, name: adminName, email, avatar_url: avatarUrl, role: 'admin' },
      email
    };
  };

  /**
   * POST /api/admin/auth/google
   * Verifies Google token and returns JSON response.
   */
  public googleLogin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { credential } = req.body;
      const { token, user, email } = await this.verifyAndAuthorizeAdmin(credential);
      const expiresIn = (config.JWT_ADMIN_EXPIRES_IN || '1h') as any;
      logger.info(`Admin Google login successful for email: ${email}`);

      return sendSuccess(res, 'Admin Google login successful', {
        token,
        user,
        expiresIn
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/admin/auth/google/callback
   * Handles Google Identity Services redirect callback (application/x-www-form-urlencoded)
   */
  public googleRedirectCallback = async (req: Request, res: Response) => {
    const adminBaseUrl =
      process.env.ADMIN_FRONTEND_URL ||
      (config.NODE_ENV === 'production' ? 'https://admin.aradhnamarg.com' : 'http://localhost:5173/admin');

    try {
      const credential = req.body?.credential;
      const { token, email } = await this.verifyAndAuthorizeAdmin(credential);
      logger.info(`Admin Google redirect login successful for email: ${email}`);

      return res.redirect(`${adminBaseUrl}/login?token=${encodeURIComponent(token)}&authSuccess=true`);
    } catch (error: any) {
      logger.error('Admin Google redirect callback error:', error.message || error);
      return res.redirect(
        `${adminBaseUrl}/login?error=${encodeURIComponent(error.message || 'Google authorization failed')}`
      );
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

  /**
   * POST /api/admin/auth/refresh
   * Extends the active admin session with a fresh 1-hour JWT.
   */
  public refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      const adminEmail = user?.email || config.ADMIN_EMAIL || 'admin@aradhnamarg.com';
      const adminName = user?.name || user?.username || 'Admin User';
      const avatarUrl = user?.avatar_url || null;
      const expiresIn = (config.JWT_ADMIN_EXPIRES_IN || '1h') as any;

      const token = jwt.sign(
        {
          username: user?.username || adminName,
          name: adminName,
          email: adminEmail,
          avatar_url: avatarUrl,
          role: 'admin'
        },
        config.JWT_SECRET,
        { expiresIn }
      );

      return sendSuccess(res, 'Session extended successfully', {
        token,
        user: {
          username: user?.username || adminName,
          name: adminName,
          email: adminEmail,
          avatar_url: avatarUrl,
          role: 'admin'
        },
        expiresIn
      });
    } catch (error) {
      next(error);
    }
  };
}

export const authController = new AuthController();
