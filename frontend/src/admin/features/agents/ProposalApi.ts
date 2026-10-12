import { apiClient } from '@api/client';

export interface ProposalStats {
  pending: number;
  approved: number;
  rejected: number;
  executing: number;
  completed: number;
  failed: number;
  total: number;
}

export interface ProposalAuditRun {
  id: string;
  agentName: string;
  triggerType: string;
  triggeredBy?: string;
  status: string;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
}

export interface ProposalToolCall {
  id: string;
  toolName: string;
  status: string;
  permissionTier: string;
  durationMs: number;
  errorMessage?: string;
  createdAt: string;
}

export interface AgentProposalItem {
  id: string;
  runId?: string;
  agentName: string;
  entityType: 'bhajan' | 'article' | 'festival' | 'puran' | 'category';
  entityId: string;
  targetField: string;
  targetTitle?: string;
  currentValue?: string;
  proposedValue: string;
  reasoning?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXECUTING' | 'COMPLETED' | 'FAILED';
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentProposalDetail extends AgentProposalItem {
  targetEntity?: any;
  run?: ProposalAuditRun | null;
  toolCalls?: ProposalToolCall[];
}

export const ProposalApi = {
  getStats: async (): Promise<ProposalStats> => {
    const res = await apiClient.get('/admin/agents/proposals/stats');
    return (
      res.data?.data || {
        pending: 0,
        approved: 0,
        rejected: 0,
        executing: 0,
        completed: 0,
        failed: 0,
        total: 0
      }
    );
  },

  getProposals: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    entityType?: string;
    entityId?: string;
    agentName?: string;
    targetField?: string;
    search?: string;
  }): Promise<{ data: AgentProposalItem[]; count: number }> => {
    const res = await apiClient.get('/admin/agents/proposals', { params });
    return res.data?.data || { data: [], count: 0 };
  },

  getProposalById: async (id: string): Promise<AgentProposalDetail> => {
    const res = await apiClient.get(`/admin/agents/proposals/${id}`);
    return res.data?.data;
  },

  approveProposal: async (id: string) => {
    const res = await apiClient.post(`/admin/agents/proposals/${id}/approve`);
    return res.data?.data;
  },

  rejectProposal: async (id: string, rejectionReason?: string) => {
    const res = await apiClient.post(`/admin/agents/proposals/${id}/reject`, { rejectionReason });
    return res.data?.data;
  },

  executeProposal: async (id: string) => {
    const res = await apiClient.post(`/admin/agents/proposals/${id}/execute`);
    return res.data?.data;
  },

  generateBhajanMeaning: async (bhajanId: string) => {
    const res = await apiClient.post('/admin/agents/bhajan-meaning/propose', { bhajanId });
    return res.data?.data;
  },

  generateSeoProposal: async (data: {
    entityType: string;
    entityId: string;
    targetField?: string;
    proposedTitle?: string;
    proposedDescription?: string;
    reasoning?: string;
    auditIssue?: string;
  }) => {
    const res = await apiClient.post('/admin/agents/seo/propose', data);
    return res.data?.data;
  },

  generateContentImprovementProposal: async (data: {
    entityType: string;
    entityId: string;
    targetField: string;
    proposedContent?: string;
    reasoning?: string;
  }) => {
    const res = await apiClient.post('/admin/agents/content/propose', data);
    return res.data?.data;
  }
};
