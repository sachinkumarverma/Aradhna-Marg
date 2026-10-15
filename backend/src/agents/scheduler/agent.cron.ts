import { agentSchedulerService } from '../services/AgentSchedulerService';
import { cronManager } from '@/cron/manager';
import { logger } from '@utils/logger';

// Register with unified CronManager so it can be triggered externally via /api/v1/cron/trigger/AutonomousAgentsMonitoring
cronManager.register({
  name: 'AutonomousAgentsMonitoring',
  description: 'Triggers all enabled autonomous monitoring agents (Content Quality, SEO Audit, System Health)',
  schedule: '0 4 * * *',
  status: 'IDLE',
  run: async () => {
    logger.info('Starting AutonomousAgentsMonitoring cron execution...');
    await agentSchedulerService.runAllDueAgents();
    logger.info('AutonomousAgentsMonitoring cron execution completed.');
  }
});

// Also allow individual agent triggers via external cron
cronManager.register({
  name: 'ContentQualityAgent',
  description: 'Triggers Content Quality Agent (02:00 AM UTC)',
  schedule: '0 2 * * *',
  status: 'IDLE',
  run: async () => {
    await agentSchedulerService.executeScheduledRun('content_quality_agent');
  }
});

cronManager.register({
  name: 'SeoAuditAgent',
  description: 'Triggers SEO Audit Agent (03:00 AM UTC)',
  schedule: '0 3 * * *',
  status: 'IDLE',
  run: async () => {
    await agentSchedulerService.executeScheduledRun('seo_audit_agent');
  }
});

cronManager.register({
  name: 'SystemHealthAgent',
  description: 'Triggers System Health Agent (04:00 AM UTC)',
  schedule: '0 4 * * *',
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
