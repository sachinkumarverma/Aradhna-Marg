import { toolGateway } from '../gateway/ToolGateway';
import '../tools';
import { AgentPermissionTier } from '../types/AgentPermissionTier';
import { AgentDefinition, AutonomousAgent } from '../types/AgentDefinition';
import { AgentContext } from '../types/AgentContext';
import { agentRunRepository } from '../repositories/AgentRunRepository';
import { getAiProvider } from '@admin/services/ai/AiProvider';
import { AiPrompts } from '@admin/services/ai/AiPrompts';
import { logger } from '@utils/logger';

export interface SeoImprovementAgentOptions {
  entityType: 'bhajan' | 'article' | 'festival' | 'puran' | 'category';
  entityId: string;
  targetField?: 'seo_title' | 'seo_description' | 'seo_metadata';
  proposedTitle?: string;
  proposedDescription?: string;
  reasoning?: string;
  auditIssue?: string;
}

export class SeoImprovementAgent implements AutonomousAgent {
  public readonly agentName = 'SeoImprovementAgent';
  public readonly permission = AgentPermissionTier.TIER_3_PROPOSE;

  public readonly definition: AgentDefinition = {
    id: 'seo_improvement_agent',
    name: 'SEO Improvement Agent',
    description: 'Generates optimized SEO metadata proposals for public website entities requiring SEO enhancement.',
    permissionTier: AgentPermissionTier.TIER_3_PROPOSE,
    allowedTools: ['get_content_item', 'propose_seo_metadata'],
    allowedEntityTypes: ['bhajan', 'article', 'festival', 'puran', 'category'],
    maxIterations: 10,
    maxToolCalls: 10,
    timeoutMs: 45000,
    dryRunOnly: false
  };

  public readonly eligibleContentTypes = ['bhajan', 'article', 'festival', 'puran', 'category'] as const;

