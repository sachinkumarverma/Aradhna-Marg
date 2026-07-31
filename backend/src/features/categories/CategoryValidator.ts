import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  iconUrl: z.string().url().optional().or(z.literal('')),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  displayOrder: z.number().int().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  showInNavigation: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();
