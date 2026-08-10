export interface TranslationProvider {
  name: string;
  translate(text: string, sourceLang: string, targetLang: string, format?: 'text' | 'html'): Promise<string>;
}
