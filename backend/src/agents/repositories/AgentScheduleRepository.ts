import { db } from '@common/database/DatabaseClient';
import { AgentSchedule, ScheduleInterval } from '@models/AgentSchedule';

export class AgentScheduleRepository {
  private readonly tableName = 'agent_schedules';

  private mapRow(row: any): AgentSchedule {
    return {
      id: row.id,
      agentId: row.agent_id,
      enabled: row.enabled,
      cronExpression: row.cron_expression,
      scheduleInterval: row.schedule_interval as ScheduleInterval,
      lastRunAt: row.last_run_at ? new Date(row.last_run_at).toISOString() : null,
      lastRunStatus: row.last_run_status || null,
      lastSuccessfulRunAt: row.last_successful_run_at ? new Date(row.last_successful_run_at).toISOString() : null,
      lastFailureAt: row.last_failure_at ? new Date(row.last_failure_at).toISOString() : null,
      lastErrorMessage: row.last_error_message,
      consecutiveFailures: Number(row.consecutive_failures || 0),
      isRunning: Boolean(row.is_running),
      currentRunId: row.current_run_id,
      nextRunAt: row.next_run_at ? new Date(row.next_run_at).toISOString() : null,
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString()
    };
  }

  public async findAll(): Promise<AgentSchedule[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      ORDER BY agent_id ASC
    `;
    const result = await db.query(query);
    return result.rows.map((r) => this.mapRow(r));
  }

  public async findByAgentId(agentId: string): Promise<AgentSchedule | null> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE agent_id = $1
    `;
    const result = await db.query(query, [agentId]);
    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  /**
   * Distributed Concurrency Guard:
   * Atomically claims execution lock if enabled and not currently running.
   * Auto-recovers stale locks older than 30 minutes.
   */
  public async acquireLock(agentId: string, runId?: string): Promise<AgentSchedule | null> {
    const query = `
      UPDATE ${this.tableName}
      SET is_running = true,
          current_run_id = $2,
          last_run_at = NOW(),
          updated_at = NOW()
      WHERE agent_id = $1
        AND enabled = true
        AND (is_running = false OR last_run_at < NOW() - INTERVAL '30 minutes')
      RETURNING *;
    `;
    const result = await db.query(query, [agentId, runId || null]);
    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  /**
   * Releases distributed lock upon execution finish.
   * Updates success/failure timestamps, consecutive failure counts, and next scheduled run.
   */
  public async releaseLock(
    agentId: string,
    success: boolean,
    errorMessage?: string,
    nextRunAt?: Date
  ): Promise<AgentSchedule | null> {
    const query = `
      UPDATE ${this.tableName}
      SET is_running = false,
          current_run_id = NULL,
          last_run_status = (CASE WHEN $2 = true THEN 'COMPLETED' ELSE 'FAILED' END),
          last_successful_run_at = (CASE WHEN $2 = true THEN NOW() ELSE last_successful_run_at END),
          last_failure_at = (CASE WHEN $2 = false THEN NOW() ELSE last_failure_at END),
          last_error_message = (CASE WHEN $2 = false THEN $3 ELSE NULL END),
          consecutive_failures = (CASE WHEN $2 = true THEN 0 ELSE consecutive_failures + 1 END),
          next_run_at = COALESCE($4, next_run_at),
          updated_at = NOW()
      WHERE agent_id = $1
      RETURNING *;
    `;
    const result = await db.query(query, [
      agentId,
      success,
      errorMessage || null,
      nextRunAt ? nextRunAt.toISOString() : null
    ]);
    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  public async updateSchedule(
    agentId: string,
    data: {
      enabled?: boolean;
      scheduleInterval?: ScheduleInterval;
      cronExpression?: string;
      nextRunAt?: Date;
    }
  ): Promise<AgentSchedule | null> {
    const setClauses: string[] = ['updated_at = NOW()'];
    const params: any[] = [agentId];
    let paramIndex = 2;

    if (data.enabled !== undefined) {
      setClauses.push(`enabled = $${paramIndex++}`);
      params.push(data.enabled);
    }
    if (data.scheduleInterval !== undefined) {
      setClauses.push(`schedule_interval = $${paramIndex++}`);
      params.push(data.scheduleInterval);
    }
    if (data.cronExpression !== undefined) {
      setClauses.push(`cron_expression = $${paramIndex++}`);
      params.push(data.cronExpression);
    }
    if (data.nextRunAt !== undefined) {
      setClauses.push(`next_run_at = $${paramIndex}`);
      params.push(data.nextRunAt.toISOString());
    }

    const query = `
      UPDATE ${this.tableName}
      SET ${setClauses.join(', ')}
      WHERE agent_id = $1
      RETURNING *;
    `;
    const result = await db.query(query, params);
    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  public async clearStaleLocks(maxAgeMinutes = 30): Promise<number> {
    const query = `
      UPDATE ${this.tableName}
      SET is_running = false,
          current_run_id = NULL,
          updated_at = NOW()
      WHERE is_running = true
        AND last_run_at < NOW() - ($1 || ' minutes')::interval
      RETURNING id;
    `;
    const result = await db.query(query, [maxAgeMinutes]);
    return result.rowCount || 0;
  }
}

export const agentScheduleRepository = new AgentScheduleRepository();
