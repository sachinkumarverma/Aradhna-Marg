import { Router } from 'express';
import { youtubeController } from '../controllers/youtube.controller';
import { validateRequest } from '../../middlewares/validate';
import { manualSyncSchema } from '../validators/youtube.validator';

const router = Router();

// In a real app, these would be protected by an isAdmin middleware
router.post('/sync', validateRequest(manualSyncSchema), youtubeController.triggerSync);
router.get('/status', youtubeController.getStatus);

export default router;
