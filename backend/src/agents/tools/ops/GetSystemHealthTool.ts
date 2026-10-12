import { z } from 'zod';
import { AgentToolDefinition } from '../../types/ToolContract';
import { AgentPermissionTier } from '../../types/AgentPermissionTier';
import { systemHealthService } from '@services/SystemHealthService';

const InputSchema = z
  .object({
    includeRecentRuns: z.boolean().optional()
  })
  .passthrough();

const OutputSchema = z.object({
  pendingJobs: z.number(),
  processingJobs: z.number(),
  completedJobs: z.number(),
  failedJobs: z.number(),
  todayJobs: z.number(),
  databaseStatus: z.string(),
  databaseLatencyMs: z.number(),
  aiQueueStatus: z.string(),
  agentRunsTotal: z.number(),
  recentFailedAgentRuns: z.number(),
  uptimeSeconds: z.number(),
  memoryUsageMb: z.number(),
  environment: z.string()
});

export const getSystemHealthTool: AgentToolDefinition<z.infer<typeof InputSchema>, z.infer<typeof OutputSchema>> = {
  name: 'get_system_health',
  description:
    'Grounded, read-only inspection of database connectivity, AI job queues, agent run health, and process status.',
  inputSchema: InputSchema,
  outputSchema: OutputSchema,
  permission: AgentPermissionTier.TIER_1_READ,
  requiresApproval: false,
  handler: async () => {
    const overview = await systemHealthService.getHealthOverview();
    return {
      pendingJobs: overview.aiQueue.pending,
      processingJobs: overview.aiQueue.processing,
      completedJobs: overview.aiQueue.completed,
      failedJobs: overview.aiQueue.failed,
      todayJobs: overview.aiQueue.today,
      databaseStatus: overview.database.status,
      databaseLatencyMs: overview.database.latencyMs,
      aiQueueStatus: overview.aiQueue.status,
      agentRunsTotal: overview.agentExecution.totalRuns,
      recentFailedAgentRuns: overview.agentExecution.recentFailedRuns,
      uptimeSeconds: overview.process.uptimeSeconds,
      memoryUsageMb: overview.process.memoryUsageMb,
      environment: overview.process.environment
    };
  }
};
