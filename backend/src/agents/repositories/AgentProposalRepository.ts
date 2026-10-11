import { db } from '@common/database/DatabaseClient';
import { AgentProposal, CreateAgentProposalDTO, AgentProposalStatus } from '@models/AgentProposal';
import { NotFoundError } from '@/errors/appError';

export class AgentProposalRepository {
  private readonly tableName = 'agent_proposals';

  private mapToModel(row: any): AgentProposal {
    return {
      id: row.id,
      runId: row.run_id,
      agentName: row.agent_name,
      entityType: row.entity_type,
      entityId: row.entity_id,
      targetField: row.target_field,
      currentValue: row.current_value,
      proposedValue: row.proposed_value,
      reasoning: row.reasoning,
      status: row.status,
      reviewedBy: row.reviewed_by,
      reviewedAt: row.reviewed_at,
      rejectionReason: row.rejection_reason,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  async create(dto: CreateAgentProposalDTO): Promise<AgentProposal> {
    const query = `
      INSERT INTO ${this.tableName} (
        run_id, agent_name, entity_type, entity_id, target_field, current_value, proposed_value, reasoning, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING')
      RETURNING *
    `;
    const params = [
      dto.runId || null,
      dto.agentName,
      dto.entityType,
      dto.entityId,
      dto.targetField,
      dto.currentValue || null,
      dto.proposedValue,
      dto.reasoning || null
    ];
    const { rows } = await db.query(query, params);
    return this.mapToModel(rows[0]);
  }

  async findById(id: string): Promise<AgentProposal | null> {
    const query = `SELECT * FROM ${this.tableName} WHERE id = $1`;
    const { rows } = await db.query(query, [id]);
    if (rows.length === 0) return null;
    return this.mapToModel(rows[0]);
  }

  async transitionStatus(
    id: string,
    fromStatuses: AgentProposalStatus[],
    toStatus: AgentProposalStatus,
    extraUpdates?: {
      reviewedBy?: string;
      rejectionReason?: string;
    }
  ): Promise<AgentProposal | null> {
    const query = `
      UPDATE ${this.tableName}
      SET status = $1::varchar,
          reviewed_by = COALESCE($2, reviewed_by),
          reviewed_at = CASE WHEN $1::varchar IN ('APPROVED', 'REJECTED') THEN NOW() ELSE reviewed_at END,
          rejection_reason = COALESCE($3, rejection_reason),
          updated_at = NOW()
      WHERE id = $4
        AND status = ANY($5::varchar[])
      RETURNING *
    `;
    const params = [
      toStatus,
      extraUpdates?.reviewedBy || null,
      extraUpdates?.rejectionReason || null,
      id,
      fromStatuses
    ];
    const { rows } = await db.query(query, params);
    if (rows.length === 0) return null;
    return this.mapToModel(rows[0]);
  }

  async updateStatus(
    id: string,
    status: AgentProposalStatus,
    reviewedBy?: string,
    rejectionReason?: string
  ): Promise<AgentProposal> {
    const query = `
      UPDATE ${this.tableName}
      SET status = $1::varchar,
          reviewed_by = COALESCE($2, reviewed_by),
          reviewed_at = CASE WHEN $1::varchar IN ('APPROVED', 'REJECTED') THEN NOW() ELSE reviewed_at END,
          rejection_reason = COALESCE($3, rejection_reason),
          updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `;
    const { rows } = await db.query(query, [status, reviewedBy || null, rejectionReason || null, id]);
    if (rows.length === 0) throw new NotFoundError('Agent proposal not found');
    return this.mapToModel(rows[0]);
  }

  async list(
    page = 1,
    limit = 10,
    status?: string,
    entityType?: string
  ): Promise<{ data: AgentProposal[]; count: number }> {
    const offset = (page - 1) * limit;
    const params: any[] = [];
    const whereClauses: string[] = [];

    if (status) {
      params.push(status);
      whereClauses.push(`status = $${params.length}`);
    }
    if (entityType) {
      params.push(entityType);
      whereClauses.push(`entity_type = $${params.length}`);
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

export const agentProposalRepository = new AgentProposalRepository();
