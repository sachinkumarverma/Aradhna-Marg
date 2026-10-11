import { toolGateway } from '../gateway/ToolGateway';
import '../tools';
import { AgentPermissionTier } from '../types/AgentPermissionTier';
import { AgentContext } from '../types/AgentContext';
import { agentRunRepository } from '../repositories/AgentRunRepository';
import { getAiProvider } from '@admin/services/ai/AiProvider';
import { AiPrompts } from '@admin/services/ai/AiPrompts';
import { ContentSafetyValidator } from '../utils/ContentSafetyValidator';
import { logger } from '@utils/logger';

export interface ContentImprovementAgentOptions {
  entityType: 'article' | 'festival' | 'puran' | 'bhajan';
  entityId: string;
  targetField: string;
  proposedContent?: string;
  reasoning?: string;
}

export class ContentImprovementAgent {
  public readonly agentName = 'ContentImprovementAgent';
  public readonly permission = AgentPermissionTier.TIER_3_PROPOSE;

  /**
   * Generates a content quality improvement proposal for supported website entities.
   * SAFETY CONSTITUTION & SACRED FIREWALL:
   * 1. Agent runs under TIER_3_PROPOSE — CANNOT autonomously mutate or publish content.
   * 2. Sacred verses, lyrics, and titles are strictly read-only and NEVER modified.
   * 3. YouTube records are strictly excluded from content improvement workflows.
   * 4. Output is staged into agent_proposals as PENDING for human administrator approval.
   */
  public async execute(
    runId: string,
    options: ContentImprovementAgentOptions
  ): Promise<{ runId: string; proposalId: string; status: string; entityType: string; targetField: string }> {
    logger.info(
      { runId, entityType: options.entityType, entityId: options.entityId, targetField: options.targetField },
      'Starting Content Improvement Agent execution'
    );

    // 1. YouTube & Sacred Content Firewall validation
    const normalizedType = options.entityType?.toLowerCase?.();
    if (['youtube', 'youtube_video', 'youtube_videos'].includes(normalizedType as string)) {
      throw new Error(
        'SEO/Content Improvement Scope: YouTube records are excluded from content improvement workflows.'
      );
    }

    const ALLOWED_ENTITY_TYPES = ['article', 'festival', 'puran', 'bhajan'];
    if (!ALLOWED_ENTITY_TYPES.includes(normalizedType)) {
      throw new Error(`Content improvement is not supported for entity type '${options.entityType}'`);
    }

    // Sacred Content Firewall: Check field allowlist per entity
    const ENTITY_FIELD_ALLOWLIST: Record<string, string[]> = {
      article: ['content', 'excerpt', 'content_en', 'excerpt_en'],
      festival: ['content', 'short_description', 'content_en', 'short_description_en'],
      puran: ['short_description', 'description_en'],
      bhajan: ['description', 'short_description']
    };

    const allowedFields = ENTITY_FIELD_ALLOWLIST[normalizedType] || [];
    if (!allowedFields.includes(options.targetField)) {
      throw new Error(
        `Sacred Content Firewall: Field '${options.targetField}' is not allowed for content improvement on entity type '${normalizedType}'. Allowed fields: ${allowedFields.join(', ')}`
      );
    }

    const context: AgentContext = {
      runId,
      agentName: this.agentName,
      actor: { type: 'SYSTEM', id: 'content_improvement_agent' },
      currentIteration: 0,
      maxIterations: 30,
      tokensUsed: 0,
      tokenBudget: 50000
    };

    try {
      // 2. Fetch target entity via ToolGateway (reads via domain services)
      const contentResult = await toolGateway.executeTool(
        'get_content_item',
        { entityType: normalizedType, id: options.entityId },
        context
      );

      if (!contentResult.success || !contentResult.data) {
        throw new Error(contentResult.error || `${normalizedType} with ID ${options.entityId} not found`);
      }

      const item = contentResult.data?.data || contentResult.data;
      const title = item.title || item.name || 'Untitled';
      const currentFieldValue = (item[options.targetField] || '').trim();

      // 3. Generate content quality improvement via AI provider or use override
      let generatedContent = options.proposedContent;
      if (!generatedContent) {
        const provider = getAiProvider();
        const promptPayload = AiPrompts.contentQualityImprovement({
          entityType: normalizedType,
          field: options.targetField,
          title,
          currentContent: currentFieldValue
        });
        generatedContent = await provider.generateCompletion(promptPayload);
      }

      // 4. Output Validation: Enforce substantive preservation and retention thresholds
      const validation = ContentSafetyValidator.validateContentImprovement({
        entityType: normalizedType,
        targetField: options.targetField,
        originalContent: currentFieldValue,
        proposedContent: generatedContent
      });

      if (!validation.isValid) {
        logger.warn(
          {
            runId,
            entityType: normalizedType,
            targetField: options.targetField,
            reason: validation.reason,
            originalMetrics: validation.originalMetrics,
            proposedMetrics: validation.proposedMetrics
          },
          'Content improvement rejected by safety validator'
        );
        throw new Error(`Content improvement safety validation failed: ${validation.reason}`);
      }

      const reasoning =
        options.reasoning ||
        `Content quality and devotional readability improved for ${normalizedType} "${title}" (field: ${options.targetField}).`;

      // 4. Resolve proposal tool based on entity type
      const PROPOSAL_TOOL_MAP: Record<string, string> = {
        article: 'propose_article_content_improvement',
        festival: 'propose_festival_content_improvement',
        puran: 'propose_puran_description_improvement',
        bhajan: 'propose_bhajan_description_improvement'
      };

      const proposalToolName = PROPOSAL_TOOL_MAP[normalizedType];
      if (!proposalToolName) {
        throw new Error(`No proposal tool registered for entity type '${normalizedType}'`);
      }

      // 5. Stage proposal through ToolGateway boundary into agent_proposals
      const toolResult = await toolGateway.executeTool(
        proposalToolName,
        {
          entityId: item.id,
          targetField: options.targetField,
          proposedContent: generatedContent.trim(),
          currentValue: currentFieldValue,
          reasoning
        },
        context
      );

      if (!toolResult.success && !toolResult.isProposalStaged) {
        throw new Error(toolResult.error || `Failed to stage content improvement proposal for ${normalizedType}`);
      }

      // 6. Complete agent run
      await agentRunRepository.updateState(runId, {
        summary: `Successfully staged content quality improvement proposal for ${normalizedType} "${title}" (${options.targetField})`,
        proposalId: toolResult.proposalId,
        entityType: normalizedType,
        targetField: options.targetField
      });
      await agentRunRepository.updateStatus(runId, 'COMPLETED');

      logger.info(
        { runId, proposalId: toolResult.proposalId, entityType: normalizedType },
        'Content Improvement Agent executed and proposal staged'
      );

      return {
        runId,
        proposalId: toolResult.proposalId!,
        status: 'PROPOSAL_STAGED',
        entityType: normalizedType,
        targetField: options.targetField
      };
    } catch (error: any) {
      logger.error({ runId, error: error.message }, 'Content Improvement Agent execution failed');
      await agentRunRepository.updateStatus(runId, 'FAILED', error.message || 'Execution failed');
      throw error;
    }
  }
}

export const contentImprovementAgent = new ContentImprovementAgent();
