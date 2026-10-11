// Tiers & Context
export * from './types/AgentPermissionTier';
export * from './types/AgentContext';
export * from './types/ToolContract';
export * from './types/AgentDefinition';
export * from './types/errors';
export * from './utils/ContentSafetyValidator';

// Registry & Gateway
export * from './registry/ToolRegistry';
export * from './registry/AgentRegistry';
export * from './gateway/ToolGateway';

// Tools
export * from './tools';

// Repositories
export * from './repositories/AgentRunRepository';
export * from './repositories/AgentToolCallRepository';
export * from './repositories/AgentProposalRepository';
export * from './repositories/AgentScheduleRepository';

// Services
export * from './services/AgentExecutionService';
export * from './services/AgentProposalService';
export * from './services/AgentRunner';
export * from './services/AgentSchedulerService';

// Orchestration (Phase 6)
export * from './orchestration/AgentMemoryManager';
export * from './orchestration/StepEvaluator';
export * from './orchestration/MultiStepOrchestrator';

// Agents
export * from './seo/SeoAuditAgent';
export * from './seo/SeoImprovementAgent';
export * from './bhajan/BhajanMeaningAgent';
export * from './content/ContentImprovementAgent';
export * from './ops/SystemHealthAgent';
export * from './content/ContentQualityAgent';

// Register Phase 5A Default Autonomous Agents
import { agentRegistry } from './registry/AgentRegistry';
import { seoAuditAgent } from './seo/SeoAuditAgent';
import { systemHealthAgent } from './ops/SystemHealthAgent';
import { contentQualityAgent } from './content/ContentQualityAgent';

export function registerDefaultAgents(): void {
  agentRegistry.register(seoAuditAgent);
  agentRegistry.register(systemHealthAgent);
  agentRegistry.register(contentQualityAgent);
}

// Automatically register defaults upon load
registerDefaultAgents();
