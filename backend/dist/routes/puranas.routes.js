"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const PuranPublicController_1 = require("@controllers/PuranPublicController");
const router = (0, express_1.Router)();
router.get('/:slug', PuranPublicController_1.puranPublicController.getBySlug);
router.post('/:id/view', PuranPublicController_1.puranPublicController.trackView);
router.post('/:id/download', PuranPublicController_1.puranPublicController.trackDownload);
exports.default = router;
