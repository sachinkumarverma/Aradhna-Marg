"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboard_controller_1 = require("../controllers/dashboard.controller");
const bhajan_controller_1 = require("../controllers/bhajan.controller");
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
// Future endpoints:
// router.use('/seo', seoController);
// router.use('/ai', aiController);
// router.use('/jobs', jobsController);
exports.default = router;
