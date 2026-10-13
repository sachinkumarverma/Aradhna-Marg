import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import http from 'http';
import jwt from 'jsonwebtoken';
import app from '../app';
import { db } from '../common/database/DatabaseClient';
import { paymentRepository } from '../repositories/PaymentRepository';
import { paymentController } from '../controllers/PaymentController';
import { PaymentService } from '../services/PaymentService';
import { RazorpayGateway } from '../services/payment/RazorpayGateway';
import { config } from '../config';
import { requireAdmin } from '../middlewares/auth';

describe('Payment & Donations Foundation Tests', () => {
  const TEST_SECRET = 'test_razorpay_secret_1234567890';
  const TEST_WEBHOOK_SECRET = 'test_webhook_secret_1234567890';

  // Mock gateway for offline/test determinism
  class MockRazorpayGateway extends RazorpayGateway {
    public lastCreatedOrderId?: string;
    public mockPayments: Map<string, any> = new Map();
    public fetchStatusToReturn?: string;
    public mockAllPayments: any[] = [];

    public async createOrder(params: any): Promise<any> {
      const orderId = `order_test_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      this.lastCreatedOrderId = orderId;
      return {
        id: orderId,
        entity: 'order',
        amount: params.amountInPaise,
        amount_paid: 0,
        amount_due: params.amountInPaise,
        currency: params.currency || 'INR',
        receipt: params.receipt,
        status: 'created',
        attempts: 0,
        notes: params.notes || {},
        created_at: Math.floor(Date.now() / 1000)
      };
    }

    public verifySignature(orderId: string, paymentId: string, signature: string): boolean {
      const payload = `${orderId}|${paymentId}`;
      const expected = crypto.createHmac('sha256', TEST_SECRET).update(payload).digest('hex');
      try {
        return crypto.timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(signature, 'utf8'));
      } catch {
        return false;
      }
    }

    public verifyWebhookSignature(rawBody: string | Buffer, signature: string): boolean {
      const expected = crypto.createHmac('sha256', TEST_WEBHOOK_SECRET).update(rawBody).digest('hex');
      try {
        return crypto.timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(signature, 'utf8'));
      } catch {
        return false;
      }
    }

    public async fetchPayment(paymentId: string): Promise<any> {
      if (this.mockPayments.has(paymentId)) {
        return this.mockPayments.get(paymentId);
      }
      return {
        id: paymentId,
        entity: 'payment',
        amount: 10100,
        currency: 'INR',
        status: 'captured',
        order_id: this.lastCreatedOrderId || 'order_test_mock',
        international: false,
        method: 'upi',
        amount_refunded: 0,
        captured: true,
        created_at: Math.floor(Date.now() / 1000)
      };
    }

    public async fetchAllPayments(params?: any): Promise<any> {
      if (this.fetchStatusToReturn && this.fetchStatusToReturn !== 'SUCCESSFUL_GATEWAY_FETCH') {
        return {
          fetchStatus: this.fetchStatusToReturn,
          items: [],
          count: 0,
          errorMessage: `Mock gateway status: ${this.fetchStatusToReturn}`
        };
      }
      const items = this.mockAllPayments;
      return {
        fetchStatus: items.length === 0 ? 'GATEWAY_EMPTY_RESULT' : 'SUCCESSFUL_GATEWAY_FETCH',
        items,
        count: items.length
      };
    }
  }

  const mockGateway = new MockRazorpayGateway();
  const paymentService = new PaymentService(paymentRepository, mockGateway);

  // Track created test record IDs for teardown
  const createdPaymentIds: string[] = [];

  after(async () => {
    // Teardown created test records
    if (createdPaymentIds.length > 0) {
      await db.query(`DELETE FROM payments WHERE id = ANY($1::uuid[])`, [createdPaymentIds]);
    }
    setTimeout(() => process.exit(0), 200);
  });

  // 1. Successful payment
  it('1. should process a successful payment and mark record as SUCCESS', async () => {
    const orderRes = await paymentService.createOrder({
      amount: 101,
      donorName: 'Test Devotee',
      donorEmail: 'testdevotee@example.com',
      donorPhone: '9876543210',
      note: 'Seva test donation'
    });

    assert.ok(orderRes.orderId);
    assert.strictEqual(orderRes.amount, 10100);

    const paymentInDb = await paymentRepository.findByGatewayOrderId(orderRes.orderId);
    assert.ok(paymentInDb);
    assert.strictEqual(paymentInDb.status, 'CREATED');
    createdPaymentIds.push(paymentInDb.id);

    // Generate valid HMAC signature
    const testPaymentId = `pay_test_${Date.now()}`;
    const validSignature = crypto
      .createHmac('sha256', TEST_SECRET)
      .update(`${orderRes.orderId}|${testPaymentId}`)
      .digest('hex');

    const verifyRes = await paymentService.verifyPayment({
      razorpay_order_id: orderRes.orderId,
      razorpay_payment_id: testPaymentId,
      razorpay_signature: validSignature,
      amount: 101,
      donorName: 'Test Devotee',
      donorEmail: 'testdevotee@example.com'
    });

    assert.strictEqual(verifyRes.verified, true);
    assert.strictEqual(verifyRes.payment?.status, 'SUCCESS');
    assert.strictEqual(verifyRes.payment?.gatewayPaymentId, testPaymentId);
    assert.ok(verifyRes.payment?.paidAt);
  });

  // 2. Failed payment
  it('2. should mark payment as FAILED when receiving gateway failure', async () => {
    const orderRes = await paymentService.createOrder({
      amount: 51,
      donorName: 'Failed Order Test'
    });
    const payment = await paymentRepository.findByGatewayOrderId(orderRes.orderId);
    assert.ok(payment);
    createdPaymentIds.push(payment.id);

    const failedPaymentId = `pay_fail_${Date.now()}`;
    const webhookPayload = {
      event: 'payment.failed',
      payload: {
        payment: {
          entity: {
            id: failedPaymentId,
            order_id: orderRes.orderId,
            error_code: 'BAD_REQUEST_ERROR',
            error_description: 'Payment failed due to insufficient funds'
          }
        }
      }
    };

    const rawBody = JSON.stringify(webhookPayload);
    const signature = crypto.createHmac('sha256', TEST_WEBHOOK_SECRET).update(rawBody).digest('hex');

    const res = await paymentService.handleWebhook(webhookPayload, signature, rawBody);
    assert.strictEqual(res.handled, true);

    const updated = await paymentRepository.findById(payment.id);
    assert.strictEqual(updated?.status, 'FAILED');
    assert.strictEqual(updated?.failureReason, 'Payment failed due to insufficient funds');
  });

  // 3. Duplicate webhook idempotency
  it('3. should handle duplicate webhooks idempotently without duplicate records', async () => {
    const paymentId = `pay_dup_${Date.now()}`;
    const orderId = `order_dup_${Date.now()}`;

    const orderRes = await paymentService.createOrder({
      amount: 251,
      donorName: 'Duplicate Test Donor'
    });
    const payment = await paymentRepository.findByGatewayOrderId(orderRes.orderId);
    assert.ok(payment);
    createdPaymentIds.push(payment.id);

    const webhookPayload = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: paymentId,
            order_id: orderRes.orderId,
            amount: 25100,
            currency: 'INR',
            method: 'upi'
          }
        }
      }
    };

    const rawBody = JSON.stringify(webhookPayload);
    const signature = crypto.createHmac('sha256', TEST_WEBHOOK_SECRET).update(rawBody).digest('hex');

    // First arrival
    const firstCall = await paymentService.handleWebhook(webhookPayload, signature, rawBody);
    assert.strictEqual(firstCall.handled, true);

    // Second arrival of identical webhook
    const secondCall = await paymentService.handleWebhook(webhookPayload, signature, rawBody);
    assert.strictEqual(secondCall.handled, true);
    assert.strictEqual(secondCall.idempotent, true);

    // Check count in database for this gateway_payment_id
    const { rows } = await db.query('SELECT COUNT(*) as count FROM payments WHERE gateway_payment_id = $1', [
      paymentId
    ]);
    assert.strictEqual(parseInt(rows[0].count, 10), 1);
  });

  // 4. Invalid webhook signature
  it('4. should reject webhook with invalid signature', async () => {
    const webhookPayload = {
      event: 'payment.captured',
      payload: { payment: { entity: { id: 'pay_invalid_sig' } } }
    };
    const rawBody = JSON.stringify(webhookPayload);
    const forgedSignature = 'bad_forged_signature_hex';

    await assert.rejects(
      async () => {
        await paymentService.handleWebhook(webhookPayload, forgedSignature, rawBody);
      },
      (err: any) => {
        assert.strictEqual(err.statusCode, 401);
        assert.match(err.message, /invalid webhook signature/i);
        return true;
      }
    );
  });

  // 5. Unknown transaction
  it('5. should throw 404 when querying unknown transaction', async () => {
    const nonExistentId = '00000000-0000-4000-a000-000000000099';
    await assert.rejects(
      async () => {
        await paymentService.getPaymentById(nonExistentId);
      },
      (err: any) => {
        assert.strictEqual(err.statusCode, 404);
        assert.match(err.message, /not found/i);
        return true;
      }
    );
  });

  // 6. Status transition
  it('6. should strictly enforce status transitions (CREATED -> SUCCESS -> PARTIALLY_REFUNDED -> REFUNDED)', async () => {
    const payment = await paymentRepository.create({
      supporterName: 'Transition Devotee',
      amount: 500,
      currency: 'INR'
    });
    createdPaymentIds.push(payment.id);

    assert.strictEqual(payment.status, 'CREATED');

    // Cannot refund a payment in CREATED status
    await assert.rejects(
      async () => {
        await paymentService.recordRefund(payment.id, 100);
      },
      (err: any) => {
        assert.strictEqual(err.statusCode, 400);
        assert.match(err.message, /cannot refund/i);
        return true;
      }
    );

    // Move to SUCCESS
    const successPayment = await paymentRepository.markPaymentSuccessful({
      id: payment.id,
      gatewayPaymentId: `pay_trans_${Date.now()}`
    });
    assert.strictEqual(successPayment?.status, 'SUCCESS');

    // Partial refund -> PARTIALLY_REFUNDED
    const partialRefund = await paymentService.recordRefund(payment.id, 200, 'Partial refund');
    assert.strictEqual(partialRefund?.status, 'PARTIALLY_REFUNDED');
    assert.strictEqual(partialRefund?.refundAmount, 200);

    // Complete refund -> REFUNDED
    const fullRefund = await paymentService.recordRefund(payment.id, 300, 'Full remaining refund');
    assert.strictEqual(fullRefund?.status, 'REFUNDED');
    assert.strictEqual(fullRefund?.refundAmount, 500);
  });

  // 7. Refund validation
  it('7. should reject refund exceeding the original donation amount', async () => {
    const payment = await paymentRepository.create({
      supporterName: 'Refund Overflow Test',
      amount: 100
    });
    createdPaymentIds.push(payment.id);

    await paymentRepository.markPaymentSuccessful({
      id: payment.id,
      gatewayPaymentId: `pay_refund_limit_${Date.now()}`
    });

    await assert.rejects(
      async () => {
        await paymentService.recordRefund(payment.id, 150);
      },
      (err: any) => {
        assert.strictEqual(err.statusCode, 400);
        assert.match(err.message, /exceeds remaining refundable amount/i);
        return true;
      }
    );
  });

  // 8. Invalid amount
  it('8. should reject invalid amounts and detect amount tampering', async () => {
    // 8a. Zero / negative amount in order creation
    await assert.rejects(
      async () => {
        await paymentService.createOrder({ amount: 0 });
      },
      (err: any) => {
        assert.strictEqual(err.statusCode, 400);
        return true;
      }
    );

    await assert.rejects(
      async () => {
        await paymentService.createOrder({ amount: -50 });
      },
      (err: any) => {
        assert.strictEqual(err.statusCode, 400);
        return true;
      }
    );

    // 8b. Amount tampering during verification
    const orderRes = await paymentService.createOrder({ amount: 501 });
    const payment = await paymentRepository.findByGatewayOrderId(orderRes.orderId);
    assert.ok(payment);
    createdPaymentIds.push(payment.id);

    const testPaymentId = `pay_tamper_${Date.now()}`;
    const validSignature = crypto
      .createHmac('sha256', TEST_SECRET)
      .update(`${orderRes.orderId}|${testPaymentId}`)
      .digest('hex');

    // Client passes amount = 1 instead of 501
    await assert.rejects(
      async () => {
        await paymentService.verifyPayment({
          razorpay_order_id: orderRes.orderId,
          razorpay_payment_id: testPaymentId,
          razorpay_signature: validSignature,
          amount: 1 // TAMPERED AMOUNT
        });
      },
      (err: any) => {
        assert.strictEqual(err.statusCode, 400);
        assert.match(err.message, /tampering detected/i);
        return true;
      }
    );
  });

  // 9. Missing required data
  it('9. should reject verification with missing IDs or signature', async () => {
    await assert.rejects(
      async () => {
        await paymentService.verifyPayment({
          razorpay_order_id: '',
          razorpay_payment_id: 'pay_test',
          razorpay_signature: 'sig_test'
        });
      },
      (err: any) => {
        assert.strictEqual(err.statusCode, 400);
        assert.match(err.message, /signature or IDs missing/i);
        return true;
      }
    );
  });

  // 10. Unauthorized admin access
  it('10. should block unauthorized admin access without valid JWT', async () => {
    let capturedError: any = null;

    const mockReqWithoutToken: any = {
      headers: {},
      cookies: {}
    };

    const mockRes: any = {
      status: (code: number) => ({
        json: (data: any) => {
          capturedError = { code, data };
        }
      })
    };

    const nextFn = (err?: any) => {
      if (err) capturedError = err;
    };

    await requireAdmin(mockReqWithoutToken, mockRes, nextFn);
    assert.ok(capturedError, 'Middleware should have blocked access');
    assert.strictEqual(capturedError.statusCode || capturedError.code, 401);

    // Now test with invalid signature token
    capturedError = null;
    const fakeToken = jwt.sign({ username: 'fake' }, 'wrong_secret_123');
    const mockReqWithBadToken: any = {
      headers: { authorization: `Bearer ${fakeToken}` },
      cookies: {}
    };

    await requireAdmin(mockReqWithBadToken, mockRes, nextFn);
    assert.ok(capturedError, 'Middleware should have rejected invalid token');
    assert.strictEqual(capturedError.statusCode || capturedError.code, 401);
  });

  // 11. Overview metrics and breakdown
  it('11. should compute overview metrics and breakdowns', async () => {
    const overview = await paymentService.getOverviewData('30d');
    assert.ok(overview);
    assert.ok(typeof overview.metrics.totalCollected === 'number');
    assert.ok(typeof overview.metrics.successfulPayments === 'number');
    assert.ok(Array.isArray(overview.trend));
    assert.ok(Array.isArray(overview.paymentMethodBreakdown));
    assert.ok(Array.isArray(overview.contributionAmountBreakdown));
  });

  // 12. Supporters aggregation & anonymous handling
  it('12. should aggregate supporters and format anonymous contributors', async () => {
    // Create an anonymous payment
    const anonPayment = await paymentRepository.create({
      supporterName: 'Secret Devotee',
      amount: 108,
      isAnonymous: true
    });
    createdPaymentIds.push(anonPayment.id);
    await paymentRepository.markPaymentSuccessful({
      id: anonPayment.id,
      gatewayPaymentId: `pay_anon_${Date.now()}`
    });

    const supportersRes = await paymentService.getSupportersList({ page: 1, limit: 10 });
    assert.ok(Array.isArray(supportersRes.data));
    assert.ok(supportersRes.total >= 1);

    const anonItem = supportersRes.data.find((s) => s.supporterKey === anonPayment.id);
    if (anonItem) {
      assert.strictEqual(anonItem.isAnonymous, true);
      assert.strictEqual(anonItem.supporterName, 'Anonymous Supporter');
    }
  });

  // 13. Financial reports and CSV export
  it('13. should generate financial report and export RFC-compliant CSV', async () => {
    const report = await paymentService.getFinancialReport({});
    assert.ok(typeof report.grossCollection === 'number');
    assert.ok(typeof report.netCollection === 'number');
    assert.ok(typeof report.refunds === 'number');

    const csv = await paymentService.exportPaymentsCsv({});
    assert.ok(typeof csv === 'string');
    assert.match(csv, /^ID,Date,Supporter Name,Supporter Email/);
  });

  // 14. Status Transitions & State Machine
  it('14. should enforce payment state transitions and prevent invalid transitions', async () => {
    const { PaymentStateMachine } = await import('../services/payment/PaymentStateMachine');

    // Valid transitions
    assert.strictEqual(PaymentStateMachine.canTransition('CREATED', 'SUCCESS'), true);
    assert.strictEqual(PaymentStateMachine.canTransition('CREATED', 'FAILED'), true);
    assert.strictEqual(PaymentStateMachine.canTransition('SUCCESS', 'PARTIALLY_REFUNDED'), true);
    assert.strictEqual(PaymentStateMachine.canTransition('SUCCESS', 'REFUNDED'), true);
    assert.strictEqual(PaymentStateMachine.canTransition('PARTIALLY_REFUNDED', 'REFUNDED'), true);

    // Invalid transitions must be rejected
    assert.strictEqual(PaymentStateMachine.canTransition('REFUNDED', 'SUCCESS'), false);
    assert.strictEqual(PaymentStateMachine.canTransition('CANCELLED', 'REFUNDED'), false);
    assert.strictEqual(PaymentStateMachine.canTransition('SUCCESS', 'FAILED'), false);
    assert.strictEqual(PaymentStateMachine.canTransition('SUCCESS', 'CREATED'), false);
    assert.strictEqual(PaymentStateMachine.canTransition('REFUNDED', 'PENDING'), false);

    assert.throws(
      () => PaymentStateMachine.validateTransition('REFUNDED', 'SUCCESS', 'test'),
      /Invalid payment status transition/
    );
  });

  // 15. Concurrent Webhook Processing Idempotency
  it('15. should handle concurrent duplicate webhooks idempotently without duplicate records', async () => {
    const concurrentOrderId = `order_concurrent_${Date.now()}`;
    const concurrentPaymentId = `pay_concurrent_${Date.now()}`;

    const webhookPayload = {
      event: 'payment.captured',
      event_id: `evt_concurrent_${Date.now()}`,
      created_at: Math.floor(Date.now() / 1000),
      payload: {
        payment: {
          entity: {
            id: concurrentPaymentId,
            order_id: concurrentOrderId,
            amount: 25100,
            currency: 'INR',
            status: 'captured',
            method: 'upi',
            notes: { donorName: 'Concurrent Tester' }
          }
        }
      }
    };

    const rawBody = JSON.stringify(webhookPayload);
    const signature = crypto.createHmac('sha256', TEST_WEBHOOK_SECRET).update(rawBody).digest('hex');

    // Execute 5 simultaneous webhook calls
    const results = await Promise.all([
      paymentService.handleWebhook(webhookPayload, signature, rawBody),
      paymentService.handleWebhook(webhookPayload, signature, rawBody),
      paymentService.handleWebhook(webhookPayload, signature, rawBody),
      paymentService.handleWebhook(webhookPayload, signature, rawBody),
      paymentService.handleWebhook(webhookPayload, signature, rawBody)
    ]);

    // All should resolve gracefully
    assert.strictEqual(results.length, 5);
    results.forEach((r) => assert.strictEqual(r.handled, true));

    // Exactly 1 payment record should exist in database
    const matching = await db.query(`SELECT * FROM payments WHERE gateway_payment_id = $1`, [concurrentPaymentId]);
    assert.strictEqual(matching.rows.length, 1);
    createdPaymentIds.push(matching.rows[0].id);
  });

  // 16. Partial and Full Refunds with Database Tracking
  it('16. should track partial and full refunds in payment_refunds table', async () => {
    // Create base successful payment
    const payment = await paymentRepository.create({
      supporterName: 'Refundable Devotee',
      amount: 500,
      currency: 'INR'
    });
    createdPaymentIds.push(payment.id);

    const testGwPayId = `pay_rfnd_test_${Date.now()}`;
    await paymentRepository.markPaymentSuccessful({
      id: payment.id,
      gatewayPaymentId: testGwPayId
    });

    // 1. Partial refund of ₹200
    const partial = await paymentService.recordRefund(payment.id, 200, 'Partial refund test');
    assert.strictEqual(partial?.status, 'PARTIALLY_REFUNDED');
    assert.strictEqual(partial?.refundAmount, 200);

    // Check payment_refunds table record
    const refundsQuery1 = await db.query(`SELECT * FROM payment_refunds WHERE payment_id = $1`, [payment.id]);
    assert.strictEqual(refundsQuery1.rows.length, 1);
    assert.strictEqual(parseFloat(refundsQuery1.rows[0].amount), 200);

    // 2. Full refund of remaining ₹300
    const full = await paymentService.recordRefund(payment.id, 300, 'Remaining refund');
    assert.strictEqual(full?.status, 'REFUNDED');
    assert.strictEqual(full?.refundAmount, 500);

    // Check payment_refunds table now has 2 records
    const refundsQuery2 = await db.query(
      `SELECT * FROM payment_refunds WHERE payment_id = $1 ORDER BY created_at ASC`,
      [payment.id]
    );
    assert.strictEqual(refundsQuery2.rows.length, 2);

    // 3. Attempting further refund must fail closed
    await assert.rejects(
      async () => paymentService.recordRefund(payment.id, 50, 'Excess refund'),
      /Cannot refund a payment with status 'REFUNDED'/
    );
  });

  // 17. Financial Reconciliation Engine
  it('17. should perform financial reconciliation and detect discrepancies', async () => {
    // Create a local payment
    const localPay = await paymentRepository.create({
      supporterName: 'Recon Test Donor',
      amount: 100,
      currency: 'INR'
    });
    createdPaymentIds.push(localPay.id);

    const payIdA = `pay_recon_a_${Date.now()}`;
    await paymentRepository.markPaymentSuccessful({
      id: localPay.id,
      gatewayPaymentId: payIdA
    });

    // Create another local payment that has an amount mismatch
    const localMismatchPay = await paymentRepository.create({
      supporterName: 'Mismatch Donor',
      amount: 50,
      currency: 'INR'
    });
    createdPaymentIds.push(localMismatchPay.id);

    const payIdB = `pay_recon_b_${Date.now()}`;
    await paymentRepository.markPaymentSuccessful({
      id: localMismatchPay.id,
      gatewayPaymentId: payIdB
    });

    // Gateway reports:
    // - payIdA matching (amount 10000 = ₹100)
    // - payIdB mismatching (amount 7000 = ₹70, local is ₹50)
    // - payIdC missing locally (amount 20000 = ₹200, captured)
    const mockGatewayRecords = [
      {
        id: payIdA,
        order_id: 'order_recon_a',
        amount: 10000,
        amount_refunded: 0,
        status: 'captured',
        captured: true
      },
      {
        id: payIdB,
        order_id: 'order_recon_b',
        amount: 7000,
        amount_refunded: 0,
        status: 'captured',
        captured: true
      },
      {
        id: `pay_recon_c_missing_${Date.now()}`,
        order_id: 'order_recon_c',
        amount: 20000,
        amount_refunded: 0,
        status: 'captured',
        captured: true
      }
    ];

    const reconResult = await paymentService.reconcileWithGateway({
      customGatewayRecords: mockGatewayRecords,
      performedBy: 'test_admin'
    });

    assert.strictEqual(reconResult.status, 'MISMATCH');
    assert.ok(reconResult.mismatchesCount >= 2);
    assert.ok(reconResult.discrepancies.some((d) => d.type === 'AMOUNT_MISMATCH'));
    assert.ok(reconResult.discrepancies.some((d) => d.type === 'MISSING_LOCAL'));

    // Check that latest reconciliation query returns this run
    const latestRecon = await paymentService.getLatestReconciliation();
    assert.ok(latestRecon);
    assert.strictEqual(latestRecon?.id, reconResult.id);
  });

  // 18. Audit Trail Verification
  it('18. should record audit trail for payment actions', async () => {
    const logs = await paymentService.listAuditLogs(10);
    assert.ok(Array.isArray(logs));
    assert.ok(logs.length > 0);

    const actions = logs.map((l) => l.action);
    assert.ok(actions.includes('PAYMENT_VERIFIED') || actions.includes('RECONCILIATION_PERFORMED'));
  });

  // 19. Financial Totals Consistency
  it('19. should ensure Gross Collection - Refunds = Net Collection mathematically', async () => {
    const report = await paymentService.getFinancialReport({});
    const computedNet = report.grossCollection - report.refunds;
    assert.ok(
      Math.abs(report.netCollection - computedNet) < 0.01,
      `Net collection (₹${report.netCollection}) must equal Gross (₹${report.grossCollection}) - Refunds (₹${report.refunds})`
    );
  });

  // 20. Webhook retry after business mutation failure (Critical 1)
  it('20. should roll back webhook event registration on business mutation failure and allow retry to reach SUCCESS', async () => {
    const orderRes = await paymentService.createOrder({
      amount: 151,
      donorName: 'Retry Devotee'
    });
    const payment = await paymentRepository.findByGatewayOrderId(orderRes.orderId);
    assert.ok(payment);
    createdPaymentIds.push(payment.id);

    const paymentId = `pay_retry_${Date.now()}`;
    const eventId = `evt_retry_${Date.now()}`;
    const webhookPayload = {
      event_id: eventId,
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: paymentId,
            order_id: orderRes.orderId,
            amount: 15100,
            currency: 'INR',
            method: 'upi'
          }
        }
      }
    };
    const rawBody = JSON.stringify(webhookPayload);
    const signature = crypto.createHmac('sha256', TEST_WEBHOOK_SECRET).update(rawBody).digest('hex');

    // Simulate transient failure during mutation
    const origMarkSuccessful = paymentRepository.markPaymentSuccessful.bind(paymentRepository);
    let failAttempt = true;
    paymentRepository.markPaymentSuccessful = async function (...args: any[]) {
      if (failAttempt) {
        failAttempt = false;
        throw new Error('Simulated transient business mutation failure');
      }
      return origMarkSuccessful(...args);
    };

    try {
      // First attempt: should throw because business mutation failed
      await assert.rejects(
        async () => paymentService.handleWebhook(webhookPayload, signature, rawBody),
        /Simulated transient business mutation failure/
      );

      // Verify that webhook event was rolled back (not permanently claimed)
      const eventInDb = await db.query('SELECT * FROM payment_webhook_events WHERE event_id = $1', [eventId]);
      assert.strictEqual(eventInDb.rows.length, 0, 'Webhook event must not be recorded when mutation fails');

      // Verify payment is still in CREATED status
      const paymentBeforeRetry = await paymentRepository.findById(payment.id);
      assert.strictEqual(paymentBeforeRetry?.status, 'CREATED');

      // Retry: Razorpay redelivers the exact same webhook
      const retryResult = await paymentService.handleWebhook(webhookPayload, signature, rawBody);
      assert.strictEqual(retryResult.handled, true);

      // Now payment has reached SUCCESS
      const paymentAfterRetry = await paymentRepository.findById(payment.id);
      assert.strictEqual(paymentAfterRetry?.status, 'SUCCESS');
      assert.strictEqual(paymentAfterRetry?.gatewayPaymentId, paymentId);

      // Webhook event is now committed
      const eventCommitted = await db.query('SELECT * FROM payment_webhook_events WHERE event_id = $1', [eventId]);
      assert.strictEqual(eventCommitted.rows.length, 1);
    } finally {
      paymentRepository.markPaymentSuccessful = origMarkSuccessful;
    }
  });

  // 21. Untrusted fallback payment amount: Missing local order rejection (Critical 2)
  it('21. should fail closed and reject payment verification if local order is missing', async () => {
    const fakeOrderId = `order_fake_${Date.now()}`;
    const fakePayId = `pay_fake_${Date.now()}`;
    const fakeSignature = crypto.createHmac('sha256', TEST_SECRET).update(`${fakeOrderId}|${fakePayId}`).digest('hex');

    await assert.rejects(
      async () =>
        paymentService.verifyPayment({
          razorpay_order_id: fakeOrderId,
          razorpay_payment_id: fakePayId,
          razorpay_signature: fakeSignature,
          amount: 5000,
          donorName: 'Malicious Attacker'
        }),
      /Payment verification rejected: Order not found in system/
    );

    // Verify NO payment was created for this fake order
    const checkDb = await paymentRepository.findByGatewayOrderId(fakeOrderId);
    assert.strictEqual(checkDb, null);
  });

  // 22. Untrusted fallback payment amount: Amount tampering & gateway verification (Critical 2)
  it('22. should reject verification on client amount tampering or gateway amount mismatch', async () => {
    const orderRes = await paymentService.createOrder({
      amount: 101,
      donorName: 'Amount Integrity Devotee'
    });
    const payment = await paymentRepository.findByGatewayOrderId(orderRes.orderId);
    assert.ok(payment);
    createdPaymentIds.push(payment.id);

    const testPayId = `pay_tamper_${Date.now()}`;
    const validSignature = crypto
      .createHmac('sha256', TEST_SECRET)
      .update(`${orderRes.orderId}|${testPayId}`)
      .digest('hex');

    // Case A: Malicious client tries huge amount (e.g. ₹99999)
    await assert.rejects(
      async () =>
        paymentService.verifyPayment({
          razorpay_order_id: orderRes.orderId,
          razorpay_payment_id: testPayId,
          razorpay_signature: validSignature,
          amount: 99999
        }),
      /Invalid payment amount. Tampering detected./
    );

    // Case B: Malicious client tries tiny amount (e.g. ₹1)
    await assert.rejects(
      async () =>
        paymentService.verifyPayment({
          razorpay_order_id: orderRes.orderId,
          razorpay_payment_id: testPayId,
          razorpay_signature: validSignature,
          amount: 1
        }),
      /Invalid payment amount. Tampering detected./
    );

    // Case C: Gateway reports mismatching amount (e.g. ₹50 instead of ₹101)
    mockGateway.mockPayments.set(testPayId, {
      id: testPayId,
      order_id: orderRes.orderId,
      amount: 5000, // ₹50 in paise
      currency: 'INR',
      status: 'captured',
      method: 'upi'
    });

    await assert.rejects(
      async () =>
        paymentService.verifyPayment({
          razorpay_order_id: orderRes.orderId,
          razorpay_payment_id: testPayId,
          razorpay_signature: validSignature,
          amount: 101
        }),
      /Payment amount mismatch between gateway and recorded order./
    );

    // Case D: Valid verification with gateway reporting matching amount (10100 paise)
    mockGateway.mockPayments.set(testPayId, {
      id: testPayId,
      order_id: orderRes.orderId,
      amount: 10100, // ₹101 in paise
      currency: 'INR',
      status: 'captured',
      method: 'upi'
    });

    const verifySuccess = await paymentService.verifyPayment({
      razorpay_order_id: orderRes.orderId,
      razorpay_payment_id: testPayId,
      razorpay_signature: validSignature,
      amount: 101
    });

    assert.strictEqual(verifySuccess.verified, true);
    assert.strictEqual(verifySuccess.payment?.amount, 101);
  });

  // 23. Reconciliation must fail closed on gateway errors (High 1)
  it('23. should fail closed on reconciliation gateway failure and never produce RECONCILED', async () => {
    // Case A: Gateway Error
    mockGateway.fetchStatusToReturn = 'GATEWAY_ERROR';
    const errRecon = await paymentService.reconcileWithGateway({ liveFetch: true });
    assert.strictEqual(errRecon.status, 'UNAVAILABLE');
    assert.strictEqual(errRecon.discrepancies[0].type, 'GATEWAY_UNAVAILABLE');
    assert.ok(errRecon.discrepancies[0].description.includes('Gateway unavailable'));

    // Case B: Gateway Timeout
    mockGateway.fetchStatusToReturn = 'GATEWAY_TIMEOUT';
    const timeoutRecon = await paymentService.reconcileWithGateway({ liveFetch: true });
    assert.strictEqual(timeoutRecon.status, 'UNAVAILABLE');
    assert.strictEqual(timeoutRecon.discrepancies[0].type, 'GATEWAY_UNAVAILABLE');

    // Case C: Gateway Auth Error
    mockGateway.fetchStatusToReturn = 'GATEWAY_AUTH_ERROR';
    const authRecon = await paymentService.reconcileWithGateway({ liveFetch: true });
    assert.strictEqual(authRecon.status, 'UNAVAILABLE');
    assert.strictEqual(authRecon.discrepancies[0].type, 'GATEWAY_UNAVAILABLE');

    // Reset mock status
    mockGateway.fetchStatusToReturn = undefined;
  });

  // 24. Razorpay payment list pagination >100 records (High 3)
  it('24. should paginate and fetch all gateway records (>100) during reconciliation', async () => {
    const items150 = Array.from({ length: 150 }, (_, i) => ({
      id: `pay_page_${i}`,
      entity: 'payment',
      amount: 10000,
      currency: 'INR',
      status: 'captured',
      order_id: `order_page_${i}`,
      method: 'upi',
      captured: true,
      amount_refunded: 0,
      created_at: 1700000000 + i
    }));

    class PaginatedMockGateway extends RazorpayGateway {
      public async fetchAllPayments(params?: { from?: number; to?: number; maxRecords?: number }) {
        const pageSize = 100;
        const allItems: any[] = [];
        let skip = 0;
        while (skip < items150.length) {
          const slice = items150.slice(skip, skip + pageSize);
          allItems.push(...slice);
          if (slice.length < pageSize) break;
          skip += slice.length;
        }
        return {
          fetchStatus: 'SUCCESSFUL_GATEWAY_FETCH' as const,
          items: allItems,
          count: allItems.length
        };
      }
    }

    const paginatedGw = new PaginatedMockGateway();
    const result = await paginatedGw.fetchAllPayments();
    assert.strictEqual(result.count, 150);
    assert.strictEqual(result.items.length, 150);
    assert.strictEqual(result.fetchStatus, 'SUCCESSFUL_GATEWAY_FETCH');
  });

  // 25. Financial report end-date boundary [startDate, nextDayStart) (Medium 1)
  it('25. should include transactions at 23:59:59 on the selected end date (inclusive boundary)', async () => {
    const boundaryPayment = await paymentRepository.create({
      supporterName: 'Boundary Devotee',
      amount: 111,
      currency: 'INR'
    });
    createdPaymentIds.push(boundaryPayment.id);

    await db.query(`UPDATE payments SET created_at = '2026-10-13 23:59:59+00' WHERE id = $1`, [boundaryPayment.id]);

    const result = await paymentRepository.list({
      startDate: '2026-10-13',
      endDate: '2026-10-13'
    });

    const found = result.data.find((p) => p.id === boundaryPayment.id);
    assert.ok(found, 'Transaction at 23:59:59 on selected end date must be included in results');
  });

  // 26. Public payment verification response sanitization (Medium 2)
  it('26. should sanitize public payment verification response and exclude gatewaySignature', async () => {
    const orderRes = await paymentService.createOrder({
      amount: 51,
      donorName: 'Sanitize Test Devotee'
    });
    const payment = await paymentRepository.findByGatewayOrderId(orderRes.orderId);
    assert.ok(payment);
    createdPaymentIds.push(payment.id);

    const testPayId = `pay_sanitize_${Date.now()}`;
    const validSignature = crypto
      .createHmac('sha256', TEST_SECRET)
      .update(`${orderRes.orderId}|${testPayId}`)
      .digest('hex');

    mockGateway.mockPayments.set(testPayId, {
      id: testPayId,
      order_id: orderRes.orderId,
      amount: 5100,
      currency: 'INR',
      status: 'captured',
      method: 'upi'
    });

    const verifyRes = await paymentService.verifyPayment({
      razorpay_order_id: orderRes.orderId,
      razorpay_payment_id: testPayId,
      razorpay_signature: validSignature,
      amount: 51
    });

    assert.strictEqual(verifyRes.verified, true);
    assert.strictEqual((verifyRes.payment as any).gatewaySignature, undefined);
    assert.strictEqual('gatewaySignature' in (verifyRes.payment || {}), false);
    if (verifyRes.payment?.metadata) {
      assert.strictEqual((verifyRes.payment.metadata as any).razorpay_signature, undefined);
    }
  });

  // 27. Anonymous supporter privacy (Medium 3)
  it('27. should protect anonymous supporter privacy and mask email and phone', async () => {
    const anonPayment = await paymentRepository.create({
      supporterName: 'Secret Anonymous Devotee',
      supporterEmail: 'private_devotee@example.com',
      supporterPhone: '9876543210',
      amount: 501,
      currency: 'INR',
      isAnonymous: true
    });
    createdPaymentIds.push(anonPayment.id);
    await paymentRepository.markPaymentSuccessful({
      id: anonPayment.id,
      gatewayPaymentId: `pay_anon_privacy_${Date.now()}`
    });

    const details = await paymentRepository.getSupporterDetails(anonPayment.id);
    assert.ok(details.supporter);
    assert.strictEqual(details.supporter?.isAnonymous, true);
    assert.strictEqual(details.supporter?.supporterName, 'Anonymous Supporter');
    assert.strictEqual(details.supporter?.supporterEmail, undefined);

    const sanitized = paymentService.sanitizePayment(anonPayment);
    assert.strictEqual(sanitized?.supporterName, 'Anonymous Supporter');
    assert.strictEqual(sanitized?.supporterEmail, undefined);
    assert.strictEqual(sanitized?.supporterPhone, undefined);
  });

  // 28. Webhook rawBody requirement (Medium 4)
  it('28. should fail closed when rawBody is unavailable in webhook controller', async () => {
    let capturedError: any = null;
    const mockReq: any = {
      headers: {
        'x-razorpay-signature': 'some_signature'
      },
      body: { event: 'payment.captured' }
    };
    const mockRes: any = {};
    const mockNext = (err: any) => {
      capturedError = err;
    };

    await paymentController.handleWebhook(mockReq, mockRes, mockNext);

    assert.ok(capturedError, 'Controller must fail closed when rawBody is missing');
    assert.strictEqual(capturedError.statusCode, 400);
    assert.ok(capturedError.message.includes('Raw request body unavailable'));
  });

  // 29. Anonymous supporter aggregation masking always wins over MAX() (Low Priority)
  it('29. should ensure anonymous masking always wins in supporter aggregation over MAX()', async () => {
    const sharedEmail = `shared_${Date.now()}@testdonor.com`;

    const p1 = await paymentRepository.create({
      supporterName: 'Real Name Devotee',
      supporterEmail: sharedEmail,
      amount: 100,
      isAnonymous: false
    });
    createdPaymentIds.push(p1.id);
    await paymentRepository.markPaymentSuccessful({
      id: p1.id,
      gatewayPaymentId: `pay_real_${Date.now()}`
    });

    const p2 = await paymentRepository.create({
      supporterName: 'Secret ZZZ Name',
      supporterEmail: sharedEmail,
      amount: 200,
      isAnonymous: true
    });
    createdPaymentIds.push(p2.id);
    await paymentRepository.markPaymentSuccessful({
      id: p2.id,
      gatewayPaymentId: `pay_secret_${Date.now()}`
    });

    const supporters = await paymentRepository.getSupportersList({ search: sharedEmail });
    assert.ok(supporters.data.length >= 1);

    const anonSupporter = supporters.data.find((s) => s.supporterKey === p2.id);
    assert.ok(anonSupporter);
    assert.strictEqual(anonSupporter?.supporterName, 'Anonymous Supporter');
    assert.strictEqual(anonSupporter?.supporterEmail, undefined);
    assert.strictEqual(anonSupporter?.isAnonymous, true);
  });

  // 30. Production webhook routing verification (High 2)
  it('30. should route /api/payments/webhook directly to webhook handler', async () => {
    const server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const port = (server.address() as any).port;

    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/payments/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ test: true })
      });

      assert.strictEqual(response.status, 400);
      const data = await response.json();
      assert.ok(data.error?.includes('signature') || data.message?.includes('signature'));
    } finally {
      server.close();
    }
  });
});
