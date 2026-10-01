export interface ISearchOptions {
  query: string;
  type?: string;
  filters?: {
    type?: string;
    categoryId?: string;
    godId?: string;
    festivalId?: string;
    hasPdf?: boolean;
    hasVideo?: boolean;
  };
  sort?: 'NEWEST' | 'OLDEST' | 'POPULARITY' | 'VIEWS';
  page?: number;
  limit?: number;
}

export interface ISearchResult {
  id: string;
  slug: string;
  title: string;
  hindi_title?: string;
  thumbnail_url?: string;
  views: number;
  has_pdf: boolean;
  has_video: boolean;
  reading_time: number;
}
