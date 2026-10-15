import cron, { ScheduledTask } from 'node-cron';
import { agentScheduleRepository, AgentScheduleRepository } from '../repositories/AgentScheduleRepository';
import { agentRegistry } from '../registry/AgentRegistry';
import { toolRegistry } from '../registry/ToolRegistry';
import { agentRunner } from './AgentRunner';
import { AgentPermissionTier } from '../types/AgentPermissionTier';
import { AgentSchedule, ScheduleInterval } from '@models/AgentSchedule';
import { AgentSecurityError } from '../types/errors';
import { AppError, NotFoundError } from '@/errors/appError';
import { logger } from '@utils/logger';

export const SCHEDULABLE_AGENTS: readonly string[] = [
  'seo_audit_agent',
  'system_health_agent',
  'content_quality_agent'
] as const;

export const INTERVAL_TO_CRON: Record<ScheduleInterval, string> = {
  hourly: '0 * * * *',
  every_2_hours: '0 */2 * * *',
  every_6_hours: '0 */6 * * *',
  every_12_hours: '0 */12 * * *',
  daily: '0 4 * * *',
  weekly: '0 4 * * 0'
};

export class AgentSchedulerService {
  private activeTasks: Map<string, ScheduledTask> = new Map();
  private repository: AgentScheduleRepository;

  constructor(repository: AgentScheduleRepository = agentScheduleRepository) {
    this.repository = repository;
  }

  public getSchedulableAgents(): readonly string[] {
    return SCHEDULABLE_AGENTS;
  }

  /**
   * Calculates the next execution timestamp based on schedule interval.
   */
  public calculateNextRun(interval: ScheduleInterval, fromDate: Date = new Date(), agentId?: string): Date {
    const next = new Date(fromDate);
    next.setUTCSeconds(0, 0);

    switch (interval) {
      case 'hourly': {
        next.setUTCHours(next.getUTCHours() + 1, 0, 0, 0);
        return next;
      }
      case 'every_2_hours': {
        next.setUTCHours(next.getUTCHours() + 2, 0, 0, 0);
        return next;
      }
      case 'every_6_hours': {
        next.setUTCHours(next.getUTCHours() + 6, 0, 0, 0);
        return next;
      }
      case 'every_12_hours': {
        next.setUTCHours(next.getUTCHours() + 12, 0, 0, 0);
        return next;
      }
      case 'daily': {
        // Staggered daily runs: Content Quality at 2:00 AM, SEO Audit at 3:00 AM, System Health at 4:00 AM UTC
        const hour = agentId === 'content_quality_agent' ? 2 : agentId === 'seo_audit_agent' ? 3 : 4;
        const target = new Date(fromDate);
        target.setUTCHours(hour, 0, 0, 0);
        if (target <= fromDate) {
          target.setUTCDate(target.getUTCDate() + 1);
        }
        return target;
      }
      case 'weekly': {
        const target = new Date(fromDate);
        target.setUTCDate(target.getUTCDate() + 7);
        target.setUTCHours(4, 0, 0, 0);
        return target;
      }
      default: {
        next.setUTCHours(next.getUTCHours() + 6, 0, 0, 0);
        return next;
      }
    }
  }

  /**
   * Enforces server-side policy on schedulable agents and minimum schedule frequency.
   */
  public validateSchedulableAgent(agentId: string): void {
    // 1. Allowlist check
    if (!SCHEDULABLE_AGENTS.includes(agentId as any)) {
      throw new AgentSecurityError(
        `Agent '${agentId}' is not approved for autonomous scheduling. Only approved read/analyze monitoring agents may be scheduled.`
      );
    }

    // 2. Registry check
    const agent = agentRegistry.get(agentId);
    if (!agent) {
      throw new NotFoundError(`Agent '${agentId}' is not registered in the autonomous agent registry.`);
    }

    // 3. Permission Tier check: Monitoring agents must be strictly read/analyze
    const def = agent.definition;
    if (
      def.permissionTier !== AgentPermissionTier.TIER_1_READ &&
      def.permissionTier !== AgentPermissionTier.TIER_2_ANALYZE
    ) {
      throw new AgentSecurityError(
        `Agent '${agentId}' has permission tier ${def.permissionTier}. Mutation-capable agents cannot be scheduled.`
      );
    }

    // 4. Tool safety check: All allowed tools must be read-only
    for (const toolName of def.allowedTools) {
      const tool = toolRegistry.get(toolName);
      if (tool) {
        if (
          tool.requiresApproval ||
          (tool.permission !== AgentPermissionTier.TIER_1_READ &&
            tool.permission !== AgentPermissionTier.TIER_2_ANALYZE)
        ) {
          throw new AgentSecurityError(
            `Agent '${agentId}' contains mutation-capable tool '${toolName}'. Cannot be scheduled.`
          );
        }
      }
    }
  }

