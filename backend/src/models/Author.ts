export interface Author {
  id: string;
  name: string;
  photo?: string;
  shortDescription?: string;
  status: 'ACTIVE' | 'INACTIVE';
  seoTitle?: string;
  seoDescription?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface CreateAuthorDTO {
  name: string;
  photo?: string;
  shortDescription?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  seoTitle?: string;
  seoDescription?: string;
}

export interface UpdateAuthorDTO extends Partial<CreateAuthorDTO> {}
