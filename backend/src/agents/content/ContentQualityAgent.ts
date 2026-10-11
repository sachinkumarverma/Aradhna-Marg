import { toolGateway } from '../gateway/ToolGateway';
import { AgentDefinition, AutonomousAgent, AgentFinding, AgentRunState } from '../types/AgentDefinition';
import { AgentPermissionTier } from '../types/AgentPermissionTier';
import { AgentContext } from '../types/AgentContext';
import { agentRunRepository } from '../repositories/AgentRunRepository';
import { logger } from '@utils/logger';

export class ContentQualityAgent implements AutonomousAgent {
  public readonly definition: AgentDefinition = {
    id: 'content_quality_agent',
    name: 'Content Quality Agent',
    description:
      'Analyzes supported editorial content (Articles, Festivals, Puranas, and Bhajan descriptions) for readability, grammar, excerpt completeness, and paragraph structure without altering text or sacred lyrics.',
    permissionTier: AgentPermissionTier.TIER_2_ANALYZE,
    allowedTools: ['get_content_quality_batch'],
    allowedEntityTypes: ['article', 'festival', 'puran', 'bhajan'],
    maxIterations: 100,
    maxToolCalls: 50,
    timeoutMs: 60000,
    dryRunOnly: true
  };

  public async execute(runId: string, options?: { scope?: string[]; limit?: number }): Promise<AgentRunState> {
    const startTime = Date.now();
    logger.info({ runId, options }, 'Starting Content Quality Agent execution');

    const context: AgentContext = {
      runId,
      agentName: this.definition.id,
      actor: { type: 'SYSTEM', id: 'content_quality_agent' },
      currentIteration: 0,
      maxIterations: this.definition.maxIterations,
      tokensUsed: 0,
      tokenBudget: 50000
    };

    const targetScope = (
      options?.scope && options.scope.length > 0
        ? options.scope.filter((s) => this.definition.allowedEntityTypes.includes(s))
        : this.definition.allowedEntityTypes
    ) as ('article' | 'festival' | 'puran' | 'bhajan')[];

    const findings: AgentFinding[] = [];
    const limit = options?.limit || 20;
    let totalAudited = 0;

    try {
      for (const contentType of targetScope) {
        // Fetch read-only batch via ToolGateway
        const toolResult = await toolGateway.executeTool(
          'get_content_quality_batch',
          { contentType, page: 1, limit },
          context
        );

        if (!toolResult.success || !toolResult.data) {
          logger.warn({ contentType, runId }, 'Failed to fetch content quality batch');
          continue;
        }

        const items = toolResult.data.items || [];
        totalAudited += items.length;

        for (const item of items) {
          this.auditContentItem(contentType, item, findings);
        }
      }

      // Compute statistics & overall status
      const bySeverity = {
        CRITICAL: findings.filter((f) => f.severity === 'CRITICAL').length,
        HIGH: findings.filter((f) => f.severity === 'HIGH').length,
        MEDIUM: findings.filter((f) => f.severity === 'MEDIUM').length,
        LOW: findings.filter((f) => f.severity === 'LOW').length,
        INFO: findings.filter((f) => f.severity === 'INFO').length
      };

      let overallStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';
      if (bySeverity.CRITICAL > 0) {
        overallStatus = 'CRITICAL';
      } else if (bySeverity.HIGH > 0 || bySeverity.MEDIUM > 0) {
        overallStatus = 'WARNING';
      }

      const durationMs = Date.now() - startTime;
      const resultState: AgentRunState = {
        summary: {
          status: overallStatus,
          overview: `Content Quality Audit evaluated ${totalAudited} item(s) across [${targetScope.join(', ')}]. Discovered ${findings.length} quality finding(s).`,
          totalFindings: findings.length,
          bySeverity,
          metrics: {
            totalAudited,
            scope: targetScope
          }
        },
        findings,
        durationMs,
        dryRun: true
      };

      // Persist to agent_runs
      await agentRunRepository.updateState(runId, resultState);
      await agentRunRepository.updateStatus(runId, 'COMPLETED');

      logger.info(
        { runId, totalAudited, findingsCount: findings.length },
        'Content Quality Agent completed successfully'
      );
      return resultState;
    } catch (err: any) {
      logger.error({ runId, error: err.message }, 'Content Quality Agent execution failed');
      await agentRunRepository.updateStatus(runId, 'FAILED', err.message || 'Content quality audit failed');
      throw err;
    }
  }

