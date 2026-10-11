import { agentProposalRepository } from '../repositories/AgentProposalRepository';
import { toolGateway } from '../gateway/ToolGateway';
import { AgentProposal } from '@models/AgentProposal';
import { bhajanService } from '@features/bhajans/BhajanService';
import { articleService } from '@services/ArticleService';
import { festivalService } from '@services/FestivalService';
import { puranService } from '@services/PuranService';
import { categoryService } from '@features/categories/CategoryService';
import { NotFoundError, AppError } from '@/errors/appError';
import { logger } from '@utils/logger';

export class AgentProposalService {
  private async getEntity(entityType: string, entityId: string): Promise<any> {
    try {
      switch (entityType) {
        case 'bhajan':
          return await bhajanService.getById(entityId);
        case 'article':
          return await articleService.getById(entityId);
        case 'festival':
          return await festivalService.getById(entityId);
        case 'puran':
          return await puranService.getById(entityId);
        case 'category':
          return await categoryService.getById(entityId);
        default:
          return null;
      }
    } catch {
      return null;
    }
  }

  private getEntityTitle(entityType: string, entity: any): string {
    if (!entity) return 'Unknown';
    if (entityType === 'festival' || entityType === 'category') {
      return entity.name || 'Untitled';
    }
    return entity.title || 'Untitled';
  }

  async getProposals(options: {
    page?: number;
    limit?: number;
    status?: string;
    entityType?: string;
  }): Promise<{ data: (AgentProposal & { targetTitle?: string })[]; count: number }> {
    const result = await agentProposalRepository.list(
      options.page || 1,
      options.limit || 10,
      options.status,
      options.entityType
    );

    // Enrich proposals with target entity title if available
    const enriched = await Promise.all(
      result.data.map(async (proposal) => {
        try {
          const entity = await this.getEntity(proposal.entityType, proposal.entityId);
          if (entity) {
            return {
              ...proposal,
              targetTitle: this.getEntityTitle(proposal.entityType, entity)
            };
          }
        } catch {
          // Ignore lookup failure for deleted items
        }
        return {
          ...proposal,
          targetTitle: undefined
        };
      })
    );

    return {
      data: enriched,
      count: result.count
    };
  }

  async getProposalById(id: string): Promise<AgentProposal & { targetEntity?: any }> {
    const proposal = await agentProposalRepository.findById(id);
    if (!proposal) throw new NotFoundError('Agent proposal not found');

    let targetEntity: any = null;
    try {
      const entity = await this.getEntity(proposal.entityType, proposal.entityId);
      if (entity) {
        targetEntity = {
          id: entity.id,
          title: this.getEntityTitle(proposal.entityType, entity),
          slug: entity.slug,
          currentMeaning: entity.short_description || entity.description || null,
          seo_title: entity.seo_title || null,
          seo_description: entity.seo_description || null
        };
      }
    } catch (err: any) {
      logger.warn({ proposalId: id, error: err.message }, 'Failed to load target entity details for proposal');
    }

    return {
      ...proposal,
      targetEntity
    };
  }

  /**
   * Human approval transition: PENDING -> APPROVED
   * NOTE: Approval strictly validates and marks the proposal as approved.
   * It DOES NOT execute content mutation.
   */
  async approveProposal(id: string, reviewedBy: string): Promise<AgentProposal> {
    const proposal = await agentProposalRepository.findById(id);
    if (!proposal) throw new NotFoundError('Agent proposal not found');

    if (proposal.status === 'APPROVED') {
      throw new AppError('Proposal is already approved', 400);
    }
    if (proposal.status === 'REJECTED') {
      throw new AppError('Cannot approve a rejected proposal', 400);
    }
    if (proposal.status === 'COMPLETED') {
      throw new AppError('Cannot approve an already completed proposal', 400);
    }
    if (proposal.status !== 'PENDING') {
      throw new AppError(`Cannot approve proposal in ${proposal.status} status`, 400);
    }

    const updated = await agentProposalRepository.transitionStatus(id, ['PENDING'], 'APPROVED', { reviewedBy });

    if (!updated) {
      throw new AppError('Concurrent update detected: Failed to transition proposal to APPROVED', 409);
    }

    logger.info({ proposalId: id, reviewedBy }, 'Agent proposal approved by administrator');
    return updated;
  }

