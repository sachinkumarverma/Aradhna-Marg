"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const YoutubeController_1 = require("./YoutubeController");
const router = (0, express_1.Router)();
// In a real app, these would be protected by an isAdmin middleware
router.get('/videos', YoutubeController_1.youtubeController.getVideos.bind(YoutubeController_1.youtubeController));
router.get('/stats', YoutubeController_1.youtubeController.getStats.bind(YoutubeController_1.youtubeController));
router.get('/history', YoutubeController_1.youtubeController.getSyncHistory.bind(YoutubeController_1.youtubeController));
router.post('/sync', YoutubeController_1.youtubeController.syncNow.bind(YoutubeController_1.youtubeController));
router.get('/bhajans-list', YoutubeController_1.youtubeController.getBhajansForLink.bind(YoutubeController_1.youtubeController));
router.patch('/videos/:id/link', YoutubeController_1.youtubeController.linkBhajan.bind(YoutubeController_1.youtubeController));
router.patch('/videos/:id/status', YoutubeController_1.youtubeController.updateStatus.bind(YoutubeController_1.youtubeController));
router.delete('/videos/:id', YoutubeController_1.youtubeController.deleteVideo.bind(YoutubeController_1.youtubeController));
exports.default = router;
