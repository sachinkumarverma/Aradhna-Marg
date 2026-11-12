export interface CreateCategoryDTO {
  name: string;
  name_en?: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  iconUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  displayOrder?: number;
  status?: 'active' | 'inactive';
  showInNavigation?: boolean;
  isFeatured?: boolean;
}

export interface UpdateCategoryDTO extends Partial<CreateCategoryDTO> {}

export interface CategoryQueryOptions {
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
