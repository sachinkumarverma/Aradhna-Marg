import { AgentToolDefinition } from '../types/ToolContract';
import { logger } from '@utils/logger';

export class ToolRegistry {
  private tools: Map<string, AgentToolDefinition> = new Map();

  public register(tool: AgentToolDefinition): void {
    if (this.tools.has(tool.name)) {
      logger.warn({ toolName: tool.name }, 'Overwriting existing tool registration');
    }
    this.tools.set(tool.name, tool);
    logger.debug({ toolName: tool.name, permission: tool.permission }, 'Registered agent tool');
  }

  public get(name: string): AgentToolDefinition | undefined {
    return this.tools.get(name);
  }

  public has(name: string): boolean {
    return this.tools.has(name);
  }

  public getAll(): AgentToolDefinition[] {
    return Array.from(this.tools.values());
  }
}

export const toolRegistry = new ToolRegistry();
