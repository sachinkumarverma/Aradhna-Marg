import { AgentPermissionTier } from './AgentPermissionTier';

export type FindingSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export interface AgentFinding {
  id?: string;
  type: string;
  severity: FindingSeverity;
  entityType?: string;
  entityId?: string;
  title?: string;
  message: string;
  recommendation?: string;
  evidence?: any;
}

export type HealthStatus = 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'COMPLETED' | 'FAILED';

export interface AgentRunSummary {
  status: HealthStatus;
  overview: string;
  totalFindings: number;
  bySeverity: Record<FindingSeverity, number>;
  metrics?: Record<string, any>;
}

export interface AgentRunState {
  summary: AgentRunSummary;
  findings: AgentFinding[];
  durationMs: number;
  dryRun: boolean;
  status?: HealthStatus;
  metadata?: Record<string, any>;
}

export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  permissionTier: AgentPermissionTier;
  allowedTools: string[];
  allowedEntityTypes: string[];
  maxIterations: number;
  maxToolCalls: number;
  timeoutMs: number;
  dryRunOnly: boolean;
}

export interface AutonomousAgent {
  readonly definition: AgentDefinition;
  execute(runId: string, options?: Record<string, any>): Promise<any>;
}
