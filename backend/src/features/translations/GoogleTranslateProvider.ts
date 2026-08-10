import axios from 'axios';
import { TranslationProvider } from './TranslationProvider';
import { AppError } from '@/errors/appError';

export class GoogleTranslateProvider implements TranslationProvider {
  name = 'google';

  async translate(text: string, sourceLang: string, targetLang: string, format: 'text' | 'html' = 'text'): Promise<string> {
    const isEnabled = process.env.GOOGLE_TRANSLATE_ENABLED !== 'false'; // Default to true now
    if (!isEnabled) {
      throw new AppError('Google Translate is disabled in configuration.', 500);
    }

    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
    
    try {
      if (apiKey) {
        // Use official API if key is provided
        const response = await axios.post(`https://translation.googleapis.com/language/translate/v2?key=${apiKey}`, {
          q: text,
          source: sourceLang === 'hi' ? 'hi' : sourceLang,
          target: targetLang === 'en' ? 'en' : targetLang,
          format: format,
        }, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000
        });

        if (response.data?.data?.translations && response.data.data.translations.length > 0) {
          return response.data.data.translations[0].translatedText;
        }
      } else {
        // Fallback to free GTX endpoint if no API key (great for dev/testing)
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
        const response = await axios.get(url, { timeout: 10000 });
        
        if (response.data && response.data[0]) {
          // The response is a nested array, we need to map and join the translated sentences
          return response.data[0].map((item: any) => item[0]).join('');
        }
      }
      
      throw new Error('Invalid response format');
    } catch (error: any) {
      throw new AppError(`Google Translate failed: ${error.message}`, 502);
    }
  }
}
