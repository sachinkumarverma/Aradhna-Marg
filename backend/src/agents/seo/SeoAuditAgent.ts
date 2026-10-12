import { toolGateway } from '../gateway/ToolGateway';
import '../tools';
import { AgentPermissionTier } from '../types/AgentPermissionTier';
import { AgentContext } from '../types/AgentContext';
import { AgentDefinition, AutonomousAgent } from '../types/AgentDefinition';
import { agentRunRepository } from '../repositories/AgentRunRepository';
import { logger } from '@utils/logger';

export type SeoSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface SeoFinding {
  contentType: string;
  contentId: string;
  contentTitle: string;
  issueType: string;
  severity: SeoSeverity;
  field: string;
  message: string;
  recommendation: string;
  currentValue?: string;
  evidence?: string;
  runId: string;
}

export interface SeoAuditSummary {
  totalDiscovered: number;
  totalAudited: number;
  skipped: number;
  failures: string[];
  totalIssues: number;
  bySeverity: Record<SeoSeverity, number>;
  byContentType: Record<string, number>;
  contentTypeCounts: {
    discovered: Record<string, number>;
    audited: Record<string, number>;
    skipped: Record<string, number>;
  };
  byIssueType: Record<string, number>;
}

export interface SeoAuditOptions {
  scope?: string[];
  batchSize?: number;
  maxItemsPerType?: number;
}

export class SeoAuditAgent implements AutonomousAgent {
  public readonly definition: AgentDefinition = {
    id: 'seo_audit_agent',
    name: 'SEO Audit Agent',
    description: 'Audits website content for missing metadata and SEO issues.',
    permissionTier: AgentPermissionTier.TIER_2_ANALYZE,
    allowedTools: ['get_seo_audit', 'get_seo_content_batch'],
    allowedEntityTypes: ['bhajan', 'article', 'festival', 'puran', 'category'],
    maxIterations: 100,
    maxToolCalls: 50,
    timeoutMs: 60000,
    dryRunOnly: true
  };

  public readonly agentName = 'SeoAuditAgent';
  public readonly permission = AgentPermissionTier.TIER_2_ANALYZE;

  /**
   * Permitted website content types.
   * EXPLICIT: YouTube imported records are NEVER website content for SEO auditing.
   */
  public readonly eligibleContentTypes = ['bhajan', 'article', 'festival', 'puran', 'category'] as const;

