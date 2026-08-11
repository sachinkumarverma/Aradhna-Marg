"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboard_controller_1 = require("../controllers/dashboard.controller");
const article_controller_1 = require("../controllers/article.controller");
const puran_controller_1 = require("../controllers/puran.controller");
const festival_controller_1 = require("../controllers/festival.controller");
const bhajans_1 = require("../../features/bhajans");
const tags_1 = require("../../features/tags");
const youtube_1 = require("../../features/youtube");
const author_controller_1 = require("../controllers/author.controller");
const deities_1 = require("../../features/deities");
const ai_controller_1 = require("../controllers/ai.controller");
const translations_1 = require("../../features/translations");
const auth_1 = require("../../middlewares/auth");
const auth_controller_1 = require("../controllers/auth.controller");
const router = (0, express_1.Router)();
// Public auth routes — no JWT required
router.post('/auth/login', auth_controller_1.authController.login);
router.post('/auth/logout', auth_controller_1.authController.logout);
// ALL routes below this line are protected by JWT
router.use(auth_1.requireAdmin);
router.get('/auth/me', auth_controller_1.authController.me);
// Dashboard
router.get('/dashboard/stats', dashboard_controller_1.dashboardController.getStats);
router.get('/dashboard/activity', dashboard_controller_1.dashboardController.getRecentActivity);
// Bhajans Management
router.use('/bhajans', bhajans_1.bhajanRoutes);
// YouTube Management
router.use('/youtube', youtube_1.youtubeRoutes);
// Articles Management
router.get('/articles', article_controller_1.adminArticleController.list);
router.post('/articles/bulk', article_controller_1.adminArticleController.bulkAction);
router.post('/articles', article_controller_1.adminArticleController.create);
router.get('/articles/:id', article_controller_1.adminArticleController.getById);
router.put('/articles/:id', article_controller_1.adminArticleController.update);
router.delete('/articles/:id', article_controller_1.adminArticleController.delete);
// Puranas Management
router.get('/puranas', puran_controller_1.adminPuranController.list);
router.post('/puranas/bulk', puran_controller_1.adminPuranController.bulkAction);
router.post('/puranas', puran_controller_1.adminPuranController.create);
router.get('/puranas/:id', puran_controller_1.adminPuranController.getById);
router.put('/puranas/:id', puran_controller_1.adminPuranController.update);
router.delete('/puranas/:id', puran_controller_1.adminPuranController.delete);
// Festivals Management
router.get('/festivals', festival_controller_1.adminFestivalController.list);
router.post('/festivals/bulk', festival_controller_1.adminFestivalController.bulkAction);
router.post('/festivals', festival_controller_1.adminFestivalController.create);
router.get('/festivals/:id', festival_controller_1.adminFestivalController.getById);
router.put('/festivals/:id', festival_controller_1.adminFestivalController.update);
router.delete('/festivals/:id', festival_controller_1.adminFestivalController.delete);
// Tags Management
router.use('/tags', tags_1.tagRoutes);
// Authors Management
router.get('/authors', author_controller_1.adminAuthorController.list);
router.post('/authors/bulk', author_controller_1.adminAuthorController.bulkAction);
router.post('/authors', author_controller_1.adminAuthorController.create);
router.get('/authors/:id', author_controller_1.adminAuthorController.getById);
router.put('/authors/:id', author_controller_1.adminAuthorController.update);
router.delete('/authors/:id', author_controller_1.adminAuthorController.delete);
// Deities Management
router.use('/deities', deities_1.deityRoutes);
// Translations Management
router.use('/translations', translations_1.translationRoutes);
// Future endpoints:
// router.use('/seo', seoController);
// router.use('/jobs', jobsController);
// AI Processing Pipeline
router.get('/ai/jobs', ai_controller_1.adminAiController.list);
router.get('/ai/stats', ai_controller_1.adminAiController.getStats);
router.post('/ai/queue', ai_controller_1.adminAiController.queueJob);
router.post('/ai/jobs/:id/retry', ai_controller_1.adminAiController.retryJob);
router.post('/ai/jobs/:id/cancel', ai_controller_1.adminAiController.cancelJob);
router.delete('/ai/jobs/:id', ai_controller_1.adminAiController.deleteJob);
exports.default = router;
