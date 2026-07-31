export interface CreateTagDTO {
  name: string;
  slug?: string;
  description?: string;
  color?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface UpdateTagDTO extends Partial<CreateTagDTO> {}

export interface TagQueryOptions {
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  status?: string;
}