  /**
   * Executes a read-only SEO audit run through the ToolGateway with multi-page pagination.
   */
  public async execute(runId: string, options?: SeoAuditOptions): Promise<any> {
    const startTime = Date.now();
    logger.info({ runId, options }, 'Starting SEO Audit Agent execution');

    const context: AgentContext = {
      runId,
      agentName: this.agentName,
      actor: { type: 'SYSTEM', id: 'seo_audit_agent' },
      currentIteration: 0,
      maxIterations: 500,
      tokensUsed: 0,
      tokenBudget: 100000
    };

    try {
      // 1. Resolve content scope (strictly constrained to website content)
      const requestedScope = options?.scope && options.scope.length > 0 ? options.scope : this.eligibleContentTypes;
      const targetScope = requestedScope.filter((type) =>
        (this.eligibleContentTypes as readonly string[]).includes(type)
      ) as ('bhajan' | 'article' | 'festival' | 'puran' | 'category')[];

      if (targetScope.length === 0) {
        throw new Error('No valid eligible website content types specified in audit scope.');
      }

      // 2. Fetch platform overview via ToolGateway
      const overviewResult = await toolGateway.executeTool('get_seo_audit', {}, context);
      const overviewStats = overviewResult.success ? overviewResult.data : null;

      const findings: SeoFinding[] = [];
      let totalDiscovered = 0;
      let totalAudited = 0;
      let totalSkipped = 0;
      const failures: string[] = [];

      const contentTypeCounts = {
        discovered: {} as Record<string, number>,
        audited: {} as Record<string, number>,
        skipped: {} as Record<string, number>
      };
      const byContentType: Record<string, number> = {};
      const byIssueType: Record<string, number> = {};

      const batchSize = Math.max(1, Math.min(options?.batchSize || 50, 50));

      // Duplicate tracking maps across the audited scope
      const seenSlugs = new Map<string, { id: string; type: string }>();
      const seenTitles = new Map<string, { id: string; type: string }>();

      // 3. Inspect each in-scope website content type via ToolGateway with multi-page pagination
      for (const contentType of targetScope) {
        contentTypeCounts.discovered[contentType] = 0;
        contentTypeCounts.audited[contentType] = 0;
        contentTypeCounts.skipped[contentType] = 0;
        byContentType[contentType] = 0;

        let page = 1;
        let hasMore = true;
        let typeDiscovered: number | null = null;
        let typeAudited = 0;

        while (hasMore) {
          const remainingNeeded =
            options?.maxItemsPerType !== undefined ? options.maxItemsPerType - typeAudited : undefined;

          if (remainingNeeded !== undefined && remainingNeeded <= 0) {
            break;
          }

          const currentLimit = remainingNeeded !== undefined ? Math.min(batchSize, remainingNeeded) : batchSize;

          const batchResult = await toolGateway.executeTool(
            'get_seo_content_batch',
            { contentType, page, limit: currentLimit },
            context
          );

          if (!batchResult.success || !batchResult.data?.items) {
            const errorMsg = batchResult.error || 'Failed to fetch content batch during SEO audit';
            logger.warn({ contentType, page, error: errorMsg }, 'Content batch fetch failed during SEO audit');
            failures.push(`[${contentType}] Page ${page} fetch failed: ${errorMsg}`);

            if (typeDiscovered !== null) {
              const remainingDiff = Math.max(0, typeDiscovered - typeAudited);
              totalSkipped += remainingDiff;
              contentTypeCounts.skipped[contentType] += remainingDiff;
            }
            hasMore = false;
            break;
          }

          const { items, total } = batchResult.data;

          if (typeDiscovered === null) {
            typeDiscovered = total;
            totalDiscovered += total;
            contentTypeCounts.discovered[contentType] = total;
          }

          if (items.length === 0) {
            hasMore = false;
            break;
          }

          for (const item of items) {
            this.auditItem(item, contentType, runId, findings, byIssueType, seenTitles, seenSlugs);
            typeAudited++;
          }

          // Evaluate pagination continuation
          if (items.length < currentLimit) {
            hasMore = false;
          } else if (typeDiscovered !== null && typeAudited >= typeDiscovered) {
            hasMore = false;
          } else if (remainingNeeded !== undefined && typeAudited >= options!.maxItemsPerType!) {
            hasMore = false;
          } else {
            page++;
          }
        }

        totalAudited += typeAudited;
        contentTypeCounts.audited[contentType] = typeAudited;
        byContentType[contentType] = typeAudited;

        // Account for any remaining items skipped due to maxItemsPerType capping without execution failure
        if (typeDiscovered !== null && typeAudited < typeDiscovered) {
          const diff = typeDiscovered - typeAudited;
          if (contentTypeCounts.skipped[contentType] === 0 && diff > 0) {
            contentTypeCounts.skipped[contentType] = diff;
            totalSkipped += diff;
          }
        }
      }

      // 4. Compute structured summary
      const summary: SeoAuditSummary = {
        totalDiscovered,
        totalAudited,
        skipped: totalSkipped,
        failures,
        totalIssues: findings.length,
        bySeverity: {
          CRITICAL: findings.filter((f) => f.severity === 'CRITICAL').length,
          HIGH: findings.filter((f) => f.severity === 'HIGH').length,
          MEDIUM: findings.filter((f) => f.severity === 'MEDIUM').length,
          LOW: findings.filter((f) => f.severity === 'LOW').length
        },
        byContentType,
        contentTypeCounts,
        byIssueType
      };

      // 5. Persist complete audit results into agent_runs.state
      const isCompleteAudit = failures.length === 0 && (options?.maxItemsPerType === undefined || totalSkipped === 0);
      await agentRunRepository.updateState(runId, {
        scope: targetScope,
        overviewStats,
        summary,
        findings,
        isCompleteAudit,
        hasFailures: failures.length > 0
      });

      // 6. Complete agent run lifecycle
      await agentRunRepository.updateStatus(runId, 'COMPLETED');

      logger.info(
        {
          runId,
          totalDiscovered,
          totalAudited,
          skipped: totalSkipped,
          failuresCount: failures.length,
          totalIssues: summary.totalIssues
        },
        'SEO Audit Agent completed successfully'
      );

      const durationMs = Date.now() - startTime;
      const status = (
        summary.bySeverity.CRITICAL > 0 ? 'CRITICAL' : summary.bySeverity.HIGH > 0 ? 'WARNING' : 'HEALTHY'
      ) as any;

      return {
        runId,
        summary: {
          status,
          overview: `SEO Audit evaluated ${totalAudited} item(s). Found ${findings.length} issue(s).`,
          totalFindings: findings.length,
          bySeverity: {
            ...summary.bySeverity,
            INFO: 0
          },
          metrics: summary
        },
        findings,
        durationMs,
        dryRun: true
      };
    } catch (err: any) {
      logger.error({ runId, error: err.message }, 'SEO Audit Agent encountered failure');
      await agentRunRepository.updateStatus(runId, 'FAILED', err.message || 'Audit execution failure');
      throw err;
    }
  }

