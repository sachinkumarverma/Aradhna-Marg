import { Router } from 'express';
import { youtubeController } from './YoutubeController';

const router = Router();

// In a real app, these would be protected by an isAdmin middleware
router.get('/videos', youtubeController.getVideos.bind(youtubeController));
router.get('/stats', youtubeController.getStats.bind(youtubeController));
router.get('/history', youtubeController.getSyncHistory.bind(youtubeController));
router.post('/sync', youtubeController.syncNow.bind(youtubeController));
router.get('/bhajans-list', youtubeController.getBhajansForLink.bind(youtubeController));
router.patch('/videos/:id/link', youtubeController.linkBhajan.bind(youtubeController));
router.patch('/videos/:id/status', youtubeController.updateStatus.bind(youtubeController));
router.delete('/videos/:id', youtubeController.deleteVideo.bind(youtubeController));

export default router;
