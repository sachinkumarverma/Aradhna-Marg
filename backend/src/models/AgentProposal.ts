export type AgentProposalStatus =
  'PENDING' | 'APPROVED' | 'REJECTED' | 'EXECUTING' | 'COMPLETED' | 'FAILED' | 'APPLIED';
export type AgentProposalEntityType = 'bhajan' | 'article' | 'festival' | 'puran' | 'category';

export interface AgentProposal {
  id: string;
  runId?: string;
  agentName: string;
  entityType: AgentProposalEntityType;
  entityId: string;
  targetField: string;
  currentValue?: string;
  proposedValue: string;
  reasoning?: string;
  status: AgentProposalStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAgentProposalDTO {
  runId?: string;
  agentName: string;
  entityType: AgentProposalEntityType;
  entityId: string;
  targetField: string;
  currentValue?: string;
  proposedValue: string;
  reasoning?: string;
}
