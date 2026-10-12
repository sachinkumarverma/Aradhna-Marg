export type AgentToolCallStatus = 'SUCCESS' | 'FAILED' | 'BLOCKED' | 'PROPOSAL_STAGED';

export interface AgentToolCall {
  id: string;
  runId: string;
  toolName: string;
  permissionTier: string;
  inputPayload: Record<string, any>;
  outputPayload?: Record<string, any>;
  durationMs: number;
  status: AgentToolCallStatus;
  errorMessage?: string;
  createdAt: string;
}

export interface CreateAgentToolCallDTO {
  runId: string;
  toolName: string;
  permissionTier: string;
  inputPayload: Record<string, any>;
  outputPayload?: Record<string, any>;
  durationMs: number;
  status: AgentToolCallStatus;
  errorMessage?: string;
}
