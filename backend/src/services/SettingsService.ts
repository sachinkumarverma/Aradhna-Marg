import { settingsRepository } from '../repositories/SettingsRepository';
import { Settings, UpdateSettingsDTO } from '../models/Settings';
import { encrypt, decrypt } from '../utils/encryption';
import { NotFoundError } from '../errors/appError';

export class SettingsService {
  async getSettings(): Promise<Settings> {
    const settings = await settingsRepository.getSettings();
    
    if (!settings) {
      // Return a default object if settings don't exist yet, or initialize them
      // In this system, since there should always be a singleton, we can either throw or create.
      // We will create the default settings if they don't exist.
      const initial = await settingsRepository.createInitialSettings({
        siteName: 'Aradhna Marg',
        defaultLanguage: 'en',
        defaultTheme: 'light',
      });
      return initial;
    }

    return settings;
  }

  async updateSettings(updates: UpdateSettingsDTO): Promise<Settings> {
    const currentSettings = await settingsRepository.getSettings();
    
    if (!currentSettings) {
      throw new NotFoundError('Settings not found');
    }

    const updatedSettings = await settingsRepository.updateSettings(currentSettings.id, updates);

    return updatedSettings;
  }
}

export const settingsService = new SettingsService();
