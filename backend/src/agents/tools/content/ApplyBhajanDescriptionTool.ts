import { z } from 'zod';
import { AgentToolDefinition } from '../../types/ToolContract';
import { AgentPermissionTier } from '../../types/AgentPermissionTier';
import { bhajanService } from '../../../features/bhajans/BhajanService';

const inputSchema = z.object({
  proposalId: z.string().uuid(),
  entityId: z.string().uuid(),
  targetField: z.enum(['description', 'short_description']),
  content: z.string().min(5)
});

const outputSchema = z.object({
  success: z.boolean(),
  entityId: z.string(),
  updatedField: z.string(),
  message: z.string()
});

export const applyBhajanDescriptionTool: AgentToolDefinition<
  z.infer<typeof inputSchema>,
  z.infer<typeof outputSchema>
> = {
  name: 'apply_bhajan_description',
  description: 'Applies an approved description proposal to a Bhajan (never touches lyrics or title) via BhajanService',
  permission: AgentPermissionTier.TIER_5_PUBLISH_OVERWRITE,
  requiresApproval: true,
  inputSchema,
  outputSchema,
  handler: async (input) => {
    const current = await bhajanService.getById(input.entityId);
    if (!current) throw new Error(`Bhajan not found: ${input.entityId}`);

    // Sacred Content Firewall double check
    if (input.targetField !== 'description' && input.targetField !== 'short_description') {
      throw new Error(`Sacred Content Firewall: Mutating field '${input.targetField}' is strictly forbidden.`);
    }

    await bhajanService.updateDescription(input.entityId, input.targetField, input.content);

    return {
      success: true,
      entityId: input.entityId,
      updatedField: input.targetField,
      message: `Bhajan ${input.targetField} successfully updated via BhajanService`
    };
  }
};
