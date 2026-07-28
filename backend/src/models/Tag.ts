export interface Tag {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface CreateTagDTO {
  name: string;
  slug: string;
  description?: string;
  color?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface UpdateTagDTO extends Partial<CreateTagDTO> {}
