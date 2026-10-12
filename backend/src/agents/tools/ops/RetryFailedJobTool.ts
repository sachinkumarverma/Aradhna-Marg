import { z } from 'zod';
import { AgentToolDefinition } from '../../types/ToolContract';
import { AgentPermissionTier } from '../../types/AgentPermissionTier';
import { aiJobService } from '@admin/services/AiJobService';

const InputSchema = z.object({
  jobId: z.string().uuid()
});

const OutputSchema = z.object({
  id: z.string(),
  status: z.string(),
  message: z.string()
});

export const retryFailedJobTool: AgentToolDefinition<z.infer<typeof InputSchema>, z.infer<typeof OutputSchema>> = {
  name: 'retry_failed_job',
  description: 'Retries a failed AI background job by resetting its status back to PENDING.',
  inputSchema: InputSchema,
  outputSchema: OutputSchema,
  permission: AgentPermissionTier.TIER_4_MODIFY_DRAFT,
  requiresApproval: false,
  handler: async (input) => {
    const job = await aiJobService.retryJob(input.jobId);
    return {
      id: job.id,
      status: job.status,
      message: `Job ${job.id} reset and scheduled for retry.`
    };
  }
};
