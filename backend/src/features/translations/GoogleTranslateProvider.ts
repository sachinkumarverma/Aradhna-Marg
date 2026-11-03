import axios from 'axios';
import { TranslationProvider } from './TranslationProvider';
import { AppError } from '@/errors/appError';
import { config } from '@/config';
import { logger } from '@utils/logger';

export class GoogleTranslateProvider implements TranslationProvider {
  name = 'google';
  private readonly maxRetries = 3;
  private readonly initialBackoffMs = 1000;

  private getApiKey(): string | undefined {
    return (
      config.GOOGLE_TRANSLATE_API_KEY ||
      config.GOOGLE_CLOUD_TRANSLATE_API_KEY ||
      process.env.GOOGLE_TRANSLATE_API_KEY ||
      process.env.GOOGLE_CLOUD_TRANSLATE_API_KEY
    );
  }

  async translate(
    text: string,
    sourceLang: string,
    targetLang: string,
    format: 'text' | 'html' = 'text'
  ): Promise<string> {
    const isEnabled = config.GOOGLE_TRANSLATE_ENABLED !== 'false' && process.env.GOOGLE_TRANSLATE_ENABLED !== 'false';
    if (!isEnabled) {
      throw new AppError('Google Cloud Translation is disabled in configuration.', 503);
    }

    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new AppError(
        'Google Cloud Translation API key is not configured. Please configure GOOGLE_TRANSLATE_API_KEY on the backend.',
        503
      );
    }

    if (!text || text.trim() === '') {
      return '';
    }

    // Call official Google Cloud Translation API v2 with exponential backoff on HTTP 429
    return this.translateWithRetry(text, sourceLang, targetLang, format, apiKey);
  }

  private async translateWithRetry(
    text: string,
    sourceLang: string,
    targetLang: string,
    format: 'text' | 'html',
    apiKey: string
  ): Promise<string> {
    let attempt = 0;

    while (true) {
      try {
        const response = await axios.post(
          `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
          {
            q: text,
            source: sourceLang === 'hi' ? 'hi' : sourceLang,
            target: targetLang === 'en' ? 'en' : targetLang,
            format: format
          },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 15000
          }
        );

        const translations = response.data?.data?.translations;
        if (translations && translations.length > 0 && typeof translations[0].translatedText === 'string') {
          return translations[0].translatedText;
        }

        throw new Error('Unexpected response format from Google Cloud Translation API');
      } catch (error: any) {
        attempt++;
        const status = error?.response?.status;
        const errorData = error?.response?.data?.error;
        const errorMessage = errorData?.message || error?.message || String(error);

        const isRateLimit =
          status === 429 ||
          (status === 403 && typeof errorMessage === 'string' && errorMessage.toLowerCase().includes('rate limit'));
        const isTransient = status === 503 || status === 502;

        if ((isRateLimit || isTransient) && attempt <= this.maxRetries) {
          // Exponential backoff with jitter: 1s, 2s, 4s (+ 0-500ms jitter)
          const delay = this.initialBackoffMs * Math.pow(2, attempt - 1) + Math.random() * 500;
          logger.warn(
            { status, attempt, maxRetries: this.maxRetries, delayMs: Math.round(delay), error: errorMessage },
            `[GoogleTranslateProvider] Rate limit / transient error (HTTP ${status}). Retrying translation in ${Math.round(delay)}ms...`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        logger.error({ status, attempt, error: errorMessage }, '[GoogleTranslateProvider] Translation request failed');

        if (status === 429) {
          throw new AppError(
            'Google Cloud Translation rate limit reached (HTTP 429). Maximum retries exhausted. Please try again shortly.',
            429
          );
        }

        throw new AppError(
          `Google Cloud Translation failed: ${errorMessage}`,
          status && status >= 400 && status < 500 ? status : 502
        );
      }
    }
  }
}
