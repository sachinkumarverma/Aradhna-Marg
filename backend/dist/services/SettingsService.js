"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsService = exports.SettingsService = void 0;
const SettingsRepository_1 = require("@repositories/SettingsRepository");
const appError_1 = require("@/errors/appError");
class SettingsService {
    async getSettings() {
        const settings = await SettingsRepository_1.settingsRepository.getSettings();
        if (!settings) {
            // Return a default object if settings don't exist yet, or initialize them
            // In this system, since there should always be a singleton, we can either throw or create.
            // We will create the default settings if they don't exist.
            const initial = await SettingsRepository_1.settingsRepository.createInitialSettings({
                siteName: 'Aradhna Marg',
                defaultLanguage: 'en',
                defaultTheme: 'light',
            });
            return initial;
        }
        return settings;
    }
    async updateSettings(updates) {
        const currentSettings = await SettingsRepository_1.settingsRepository.getSettings();
        if (!currentSettings) {
            throw new appError_1.NotFoundError('Settings not found');
        }
        const updatedSettings = await SettingsRepository_1.settingsRepository.updateSettings(currentSettings.id, updates);
        return updatedSettings;
    }
}
exports.SettingsService = SettingsService;
exports.settingsService = new SettingsService();
