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
      const entityType =
        proposalPayload.entityType ||
        (toolName.includes('bhajan')
          ? 'bhajan'
          : toolName.includes('festival')
            ? 'festival'
            : toolName.includes('puran')
              ? 'puran'
              : toolName.includes('category')
                ? 'category'
                : 'article');
      const targetField =
        proposalPayload.targetField ||
        (toolName.includes('seo') ? 'seo_metadata' : toolName.includes('meaning') ? 'meaning' : 'content');
      const entityId =
        proposalPayload.entityId || proposalPayload.bhajanId || proposalPayload.articleId || proposalPayload.id;

      let proposedValue =
        proposalPayload.proposedValue ||
        proposalPayload.proposedContent ||
        proposalPayload.proposedMeaning ||
        proposalPayload.meaning;

      if (!proposedValue) {
        if (targetField === 'seo_title' && proposalPayload.seoTitle) {
          proposedValue = proposalPayload.seoTitle;
        } else if (targetField === 'seo_description' && proposalPayload.seoDescription) {
          proposedValue = proposalPayload.seoDescription;
        } else if (targetField === 'seo_metadata' && (proposalPayload.seoTitle || proposalPayload.seoDescription)) {
          proposedValue = JSON.stringify({
            seoTitle: proposalPayload.seoTitle || '',
            seoDescription: proposalPayload.seoDescription || ''
          });
        } else {
          proposedValue = JSON.stringify(proposalPayload);
        }
      }

      const proposal = await agentProposalRepository.create({
        runId: context.runId,
        agentName: context.agentName,
        entityType,
        entityId,
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

  /**
   * Safe, typed execution boundary for executing approved human-reviewed proposals.
   * Required architecture:
   *   Admin Execute Request -> AgentProposalService -> ToolGateway -> typed execution tool -> DomainService -> Repository -> Database
   *
   * Enforces:
   * 1. Sacred Content Firewall: strictly forbids mutating lyrics, shlokas, titles, deities, or categories.
   * 2. Target Field Semantics: only targetField === 'meaning' is permitted for Bhajans in Phase 4A.
   * 3. Tool registry lookup: dispatches to registered typed execution tools (apply_bhajan_meaning).
   * 4. Schema validation on the immutable proposal payload.
   * 5. Audit logging to agent_tool_calls under TIER_5_PUBLISH_OVERWRITE.
   */
  public async executeApprovedProposal(
    proposal: {
      id: string;
      runId?: string;
      agentName: string;
      entityType: string;
      entityId: string;
      targetField: string;
      proposedValue: string;
    },
    executedBy: string
  ): Promise<AgentToolResult<any>> {
    const startTime = Date.now();
    const runId = proposal.runId || '00000000-0000-0000-0000-000000000000';

    // 1. Sacred Content Firewall: Check target field allowlist
    const ALLOWED_TARGET_FIELDS = [
      'meaning',
      'seo_title',
      'seo_description',
      'seo_metadata',
      'content',
      'excerpt',
      'content_en',
      'excerpt_en',
      'short_description',
      'description',
      'description_en'
    ];
    if (!ALLOWED_TARGET_FIELDS.includes(proposal.targetField)) {
      const durationMs = Date.now() - startTime;
      if (proposal.runId) {
        await agentToolCallRepository
          .create({
            runId: proposal.runId,
            toolName: 'execute_approved_proposal',
            permissionTier: AgentPermissionTier.TIER_5_PUBLISH_OVERWRITE,
            inputPayload: { proposalId: proposal.id, targetField: proposal.targetField },
            durationMs,
            status: 'BLOCKED',
            errorMessage: `Sacred Content Firewall: Target field '${proposal.targetField}' is outside approved allowlist.`
          })
          .catch(() => {});
      }
      logger.warn(
        { proposalId: proposal.id, targetField: proposal.targetField },
        'Security alert: Sacred Content Firewall blocked execution on unauthorized target field'
      );
      throw new AgentSecurityError(
        `Sacred Content Firewall: Target field '${proposal.targetField}' is forbidden. Target field is outside the approved allowlist.`
      );
    }

    // 2. Validate entityType
    const ALLOWED_ENTITY_TYPES = ['bhajan', 'article', 'festival', 'puran', 'category'];
    if (!ALLOWED_ENTITY_TYPES.includes(proposal.entityType)) {
      throw new AgentSecurityError(`Execution for entity type '${proposal.entityType}' is not supported`);
    }

    // Specific field permissions per entity type
    if (proposal.targetField === 'meaning' && proposal.entityType !== 'bhajan') {
      throw new AgentSecurityError(
        `Sacred Content Firewall: Target field 'meaning' is only supported for entity type 'bhajan'`
      );
    }
    if (
      ['content', 'content_en'].includes(proposal.targetField) &&
      !['article', 'festival'].includes(proposal.entityType)
    ) {
      throw new AgentSecurityError(
        `Sacred Content Firewall: Target field '${proposal.targetField}' is only supported for 'article' and 'festival'`
      );
    }
    if (['excerpt', 'excerpt_en'].includes(proposal.targetField) && proposal.entityType !== 'article') {
      throw new AgentSecurityError(
        `Sacred Content Firewall: Target field '${proposal.targetField}' is only supported for entity type 'article'`
      );
    }
    if (proposal.targetField === 'description' && proposal.entityType !== 'bhajan') {
      throw new AgentSecurityError(
        `Sacred Content Firewall: Target field 'description' is only supported for entity type 'bhajan'`
      );
    }
    if (proposal.targetField === 'description_en' && proposal.entityType !== 'puran') {
      throw new AgentSecurityError(
        `Sacred Content Firewall: Target field 'description_en' is only supported for entity type 'puran'`
      );
    }
    if (
      proposal.targetField === 'short_description' &&
      !['festival', 'puran', 'bhajan'].includes(proposal.entityType)
    ) {
      throw new AgentSecurityError(
        `Sacred Content Firewall: Target field 'short_description' is only supported for 'festival', 'puran', and 'bhajan'`
      );
    }

    // 3. Sacred Content Firewall: Check proposed content for forbidden lyrics leakage
    const rawProposed =
      typeof proposal.proposedValue === 'string' ? proposal.proposedValue : JSON.stringify(proposal.proposedValue);
    if (rawProposed.includes('"lyrics"') || rawProposed.includes('"clean_lyrics"')) {
      throw new AgentSecurityError('Sacred Content Firewall: Proposal content contains forbidden lyrics references.');
    }

    // 4. Resolve registered execution tool and construct typed input
    let toolName: string;
    let rawInput: any;

    if (proposal.targetField === 'meaning') {
      toolName = 'apply_bhajan_meaning';
      rawInput = {
        proposalId: proposal.id,
        bhajanId: proposal.entityId,
        meaning: proposal.proposedValue,
        targetField: 'meaning'
      };
    } else if (['seo_title', 'seo_description', 'seo_metadata'].includes(proposal.targetField)) {
      // SEO Metadata tools
      const toolMap: Record<string, string> = {
        bhajan: 'apply_bhajan_seo_metadata',
        article: 'apply_article_seo_metadata',
        festival: 'apply_festival_seo_metadata',
        puran: 'apply_puran_seo_metadata',
        category: 'apply_category_seo_metadata'
      };

      toolName = toolMap[proposal.entityType];
      if (!toolName) {
        throw new AgentSecurityError(`No execution tool registered for entity type '${proposal.entityType}'`);
      }

      let seoTitle: string | undefined;
      let seoDescription: string | undefined;

      if (proposal.targetField === 'seo_title') {
        seoTitle = typeof proposal.proposedValue === 'string' ? proposal.proposedValue : undefined;
      } else if (proposal.targetField === 'seo_description') {
        seoDescription = typeof proposal.proposedValue === 'string' ? proposal.proposedValue : undefined;
      } else if (proposal.targetField === 'seo_metadata') {
        try {
          const parsed =
            typeof proposal.proposedValue === 'string' ? JSON.parse(proposal.proposedValue) : proposal.proposedValue;
          seoTitle = parsed.seoTitle;
          seoDescription = parsed.seoDescription;
        } catch {
          // Fallback if not valid JSON
        }
      }

      rawInput = {
        proposalId: proposal.id,
        entityId: proposal.entityId,
        seoTitle,
        seoDescription,
        targetField: proposal.targetField
      };
    } else if (
      ['content', 'excerpt', 'content_en', 'excerpt_en'].includes(proposal.targetField) &&
      proposal.entityType === 'article'
    ) {
      toolName = 'apply_article_content_field';
      rawInput = {
        proposalId: proposal.id,
        entityId: proposal.entityId,
        targetField: proposal.targetField,
        content: proposal.proposedValue
      };
    } else if (
      ['content', 'short_description', 'content_en', 'short_description_en'].includes(proposal.targetField) &&
      proposal.entityType === 'festival'
    ) {
      toolName = 'apply_festival_content_field';
      rawInput = {
        proposalId: proposal.id,
        entityId: proposal.entityId,
        targetField: proposal.targetField,
        content: proposal.proposedValue
      };
    } else if (
      ['short_description', 'description_en'].includes(proposal.targetField) &&
      proposal.entityType === 'puran'
    ) {
      toolName = 'apply_puran_description';
      rawInput = {
        proposalId: proposal.id,
        entityId: proposal.entityId,
        targetField: proposal.targetField,
        content: proposal.proposedValue
      };
    } else if (
      ['description', 'short_description'].includes(proposal.targetField) &&
      proposal.entityType === 'bhajan'
    ) {
      toolName = 'apply_bhajan_description';
      rawInput = {
        proposalId: proposal.id,
        entityId: proposal.entityId,
        targetField: proposal.targetField,
        content: proposal.proposedValue
      };
    } else {
      throw new AgentSecurityError(
        `No execution tool registered for entity type '${proposal.entityType}' and target field '${proposal.targetField}'`
      );
    }

    const tool = toolRegistry.get(toolName);
    if (!tool) {
      throw new ToolNotFoundError(toolName);
    }

    // 5. Schema validation via tool input schema
    const parseResult = tool.inputSchema.safeParse(rawInput);
    if (!parseResult.success) {
      const durationMs = Date.now() - startTime;

      const validationErrors = parseResult.error.format();
      if (proposal.runId) {
        await agentToolCallRepository
          .create({
            runId: proposal.runId,
            toolName,
            permissionTier: tool.permission,
            inputPayload: rawInput,
            durationMs,
            status: 'FAILED',
            errorMessage: 'Input schema validation failed on proposal execution'
          })
          .catch(() => {});
      }
      throw new ToolValidationError(`Validation failed for tool '${toolName}'`, validationErrors);
    }

    const validatedInput = parseResult.data;

    // 6. Execute through the registered tool handler -> Domain Service (BhajanService)
    try {
      const output = await tool.handler(validatedInput, {
        runId,
        agentName: 'ProposalExecutionEngine',
        actor: { type: 'ADMIN', id: executedBy },
        currentIteration: 1,
        maxIterations: 5,
        tokensUsed: 0,
        tokenBudget: 100000
      });

      const durationMs = Date.now() - startTime;

      if (proposal.runId) {
        await agentToolCallRepository
          .create({
            runId: proposal.runId,
            toolName,
            permissionTier: tool.permission,
            inputPayload: validatedInput,
            outputPayload: (output as any) || {},
            durationMs,
            status: 'SUCCESS'
          })
          .catch(() => {});
      }

      logger.info(
        { toolName, proposalId: proposal.id, executedBy, durationMs },
        'Approved proposal executed successfully through ToolGateway'
      );

      return {
        success: true,
        data: output
      };
    } catch (error: any) {
      const durationMs = Date.now() - startTime;
      if (proposal.runId) {
        await agentToolCallRepository
          .create({
            runId: proposal.runId,
            toolName,
            permissionTier: tool.permission,
            inputPayload: validatedInput,
            durationMs,
            status: 'FAILED',
            errorMessage: error.message || 'Execution error'
          })
          .catch(() => {});
      }
      logger.error({ toolName, proposalId: proposal.id, error: error.message }, 'Error executing approved proposal');
      throw error;
    }
  }
}

export const toolGateway = new ToolGateway();
