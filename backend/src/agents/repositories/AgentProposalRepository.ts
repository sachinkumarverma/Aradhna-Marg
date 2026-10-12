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
    pageOrFilter:
      | number
      | {
          page?: number;
          limit?: number;
          status?: string;
          entityType?: string;
          entityId?: string;
          agentName?: string;
          targetField?: string;
          search?: string;
        } = 1,
    limitArg = 10,
    statusArg?: string,
    entityTypeArg?: string
  ): Promise<{ data: AgentProposal[]; count: number }> {
    let page: number;
    let limit: number;
    let status: string | undefined;
    let entityType: string | undefined;
    let entityId: string | undefined;
    let agentName: string | undefined;
    let targetField: string | undefined;
    let search: string | undefined;

    if (typeof pageOrFilter === 'object') {
      page = pageOrFilter.page || 1;
      limit = pageOrFilter.limit || 10;
      status = pageOrFilter.status;
      entityType = pageOrFilter.entityType;
      entityId = pageOrFilter.entityId;
      agentName = pageOrFilter.agentName;
      targetField = pageOrFilter.targetField;
      search = pageOrFilter.search;
    } else {
      page = pageOrFilter || 1;
      limit = limitArg || 10;
      const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'EXECUTING', 'COMPLETED', 'FAILED', 'ALL'];
      const validEntityTypes = ['bhajan', 'article', 'festival', 'puran', 'category'];

      if (
        statusArg &&
        validEntityTypes.includes(statusArg.toLowerCase()) &&
        entityTypeArg &&
        validStatuses.includes(entityTypeArg.toUpperCase())
      ) {
        entityType = statusArg.toLowerCase();
        status = entityTypeArg.toUpperCase();
      } else {
        status = statusArg;
        entityType = entityTypeArg;
      }
    }

    const offset = (page - 1) * limit;
    const params: any[] = [];
    const whereClauses: string[] = [];

    if (status && status !== 'ALL') {
      params.push(status);
      whereClauses.push(`status = $${params.length}`);
    }
    if (entityType && entityType !== 'ALL') {
      params.push(entityType);
      whereClauses.push(`entity_type = $${params.length}`);
    }
    if (entityId && entityId !== 'ALL') {
      params.push(entityId);
      whereClauses.push(`entity_id = $${params.length}`);
    }
    if (agentName && agentName !== 'ALL') {
      params.push(agentName);
      whereClauses.push(`agent_name = $${params.length}`);
    }
    if (targetField && targetField !== 'ALL') {
      params.push(targetField);
      whereClauses.push(`target_field = $${params.length}`);
    }
    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      params.push(term);
      whereClauses.push(
        `(id::text ILIKE $${params.length} OR entity_id::text ILIKE $${params.length} OR agent_name ILIKE $${params.length} OR target_field ILIKE $${params.length} OR reasoning ILIKE $${params.length} OR proposed_value ILIKE $${params.length})`
      );
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

  async getStats(): Promise<{
    pending: number;
    approved: number;
    rejected: number;
    executing: number;
    completed: number;
    failed: number;
    total: number;
  }> {
    const query = `
      SELECT status, COUNT(*)::int as count
      FROM ${this.tableName}
      GROUP BY status
    `;
    const { rows } = await db.query(query);
    const stats = {
      pending: 0,
      approved: 0,
      rejected: 0,
      executing: 0,
      completed: 0,
      failed: 0,
      total: 0
    };
    for (const row of rows) {
      const s = (row.status || '').toUpperCase();
      const cnt = parseInt(row.count, 10) || 0;
      if (s === 'PENDING') stats.pending = cnt;
      else if (s === 'APPROVED') stats.approved = cnt;
      else if (s === 'REJECTED') stats.rejected = cnt;
      else if (s === 'EXECUTING') stats.executing = cnt;
      else if (s === 'COMPLETED') stats.completed = cnt;
      else if (s === 'FAILED') stats.failed = cnt;
      stats.total += cnt;
    }
    return stats;
  }
}

export const agentProposalRepository = new AgentProposalRepository();
