/**
 * Agent Permission Tiers as established in ADR 006 and AGENTS.md
 */
export enum AgentPermissionTier {
  TIER_1_READ = 'TIER_1_READ',
  TIER_2_ANALYZE = 'TIER_2_ANALYZE',
  TIER_3_PROPOSE = 'TIER_3_PROPOSE',
  TIER_4_MODIFY_DRAFT = 'TIER_4_MODIFY_DRAFT',
  TIER_5_PUBLISH_OVERWRITE = 'TIER_5_PUBLISH_OVERWRITE',
  TIER_6_DESTRUCTIVE = 'TIER_6_DESTRUCTIVE'
}

export function isAutonomousAllowed(tier: AgentPermissionTier): boolean {
  return (
    tier === AgentPermissionTier.TIER_1_READ ||
    tier === AgentPermissionTier.TIER_2_ANALYZE ||
    tier === AgentPermissionTier.TIER_3_PROPOSE ||
    tier === AgentPermissionTier.TIER_4_MODIFY_DRAFT
  );
}

export function requiresHumanApproval(tier: AgentPermissionTier): boolean {
  return tier === AgentPermissionTier.TIER_5_PUBLISH_OVERWRITE;
}

export function isForbiddenAutonomously(tier: AgentPermissionTier): boolean {
  return tier === AgentPermissionTier.TIER_6_DESTRUCTIVE;
}
