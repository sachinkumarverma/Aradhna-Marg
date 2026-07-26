import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { adminBhajanController } from '../controllers/bhajan.controller';
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

// Future endpoints:
// router.use('/seo', seoController);
// router.use('/ai', aiController);
// router.use('/jobs', jobsController);

export default router;
