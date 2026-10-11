export interface AgentActor {
  type: 'ADMIN' | 'SYSTEM' | 'CRON';
  id: string; // Admin username or system process identifier
}

export interface AgentContext {
  runId: string;
  agentName: string;
  actor: AgentActor;
  currentIteration: number;
  maxIterations: number;
  tokensUsed: number;
  tokenBudget: number;
  metadata?: Record<string, any>;
}
