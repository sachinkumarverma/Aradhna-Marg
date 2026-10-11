import { z } from 'zod';
import { AgentToolDefinition } from '../../types/ToolContract';
import { AgentPermissionTier } from '../../types/AgentPermissionTier';
import { bhajanService } from '@features/bhajans/BhajanService';
import { articleService } from '@services/ArticleService';
import { festivalService } from '@services/FestivalService';
import { puranService } from '@services/PuranService';

const InputSchema = z.object({
  entityType: z.enum(['bhajan', 'article', 'festival', 'puran']),
  id: z.string().uuid()
});

const OutputSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  name: z.string().optional(),
  slug: z.string().optional(),
  status: z.string().optional(),
  data: z.any()
});

export const getContentItemTool: AgentToolDefinition<z.infer<typeof InputSchema>, z.infer<typeof OutputSchema>> = {
  name: 'get_content_item',
  description: 'Reads a devotional content item by its UUID using domain services.',
  inputSchema: InputSchema,
  outputSchema: OutputSchema,
  permission: AgentPermissionTier.TIER_1_READ,
  requiresApproval: false,
  handler: async (input) => {
    let item: any = null;

    if (input.entityType === 'bhajan') {
      item = await bhajanService.getById(input.id);
    } else if (input.entityType === 'article') {
      item = await articleService.getById(input.id);
    } else if (input.entityType === 'festival') {
      item = await festivalService.getById(input.id);
    } else if (input.entityType === 'puran') {
      item = await puranService.getById(input.id);
    }

    if (!item) {
      throw new Error(`${input.entityType} with ID ${input.id} was not found.`);
    }

    return {
      id: item.id,
      title: item.title,
      name: item.name,
      slug: item.slug,
      status: item.status,
      data: item
    };
  }
};
