import axios from 'axios';
import * as cheerio from 'cheerio';
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
        // Fallback to free GTX endpoint if no API key
        if (format === 'html') {
          return await this.translateHtmlFree(text, sourceLang, targetLang);
        } else {
          return await this.translateTextFree(text, sourceLang, targetLang);
        }
      }
      
      throw new Error('Invalid response format');
    } catch (error: any) {
      throw new AppError(`Google Translate failed: ${error.message}`, 502);
    }
  }

  private async translateTextFree(text: string, sourceLang: string, targetLang: string): Promise<string> {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t`;
    
    const MAX_CHUNK_LENGTH = 4000;
    const chunks: string[] = [];
    let i = 0;
    while (i < text.length) {
      let end = i + MAX_CHUNK_LENGTH;
      if (end < text.length) {
        const delimIndex = text.lastIndexOf('[###]', end);
        if (delimIndex > i) {
          end = delimIndex + 5;
        } else {
           const spaceIndex = text.lastIndexOf(' ', end);
           if (spaceIndex > i) end = spaceIndex;
        }
      }
      chunks.push(text.slice(i, end));
      i = end;
    }

    let finalTranslatedText = '';
    for (const chunk of chunks) {
      const data = new URLSearchParams();
      data.append('q', chunk);

      const response = await axios.post(url, data, { 
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 10000 
      });
      
      if (response.data && response.data[0]) {
        finalTranslatedText += response.data[0].map((item: any) => item[0]).join('');
      } else {
        throw new Error('Invalid response format from GTX API');
      }
    }
    
    return finalTranslatedText;
  }

  private async translateHtmlFree(html: string, sourceLang: string, targetLang: string): Promise<string> {
    // Parse the HTML using Cheerio
    const $ = cheerio.load(html, null, false);
    const textNodes: any[] = [];
    
    // Recursively find text nodes that contain actual text
    function extractText(node: any) {
      if (node.type === 'text') {
        const text = node.data.trim();
        if (text.length > 0) {
          textNodes.push(node);
        }
      } else if (node.type === 'tag' && node.children) {
        node.children.forEach(extractText);
      }
    }

    $.root().children().each((_, el) => extractText(el));

    if (textNodes.length === 0) {
      return html;
    }

    const texts = textNodes.map(n => (n as any).data);
    const DELIMITER = ' \n\n[###]\n\n ';
    const combinedText = texts.join(DELIMITER);

    const translatedText = await this.translateTextFree(combinedText, sourceLang, targetLang);
    
    const translatedParts = translatedText.split(/\s*\[###\]\s*/);

    // Reconstruct the HTML
    for (let i = 0; i < Math.min(textNodes.length, translatedParts.length); i++) {
      (textNodes[i] as any).data = translatedParts[i] || (textNodes[i] as any).data;
    }

    return $.html();
  }
}
