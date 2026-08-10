export type TranslationStatus = 
  | 'NOT_TRANSLATED' 
  | 'GENERATING' 
  | 'NEEDS_REVIEW' 
  | 'APPROVED' 
  | 'PUBLISHED' 
  | 'FAILED';

export type ContentType = 'ARTICLE' | 'PURAN' | 'FESTIVAL';

export interface ContentTranslation {
  id: string;
  contentType: ContentType;
  contentId: string;
  sourceLanguage: string;
  targetLanguage: string;
  
  // Fields
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

  translatedAt?: string;
  reviewedAt?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}
