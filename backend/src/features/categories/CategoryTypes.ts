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
  status: 'active' | 'inactive';
  showInNavigation: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
  bhajanCount?: number;
}
