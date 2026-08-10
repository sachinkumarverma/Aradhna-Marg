import { ContentType, TranslationStatus } from './TranslationTypes';

export interface CreateTranslationDTO {
  contentType: ContentType;
  contentId: string;
  sourceLanguage: string;
  targetLanguage: string;
  title?: string;
  excerpt?: string;
  description?: string;
  content?: string;
  festivalDetails?: string;
  seoTitle?: string;
  seoDescription?: string;
  provider?: string;
  translationStatus: TranslationStatus;
  sourceVersion: number;
}

export interface UpdateTranslationDTO {
  title?: string;
  excerpt?: string;
  description?: string;
  content?: string;
  festivalDetails?: string;
  seoTitle?: string;
  seoDescription?: string;
  translationStatus?: TranslationStatus;
}
