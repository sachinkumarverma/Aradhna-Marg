export interface AgentActor {
  type: 'ADMIN' | 'SYSTEM' | 'CRON';
  id: string; // Admin username or system process identifier
}

export type AgentRunExecutionStatus =
  'CREATED' | 'RUNNING' | 'WAITING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'TIMEOUT';

export interface AgentPlanStep {
  stepNumber: number;
  description: string;
  expectedTool?: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'SKIPPED' | 'FAILED';
}

export interface AgentStepEvaluation {
  status: 'SUCCESS' | 'FAILURE' | 'INCOMPLETE' | 'OBJECTIVE_SATISFIED' | 'SAFETY_VIOLATION';
  reason: string;
  canContinue: boolean;
  safetyPassed: boolean;
  metrics?: Record<string, any>;
}

export interface AgentStepRecord {
  stepNumber: number;
  toolName: string;
  inputPayload: any;
  outputPayload: any;
  status: 'SUCCESS' | 'FAILED' | 'BLOCKED';
  durationMs: number;
  timestamp: string;
  evaluation?: AgentStepEvaluation;
}

export interface AgentMemoryState {
  stepHistory: AgentStepRecord[];
  plan: AgentPlanStep[];
  intermediateFindings: any[];
  decisions: string[];
  toolCallSignatures: string[];
  customState: Record<string, any>;
}

export interface AgentExecutionConstraints {
  maxIterations: number;
  maxToolCalls: number;
  maxRepeatedToolCalls: number;
  timeoutMs: number;
  dryRunOnly: boolean;
  allowedTools: string[];
  allowedEntityTypes: string[];
}

export interface AgentContext {
  runId: string;
  agentName: string;
  actor: AgentActor;
  currentIteration: number;
  maxIterations: number;
  tokensUsed: number;
  tokenBudget: number;

  // Multi-step Orchestration & Context Fields (Phase 6)
  objective?: string;
  currentStep?: number;
  maxSteps?: number;
  toolCallsCount?: number;
  maxToolCalls?: number;
  startTime?: number;
  timeoutMs?: number;
  memory?: AgentMemoryState;
  constraints?: AgentExecutionConstraints;
  proposalIds?: string[];
  status?: AgentRunExecutionStatus;
  terminationReason?: string;
  finalResult?: any;
  metadata?: Record<string, any>;
}

/**
 * Factory to build a strongly-typed, run-scoped AgentContext.
 */
export function createAgentContext(params: {
  runId: string;
  agentName: string;
  actor?: AgentActor;
  objective?: string;
  maxIterations?: number;
  maxToolCalls?: number;
  timeoutMs?: number;
  dryRunOnly?: boolean;
  allowedTools?: string[];
  allowedEntityTypes?: string[];
  metadata?: Record<string, any>;
}): AgentContext {
  const maxIterations = params.maxIterations ?? 25;
  const maxToolCalls = params.maxToolCalls ?? 20;
  const timeoutMs = params.timeoutMs ?? 45000;
  const dryRunOnly = params.dryRunOnly ?? true;
  const allowedTools = params.allowedTools ?? [];
  const allowedEntityTypes = params.allowedEntityTypes ?? [];

  return {
    runId: params.runId,
    agentName: params.agentName,
    actor: params.actor ?? { type: 'SYSTEM', id: params.agentName },
    objective: params.objective,
    currentIteration: 0,
    maxIterations,
    tokensUsed: 0,
    tokenBudget: 100000,
    currentStep: 0,
    maxSteps: 20,
    toolCallsCount: 0,
    maxToolCalls,
    startTime: Date.now(),
    timeoutMs,
    proposalIds: [],
    status: 'RUNNING',
    constraints: {
      maxIterations,
      maxToolCalls,
      maxRepeatedToolCalls: 3,
      timeoutMs,
      dryRunOnly,
      allowedTools,
      allowedEntityTypes
    },
    memory: {
      stepHistory: [],
      plan: [],
      intermediateFindings: [],
      decisions: [],
      toolCallSignatures: [],
      customState: {}
    },
    metadata: params.metadata ?? {}
  };
}
