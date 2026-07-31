import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { adminArticleController } from '../controllers/article.controller';
import { adminPuranController } from '../controllers/puran.controller';
import { adminFestivalController } from '../controllers/festival.controller';
import { bhajanRoutes } from '../../features/bhajans';
import { tagRoutes } from '../../features/tags';
import { youtubeRoutes } from '../../features/youtube';
import { adminAuthorController } from '../controllers/author.controller';
import { deityRoutes } from '../../features/deities';
import { adminAiController } from '../controllers/ai.controller';
import { requireAdmin } from '../../middlewares/auth';

const router = Router();

// ALL admin routes are protected by JWT
router.use(requireAdmin);

// Dashboard
router.get('/dashboard/stats', dashboardController.getStats);
router.get('/dashboard/activity', dashboardController.getRecentActivity);

// Bhajans Management
router.use('/bhajans', bhajanRoutes);

// YouTube Management
router.use('/youtube', youtubeRoutes);

// Articles Management
router.get('/articles', adminArticleController.list);
router.post('/articles/bulk', adminArticleController.bulkAction);
router.post('/articles', adminArticleController.create);
router.get('/articles/:id', adminArticleController.getById);
router.put('/articles/:id', adminArticleController.update);
router.delete('/articles/:id', adminArticleController.delete);

// Puranas Management
router.get('/puranas', adminPuranController.list);
router.post('/puranas/bulk', adminPuranController.bulkAction);
router.post('/puranas', adminPuranController.create);
router.get('/puranas/:id', adminPuranController.getById);
router.put('/puranas/:id', adminPuranController.update);
router.delete('/puranas/:id', adminPuranController.delete);

// Festivals Management
router.get('/festivals', adminFestivalController.list);
router.post('/festivals/bulk', adminFestivalController.bulkAction);
router.post('/festivals', adminFestivalController.create);
router.get('/festivals/:id', adminFestivalController.getById);
router.put('/festivals/:id', adminFestivalController.update);
router.delete('/festivals/:id', adminFestivalController.delete);

// Tags Management
router.use('/tags', tagRoutes);

// Authors Management
router.get('/authors', adminAuthorController.list);
router.post('/authors/bulk', adminAuthorController.bulkAction);
router.post('/authors', adminAuthorController.create);
router.get('/authors/:id', adminAuthorController.getById);
router.put('/authors/:id', adminAuthorController.update);
router.delete('/authors/:id', adminAuthorController.delete);

// Deities Management
router.use('/deities', deityRoutes);

// Future endpoints:
// router.use('/seo', seoController);
// router.use('/jobs', jobsController);

// AI Processing Pipeline
router.get('/ai/jobs', adminAiController.list);
router.get('/ai/stats', adminAiController.getStats);
router.post('/ai/queue', adminAiController.queueJob);
router.post('/ai/jobs/:id/retry', adminAiController.retryJob);
router.post('/ai/jobs/:id/cancel', adminAiController.cancelJob);
router.delete('/ai/jobs/:id', adminAiController.deleteJob);

export default router;
