import { z } from 'zod';
import { AgentToolDefinition } from '../../types/ToolContract';
import { AgentPermissionTier } from '../../types/AgentPermissionTier';
import { articleService } from '@services/ArticleService';
import { festivalService } from '@services/FestivalService';
import { puranService } from '@services/PuranService';
import { bhajanService } from '@features/bhajans/BhajanService';

const InputSchema = z.object({
  contentType: z.enum(['article', 'festival', 'puran', 'bhajan']),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20)
});

const ContentItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  excerpt: z.string().optional(),
  content: z.string().optional(),
  titleEn: z.string().optional(),
  excerptEn: z.string().optional(),
  contentEn: z.string().optional(),
  status: z.string().optional(),
  wordCount: z.number(),
  charCount: z.number()
});

const OutputSchema = z.object({
  contentType: z.string(),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  items: z.array(ContentItemSchema)
});

export const getContentQualityBatchTool: AgentToolDefinition<
  z.infer<typeof InputSchema>,
  z.infer<typeof OutputSchema>
> = {
  name: 'get_content_quality_batch',
  description:
    'Fetches a paginated batch of website content items for read-only content quality analysis. Lyrics and YouTube excluded by constitutional firewall.',
  inputSchema: InputSchema,
  outputSchema: OutputSchema,
  permission: AgentPermissionTier.TIER_1_READ,
  requiresApproval: false,
  handler: async (input) => {
    const { contentType, page, limit } = input;
    let total = 0;
    let items: z.infer<typeof ContentItemSchema>[] = [];

    const countWords = (text?: string): number => {
      if (!text) return 0;
      const clean = text.replace(/<[^>]*>/g, ' ').trim();
      return clean ? clean.split(/\s+/).length : 0;
    };

    const countChars = (text?: string): number => {
      if (!text) return 0;
      return text.replace(/<[^>]*>/g, '').trim().length;
    };

    if (contentType === 'article') {
      const { data, count } = await articleService.getList({ page, limit });
      total = count;
      items = data.map((d: any) => ({
        id: d.id,
        title: d.title || '',
        excerpt: d.excerpt || undefined,
        content: d.content || undefined,
        titleEn: d.title_en || undefined,
        excerptEn: d.excerpt_en || undefined,
        contentEn: d.content_en || undefined,
        status: d.status || 'PUBLISHED',
        wordCount: countWords(d.content),
        charCount: countChars(d.content)
      }));
    } else if (contentType === 'festival') {
      const { data, count } = await festivalService.getList({ page, limit });
      total = count;
      items = data.map((d: any) => ({
        id: d.id,
        title: d.name || '',
        excerpt: d.short_description || d.shortDescription || undefined,
        content: d.content || undefined,
        titleEn: d.name_en || undefined,
        excerptEn: d.short_description_en || d.shortDescription_en || undefined,
        contentEn: d.content_en || undefined,
        status: d.status || 'PUBLISHED',
        wordCount: countWords(d.content),
        charCount: countChars(d.content)
      }));
    } else if (contentType === 'puran') {
      const { data, count } = await puranService.getList({ page, limit });
      total = count;
      items = data.map((d: any) => ({
        id: d.id,
        title: d.title || '',
        excerpt: d.short_description || undefined,
        content: d.description_en || d.short_description || undefined,
        status: d.status || 'PUBLISHED',
        wordCount: countWords(d.description_en || d.short_description),
        charCount: countChars(d.description_en || d.short_description)
      }));
    } else if (contentType === 'bhajan') {
      const { data, count } = await bhajanService.getList({ page, limit });
      total = count;
      // Sacred Content Firewall: Do NOT expose lyrics for content quality rewriting!
      // Only editorial description / meaning is analyzed.
      items = data.map((d: any) => ({
        id: d.id,
        title: d.title || '',
        excerpt: d.short_description || undefined,
        content: d.description || undefined,
        status: d.status || 'PUBLISHED',
        wordCount: countWords(d.description || d.short_description),
        charCount: countChars(d.description || d.short_description)
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
