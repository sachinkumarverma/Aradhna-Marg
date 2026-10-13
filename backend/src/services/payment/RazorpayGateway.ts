import axios from 'axios';
import crypto from 'crypto';
import { config } from '@/config';
import { logger } from '@utils/logger';
import { AppError, InternalServerError } from '@/errors/appError';

export interface RazorpayOrderResult {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  attempts: number;
  notes: Record<string, any>;
  created_at: number;
}

export interface RazorpayPaymentDetails {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  status: string;
  order_id: string;
  invoice_id?: string;
  international: boolean;
  method: string;
  amount_refunded: number;
  refund_status?: string;
  captured: boolean;
  description?: string;
  card_id?: string;
  bank?: string;
  wallet?: string;
  vpa?: string;
  email?: string;
  contact?: string;
  error_code?: string;
  error_description?: string;
  created_at: number;
}

export type GatewayFetchStatus =
  'SUCCESSFUL_GATEWAY_FETCH' | 'GATEWAY_EMPTY_RESULT' | 'GATEWAY_ERROR' | 'GATEWAY_TIMEOUT' | 'GATEWAY_AUTH_ERROR';

export interface GatewayFetchResult {
  fetchStatus: GatewayFetchStatus;
  items: RazorpayPaymentDetails[];
  count: number;
  errorMessage?: string;
}

export class RazorpayGateway {
  private getAuthHeader(): string {
    if (!config.RAZORPAY_KEY_ID || !config.RAZORPAY_KEY_SECRET) {
      throw new InternalServerError('Razorpay credentials (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET) are not configured.');
    }
    return Buffer.from(`${config.RAZORPAY_KEY_ID}:${config.RAZORPAY_KEY_SECRET}`).toString('base64');
  }

