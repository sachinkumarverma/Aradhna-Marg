"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const youtube_controller_1 = require("../controllers/youtube.controller");
const validate_1 = require("../../middlewares/validate");
const youtube_validator_1 = require("../validators/youtube.validator");
const router = (0, express_1.Router)();
// In a real app, these would be protected by an isAdmin middleware
router.post('/sync', (0, validate_1.validateRequest)(youtube_validator_1.manualSyncSchema), youtube_controller_1.youtubeController.triggerSync);
router.get('/status', youtube_controller_1.youtubeController.getStatus);
exports.default = router;
