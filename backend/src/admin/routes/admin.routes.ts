import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { adminBhajanController } from '../controllers/bhajan.controller';
import { adminArticleController } from '../controllers/article.controller';
import { adminPuranController } from '../controllers/puran.controller';
import { adminFestivalController } from '../controllers/festival.controller';
import { requireAdmin } from '../../middlewares/auth';

const router = Router();

// ALL admin routes are protected by JWT
router.use(requireAdmin);

// Dashboard
router.get('/dashboard/stats', dashboardController.getStats);
router.get('/dashboard/activity', dashboardController.getRecentActivity);

// Bhajans Management
router.get('/bhajans', adminBhajanController.list);
router.post('/bhajans/bulk', adminBhajanController.bulkAction);
router.post('/bhajans', adminBhajanController.create);
router.get('/bhajans/:id', adminBhajanController.getById);
router.put('/bhajans/:id', adminBhajanController.update);
router.delete('/bhajans/:id', adminBhajanController.delete);

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


// Future endpoints:
// router.use('/seo', seoController);
// router.use('/ai', aiController);
// router.use('/jobs', jobsController);

export default router;
