import { agentRegistry } from '../registry/AgentRegistry';
import { agentExecutionService } from './AgentExecutionService';
import { agentRunRepository } from '../repositories/AgentRunRepository';
import { AgentActor } from '../types/AgentContext';
import { AgentRun, AgentTriggerType } from '@models/AgentRun';
import { AgentRunState } from '../types/AgentDefinition';
import { AgentPermissionTier } from '../types/AgentPermissionTier';
import { AgentSecurityError } from '../types/errors';
import { NotFoundError } from '@/errors/appError';
import { logger } from '@utils/logger';

export interface RunAgentOptions {
  actor?: AgentActor;
  triggerType?: AgentTriggerType;
  inputParams?: Record<string, any>;
}

export interface AgentRunExecutionResult {
  run: AgentRun;
  state: AgentRunState;
}

export class AgentRunner {
  /**
   * Common, policy-enforced autonomous execution orchestrator.
   */
  public async run(agentId: string, options?: RunAgentOptions): Promise<AgentRunExecutionResult> {
    const startTime = Date.now();

    // 1. Validate agent exists in registry
    const agent = agentRegistry.get(agentId);
    if (!agent) {
      logger.warn({ agentId }, 'Attempted to run unregistered agent');
      throw new NotFoundError(`Agent '${agentId}' is not registered in the autonomous agent registry.`);
    }

    const definition = agent.definition;

    // 2. Policy Check: Autonomous Read/Analyze boundary (Phase 5A)
    if (
      definition.permissionTier !== AgentPermissionTier.TIER_1_READ &&
      definition.permissionTier !== AgentPermissionTier.TIER_2_ANALYZE
    ) {
      throw new AgentSecurityError(
        `Agent '${agentId}' exceeds Phase 5A autonomous safety boundary (${definition.permissionTier}). Only read/analyze agents permitted.`
      );
    }

    const actor = options?.actor || { type: 'ADMIN', id: 'admin' };
    const triggerType = options?.triggerType || 'MANUAL';

    // 3. Create AgentRun record (status: RUNNING)
    const run = await agentExecutionService.startRun({
      agentName: definition.id,
      triggerType,
      triggeredBy: actor.id,
      state: {
        agentDefinition: definition,
        inputParams: options?.inputParams || {}
      }
    });

    logger.info(
      { runId: run.id, agentId: definition.id, timeoutMs: definition.timeoutMs },
      'Autonomous agent execution initiated by runner'
    );

    // 4. Execute with timeout guard
    let timeoutHandle: NodeJS.Timeout | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutHandle = setTimeout(() => {
        reject(
          new Error(
            `Agent execution exceeded maximum allowed timeout of ${definition.timeoutMs}ms (Agent: ${definition.id})`
          )
        );
      }, definition.timeoutMs);
    });

    try {
      const executionPromise = agent.execute(run.id, options?.inputParams);
      const state = await Promise.race([executionPromise, timeoutPromise]);
      if (timeoutHandle) clearTimeout(timeoutHandle);

      // 5. Ensure completed state is saved
      const updatedRun = await agentRunRepository.findById(run.id);

      logger.info(
        {
          runId: run.id,
          agentId: definition.id,
          durationMs: Date.now() - startTime,
          findingsCount: state.findings?.length || 0
        },
        'Agent run completed successfully'
      );

      return {
        run: updatedRun || run,
        state
      };
    } catch (err: any) {
      if (timeoutHandle) clearTimeout(timeoutHandle);
      const errorMessage = err.message || 'Agent execution failed';
      logger.error({ runId: run.id, agentId: definition.id, err: errorMessage }, 'Agent run failed');

      await agentExecutionService.failRun(run.id, errorMessage);
      const failedRun = await agentRunRepository.findById(run.id);

      throw err;
    }
  }
}

export const agentRunner = new AgentRunner();
