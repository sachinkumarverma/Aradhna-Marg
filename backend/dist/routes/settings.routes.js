"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const SettingsController_1 = require("../controllers/SettingsController");
const router = (0, express_1.Router)();
// ── Full read ────────────────────────────────────────────────────────────────
router.get('/', SettingsController_1.settingsController.getSettings);
// ── Legacy full-update (backward compat) ─────────────────────────────────────
router.put('/', SettingsController_1.settingsController.updateSettings);
router.patch('/', SettingsController_1.settingsController.updateSettings);
// ── Per-section endpoints ────────────────────────────────────────────────────
// Each route validates and saves ONLY the fields for that section.
router.put('/general', SettingsController_1.settingsController.updateGeneral);
router.put('/contact', SettingsController_1.settingsController.updateContact);
router.put('/social', SettingsController_1.settingsController.updateSocial);
router.put('/youtube', SettingsController_1.settingsController.updateYoutube);
router.put('/seo', SettingsController_1.settingsController.updateSeo);
router.put('/analytics', SettingsController_1.settingsController.updateAnalytics);
router.put('/advertisement', SettingsController_1.settingsController.updateAdvertisement);
router.put('/system', SettingsController_1.settingsController.updateSystem);
exports.default = router;
