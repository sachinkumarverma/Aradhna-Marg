import { Response } from 'express';
import { userService } from '@services/UserService';
import { wishlistRepository } from '@repositories/WishlistRepository';
import { AuthenticatedUserRequest } from '@middlewares/userAuth';
import { config } from '@/config';

export class UserAuthController {
  private getLang = (req: AuthenticatedUserRequest): 'hi' | 'en' => {
    const h = req.headers['accept-language'];
    return h && h.toLowerCase().includes('hi') ? 'hi' : 'en';
  };

  signup = async (req: AuthenticatedUserRequest, res: Response) => {
    const lang = this.getLang(req);
    const { name, email, password } = req.body;
    const result = await userService.signup({ name, email, password }, lang);
    return res.status(201).json({
      success: true,
      message: lang === 'hi' ? 'खाता सफलतापूर्वक बनाया गया।' : 'Account created successfully.',
      data: result
    });
  };

  login = async (req: AuthenticatedUserRequest, res: Response) => {
    const lang = this.getLang(req);
    const { email, password } = req.body;
    const result = await userService.login({ email, password }, lang);
    return res.status(200).json({
      success: true,
      message: lang === 'hi' ? 'सफलतापूर्वक लॉग इन किया गया।' : 'Logged in successfully.',
      data: result
    });
  };

  googleAuth = async (req: AuthenticatedUserRequest, res: Response) => {
    const lang = this.getLang(req);
    const { credential, mode = 'login' } = req.body;
    const result = await userService.googleAuth(credential, mode, lang);
    return res.status(200).json({
      success: true,
      message:
        mode === 'signup'
          ? lang === 'hi'
            ? 'Google द्वारा खाता बनाया गया।'
            : 'Account registered with Google.'
          : lang === 'hi'
            ? 'Google द्वारा लॉग इन सफल रहा।'
            : 'Signed in with Google successfully.',
      data: result
    });
  };

  /**
   * POST /api/v1/auth/google/callback
   * Handles Google Identity Services redirect callback (application/x-www-form-urlencoded)
   */
  googleRedirectCallback = async (req: AuthenticatedUserRequest, res: Response) => {
    const frontendBaseUrl =
      process.env.FRONTEND_URL ||
      (config.NODE_ENV === 'production' ? 'https://aradhnamarg.com' : 'http://localhost:5173');

    // Extract auth mode from state body param, cookie, or query param
    const cookieHeader = req.headers.cookie || '';
    const cookieMatch = cookieHeader.match(/google_auth_mode=([^;]+)/);
    const cookieMode = cookieMatch ? cookieMatch[1] : undefined;
    const rawMode = (req.body?.state as string) || cookieMode || (req.query?.mode as string);
    const mode: 'login' | 'signup' = rawMode === 'signup' ? 'signup' : 'login';

    try {
      const credential = req.body?.credential;
      if (!credential) {
        return res.redirect(
          `${frontendBaseUrl}/auth?error=${encodeURIComponent('No credential received from Google')}&mode=${mode}`
        );
      }

      const lang = this.getLang(req);
      const result = await userService.handleGoogleRedirect(credential, mode, lang);
      if ((result as any).requiresVerification) {
        return res.redirect(
          `${frontendBaseUrl}/auth?verificationSent=true&email=${encodeURIComponent((result as any).email)}&mode=login`
        );
      }
      return res.redirect(
        `${frontendBaseUrl}/auth?token=${encodeURIComponent((result as any).token)}&authSuccess=true`
      );
    } catch (err: any) {
      return res.redirect(
        `${frontendBaseUrl}/auth?error=${encodeURIComponent(err?.message || 'Google authentication failed')}&mode=${mode}`
      );
    }
  };

  verifyEmail = async (req: AuthenticatedUserRequest, res: Response) => {
    const frontendBaseUrl =
      process.env.FRONTEND_URL ||
      (config.NODE_ENV === 'production' ? 'https://aradhnamarg.com' : 'http://localhost:5173');

    const token = (req.query?.token as string) || (req.body?.token as string);
    const lang = this.getLang(req);

    if (!token) {
      if (req.method === 'POST') {
        return res.status(400).json({ success: false, message: 'Verification token is required.' });
      }
      return res.redirect(
        `${frontendBaseUrl}/auth?error=${encodeURIComponent('Verification token is required.')}&mode=login`
      );
    }

    try {
      const result = await userService.verifyEmail(token, lang);
      if (req.method === 'POST') {
        return res.status(200).json({ success: true, message: result.message });
      }
      return res.redirect(`${frontendBaseUrl}/auth?verified=true&mode=login`);
    } catch (err: any) {
      if (req.method === 'POST') {
        return res.status(400).json({ success: false, message: err?.message || 'Verification failed.' });
      }
      return res.redirect(
        `${frontendBaseUrl}/auth?error=${encodeURIComponent(err?.message || 'Verification failed.')}&mode=login`
      );
    }
  };

  resendVerification = async (req: AuthenticatedUserRequest, res: Response) => {
    const { email } = req.body;
    const lang = this.getLang(req);
    const result = await userService.resendVerification(email, lang);
    return res.status(200).json(result);
  };

  forgotPassword = async (req: AuthenticatedUserRequest, res: Response) => {
    const lang = this.getLang(req);
    const { email } = req.body;
    const result = await userService.forgotPassword(email, lang);
    return res.status(200).json(result);
  };

  resetPassword = async (req: AuthenticatedUserRequest, res: Response) => {
    const lang = this.getLang(req);
    const { token, password } = req.body;
    const result = await userService.resetPassword(token, password, lang);
    return res.status(200).json(result);
  };

  getMe = async (req: AuthenticatedUserRequest, res: Response) => {
    const lang = this.getLang(req);
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const profile = await userService.getProfile(req.user.id, lang);
    return res.status(200).json({
      success: true,
      data: profile
    });
  };

  getWishlist = async (req: AuthenticatedUserRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const items = await wishlistRepository.getByUserId(req.user.id);
    return res.status(200).json({
      success: true,
      data: items
    });
  };

  toggleWishlist = async (req: AuthenticatedUserRequest, res: Response) => {
    const lang = this.getLang(req);
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const { itemId, itemType = 'bhajan', title, hindiTitle, slug } = req.body;

    const exists = await wishlistRepository.exists(req.user.id, String(itemId), itemType);
    if (exists) {
      await wishlistRepository.remove(req.user.id, String(itemId), itemType);
      return res.status(200).json({
        success: true,
        action: 'removed',
        message: lang === 'hi' ? 'पसंद सूची से हटाया गया।' : 'Removed from favorites.'
      });
    } else {
      const added = await wishlistRepository.add({
        user_id: req.user.id,
        item_id: String(itemId),
        item_type: itemType,
        title: title || 'Bhajan',
        hindi_title: hindiTitle,
        slug
      });
      return res.status(200).json({
        success: true,
        action: 'added',
        message: lang === 'hi' ? 'पसंद सूची में जोड़ा गया।' : 'Added to favorites.',
        data: added
      });
    }
  };

  syncWishlist = async (req: AuthenticatedUserRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const { items } = req.body;
    if (Array.isArray(items) && items.length > 0) {
      await wishlistRepository.syncBatch(req.user.id, items);
    }
    const updated = await wishlistRepository.getByUserId(req.user.id);
    return res.status(200).json({
      success: true,
      data: updated
    });
  };
}

export const userAuthController = new UserAuthController();
