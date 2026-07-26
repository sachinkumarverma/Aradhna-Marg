export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  iconUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  displayOrder: number;
  status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
  bhajanCount?: number;
}

export interface CreateCategoryDTO {
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  iconUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  displayOrder?: number;
  status?: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
}

export interface UpdateCategoryDTO extends Partial<CreateCategoryDTO> {}
