import { agentRunRepository } from '../repositories/AgentRunRepository';
import { agentToolCallRepository } from '../repositories/AgentToolCallRepository';
import { toolGateway } from '../gateway/ToolGateway';
import { AgentRun, CreateAgentRunDTO } from '@models/AgentRun';
import { AgentToolCall } from '@models/AgentToolCall';
import { AgentContext } from '../types/AgentContext';
import { NotFoundError } from '@/errors/appError';
import { logger } from '@utils/logger';

export class AgentExecutionService {
  async startRun(dto: CreateAgentRunDTO): Promise<AgentRun> {
    const run = await agentRunRepository.create(dto);
    logger.info({ runId: run.id, agentName: run.agentName }, 'Started new agent execution run');
    return run;
  }

  async getRunById(id: string): Promise<{ run: AgentRun; toolCalls: AgentToolCall[] }> {
    const run = await agentRunRepository.findById(id);
    if (!run) throw new NotFoundError('Agent run not found');

    const toolCalls = await agentToolCallRepository.findByRunId(id);
    return { run, toolCalls };
  }

  async listRuns(options: {
    page?: number;
    limit?: number;
    agentName?: string;
    status?: string;
  }): Promise<{ data: AgentRun[]; count: number }> {
    return await agentRunRepository.list(options.page || 1, options.limit || 10, options.agentName, options.status);
  }

  async cancelRun(id: string): Promise<AgentRun> {
    return await agentRunRepository.updateStatus(id, 'CANCELLED', 'Cancelled by administrator');
  }

  async completeRun(id: string, result?: any): Promise<AgentRun> {
    if (result !== undefined) {
      const current = await agentRunRepository.findById(id);
      const updatedState = { ...(current?.state || {}), result };
      await agentRunRepository.updateState(id, updatedState);
    }
    return await agentRunRepository.updateStatus(id, 'COMPLETED');
  }

  async failRun(id: string, errorMessage: string): Promise<AgentRun> {
    return await agentRunRepository.updateStatus(id, 'FAILED', errorMessage);
  }

  async timeoutRun(id: string, errorMessage: string): Promise<AgentRun> {
    return await agentRunRepository.updateStatus(id, 'TIMEOUT', errorMessage);
  }

  /**
   * Dispatches a tool execution on behalf of a run through the ToolGateway.
   */
  async executeTool(toolName: string, input: any, context: AgentContext) {
    return await toolGateway.executeTool(toolName, input, context);
  }
}

export const agentExecutionService = new AgentExecutionService();
