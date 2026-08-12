import { settingsRepository } from '@repositories/SettingsRepository';

export interface YouTubeConfiguration {
  apiKey: string;
  channelId: string;
  channelUrl: string;
  enableAutoSync: boolean;
  syncInterval: string;
  incrementalSync: boolean;
  lastSync?: string;
  nextScheduledSync?: string;
}

export interface AppConfiguration {
  youtube: YouTubeConfiguration;
  // Expose other DB settings here without env merging if needed
}

export class ConfigurationService {
  async getConfiguration(): Promise<AppConfiguration> {
    const settings = await settingsRepository.getSettings();

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
        nextScheduledSync: settings.youtubeNextSync
      }
    };
  }

  // Get raw settings if other services need non-merged settings
  async getRawSettings() {
    return settingsRepository.getSettings();
  }
}

export const configurationService = new ConfigurationService();
