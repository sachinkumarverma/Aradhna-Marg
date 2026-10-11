import { z } from 'zod';
import { AgentToolDefinition } from '../../types/ToolContract';
import { AgentPermissionTier } from '../../types/AgentPermissionTier';
import { aiJobService } from '@admin/services/AiJobService';

const InputSchema = z.object({});

const OutputSchema = z.object({
  pendingJobs: z.number(),
  processingJobs: z.number(),
  completedJobs: z.number(),
  failedJobs: z.number(),
  todayJobs: z.number()
});

export const getSystemHealthTool: AgentToolDefinition<z.infer<typeof InputSchema>, z.infer<typeof OutputSchema>> = {
  name: 'get_system_health',
  description: 'Inspects AI job queue health, failed jobs count, and today throughput.',
  inputSchema: InputSchema,
  outputSchema: OutputSchema,
  permission: AgentPermissionTier.TIER_1_READ,
  requiresApproval: false,
  handler: async () => {
    const stats = await aiJobService.getStats();
    return {
      pendingJobs: stats.pending,
      processingJobs: stats.processing,
      completedJobs: stats.completed,
      failedJobs: stats.failed,
      todayJobs: stats.today
    };
  }
};
