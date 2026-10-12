import { z } from 'zod';
import { AgentPermissionTier } from './AgentPermissionTier';
import { AgentContext } from './AgentContext';

export interface AgentToolResult<T = any> {
  success: boolean;
  data?: T;
  proposalId?: string;
  isProposalStaged?: boolean;
  message?: string;
  error?: string;
}

export interface AgentToolDefinition<TInput = any, TOutput = any> {
  name: string;
  description: string;
  inputSchema: z.ZodSchema<TInput>;
  outputSchema: z.ZodSchema<TOutput>;
  permission: AgentPermissionTier;
  requiresApproval: boolean;
  handler: (input: TInput, context: AgentContext) => Promise<TOutput>;
}
