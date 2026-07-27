export interface Festival {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string;
  content?: string;
  bannerImage?: string;
  festivalDate?: string;
  category?: string;
  featured: boolean;
  status: string;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  // Related content placeholders
  bhajanIds?: string[];
  articleIds?: string[];
}

export interface CreateFestivalDTO {
  name: string;
  slug: string;
  shortDescription?: string;
  content?: string;
  bannerImage?: string;
  festivalDate?: string;
  category?: string;
  featured?: boolean;
  status?: string;
  seoTitle?: string;
  seoDescription?: string;
  bhajanIds?: string[];
  articleIds?: string[];
}

export type UpdateFestivalDTO = Partial<CreateFestivalDTO>;
