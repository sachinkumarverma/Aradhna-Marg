import { toolRegistry } from '../registry/ToolRegistry';
import { agentRegistry } from '../registry/AgentRegistry';
import { toolGateway } from '../gateway/ToolGateway';
import { AgentContext, AgentStepRecord, AgentStepEvaluation, AgentPlanStep } from '../types/AgentContext';
import { AgentToolResult } from '../types/ToolContract';
import { AgentPermissionTier, isForbiddenAutonomously } from '../types/AgentPermissionTier';
import {
  ToolNotFoundError,
  AgentSecurityError,
  AgentIterationLimitError,
  AgentToolLimitError,
  AgentTimeoutError,
  AgentRecursionError,
  AgentLoopDetectedError
} from '../types/errors';
import { AgentMemoryManager } from './AgentMemoryManager';
import { StepEvaluator } from './StepEvaluator';
import { agentRunRepository } from '../repositories/AgentRunRepository';
import { logger } from '@utils/logger';

export interface OrchestrationStepDefinition {
  stepNumber: number;
  description: string;
  toolName: string;
  payload: any;
  optional?: boolean;
}

export class MultiStepOrchestrator {
  private static activeRuns = new Set<string>();
  private static activeAgentStacks = new Set<string>();

  /**
   * Guards against recursive agent execution or self-spawning loops.
   */
  public static enterExecution(runId: string, agentName: string): void {
    if (this.activeRuns.has(runId)) {
      throw new AgentRecursionError(agentName, `Re-entrant execution attempt detected for active runId '${runId}'.`);
    }
    if (this.activeAgentStacks.has(agentName)) {
      throw new AgentRecursionError(
        agentName,
        `Agent '${agentName}' is already actively executing in current call stack. Recursive invocation prohibited.`
      );
    }

    this.activeRuns.add(runId);
    this.activeAgentStacks.add(agentName);
  }

  /**
   * Releases active execution lock.
   */
  public static exitExecution(runId: string, agentName: string): void {
    this.activeRuns.delete(runId);
    this.activeAgentStacks.delete(agentName);
  }

  /**
   * Server-enforced validation of tool selection against agent policy and resource constraints.
   */
  public static validateToolSelection(context: AgentContext, toolName: string, inputPayload: any): void {
    const startTime = context.startTime ?? Date.now();
    const timeoutMs = context.constraints?.timeoutMs ?? context.timeoutMs ?? 45000;

    // 1. Hard Timeout Check
    if (Date.now() - startTime > timeoutMs) {
      context.status = 'TIMEOUT';
      context.terminationReason = `Execution exceeded hard timeout limit of ${timeoutMs}ms.`;
      throw new AgentTimeoutError(context.agentName, timeoutMs);
    }

    // 2. Hard Iteration Limit Check
    const currentIter = context.currentIteration ?? 0;
    const maxIter = context.constraints?.maxIterations ?? context.maxIterations ?? 25;
    if (currentIter >= maxIter) {
      context.status = 'FAILED';
      context.terminationReason = `Exceeded maximum iteration limit of ${maxIter}.`;
      throw new AgentIterationLimitError(context.agentName, maxIter);
    }

    // 3. Hard Tool Calls Budget Check
    const currentToolCalls = context.toolCallsCount ?? 0;
    const maxToolCalls = context.constraints?.maxToolCalls ?? context.maxToolCalls ?? 20;
    if (currentToolCalls >= maxToolCalls) {
      context.status = 'FAILED';
      context.terminationReason = `Exceeded maximum tool calls limit of ${maxToolCalls}.`;
      throw new AgentToolLimitError(context.agentName, maxToolCalls);
    }

    // 4. Tool Registry Existence
    const tool = toolRegistry.get(toolName);
    if (!tool) {
      throw new ToolNotFoundError(toolName);
    }

    // 5. Tier-5 and Tier-6 Autonomous Execution Firewall (Globally forbidden autonomously)
    if (tool.permission === AgentPermissionTier.TIER_5_PUBLISH_OVERWRITE) {
      throw new AgentSecurityError(
        `Autonomous execution of Tier-5 tool '${toolName}' is strictly prohibited. Tier-5 operations require explicit human approval and execution.`
      );
    }

    if (isForbiddenAutonomously(tool.permission)) {
      throw new AgentSecurityError(`Execution of Tier-6 destructive tool '${toolName}' is forbidden autonomously.`);
    }

    // 6. Agent Allowed Tools Policy
    const agentDef = agentRegistry.getDefinition(context.agentName);
    const allowedTools = context.constraints?.allowedTools ?? agentDef?.allowedTools ?? [];

    if (!allowedTools.includes(toolName)) {
      throw new AgentSecurityError(
        `Tool '${toolName}' is not in the allowedTools policy for agent '${context.agentName}'.`
      );
    }

    // 7. Dry-Run Policy Guard
    const dryRunOnly = context.constraints?.dryRunOnly ?? agentDef?.dryRunOnly ?? false;
    if (
      dryRunOnly &&
      tool.permission !== AgentPermissionTier.TIER_1_READ &&
      tool.permission !== AgentPermissionTier.TIER_2_ANALYZE
    ) {
      throw new AgentSecurityError(
        `Agent '${context.agentName}' is configured as dryRunOnly and cannot invoke mutation or proposal tool '${toolName}'.`
      );
    }

    // 8. Deterministic Loop & Cycle Detection
    AgentMemoryManager.checkLoopProtection(context, toolName, inputPayload);
  }

