import { AgentContext, AgentStepEvaluation } from '../types/AgentContext';
import { AgentToolResult } from '../types/ToolContract';
import { ContentSafetyValidator } from '../utils/ContentSafetyValidator';
import { logger } from '@utils/logger';

export class StepEvaluator {
  /**
   * Evaluates the outcome of a step execution against safety rules and objective requirements.
   */
  public static evaluateStep(
    context: AgentContext,
    toolName: string,
    toolResult: AgentToolResult<any>,
    inputPayload: any
  ): AgentStepEvaluation {
    // 1. Tool execution failure check
    if (!toolResult.success) {
      return {
        status: 'FAILURE',
        reason: toolResult.error || `Tool '${toolName}' execution returned failure.`,
        canContinue: false,
        safetyPassed: true
      };
    }

    // 2. Long-form content improvement safety check (always checked first)
    if (
      (toolName === 'propose_article_content_improvement' ||
        toolName === 'propose_festival_content_improvement' ||
        toolName.includes('content_improvement')) &&
      inputPayload?.proposedContent
    ) {
      const original = inputPayload.currentValue || '';
      const proposed = inputPayload.proposedContent || '';
      const validation = ContentSafetyValidator.validateContentImprovement({
        entityType: inputPayload.entityType || 'article',
        targetField: inputPayload.targetField || 'content',
        originalContent: original,
        proposedContent: proposed
      });

      if (!validation.isValid) {
        logger.warn(
          { toolName, runId: context.runId, reason: validation.reason },
          'Step evaluation detected safety validation violation'
        );
        return {
          status: 'SAFETY_VIOLATION',
          reason: validation.reason || 'Content improvement failed safety validation.',
          canContinue: false,
          safetyPassed: false,
          metrics: {
            originalMetrics: validation.originalMetrics,
            proposedMetrics: validation.proposedMetrics
          }
        };
      }
    }

    // 3. Proposal generation evaluation
    if (toolName.startsWith('propose_') || toolResult.isProposalStaged) {
      const proposalId = toolResult.proposalId;
      if (proposalId) {
        if (!context.proposalIds) context.proposalIds = [];
        if (!context.proposalIds.includes(proposalId)) {
          context.proposalIds.push(proposalId);
        }
      }

      return {
        status: 'OBJECTIVE_SATISFIED',
        reason: `Proposal successfully staged with ID '${proposalId || 'staged'}'. Human review required before execution.`,
        canContinue: true,
        safetyPassed: true,
        metrics: { proposalId }
      };
    }

    // 6. Generic success fallback
    return {
      status: 'SUCCESS',
      reason: `Tool '${toolName}' executed cleanly.`,
      canContinue: true,
      safetyPassed: true
    };
  }
}
