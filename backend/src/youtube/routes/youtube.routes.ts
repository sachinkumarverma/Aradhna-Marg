import { Router } from 'express';
import { youtubeController } from '../controllers/youtube.controller';

const router = Router();

// In a real app, these would be protected by an isAdmin middleware
router.get('/videos', youtubeController.getVideos);
router.get('/stats', youtubeController.getStats);
router.get('/history', youtubeController.getSyncHistory);
router.post('/sync', youtubeController.syncNow);
router.patch('/videos/:id/link', youtubeController.linkBhajan);
router.patch('/videos/:id/status', youtubeController.updateStatus);
router.delete('/videos/:id', youtubeController.deleteVideo);

export default router;