  /**
   * Creates an order with Razorpay Orders API.
   */
  public async createOrder(params: {
    amountInPaise: number;
    currency?: string;
    receipt: string;
    notes?: Record<string, string>;
  }): Promise<RazorpayOrderResult> {
    const auth = this.getAuthHeader();

    try {
      const response = await axios.post<RazorpayOrderResult>(
        'https://api.razorpay.com/v1/orders',
        {
          amount: params.amountInPaise,
          currency: params.currency || 'INR',
          receipt: params.receipt,
          notes: params.notes || {}
        },
        {
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      return response.data;
    } catch (error: any) {
      logger.error('Razorpay API Create Order Error:', error?.response?.data || error.message);
      const errorMsg = error?.response?.data?.error?.description || 'Razorpay order creation failed';
      throw new AppError(errorMsg, 400);
    }
  }

  /**
   * Verifies checkout payment signature using HMAC SHA256.
   */
  public verifySignature(orderId: string, paymentId: string, signature: string): boolean {
    if (!config.RAZORPAY_KEY_SECRET) {
      throw new InternalServerError('Razorpay secret is not configured.');
    }

    if (!orderId || !paymentId || !signature) {
      return false;
    }

    const payload = `${orderId}|${paymentId}`;
    const expectedSignature = crypto.createHmac('sha256', config.RAZORPAY_KEY_SECRET).update(payload).digest('hex');

    try {
      return crypto.timingSafeEqual(Buffer.from(expectedSignature, 'utf8'), Buffer.from(signature, 'utf8'));
    } catch {
      return false;
    }
  }

  /**
   * Verifies Razorpay Webhook signature against raw request body.
   */
  public verifyWebhookSignature(rawBody: string | Buffer, signature: string): boolean {
    const secret = config.RAZORPAY_WEBHOOK_SECRET || config.RAZORPAY_KEY_SECRET;
    if (!secret) {
      logger.error(
        'Webhook signature verification failed: neither RAZORPAY_WEBHOOK_SECRET nor RAZORPAY_KEY_SECRET configured'
      );
      return false;
    }

    if (!rawBody || !signature) {
      return false;
    }

    const expectedSignature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

    try {
      return crypto.timingSafeEqual(Buffer.from(expectedSignature, 'utf8'), Buffer.from(signature, 'utf8'));
    } catch {
      return false;
    }
  }

  /**
   * Fetches payment details from Razorpay to verify captured status & payment method.
   */
  public async fetchPayment(paymentId: string): Promise<RazorpayPaymentDetails | null> {
    try {
      const auth = this.getAuthHeader();
      const response = await axios.get<RazorpayPaymentDetails>(`https://api.razorpay.com/v1/payments/${paymentId}`, {
        headers: {
          Authorization: `Basic ${auth}`
        },
        timeout: 10000
      });
      return response.data;
    } catch (err: any) {
      logger.warn(`Could not fetch payment ${paymentId} directly from Razorpay:`, err.message);
      return null;
    }
  }

  /**
   * Initiates a refund through Razorpay API.
   */
  public async createRefund(paymentId: string, amountInPaise?: number, notes?: Record<string, any>): Promise<any> {
    const auth = this.getAuthHeader();
    try {
      const payload: any = {};
      if (amountInPaise) payload.amount = amountInPaise;
      if (notes) payload.notes = notes;

      const response = await axios.post(`https://api.razorpay.com/v1/payments/${paymentId}/refund`, payload, {
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      return response.data;
    } catch (err: any) {
      logger.error(`Razorpay refund failed for ${paymentId}:`, err?.response?.data || err.message);
      const desc = err?.response?.data?.error?.description || 'Refund failed via payment gateway';
      throw new AppError(desc, 400);
    }
  }

  /**
   * Fetches all payments from Razorpay API across pages for reconciliation.
   * Handles pagination correctly, respects date boundaries, and classifies gateway failure states.
   */
  public async fetchAllPayments(params?: {
    from?: number;
    to?: number;
    maxRecords?: number;
  }): Promise<GatewayFetchResult> {
    let auth: string;
    try {
      auth = this.getAuthHeader();
    } catch (err: any) {
      return {
        fetchStatus: 'GATEWAY_AUTH_ERROR',
        items: [],
        count: 0,
        errorMessage: err.message || 'Razorpay credentials not configured'
      };
    }

    const pageSize = 100;
    const maxRecords = params?.maxRecords || 5000;
    const allItems: RazorpayPaymentDetails[] = [];
    let skip = 0;
    let page = 0;
    const maxPages = Math.ceil(maxRecords / pageSize);

    try {
      while (page < maxPages) {
        page++;
        const response = await axios.get<{ entity: string; count: number; items: RazorpayPaymentDetails[] }>(
          'https://api.razorpay.com/v1/payments',
          {
            headers: {
              Authorization: `Basic ${auth}`
            },
            params: {
              from: params?.from,
              to: params?.to,
              count: pageSize,
              skip
            },
            timeout: 15000
          }
        );

        const items = response.data?.items || [];
        allItems.push(...items);

        if (items.length < pageSize || allItems.length >= maxRecords) {
          break;
        }

        skip += items.length;
      }

      const fetchStatus: GatewayFetchStatus =
        allItems.length === 0 ? 'GATEWAY_EMPTY_RESULT' : 'SUCCESSFUL_GATEWAY_FETCH';

      return {
        fetchStatus,
        items: allItems,
        count: allItems.length
      };
    } catch (err: any) {
      logger.error('Razorpay API fetchAllPayments error:', err?.response?.data || err.message);

      let fetchStatus: GatewayFetchStatus = 'GATEWAY_ERROR';
      if (err.code === 'ECONNABORTED' || err.message?.toLowerCase().includes('timeout')) {
        fetchStatus = 'GATEWAY_TIMEOUT';
      } else if (err.response?.status === 401 || err.response?.status === 403) {
        fetchStatus = 'GATEWAY_AUTH_ERROR';
      }

      const errorMessage =
        err?.response?.data?.error?.description || err.message || 'Failed to communicate with Razorpay payment gateway';

      return {
        fetchStatus,
        items: [],
        count: 0,
        errorMessage
      };
    }
  }

  /**
   * Fetches paginated list of payments from Razorpay API for reconciliation (backward compatibility).
   */
  public async listPayments(params?: {
    from?: number;
    to?: number;
    count?: number;
    skip?: number;
  }): Promise<{ entity: string; count: number; items: RazorpayPaymentDetails[] }> {
    const res = await this.fetchAllPayments({ from: params?.from, to: params?.to, maxRecords: params?.count || 100 });
    return {
      entity: 'collection',
      count: res.count,
      items: res.items
    };
  }
}

export const razorpayGateway = new RazorpayGateway();
