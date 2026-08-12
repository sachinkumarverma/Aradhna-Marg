import { Router } from 'express';
import { seoController } from '@/seo/controllers/seo.controller';

const router = Router();

// These endpoints are strictly public and do not use API versioning naturally,
// they are meant to be mounted at the root level of the server (e.g. domain.com/robots.txt)
// or reverse-proxied from the frontend.

router.get('/robots.txt', seoController.getRobotsTxt);
router.get('/sitemap.xml', seoController.getSitemapIndex);
router.get('/sitemaps/bhajans.xml', seoController.getBhajansSitemap);

export default router;
