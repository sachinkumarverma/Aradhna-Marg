import { z } from 'zod';
import { AgentToolDefinition } from '../../types/ToolContract';
import { AgentPermissionTier } from '../../types/AgentPermissionTier';
import { puranService } from '../../../services/PuranService';

const inputSchema = z.object({
  proposalId: z.string().uuid(),
  entityId: z.string().uuid(),
  seoTitle: z.string().min(5).max(120).optional(),
  seoDescription: z.string().min(10).max(300).optional(),
  targetField: z.enum(['seo_title', 'seo_description', 'seo_metadata'])
});

const outputSchema = z.object({
  success: z.boolean(),
  entityId: z.string(),
  updatedField: z.string(),
  seoTitle: z.string(),
  seoDescription: z.string(),
  message: z.string()
});

export const applyPuranSeoMetadataTool: AgentToolDefinition<
  z.infer<typeof inputSchema>,
  z.infer<typeof outputSchema>
> = {
  name: 'apply_puran_seo_metadata',
  description: 'Applies an approved SEO metadata proposal to a Puran via PuranService',
  permission: AgentPermissionTier.TIER_5_PUBLISH_OVERWRITE,
  requiresApproval: true,
  inputSchema,
  outputSchema,
  handler: async (input) => {
    const current = await puranService.getById(input.entityId);
    if (!current) throw new Error(`Puran not found: ${input.entityId}`);

    const finalTitle = (input.seoTitle !== undefined ? input.seoTitle : current.seo_title || '').trim();
    const finalDesc = (
      input.seoDescription !== undefined ? input.seoDescription : current.seo_description || ''
    ).trim();

    await puranService.updateSeo(input.entityId, finalTitle, finalDesc);

    return {
      success: true,
      entityId: input.entityId,
      updatedField: input.targetField,
      seoTitle: finalTitle,
      seoDescription: finalDesc,
      message: 'Puran SEO metadata successfully updated via PuranService'
    };
  }
};
