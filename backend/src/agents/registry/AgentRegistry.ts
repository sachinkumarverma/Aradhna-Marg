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
    // Enforce Phase 5A safety boundary: Must be READ or ANALYZE only
    if (
      def.permissionTier !== AgentPermissionTier.TIER_1_READ &&
      def.permissionTier !== AgentPermissionTier.TIER_2_ANALYZE
    ) {
      throw new AgentSecurityError(
        `Agent '${def.id}' exceeds Phase 5A autonomous safety boundary. Only TIER_1_READ and TIER_2_ANALYZE permitted.`
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
