export interface Tag {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
}
