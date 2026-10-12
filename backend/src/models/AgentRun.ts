export type AgentRunStatus = 'CREATED' | 'RUNNING' | 'WAITING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'TIMEOUT';
export type AgentTriggerType = 'MANUAL' | 'SCHEDULED' | 'CRON' | 'EVENT' | 'WORKFLOW';

export interface AgentRun {
  id: string;
  agentName: string;
  triggerType: AgentTriggerType;
  triggeredBy?: string;
  status: AgentRunStatus;
  iterationCount: number;
  totalTokensUsed: number;
  estimatedCostUsd: number;
  errorMessage?: string;
  state: Record<string, any>;
  startedAt: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAgentRunDTO {
  agentName: string;
  triggerType: AgentTriggerType;
  triggeredBy?: string;
  state?: Record<string, any>;
}
