import { z } from 'zod';
import { AgentToolDefinition } from '../../types/ToolContract';
import { AgentPermissionTier } from '../../types/AgentPermissionTier';

const InputSchema = z.object({
  entityType: z.enum(['bhajan', 'article', 'festival', 'puran', 'category']),
  entityId: z.string().uuid(),
  targetField: z.enum(['seo_title', 'seo_description', 'seo_metadata']).default('seo_metadata'),
  seoTitle: z.string().min(5).max(120).optional(),
  seoDescription: z.string().min(10).max(300).optional(),
  proposedValue: z.string().optional(),
  currentValue: z.string().optional(),
  reasoning: z.string().min(5).max(500)
});

const OutputSchema = z.object({
  proposalId: z.string(),
  status: z.string(),
  message: z.string()
});

export const proposeSeoMetadataTool: AgentToolDefinition<z.infer<typeof InputSchema>, z.infer<typeof OutputSchema>> = {
  name: 'propose_seo_metadata',
  description: 'Proposes new SEO title and meta description for human editorial review in agent_proposals.',
  inputSchema: InputSchema,
  outputSchema: OutputSchema,
  permission: AgentPermissionTier.TIER_3_PROPOSE,
  requiresApproval: true,
  handler: async (input) => {
    // Staged through ToolGateway into agent_proposals
    return {
      proposalId: 'pending',
      status: 'PROPOSAL_STAGED',
      message: `SEO metadata proposal staged for ${input.entityType} ${input.entityId}`
    };
  }
};
