import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(255),
  slug: z.string().min(2, "Slug must be at least 2 characters").max(255).regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  description: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  iconUrl: z.string().url().optional().or(z.literal('')),
  seoTitle: z.string().max(255).optional(),
  seoDescription: z.string().optional(),
  displayOrder: z.number().int().optional(),
  status: z.enum(['PUBLISHED', 'DRAFT', 'ARCHIVED']).optional(),
});

export const updateCategorySchema = createCategorySchema.partial();
