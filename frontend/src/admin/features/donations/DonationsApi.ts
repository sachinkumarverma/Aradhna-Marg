import { apiClient } from '@api/client';

export type PaymentStatus =
  'CREATED' | 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';

export interface PaymentItem {
  id: string;
  supporterName?: string;
  supporterEmail?: string;
  supporterPhone?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentGateway: string;
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  gatewaySignature?: string;
  paymentMethod?: string;
  isAnonymous: boolean;
  source: string;
  notes?: string;
  receiptNumber?: string;
  failureReason?: string;
  refundAmount: number;
  refundReason?: string;
  metadata?: Record<string, any>;
  paidAt?: string;
  refundedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentFilterParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  gateway?: string;
  paymentMethod?: string;
  minAmount?: number;
  maxAmount?: number;
  isAnonymous?: boolean;
  supporterEmail?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface OverviewMetrics {
  totalCollected: number;
  todayCollection: number;
  thisMonth: number;
  thisYear: number;
  successfulPayments: number;
  pendingPayments: number;
  failedPayments: number;
  refundedAmount: number;
}

export interface DonationOverviewResponse {
  metrics: OverviewMetrics;
  trend: Array<{ date: string; amount: number; count: number }>;
  paymentMethodBreakdown: Array<{ method: string; count: number; totalAmount: number }>;
  contributionAmountBreakdown: Array<{ amount: number; count: number; total: number }>;
}

export interface SupporterItem {
  supporterKey: string;
  supporterName: string;
  supporterEmail?: string;
  contributionCount: number;
  totalContributed: number;
  firstContribution: string;
  lastContribution: string;
  isAnonymous: boolean;
}

export interface DonationReportData {
  grossCollection: number;
  refunds: number;
  netCollection: number;
  successfulTransactions: number;
  failedTransactions: number;
  periodBreakdown: Array<{
    period: string;
    gross: number;
    refunds: number;
    net: number;
    count: number;
  }>;
}

export type ReconciliationDiscrepancyType =
  | 'RECONCILED'
  | 'MISMATCH'
  | 'MISSING_LOCAL'
  | 'MISSING_GATEWAY'
  | 'AMOUNT_MISMATCH'
  | 'STATUS_MISMATCH'
  | 'REFUND_MISMATCH'
  | 'DUPLICATE_TRANSACTION'
  | 'GATEWAY_UNAVAILABLE';

export interface ReconciliationDiscrepancyItem {
  id: string;
  type: ReconciliationDiscrepancyType;
  gatewayPaymentId?: string;
  gatewayOrderId?: string;
  localPaymentId?: string;
  localAmount?: number;
  gatewayAmount?: number;
  amountDifference?: number;
  localStatus?: string;
  gatewayStatus?: string;
  localRefundAmount?: number;
  gatewayRefundAmount?: number;
  description: string;
}

export interface ReconciliationResult {
  id: string;
  status: 'RECONCILED' | 'MISMATCH' | 'UNAVAILABLE' | 'ERROR';
  periodStart?: string;
  periodEnd?: string;
  recordsChecked: number;
  mismatchesCount: number;
  localCount: number;
  localTotal: number;
  gatewayCount: number;
  gatewayTotal: number;
  difference: number;
  discrepancies: ReconciliationDiscrepancyItem[];
  performedBy: string;
  createdAt: string;
}

export interface PaymentAuditLog {
  id: string;
  paymentId?: string;
  action: string;
  actorType: 'ADMIN' | 'GATEWAY_WEBHOOK' | 'SYSTEM';
  actorId?: string;
  details: Record<string, any>;
  createdAt: string;
}

export const DonationsApi = {
  getOverview: async (range = '30d', startDate?: string, endDate?: string): Promise<DonationOverviewResponse> => {
    const params: any = { range };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const res = await apiClient.get('/admin/donations/overview', { params });
    return res.data?.data;
  },

  getPayments: async (params: PaymentFilterParams = {}) => {
    const res = await apiClient.get('/admin/donations/payments', { params });
    return res.data?.data;
  },

  getPaymentById: async (id: string): Promise<PaymentItem> => {
    const res = await apiClient.get(`/admin/donations/payments/${id}`);
    return res.data?.data;
  },

  getSupporters: async (params: { page?: number; limit?: number; search?: string } = {}) => {
    const res = await apiClient.get('/admin/donations/supporters', { params });
    return res.data?.data;
  },

  getSupporterDetails: async (id: string): Promise<{ supporter: SupporterItem; payments: PaymentItem[] }> => {
    const res = await apiClient.get(`/admin/donations/supporters/${encodeURIComponent(id)}`);
    return res.data?.data;
  },

  getReports: async (params: {
    startDate?: string;
    endDate?: string;
    status?: string;
    paymentMethod?: string;
  }): Promise<DonationReportData> => {
    const res = await apiClient.get('/admin/donations/reports', { params });
    return res.data?.data;
  },

  exportCsv: async (params: PaymentFilterParams = {}): Promise<void> => {
    const res = await apiClient.get('/admin/donations/export', {
      params,
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `donations_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  recordRefund: async (id: string, refundAmount: number, reason?: string): Promise<PaymentItem> => {
    const res = await apiClient.post(`/admin/donations/payments/${id}/refund`, {
      refundAmount,
      reason
    });
    return res.data?.data;
  },

  getLatestReconciliation: async (): Promise<ReconciliationResult | null> => {
    const res = await apiClient.get('/admin/donations/reconciliation/latest');
    return res.data?.data ?? null;
  },

  runReconciliation: async (params?: {
    startDate?: string;
    endDate?: string;
    liveFetch?: boolean;
  }): Promise<ReconciliationResult> => {
    const res = await apiClient.post('/admin/donations/reconciliation/run', params || {});
    return res.data?.data;
  },

  getAuditLogs: async (limit = 50): Promise<PaymentAuditLog[]> => {
    const res = await apiClient.get('/admin/donations/audit-logs', { params: { limit } });
    return res.data?.data || [];
  },

  getNotifications: async (): Promise<FinancialNotificationItem[]> => {
    const res = await apiClient.get('/admin/donations/notifications');
    return res.data?.data || [];
  }
};

export interface FinancialNotificationItem {
  id: string;
  type: 'SUCCESS' | 'WARNING' | 'ERROR' | 'REFUND' | 'INFO';
  title: string;
  message: string;
  timestamp: string;
  link?: string;
}
