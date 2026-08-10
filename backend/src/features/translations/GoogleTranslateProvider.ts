import axios from 'axios';
import { TranslationProvider } from './TranslationProvider';
import { AppError } from '@/errors/appError';

export class GoogleTranslateProvider implements TranslationProvider {
  name = 'google';

  async translate(text: string, sourceLang: string, targetLang: string, format: 'text' | 'html' = 'text'): Promise<string> {
    const isEnabled = process.env.GOOGLE_TRANSLATE_ENABLED === 'true';
    if (!isEnabled) {
      throw new AppError('Google Translate is not enabled in configuration.', 500);
    }

    const projectId = process.env.GOOGLE_TRANSLATE_PROJECT_ID;
    const location = process.env.GOOGLE_TRANSLATE_LOCATION || 'global';
    
    // In a real implementation using Google Auth library or a direct API key
    // For this demonstration, we'll use a direct REST API call assuming an API key is available
    // or fallback to the standard Cloud Translation API standard library logic.
    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
    
    if (!apiKey) {
      throw new AppError('Google Translate API Key is missing.', 500);
    }

    try {
      const response = await axios.post(`https://translation.googleapis.com/language/translate/v2?key=${apiKey}`, {
        q: text,
        source: sourceLang,
        target: targetLang,
        format: format,
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });

      if (response.data?.data?.translations && response.data.data.translations.length > 0) {
        return response.data.data.translations[0].translatedText;
      }
      throw new Error('Invalid response format');
    } catch (error: any) {
      throw new AppError(`Google Translate failed: ${error.message}`, 502);
    }
  }
}
