import { z } from 'zod';
import { AgentToolDefinition } from '../../types/ToolContract';
import { AgentPermissionTier } from '../../types/AgentPermissionTier';
import { bhajanService } from '@features/bhajans/BhajanService';
import { articleService } from '@services/ArticleService';
import { festivalService } from '@services/FestivalService';
import { puranService } from '@services/PuranService';
import { categoryService } from '@features/categories/CategoryService';

const InputSchema = z.object({
  contentType: z.enum(['bhajan', 'article', 'festival', 'puran', 'category']),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20)
});

const ItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  excerpt: z.string().optional(),
  content: z.string().optional(),
  status: z.string().optional()
});

const OutputSchema = z.object({
  contentType: z.string(),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  items: z.array(ItemSchema)
});

export const getSeoContentBatchTool: AgentToolDefinition<z.infer<typeof InputSchema>, z.infer<typeof OutputSchema>> = {
  name: 'get_seo_content_batch',
  description:
    'Fetches a paginated batch of website content items for read-only SEO audit analysis via domain services.',
  inputSchema: InputSchema,
  outputSchema: OutputSchema,
  permission: AgentPermissionTier.TIER_1_READ,
  requiresApproval: false,
  handler: async (input) => {
    const { contentType, page, limit } = input;
    let total = 0;
    let items: z.infer<typeof ItemSchema>[] = [];

    if (contentType === 'bhajan') {
      const { data, count } = await bhajanService.getList({ page, limit });
      total = count;
      items = data.map((d: any) => ({
        id: d.id,
        title: d.title || '',
        slug: d.slug || '',
        seoTitle: d.seo_title || undefined,
        seoDescription: d.seo_description || undefined,
        excerpt: d.short_description || undefined,
        content: d.lyrics || undefined,
        status: d.status || 'PUBLISHED'
      }));
    } else if (contentType === 'article') {
      const { data, count } = await articleService.getList({ page, limit });
      total = count;
      items = data.map((d: any) => ({
        id: d.id,
        title: d.title || '',
        slug: d.slug || '',
        seoTitle: d.seo_title || undefined,
        seoDescription: d.seo_description || undefined,
        excerpt: d.excerpt || undefined,
        content: d.content || undefined,
        status: d.status || 'PUBLISHED'
      }));
    } else if (contentType === 'festival') {
      const { data, count } = await festivalService.getList({ page, limit });
      total = count;
      items = data.map((d: any) => ({
        id: d.id,
        title: d.name || '',
        slug: d.slug || '',
        seoTitle: d.seo_title || d.seoTitle || undefined,
        seoDescription: d.seo_description || d.seoDescription || undefined,
        excerpt: d.short_description || d.shortDescription || undefined,
        content: d.content || undefined,
        status: d.status || 'PUBLISHED'
      }));
    } else if (contentType === 'puran') {
      const { data, count } = await puranService.getList({ page, limit });
      total = count;
      items = data.map((d: any) => ({
        id: d.id,
        title: d.title || '',
        slug: d.slug || '',
        seoTitle: d.seo_title || undefined,
        seoDescription: d.seo_description || undefined,
        excerpt: d.short_description || undefined,
        content: d.description_en || d.short_description || undefined,
        status: d.status || 'PUBLISHED'
      }));
    } else if (contentType === 'category') {
      const { data, total: catTotal } = await categoryService.getCategories({ page, limit });
      total = catTotal;
      items = data.map((d: any) => ({
        id: d.id,
        title: d.name || '',
        slug: d.slug || '',
        seoTitle: d.seoTitle || (d as any).seo_title || undefined,
        seoDescription: d.seoDescription || (d as any).seo_description || undefined,
        excerpt: d.description || undefined,
        content: d.description || undefined,
        status: d.status || 'ACTIVE'
      }));
    }

    return {
      contentType,
      total,
      page,
      limit,
      items
    };
  }
};
