import { Router } from 'express';
import { userAuthController } from '@controllers/userAuth.controller';
import { requireUser } from '@middlewares/userAuth';
import {
  userAuthRequestRateLimiter,
  userGoogleRedirectRateLimiter,
  userLoginRateLimiter
} from '@middlewares/authRateLimiter';

const router = Router();

// Ensure user authentication and wishlist data is strictly never cached
router.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  next();
});

// Public Authentication endpoints
router.post('/signup', userAuthRequestRateLimiter('signup'), userAuthController.signup);
router.post('/login', userLoginRateLimiter, userAuthController.login);
router.post('/google', userLoginRateLimiter, userAuthController.googleAuth);
router.post('/google/callback', userGoogleRedirectRateLimiter, userAuthController.googleRedirectCallback);
router.get('/verify-email', userAuthRequestRateLimiter('verify-email'), userAuthController.verifyEmail);
router.post('/verify-email', userAuthRequestRateLimiter('verify-email'), userAuthController.verifyEmail);
router.post(
  '/resend-verification',
  userAuthRequestRateLimiter('resend-verification'),
  userAuthController.resendVerification
);
router.post('/forgot-password', userAuthRequestRateLimiter('forgot-password'), userAuthController.forgotPassword);
router.post('/reset-password', userAuthRequestRateLimiter('reset-password'), userAuthController.resetPassword);

// Protected endpoints
router.get('/me', requireUser, userAuthController.getMe);
router.get('/wishlist', requireUser, userAuthController.getWishlist);
router.post('/wishlist/toggle', requireUser, userAuthController.toggleWishlist);
router.post('/wishlist/sync', requireUser, userAuthController.syncWishlist);

export default router;
