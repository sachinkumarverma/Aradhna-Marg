import { Router } from 'express';
import { puranPublicController } from '@controllers/PuranPublicController';

const router = Router();

router.get('/:slug', puranPublicController.getBySlug);
router.get('/:id/pdf', puranPublicController.getPdfUrl);
router.post('/:id/view', puranPublicController.trackView);
router.post('/:id/download', puranPublicController.trackDownload);

export default router;
