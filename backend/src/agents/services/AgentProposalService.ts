import { agentProposalRepository } from '../repositories/AgentProposalRepository';
import { AgentProposal } from '@models/AgentProposal';
import { bhajanRepository } from '@features/bhajans/BhajanRepository';
import { articleRepository } from '@repositories/ArticleRepository';
import { festivalRepository } from '@repositories/FestivalRepository';
import { puranRepository } from '@repositories/PuranRepository';
import { categoryRepository } from '@features/categories/CategoryRepository';
import { NotFoundError, AppError } from '@/errors/appError';
import { logger } from '@utils/logger';

export class AgentProposalService {
  async getProposals(options: {
    page?: number;
    limit?: number;
    status?: string;
    entityType?: string;
  }): Promise<{ data: AgentProposal[]; count: number }> {
    return await agentProposalRepository.list(
      options.page || 1,
      options.limit || 10,
      options.status,
      options.entityType
    );
  }

  async getProposalById(id: string): Promise<AgentProposal> {
    const proposal = await agentProposalRepository.findById(id);
    if (!proposal) throw new NotFoundError('Agent proposal not found');
    return proposal;
  }

  /**
   * Applies an approved proposal directly to the target domain entity.
   */
  async approveProposal(id: string, reviewedBy: string): Promise<AgentProposal> {
    const proposal = await this.getProposalById(id);
    if (proposal.status !== 'PENDING') {
      throw new AppError(`Cannot approve proposal in ${proposal.status} status`, 400);
    }

    // 1. Apply mutation to domain repository
    try {
      const { entityType, entityId, targetField, proposedValue } = proposal;

      if (entityType === 'bhajan') {
        if (targetField === 'short_description') {
          await bhajanRepository.updateAiMeaning(entityId, proposedValue);
        } else if (targetField === 'seo') {
          const parsed = JSON.parse(proposedValue);
          await bhajanRepository.updateSeo(entityId, parsed.seoTitle, parsed.seoDescription);
        } else {
          await bhajanRepository.update(entityId, { [targetField]: proposedValue });
        }
      } else if (entityType === 'article') {
        if (targetField === 'excerpt') {
          await articleRepository.updateExcerpt(entityId, proposedValue);
        } else if (targetField === 'seo') {
          const parsed = JSON.parse(proposedValue);
          await articleRepository.updateSeo(entityId, parsed.seoTitle, parsed.seoDescription);
        } else {
          await articleRepository.update(entityId, { [targetField]: proposedValue });
        }
      } else if (entityType === 'festival') {
        if (targetField === 'short_description') {
          await festivalRepository.updateAiDescription(entityId, proposedValue);
        } else if (targetField === 'seo') {
          const parsed = JSON.parse(proposedValue);
          await festivalRepository.updateSeo(entityId, parsed.seoTitle, parsed.seoDescription);
        } else {
          await festivalRepository.update(entityId, { [targetField]: proposedValue });
        }
      } else if (entityType === 'puran') {
        if (targetField === 'short_description') {
          await puranRepository.updateAiDescription(entityId, proposedValue);
        } else if (targetField === 'seo') {
          const parsed = JSON.parse(proposedValue);
          await puranRepository.updateSeo(entityId, parsed.seoTitle, parsed.seoDescription);
        } else {
          await puranRepository.update(entityId, { [targetField]: proposedValue });
        }
      } else if (entityType === 'category') {
        if (targetField === 'seo') {
          const parsed = JSON.parse(proposedValue);
          await categoryRepository.updateSeo(entityId, parsed.seoTitle, parsed.seoDescription);
        }
      }

      const updatedProposal = await agentProposalRepository.updateStatus(id, 'APPLIED', reviewedBy);
      logger.info({ proposalId: id, reviewedBy }, 'Agent proposal approved and applied successfully');
      return updatedProposal;
    } catch (err: any) {
      logger.error({ proposalId: id, error: err.message }, 'Failed to apply approved agent proposal');
      throw new AppError(`Failed to apply proposal to database: ${err.message}`, 500);
    }
  }

  async rejectProposal(id: string, reviewedBy: string, rejectionReason?: string): Promise<AgentProposal> {
    const proposal = await this.getProposalById(id);
    if (proposal.status !== 'PENDING') {
      throw new AppError(`Cannot reject proposal in ${proposal.status} status`, 400);
    }

    const updated = await agentProposalRepository.updateStatus(id, 'REJECTED', reviewedBy, rejectionReason);
    logger.info({ proposalId: id, reviewedBy, rejectionReason }, 'Agent proposal rejected by admin');
    return updated;
  }
}

export const agentProposalService = new AgentProposalService();
