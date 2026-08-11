"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsController = exports.SettingsController = void 0;
const SettingsService_1 = require("../services/SettingsService");
const settings_validator_1 = require("../validators/settings.validator");
const apiResponse_1 = require("../responses/apiResponse");
const appError_1 = require("../errors/appError");
/** Generic helper: validate with a schema and persist only that section's fields */
async function updateSection(schema, req, res, next, successMsg) {
    try {
        const parsed = schema.safeParse(req.body);
        if (!parsed.success) {
            throw new appError_1.ValidationError('Validation failed', parsed.error.format());
        }
        const updated = await SettingsService_1.settingsService.updateSettings(parsed.data);
        return (0, apiResponse_1.sendSuccess)(res, successMsg, updated);
    }
    catch (error) {
        next(error);
    }
}
class SettingsController {
    // ── Full read ──────────────────────────────────────────────────────────────
    async getSettings(req, res, next) {
        try {
            const settings = await SettingsService_1.settingsService.getSettings();
            return (0, apiResponse_1.sendSuccess)(res, 'Settings retrieved successfully', settings);
        }
        catch (error) {
            next(error);
        }
    }
    // ── Legacy full-update (kept for backward compatibility) ───────────────────
    async updateSettings(req, res, next) {
        return updateSection(settings_validator_1.updateSettingsSchema, req, res, next, 'Settings updated successfully');
    }
    // ── Per-section handlers ───────────────────────────────────────────────────
    async updateGeneral(req, res, next) {
        return updateSection(settings_validator_1.generalSettingsSchema, req, res, next, 'General settings saved');
    }
    async updateContact(req, res, next) {
        return updateSection(settings_validator_1.contactSettingsSchema, req, res, next, 'Contact settings saved');
    }
    async updateSocial(req, res, next) {
        return updateSection(settings_validator_1.socialSettingsSchema, req, res, next, 'Social settings saved');
    }
    async updateYoutube(req, res, next) {
        return updateSection(settings_validator_1.youtubeSettingsSchema, req, res, next, 'YouTube settings saved');
    }
    async updateSeo(req, res, next) {
        return updateSection(settings_validator_1.seoSettingsSchema, req, res, next, 'SEO settings saved');
    }
    async updateAnalytics(req, res, next) {
        return updateSection(settings_validator_1.analyticsSettingsSchema, req, res, next, 'Analytics settings saved');
    }
    async updateAdvertisement(req, res, next) {
        return updateSection(settings_validator_1.advertisementSettingsSchema, req, res, next, 'Advertisement settings saved');
    }
    async updateSystem(req, res, next) {
        return updateSection(settings_validator_1.systemSettingsSchema, req, res, next, 'System settings saved');
    }
}
exports.SettingsController = SettingsController;
exports.settingsController = new SettingsController();
