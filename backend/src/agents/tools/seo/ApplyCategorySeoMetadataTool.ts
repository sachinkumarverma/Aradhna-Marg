import { z } from 'zod';
import { AgentToolDefinition } from '../../types/ToolContract';
import { AgentPermissionTier } from '../../types/AgentPermissionTier';
import { categoryService } from '../../../features/categories/CategoryService';

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

export const applyCategorySeoMetadataTool: AgentToolDefinition<
  z.infer<typeof inputSchema>,
  z.infer<typeof outputSchema>
> = {
  name: 'apply_category_seo_metadata',
  description: 'Applies an approved SEO metadata proposal to a Category via CategoryService',
  permission: AgentPermissionTier.TIER_5_PUBLISH_OVERWRITE,
  requiresApproval: true,
  inputSchema,
  outputSchema,
  handler: async (input) => {
    const current = await categoryService.getById(input.entityId);
    if (!current) throw new Error(`Category not found: ${input.entityId}`);

    const finalTitle = (input.seoTitle !== undefined ? input.seoTitle : current.seoTitle || '').trim();
    const finalDesc = (input.seoDescription !== undefined ? input.seoDescription : current.seoDescription || '').trim();

    await categoryService.updateSeo(input.entityId, finalTitle, finalDesc);

    return {
      success: true,
      entityId: input.entityId,
      updatedField: input.targetField,
      seoTitle: finalTitle,
      seoDescription: finalDesc,
      message: 'Category SEO metadata successfully updated via CategoryService'
    };
  }
};
