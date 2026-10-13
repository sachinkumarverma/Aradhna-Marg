import React from 'react';
import { createPortal } from 'react-dom';
import { X, CreditCard, CheckCircle2, AlertTriangle, Clock, RotateCcw, User, FileText, Calendar } from 'lucide-react';
import type { PaymentItem } from '@admin/features/donations/DonationsApi';
import { cn } from '@utils/cn';

interface PaymentDetailDrawerProps {
  payment: PaymentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenRefund: (payment: PaymentItem) => void;
}

export const PaymentDetailDrawer: React.FC<PaymentDetailDrawerProps> = ({ payment, isOpen, onClose, onOpenRefund }) => {
  if (!isOpen || !payment) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: payment.currency || 'INR',
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(dateStr));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            SUCCESSFUL
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5" />
            FAILED
          </span>
        );
      case 'REFUNDED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <RotateCcw className="w-3.5 h-3.5" />
            REFUNDED
          </span>
        );
      case 'PARTIALLY_REFUNDED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <RotateCcw className="w-3.5 h-3.5" />
            PARTIALLY REFUNDED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="w-3.5 h-3.5" />
            {status}
          </span>
        );
    }
  };

  const isRefundable =
    payment.status === 'SUCCESS' ||
    (payment.status === 'PARTIALLY_REFUNDED' && (payment.refundAmount || 0) < payment.amount);

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out">
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 truncate">Payment Details</h2>
                {getStatusBadge(payment.status)}
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5 truncate">ID: {payment.id}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-200/50 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Amount Hero */}
          <div className="px-6 py-6 border-b border-gray-100 bg-gradient-to-br from-orange-50 to-white">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Contribution Amount</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-bold tracking-tight text-gray-900">{formatCurrency(payment.amount)}</span>
              <span className="text-xs font-bold text-gray-500 uppercase">{payment.currency}</span>
            </div>
            {payment.refundAmount > 0 && (
              <div className="mt-2 text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 inline-flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5" />
                Refunded: {formatCurrency(payment.refundAmount)}
              </div>
            )}
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 text-sm">
            {/* Supporter Section */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                Supporter Information
              </h3>
              <div className="bg-gray-50 rounded-md p-3.5 space-y-2.5 border border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-xs">Name:</span>
                  <span className="font-semibold text-gray-900">
                    {payment.isAnonymous ? 'Anonymous Supporter' : payment.supporterName || 'Devotee / श्रद्धालु'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-xs">Email:</span>
                  <span className="font-medium text-gray-800">
                    {payment.isAnonymous ? 'Hidden (Anonymous)' : payment.supporterEmail || 'Not provided'}
                  </span>
                </div>
                {payment.supporterPhone && !payment.isAnonymous && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-xs">Phone:</span>
                    <span className="font-medium text-gray-800">{payment.supporterPhone}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-xs">Anonymous:</span>
                  <span
                    className={cn(
                      'text-xs font-semibold px-2 py-0.5 rounded-full',
                      payment.isAnonymous
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : 'bg-gray-200 text-gray-700'
                    )}
                  >
                    {payment.isAnonymous ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>

            {/* Transaction Details */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" />
                Gateway & Transaction
              </h3>
              <div className="bg-gray-50 rounded-md p-3.5 space-y-2.5 border border-gray-100 font-mono text-xs">
                <div className="flex justify-between items-center font-sans">
                  <span className="text-gray-500">Gateway:</span>
                  <span className="font-bold text-gray-900 uppercase">{payment.paymentGateway}</span>
                </div>
                <div className="flex justify-between items-center font-sans">
                  <span className="text-gray-500">Method:</span>
                  <span className="font-semibold text-gray-800 uppercase">{payment.paymentMethod || 'UPI'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-sans">Order ID:</span>
                  <span className="text-gray-800 font-semibold select-all">{payment.gatewayOrderId || '—'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-sans">Payment ID:</span>
                  <span className="text-emerald-700 font-semibold select-all">{payment.gatewayPaymentId || '—'}</span>
                </div>
                {payment.receiptNumber && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-sans">Receipt Ref:</span>
                    <span className="text-gray-800 select-all">{payment.receiptNumber}</span>
                  </div>
                )}
                <div className="flex justify-between items-center font-sans">
                  <span className="text-gray-500">Source:</span>
                  <span className="font-medium text-gray-800">{payment.source}</span>
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Timeline & Dates
              </h3>
              <div className="bg-gray-50 rounded-md p-3.5 space-y-2 border border-gray-100 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Initiated At:</span>
                  <span className="font-medium text-gray-800">{formatDate(payment.createdAt)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Paid At:</span>
                  <span className="font-semibold text-emerald-700">{formatDate(payment.paidAt)}</span>
                </div>
                {payment.refundedAt && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Refunded At:</span>
                    <span className="font-semibold text-amber-700">{formatDate(payment.refundedAt)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Failure or Refund reason */}
            {payment.failureReason && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-rose-500 mb-2">Failure Reason</h3>
                <div className="bg-rose-50 text-rose-800 p-3 rounded-md border border-rose-200 text-xs">
                  {payment.failureReason}
                </div>
              </div>
            )}

            {payment.refundReason && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-2">Refund Reason</h3>
                <div className="bg-amber-50 text-amber-800 p-3 rounded-md border border-amber-200 text-xs">
                  {payment.refundReason}
                </div>
              </div>
            )}

            {/* Devotional Note */}
            {payment.notes && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Devotional Note
                </h3>
                <div className="bg-orange-50/50 p-3 rounded-md border border-orange-100 text-xs text-slate-800 italic">
                  "{payment.notes}"
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          {isRefundable && (
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
              <button
                onClick={() => onOpenRefund(payment)}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Issue / Record Refund
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
