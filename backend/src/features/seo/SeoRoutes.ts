import { Router } from 'express';
import { seoController } from './SeoController';

const router = Router();

router.get('/overview', seoController.getOverview.bind(seoController));
router.get('/issues', seoController.getIssues.bind(seoController));
router.post('/sitemap/generate', seoController.generateSitemap.bind(seoController));
router.post('/robots/generate', seoController.generateRobots.bind(seoController));
router.post('/generate-bulk', seoController.generateBulkSEO.bind(seoController));

export default router;
