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
  deityId?: string;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  // Related content placeholders
  bhajanIds?: string[];
  articleIds?: string[];

  // English Translation fields
  name_en?: string;
  shortDescription_en?: string;
  content_en?: string;
  seoTitle_en?: string;
  seoDescription_en?: string;
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
  deityId?: string;
  seoTitle?: string;
  seoDescription?: string;
  bhajanIds?: string[];
  articleIds?: string[];

  // English Translation fields
  name_en?: string;
  shortDescription_en?: string;
  content_en?: string;
  seoTitle_en?: string;
  seoDescription_en?: string;
}

export type UpdateFestivalDTO = Partial<CreateFestivalDTO>;
