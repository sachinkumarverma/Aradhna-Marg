import { toolGateway } from '../gateway/ToolGateway';
import { AgentDefinition, AutonomousAgent, AgentFinding, AgentRunState } from '../types/AgentDefinition';
import { AgentPermissionTier } from '../types/AgentPermissionTier';
import { AgentContext } from '../types/AgentContext';
import { agentRunRepository } from '../repositories/AgentRunRepository';
import { logger } from '@utils/logger';

export class SystemHealthAgent implements AutonomousAgent {
  public readonly definition: AgentDefinition = {
    id: 'system_health_agent',
    name: 'System Health Agent',
    description: 'Monitors database health, AI queues, and system runtime.',
    permissionTier: AgentPermissionTier.TIER_1_READ,
    allowedTools: ['get_system_health'],
    allowedEntityTypes: ['system'],
    maxIterations: 10,
    maxToolCalls: 5,
    timeoutMs: 30000,
    dryRunOnly: true
  };

  public async execute(runId: string): Promise<AgentRunState> {
    const startTime = Date.now();
    logger.info({ runId }, 'Starting System Health Agent execution');

    const context: AgentContext = {
      runId,
      agentName: this.definition.id,
      actor: { type: 'SYSTEM', id: 'system_health_agent' },
      currentIteration: 0,
      maxIterations: this.definition.maxIterations,
      tokensUsed: 0,
      tokenBudget: 10000
    };

    try {
      // 1. Fetch grounded health metrics via ToolGateway
      const toolResult = await toolGateway.executeTool('get_system_health', {}, context);
      if (!toolResult.success || !toolResult.data) {
        throw new Error('Failed to retrieve system health metrics from get_system_health tool');
      }

      const data = toolResult.data;
      const findings: AgentFinding[] = [];

      // 2. Deterministic Rule 1: Database Connectivity
      if (data.databaseStatus !== 'HEALTHY') {
        findings.push({
          type: 'database_connectivity_issue',
          severity: 'CRITICAL',
          entityType: 'system',
          entityId: 'database',
          title: 'Database Connectivity Failure',
          message: `Database ping returned status: ${data.databaseStatus}`,
          recommendation: 'Check PostgreSQL connection pool and verify database credentials.',
          evidence: { latencyMs: data.databaseLatencyMs }
        });
      } else if (data.databaseLatencyMs > 1000) {
        findings.push({
          type: 'database_high_latency',
          severity: 'MEDIUM',
          entityType: 'system',
          entityId: 'database',
          title: 'Elevated Database Latency',
          message: `Database ping latency is elevated: ${data.databaseLatencyMs}ms`,
          recommendation: 'Monitor database connection pool utilization and query locks.',
          evidence: { latencyMs: data.databaseLatencyMs }
        });
      }

      // 3. Deterministic Rule 2: AI Job Queue Health
      if (data.failedJobs > 0) {
        const severity = data.failedJobs > 10 ? 'CRITICAL' : 'MEDIUM';
        findings.push({
          type: 'failed_ai_jobs',
          severity,
          entityType: 'system',
          entityId: 'ai_jobs',
          title: `${data.failedJobs} Failed AI Job(s) Detected`,
          message: `The AI background queue has ${data.failedJobs} failed jobs.`,
          recommendation: 'Inspect error logs on the AI Processing page and retry transient failures.',
          evidence: { failedJobs: data.failedJobs, todayJobs: data.todayJobs }
        });
      }

      if (data.pendingJobs > 25) {
        findings.push({
          type: 'ai_queue_backlog',
          severity: data.pendingJobs > 100 ? 'HIGH' : 'LOW',
          entityType: 'system',
          entityId: 'ai_jobs',
          title: 'Pending AI Job Queue Backlog',
          message: `Queue has ${data.pendingJobs} pending jobs waiting for worker pickup.`,
          recommendation: 'Verify that the in-process AiWorker is actively running and processing jobs.',
          evidence: { pendingJobs: data.pendingJobs, processingJobs: data.processingJobs }
        });
      }

      // 4. Deterministic Rule 3: Agent Execution Health
      if (data.recentFailedAgentRuns > 0) {
        findings.push({
          type: 'recent_agent_failures',
          severity: data.recentFailedAgentRuns > 3 ? 'HIGH' : 'LOW',
          entityType: 'system',
          entityId: 'agent_runs',
          title: `${data.recentFailedAgentRuns} Agent Run Failure(s) Recorded`,
          message: `${data.recentFailedAgentRuns} of recent ${data.agentRunsTotal} agent runs terminated with FAILED status.`,
          recommendation: 'Review Agent Runs execution logs and check tool validation errors.',
          evidence: { recentFailedAgentRuns: data.recentFailedAgentRuns, totalRuns: data.agentRunsTotal }
        });
      }

      // 5. Determine Overall System Health Status
      let overallStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';
      if (findings.some((f) => f.severity === 'CRITICAL')) {
        overallStatus = 'CRITICAL';
      } else if (findings.some((f) => f.severity === 'HIGH' || f.severity === 'MEDIUM')) {
        overallStatus = 'WARNING';
      }

      const bySeverity = {
        CRITICAL: findings.filter((f) => f.severity === 'CRITICAL').length,
        HIGH: findings.filter((f) => f.severity === 'HIGH').length,
        MEDIUM: findings.filter((f) => f.severity === 'MEDIUM').length,
        LOW: findings.filter((f) => f.severity === 'LOW').length,
        INFO: 0
      };

      const durationMs = Date.now() - startTime;
      const resultState: AgentRunState = {
        status: overallStatus,
        summary: {
          status: overallStatus,
          overview: `System Health evaluated: ${overallStatus}. Found ${findings.length} issue(s) across Database, AI Queue, and Agent subsystem.`,
          totalFindings: findings.length,
          bySeverity,
          metrics: {
            databaseStatus: data.databaseStatus,
            databaseLatencyMs: data.databaseLatencyMs,
            failedAiJobs: data.failedJobs,
            pendingAiJobs: data.pendingJobs,
            recentFailedAgentRuns: data.recentFailedAgentRuns,
            uptimeSeconds: data.uptimeSeconds,
            memoryUsageMb: data.memoryUsageMb
          }
        },
        findings,
        durationMs,
        dryRun: true
      };

      // 6. Persist to agent_runs
      await agentRunRepository.updateState(runId, resultState);
      await agentRunRepository.updateStatus(runId, 'COMPLETED');

      logger.info(
        { runId, overallStatus, findingsCount: findings.length },
        'System Health Agent completed successfully'
      );
      return resultState;
    } catch (err: any) {
      logger.error({ runId, error: err.message }, 'System Health Agent execution failed');
      await agentRunRepository.updateStatus(runId, 'FAILED', err.message || 'System health audit failed');
      throw err;
    }
  }
}

export const systemHealthAgent = new SystemHealthAgent();
