import { agentProposalRepository } from '../repositories/AgentProposalRepository';
import { agentToolCallRepository } from '../repositories/AgentToolCallRepository';
import { AgentProposal } from '@models/AgentProposal';
import { bhajanService } from '@features/bhajans/BhajanService';
import { NotFoundError, AppError } from '@/errors/appError';
import { logger } from '@utils/logger';

export class AgentProposalService {
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
          if (proposal.entityType === 'bhajan') {
            const bhajan = await bhajanService.getById(proposal.entityId);
            return {
              ...proposal,
              targetTitle: bhajan?.title || 'Unknown Bhajan'
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
      if (proposal.entityType === 'bhajan') {
        const bhajan = await bhajanService.getById(proposal.entityId);
        if (bhajan) {
          targetEntity = {
            id: bhajan.id,
            title: bhajan.title,
            slug: bhajan.slug,
            currentMeaning: bhajan.short_description || bhajan.description || null
          };
        }
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
    if (proposal.status === 'COMPLETED' || proposal.status === 'APPLIED') {
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
    if (proposal.status === 'COMPLETED' || proposal.status === 'APPLIED') {
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
   * 4. Domain service layer strictly enforced (no direct repo or db access).
   * 5. Sacred content firewall: only devotional meaning is mutated.
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
    if (proposal.status === 'COMPLETED' || proposal.status === 'APPLIED') {
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
      const { entityType, entityId, targetField, proposedValue, currentValue } = executing;

      // 2. Stale Content Protection & Domain Execution
      if (entityType === 'bhajan') {
        const currentBhajan = await bhajanService.getById(entityId);
        if (!currentBhajan) {
          throw new AppError('Target Bhajan record no longer exists or has been deleted', 404);
        }

        // Check whether underlying Bhajan meaning has changed since proposal was staged
        const liveMeaning = (currentBhajan.short_description || currentBhajan.description || '').trim();
        const expectedMeaning = (currentValue || '').trim();

        if (expectedMeaning !== '' && liveMeaning !== expectedMeaning) {
          const staleMsg = `Stale proposal detected: Bhajan meaning was modified externally after proposal creation (original: "${expectedMeaning.slice(0, 50)}...", current: "${liveMeaning.slice(0, 50)}..."). Overwrite prevented.`;
          await agentProposalRepository.updateStatus(id, 'FAILED', executedBy, staleMsg);
          logger.warn({ proposalId: id, entityId }, staleMsg);
          throw new AppError(staleMsg, 409);
        }

        // Apply mutation ONLY to the devotional meaning field via domain service
        if (targetField === 'meaning' || targetField === 'short_description') {
          await bhajanService.updateMeaning(entityId, proposedValue);
        } else {
          throw new AppError(`Unsupported target field for bhajan proposal: ${targetField}`, 400);
        }
      } else {
        throw new AppError(`Execution for entity type '${entityType}' is not supported in Phase 4A`, 400);
      }

      // 3. Record audit trail in agent_tool_calls
      const durationMs = Date.now() - startTime;
      if (executing.runId) {
        await agentToolCallRepository
          .create({
            runId: executing.runId,
            toolName: 'execute_approved_proposal',
            permissionTier: 'TIER_5_PUBLISH_OVERWRITE',
            inputPayload: { proposalId: id, executedBy, entityType, entityId, targetField },
            outputPayload: { status: 'COMPLETED', durationMs },
            durationMs,
            status: 'SUCCESS'
          })
          .catch((err) => logger.warn({ err }, 'Failed to log tool call for proposal execution'));
      }

      // 4. Mark proposal as COMPLETED
      const completed = await agentProposalRepository.updateStatus(id, 'COMPLETED', executedBy);
      logger.info(
        { proposalId: id, executedBy, durationMs },
        'Approved agent proposal executed and completed successfully'
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
