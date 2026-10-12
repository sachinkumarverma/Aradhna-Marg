import { z } from 'zod';
import { AgentToolDefinition } from '../../types/ToolContract';
import { AgentPermissionTier } from '../../types/AgentPermissionTier';

const InputSchema = z.object({
  entityId: z.string().uuid(),
  proposedMeaning: z.string().min(20).max(2000),
  currentValue: z.string().optional(),
  reasoning: z.string().min(5).max(500)
});

const OutputSchema = z.object({
  proposalId: z.string(),
  status: z.string(),
  message: z.string()
});

export const proposeBhajanMeaningTool: AgentToolDefinition<
  z.infer<typeof InputSchema>,
  z.infer<typeof OutputSchema>
> = {
  name: 'propose_bhajan_meaning',
  description: 'Proposes spiritual Hindi meaning for a Bhajan for human review (never touches lyrics).',
  inputSchema: InputSchema,
  outputSchema: OutputSchema,
  permission: AgentPermissionTier.TIER_3_PROPOSE,
  requiresApproval: true,
  handler: async (input) => {
    return {
      proposalId: 'pending',
      status: 'PROPOSAL_STAGED',
      message: `Spiritual meaning proposal staged for Bhajan ${input.entityId}`
    };
  }
};
