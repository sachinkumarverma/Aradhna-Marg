import { z } from 'zod';
import { AgentToolDefinition } from '../../types/ToolContract';
import { AgentPermissionTier } from '../../types/AgentPermissionTier';
import { seoService } from '@features/seo/SeoService';

const InputSchema = z.object({});

const OutputSchema = z.object({
  totalBhajans: z.number(),
  totalArticles: z.number(),
  totalFestivals: z.number(),
  totalPuranas: z.number(),
  missingTitles: z.number(),
  missingDescriptions: z.number(),
  audit: z.array(z.any())
});

export const getSeoAuditTool: AgentToolDefinition<z.infer<typeof InputSchema>, z.infer<typeof OutputSchema>> = {
  name: 'get_seo_audit',
  description: 'Retrieves website-wide SEO statistics and counts of missing meta titles and descriptions.',
  inputSchema: InputSchema,
  outputSchema: OutputSchema,
  permission: AgentPermissionTier.TIER_2_ANALYZE,
  requiresApproval: false,
  handler: async () => {
    const overview = await seoService.getOverview();
    return overview;
  }
};
