import { apiClient } from './client';

export interface CreateOrderPayload {
  amount: number;
  donorName?: string;
  donorEmail?: string;
  donorPhone?: string;
  note?: string;
}

export interface CreateOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  receipt?: string;
}

export interface VerifyPaymentPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  donorName?: string;
  donorEmail?: string;
  donorPhone?: string;
  amount: number;
  note?: string;
}

export const PaymentApi = {
  getConfig: async () => {
    const res = await apiClient.get('/public/payments/config');
    return res.data?.data;
  },

  createOrder: async (payload: CreateOrderPayload): Promise<CreateOrderResponse> => {
    const res = await apiClient.post('/public/payments/create-order', payload);
    return res.data?.data;
  },

  verifyPayment: async (payload: VerifyPaymentPayload) => {
    const res = await apiClient.post('/public/payments/verify', payload);
    return res.data;
  }
};
