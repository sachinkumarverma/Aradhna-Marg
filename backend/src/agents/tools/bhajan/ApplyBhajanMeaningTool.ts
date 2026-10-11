import { z } from 'zod';
import { AgentToolDefinition } from '../../types/ToolContract';
import { AgentPermissionTier } from '../../types/AgentPermissionTier';
import { bhajanService } from '../../../features/bhajans/BhajanService';

const inputSchema = z.object({
  proposalId: z.string().uuid(),
  bhajanId: z.string().uuid(),
  meaning: z.string().min(5).max(5000),
  targetField: z.literal('meaning')
});

const outputSchema = z.object({
  success: z.boolean(),
  bhajanId: z.string(),
  updatedField: z.string(),
  message: z.string()
});

export const applyBhajanMeaningTool: AgentToolDefinition<z.infer<typeof inputSchema>, z.infer<typeof outputSchema>> = {
  name: 'apply_bhajan_meaning',
  description: 'Applies an approved devotional meaning modification to a Bhajan via BhajanService',
  permission: AgentPermissionTier.TIER_5_PUBLISH_OVERWRITE,
  requiresApproval: true,
  inputSchema,
  outputSchema,
  handler: async (input) => {
    // Strictly invokes domain-service layer (no direct DB or repository imports)
    await bhajanService.updateMeaning(input.bhajanId, input.meaning);
    return {
      success: true,
      bhajanId: input.bhajanId,
      updatedField: 'meaning',
      message: 'Bhajan devotional meaning successfully updated via BhajanService'
    };
  }
};
