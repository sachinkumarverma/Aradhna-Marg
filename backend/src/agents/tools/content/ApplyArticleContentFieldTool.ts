import { z } from 'zod';
import { AgentToolDefinition } from '../../types/ToolContract';
import { AgentPermissionTier } from '../../types/AgentPermissionTier';
import { articleService } from '../../../services/ArticleService';

const inputSchema = z.object({
  proposalId: z.string().uuid(),
  entityId: z.string().uuid(),
  targetField: z.enum(['content', 'excerpt', 'content_en', 'excerpt_en']),
  content: z.string().min(5)
});

const outputSchema = z.object({
  success: z.boolean(),
  entityId: z.string(),
  updatedField: z.string(),
  message: z.string()
});

export const applyArticleContentFieldTool: AgentToolDefinition<
  z.infer<typeof inputSchema>,
  z.infer<typeof outputSchema>
> = {
  name: 'apply_article_content_field',
  description: 'Applies an approved content field proposal to an Article via ArticleService',
  permission: AgentPermissionTier.TIER_5_PUBLISH_OVERWRITE,
  requiresApproval: true,
  inputSchema,
  outputSchema,
  handler: async (input) => {
    const current = await articleService.getById(input.entityId);
    if (!current) throw new Error(`Article not found: ${input.entityId}`);

    await articleService.updateContentField(input.entityId, input.targetField, input.content);

    return {
      success: true,
      entityId: input.entityId,
      updatedField: input.targetField,
      message: `Article ${input.targetField} successfully updated via ArticleService`
    };
  }
};
