"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboard_controller_1 = require("../controllers/dashboard.controller");
const bhajan_controller_1 = require("../controllers/bhajan.controller");
const article_controller_1 = require("../controllers/article.controller");
const puran_controller_1 = require("../controllers/puran.controller");
const auth_1 = require("../../middlewares/auth");
const router = (0, express_1.Router)();
// ALL admin routes are protected by JWT
router.use(auth_1.requireAdmin);
// Dashboard
router.get('/dashboard/stats', dashboard_controller_1.dashboardController.getStats);
router.get('/dashboard/activity', dashboard_controller_1.dashboardController.getRecentActivity);
// Bhajans Management
router.get('/bhajans', bhajan_controller_1.adminBhajanController.list);
router.post('/bhajans/bulk', bhajan_controller_1.adminBhajanController.bulkAction);
router.post('/bhajans', bhajan_controller_1.adminBhajanController.create);
router.get('/bhajans/:id', bhajan_controller_1.adminBhajanController.getById);
router.put('/bhajans/:id', bhajan_controller_1.adminBhajanController.update);
router.delete('/bhajans/:id', bhajan_controller_1.adminBhajanController.delete);
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
// Future endpoints:
// router.use('/seo', seoController);
// router.use('/ai', aiController);
// router.use('/jobs', jobsController);
exports.default = router;
