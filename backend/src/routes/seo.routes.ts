import { Router } from 'express';
import { seoController } from '../controllers/seo.controller';

const router = Router();

router.get('/overview', seoController.getOverview);
router.get('/issues', seoController.getIssues);
router.post('/sitemap/generate', seoController.generateSitemap);
router.post('/robots/generate', seoController.generateRobots);
router.post('/generate-bulk', seoController.generateBulkSEO);

export default router;
