import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, RotateCcw, AlertTriangle } from 'lucide-react';
import { type PaymentItem, DonationsApi } from '@admin/features/donations/DonationsApi';
import toast from 'react-hot-toast';

interface RefundModalProps {
  payment: PaymentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RefundModal: React.FC<RefundModalProps> = ({ payment, isOpen, onClose, onSuccess }) => {
  const remainingRefundable = payment ? Math.max(0, payment.amount - (payment.refundAmount || 0)) : 0;
  const [refundAmount, setRefundAmount] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (payment) {
      setRefundAmount(remainingRefundable.toString());
      setReason('');
    }
  }, [payment, remainingRefundable]);

  if (!isOpen || !payment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(refundAmount);

    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid refund amount greater than 0.');
      return;
    }

    if (amount > remainingRefundable) {
      toast.error(`Refund amount cannot exceed remaining refundable ₹${remainingRefundable}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await DonationsApi.recordRefund(payment.id, amount, reason.trim() || undefined);
      toast.success(`Successfully recorded refund of ₹${amount}`);
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || 'Refund failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white rounded-md shadow-2xl border border-gray-200 overflow-hidden z-10">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-rose-600" />
            <h3 className="font-bold text-slate-900 text-base">Record Refund</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-amber-50 p-3 rounded-md border border-amber-200 text-xs text-amber-800 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              Payment: ₹{payment.amount} (Refundable: ₹{remainingRefundable})
            </div>
            <p className="text-slate-600">
              Transaction ID: <span className="font-mono">{payment.gatewayPaymentId || payment.id}</span>
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Refund Amount (₹)
            </label>
            <input
              type="number"
              step="any"
              min="1"
              max={remainingRefundable}
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-saffron"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Reason for Refund
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Accidental double donation, Donor request..."
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-saffron"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-md transition-colors shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? 'Recording...' : 'Confirm Refund'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
