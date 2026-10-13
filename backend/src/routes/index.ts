import { Router } from 'express';
import healthRoutes from './health';

// Placeholders for future route modules
import { categoryRoutes } from '@features/categories';
import adminRoutes from '@admin/routes/admin.routes';
import searchRoutes from '@/search/routes/search.routes';
import settingsRoutes from './settings.routes';
import puranaRoutes from './puranas.routes';
import { seoRoutes } from '@features/seo';
import publicRoutes from './public.routes';
import cronRoutes from './cron.routes';
import { paymentController } from '@controllers/PaymentController';

const router = Router();

// API Version 1
router.use('/v1/health', healthRoutes);
router.use('/v1/cron', cronRoutes);

// router.use('/v1/bhajans', bhajanRoutes);
router.use('/v1/categories', categoryRoutes);
router.use('/v1/admin/categories', categoryRoutes);
router.use('/admin/categories', categoryRoutes);
router.use('/admin', adminRoutes);
router.use('/v1/admin', adminRoutes);
router.use('/v1/search', searchRoutes);
router.use('/v1/puranas', puranaRoutes);
router.use('/settings', settingsRoutes);
router.use('/v1/settings', settingsRoutes);
router.use('/v1/seo', seoRoutes);
router.use('/public', publicRoutes);
router.use('/v1/public', publicRoutes);

// Direct Gateway Webhook Routing (serves /api/payments/webhook and /api/v1/payments/webhook)
router.post('/payments/webhook', paymentController.handleWebhook);
router.post('/v1/payments/webhook', paymentController.handleWebhook);

export default router;
