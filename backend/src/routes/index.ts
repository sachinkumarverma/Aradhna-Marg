import { Router } from 'express';
import healthRoutes from './health';

// Placeholders for future route modules
import categoryRoutes from './categories.routes';
import adminRoutes from '../admin/routes/admin.routes';
import youtubeRoutes from '../youtube/routes/youtube.routes';
import searchRoutes from '../search/routes/search.routes';
import settingsRoutes from './settings.routes';
import mediaRoutes from './media.routes';

const router = Router();

// API Version 1
router.use('/v1/health', healthRoutes);

// router.use('/v1/bhajans', bhajanRoutes);
router.use('/v1/categories', categoryRoutes);
router.use('/v1/admin/categories', categoryRoutes);
router.use('/v1/admin', adminRoutes);
router.use('/v1/admin/youtube', youtubeRoutes); // Could also be nested inside adminRoutes in a refactor
router.use('/v1/admin/media', mediaRoutes);
router.use('/v1/search', searchRoutes);
router.use('/settings', settingsRoutes);

export default router;
