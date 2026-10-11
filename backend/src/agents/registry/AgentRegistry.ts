import { AgentDefinition, AutonomousAgent } from '../types/AgentDefinition';
import { AgentPermissionTier } from '../types/AgentPermissionTier';
import { AgentSecurityError } from '../types/errors';

export class AgentRegistry {
  private agents: Map<string, AutonomousAgent> = new Map();

  /**
   * Registers an autonomous agent with its policy definition.
   */
  public register(agent: AutonomousAgent): void {
    const def = agent.definition;
    if (!def.id) {
      throw new Error('Agent definition must have a unique id');
    }
    // Enforce autonomous safety boundary: Must be READ, ANALYZE, or PROPOSE only
    if (
      def.permissionTier !== AgentPermissionTier.TIER_1_READ &&
      def.permissionTier !== AgentPermissionTier.TIER_2_ANALYZE &&
      def.permissionTier !== AgentPermissionTier.TIER_3_PROPOSE
    ) {
      throw new AgentSecurityError(
        `Agent '${def.id}' exceeds autonomous safety boundary (${def.permissionTier}). Only TIER_1_READ, TIER_2_ANALYZE, and TIER_3_PROPOSE permitted.`
      );
    }
    this.agents.set(def.id, agent);
  }

  public get(id: string): AutonomousAgent | undefined {
    return this.agents.get(id);
  }

  public getDefinition(id: string): AgentDefinition | undefined {
    return this.agents.get(id)?.definition;
  }

  public getAll(): AutonomousAgent[] {
    return Array.from(this.agents.values());
  }

  public getAllDefinitions(): AgentDefinition[] {
    return Array.from(this.agents.values()).map((a) => a.definition);
  }

  public has(id: string): boolean {
    return this.agents.has(id);
  }
}

export const agentRegistry = new AgentRegistry();
