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
