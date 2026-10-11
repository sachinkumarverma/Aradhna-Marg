import { apiClient } from '@api/client';

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

export const ProposalApi = {
  getProposals: async (params?: { page?: number; limit?: number; status?: string; entityType?: string }) => {
    const res = await apiClient.get('/admin/agents/proposals', { params });
    return res.data?.data || { data: [], count: 0 };
  },

  getProposalById: async (id: string) => {
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
