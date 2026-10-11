import { AppError } from '@/errors/appError';

export class AgentSecurityError extends AppError {
  constructor(message = 'Agent operation blocked by security policy') {
    super(message, 403);
  }
}

export class ToolNotFoundError extends AppError {
  constructor(toolName: string) {
    super(`Agent tool '${toolName}' not found in Tool Registry`, 404);
  }
}

export class ToolValidationError extends AppError {
  constructor(message = 'Tool validation failed', errors?: any) {
    super(message, 400, errors);
  }
}

export class ToolExecutionError extends AppError {
  constructor(toolName: string, originalMessage: string) {
    super(`Error executing tool '${toolName}': ${originalMessage}`, 500);
  }
}

export class AgentIterationLimitError extends AppError {
  constructor(agentName: string, maxIterations: number) {
    super(`Agent '${agentName}' reached maximum iteration limit (${maxIterations})`, 429);
  }
}

export class AgentToolLimitError extends AppError {
  constructor(agentName: string, maxToolCalls: number) {
    super(`Agent '${agentName}' reached maximum tool calls budget (${maxToolCalls})`, 429);
  }
}

export class AgentTimeoutError extends AppError {
  constructor(agentName: string, timeoutMs: number) {
    super(`Agent execution exceeded maximum allowed timeout of ${timeoutMs}ms (Agent: ${agentName})`, 504);
  }
}

export class AgentLoopDetectedError extends AppError {
  constructor(agentName: string, patternDescription: string) {
    super(`Agent '${agentName}' execution blocked: Loop detected (${patternDescription})`, 429);
  }
}

export class AgentRecursionError extends AppError {
  constructor(agentName: string, details?: string) {
    super(
      `Agent '${agentName}' recursive invocation blocked by orchestrator firewall${details ? `: ${details}` : ''}`,
      403
    );
  }
}

export class AgentEvaluationError extends AppError {
  constructor(message: string, errors?: any) {
    super(message, 422, errors);
  }
}
