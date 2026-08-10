"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.translationRoutes = void 0;
const express_1 = require("express");
const TranslationController_1 = require("./TranslationController");
// Add validators later if needed, prompt says to do it incrementally
const router = (0, express_1.Router)();
exports.translationRoutes = router;
router.post('/generate', TranslationController_1.translationController.generateTranslation);
router.post('/generate-live', TranslationController_1.translationController.generateLiveTranslation);
router.post('/upsert', TranslationController_1.translationController.upsertTranslation);
router.get('/:contentType/:contentId/:targetLanguage', TranslationController_1.translationController.getTranslation);
router.put('/:id', TranslationController_1.translationController.updateTranslation);
