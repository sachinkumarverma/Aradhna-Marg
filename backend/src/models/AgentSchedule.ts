export type ScheduleInterval = 'hourly' | 'every_2_hours' | 'every_6_hours' | 'every_12_hours' | 'daily' | 'weekly';

export interface AgentSchedule {
  id: string;
  agentId: string;
  enabled: boolean;
  cronExpression: string;
  scheduleInterval: ScheduleInterval;
  lastRunAt?: string | null;
  lastRunStatus?: 'COMPLETED' | 'FAILED' | 'SKIPPED' | null;
  lastSuccessfulRunAt?: string | null;
  lastFailureAt?: string | null;
  lastErrorMessage?: string | null;
  consecutiveFailures: number;
  isRunning: boolean;
  currentRunId?: string | null;
  nextRunAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateAgentScheduleDTO {
  enabled?: boolean;
  scheduleInterval?: ScheduleInterval;
  cronExpression?: string;
}