  /**
   * Validates schedule interval and frequency (minimum 1 hour).
   */
  public validateScheduleFrequency(
    interval?: string,
    customCron?: string,
    agentId?: string
  ): { interval: ScheduleInterval; cron: string } {
    // If custom cron expression is passed, validate syntax and enforce minimum 1-hour frequency
    if (customCron) {
      if (!cron.validate(customCron)) {
        throw new AppError('Invalid cron expression format. Must be standard 5-part cron syntax.', 400);
      }
      const parts = customCron.trim().split(/\s+/);
      const minutePart = parts[0];
      if (minutePart === '*' || minutePart.startsWith('*/') || minutePart.includes(',')) {
        throw new AppError(
          'Schedule frequency cannot be more frequent than once per hour (minute must be a fixed value, e.g. 0).',
          400
        );
      }
      const matchedInterval =
        (Object.keys(INTERVAL_TO_CRON) as ScheduleInterval[]).find((key) => INTERVAL_TO_CRON[key] === customCron) ||
        'daily';
      return { interval: matchedInterval, cron: customCron };
    }

    if (interval && interval in INTERVAL_TO_CRON) {
      const typedInterval = interval as ScheduleInterval;
      if (typedInterval === 'daily' && agentId) {
        const hour = agentId === 'content_quality_agent' ? 2 : agentId === 'seo_audit_agent' ? 3 : 4;
        return { interval: 'daily', cron: `0 ${hour} * * *` };
      }
      return { interval: typedInterval, cron: INTERVAL_TO_CRON[typedInterval] };
    }

    throw new AppError(
      `Unsupported schedule interval '${interval}'. Supported intervals: hourly, every_2_hours, every_6_hours, every_12_hours, daily, weekly.`,
      400
    );
  }

  /**
   * Initializes scheduler: recovers stale locks and registers active crons.
   */
  public async init(): Promise<void> {
    try {
      // 1. Recover any stale locks from previous crashes
      await this.repository.clearStaleLocks(30);

      // 2. Load all schedules from database
      const schedules = await this.repository.findAll();

      for (const schedule of schedules) {
        if (schedule.enabled) {
          this.scheduleCronTask(schedule);
        }
      }

      logger.info(
        { activeCount: this.activeTasks.size },
        'Phase 5B Scheduled Autonomous Monitoring initialized successfully'
      );
    } catch (err: any) {
      logger.error({ error: err.message }, 'Failed to initialize agent scheduler');
    }
  }

  /**
   * Registers a single in-memory cron task.
   */
  private scheduleCronTask(schedule: AgentSchedule): void {
    if (this.activeTasks.has(schedule.agentId)) {
      this.activeTasks.get(schedule.agentId)?.stop();
      this.activeTasks.delete(schedule.agentId);
    }

    const task = cron.schedule(
      schedule.cronExpression,
      async () => {
        logger.info({ agentId: schedule.agentId }, 'Triggering scheduled execution of autonomous agent');
        try {
          await this.executeScheduledRun(schedule.agentId);
        } catch (err: any) {
          logger.error({ agentId: schedule.agentId, error: err.message }, 'Scheduled execution error caught');
        }
      },
      { name: `agent_${schedule.agentId}` }
    );

    this.activeTasks.set(schedule.agentId, task);
    logger.info(
      { agentId: schedule.agentId, cron: schedule.cronExpression, interval: schedule.scheduleInterval },
      'Registered autonomous agent cron task'
    );
  }

  /**
   * Core scheduled execution orchestrator with distributed locking and duplicate-run protection.
   */
  public async executeScheduledRun(
    agentId: string
  ): Promise<{ success: boolean; skipped?: boolean; reason?: string; runId?: string; run?: any; state?: any }> {
    // 1. Server-side policy verification
    this.validateSchedulableAgent(agentId);

    // 2. Distributed Concurrency Lock
    const locked = await this.repository.acquireLock(agentId);
    if (!locked) {
      logger.warn(
        { agentId },
        'Scheduled execution skipped: agent is already executing or disabled in another process'
      );
      return {
        success: false,
        skipped: true,
        reason: 'ALREADY_RUNNING'
      };
    }

    logger.info({ agentId }, 'Claimed distributed execution lock for scheduled agent');

    try {
      // 3. Delegate to common AgentRunner with SCHEDULED trigger type
      const executionResult = await agentRunner.run(agentId, {
        triggerType: 'SCHEDULED',
        actor: { type: 'SYSTEM', id: 'agent_scheduler' }
      });

      // 4. Calculate next run and release lock
      const nextRunAt = this.calculateNextRun(locked.scheduleInterval, new Date(), agentId);
      await this.repository.releaseLock(agentId, true, undefined, nextRunAt);

      logger.info(
        { agentId, runId: executionResult.run.id, findingsCount: executionResult.state.findings?.length || 0 },
        'Scheduled agent execution completed successfully'
      );

      return {
        success: true,
        runId: executionResult.run.id,
        run: executionResult.run,
        state: executionResult.state
      };
    } catch (err: any) {
      const errorMessage = err.message || 'Scheduled execution failed';
      logger.error({ agentId, error: errorMessage }, 'Scheduled agent execution encountered failure');

      // Release lock with failure status
      const nextRunAt = this.calculateNextRun(locked.scheduleInterval, new Date(), agentId);
      await this.repository.releaseLock(agentId, false, errorMessage, nextRunAt);

      return {
        success: false,
        reason: errorMessage
      };
    }
  }

