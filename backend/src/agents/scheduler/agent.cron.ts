import { agentSchedulerService } from '../services/AgentSchedulerService';
import { cronManager } from '@/cron/manager';
import { logger } from '@utils/logger';

// Register with unified CronManager so it can be triggered externally via /api/v1/cron/trigger/AutonomousAgentsMonitoring
// Checks hourly to dynamically execute any enabled agent that has reached its scheduled due time (Hourly, Every 6 Hours, Daily, Weekly)
cronManager.register({
  name: 'AutonomousAgentsMonitoring',
  description: 'Triggers all enabled autonomous monitoring agents that are due based on their database schedule',
  schedule: '0 * * * *',
  status: 'IDLE',
  run: async () => {
    logger.info('Starting AutonomousAgentsMonitoring cron execution...');
    await agentSchedulerService.runAllDueAgents();
    logger.info('AutonomousAgentsMonitoring cron execution completed.');
  }
});

// Individual agent definitions for external webhook / workflow_dispatch trigger
// Omit hardcoded daily schedule so cronManager doesn't run unintended daily timers overriding admin DB config.
cronManager.register({
  name: 'ContentQualityAgent',
  description: 'Triggers Content Quality Agent (respects schedule and due status)',
  status: 'IDLE',
  run: async () => {
    await agentSchedulerService.executeScheduledRun('content_quality_agent');
  }
});

cronManager.register({
  name: 'SeoAuditAgent',
  description: 'Triggers SEO Audit Agent (respects schedule and due status)',
  status: 'IDLE',
  run: async () => {
    await agentSchedulerService.executeScheduledRun('seo_audit_agent');
  }
});

cronManager.register({
  name: 'SystemHealthAgent',
  description: 'Triggers System Health Agent (respects schedule and due status)',
  status: 'IDLE',
  run: async () => {
    await agentSchedulerService.executeScheduledRun('system_health_agent');
  }
});

// Initialize Phase 5B Scheduled Autonomous Monitoring on startup
agentSchedulerService
  .init()
  .then(() => {
    logger.info('Phase 5B: Autonomous Agent Monitoring Cron tasks registered');
  })
  .catch((err) => {
    logger.error({ err }, 'Phase 5B: Failed to initialize Autonomous Agent Monitoring crons');
  });
