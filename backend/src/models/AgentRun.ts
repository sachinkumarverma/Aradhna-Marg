export type AgentRunStatus = 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type AgentTriggerType = 'MANUAL' | 'CRON' | 'EVENT' | 'WORKFLOW';

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
