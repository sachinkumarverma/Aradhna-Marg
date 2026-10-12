import { agentSchedulerService } from '../services/AgentSchedulerService';
import { logger } from '@utils/logger';

// Initialize Phase 5B Scheduled Autonomous Monitoring on startup
agentSchedulerService
  .init()
  .then(() => {
    logger.info('Phase 5B: Autonomous Agent Monitoring Cron tasks registered');
  })
  .catch((err) => {
    logger.error({ err }, 'Phase 5B: Failed to initialize Autonomous Agent Monitoring crons');
  });