  private auditItem(
    item: any,
    contentType: string,
    runId: string,
    findings: SeoFinding[],
    byIssueType: Record<string, number>,
    seenTitles: Map<string, { id: string; type: string }>,
    seenSlugs: Map<string, { id: string; type: string }>
  ): void {
    const itemTitle = item.title?.trim() || 'Untitled Content';

    // --- RULE 1: Missing SEO Title ---
    if (!item.seoTitle || item.seoTitle.trim() === '') {
      this.addFinding(findings, byIssueType, {
        contentType,
        contentId: item.id,
        contentTitle: itemTitle,
        issueType: 'MISSING_SEO_TITLE',
        severity: 'HIGH',
        field: 'seo_title',
        message: `Missing SEO title for ${contentType} "${itemTitle}".`,
        recommendation: `Provide an optimized SEO title (30-60 chars) highlighting relevant devotional keywords.`,
        runId
      });
    } else {
      const titleLen = item.seoTitle.trim().length;
      // --- RULE 2: SEO Title Length ---
      if (titleLen < 20) {
        this.addFinding(findings, byIssueType, {
          contentType,
          contentId: item.id,
          contentTitle: itemTitle,
          issueType: 'SEO_TITLE_TOO_SHORT',
          severity: 'MEDIUM',
          field: 'seo_title',
          message: `SEO title is too short (${titleLen} characters): "${item.seoTitle}"`,
          recommendation: `Expand title to at least 30 characters for optimal click-through and ranking performance.`,
          currentValue: item.seoTitle,
          runId
        });
      } else if (titleLen > 65) {
        this.addFinding(findings, byIssueType, {
          contentType,
          contentId: item.id,
          contentTitle: itemTitle,
          issueType: 'SEO_TITLE_TOO_LONG',
          severity: 'MEDIUM',
          field: 'seo_title',
          message: `SEO title exceeds 65 characters (${titleLen} characters): "${item.seoTitle}"`,
          recommendation: `Shorten SEO title to under 60 characters to prevent snippet truncation on search results.`,
          currentValue: item.seoTitle,
          runId
        });
      }

      // --- RULE 3: Duplicate SEO Title ---
      const titleKey = `${contentType}:${item.seoTitle.trim().toLowerCase()}`;
      if (seenTitles.has(titleKey)) {
        this.addFinding(findings, byIssueType, {
          contentType,
          contentId: item.id,
          contentTitle: itemTitle,
          issueType: 'DUPLICATE_SEO_TITLE',
          severity: 'HIGH',
          field: 'seo_title',
          message: `Duplicate SEO title shared with another ${contentType}: "${item.seoTitle}"`,
          recommendation: `Differentiate the SEO title to ensure search engines distinguish unique intent.`,
          currentValue: item.seoTitle,
          evidence: `Conflict with ${seenTitles.get(titleKey)?.id}`,
          runId
        });
      } else {
        seenTitles.set(titleKey, { id: item.id, type: contentType });
      }
    }

    // --- RULE 4: Missing SEO Description ---
    if (!item.seoDescription || item.seoDescription.trim() === '') {
      this.addFinding(findings, byIssueType, {
        contentType,
        contentId: item.id,
        contentTitle: itemTitle,
        issueType: 'MISSING_SEO_DESCRIPTION',
        severity: 'HIGH',
        field: 'seo_description',
        message: `Missing meta description for ${contentType} "${itemTitle}".`,
        recommendation: `Add a rich, descriptive summary (50-160 chars) explaining the spiritual essence.`,
        runId
      });
    } else {
      const descLen = item.seoDescription.trim().length;
      // --- RULE 5: SEO Description Length ---
      if (descLen < 40) {
        this.addFinding(findings, byIssueType, {
          contentType,
          contentId: item.id,
          contentTitle: itemTitle,
          issueType: 'SEO_DESCRIPTION_TOO_SHORT',
          severity: 'MEDIUM',
          field: 'seo_description',
          message: `Meta description is too brief (${descLen} characters).`,
          recommendation: `Expand description to at least 50 characters to provide sufficient summary value.`,
          currentValue: item.seoDescription,
          runId
        });
      } else if (descLen > 165) {
        this.addFinding(findings, byIssueType, {
          contentType,
          contentId: item.id,
          contentTitle: itemTitle,
          issueType: 'SEO_DESCRIPTION_TOO_LONG',
          severity: 'MEDIUM',
          field: 'seo_description',
          message: `Meta description exceeds search engine display limits (${descLen} characters).`,
          recommendation: `Condense description to between 140 and 160 characters.`,
          currentValue: item.seoDescription,
          runId
        });
      }
    }

    // --- RULE 6: Missing Slug ---
    if (!item.slug || item.slug.trim() === '') {
      this.addFinding(findings, byIssueType, {
        contentType,
        contentId: item.id,
        contentTitle: itemTitle,
        issueType: 'MISSING_SLUG',
        severity: 'CRITICAL',
        field: 'slug',
        message: `Critical URL slug is missing for ${contentType} "${itemTitle}".`,
        recommendation: `Generate a permanent URL-friendly slug to establish page indexability.`,
        runId
      });
    } else {
      // --- RULE 7: Duplicate Slug ---
      const slugKey = `${contentType}:${item.slug.trim().toLowerCase()}`;
      if (seenSlugs.has(slugKey)) {
        this.addFinding(findings, byIssueType, {
          contentType,
          contentId: item.id,
          contentTitle: itemTitle,
          issueType: 'DUPLICATE_SLUG',
          severity: 'CRITICAL',
          field: 'slug',
          message: `Duplicate URL slug "${item.slug}" collision detected in ${contentType}.`,
          recommendation: `Resolve collision by assigning a unique slug identifier.`,
          currentValue: item.slug,
          evidence: `Conflict with ${seenSlugs.get(slugKey)?.id}`,
          runId
        });
      } else {
        seenSlugs.set(slugKey, { id: item.id, type: contentType });
      }
    }

    // --- RULE 8: Content Quality / Excerpt Checks (Articles) ---
    if (contentType === 'article') {
      if (!item.excerpt || item.excerpt.trim() === '') {
        this.addFinding(findings, byIssueType, {
          contentType,
          contentId: item.id,
          contentTitle: itemTitle,
          issueType: 'MISSING_EXCERPT',
          severity: 'LOW',
          field: 'excerpt',
          message: `Article has no excerpt summary.`,
          recommendation: `Write a 1-2 sentence excerpt summarizing the spiritual lesson.`,
          runId
        });
      }
      if (item.content && item.content.trim().length < 150) {
        this.addFinding(findings, byIssueType, {
          contentType,
          contentId: item.id,
          contentTitle: itemTitle,
          issueType: 'THIN_CONTENT',
          severity: 'LOW',
          field: 'content',
          message: `Article content is exceptionally short (${item.content.trim().length} characters).`,
          recommendation: `Provide comprehensive devotional insight to avoid low-content search penalties.`,
          runId
        });
      }
    }
  }

  private addFinding(findings: any[], byIssueType: Record<string, number>, finding: any): void {
    const normalized = {
      ...finding,
      type: finding.issueType,
      entityType: finding.contentType,
      entityId: finding.contentId,
      title: finding.contentTitle
    };
    findings.push(normalized);
    byIssueType[finding.issueType] = (byIssueType[finding.issueType] || 0) + 1;
  }
}

export const seoAuditAgent = new SeoAuditAgent();
