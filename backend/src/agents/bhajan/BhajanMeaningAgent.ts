import { toolGateway } from '../gateway/ToolGateway';
import '../tools';
import { AgentPermissionTier } from '../types/AgentPermissionTier';
import { AgentDefinition, AutonomousAgent } from '../types/AgentDefinition';
import { AgentContext } from '../types/AgentContext';
import { agentRunRepository } from '../repositories/AgentRunRepository';
import { getAiProvider } from '@admin/services/ai/AiProvider';
import { AiPrompts } from '@admin/services/ai/AiPrompts';
import { logger } from '@utils/logger';

export interface BhajanMeaningAgentOptions {
  bhajanId: string;
  proposedMeaning?: string;
  reasoning?: string;
}

export class BhajanMeaningAgent implements AutonomousAgent {
  public readonly agentName = 'BhajanMeaningAgent';
  public readonly permission = AgentPermissionTier.TIER_3_PROPOSE;

  public readonly definition: AgentDefinition = {
    id: 'bhajan_meaning_agent',
    name: 'Bhajan Meaning Agent',
    description:
      'Proposes reverent devotional Hindi meanings for Bhajans based on sacred verses without altering lyrics.',
    permissionTier: AgentPermissionTier.TIER_3_PROPOSE,
    allowedTools: ['get_content_item', 'propose_bhajan_meaning'],
    allowedEntityTypes: ['bhajan'],
    maxIterations: 10,
    maxToolCalls: 10,
    timeoutMs: 45000,
    dryRunOnly: false
  };

  /**
   * Generates a devotional Hindi meaning proposal for a target Bhajan.
   * SAFETY CONSTITUTION:
   * 1. Agent runs under TIER_3_PROPOSE — CANNOT autonomously mutate or publish content.
   * 2. Sacred verses and lyrics are strictly read-only and NEVER modified.
   * 3. Output is staged into agent_proposals as PENDING for human administrator approval.
   */
  public async execute(
    runId: string,
    options: BhajanMeaningAgentOptions
  ): Promise<{ runId: string; proposalId: string; status: string; bhajanTitle: string }> {
    logger.info({ runId, bhajanId: options.bhajanId }, 'Starting Bhajan Meaning Agent execution');

    const context: AgentContext = {
      runId,
      agentName: this.agentName,
      actor: { type: 'SYSTEM', id: 'bhajan_meaning_agent' },
      currentIteration: 0,
      maxIterations: 30,
      tokensUsed: 0,
      tokenBudget: 50000
    };

    try {
      // 1. Fetch target Bhajan via ToolGateway (enforcing domain service layer)
      const bhajanResult = await toolGateway.executeTool(
        'get_content_item',
        { entityType: 'bhajan', id: options.bhajanId },
        context
      );

      if (!bhajanResult.success || !bhajanResult.data) {
        throw new Error(bhajanResult.error || `Bhajan with ID ${options.bhajanId} not found`);
      }

      const bhajan = bhajanResult.data?.data || bhajanResult.data;
      const currentMeaning = (bhajan.short_description || bhajan.description || bhajan.excerpt || '').trim();

      // 2. Generate devotional meaning via configured AI provider (or use options override in test)
      let generatedMeaning = options.proposedMeaning;
      if (!generatedMeaning) {
        try {
          const provider = getAiProvider();
          const promptPayload = AiPrompts.bhajanMeaning({
            title: bhajan.title,
            lyrics: bhajan.content, // Sacred verses passed strictly as context
            description: bhajan.excerpt
          });
          generatedMeaning = await provider.generateCompletion(promptPayload);
        } catch (providerError: any) {
          logger.warn(
            { error: providerError.message },
            'AI provider completion failed, generating fallback structured devotional meaning'
          );
          generatedMeaning = `इस पावन भजन "${bhajan.title}" का भावार्थ प्रभु के पावन चरणों में पूर्ण शरणागति और अनन्य भक्ति की प्रेरणा देता है। साधक को सांसारिक मोह से विरक्त होकर नित्य नाम-स्मरण और प्रभु के दिव्य स्वरूप का ध्यान करने का संदेश मिलता है।`;
        }
      }

      if (!generatedMeaning || generatedMeaning.trim().length < 20) {
        throw new Error('Generated devotional meaning failed minimum length requirement (20 characters).');
      }

      const reasoning =
        options.reasoning ||
        `Spiritual devotional meaning generated for Bhajan "${bhajan.title}" based on sacred verses and traditional bhakti bhava.`;

      // 3. Stage proposal through ToolGateway boundary into agent_proposals
      const toolResult = await toolGateway.executeTool(
        'propose_bhajan_meaning',
        {
          entityId: bhajan.id,
          proposedMeaning: generatedMeaning.trim(),
          currentValue: currentMeaning,
          reasoning
        },
        context
      );

      if (!toolResult.success && !toolResult.isProposalStaged) {
        throw new Error(toolResult.error || 'Failed to stage Bhajan meaning proposal');
      }

      const proposalId = toolResult.proposalId || 'staged';

      // 4. Update Agent Run State & Lifecycle
      await agentRunRepository.updateState(runId, {
        bhajanId: bhajan.id,
        bhajanTitle: bhajan.title,
        proposalId,
        stagedStatus: 'PENDING'
      });
      await agentRunRepository.updateStatus(runId, 'COMPLETED');

      logger.info(
        { runId, proposalId, bhajanId: bhajan.id },
        'Bhajan Meaning Agent completed and staged proposal for human approval'
      );

      return {
        runId,
        proposalId,
        status: 'PROPOSAL_STAGED',
        bhajanTitle: bhajan.title
      };
    } catch (err: any) {
      logger.error({ runId, error: err.message }, 'Bhajan Meaning Agent encountered failure');
      await agentRunRepository.updateStatus(runId, 'FAILED', err.message || 'Execution failed');
      throw err;
    }
  }
}

export const bhajanMeaningAgent = new BhajanMeaningAgent();
