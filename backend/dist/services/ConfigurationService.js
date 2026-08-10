"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configurationService = exports.ConfigurationService = void 0;
const SettingsRepository_1 = require("@repositories/SettingsRepository");
class ConfigurationService {
    async getConfiguration() {
        const settings = await SettingsRepository_1.settingsRepository.getSettings();
        if (!settings) {
            throw new Error('Database settings not initialized');
        }
        return {
            youtube: {
                apiKey: process.env.YOUTUBE_API_KEY || '',
                channelId: settings.youtubeChannelId || '',
                channelUrl: settings.youtubeChannelUrl || '',
                enableAutoSync: settings.youtubeAutoSync ?? false,
                syncInterval: settings.youtubeSyncInterval || 'daily',
                incrementalSync: settings.youtubeIncrementalSync ?? true,
                lastSync: settings.youtubeLastSync,
                nextScheduledSync: settings.youtubeNextSync,
            }
        };
    }
    // Get raw settings if other services need non-merged settings
    async getRawSettings() {
        return SettingsRepository_1.settingsRepository.getSettings();
    }
}
exports.ConfigurationService = ConfigurationService;
exports.configurationService = new ConfigurationService();
