import { Router } from 'express';
import { userAuthController } from '@controllers/userAuth.controller';
import { requireUser } from '@middlewares/userAuth';

const router = Router();

// Public Authentication endpoints
router.post('/signup', userAuthController.signup);
router.post('/login', userAuthController.login);
router.post('/google', userAuthController.googleAuth);
router.post('/google/callback', userAuthController.googleRedirectCallback);
router.get('/verify-email', userAuthController.verifyEmail);
router.post('/verify-email', userAuthController.verifyEmail);
router.post('/resend-verification', userAuthController.resendVerification);
router.post('/forgot-password', userAuthController.forgotPassword);
router.post('/reset-password', userAuthController.resetPassword);

// Protected endpoints
router.get('/me', requireUser, userAuthController.getMe);
router.get('/wishlist', requireUser, userAuthController.getWishlist);
router.post('/wishlist/toggle', requireUser, userAuthController.toggleWishlist);
router.post('/wishlist/sync', requireUser, userAuthController.syncWishlist);

export default router;
