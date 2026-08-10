import axios from 'axios';
import { TranslationProvider } from './TranslationProvider';
import { AppError } from '@/errors/appError';

export class LibreTranslateProvider implements TranslationProvider {
  name = 'libretranslate';

  async translate(text: string, sourceLang: string, targetLang: string, format: 'text' | 'html' = 'text'): Promise<string> {
    const url = process.env.LIBRETRANSLATE_URL;
    if (!url) {
      throw new AppError('LibreTranslate URL is not configured.', 500);
    }

    try {
      const response = await axios.post(`${url}/translate`, {
        q: text,
        source: sourceLang,
        target: targetLang,
        format: format,
        api_key: process.env.LIBRETRANSLATE_API_KEY || ''
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000 // 10 second timeout for LibreTranslate
      });

      return response.data.translatedText;
    } catch (error: any) {
      throw new AppError(`LibreTranslate failed: ${error.message}`, 502);
    }
  }
}
