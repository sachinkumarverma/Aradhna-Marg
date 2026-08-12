import axios from 'axios';
import { TranslationProvider } from './TranslationProvider';
import { AppError } from '@/errors/appError';

export class LibreTranslateProvider implements TranslationProvider {
  name = 'libretranslate';

  async translate(
    text: string,
    sourceLang: string,
    targetLang: string,
    format: 'text' | 'html' = 'text'
  ): Promise<string> {
    let url = process.env.LIBRETRANSLATE_URL;
    if (!url) {
      throw new AppError('LibreTranslate URL is not configured.', 500);
    }

    // Sanitize URL to prevent 301 redirects (which turn POST into GET and cause "Request Line is too large" errors)
    url = url.trim();
    if (!url.startsWith('http')) {
      url = `https://${url}`;
    }
    if (url.endsWith('/')) {
      url = url.slice(0, -1);
    }

    try {
      const response = await axios.post(
        `${url}/translate`,
        {
          q: text,
          source: sourceLang,
          target: targetLang,
          format: format,
          api_key: process.env.LIBRETRANSLATE_API_KEY || ''
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000 // 10 second timeout for LibreTranslate
        }
      );

      return response.data.translatedText;
    } catch (error: any) {
      throw new AppError(`LibreTranslate failed: ${error.message}`, 502);
    }
  }
}
