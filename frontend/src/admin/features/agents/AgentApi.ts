import { apiClient } from '@api/client';

export interface AgentDefinitionItem {
  id: string;
  name: string;
  description: string;
  permissionTier: string;
  allowedTools: string[];
  allowedEntityTypes: string[];
  maxIterations: number;
  maxToolCalls: number;
  timeoutMs: number;
  dryRunOnly: boolean;
}

export interface AgentRunItem {
  id: string;
  agentName: string;
  triggerType: string;
  triggeredBy?: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  iterationCount: number;
  totalTokensUsed: number;
  estimatedCostUsd: number;
  errorMessage?: string;
  state?: {
    summary?: {
      status?: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'COMPLETED' | 'FAILED';
      overview?: string;
      totalFindings?: number;
      bySeverity?: Record<string, number>;
      metrics?: Record<string, any>;
    };
    findings?: Array<{
      id?: string;
      type: string;
      severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
      entityType?: string;
      entityId?: string;
      title?: string;
      message: string;
      recommendation?: string;
      evidence?: any;
    }>;
    durationMs?: number;
    dryRun?: boolean;
    [key: string]: any;
  };
  startedAt: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentToolCallItem {
  id: string;
  runId: string;
  toolName: string;
  permissionTier: string;
  inputPayload: Record<string, any>;
  outputPayload?: Record<string, any>;
  durationMs: number;
  status: 'SUCCESS' | 'FAILED' | 'BLOCKED' | 'PROPOSAL_STAGED';
  errorMessage?: string;
  createdAt: string;
}

export interface AgentScheduleItem {
  id: string;
  agentId: string;
  agentName: string;
  description: string;
  enabled: boolean;
  scheduleInterval: 'hourly' | 'every_6_hours' | 'daily' | 'weekly';
  cronExpression: string;
  lastRunAt?: string | null;
  lastRunStatus?: 'COMPLETED' | 'FAILED' | 'SKIPPED' | null;
  lastSuccessfulRunAt?: string | null;
  nextRunAt?: string | null;
  consecutiveFailures: number;
  isRunning: boolean;
  createdAt: string;
  updatedAt: string;
}

export const AgentApi = {
  getDefinitions: async (): Promise<AgentDefinitionItem[]> => {
    const res = await apiClient.get('/admin/agents/definitions');
    return res.data?.data || [];
  },

  getDefinitionById: async (id: string): Promise<AgentDefinitionItem> => {
    const res = await apiClient.get(`/admin/agents/definitions/${id}`);
    return res.data?.data;
  },

  runAgent: async (id: string, options?: Record<string, any>): Promise<{ run: AgentRunItem; state: any }> => {
    const res = await apiClient.post(`/admin/agents/${id}/run`, options || {});
    return res.data?.data;
  },

  getRuns: async (params?: {
    page?: number;
    limit?: number;
    agentName?: string;
    status?: string;
  }): Promise<{ data: AgentRunItem[]; count: number }> => {
    const res = await apiClient.get('/admin/agents/runs', { params });
    return res.data?.data || { data: [], count: 0 };
  },

  getRunDetails: async (id: string): Promise<{ run: AgentRunItem; toolCalls: AgentToolCallItem[] }> => {
    const res = await apiClient.get(`/admin/agents/runs/${id}`);
    return res.data?.data;
  },

  getSchedules: async (): Promise<AgentScheduleItem[]> => {
    const res = await apiClient.get('/admin/agents/schedules');
    return res.data?.data || [];
  },

  updateSchedule: async (
    id: string,
    payload: { enabled?: boolean; scheduleInterval?: string; cronExpression?: string }
  ): Promise<AgentScheduleItem> => {
    const res = await apiClient.put(`/admin/agents/schedules/${id}`, payload);
    return res.data?.data;
  },

  runScheduledAgent: async (id: string): Promise<{ run: AgentRunItem; state: any }> => {
    const res = await apiClient.post(`/admin/agents/schedules/${id}/run`);
    return res.data?.data;
  }
};