  /**
   * Executes a single orchestrated step through the ToolGateway with full audit,
   * evaluation, and memory recording.
   */
  public static async executeStep<T = any>(
    context: AgentContext,
    toolName: string,
    inputPayload: any
  ): Promise<{ result: AgentToolResult<T>; evaluation: AgentStepEvaluation }> {
    const stepStart = Date.now();

    // 1. Server-side tool validation and loop protection
    this.validateToolSelection(context, toolName, inputPayload);

    try {
      // 2. Authoritative ToolGateway execution
      const result = await toolGateway.executeTool<any, T>(toolName, inputPayload, context);

      const durationMs = Date.now() - stepStart;

      // 3. Step evaluation
      const evaluation = StepEvaluator.evaluateStep(context, toolName, result, inputPayload);

      // 4. Memory recording
      AgentMemoryManager.recordStep(context, {
        toolName,
        inputPayload,
        outputPayload: result.data,
        status: result.success ? 'SUCCESS' : 'FAILED',
        durationMs,
        evaluation
      });

      logger.info(
        {
          runId: context.runId,
          agentName: context.agentName,
          stepNumber: context.currentStep,
          toolName,
          evaluationStatus: evaluation.status
        },
        'Orchestration step executed and evaluated'
      );

      return { result, evaluation };
    } catch (err: any) {
      const durationMs = Date.now() - stepStart;

      // Record failed step in memory
      AgentMemoryManager.recordStep(context, {
        toolName,
        inputPayload,
        outputPayload: { error: err.message },
        status: 'FAILED',
        durationMs,
        evaluation: {
          status: 'FAILURE',
          reason: err.message,
          canContinue: false,
          safetyPassed: false
        }
      });

      throw err;
    }
  }

  /**
   * Executes an orchestrated sequence of planned steps, failing closed if any
   * required step fails or violates safety constraints.
   */
  public static async executePlan(
    context: AgentContext,
    steps: OrchestrationStepDefinition[]
  ): Promise<{
    completedSteps: number;
    totalSteps: number;
    results: any[];
    context: AgentContext;
  }> {
    this.enterExecution(context.runId, context.agentName);

    // Initialize plan in memory
    const planSteps: AgentPlanStep[] = steps.map((s) => ({
      stepNumber: s.stepNumber,
      description: s.description,
      expectedTool: s.toolName,
      status: 'PENDING'
    }));
    AgentMemoryManager.setPlan(context, planSteps);

    const results: any[] = [];
    let completedSteps = 0;

    try {
      for (const step of steps) {
        // Mark step running
        if (context.memory?.plan[step.stepNumber - 1]) {
          context.memory.plan[step.stepNumber - 1].status = 'RUNNING';
        }

        const { result, evaluation } = await this.executeStep(context, step.toolName, step.payload);

        results.push(result.data);
        completedSteps++;

        if (context.memory?.plan[step.stepNumber - 1]) {
          context.memory.plan[step.stepNumber - 1].status = 'COMPLETED';
        }

        // If step failed and was not marked optional, abort remaining steps
        if (!evaluation.canContinue && !step.optional) {
          logger.warn(
            {
              runId: context.runId,
              agentName: context.agentName,
              stepNumber: step.stepNumber,
              reason: evaluation.reason
            },
            'Plan execution aborted due to step evaluation failure'
          );
          break;
        }
      }

      context.status = 'COMPLETED';
      return {
        completedSteps,
        totalSteps: steps.length,
        results,
        context
      };
    } finally {
      this.exitExecution(context.runId, context.agentName);
    }
  }
}
