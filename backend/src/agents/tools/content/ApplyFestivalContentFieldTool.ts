import { z } from 'zod';
import { AgentToolDefinition } from '../../types/ToolContract';
import { AgentPermissionTier } from '../../types/AgentPermissionTier';
import { festivalService } from '../../../services/FestivalService';

const inputSchema = z.object({
  proposalId: z.string().uuid(),
  entityId: z.string().uuid(),
  targetField: z.enum(['content', 'short_description', 'content_en', 'short_description_en']),
  content: z.string().min(5)
});

const outputSchema = z.object({
  success: z.boolean(),
  entityId: z.string(),
  updatedField: z.string(),
  message: z.string()
});

export const applyFestivalContentFieldTool: AgentToolDefinition<
  z.infer<typeof inputSchema>,
  z.infer<typeof outputSchema>
> = {
  name: 'apply_festival_content_field',
  description: 'Applies an approved content field proposal to a Festival via FestivalService',
  permission: AgentPermissionTier.TIER_5_PUBLISH_OVERWRITE,
  requiresApproval: true,
  inputSchema,
  outputSchema,
  handler: async (input) => {
    const current = await festivalService.getById(input.entityId);
    if (!current) throw new Error(`Festival not found: ${input.entityId}`);

    await festivalService.updateContentField(input.entityId, input.targetField, input.content);

    return {
      success: true,
      entityId: input.entityId,
      updatedField: input.targetField,
      message: `Festival ${input.targetField} successfully updated via FestivalService`
    };
  }
};
