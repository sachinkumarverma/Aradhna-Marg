import { z } from 'zod';
import { AgentToolDefinition } from '../../types/ToolContract';
import { AgentPermissionTier } from '../../types/AgentPermissionTier';

const InputSchema = z.object({
  entityId: z.string().uuid(),
  targetField: z.enum(['content', 'short_description', 'content_en', 'short_description_en']),
  proposedContent: z.string().min(10),
  currentValue: z.string().optional(),
  reasoning: z.string().min(5).max(1000)
});

const OutputSchema = z.object({
  proposalId: z.string(),
  status: z.string(),
  message: z.string()
});

export const proposeFestivalContentImprovementTool: AgentToolDefinition<
  z.infer<typeof InputSchema>,
  z.infer<typeof OutputSchema>
> = {
  name: 'propose_festival_content_improvement',
  description: 'Stages a content improvement proposal for a Festival for human review.',
  inputSchema: InputSchema,
  outputSchema: OutputSchema,
  permission: AgentPermissionTier.TIER_3_PROPOSE,
  requiresApproval: true,
  handler: async (input) => {
    return {
      proposalId: 'pending',
      status: 'PROPOSAL_STAGED',
      message: `Content improvement proposal staged for Festival ${input.entityId} (field: ${input.targetField})`
    };
  }
};
