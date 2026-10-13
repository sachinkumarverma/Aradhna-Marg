import { PoolClient } from 'pg';
import { db } from '@common/database/DatabaseClient';
import {
  Payment,
  CreatePaymentDTO,
  PaymentStatus,
  PaymentFilterParams,
  PaymentStats,
  SupporterSummaryItem,
  SupporterListItem,
  DonationOverviewData,
  DonationReportSummary,
  ReconciliationResult,
  ReconciliationStatus,
  PaymentRefundRecord,
  PaymentAuditLog
} from '@models/Payment';
import { PaymentStateMachine } from '@services/payment/PaymentStateMachine';
import { AppError } from '@/errors/appError';

export class PaymentRepository {
  private readonly tableName = 'payments';

  /**
   * Computes an inclusive upper date boundary: [startDate, nextDayStart)
   * Prevents end-date truncations from dropping transactions after UTC midnight.
   */
  public getInclusiveEndDate(endDateStr: string): Date {
    const trimmed = endDateStr.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [year, month, day] = trimmed.split('-').map(Number);
      return new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0, 0));
    }
    const d = new Date(trimmed);
    if (d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0 && d.getUTCMilliseconds() === 0) {
      return new Date(d.getTime() + 24 * 60 * 60 * 1000);
    }
    return new Date(d.getTime() + 1000);
  }

  private mapToModel(row: any): Payment {
    return {
      id: row.id,
      supporterName: row.supporter_name || undefined,
      supporterEmail: row.supporter_email || undefined,
      supporterPhone: row.supporter_phone || undefined,
      amount: parseFloat(row.amount),
      currency: row.currency || 'INR',
      status: row.status as PaymentStatus,
      paymentGateway: row.payment_gateway || 'RAZORPAY',
      gatewayOrderId: row.gateway_order_id || undefined,
      gatewayPaymentId: row.gateway_payment_id || undefined,
      gatewaySignature: row.gateway_signature || undefined,
      paymentMethod: row.payment_method || undefined,
      isAnonymous: !!row.is_anonymous,
      source: row.source || 'WEBSITE_DONATION',
      notes: row.notes || undefined,
      receiptNumber: row.receipt_number || undefined,
      failureReason: row.failure_reason || undefined,
      refundAmount: parseFloat(row.refund_amount || 0),
      refundReason: row.refund_reason || undefined,
      metadata: typeof row.metadata === 'object' && row.metadata !== null ? row.metadata : {},
      paidAt: row.paid_at || undefined,
      refundedAt: row.refunded_at || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * Creates a new payment record in the database.
   */
  public async create(data: CreatePaymentDTO, client?: PoolClient): Promise<Payment> {
    const query = `
      INSERT INTO ${this.tableName} (
        supporter_name,
        supporter_email,
        supporter_phone,
        amount,
        currency,
        status,
        payment_gateway,
        gateway_order_id,
        gateway_payment_id,
        gateway_signature,
        payment_method,
        is_anonymous,
        source,
        notes,
        receipt_number,
        metadata
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
      )
      RETURNING *
    `;

    const values = [
      data.supporterName || null,
      data.supporterEmail || null,
      data.supporterPhone || null,
      data.amount,
      data.currency || 'INR',
      'CREATED',
      data.paymentGateway || 'RAZORPAY',
      data.gatewayOrderId || null,
      data.gatewayPaymentId || null,
      data.gatewaySignature || null,
      data.paymentMethod || null,
      data.isAnonymous ?? false,
      data.source || 'WEBSITE_DONATION',
      data.notes || null,
      data.receiptNumber || null,
      JSON.stringify(data.metadata || {})
    ];

    const executor = client || db;
    const { rows } = await executor.query(query, values);
    return this.mapToModel(rows[0]);
  }

  /**
   * Finds a payment record by internal UUID.
   */
  public async findById(id: string, client?: PoolClient): Promise<Payment | null> {
    const query = `SELECT * FROM ${this.tableName} WHERE id = $1 LIMIT 1`;
    const executor = client || db;
    const { rows } = await executor.query(query, [id]);
    return rows.length > 0 ? this.mapToModel(rows[0]) : null;
  }

  /**
   * Finds a payment record by gateway order ID (e.g. order_O123456789).
   */
  public async findByGatewayOrderId(orderId: string, client?: PoolClient): Promise<Payment | null> {
    const query = `SELECT * FROM ${this.tableName} WHERE gateway_order_id = $1 LIMIT 1`;
    const executor = client || db;
    const { rows } = await executor.query(query, [orderId]);
    return rows.length > 0 ? this.mapToModel(rows[0]) : null;
  }

  /**
   * Finds a payment record by gateway payment ID (e.g. pay_P123456789).
   */
  public async findByGatewayPaymentId(paymentId: string, client?: PoolClient): Promise<Payment | null> {
    const query = `SELECT * FROM ${this.tableName} WHERE gateway_payment_id = $1 LIMIT 1`;
    const executor = client || db;
    const { rows } = await executor.query(query, [paymentId]);
    return rows.length > 0 ? this.mapToModel(rows[0]) : null;
  }

  /**
   * Checks if a gateway payment transaction already exists with SUCCESS status.
   */
  public async checkDuplicateGatewayTransaction(gatewayPaymentId: string): Promise<boolean> {
    const query = `
      SELECT id FROM ${this.tableName}
      WHERE gateway_payment_id = $1 AND status = 'SUCCESS'
      LIMIT 1
    `;
    const { rows } = await db.query(query, [gatewayPaymentId]);
    return rows.length > 0;
  }

  /**
   * Updates status and optional metadata/error fields for an existing payment.
   */
  public async updatePaymentStatus(
    id: string,
    status: PaymentStatus,
    extra?: {
      paidAt?: Date;
      refundedAt?: Date;
      failureReason?: string;
      gatewayPaymentId?: string;
      gatewaySignature?: string;
      paymentMethod?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<Payment | null> {
    const setClauses: string[] = ['status = $2', 'updated_at = NOW()'];
    const values: any[] = [id, status];
    let paramIndex = 3;

    if (extra?.paidAt !== undefined) {
      setClauses.push(`paid_at = $${paramIndex++}`);
      values.push(extra.paidAt);
    }
    if (extra?.refundedAt !== undefined) {
      setClauses.push(`refunded_at = $${paramIndex++}`);
      values.push(extra.refundedAt);
    }
    if (extra?.failureReason !== undefined) {
      setClauses.push(`failure_reason = $${paramIndex++}`);
      values.push(extra.failureReason);
    }
    if (extra?.gatewayPaymentId !== undefined) {
      setClauses.push(`gateway_payment_id = $${paramIndex++}`);
      values.push(extra.gatewayPaymentId);
    }
    if (extra?.gatewaySignature !== undefined) {
      setClauses.push(`gateway_signature = $${paramIndex++}`);
      values.push(extra.gatewaySignature);
    }
    if (extra?.paymentMethod !== undefined) {
      setClauses.push(`payment_method = $${paramIndex++}`);
      values.push(extra.paymentMethod);
    }
    if (extra?.metadata !== undefined) {
      setClauses.push(`metadata = metadata || $${paramIndex}::jsonb`);
      values.push(JSON.stringify(extra.metadata));
    }

    const query = `
      UPDATE ${this.tableName}
      SET ${setClauses.join(', ')}
      WHERE id = $1
      RETURNING *
    `;

    const { rows } = await db.query(query, values);
    return rows.length > 0 ? this.mapToModel(rows[0]) : null;
  }

  /**
   * Idempotently marks a payment as successful with row-level transaction locking.
   * Enforces state machine validation and logs to payment audit trail.
   */
  public async markPaymentSuccessful(
    params: {
      id?: string;
      gatewayOrderId?: string;
      gatewayPaymentId: string;
      gatewaySignature?: string;
      paymentMethod?: string;
      metadata?: Record<string, any>;
    },
    externalClient?: PoolClient
  ): Promise<Payment | null> {
    const { id, gatewayOrderId, gatewayPaymentId, gatewaySignature, paymentMethod, metadata } = params;

    let whereClause: string;
    let identifierParam: string;

    if (id) {
      whereClause = 'id = $1';
      identifierParam = id;
    } else if (gatewayOrderId) {
      whereClause = 'gateway_order_id = $1';
      identifierParam = gatewayOrderId;
    } else {
      whereClause = 'gateway_payment_id = $1';
      identifierParam = gatewayPaymentId;
    }

    const client = externalClient || (await db.getClient());
    const isLocalTx = !externalClient;

    try {
      if (isLocalTx) {
        await client.query('BEGIN');
      }

      const selectQuery = `SELECT * FROM ${this.tableName} WHERE ${whereClause} FOR UPDATE`;
      const { rows } = await client.query(selectQuery, [identifierParam]);

      if (rows.length === 0) {
        if (isLocalTx) {
          await client.query('ROLLBACK');
        }
        return null;
      }

      const current = rows[0];

      // Idempotency: If already confirmed as SUCCESS, gracefully return existing record
      if (current.status === 'SUCCESS') {
        if (isLocalTx) {
          await client.query('COMMIT');
        }
        return this.mapToModel(current);
      }

      // Finite state machine transition check
      PaymentStateMachine.validateTransition(current.status as PaymentStatus, 'SUCCESS', 'markPaymentSuccessful');

      const updateQuery = `
        UPDATE ${this.tableName}
        SET
          status = 'SUCCESS',
          gateway_payment_id = COALESCE(gateway_payment_id, $2),
          gateway_signature = COALESCE($3, gateway_signature),
          payment_method = COALESCE($4, payment_method),
          paid_at = COALESCE(paid_at, NOW()),
          metadata = metadata || $5::jsonb,
          updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;

      const updateRes = await client.query(updateQuery, [
        current.id,
        gatewayPaymentId,
        gatewaySignature || null,
        paymentMethod || null,
        JSON.stringify(metadata || {})
      ]);

      // Audit Trail
      await client.query(
        `INSERT INTO payment_audit_logs (payment_id, action, actor_type, actor_id, details)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          current.id,
          'PAYMENT_VERIFIED',
          'SYSTEM',
          gatewayPaymentId,
          JSON.stringify({
            previousStatus: current.status,
            newStatus: 'SUCCESS',
            amount: parseFloat(current.amount),
            gatewayPaymentId,
            gatewayOrderId: current.gateway_order_id,
            paymentMethod
          })
        ]
      );

      if (isLocalTx) {
        await client.query('COMMIT');
      }
      return this.mapToModel(updateRes.rows[0]);
    } catch (error) {
      if (isLocalTx) {
        await client.query('ROLLBACK');
      }
      throw error;
    } finally {
      if (isLocalTx) {
        client.release();
      }
    }
  }

  /**
   * Marks a payment as failed with transaction locking and lifecycle validation.
   */
  public async markPaymentFailed(
    params: {
      id?: string;
      gatewayOrderId?: string;
      gatewayPaymentId?: string;
      failureReason: string;
      metadata?: Record<string, any>;
    },
    externalClient?: PoolClient
  ): Promise<Payment | null> {
    const { id, gatewayOrderId, gatewayPaymentId, failureReason, metadata } = params;

    let whereClause: string;
    let identifierParam: string;

    if (id) {
      whereClause = 'id = $1';
      identifierParam = id;
    } else if (gatewayOrderId) {
      whereClause = 'gateway_order_id = $1';
      identifierParam = gatewayOrderId;
    } else if (gatewayPaymentId) {
      whereClause = 'gateway_payment_id = $1';
      identifierParam = gatewayPaymentId;
    } else {
      return null;
    }

    const client = externalClient || (await db.getClient());
    const isLocalTx = !externalClient;

    try {
      if (isLocalTx) {
        await client.query('BEGIN');
      }

      const selectQuery = `SELECT * FROM ${this.tableName} WHERE ${whereClause} FOR UPDATE`;
      const { rows } = await client.query(selectQuery, [identifierParam]);

      if (rows.length === 0) {
        if (isLocalTx) {
          await client.query('ROLLBACK');
        }
        return null;
      }

      const current = rows[0];

      // Never overwrite confirmed successful or refunded payment with FAILED
      if (current.status === 'SUCCESS' || current.status === 'REFUNDED' || current.status === 'PARTIALLY_REFUNDED') {
        if (isLocalTx) {
          await client.query('COMMIT');
        }
        return this.mapToModel(current);
      }

      PaymentStateMachine.validateTransition(current.status as PaymentStatus, 'FAILED', 'markPaymentFailed');

      const updateQuery = `
        UPDATE ${this.tableName}
        SET
          status = 'FAILED',
          failure_reason = $2,
          gateway_payment_id = COALESCE($3, gateway_payment_id),
          metadata = metadata || $4::jsonb,
          updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;

      const updateRes = await client.query(updateQuery, [
        current.id,
        failureReason,
        gatewayPaymentId || null,
        JSON.stringify(metadata || {})
      ]);

      await client.query(
        `INSERT INTO payment_audit_logs (payment_id, action, actor_type, actor_id, details)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          current.id,
          'STATUS_CHANGED_GATEWAY',
          'GATEWAY_WEBHOOK',
          gatewayPaymentId || null,
          JSON.stringify({
            previousStatus: current.status,
            newStatus: 'FAILED',
            reason: failureReason
          })
        ]
      );

      if (isLocalTx) {
        await client.query('COMMIT');
      }
      return this.mapToModel(updateRes.rows[0]);
    } catch (error) {
      if (isLocalTx) {
        await client.query('ROLLBACK');
      }
      throw error;
    } finally {
      if (isLocalTx) {
        client.release();
      }
    }
  }

  /**
   * Records a refund on an existing payment with row-level transaction locking,
   * updates the payment_refunds table, and writes to audit logs.
   */
  public async recordRefund(
    params: {
      id?: string;
      gatewayPaymentId?: string;
      refundAmount: number;
      refundReason?: string;
      gatewayRefundId?: string;
      metadata?: Record<string, any>;
    },
    externalClient?: PoolClient
  ): Promise<Payment | null> {
    const { id, gatewayPaymentId, refundAmount, refundReason, gatewayRefundId, metadata } = params;

    let whereClause: string;
    let identifierParam: string;

    if (id) {
      whereClause = 'id = $1';
      identifierParam = id;
    } else if (gatewayPaymentId) {
      whereClause = 'gateway_payment_id = $1';
      identifierParam = gatewayPaymentId;
    } else {
      return null;
    }

    const client = externalClient || (await db.getClient());
    const isLocalTx = !externalClient;

    try {
      if (isLocalTx) {
        await client.query('BEGIN');
      }

      const selectQuery = `SELECT * FROM ${this.tableName} WHERE ${whereClause} FOR UPDATE`;
      const { rows } = await client.query(selectQuery, [identifierParam]);

      if (rows.length === 0) {
        if (isLocalTx) {
          await client.query('ROLLBACK');
        }
        return null;
      }

      const current = rows[0];
      const currentRefund = parseFloat(current.refund_amount || 0);
      const totalAmount = parseFloat(current.amount);
      const newCumulativeRefund = currentRefund + refundAmount;

      if (newCumulativeRefund > totalAmount) {
        throw new AppError(
          `Cumulative refund (₹${newCumulativeRefund}) exceeds original payment amount (₹${totalAmount})`,
          400
        );
      }

      const targetStatus: PaymentStatus = newCumulativeRefund >= totalAmount ? 'REFUNDED' : 'PARTIALLY_REFUNDED';

      PaymentStateMachine.validateTransition(current.status as PaymentStatus, targetStatus, 'recordRefund');

      // 1. Update payments table
      const updateQuery = `
        UPDATE ${this.tableName}
        SET
          refund_amount = $2,
          refund_reason = COALESCE($3, refund_reason),
          refunded_at = COALESCE(refunded_at, NOW()),
          status = $4,
          metadata = metadata || $5::jsonb,
          updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;

      const updateRes = await client.query(updateQuery, [
        current.id,
        newCumulativeRefund,
        refundReason || null,
        targetStatus,
        JSON.stringify(metadata || {})
      ]);

      // 2. Insert into payment_refunds table
      await client.query(
        `INSERT INTO payment_refunds (
          payment_id,
          gateway_refund_id,
          amount,
          currency,
          status,
          reason,
          metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          current.id,
          gatewayRefundId || null,
          refundAmount,
          current.currency || 'INR',
          'PROCESSED',
          refundReason || null,
          JSON.stringify(metadata || {})
        ]
      );

      // 3. Insert into payment_audit_logs
      await client.query(
        `INSERT INTO payment_audit_logs (payment_id, action, actor_type, actor_id, details)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          current.id,
          'REFUND_RECORDED',
          'ADMIN',
          'admin_user',
          JSON.stringify({
            refundAmount,
            previousRefundAmount: currentRefund,
            newCumulativeRefund,
            previousStatus: current.status,
            newStatus: targetStatus,
            gatewayRefundId,
            reason: refundReason
          })
        ]
      );

      if (isLocalTx) {
        await client.query('COMMIT');
      }
      return this.mapToModel(updateRes.rows[0]);
    } catch (error) {
      if (isLocalTx) {
        await client.query('ROLLBACK');
      }
      throw error;
    } finally {
      if (isLocalTx) {
        client.release();
      }
    }
  }

  /**
   * Lists payments with filters, search, and pagination.
   */
  public async list(params: PaymentFilterParams): Promise<{
    data: Payment[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 20));
    const offset = (page - 1) * limit;

    const whereClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (params.status) {
      whereClauses.push(`status = $${paramIndex++}`);
      values.push(params.status);
    }

    if (params.gateway) {
      whereClauses.push(`payment_gateway = $${paramIndex++}`);
      values.push(params.gateway);
    }

    if (params.startDate) {
      whereClauses.push(`created_at >= $${paramIndex++}`);
      values.push(new Date(params.startDate));
    }

    if (params.endDate) {
      whereClauses.push(`created_at < $${paramIndex++}`);
      values.push(this.getInclusiveEndDate(params.endDate));
    }

    if (params.paymentMethod) {
      whereClauses.push(`payment_method = $${paramIndex++}`);
      values.push(params.paymentMethod);
    }

    if (params.minAmount !== undefined && !isNaN(params.minAmount)) {
      whereClauses.push(`amount >= $${paramIndex++}`);
      values.push(params.minAmount);
    }

    if (params.maxAmount !== undefined && !isNaN(params.maxAmount)) {
      whereClauses.push(`amount <= $${paramIndex++}`);
      values.push(params.maxAmount);
    }

    if (params.isAnonymous !== undefined) {
      whereClauses.push(`is_anonymous = $${paramIndex++}`);
      values.push(params.isAnonymous);
    }

    if (params.supporterEmail) {
      whereClauses.push(`LOWER(supporter_email) = LOWER($${paramIndex++})`);
      values.push(params.supporterEmail);
    }

    if (params.search && params.search.trim()) {
      const searchTerm = `%${params.search.trim()}%`;
      whereClauses.push(`(
        supporter_name ILIKE $${paramIndex} OR
        supporter_email ILIKE $${paramIndex} OR
        supporter_phone ILIKE $${paramIndex} OR
        gateway_order_id ILIKE $${paramIndex} OR
        gateway_payment_id ILIKE $${paramIndex} OR
        receipt_number ILIKE $${paramIndex}
      )`);
      values.push(searchTerm);
      paramIndex++;
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Total count
    const countQuery = `SELECT COUNT(*) as count FROM ${this.tableName} ${whereSql}`;
    const countRes = await db.query(countQuery, values);
    const total = parseInt(countRes.rows[0].count, 10);

    // Data query with sorting
    const sortField = ['created_at', 'amount', 'paid_at'].includes(params.sortBy || '') ? params.sortBy! : 'created_at';
    const sortOrder = params.sortOrder === 'ASC' ? 'ASC' : 'DESC';

    const dataQuery = `
      SELECT * FROM ${this.tableName}
      ${whereSql}
      ORDER BY ${sortField} ${sortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const dataValues = [...values, limit, offset];
    const { rows } = await db.query(dataQuery, dataValues);

    return {
      data: rows.map((r) => this.mapToModel(r)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Computes totals and metrics across payment records.
   */
  public async getStatistics(): Promise<PaymentStats> {
    const aggQuery = `
      SELECT
        COALESCE(SUM(CASE WHEN status = 'SUCCESS' THEN amount ELSE 0 END), 0) as total_amount,
        COALESCE(COUNT(CASE WHEN status = 'SUCCESS' THEN 1 END), 0) as total_success,
        COALESCE(COUNT(DISTINCT CASE WHEN status = 'SUCCESS' AND supporter_email IS NOT NULL AND supporter_email != '' THEN supporter_email END), 0) as total_donors,
        COALESCE(AVG(CASE WHEN status = 'SUCCESS' THEN amount END), 0) as avg_amount
      FROM ${this.tableName}
    `;

    const breakdownQuery = `
      SELECT status, COUNT(*) as count
      FROM ${this.tableName}
      GROUP BY status
    `;

    const [aggRes, breakdownRes] = await Promise.all([db.query(aggQuery), db.query(breakdownQuery)]);

    const agg = aggRes.rows[0];

    const defaultBreakdown: Record<PaymentStatus, number> = {
      CREATED: 0,
      PENDING: 0,
      SUCCESS: 0,
      FAILED: 0,
      CANCELLED: 0,
      REFUNDED: 0,
      PARTIALLY_REFUNDED: 0
    };

    breakdownRes.rows.forEach((row: any) => {
      if (row.status in defaultBreakdown) {
        defaultBreakdown[row.status as PaymentStatus] = parseInt(row.count, 10);
      }
    });

    return {
      totalAmount: parseFloat(agg.total_amount),
      totalSuccessfulPayments: parseInt(agg.total_success, 10),
      totalDonors: parseInt(agg.total_donors, 10),
      averageDonation: parseFloat(parseFloat(agg.avg_amount).toFixed(2)),
      statusBreakdown: defaultBreakdown
    };
  }

  /**
   * Retrieves top supporters and recent donors.
   */
  public async getSupporterSummary(limit = 10): Promise<{
    topSupporters: SupporterSummaryItem[];
    recentSupporters: Payment[];
  }> {
    const topQuery = `
      SELECT
        COALESCE(supporter_name, 'Devotee / श्रद्धालु') as supporter_name,
        supporter_email,
        SUM(amount) as total_contributed,
        COUNT(*) as donation_count,
        MAX(paid_at) as last_donated_at
      FROM ${this.tableName}
      WHERE status = 'SUCCESS' AND is_anonymous = false
      GROUP BY supporter_name, supporter_email
      ORDER BY total_contributed DESC
      LIMIT $1
    `;

    const recentQuery = `
      SELECT * FROM ${this.tableName}
      WHERE status = 'SUCCESS'
      ORDER BY paid_at DESC NULLS LAST, created_at DESC
      LIMIT $1
    `;

    const [topRes, recentRes] = await Promise.all([db.query(topQuery, [limit]), db.query(recentQuery, [limit])]);

    const topSupporters: SupporterSummaryItem[] = topRes.rows.map((r: any) => ({
      supporterName: r.supporter_name,
      supporterEmail: r.supporter_email || undefined,
      totalContributed: parseFloat(r.total_contributed),
      donationCount: parseInt(r.donation_count, 10),
      lastDonatedAt: r.last_donated_at
    }));

    const recentSupporters = recentRes.rows.map((r: any) => this.mapToModel(r));

    return { topSupporters, recentSupporters };
  }

  /**
   * Retrieves overview metric cards, trend points, method breakdown, and contribution breakdown.
   */
  public async getOverviewData(range = '30d', startDate?: string, endDate?: string): Promise<DonationOverviewData> {
    const metricsQuery = `
      SELECT
        COALESCE(SUM(CASE WHEN status IN ('SUCCESS', 'REFUNDED', 'PARTIALLY_REFUNDED') THEN (amount - COALESCE(refund_amount, 0)) ELSE 0 END), 0) as total_collected,
        COALESCE(SUM(CASE WHEN status IN ('SUCCESS', 'REFUNDED', 'PARTIALLY_REFUNDED') AND created_at >= CURRENT_DATE THEN (amount - COALESCE(refund_amount, 0)) ELSE 0 END), 0) as today_collection,
        COALESCE(SUM(CASE WHEN status IN ('SUCCESS', 'REFUNDED', 'PARTIALLY_REFUNDED') AND created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN (amount - COALESCE(refund_amount, 0)) ELSE 0 END), 0) as this_month,
        COALESCE(SUM(CASE WHEN status IN ('SUCCESS', 'REFUNDED', 'PARTIALLY_REFUNDED') AND created_at >= DATE_TRUNC('year', CURRENT_DATE) THEN (amount - COALESCE(refund_amount, 0)) ELSE 0 END), 0) as this_year,
        COALESCE(COUNT(CASE WHEN status IN ('SUCCESS', 'PARTIALLY_REFUNDED') THEN 1 END), 0) as successful_count,
        COALESCE(COUNT(CASE WHEN status IN ('CREATED', 'PENDING') THEN 1 END), 0) as pending_count,
        COALESCE(COUNT(CASE WHEN status = 'FAILED' THEN 1 END), 0) as failed_count,
        COALESCE(SUM(refund_amount), 0) as refunded_amount
      FROM ${this.tableName}
    `;

    let trendWhere = "status = 'SUCCESS'";
    const trendValues: any[] = [];
    if (range === 'today') {
      trendWhere += ' AND created_at >= CURRENT_DATE';
    } else if (range === '7d') {
      trendWhere += " AND created_at >= CURRENT_DATE - INTERVAL '7 days'";
    } else if (range === '30d') {
      trendWhere += " AND created_at >= CURRENT_DATE - INTERVAL '30 days'";
    } else if (range === 'month') {
      trendWhere += " AND created_at >= DATE_TRUNC('month', CURRENT_DATE)";
    } else if (range === 'year') {
      trendWhere += " AND created_at >= DATE_TRUNC('year', CURRENT_DATE)";
    } else if (range === 'custom' && startDate && endDate) {
      trendWhere += ' AND created_at >= $1 AND created_at < $2';
      trendValues.push(new Date(startDate), this.getInclusiveEndDate(endDate));
    }

    const trendQuery = `
      SELECT
        TO_CHAR(created_at, 'YYYY-MM-DD') as date,
        COALESCE(SUM(amount), 0) as amount,
        COUNT(*) as count
      FROM ${this.tableName}
      WHERE ${trendWhere}
      GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
      ORDER BY date ASC
    `;

    const methodQuery = `
      SELECT
        COALESCE(NULLIF(payment_method, ''), 'UPI') as method,
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as total_amount
      FROM ${this.tableName}
      WHERE status = 'SUCCESS'
      GROUP BY COALESCE(NULLIF(payment_method, ''), 'UPI')
      ORDER BY total_amount DESC
    `;

    const amountQuery = `
      SELECT
        amount,
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as total
      FROM ${this.tableName}
      WHERE status = 'SUCCESS'
      GROUP BY amount
      ORDER BY count DESC, amount ASC
      LIMIT 12
    `;

    const [metricsRes, trendRes, methodRes, amountRes] = await Promise.all([
      db.query(metricsQuery),
      db.query(trendQuery, trendValues),
      db.query(methodQuery),
      db.query(amountQuery)
    ]);

    const m = metricsRes.rows[0];

    return {
      metrics: {
        totalCollected: parseFloat(m.total_collected),
        todayCollection: parseFloat(m.today_collection),
        thisMonth: parseFloat(m.this_month),
        thisYear: parseFloat(m.this_year),
        successfulPayments: parseInt(m.successful_count, 10),
        pendingPayments: parseInt(m.pending_count, 10),
        failedPayments: parseInt(m.failed_count, 10),
        refundedAmount: parseFloat(m.refunded_amount)
      },
      trend: trendRes.rows.map((r: any) => ({
        date: r.date,
        amount: parseFloat(r.amount),
        count: parseInt(r.count, 10)
      })),
      paymentMethodBreakdown: methodRes.rows.map((r: any) => ({
        method: r.method,
        count: parseInt(r.count, 10),
        totalAmount: parseFloat(r.total_amount)
      })),
      contributionAmountBreakdown: amountRes.rows.map((r: any) => ({
        amount: parseFloat(r.amount),
        count: parseInt(r.count, 10),
        total: parseFloat(r.total)
      }))
    };
  }

  /**
   * Lists aggregated supporters with total contributions and counts.
   */
  public async getSupportersList(params: { page?: number; limit?: number; search?: string }): Promise<{
    data: SupporterListItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 20));
    const offset = (page - 1) * limit;

    let searchClause = '';
    const searchValues: any[] = [];
    if (params.search && params.search.trim()) {
      searchClause = `AND (supporter_name ILIKE $1 OR supporter_email ILIKE $1)`;
      searchValues.push(`%${params.search.trim()}%`);
    }

    const countQuery = `
      SELECT COUNT(DISTINCT CASE WHEN is_anonymous THEN id::text ELSE COALESCE(NULLIF(TRIM(supporter_email), ''), id::text) END) as total
      FROM ${this.tableName}
      WHERE status IN ('SUCCESS', 'PARTIALLY_REFUNDED') ${searchClause}
    `;

    const dataQuery = `
      SELECT
        (CASE
          WHEN is_anonymous THEN id::text
          ELSE COALESCE(NULLIF(TRIM(supporter_email), ''), id::text)
        END) as supporter_key,
        CASE
          WHEN BOOL_OR(is_anonymous) THEN 'Anonymous Supporter'
          ELSE COALESCE(MAX(supporter_name), 'Devotee / श्रद्धालु')
        END as supporter_name,
        CASE
          WHEN BOOL_OR(is_anonymous) THEN NULL
          ELSE MAX(NULLIF(TRIM(supporter_email), ''))
        END as supporter_email,
        BOOL_OR(is_anonymous) as is_anonymous,
        COUNT(CASE WHEN status IN ('SUCCESS', 'PARTIALLY_REFUNDED') THEN 1 END) as contribution_count,
        COALESCE(SUM(CASE WHEN status IN ('SUCCESS', 'PARTIALLY_REFUNDED') THEN (amount - COALESCE(refund_amount, 0)) ELSE 0 END), 0) as total_contributed,
        MIN(CASE WHEN status IN ('SUCCESS', 'PARTIALLY_REFUNDED') THEN COALESCE(paid_at, created_at) END) as first_contribution,
        MAX(CASE WHEN status IN ('SUCCESS', 'PARTIALLY_REFUNDED') THEN COALESCE(paid_at, created_at) END) as last_contribution
      FROM ${this.tableName}
      WHERE status IN ('SUCCESS', 'PARTIALLY_REFUNDED') ${searchClause}
      GROUP BY CASE WHEN is_anonymous THEN id::text ELSE COALESCE(NULLIF(TRIM(supporter_email), ''), id::text) END
      ORDER BY total_contributed DESC
      LIMIT $${searchValues.length + 1} OFFSET $${searchValues.length + 2}
    `;

    const countRes = await db.query(countQuery, searchValues);
    const total = parseInt(countRes.rows[0]?.total || 0, 10);

    const dataRes = await db.query(dataQuery, [...searchValues, limit, offset]);

    return {
      data: dataRes.rows.map((r: any) => ({
        supporterKey: r.supporter_key,
        supporterName: r.supporter_name,
        supporterEmail: r.is_anonymous ? undefined : r.supporter_email || undefined,
        contributionCount: parseInt(r.contribution_count, 10),
        totalContributed: parseFloat(r.total_contributed),
        firstContribution: r.first_contribution,
        lastContribution: r.last_contribution,
        isAnonymous: !!r.is_anonymous
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Retrieves a supporter profile and all their donation records.
   */
  public async getSupporterDetails(supporterKey: string): Promise<{
    supporter: SupporterListItem | null;
    payments: Payment[];
  }> {
    const isEmail = supporterKey.includes('@') && !supporterKey.startsWith('anon_');
    const query = isEmail
      ? `SELECT * FROM ${this.tableName} WHERE LOWER(supporter_email) = LOWER($1) ORDER BY created_at DESC`
      : `SELECT * FROM ${this.tableName} WHERE id::text = $1 OR CONCAT('anon_', id::text) = $1 ORDER BY created_at DESC`;

    const { rows } = await db.query(query, [supporterKey]);
    if (rows.length === 0) {
      return { supporter: null, payments: [] };
    }

    const payments = rows.map((r: any) => this.mapToModel(r));
    const successfulPayments = payments.filter((p) => p.status === 'SUCCESS' || p.status === 'PARTIALLY_REFUNDED');
    const isAnon = payments.some((p) => p.isAnonymous) || supporterKey.startsWith('anon_');

    const supporter: SupporterListItem = {
      supporterKey,
      supporterName: isAnon ? 'Anonymous Supporter' : payments[0].supporterName || 'Devotee / श्रद्धालु',
      supporterEmail: isAnon ? undefined : payments[0].supporterEmail,
      contributionCount: successfulPayments.length,
      totalContributed: successfulPayments.reduce((acc, p) => acc + (p.amount - (p.refundAmount || 0)), 0),
      firstContribution: payments[payments.length - 1].paidAt || payments[payments.length - 1].createdAt,
      lastContribution: payments[0].paidAt || payments[0].createdAt,
      isAnonymous: isAnon
    };

    return { supporter, payments };
  }

  /**
   * Financial collection and reconciliation report with period breakdown.
   */
  public async getFinancialReport(params: {
    startDate?: string;
    endDate?: string;
    status?: string;
    paymentMethod?: string;
  }): Promise<DonationReportSummary> {
    const whereClauses: string[] = ['1=1'];
    const values: any[] = [];
    let idx = 1;

    if (params.startDate) {
      whereClauses.push(`created_at >= $${idx++}`);
      values.push(new Date(params.startDate));
    }
    if (params.endDate) {
      whereClauses.push(`created_at < $${idx++}`);
      values.push(this.getInclusiveEndDate(params.endDate));
    }
    if (params.status) {
      whereClauses.push(`status = $${idx++}`);
      values.push(params.status);
    }
    if (params.paymentMethod) {
      whereClauses.push(`payment_method = $${idx}`);
      values.push(params.paymentMethod);
    }

    const whereSql = whereClauses.join(' AND ');

    const summaryQuery = `
      SELECT
        COALESCE(SUM(CASE WHEN status IN ('SUCCESS', 'REFUNDED', 'PARTIALLY_REFUNDED') THEN amount ELSE 0 END), 0) as gross_collection,
        COALESCE(SUM(CASE WHEN status IN ('SUCCESS', 'REFUNDED', 'PARTIALLY_REFUNDED') THEN refund_amount ELSE 0 END), 0) as refunds,
        COALESCE(SUM(CASE WHEN status IN ('SUCCESS', 'REFUNDED', 'PARTIALLY_REFUNDED') THEN (amount - COALESCE(refund_amount, 0)) ELSE 0 END), 0) as net_collection,
        COALESCE(COUNT(CASE WHEN status IN ('SUCCESS', 'PARTIALLY_REFUNDED') THEN 1 END), 0) as successful_count,
        COALESCE(COUNT(CASE WHEN status = 'FAILED' THEN 1 END), 0) as failed_count
      FROM ${this.tableName}
      WHERE ${whereSql}
    `;

    const periodicQuery = `
      SELECT
        TO_CHAR(created_at, 'YYYY-MM') as period,
        COALESCE(SUM(CASE WHEN status IN ('SUCCESS', 'REFUNDED', 'PARTIALLY_REFUNDED') THEN amount ELSE 0 END), 0) as gross,
        COALESCE(SUM(CASE WHEN status IN ('SUCCESS', 'REFUNDED', 'PARTIALLY_REFUNDED') THEN refund_amount ELSE 0 END), 0) as refunds,
        COALESCE(SUM(CASE WHEN status IN ('SUCCESS', 'REFUNDED', 'PARTIALLY_REFUNDED') THEN (amount - COALESCE(refund_amount, 0)) ELSE 0 END), 0) as net,
        COUNT(CASE WHEN status IN ('SUCCESS', 'PARTIALLY_REFUNDED') THEN 1 END) as count
      FROM ${this.tableName}
      WHERE ${whereSql}
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY period DESC
      LIMIT 12
    `;

    const [summaryRes, periodicRes] = await Promise.all([
      db.query(summaryQuery, values),
      db.query(periodicQuery, values)
    ]);

    const s = summaryRes.rows[0];

    return {
      grossCollection: parseFloat(s.gross_collection),
      refunds: parseFloat(s.refunds),
      netCollection: parseFloat(s.net_collection),
      successfulTransactions: parseInt(s.successful_count, 10),
      failedTransactions: parseInt(s.failed_count, 10),
      periodBreakdown: periodicRes.rows.map((r: any) => ({
        period: r.period,
        gross: parseFloat(r.gross),
        refunds: parseFloat(r.refunds),
        net: parseFloat(r.net),
        count: parseInt(r.count, 10)
      }))
    };
  }

  /**
   * Generates CSV string of payments matching filters for administrative exports.
   */
  public async exportPaymentsCsv(params: PaymentFilterParams): Promise<string> {
    const listRes = await this.list({ ...params, limit: 10000, page: 1 });
    const headers = [
      'ID',
      'Date',
      'Supporter Name',
      'Supporter Email',
      'Amount (INR)',
      'Status',
      'Payment Method',
      'Gateway',
      'Order ID',
      'Payment ID',
      'Anonymous',
      'Source'
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = listRes.data.map((p) =>
      [
        escapeCsv(p.id),
        escapeCsv(p.paidAt || p.createdAt),
        escapeCsv(p.isAnonymous ? 'Anonymous' : p.supporterName || 'Devotee'),
        escapeCsv(p.isAnonymous ? '' : p.supporterEmail || ''),
        escapeCsv(p.amount),
        escapeCsv(p.status),
        escapeCsv(p.paymentMethod || 'upi'),
        escapeCsv(p.paymentGateway),
        escapeCsv(p.gatewayOrderId || ''),
        escapeCsv(p.gatewayPaymentId || ''),
        escapeCsv(p.isAnonymous ? 'Yes' : 'No'),
        escapeCsv(p.source)
      ].join(',')
    );

    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * Records a processed webhook event to guarantee exact-once processing.
   * Returns true if event is newly recorded, false if duplicate event already exists.
   */
  public async recordWebhookEvent(params: {
    eventId: string;
    eventType: string;
    gatewayPaymentId?: string;
    gatewayOrderId?: string;
    payloadSummary?: Record<string, any>;
  }): Promise<boolean> {
    const query = `
      INSERT INTO payment_webhook_events (
        event_id,
        event_type,
        gateway_payment_id,
        gateway_order_id,
        payload_summary
      ) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (event_id) DO NOTHING
      RETURNING id
    `;
    const { rows } = await db.query(query, [
      params.eventId,
      params.eventType,
      params.gatewayPaymentId || null,
      params.gatewayOrderId || null,
      JSON.stringify(params.payloadSummary || {})
    ]);
    return rows.length > 0;
  }

  /**
   * Atomically registers a webhook event and executes the associated payment mutation
   * within a single database transaction. If the mutation fails, the event registration
   * is rolled back, guaranteeing that Razorpay retries are not blackholed.
   */
  public async executeWebhookTransaction<T>(
    eventParams: {
      eventId: string;
      eventType: string;
      gatewayPaymentId?: string;
      gatewayOrderId?: string;
      payloadSummary?: Record<string, any>;
    },
    mutationFn: (client: PoolClient) => Promise<T>
  ): Promise<{ duplicate: boolean; result?: T }> {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      const insertQuery = `
        INSERT INTO payment_webhook_events (
          event_id,
          event_type,
          gateway_payment_id,
          gateway_order_id,
          payload_summary
        ) VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (event_id) DO NOTHING
        RETURNING id
      `;

      const { rows } = await client.query(insertQuery, [
        eventParams.eventId,
        eventParams.eventType,
        eventParams.gatewayPaymentId || null,
        eventParams.gatewayOrderId || null,
        JSON.stringify(eventParams.payloadSummary || {})
      ]);

      if (rows.length === 0) {
        // Event was already successfully recorded and committed in a prior transaction
        await client.query('COMMIT');
        return { duplicate: true };
      }

      // Execute business payment mutation using the same transaction client
      const result = await mutationFn(client);

      await client.query('COMMIT');
      return { duplicate: false, result };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Appends an entry to the immutable payment audit trail.
   */
  public async logAuditAction(params: {
    paymentId?: string;
    action: string;
    actorType?: 'ADMIN' | 'GATEWAY_WEBHOOK' | 'SYSTEM';
    actorId?: string;
    details: Record<string, any>;
  }): Promise<void> {
    const query = `
      INSERT INTO payment_audit_logs (
        payment_id,
        action,
        actor_type,
        actor_id,
        details
      ) VALUES ($1, $2, $3, $4, $5)
    `;
    await db.query(query, [
      params.paymentId || null,
      params.action,
      params.actorType || 'SYSTEM',
      params.actorId || null,
      JSON.stringify(params.details || {})
    ]);
  }

  /**
   * Retrieves recent audit log entries.
   */
  public async listAuditLogs(limit = 50): Promise<PaymentAuditLog[]> {
    const query = `
      SELECT * FROM payment_audit_logs
      ORDER BY created_at DESC
      LIMIT $1
    `;
    const { rows } = await db.query(query, [limit]);
    return rows.map((r: any) => ({
      id: r.id,
      paymentId: r.payment_id || undefined,
      action: r.action,
      actorType: r.actor_type,
      actorId: r.actor_id || undefined,
      details: typeof r.details === 'object' && r.details !== null ? r.details : {},
      createdAt: r.created_at.toISOString()
    }));
  }

  /**
   * Retrieves payments for reconciliation matching date range.
   */
  public async listForReconciliation(params: { startDate?: string; endDate?: string }): Promise<Payment[]> {
    const whereClauses: string[] = ['1=1'];
    const values: any[] = [];
    let idx = 1;

    if (params.startDate) {
      whereClauses.push(`created_at >= $${idx++}`);
      values.push(new Date(params.startDate));
    }
    if (params.endDate) {
      whereClauses.push(`created_at < $${idx}`);
      values.push(this.getInclusiveEndDate(params.endDate));
    }

    const query = `
      SELECT * FROM ${this.tableName}
      WHERE ${whereClauses.join(' AND ')}
      ORDER BY created_at ASC
    `;
    const { rows } = await db.query(query, values);
    return rows.map((r) => this.mapToModel(r));
  }

  /**
   * Saves a financial reconciliation audit run.
   */
  public async saveReconciliation(result: {
    status: ReconciliationStatus;
    periodStart?: string;
    periodEnd?: string;
    recordsChecked: number;
    mismatchesCount: number;
    localCount: number;
    localTotal: number;
    gatewayCount: number;
    gatewayTotal: number;
    difference: number;
    discrepancies: any[];
    performedBy?: string;
    metadata?: Record<string, any>;
  }): Promise<ReconciliationResult> {
    const query = `
      INSERT INTO payment_reconciliations (
        status,
        period_start,
        period_end,
        records_checked,
        mismatches_count,
        local_count,
        local_total,
        gateway_count,
        gateway_total,
        difference,
        discrepancies,
        performed_by,
        metadata
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
      )
      RETURNING *
    `;

    const values = [
      result.status,
      result.periodStart ? new Date(result.periodStart) : null,
      result.periodEnd ? new Date(result.periodEnd) : null,
      result.recordsChecked,
      result.mismatchesCount,
      result.localCount,
      result.localTotal,
      result.gatewayCount,
      result.gatewayTotal,
      result.difference,
      JSON.stringify(result.discrepancies || []),
      result.performedBy || 'admin',
      JSON.stringify(result.metadata || {})
    ];

    const { rows } = await db.query(query, values);
    const r = rows[0];

    return {
      id: r.id,
      status: r.status,
      periodStart: r.period_start ? r.period_start.toISOString() : undefined,
      periodEnd: r.period_end ? r.period_end.toISOString() : undefined,
      recordsChecked: parseInt(r.records_checked, 10),
      mismatchesCount: parseInt(r.mismatches_count, 10),
      localCount: parseInt(r.local_count, 10),
      localTotal: parseFloat(r.local_total),
      gatewayCount: parseInt(r.gateway_count, 10),
      gatewayTotal: parseFloat(r.gateway_total),
      difference: parseFloat(r.difference),
      discrepancies: r.discrepancies || [],
      performedBy: r.performed_by,
      createdAt: r.created_at.toISOString()
    };
  }

  /**
   * Retrieves the most recent reconciliation run.
   */
  public async getLatestReconciliation(): Promise<ReconciliationResult | null> {
    const query = `SELECT * FROM payment_reconciliations ORDER BY created_at DESC LIMIT 1`;
    const { rows } = await db.query(query);
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id,
      status: r.status,
      periodStart: r.period_start ? new Date(r.period_start).toISOString() : undefined,
      periodEnd: r.period_end ? new Date(r.period_end).toISOString() : undefined,
      recordsChecked: parseInt(r.records_checked, 10),
      mismatchesCount: parseInt(r.mismatches_count, 10),
      localCount: parseInt(r.local_count, 10),
      localTotal: parseFloat(r.local_total),
      gatewayCount: parseInt(r.gateway_count, 10),
      gatewayTotal: parseFloat(r.gateway_total),
      difference: parseFloat(r.difference),
      discrepancies: r.discrepancies || [],
      performedBy: r.performed_by,
      createdAt: new Date(r.created_at).toISOString()
    };
  }
}

export const paymentRepository = new PaymentRepository();
