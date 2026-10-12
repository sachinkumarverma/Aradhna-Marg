import { z } from 'zod';
import { AgentToolDefinition } from '../../types/ToolContract';
import { AgentPermissionTier } from '../../types/AgentPermissionTier';
import { puranService } from '../../../services/PuranService';

const inputSchema = z.object({
  proposalId: z.string().uuid(),
  entityId: z.string().uuid(),
  targetField: z.enum(['short_description', 'description_en']),
  content: z.string().min(5)
});

const outputSchema = z.object({
  success: z.boolean(),
  entityId: z.string(),
  updatedField: z.string(),
  message: z.string()
});

export const applyPuranDescriptionTool: AgentToolDefinition<
  z.infer<typeof inputSchema>,
  z.infer<typeof outputSchema>
> = {
  name: 'apply_puran_description',
  description: 'Applies an approved description proposal to a Purana via PuranService',
  permission: AgentPermissionTier.TIER_5_PUBLISH_OVERWRITE,
  requiresApproval: true,
  inputSchema,
  outputSchema,
  handler: async (input) => {
    const current = await puranService.getById(input.entityId);
    if (!current) throw new Error(`Purana not found: ${input.entityId}`);

    await puranService.updateDescription(input.entityId, input.targetField, input.content);

    return {
      success: true,
      entityId: input.entityId,
      updatedField: input.targetField,
      message: `Purana ${input.targetField} successfully updated via PuranService`
    };
  }
};
