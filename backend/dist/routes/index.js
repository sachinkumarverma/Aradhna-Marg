"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const health_1 = __importDefault(require("./health"));
// Placeholders for future route modules
const categories_routes_1 = __importDefault(require("./categories.routes"));
const admin_routes_1 = __importDefault(require("../admin/routes/admin.routes"));
const youtube_routes_1 = __importDefault(require("../youtube/routes/youtube.routes"));
const search_routes_1 = __importDefault(require("../search/routes/search.routes"));
const settings_routes_1 = __importDefault(require("./settings.routes"));
const media_routes_1 = __importDefault(require("./media.routes"));
const router = (0, express_1.Router)();
// API Version 1
router.use('/v1/health', health_1.default);
// router.use('/v1/bhajans', bhajanRoutes);
router.use('/v1/categories', categories_routes_1.default);
router.use('/v1/admin/categories', categories_routes_1.default);
router.use('/v1/admin', admin_routes_1.default);
router.use('/v1/admin/youtube', youtube_routes_1.default); // Could also be nested inside adminRoutes in a refactor
router.use('/v1/admin/media', media_routes_1.default);
router.use('/v1/search', search_routes_1.default);
router.use('/settings', settings_routes_1.default);
exports.default = router;
