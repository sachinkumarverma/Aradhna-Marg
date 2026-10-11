import { db } from '@common/database/DatabaseClient';
import { AgentToolCall, CreateAgentToolCallDTO } from '@models/AgentToolCall';

export class AgentToolCallRepository {
  private readonly tableName = 'agent_tool_calls';

  private mapToModel(row: any): AgentToolCall {
    return {
      id: row.id,
      runId: row.run_id,
      toolName: row.tool_name,
      permissionTier: row.permission_tier,
      inputPayload: row.input_payload || {},
      outputPayload: row.output_payload || {},
      durationMs: row.duration_ms || 0,
      status: row.status,
      errorMessage: row.error_message,
      createdAt: row.created_at
    };
  }

  async create(dto: CreateAgentToolCallDTO): Promise<AgentToolCall> {
    const query = `
      INSERT INTO ${this.tableName} (
        run_id, tool_name, permission_tier, input_payload, output_payload, duration_ms, status, error_message
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const params = [
      dto.runId,
      dto.toolName,
      dto.permissionTier,
      JSON.stringify(dto.inputPayload || {}),
      JSON.stringify(dto.outputPayload || {}),
      dto.durationMs || 0,
      dto.status,
      dto.errorMessage || null
    ];
    const { rows } = await db.query(query, params);
    return this.mapToModel(rows[0]);
  }

  async findByRunId(runId: string): Promise<AgentToolCall[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE run_id = $1
      ORDER BY created_at ASC
    `;
    const { rows } = await db.query(query, [runId]);
    return rows.map((r) => this.mapToModel(r));
  }
}

export const agentToolCallRepository = new AgentToolCallRepository();