  /**
   * Analyzes an existing website entity, identifies missing/weak SEO metadata,
   * generates optimized metadata proposals, and stages them for human approval.
   *
   * SAFETY CONSTITUTION:
   * 1. Runs strictly under TIER_3_PROPOSE — CANNOT autonomously mutate or publish content.
   * 2. Sacred verses, lyrics, titles, and deity associations are NEVER modified.
   * 3. Target fields are strictly restricted to SEO metadata ('seo_title', 'seo_description', 'seo_metadata').
   * 4. Excludes YouTube imported records completely.
   */
  public async execute(
    runId: string,
    options: SeoImprovementAgentOptions
  ): Promise<{
    runId: string;
    proposalId: string;
    status: string;
    entityType: string;
    entityId: string;
    entityTitle: string;
    auditIssue?: string;
    currentSeoTitle: string;
    currentSeoDescription: string;
    proposedSeoTitle: string;
    proposedSeoDescription: string;
  }> {
    logger.info({ runId, options }, 'Starting SEO Improvement Agent execution');

    // 1. Scope and eligibility check
    if (!this.eligibleContentTypes.includes(options.entityType)) {
      throw new Error(`Entity type '${options.entityType}' is not supported for SEO improvement.`);
    }

    const context: AgentContext = {
      runId,
      agentName: this.agentName,
      actor: { type: 'SYSTEM', id: 'seo_improvement_agent' },
      currentIteration: 0,
      maxIterations: 30,
      tokensUsed: 0,
      tokenBudget: 50000
    };

    try {
      // 2. Fetch target content item via ToolGateway
      const contentResult = await toolGateway.executeTool(
        'get_content_item',
        { entityType: options.entityType, id: options.entityId },
        context
      );

      if (!contentResult.success || !contentResult.data) {
        throw new Error(contentResult.error || `${options.entityType} with ID ${options.entityId} not found`);
      }

      const entity = contentResult.data?.data || contentResult.data;
      const entityTitle = (entity.title || entity.name || 'Untitled Content').trim();
      const currentSeoTitle = (entity.seo_title || entity.seoTitle || '').trim();
      const currentSeoDescription = (entity.seo_description || entity.seoDescription || '').trim();

      // 3. Diagnose SEO issues using the same standards as SeoAuditAgent
      let detectedIssue = options.auditIssue;
      if (!detectedIssue) {
        if (!currentSeoTitle) {
          detectedIssue = 'MISSING_SEO_TITLE';
        } else if (currentSeoTitle.length < 20) {
          detectedIssue = 'SEO_TITLE_TOO_SHORT';
        } else if (currentSeoTitle.length > 65) {
          detectedIssue = 'SEO_TITLE_TOO_LONG';
        } else if (!currentSeoDescription) {
          detectedIssue = 'MISSING_SEO_DESCRIPTION';
        } else if (currentSeoDescription.length < 40) {
          detectedIssue = 'SEO_DESCRIPTION_TOO_SHORT';
        } else if (currentSeoDescription.length > 165) {
          detectedIssue = 'SEO_DESCRIPTION_TOO_LONG';
        } else {
          detectedIssue = 'SEO_OPTIMIZATION_RECOMMENDED';
        }
      }

      // 4. Generate improved SEO Title and Description
      let finalTitle = options.proposedTitle;
      let finalDescription = options.proposedDescription;

      if (!finalTitle || !finalDescription) {
        try {
          const provider = getAiProvider();
          const promptPayload = AiPrompts.seoMetadata(options.entityType, {
            title: entityTitle,
            name: entity.name,
            content: entity.content,
            description: entity.description || entity.short_description || entity.excerpt,
            lyrics: entity.lyrics
          });

          const rawCompletion = await provider.generateCompletion(promptPayload);
          let parsed: any = {};
          try {
            parsed = JSON.parse(rawCompletion);
          } catch {
            const jsonMatch = rawCompletion.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              parsed = JSON.parse(jsonMatch[0]);
            }
          }

          if (!finalTitle && parsed.seo_title) {
            finalTitle = parsed.seo_title.trim();
          }
          if (!finalDescription && parsed.seo_description) {
            finalDescription = parsed.seo_description.trim();
          }
        } catch (aiError: any) {
          logger.warn(
            { error: aiError.message, entityId: options.entityId },
            'AI provider completion failed for SEO metadata, generating structured fallback'
          );
        }
      }

      // Fallbacks if AI was unavailable or partially generated
      if (!finalTitle) {
        const titleSuffix = ' | आराधना मार्ग';
        const candidateTitle = `${entityTitle}${titleSuffix}`;
        finalTitle = candidateTitle.length <= 60 ? candidateTitle : entityTitle.slice(0, 50) + titleSuffix;
      }

      if (!finalDescription) {
        finalDescription = `आराधना मार्ग पर ${entityTitle} का पावन विवरण, आध्यात्मिक महत्व एवं संपूर्ण भक्तिमय जानकारी प्राप्त करें।`;
      }

      const targetField = options.targetField || 'seo_metadata';

      let proposedValue: string;
      let baselineCurrentValue: string;

      if (targetField === 'seo_title') {
        proposedValue = finalTitle;
        baselineCurrentValue = currentSeoTitle;
      } else if (targetField === 'seo_description') {
        proposedValue = finalDescription;
        baselineCurrentValue = currentSeoDescription;
      } else {
        proposedValue = JSON.stringify({
          seoTitle: finalTitle,
          seoDescription: finalDescription
        });
        baselineCurrentValue = JSON.stringify({
          seoTitle: currentSeoTitle,
          seoDescription: currentSeoDescription
        });
      }

      const reasoning =
        options.reasoning ||
        `Optimized SEO metadata proposed for ${options.entityType} "${entityTitle}". Detected issue: ${detectedIssue}. Improved title length (${finalTitle.length} chars) and description length (${finalDescription.length} chars) for search discovery.`;

      // 5. Stage proposal through ToolGateway boundary into agent_proposals
      const toolResult = await toolGateway.executeTool(
        'propose_seo_metadata',
        {
          entityType: options.entityType,
          entityId: entity.id,
          targetField,
          seoTitle: finalTitle,
          seoDescription: finalDescription,
          proposedValue,
          currentValue: baselineCurrentValue,
          reasoning
        },
        context
      );

      if (!toolResult.success && !toolResult.isProposalStaged) {
        throw new Error(toolResult.error || 'Failed to stage SEO metadata proposal');
      }

      const proposalId = toolResult.proposalId || 'staged';

      // 6. Update Agent Run State & Lifecycle
      await agentRunRepository.updateState(runId, {
        entityType: options.entityType,
        entityId: entity.id,
        entityTitle,
        auditIssue: detectedIssue,
        targetField,
        currentSeoTitle,
        currentSeoDescription,
        proposedSeoTitle: finalTitle,
        proposedSeoDescription: finalDescription,
        proposalId,
        stagedStatus: 'PENDING'
      });
      await agentRunRepository.updateStatus(runId, 'COMPLETED');

      logger.info(
        { runId, proposalId, entityType: options.entityType, entityId: options.entityId },
        'SEO Improvement Agent completed and staged proposal for human approval'
      );

      return {
        runId,
        proposalId,
        status: 'PROPOSAL_STAGED',
        entityType: options.entityType,
        entityId: entity.id,
        entityTitle,
        auditIssue: detectedIssue,
        currentSeoTitle,
        currentSeoDescription,
        proposedSeoTitle: finalTitle,
        proposedSeoDescription: finalDescription
      };
    } catch (err: any) {
      logger.error({ runId, error: err.message }, 'SEO Improvement Agent encountered failure');
      await agentRunRepository.updateStatus(runId, 'FAILED', err.message || 'Execution failed');
      throw err;
    }
  }
}

export const seoImprovementAgent = new SeoImprovementAgent();
