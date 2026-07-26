"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsController = exports.SettingsController = void 0;
const SettingsService_1 = require("../services/SettingsService");
const settings_validator_1 = require("../validators/settings.validator");
const apiResponse_1 = require("../responses/apiResponse");
const appError_1 = require("../errors/appError");
class SettingsController {
    async getSettings(req, res, next) {
        try {
            const settings = await SettingsService_1.settingsService.getSettings();
            return (0, apiResponse_1.sendSuccess)(res, 'Settings retrieved successfully', settings);
        }
        catch (error) {
            next(error);
        }
    }
    async updateSettings(req, res, next) {
        try {
            const parsedBody = settings_validator_1.updateSettingsSchema.safeParse(req.body);
            if (!parsedBody.success) {
                throw new appError_1.ValidationError('Validation failed', parsedBody.error.format());
            }
            const updatedSettings = await SettingsService_1.settingsService.updateSettings(parsedBody.data);
            return (0, apiResponse_1.sendSuccess)(res, 'Settings updated successfully', updatedSettings);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.SettingsController = SettingsController;
exports.settingsController = new SettingsController();
