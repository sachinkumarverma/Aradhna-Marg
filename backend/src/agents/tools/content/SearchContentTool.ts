import { z } from 'zod';
import { AgentToolDefinition } from '../../types/ToolContract';
import { AgentPermissionTier } from '../../types/AgentPermissionTier';
import { bhajanService } from '@features/bhajans/BhajanService';
import { articleService } from '@services/ArticleService';

const InputSchema = z.object({
  query: z.string().min(2).max(100),
  entityType: z.enum(['bhajan', 'article']).default('bhajan'),
  limit: z.number().int().min(1).max(20).default(5)
});

const OutputSchema = z.object({
  total: z.number(),
  results: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      slug: z.string(),
      status: z.string()
    })
  )
});

export const searchContentTool: AgentToolDefinition<z.infer<typeof InputSchema>, z.infer<typeof OutputSchema>> = {
  name: 'search_content',
  description: 'Searches public content items (Bhajans or Articles) matching a query.',
  inputSchema: InputSchema,
  outputSchema: OutputSchema,
  permission: AgentPermissionTier.TIER_1_READ,
  requiresApproval: false,
  handler: async (input) => {
    if (input.entityType === 'bhajan') {
      const { data, count } = await bhajanService.getList({
        page: 1,
        limit: input.limit,
        search: input.query
      });
      return {
        total: count,
        results: data.map((d: any) => ({
          id: d.id,
          title: d.title,
          slug: d.slug,
          status: d.status
        }))
      };
    } else {
      const { data, count } = await articleService.getList({
        page: 1,
        limit: input.limit,
        search: input.query
      });
      return {
        total: count,
        results: data.map((d: any) => ({
          id: d.id,
          title: d.title,
          slug: d.slug,
          status: d.status
        }))
      };
    }
  }
};
