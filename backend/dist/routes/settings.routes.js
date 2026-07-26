"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const SettingsController_1 = require("../controllers/SettingsController");
const router = (0, express_1.Router)();
// GET /api/settings
router.get('/', SettingsController_1.settingsController.getSettings);
// PUT /api/settings
router.put('/', SettingsController_1.settingsController.updateSettings);
// PATCH /api/settings (Handled the same way as PUT using Partial DTO)
router.patch('/', SettingsController_1.settingsController.updateSettings);
exports.default = router;
