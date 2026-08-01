"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const health_1 = __importDefault(require("./health"));
// Placeholders for future route modules
const categories_1 = require("../features/categories");
const admin_routes_1 = __importDefault(require("../admin/routes/admin.routes"));
const search_routes_1 = __importDefault(require("../search/routes/search.routes"));
const settings_routes_1 = __importDefault(require("./settings.routes"));
const puranas_routes_1 = __importDefault(require("./puranas.routes"));
const seo_1 = require("../features/seo");
const public_routes_1 = __importDefault(require("./public.routes"));
const router = (0, express_1.Router)();
// API Version 1
router.use('/v1/health', health_1.default);
// router.use('/v1/bhajans', bhajanRoutes);
router.use('/v1/categories', categories_1.categoryRoutes);
router.use('/v1/admin/categories', categories_1.categoryRoutes);
router.use('/admin/categories', categories_1.categoryRoutes);
router.use('/admin', admin_routes_1.default);
router.use('/v1/admin', admin_routes_1.default);
router.use('/v1/search', search_routes_1.default);
router.use('/v1/puranas', puranas_routes_1.default);
router.use('/settings', settings_routes_1.default);
router.use('/v1/settings', settings_routes_1.default);
router.use('/v1/seo', seo_1.seoRoutes);
router.use('/v1/public', public_routes_1.default);
exports.default = router;
