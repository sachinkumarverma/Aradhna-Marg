"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const youtube_controller_1 = require("../controllers/youtube.controller");
const router = (0, express_1.Router)();
// In a real app, these would be protected by an isAdmin middleware
router.get('/videos', youtube_controller_1.youtubeController.getVideos);
router.get('/stats', youtube_controller_1.youtubeController.getStats);
router.get('/history', youtube_controller_1.youtubeController.getSyncHistory);
router.post('/sync', youtube_controller_1.youtubeController.syncNow);
router.patch('/videos/:id/link', youtube_controller_1.youtubeController.linkBhajan);
router.patch('/videos/:id/status', youtube_controller_1.youtubeController.updateStatus);
router.delete('/videos/:id', youtube_controller_1.youtubeController.deleteVideo);
exports.default = router;