  /**
   * Triggers an immediate manual run of a scheduled agent via the same AgentRunner.
   */
  public async executeManualRun(agentId: string, triggeredBy: string): Promise<any> {
    // 1. Validate policy
    this.validateSchedulableAgent(agentId);

    // 2. Check lock to prevent collision with scheduled run
    const current = await this.repository.findByAgentId(agentId);
    if (current && current.isRunning) {
      throw new AppError(`Agent '${agentId}' is currently executing. Please wait for the current run to finish.`, 409);
    }

    // 3. Acquire lock for manual run
    await this.repository.acquireLock(agentId);

    try {
      // 4. Run via standard AgentRunner
      const executionResult = await agentRunner.run(agentId, {
        triggerType: 'MANUAL',
        actor: { type: 'ADMIN', id: triggeredBy }
      });

      // 5. Release lock
      const nextRunAt = current ? this.calculateNextRun(current.scheduleInterval, new Date(), agentId) : undefined;
      await this.repository.releaseLock(agentId, true, undefined, nextRunAt);

      return executionResult;
    } catch (err: any) {
      const nextRunAt = current ? this.calculateNextRun(current.scheduleInterval, new Date(), agentId) : undefined;
      await this.repository.releaseLock(agentId, false, err.message, nextRunAt);
      throw err;
    }
  }

  /**
   * Retrieves all registered agent schedules enriched with agent definition metadata.
   */
  public async getSchedules(): Promise<any[]> {
    const schedules = await this.repository.findAll();
    return schedules.map((sch) => {
      const def = agentRegistry.getDefinition(sch.agentId);
      return {
        ...sch,
        agentName: def?.name || sch.agentId,
        description: def?.description || '',
        permissionTier: def?.permissionTier || 'TIER_1_READ',
        allowedEntityTypes: def?.allowedEntityTypes || [],
        timeoutMs: def?.timeoutMs || 30000
      };
    });
  }

  /**
   * Updates an agent schedule's settings (enabled/disabled, schedule interval).
   */
  public async updateSchedule(
    agentId: string,
    data: { enabled?: boolean; scheduleInterval?: string; cronExpression?: string }
  ): Promise<AgentSchedule> {
    this.validateSchedulableAgent(agentId);

    const existing = await this.repository.findByAgentId(agentId);
    if (!existing) {
      throw new NotFoundError(`Schedule for agent '${agentId}' not found.`);
    }

    let interval = existing.scheduleInterval;
    let cronExpr = existing.cronExpression;

    if (data.scheduleInterval || data.cronExpression) {
      const validated = this.validateScheduleFrequency(
        data.scheduleInterval || existing.scheduleInterval,
        data.cronExpression,
        agentId
      );
      interval = validated.interval;
      cronExpr = validated.cron;
    }

    const nextRunAt = this.calculateNextRun(interval, new Date(), agentId);

    const updated = await this.repository.updateSchedule(agentId, {
      enabled: data.enabled !== undefined ? data.enabled : existing.enabled,
      scheduleInterval: interval,
      cronExpression: cronExpr,
      nextRunAt
    });

    if (!updated) {
      throw new AppError('Failed to update schedule in database', 500);
    }

    // Reschedule in-memory cron
    if (updated.enabled) {
      this.scheduleCronTask(updated);
    } else if (this.activeTasks.has(agentId)) {
      this.activeTasks.get(agentId)?.stop();
      this.activeTasks.delete(agentId);
    }

    return updated;
  }

  /**
   * Executes all active and enabled autonomous agents that are due based on their schedule.
   * Evaluates nextRunAt from database so intervals (hourly, every 6 hours, daily, weekly)
   * configured by admin in the UI are respected dynamically.
   */
  public async runAllDueAgents(force = false): Promise<Record<string, any>> {
    const schedules = await this.repository.findAll();
    const results: Record<string, any> = {};
    const now = new Date();

    for (const schedule of schedules) {
      if (schedule.enabled) {
        // Run if forced, or if nextRunAt has arrived or was never set
        const isDue = force || !schedule.nextRunAt || new Date(schedule.nextRunAt) <= now;
        if (!isDue) {
          logger.info(
            { agentId: schedule.agentId, nextRunAt: schedule.nextRunAt, interval: schedule.scheduleInterval },
            'Agent is not due yet, skipping'
          );
          results[schedule.agentId] = { skipped: true, reason: 'NOT_DUE', nextRunAt: schedule.nextRunAt };
          continue;
        }

        try {
          logger.info(
            { agentId: schedule.agentId, interval: schedule.scheduleInterval },
            'Triggering due agent via runAllDueAgents'
          );
          results[schedule.agentId] = await this.executeScheduledRun(schedule.agentId);
        } catch (err: any) {
          logger.error({ agentId: schedule.agentId, err: err.message }, 'Failed execution in runAllDueAgents');
          results[schedule.agentId] = { success: false, error: err.message };
        }
      }
    }

    return results;
  }
}

export const agentSchedulerService = new AgentSchedulerService();
