export type PaymentStatus =
  'CREATED' | 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';

export type PaymentGateway = 'RAZORPAY';

export interface Payment {
  id: string;
  supporterName?: string;
  supporterEmail?: string;
  supporterPhone?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentGateway: PaymentGateway;
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
  metadata: Record<string, any>;
  paidAt?: string;
  refundedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentDTO {
  supporterName?: string;
  supporterEmail?: string;
  supporterPhone?: string;
  amount: number;
  currency?: string;
  paymentGateway?: PaymentGateway;
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  gatewaySignature?: string;
  paymentMethod?: string;
  isAnonymous?: boolean;
  source?: string;
  notes?: string;
  receiptNumber?: string;
  metadata?: Record<string, any>;
}

export interface PaymentFilterParams {
  page?: number;
  limit?: number;
  status?: PaymentStatus;
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

export interface PaymentStats {
  totalAmount: number;
  totalSuccessfulPayments: number;
  totalDonors: number;
  averageDonation: number;
  statusBreakdown: Record<PaymentStatus, number>;
}

export interface SupporterSummaryItem {
  supporterName: string;
  supporterEmail?: string;
  totalContributed: number;
  donationCount: number;
  lastDonatedAt: string;
}

export interface SupporterListItem {
  supporterKey: string;
  supporterName: string;
  supporterEmail?: string;
  contributionCount: number;
  totalContributed: number;
  firstContribution: string;
  lastContribution: string;
  isAnonymous: boolean;
}

export interface DonationOverviewData {
  metrics: {
    totalCollected: number;
    todayCollection: number;
    thisMonth: number;
    thisYear: number;
    successfulPayments: number;
    pendingPayments: number;
    failedPayments: number;
    refundedAmount: number;
  };
  trend: Array<{
    date: string;
    amount: number;
    count: number;
  }>;
  paymentMethodBreakdown: Array<{
    method: string;
    count: number;
    totalAmount: number;
  }>;
  contributionAmountBreakdown: Array<{
    amount: number;
    count: number;
    total: number;
  }>;
}

export interface DonationReportSummary {
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

export type ReconciliationStatus = 'RECONCILED' | 'MISMATCH' | 'UNAVAILABLE' | 'ERROR';

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
  discrepancies: ReconciliationDiscrepancyItem[];
  performedBy: string;
  createdAt: string;
}

export interface PaymentRefundRecord {
  id: string;
  paymentId: string;
  gatewayRefundId?: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PROCESSED' | 'FAILED';
  reason?: string;
  metadata?: Record<string, any>;
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
