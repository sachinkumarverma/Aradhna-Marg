import { db } from '@common/database/DatabaseClient';
import { AgentRun, CreateAgentRunDTO, AgentRunStatus } from '@models/AgentRun';

export class AgentRunRepository {
  private readonly tableName = 'agent_runs';

  private mapToModel(row: any): AgentRun {
    return {
      id: row.id,
      agentName: row.agent_name,
      triggerType: row.trigger_type,
      triggeredBy: row.triggered_by,
      status: row.status,
      iterationCount: row.iteration_count || 0,
      totalTokensUsed: row.total_tokens_used || 0,
      estimatedCostUsd: parseFloat(row.estimated_cost_usd || '0'),
      errorMessage: row.error_message,
      state: row.state || {},
      startedAt: row.started_at,
      completedAt: row.completed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  async create(dto: CreateAgentRunDTO): Promise<AgentRun> {
    const query = `
      INSERT INTO ${this.tableName} (agent_name, trigger_type, triggered_by, state, status)
      VALUES ($1, $2, $3, $4, 'RUNNING')
      RETURNING *
    `;
    const params = [dto.agentName, dto.triggerType, dto.triggeredBy || null, JSON.stringify(dto.state || {})];
    const { rows } = await db.query(query, params);
    return this.mapToModel(rows[0]);
  }

  async findById(id: string): Promise<AgentRun | null> {
    const { rows } = await db.query(`SELECT * FROM ${this.tableName} WHERE id = $1`, [id]);
    if (rows.length === 0) return null;
    return this.mapToModel(rows[0]);
  }

  async updateStatus(id: string, status: AgentRunStatus, errorMessage?: string): Promise<AgentRun> {
    let updateClause = `status = $1, updated_at = NOW()`;
    const params: any[] = [status];
    let paramIndex = 2;

    if (errorMessage !== undefined) {
      updateClause += `, error_message = $${paramIndex}`;
      params.push(errorMessage);
      paramIndex++;
    }

    if (status === 'COMPLETED' || status === 'FAILED' || status === 'CANCELLED') {
      updateClause += `, completed_at = NOW()`;
    }

    params.push(id);
    const query = `
      UPDATE ${this.tableName}
      SET ${updateClause}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    const { rows } = await db.query(query, params);
    return this.mapToModel(rows[0]);
  }

  async updateState(id: string, state: Record<string, any>): Promise<AgentRun> {
    const query = `
      UPDATE ${this.tableName}
      SET state = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    const { rows } = await db.query(query, [JSON.stringify(state), id]);
    return this.mapToModel(rows[0]);
  }

  async incrementIteration(id: string, tokensDelta = 0): Promise<void> {
    const query = `
      UPDATE ${this.tableName}
      SET iteration_count = iteration_count + 1,
          total_tokens_used = total_tokens_used + $1,
          updated_at = NOW()
      WHERE id = $2
    `;
    await db.query(query, [tokensDelta, id]);
  }

  async list(page = 1, limit = 10, agentName?: string, status?: string): Promise<{ data: AgentRun[]; count: number }> {
    const offset = (page - 1) * limit;
    const params: any[] = [];
    const whereClauses: string[] = [];

    if (agentName) {
      params.push(agentName);
      whereClauses.push(`agent_name = $${params.length}`);
    }
    if (status) {
      params.push(status);
      whereClauses.push(`status = $${params.length}`);
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const dataQuery = `
      SELECT * FROM ${this.tableName}
      ${whereStr}
      ORDER BY created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    const countQuery = `SELECT COUNT(*) as total FROM ${this.tableName} ${whereStr}`;

    const [dataResult, countResult] = await Promise.all([
      db.query(dataQuery, [...params, limit, offset]),
      db.query(countQuery, params)
    ]);

    return {
      data: dataResult.rows.map((r) => this.mapToModel(r)),
      count: parseInt(countResult.rows[0].total, 10) || 0
    };
  }
}

export const agentRunRepository = new AgentRunRepository();
