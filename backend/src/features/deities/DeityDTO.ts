export interface CreateDeityDTO {
  name: string;
  slug?: string;
  shortDescription?: string;
  image?: string;
  displayOrder?: number;
  featured?: boolean;
  status?: 'ACTIVE' | 'INACTIVE';
  seoTitle?: string;
  seoDescription?: string;
  createdBy?: string;
}

export interface UpdateDeityDTO extends Partial<CreateDeityDTO> {
  updatedBy?: string;
}

export interface DeityQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
}
