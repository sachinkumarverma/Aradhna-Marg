import crypto from 'crypto';
import { paymentRepository, PaymentRepository } from '@repositories/PaymentRepository';
import { razorpayGateway, RazorpayGateway, GatewayFetchStatus } from './payment/RazorpayGateway';
import { config } from '@/config';
import { AppError } from '@/errors/appError';
import { logger } from '@utils/logger';
import { emailService } from '@services/EmailService';
import {
  Payment,
  PaymentFilterParams,
  PaymentStats,
  SupporterSummaryItem,
  ReconciliationResult,
  ReconciliationDiscrepancyItem,
  PaymentAuditLog
} from '@models/Payment';
import { PaymentStateMachine } from './payment/PaymentStateMachine';

export interface CreateOrderParams {
  amount: number;
  donorName?: string;
  donorEmail?: string;
  donorPhone?: string;
  note?: string;
  isAnonymous?: boolean;
}

export interface VerifyPaymentParams {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  donorName?: string;
  donorEmail?: string;
  donorPhone?: string;
  amount?: number;
  note?: string;
}

export class PaymentService {
  constructor(
    private readonly repository: PaymentRepository = paymentRepository,
    private readonly gateway: RazorpayGateway = razorpayGateway
  ) {}

  /**
   * Creates an order with Razorpay and records a preliminary CREATED payment in the database.
   */
  public async createOrder(params: CreateOrderParams) {
    const numAmount = Number(params.amount);
    if (isNaN(numAmount) || numAmount < 1) {
      throw new AppError('कृपया एक वैध राशि दर्ज करें (कम से कम ₹1) / Please enter a valid amount (minimum ₹1)', 400);
    }

    const receipt = `rcpt_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const amountInPaise = Math.round(numAmount * 100);

    // 1. Create order on Razorpay Gateway
    const order = await this.gateway.createOrder({
      amountInPaise,
      currency: 'INR',
      receipt,
      notes: {
        donorName: params.donorName || 'Devotee / श्रद्धालु',
        donorEmail: params.donorEmail || '',
        donorPhone: params.donorPhone || '',
        note: params.note || '',
        purpose: 'Aradhna Marg Sanatan Devotional Support'
      }
    });

    // 2. Record preliminary CREATED payment in the repository
    const payment = await this.repository.create({
      supporterName: params.donorName || (params.isAnonymous ? 'Anonymous' : 'Devotee / श्रद्धालु'),
      supporterEmail: params.donorEmail || undefined,
      supporterPhone: params.donorPhone || undefined,
      amount: numAmount,
      currency: order.currency || 'INR',
      paymentGateway: 'RAZORPAY',
      gatewayOrderId: order.id,
      isAnonymous: !!params.isAnonymous,
      source: 'WEBSITE_DONATION',
      notes: params.note || undefined,
      receiptNumber: order.receipt,
      metadata: {
        createdVia: 'public_checkout',
        gatewayReceipt: order.receipt
      }
    });

    logger.info(`Payment record initialized: ID ${payment.id}, Order ${order.id}, Amount ₹${numAmount}`);

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: config.RAZORPAY_KEY_ID || '',
      receipt: order.receipt
    };
  }

  /**
   * Server-side verification of payment signature and authorization.
   * Enforces idempotency and ensures amount integrity against recorded order.
   */
  public async verifyPayment(params: VerifyPaymentParams) {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      donorName,
      donorEmail,
      donorPhone,
      amount,
      note
    } = params;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new AppError('Payment signature or IDs missing.', 400);
    }

    // 1. Check Idempotency: Has this transaction already been recorded as SUCCESS?
    const isDuplicate = await this.repository.checkDuplicateGatewayTransaction(razorpay_payment_id);
    if (isDuplicate) {
      const existing = await this.repository.findByGatewayPaymentId(razorpay_payment_id);
      logger.info(`Idempotent payment verification hit for Payment ${razorpay_payment_id}`);
      return {
        verified: true,
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        payment: this.sanitizePayment(existing),
        message: 'दान एवं सहयोग हेतु आपका कोटि-कोटि धन्यवाद! सहयोग रसीद आपके ईमेल पर प्रेषित कर दी गई है।'
      };
    }

    // 2. Cryptographic signature check
    const isAuthentic = this.gateway.verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);

    if (!isAuthentic) {
      logger.warn(`Payment Signature Verification Failed for Order: ${razorpay_order_id}`);
      // Record failure if record exists
      await this.repository.markPaymentFailed({
        gatewayOrderId: razorpay_order_id,
        gatewayPaymentId: razorpay_payment_id,
        failureReason: 'Cryptographic signature mismatch'
      });
      throw new AppError('भुगतान सत्यापन विफल रहा / Payment verification failed', 400);
    }

    // 3. Match against existing database record to enforce amount integrity and valid transitions
    const existingPayment = await this.repository.findByGatewayOrderId(razorpay_order_id);

    // Fail-Closed Security Policy: Reject verification if no local order was previously registered
    if (!existingPayment) {
      logger.error(`Verification rejected: No local order record found for gateway order ${razorpay_order_id}`);
      await this.repository.logAuditAction({
        action: 'UNRECORDED_ORDER_VERIFICATION_REJECTED',
        actorType: 'SYSTEM',
        actorId: 'verifyPayment',
        details: {
          gatewayOrderId: razorpay_order_id,
          gatewayPaymentId: razorpay_payment_id,
          attemptedAmount: amount,
          reason: 'Order not found in local database'
        }
      });
      throw new AppError('Payment verification rejected: Order not found in system. Please contact support.', 400);
    }

    PaymentStateMachine.validateTransition(existingPayment.status, 'SUCCESS', 'verifyPayment');

    // Security Check: If client specified an amount, ensure it strictly matches the authorized order amount
    if (amount !== undefined && Math.abs(Number(amount) - existingPayment.amount) > 0.01) {
      logger.error(
        `Payment amount mismatch tampering attempt: recorded ₹${existingPayment.amount}, received ₹${amount}`
      );
      throw new AppError('Invalid payment amount. Tampering detected.', 400);
    }

    // 4. Query Razorpay API for authoritative payment details, order association, and gateway amount
    let paymentMethod: string | undefined;
    const liveDetails = await this.gateway.fetchPayment(razorpay_payment_id);
    if (liveDetails) {
      paymentMethod = liveDetails.method;

      // Authoritative Order Association Check
      if (liveDetails.order_id && liveDetails.order_id !== razorpay_order_id) {
        logger.error(
          `Payment order association mismatch: gateway reports order ${liveDetails.order_id}, client claims ${razorpay_order_id}`
        );
        throw new AppError('Payment does not belong to the specified order.', 400);
      }

      // Authoritative Gateway Amount Verification
      const gatewayAmountInRupees = (liveDetails.amount || 0) / 100;
      if (Math.abs(gatewayAmountInRupees - existingPayment.amount) > 0.01) {
        logger.error(
          `Gateway amount mismatch: gateway reports ₹${gatewayAmountInRupees}, recorded order requires ₹${existingPayment.amount}`
        );
        throw new AppError('Payment amount mismatch between gateway and recorded order.', 400);
      }
    }

    // 5. Update the database record with SUCCESS status using authoritative recorded amount
    const updatedPayment = await this.repository.markPaymentSuccessful({
      id: existingPayment.id,
      gatewayPaymentId: razorpay_payment_id,
      gatewaySignature: razorpay_signature,
      paymentMethod: paymentMethod || 'upi',
      metadata: {
        clientNote: note,
        verifiedAt: new Date().toISOString()
      }
    });

    logger.info(
      `✅ Donation Payment Recorded Successfully: Order ${razorpay_order_id}, Payment ${razorpay_payment_id}, Amount ₹${updatedPayment?.amount || existingPayment.amount}`
    );

    // 6. Asynchronously send Electronic Invoice Receipt and Admin Notification
    const finalDonorEmail = donorEmail || updatedPayment?.supporterEmail;
    const finalDonorName = donorName || updatedPayment?.supporterName || 'Devotee / श्रद्धालु';
    const finalAmount = updatedPayment?.amount || existingPayment.amount;

    if (finalDonorEmail && finalDonorEmail.trim() && finalDonorEmail.includes('@')) {
      emailService
        .sendDonationReceipt({
          donorName: finalDonorName,
          donorEmail: finalDonorEmail.trim(),
          donorPhone: donorPhone ? donorPhone.trim() : undefined,
          amount: finalAmount,
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
          date: new Date(),
          note: note || undefined
        })
        .catch((err) => logger.warn('Failed to dispatch donor email receipt:', err.message));
    }

    emailService
      .sendDonationAlertToAdmin({
        donorName: finalDonorName,
        donorEmail: finalDonorEmail || 'Not specified',
        donorPhone: donorPhone,
        amount: finalAmount,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        date: new Date(),
        note: note
      })
      .catch((err) => logger.warn('Failed to dispatch admin donation alert:', err.message));

    return {
      verified: true,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      payment: this.sanitizePayment(updatedPayment),
      message: 'दान एवं सहयोग हेतु आपका कोटि-कोटि धन्यवाद! सहयोग रसीद आपके ईमेल पर प्रेषित कर दी गई है।'
    };
  }

  /**
   * Handles asynchronous webhook events directly from the Razorpay Gateway.
   * Guarantees exact-once processing via event ID registration.
   */
  public async handleWebhook(payload: any, signature: string, rawBody: string | Buffer) {
    // 1. Verify webhook signature
    const isValid = this.gateway.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      logger.warn('Razorpay Webhook: Invalid signature received');
      throw new AppError('Invalid webhook signature', 401);
    }

    const event = payload?.event;
    logger.info(`Razorpay Webhook Event Received: ${event}`);

    const paymentEntity = payload.payload?.payment?.entity;
    const refundEntity = payload.payload?.refund?.entity;
    const paymentId = paymentEntity?.id || refundEntity?.payment_id;
    const orderId = paymentEntity?.order_id;

    // 2. Strict exact-once idempotency registration and transactional mutation
    const eventId =
      payload?.event_id ||
      payload?.id ||
      crypto
        .createHash('sha256')
        .update(`${event}_${paymentId || orderId || ''}_${payload?.created_at || ''}`)
        .digest('hex');

    const txResult = await this.repository.executeWebhookTransaction(
      {
        eventId,
        eventType: event,
        gatewayPaymentId: paymentId,
        gatewayOrderId: orderId,
        payloadSummary: {
          event,
          createdAt: payload.created_at
        }
      },
      async (client) => {
        switch (event) {
          case 'payment.captured': {
            if (!paymentEntity) break;

            const capturedPaymentId = paymentEntity.id;
            const capturedOrderId = paymentEntity.order_id;
            const amount = paymentEntity.amount / 100;
            const paymentMethod = paymentEntity.method;

            const existing = capturedOrderId
              ? await this.repository.findByGatewayOrderId(capturedOrderId, client)
              : await this.repository.findByGatewayPaymentId(capturedPaymentId, client);

            if (existing) {
              const wasAlreadySuccess = existing.status === 'SUCCESS';
              await this.repository.markPaymentSuccessful(
                {
                  id: existing.id,
                  gatewayPaymentId: capturedPaymentId,
                  paymentMethod,
                  metadata: {
                    webhookReceivedAt: new Date().toISOString()
                  }
                },
                client
              );
              if (wasAlreadySuccess) {
                return { handled: true, event, idempotent: true };
              }
            } else {
              // If order not previously saved, create full success record using authoritative gateway amount
              const created = await this.repository.create(
                {
                  supporterName: paymentEntity.notes?.donorName || 'Devotee / श्रद्धालु',
                  supporterEmail: paymentEntity.email || undefined,
                  supporterPhone: paymentEntity.contact || undefined,
                  amount,
                  currency: paymentEntity.currency || 'INR',
                  paymentGateway: 'RAZORPAY',
                  gatewayOrderId: capturedOrderId,
                  gatewayPaymentId: capturedPaymentId,
                  paymentMethod,
                  metadata: {
                    webhookOrigin: true
                  }
                },
                client
              );
              await this.repository.markPaymentSuccessful(
                {
                  id: created.id,
                  gatewayPaymentId: capturedPaymentId,
                  paymentMethod
                },
                client
              );
            }
            break;
          }

          case 'payment.failed': {
            if (!paymentEntity) break;

            const failedPaymentId = paymentEntity.id;
            const failedOrderId = paymentEntity.order_id;
            const reason = paymentEntity.error_description || paymentEntity.error_reason || 'Payment failed at gateway';

            await this.repository.markPaymentFailed(
              {
                gatewayOrderId: failedOrderId,
                gatewayPaymentId: failedPaymentId,
                failureReason: reason,
                metadata: {
                  errorCode: paymentEntity.error_code,
                  webhookFailedAt: new Date().toISOString()
                }
              },
              client
            );
            break;
          }

          case 'refund.processed':
          case 'refund.created': {
            if (!refundEntity) break;

            const refundPaymentId = refundEntity.payment_id;
            const refundAmount = refundEntity.amount / 100;
            const reason = refundEntity.notes?.reason || 'Gateway refund';

            await this.repository.recordRefund(
              {
                gatewayPaymentId: refundPaymentId,
                refundAmount,
                refundReason: reason,
                gatewayRefundId: refundEntity.id,
                metadata: {
                  refundId: refundEntity.id,
                  webhookRefundAt: new Date().toISOString()
                }
              },
              client
            );
            break;
          }

          default:
            logger.info(`Unhandled webhook event: ${event}`);
        }

        return { handled: true, event };
      }
    );

    if (txResult.duplicate) {
      logger.info(`Webhook event ${eventId} (${event}) already processed. Skipping duplicate execution.`);
      return { handled: true, duplicateEvent: true, idempotent: true };
    }

    return txResult.result || { handled: true, event };
  }

  /**
   * Records a manual or programmatic refund for an existing payment (Admin action).
   * Does NOT automatically call the payment gateway unless explicitly authorized via options.
   */
  public async recordRefund(
    id: string,
    refundAmount: number,
    reason?: string,
    options?: { initiateGatewayRefund?: boolean; gatewayRefundId?: string }
  ) {
    const payment = await this.repository.findById(id);
    if (!payment) {
      throw new AppError('Payment record not found', 404);
    }

    if (payment.status !== 'SUCCESS' && payment.status !== 'PARTIALLY_REFUNDED') {
      throw new AppError(`Cannot refund a payment with status '${payment.status}'`, 400);
    }

    const numRefund = Number(refundAmount);
    if (isNaN(numRefund) || numRefund <= 0) {
      throw new AppError('Refund amount must be greater than ₹0', 400);
    }

    const remainingAllowed = payment.amount - (payment.refundAmount || 0);
    if (numRefund > remainingAllowed) {
      throw new AppError(
        `Refund amount (₹${numRefund}) exceeds remaining refundable amount (₹${remainingAllowed})`,
        400
      );
    }

    let gatewayRefundId = options?.gatewayRefundId;

    // Only initiate live gateway refund if explicitly requested by authorized admin action
    if (options?.initiateGatewayRefund && payment.gatewayPaymentId) {
      try {
        const gwResp = await this.gateway.createRefund(payment.gatewayPaymentId, Math.round(numRefund * 100), {
          reason: reason || 'Admin initiated refund'
        });
        if (gwResp?.id) {
          gatewayRefundId = gwResp.id;
        }
      } catch (err: any) {
        logger.error('Failed to initiate live gateway refund:', err.message);
        throw new AppError(`Gateway refund initiation failed: ${err.message}`, 400);
      }
    }

    const updated = await this.repository.recordRefund({
      id: payment.id,
      refundAmount: numRefund,
      refundReason: reason || 'Admin recorded refund',
      gatewayRefundId,
      metadata: {
        refundInitiatedAt: new Date().toISOString(),
        gatewayInitiated: !!options?.initiateGatewayRefund
      }
    });

    if (!updated) {
      throw new AppError('Failed to record refund', 500);
    }

    return this.sanitizePayment(updated);
  }

  // --- Admin Queries ---

  /**
   * Sanitizes payment object for client consumption.
   * Strips cryptographic signatures, sensitive webhook secrets, or internal keys.
   */
  public sanitizePayment(payment: Payment): Payment;
  public sanitizePayment(payment: null): null;
  public sanitizePayment(payment: Payment | null): Payment | null;
  public sanitizePayment(payment: Payment | null): Payment | null {
    if (!payment) return null;
    const safe = { ...payment };
    delete (safe as any).gatewaySignature;
    if (safe.metadata && typeof safe.metadata === 'object') {
      const { razorpay_signature, gatewaySignature, signature, ...cleanedMeta } = safe.metadata as any;
      safe.metadata = cleanedMeta;
    }
    if (safe.isAnonymous) {
      safe.supporterName = 'Anonymous Supporter';
      safe.supporterEmail = undefined;
      safe.supporterPhone = undefined;
    }
    return safe;
  }

  public async listPayments(params: PaymentFilterParams) {
    const result = await this.repository.list(params);
    return {
      ...result,
      data: result.data.map((p) => this.sanitizePayment(p))
    };
  }

  public async getStatistics(): Promise<PaymentStats> {
    return this.repository.getStatistics();
  }

  public async getSupporterSummary(limit = 10): Promise<{
    topSupporters: SupporterSummaryItem[];
    recentSupporters: Payment[];
  }> {
    const summary = await this.repository.getSupporterSummary(limit);
    return {
      topSupporters: summary.topSupporters,
      recentSupporters: summary.recentSupporters.map((p) => this.sanitizePayment(p))
    };
  }

  public async getPaymentById(id: string): Promise<Payment> {
    const payment = await this.repository.findById(id);
    if (!payment) {
      throw new AppError('Payment record not found', 404);
    }
    return this.sanitizePayment(payment);
  }

  public async getOverviewData(range?: string, startDate?: string, endDate?: string) {
    return this.repository.getOverviewData(range, startDate, endDate);
  }

  public async getSupportersList(params: { page?: number; limit?: number; search?: string }) {
    return this.repository.getSupportersList(params);
  }

  public async getSupporterDetails(supporterKey: string) {
    const details = await this.repository.getSupporterDetails(supporterKey);
    if (!details.supporter && details.payments.length === 0) {
      throw new AppError('Supporter not found', 404);
    }
    return {
      supporter: details.supporter,
      payments: details.payments.map((p) => this.sanitizePayment(p))
    };
  }

  public async getFinancialReport(params: {
    startDate?: string;
    endDate?: string;
    status?: string;
    paymentMethod?: string;
  }) {
    return this.repository.getFinancialReport(params);
  }

  public async exportPaymentsCsv(params: PaymentFilterParams) {
    return this.repository.exportPaymentsCsv(params);
  }

  /**
   * Reconciles application payment records against gateway records for a given date range.
   * Compares each transaction and detects:
   * - MISSING_LOCAL: Payment exists on gateway but not in Aradhna Marg database
   * - MISSING_GATEWAY: Local SUCCESS payment does not exist in gateway records
   * - AMOUNT_MISMATCH: Amount recorded locally differs from gateway captured amount
   * - STATUS_MISMATCH: Payment statuses diverge between local and gateway
   * - REFUND_MISMATCH: Refund amounts diverge between local and gateway
   * - DUPLICATE_TRANSACTION: Multiple local records reference the same gateway payment ID
   *
   * Crucial rule: Does NOT silently modify records. Flags and stores audit report.
   */
  public async reconcileWithGateway(params: {
    startDate?: string;
    endDate?: string;
    customGatewayRecords?: any[];
    liveFetch?: boolean;
    performedBy?: string;
  }): Promise<ReconciliationResult> {
    const { startDate, endDate, customGatewayRecords, liveFetch = true, performedBy = 'admin' } = params;

    // Baseline platform launch cutoff date: October 13, 2026
    // Disregards pre-launch development testing transactions conducted in July 2026.
    const DEFAULT_LAUNCH_CUTOFF = '2026-10-13T00:00:00.000Z';
    const effectiveStartDate = startDate || (process.env.NODE_ENV !== 'test' ? DEFAULT_LAUNCH_CUTOFF : undefined);

    // 1. Fetch local records in the specified period
    const localPayments = await this.repository.listForReconciliation({ startDate: effectiveStartDate, endDate });

    // 2. Fetch or load gateway records
    let gatewayRecords: any[] = [];
    let gatewayFetchStatus: GatewayFetchStatus = 'SUCCESSFUL_GATEWAY_FETCH';
    let gatewayErrorMessage: string | undefined;

    if (customGatewayRecords && customGatewayRecords.length > 0) {
      gatewayRecords = customGatewayRecords;
      gatewayFetchStatus = 'SUCCESSFUL_GATEWAY_FETCH';
    } else if (liveFetch) {
      let fromSec: number | undefined;
      let toSec: number | undefined;
      if (effectiveStartDate) fromSec = Math.floor(new Date(effectiveStartDate).getTime() / 1000);
      if (endDate) {
        const incEnd = this.repository.getInclusiveEndDate(endDate);
        toSec = Math.floor(incEnd.getTime() / 1000);
      }

      const gwRes = await this.gateway.fetchAllPayments({ from: fromSec, to: toSec });
      gatewayFetchStatus = gwRes.fetchStatus;
      gatewayErrorMessage = gwRes.errorMessage;
      gatewayRecords = gwRes.items || [];
    }

    // Fail-Closed Security Policy: If gateway fails, times out, or errors, NEVER produce RECONCILED!
    const isGatewayFailure =
      gatewayFetchStatus === 'GATEWAY_ERROR' ||
      gatewayFetchStatus === 'GATEWAY_TIMEOUT' ||
      gatewayFetchStatus === 'GATEWAY_AUTH_ERROR';

    if (isGatewayFailure) {
      const errorDesc =
        gatewayErrorMessage ||
        (gatewayFetchStatus === 'GATEWAY_TIMEOUT'
          ? 'Gateway timed out while fetching transactions.'
          : gatewayFetchStatus === 'GATEWAY_AUTH_ERROR'
            ? 'Gateway authentication failed or credentials not configured.'
            : 'Gateway returned an error while fetching transactions.');

      const failureDiscrepancy: ReconciliationDiscrepancyItem = {
        id: `gw_err_${Date.now()}`,
        type: 'GATEWAY_UNAVAILABLE',
        description: `Gateway unavailable — reconciliation could not be completed: ${errorDesc}`
      };

      const localConfirmed = localPayments.filter(
        (p) => p.status === 'SUCCESS' || p.status === 'PARTIALLY_REFUNDED' || p.status === 'REFUNDED'
      );
      const localTotal = localConfirmed.reduce((sum, p) => sum + (p.amount - (p.refundAmount || 0)), 0);
      const localCount = localConfirmed.length;

      const saved = await this.repository.saveReconciliation({
        status: 'UNAVAILABLE',
        periodStart: startDate,
        periodEnd: endDate,
        recordsChecked: localPayments.length,
        mismatchesCount: 1,
        localCount,
        localTotal,
        gatewayCount: 0,
        gatewayTotal: 0,
        difference: localTotal,
        discrepancies: [failureDiscrepancy],
        performedBy,
        metadata: {
          gatewayFetchStatus,
          errorMessage: errorDesc,
          executedAt: new Date().toISOString()
        }
      });

      await this.repository.logAuditAction({
        action: 'RECONCILIATION_GATEWAY_UNAVAILABLE',
        actorType: 'ADMIN',
        actorId: performedBy,
        details: {
          reconciliationId: saved.id,
          gatewayFetchStatus,
          errorMessage: errorDesc,
          localTotal,
          localCount
        }
      });

      return saved;
    }

    const discrepancies: ReconciliationDiscrepancyItem[] = [];

    // Map local records by gateway payment ID and count occurrences
    const localByPaymentId = new Map<string, Payment[]>();
    const localByOrderId = new Map<string, Payment>();

    localPayments.forEach((p) => {
      if (p.gatewayPaymentId) {
        const list = localByPaymentId.get(p.gatewayPaymentId) || [];
        list.push(p);
        localByPaymentId.set(p.gatewayPaymentId, list);
      }
      if (p.gatewayOrderId) {
        localByOrderId.set(p.gatewayOrderId, p);
      }
    });

    // Check for duplicate local records
    localByPaymentId.forEach((list, paymentId) => {
      if (list.length > 1) {
        discrepancies.push({
          id: `dup_${paymentId}`,
          type: 'DUPLICATE_TRANSACTION',
          gatewayPaymentId: paymentId,
          description: `Duplicate local records found (${list.length} records) for gateway payment ID ${paymentId}`
        });
      }
    });

    const evaluatedGatewayIds = new Set<string>();

    // 3. Evaluate each gateway record against local records
    for (const gw of gatewayRecords) {
      const gwPaymentId = gw.id;
      const gwOrderId = gw.order_id;
      const gwAmount = (gw.amount || 0) / 100;
      const gwRefundAmount = (gw.amount_refunded || 0) / 100;
      const gwStatus = gw.status; // 'captured', 'failed', 'authorized', 'refunded'
      const isGwCaptured = gw.captured || gwStatus === 'captured';

      evaluatedGatewayIds.add(gwPaymentId);

      const localList = localByPaymentId.get(gwPaymentId);
      const local = localList ? localList[0] : gwOrderId ? localByOrderId.get(gwOrderId) : undefined;

      if (!local) {
        // Only flag if gateway captured money that is missing from local database
        if (isGwCaptured) {
          discrepancies.push({
            id: `missing_local_${gwPaymentId}`,
            type: 'MISSING_LOCAL',
            gatewayPaymentId: gwPaymentId,
            gatewayOrderId: gwOrderId,
            gatewayAmount: gwAmount,
            gatewayStatus: gwStatus,
            description: `Payment ${gwPaymentId} (₹${gwAmount}) was captured on Gateway but is missing from application records.`
          });
        }
        continue;
      }

      // Check Amount Mismatch
      if (Math.abs(local.amount - gwAmount) > 0.01) {
        discrepancies.push({
          id: `amt_${local.id}`,
          type: 'AMOUNT_MISMATCH',
          localPaymentId: local.id,
          gatewayPaymentId: gwPaymentId,
          gatewayOrderId: gwOrderId,
          localAmount: local.amount,
          gatewayAmount: gwAmount,
          amountDifference: local.amount - gwAmount,
          description: `Amount mismatch: Application records ₹${local.amount}, while Gateway reports ₹${gwAmount}.`
        });
      }

      // Check Status Mismatch
      const isLocalConfirmed =
        local.status === 'SUCCESS' || local.status === 'PARTIALLY_REFUNDED' || local.status === 'REFUNDED';

      if (isGwCaptured && !isLocalConfirmed) {
        discrepancies.push({
          id: `stat_${local.id}`,
          type: 'STATUS_MISMATCH',
          localPaymentId: local.id,
          gatewayPaymentId: gwPaymentId,
          localStatus: local.status,
          gatewayStatus: gwStatus,
          description: `Status mismatch: Gateway is captured (${gwStatus}), but application record is '${local.status}'.`
        });
      } else if (!isGwCaptured && isLocalConfirmed && gwStatus === 'failed') {
        discrepancies.push({
          id: `stat_fail_${local.id}`,
          type: 'STATUS_MISMATCH',
          localPaymentId: local.id,
          gatewayPaymentId: gwPaymentId,
          localStatus: local.status,
          gatewayStatus: gwStatus,
          description: `Status mismatch: Gateway reports transaction failed, but application record is marked '${local.status}'.`
        });
      }

      // Check Refund Mismatch
      const localRefund = local.refundAmount || 0;
      if (Math.abs(localRefund - gwRefundAmount) > 0.01) {
        discrepancies.push({
          id: `rfnd_${local.id}`,
          type: 'REFUND_MISMATCH',
          localPaymentId: local.id,
          gatewayPaymentId: gwPaymentId,
          localRefundAmount: localRefund,
          gatewayRefundAmount: gwRefundAmount,
          description: `Refund mismatch: Application records ₹${localRefund} refunded, but Gateway reports ₹${gwRefundAmount} refunded.`
        });
      }
    }

    // 4. Check for local SUCCESS records missing from Gateway
    for (const local of localPayments) {
      if (
        (local.status === 'SUCCESS' || local.status === 'PARTIALLY_REFUNDED' || local.status === 'REFUNDED') &&
        local.gatewayPaymentId &&
        !evaluatedGatewayIds.has(local.gatewayPaymentId)
      ) {
        discrepancies.push({
          id: `missing_gw_${local.id}`,
          type: 'MISSING_GATEWAY',
          localPaymentId: local.id,
          gatewayPaymentId: local.gatewayPaymentId,
          gatewayOrderId: local.gatewayOrderId,
          localAmount: local.amount,
          localStatus: local.status,
          description: `Application payment ${local.id} (₹${local.amount}) is marked '${local.status}' but not found in Gateway records.`
        });
      }
    }

    // Calculate totals
    const localConfirmed = localPayments.filter(
      (p) => p.status === 'SUCCESS' || p.status === 'PARTIALLY_REFUNDED' || p.status === 'REFUNDED'
    );
    const localTotal = localConfirmed.reduce((sum, p) => sum + (p.amount - (p.refundAmount || 0)), 0);
    const localCount = localConfirmed.length;

    const gatewayCaptured = gatewayRecords.filter((g) => g.captured || g.status === 'captured');
    const gatewayTotal = gatewayCaptured.reduce(
      (sum, g) => sum + ((g.amount || 0) / 100 - (g.amount_refunded || 0) / 100),
      0
    );
    const gatewayCount = gatewayCaptured.length;

    const difference = localTotal - gatewayTotal;
    const mismatchesCount = discrepancies.length;
    const status: 'RECONCILED' | 'MISMATCH' = mismatchesCount === 0 ? 'RECONCILED' : 'MISMATCH';
    const recordsChecked = Math.max(localPayments.length, gatewayRecords.length);

    // Save reconciliation result to database
    const saved = await this.repository.saveReconciliation({
      status,
      periodStart: startDate,
      periodEnd: endDate,
      recordsChecked,
      mismatchesCount,
      localCount,
      localTotal,
      gatewayCount,
      gatewayTotal,
      difference,
      discrepancies,
      performedBy,
      metadata: {
        executedAt: new Date().toISOString()
      }
    });

    // Log to audit trail
    await this.repository.logAuditAction({
      action: 'RECONCILIATION_PERFORMED',
      actorType: 'ADMIN',
      actorId: performedBy,
      details: {
        reconciliationId: saved.id,
        status,
        recordsChecked,
        mismatchesCount,
        difference,
        localTotal,
        gatewayTotal
      }
    });

    return saved;
  }

  public async getLatestReconciliation(): Promise<ReconciliationResult | null> {
    return this.repository.getLatestReconciliation();
  }

  public async listAuditLogs(limit = 50): Promise<PaymentAuditLog[]> {
    return this.repository.listAuditLogs(limit);
  }

  /**
   * Generates actionable financial notifications for the Admin Notification Center.
   * Aggregates daily summaries, alerts on reconciliation mismatches, webhook failures, and refunds.
   * Never exposes sensitive payment credentials or internal secrets.
   */
  public async getFinancialNotifications(): Promise<
    Array<{
      id: string;
      type: 'SUCCESS' | 'WARNING' | 'ERROR' | 'REFUND' | 'INFO';
      title: string;
      message: string;
      timestamp: string;
      link?: string;
    }>
  > {
    const notifications: Array<{
      id: string;
      type: 'SUCCESS' | 'WARNING' | 'ERROR' | 'REFUND' | 'INFO';
      title: string;
      message: string;
      timestamp: string;
      link?: string;
    }> = [];

    // 1. Reconciliation Alert
    try {
      const latestRecon = await this.repository.getLatestReconciliation();
      if (latestRecon && latestRecon.status === 'MISMATCH' && latestRecon.mismatchesCount > 0) {
        notifications.push({
          id: `recon-${latestRecon.id}`,
          type: 'ERROR',
          title: 'Reconciliation Mismatch Detected',
          message: `${latestRecon.mismatchesCount} discrepancies detected (₹${latestRecon.difference} variance). Please review.`,
          timestamp: latestRecon.createdAt,
          link: '/donations?tab=reports'
        });
      }
    } catch {
      // Non-blocking
    }

    // 2. Daily Offerings Aggregation & Recent Contributions
    try {
      const overview = await this.repository.getOverviewData('30d');
      if (overview.metrics.todayCollection > 0) {
        notifications.push({
          id: `daily-summary-${new Date().toISOString().slice(0, 10)}`,
          type: 'SUCCESS',
          title: 'Daily Offerings Summary',
          message: `Today's collections reached ₹${overview.metrics.todayCollection.toLocaleString('en-IN')}.`,
          timestamp: new Date().toISOString(),
          link: '/donations?tab=overview'
        });
      }

      // Recent 2 successful payments
      const recent = await this.repository.list({ page: 1, limit: 2, status: 'SUCCESS' as any });
      for (const p of recent.data) {
        const donor = p.isAnonymous ? 'Anonymous Supporter' : p.supporterName || 'Devotee';
        notifications.push({
          id: `pay-${p.id}`,
          type: 'SUCCESS',
          title: 'Devotional Contribution Received',
          message: `₹${p.amount.toLocaleString('en-IN')} support received from ${donor}.`,
          timestamp: p.paidAt || p.createdAt,
          link: '/donations?tab=payments'
        });
      }
    } catch {
      // Non-blocking
    }

    // 3. Recent Refunds & Webhook/Gateway Failures from Audit Logs
    try {
      const logs = await this.repository.listAuditLogs(20);
      const refundLogs = logs.filter((l) => l.action === 'REFUND_RECORDED');
      for (const r of refundLogs.slice(0, 2)) {
        notifications.push({
          id: `refund-${r.id}`,
          type: 'REFUND',
          title: 'Refund Recorded',
          message: `Refund of ₹${r.details?.refundAmount || r.details?.amount || 0} recorded${r.details?.reason ? ` (${r.details.reason})` : ''}.`,
          timestamp: r.createdAt,
          link: '/donations?tab=payments'
        });
      }

      const errorLogs = logs.filter((l) => l.action === 'WEBHOOK_FAILED' || l.action === 'GATEWAY_ERROR');
      for (const err of errorLogs.slice(0, 2)) {
        notifications.push({
          id: `err-${err.id}`,
          type: 'ERROR',
          title: err.action === 'WEBHOOK_FAILED' ? 'Payment Webhook Failure' : 'Gateway Verification Issue',
          message: err.details?.error || 'A payment webhook processing or gateway verification issue occurred.',
          timestamp: err.createdAt,
          link: '/donations?tab=reports'
        });
      }
    } catch {
      // Non-blocking
    }

    return notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
}

export const paymentService = new PaymentService();
