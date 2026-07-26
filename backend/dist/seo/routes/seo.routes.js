"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const seo_controller_1 = require("../controllers/seo.controller");
const router = (0, express_1.Router)();
// These endpoints are strictly public and do not use API versioning naturally, 
// they are meant to be mounted at the root level of the server (e.g. domain.com/robots.txt)
// or reverse-proxied from the frontend.
router.get('/robots.txt', seo_controller_1.seoController.getRobotsTxt);
router.get('/sitemap.xml', seo_controller_1.seoController.getSitemapIndex);
router.get('/sitemaps/bhajans.xml', seo_controller_1.seoController.getBhajansSitemap);
exports.default = router;
