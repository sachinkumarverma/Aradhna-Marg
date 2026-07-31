export interface Deity {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string;
  image?: string;
  displayOrder?: number;
  featured: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  seoTitle?: string;
  seoDescription?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}
