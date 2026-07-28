import { Router } from 'express';
import { youtubeController } from '../controllers/youtube.controller';

const router = Router();

// In a real app, these would be protected by an isAdmin middleware
router.get('/videos', youtubeController.getVideos);
router.get('/stats', youtubeController.getStats);
router.post('/sync', youtubeController.syncNow);

export default router;