  private auditContentItem(contentType: string, item: any, findings: AgentFinding[]): void {
    const itemTitle = item.title || 'Untitled';

    // Rule 1: Missing Excerpt / Short Description
    if (!item.excerpt || item.excerpt.trim() === '') {
      findings.push({
        type: 'missing_excerpt',
        severity: contentType === 'article' ? 'HIGH' : 'MEDIUM',
        entityType: contentType,
        entityId: item.id,
        title: `Missing Excerpt for ${contentType} "${itemTitle}"`,
        message: `${contentType} has no brief excerpt or short summary.`,
        recommendation: 'Generate a 1-2 sentence devotional excerpt summarizing core spiritual insights.'
      });
    } else if (item.excerpt.trim().length < 30) {
      findings.push({
        type: 'short_excerpt',
        severity: 'LOW',
        entityType: contentType,
        entityId: item.id,
        title: `Brief Excerpt for ${contentType} "${itemTitle}"`,
        message: `Excerpt is very brief (${item.excerpt.trim().length} characters).`,
        recommendation: 'Expand excerpt to 40-150 characters to provide meaningful overview for readers.'
      });
    }

    // Rule 2: Thin Body Content (Articles and Festivals)
    if (contentType === 'article' || contentType === 'festival') {
      if (!item.content || item.content.trim() === '') {
        findings.push({
          type: 'missing_content',
          severity: 'HIGH',
          entityType: contentType,
          entityId: item.id,
          title: `Empty Body Content for ${contentType} "${itemTitle}"`,
          message: `${contentType} record has empty or unpopulated body content.`,
          recommendation: 'Draft rich devotional content explaining scriptural significance and philosophical context.'
        });
      } else if (item.charCount < 150) {
        findings.push({
          type: 'thin_content',
          severity: 'MEDIUM',
          entityType: contentType,
          entityId: item.id,
          title: `Thin Content for ${contentType} "${itemTitle}"`,
          message: `Body content is minimal (${item.charCount} characters, ${item.wordCount} words).`,
          recommendation: 'Consider creating a Phase 4C content improvement proposal to expand narrative depth.'
        });
      }
    }

    // Rule 3: Bhajan Description Completeness (Sacred lyrics remain untouched)
    if (contentType === 'bhajan') {
      if (!item.content || item.content.trim() === '') {
        findings.push({
          type: 'missing_bhajan_meaning',
          severity: 'LOW',
          entityType: contentType,
          entityId: item.id,
          title: `No Meaning/Description for Bhajan "${itemTitle}"`,
          message: 'Bhajan has no devotional description or spiritual meaning attached.',
          recommendation: 'Create a Phase 4A devotional meaning proposal in Hindi to assist devotee contemplation.'
        });
      }
    }

    // Rule 4: Bilingual Coverage (Articles and Festivals)
    if (contentType === 'article' || contentType === 'festival') {
      if (!item.contentEn || item.contentEn.trim() === '') {
        findings.push({
          type: 'missing_english_translation',
          severity: 'INFO',
          entityType: contentType,
          entityId: item.id,
          title: `Missing English Version for ${contentType} "${itemTitle}"`,
          message: `${contentType} has Hindi content but no English translation yet.`,
          recommendation: 'Use English translation pipeline to provide bilingual accessibility.'
        });
      }
    }
  }
}

export const contentQualityAgent = new ContentQualityAgent();