  /**
   * Human rejection transition: PENDING or APPROVED -> REJECTED
   */
  async rejectProposal(id: string, reviewedBy: string, rejectionReason?: string): Promise<AgentProposal> {
    const proposal = await agentProposalRepository.findById(id);
    if (!proposal) throw new NotFoundError('Agent proposal not found');

    if (proposal.status === 'REJECTED') {
      throw new AppError('Proposal is already rejected', 400);
    }
    if (proposal.status === 'COMPLETED') {
      throw new AppError('Cannot reject an already completed proposal', 400);
    }
    if (proposal.status !== 'PENDING' && proposal.status !== 'APPROVED') {
      throw new AppError(`Cannot reject proposal in ${proposal.status} status`, 400);
    }

    const updated = await agentProposalRepository.transitionStatus(id, ['PENDING', 'APPROVED'], 'REJECTED', {
      reviewedBy,
      rejectionReason: rejectionReason || 'Rejected by administrator'
    });

    if (!updated) {
      throw new AppError('Concurrent update detected: Failed to transition proposal to REJECTED', 409);
    }

    logger.info({ proposalId: id, reviewedBy, rejectionReason }, 'Agent proposal rejected by administrator');
    return updated;
  }

  /**
   * Controlled execution transition: APPROVED -> EXECUTING -> COMPLETED (or FAILED)
   * Enforces:
   * 1. Only APPROVED proposals can execute.
   * 2. Atomic state transition prevents concurrent execution / double clicks.
   * 3. Stale proposal protection verifies baseline content hasn't changed.
   * 4. Central execution boundary: Routes strictly through ToolGateway -> typed execution tool -> Domain Service.
   * 5. Sacred content firewall: strictly enforces devotional meaning only (lyrics and titles immutable).
   */
  async executeProposal(id: string, executedBy: string): Promise<AgentProposal> {
    const proposal = await agentProposalRepository.findById(id);
    if (!proposal) throw new NotFoundError('Agent proposal not found');

    if (proposal.status === 'PENDING') {
      throw new AppError('Proposal must be approved by an administrator before execution', 400);
    }
    if (proposal.status === 'REJECTED') {
      throw new AppError('Cannot execute a rejected proposal', 400);
    }
    if (proposal.status === 'COMPLETED') {
      throw new AppError('Proposal has already been executed and completed', 400);
    }
    if (proposal.status === 'EXECUTING') {
      throw new AppError('Proposal is currently being executed by another process', 409);
    }
    if (proposal.status !== 'APPROVED') {
      throw new AppError(`Cannot execute proposal in ${proposal.status} status`, 400);
    }

    // 1. Atomic concurrency guard: transition APPROVED -> EXECUTING
    const executing = await agentProposalRepository.transitionStatus(id, ['APPROVED'], 'EXECUTING');

    if (!executing) {
      throw new AppError('Conflict: Proposal is no longer in APPROVED status or is being processed concurrently', 409);
    }

    const startTime = Date.now();

    try {
      const { entityType, entityId, targetField, currentValue } = executing;

      // 2. Resolve live entity
      const liveEntity = await this.getEntity(entityType, entityId);
      if (!liveEntity) {
        throw new AppError(`Target ${entityType} record no longer exists or has been deleted`, 404);
      }

      // 3. Stale Content Protection
      if (targetField === 'meaning') {
        if (entityType !== 'bhajan') {
          throw new AppError(`Target field 'meaning' is only supported for entity type 'bhajan'`, 400);
        }
        const liveMeaning = (liveEntity.short_description || liveEntity.description || '').trim();
        const expectedMeaning = (currentValue || '').trim();

        if (expectedMeaning !== '' && liveMeaning !== expectedMeaning) {
          const staleMsg = `Stale proposal detected: Bhajan meaning was modified externally after proposal creation (original: "${expectedMeaning.slice(0, 50)}...", current: "${liveMeaning.slice(0, 50)}..."). Overwrite prevented.`;
          await agentProposalRepository.updateStatus(id, 'FAILED', executedBy, staleMsg);
          logger.warn({ proposalId: id, entityId }, staleMsg);
          throw new AppError(staleMsg, 409);
        }
      } else if (targetField === 'seo_title') {
        const liveTitle = (liveEntity.seo_title || liveEntity.seoTitle || '').trim();
        const expectedTitle = (currentValue || '').trim();

        if (expectedTitle !== '' && liveTitle !== expectedTitle) {
          const staleMsg = `Stale proposal detected: ${entityType} seo_title was modified externally after proposal creation (original: "${expectedTitle.slice(0, 50)}...", current: "${liveTitle.slice(0, 50)}..."). Overwrite prevented.`;
          await agentProposalRepository.updateStatus(id, 'FAILED', executedBy, staleMsg);
          logger.warn({ proposalId: id, entityId }, staleMsg);
          throw new AppError(staleMsg, 409);
        }
      } else if (targetField === 'seo_description') {
        const liveDesc = (liveEntity.seo_description || liveEntity.seoDescription || '').trim();
        const expectedDesc = (currentValue || '').trim();

        if (expectedDesc !== '' && liveDesc !== expectedDesc) {
          const staleMsg = `Stale proposal detected: ${entityType} seo_description was modified externally after proposal creation (original: "${expectedDesc.slice(0, 50)}...", current: "${liveDesc.slice(0, 50)}..."). Overwrite prevented.`;
          await agentProposalRepository.updateStatus(id, 'FAILED', executedBy, staleMsg);
          logger.warn({ proposalId: id, entityId }, staleMsg);
          throw new AppError(staleMsg, 409);
        }
      } else if (targetField === 'seo_metadata') {
        let expectedTitle: string | undefined;
        let expectedDesc: string | undefined;

        try {
          const parsed = JSON.parse(currentValue || '{}');
          if (parsed.seoTitle !== undefined) expectedTitle = parsed.seoTitle.trim();
          if (parsed.seoDescription !== undefined) expectedDesc = parsed.seoDescription.trim();
        } catch {
          // not JSON, ignore
        }

        const liveTitle = (liveEntity.seo_title || liveEntity.seoTitle || '').trim();
        const liveDesc = (liveEntity.seo_description || liveEntity.seoDescription || '').trim();

        const titleMismatch = expectedTitle !== undefined && expectedTitle !== '' && liveTitle !== expectedTitle;
        const descMismatch = expectedDesc !== undefined && expectedDesc !== '' && liveDesc !== expectedDesc;

        if (titleMismatch || descMismatch) {
          const staleMsg = `Stale proposal detected: ${entityType} SEO metadata was modified externally after proposal creation. Overwrite prevented.`;
          await agentProposalRepository.updateStatus(id, 'FAILED', executedBy, staleMsg);
          logger.warn({ proposalId: id, entityId }, staleMsg);
          throw new AppError(staleMsg, 409);
        }
      }

      // 4. Central ToolGateway Execution Boundary
      // Routes through ToolGateway -> typed execution tool -> Domain Service -> Repository
      await toolGateway.executeApprovedProposal(executing, executedBy);

      // 4. Mark proposal as COMPLETED
      const durationMs = Date.now() - startTime;
      const completed = await agentProposalRepository.updateStatus(id, 'COMPLETED', executedBy);
      logger.info(
        { proposalId: id, executedBy, durationMs },
        'Approved agent proposal executed and completed successfully via ToolGateway'
      );
      return completed;
    } catch (err: any) {
      // If error was already marked FAILED due to stale check, rethrow
      if (err.statusCode === 409 && err.message.includes('Stale proposal')) {
        throw err;
      }
      logger.error({ proposalId: id, error: err.message }, 'Failed during proposal execution');
      await agentProposalRepository.updateStatus(id, 'FAILED', executedBy, err.message);
      throw err;
    }
  }
}

export const agentProposalService = new AgentProposalService();
