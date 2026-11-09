import { Response } from 'express';
import { userService } from '@services/UserService';
import { wishlistRepository } from '@repositories/WishlistRepository';
import { AuthenticatedUserRequest } from '@middlewares/userAuth';

export class UserAuthController {
  private getLang(req: AuthenticatedUserRequest): 'hi' | 'en' {
    const h = req.headers['accept-language'];
    return h && h.toLowerCase().includes('hi') ? 'hi' : 'en';
  }

  async signup(req: AuthenticatedUserRequest, res: Response) {
    const lang = this.getLang(req);
    const { name, email, password } = req.body;
    const result = await userService.signup({ name, email, password }, lang);
    return res.status(201).json({
      success: true,
      message: lang === 'hi' ? 'खाता सफलतापूर्वक बनाया गया।' : 'Account created successfully.',
      data: result
    });
  }

  async login(req: AuthenticatedUserRequest, res: Response) {
    const lang = this.getLang(req);
    const { email, password } = req.body;
    const result = await userService.login({ email, password }, lang);
    return res.status(200).json({
      success: true,
      message: lang === 'hi' ? 'सफलतापूर्वक लॉग इन किया गया।' : 'Logged in successfully.',
      data: result
    });
  }

  async googleAuth(req: AuthenticatedUserRequest, res: Response) {
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
  }

  async forgotPassword(req: AuthenticatedUserRequest, res: Response) {
    const lang = this.getLang(req);
    const { email } = req.body;
    const result = await userService.forgotPassword(email, lang);
    return res.status(200).json(result);
  }

  async resetPassword(req: AuthenticatedUserRequest, res: Response) {
    const lang = this.getLang(req);
    const { token, password } = req.body;
    const result = await userService.resetPassword(token, password, lang);
    return res.status(200).json(result);
  }

  async getMe(req: AuthenticatedUserRequest, res: Response) {
    const lang = this.getLang(req);
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const profile = await userService.getProfile(req.user.id, lang);
    return res.status(200).json({
      success: true,
      data: profile
    });
  }

  async getWishlist(req: AuthenticatedUserRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const items = await wishlistRepository.getByUserId(req.user.id);
    return res.status(200).json({
      success: true,
      data: items
    });
  }

  async toggleWishlist(req: AuthenticatedUserRequest, res: Response) {
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
  }

  async syncWishlist(req: AuthenticatedUserRequest, res: Response) {
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
  }
}

export const userAuthController = new UserAuthController();
