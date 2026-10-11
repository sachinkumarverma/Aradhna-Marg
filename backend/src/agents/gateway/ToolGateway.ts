import { toolRegistry } from '../registry/ToolRegistry';
import { AgentContext } from '../types/AgentContext';
import { AgentToolResult } from '../types/ToolContract';
import { AgentPermissionTier, isForbiddenAutonomously } from '../types/AgentPermissionTier';
import { ToolNotFoundError, ToolValidationError, AgentSecurityError, AgentIterationLimitError } from '../types/errors';
import { agentToolCallRepository } from '../repositories/AgentToolCallRepository';
import { agentProposalRepository } from '../repositories/AgentProposalRepository';
import { agentRunRepository } from '../repositories/AgentRunRepository';
import { logger } from '@utils/logger';

export class ToolGateway {
  /**
   * Safe, typed, audited execution boundary for any agent tool invocation.
   */
  public async executeTool<TInput = any, TOutput = any>(
    toolName: string,
    rawInput: TInput,
    context: AgentContext
  ): Promise<AgentToolResult<TOutput>> {
    const startTime = Date.now();

    // 1. Loop iteration limit guardrail
    if (context.currentIteration >= context.maxIterations) {
      throw new AgentIterationLimitError(context.agentName, context.maxIterations);
    }

    // 2. Tool discovery
    const tool = toolRegistry.get(toolName);
    if (!tool) {
      logger.error({ toolName, runId: context.runId }, 'Agent invoked unregistered tool');
      throw new ToolNotFoundError(toolName);
    }

    // 3. Security Boundary: Tier 6 Destructive checks
    if (isForbiddenAutonomously(tool.permission)) {
      const durationMs = Date.now() - startTime;
      await agentToolCallRepository.create({
        runId: context.runId,
        toolName,
        permissionTier: tool.permission,
        inputPayload: (rawInput as any) || {},
        durationMs,
        status: 'BLOCKED',
        errorMessage: 'Blocked: Tier 6 destructive operation is forbidden autonomously.'
      });
      logger.warn(
        { toolName, agentName: context.agentName, runId: context.runId },
        'Security alert: Agent attempted Tier 6 destructive tool'
      );
      throw new AgentSecurityError(
        `Execution of tool '${toolName}' is forbidden autonomously under Tier 6 governance rules.`
      );
    }

    // 4. Sacred Content Guardrail: Bhajan lyrics / Shlokas can NEVER be altered or translated by AI
    const rawString = JSON.stringify(rawInput || {});
    if (
      (toolName.includes('lyrics') && !toolName.startsWith('get_')) ||
      rawString.includes('"lyrics"') ||
      rawString.includes('"clean_lyrics"')
    ) {
      const durationMs = Date.now() - startTime;
      await agentToolCallRepository.create({
        runId: context.runId,
        toolName,
        permissionTier: tool.permission,
        inputPayload: (rawInput as any) || {},
        durationMs,
        status: 'BLOCKED',
        errorMessage: 'Blocked: Modifying or translating sacred devotional lyrics is strictly forbidden.'
      });
      logger.warn(
        { toolName, agentName: context.agentName, runId: context.runId },
        'Security alert: Agent attempted to alter or translate sacred Bhajan lyrics'
      );
      throw new AgentSecurityError(
        'Autonomous modification or translation of Bhajan lyrics is strictly forbidden by platform constitution.'
      );
    }

    // 5. Input Validation via Zod schema
    const parseResult = tool.inputSchema.safeParse(rawInput);
    if (!parseResult.success) {
      const durationMs = Date.now() - startTime;
      const validationErrors = parseResult.error.format();
      await agentToolCallRepository.create({
        runId: context.runId,
        toolName,
        permissionTier: tool.permission,
        inputPayload: (rawInput as any) || {},
        durationMs,
        status: 'FAILED',
        errorMessage: 'Input schema validation failed'
      });
      logger.warn({ toolName, validationErrors }, 'Agent tool input validation failed');
      throw new ToolValidationError(`Validation failed for tool '${toolName}'`, validationErrors);
    }

    const validatedInput = parseResult.data;

    // 6. Human Approval & Proposal Staging Boundary
    // If the tool requires approval or generates proposals (Tier 3 / Tier 5), stage into agent_proposals
    if (tool.requiresApproval || tool.permission === AgentPermissionTier.TIER_5_PUBLISH_OVERWRITE) {
      const durationMs = Date.now() - startTime;
      const proposalPayload = validatedInput as any;
      const entityType = proposalPayload.entityType || (toolName.includes('bhajan') ? 'bhajan' : 'article');
      const targetField = proposalPayload.targetField || (toolName.includes('meaning') ? 'meaning' : 'content');
      const proposedValue =
        proposalPayload.proposedValue || proposalPayload.proposedMeaning || JSON.stringify(proposalPayload);

      const proposal = await agentProposalRepository.create({
        runId: context.runId,
        agentName: context.agentName,
        entityType,
        entityId: proposalPayload.entityId,
        targetField,
        currentValue: proposalPayload.currentValue,
        proposedValue,
        reasoning: proposalPayload.reasoning || 'Automated agent proposal'
      });

      await agentToolCallRepository.create({
        runId: context.runId,
        toolName,
        permissionTier: tool.permission,
        inputPayload: validatedInput,
        outputPayload: { proposalId: proposal.id, status: 'PROPOSAL_STAGED' },
        durationMs,
        status: 'PROPOSAL_STAGED'
      });

      context.currentIteration += 1;
      await agentRunRepository.incrementIteration(context.runId);

      logger.info(
        { toolName, proposalId: proposal.id, agentName: context.agentName },
        'Agent staged proposal for human approval'
      );

      return {
        success: true,
        isProposalStaged: true,
        proposalId: proposal.id,
        message: `Action requires human approval. Staged in agent_proposals with ID: ${proposal.id}`
      };
    }

    // 7. Safe Autonomous Execution through Backend Services
    try {
      const output = await tool.handler(validatedInput, context);
      const durationMs = Date.now() - startTime;

      // Validate Output schema
      const outputParse = tool.outputSchema.safeParse(output);
      const finalOutput = outputParse.success ? outputParse.data : output;

      await agentToolCallRepository.create({
        runId: context.runId,
        toolName,
        permissionTier: tool.permission,
        inputPayload: validatedInput,
        outputPayload: (finalOutput as any) || {},
        durationMs,
        status: 'SUCCESS'
      });

      context.currentIteration += 1;
      await agentRunRepository.incrementIteration(context.runId);

      return {
        success: true,
        data: finalOutput
      };
    } catch (error: any) {
      const durationMs = Date.now() - startTime;
      await agentToolCallRepository.create({
        runId: context.runId,
        toolName,
        permissionTier: tool.permission,
        inputPayload: validatedInput,
        durationMs,
        status: 'FAILED',
        errorMessage: error.message || 'Execution error'
      });

      logger.error({ toolName, error: error.message, runId: context.runId }, 'Error executing agent tool');
      return {
        success: false,
        error: error.message || 'Unknown tool execution error'
      };
    }
  }
}

export const toolGateway = new ToolGateway();
