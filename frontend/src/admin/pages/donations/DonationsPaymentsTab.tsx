import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Clock,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
  ShieldCheck,
  HeartHandshake
} from 'lucide-react';
import { DonationsApi, type PaymentItem, type PaymentFilterParams } from '@admin/features/donations/DonationsApi';
import { Pagination } from '@components/ui/Pagination';
import { Select } from '@components/ui/Select';
import { DatePicker } from '@components/ui/DatePicker';
import { cn } from '@utils/cn';

interface DonationsPaymentsTabProps {
  initialStatusFilter?: string;
  onSelectPayment: (payment: PaymentItem) => void;
  onOpenRefund: (payment: PaymentItem) => void;
}

export const DonationsPaymentsTab: React.FC<DonationsPaymentsTabProps> = ({
  initialStatusFilter,
  onSelectPayment,
  onOpenRefund
}) => {
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);
  const [search, setSearch] = useState<string>('');
  const [status, setStatus] = useState<string>(initialStatusFilter || '');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [gateway, setGateway] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);

  const queryParams: PaymentFilterParams = {
    page,
    limit,
    search: search.trim() || undefined,
    status: status || undefined,
    paymentMethod: paymentMethod || undefined,
    gateway: gateway || undefined,
    isAnonymous: isAnonymous === 'true' ? true : isAnonymous === 'false' ? false : undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    minAmount: minAmount ? parseFloat(minAmount) : undefined,
    maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
    sortBy: 'created_at',
    sortOrder: 'DESC'
  };

  const { data, isLoading } = useQuery({
    queryKey: ['admin-donations-payments', queryParams],
    queryFn: () => DonationsApi.getPayments(queryParams),
    staleTime: 60 * 1000
  });

  const payments: PaymentItem[] = data?.data || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  const formatCurrency = (amount: number, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(dateStr));
  };

  const getStatusBadge = (statusStr: string) => {
    switch (statusStr) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            SUCCESS
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3 h-3" />
            FAILED
          </span>
        );
      case 'REFUNDED':
      case 'PARTIALLY_REFUNDED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <RotateCcw className="w-3 h-3" />
            {statusStr.replace('_', ' ')}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="w-3 h-3" />
            {statusStr}
          </span>
        );
    }
  };

  const clearAllFilters = () => {
    setSearch('');
    setStatus('');
    setPaymentMethod('');
    setGateway('');
    setIsAnonymous('');
    setStartDate('');
    setEndDate('');
    setMinAmount('');
    setMaxAmount('');
    setPage(1);
  };

  const hasActiveFilters =
    !!search ||
    !!status ||
    !!paymentMethod ||
    !!gateway ||
    !!isAnonymous ||
    !!startDate ||
    !!endDate ||
    !!minAmount ||
    !!maxAmount;

  return (
    <div className="space-y-4">
      {/* Search and Primary Filters */}
      <div className="bg-white rounded-md border border-gray-200 p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by devotee name, email, order ID, payment ID..."
              className="w-full pl-9 pr-8 h-9 sm:h-10 border border-gray-200 rounded-md text-xs sm:text-sm bg-white text-slate-800 focus:outline-none focus:border-saffron focus:ring-1 focus:ring-saffron"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Dropdown */}
          <div className="w-full sm:w-44">
            <Select
              value={status}
              onChange={(val) => {
                setStatus(val);
                setPage(1);
              }}
              searchable={false}
              placeholder="All Statuses"
              options={[
                { label: 'All Statuses', value: '' },
                { label: 'Success', value: 'SUCCESS' },
                { label: 'Pending', value: 'PENDING' },
                { label: 'Created', value: 'CREATED' },
                { label: 'Failed', value: 'FAILED' },
                { label: 'Refunded', value: 'REFUNDED' },
                { label: 'Partially Refunded', value: 'PARTIALLY_REFUNDED' }
              ]}
            />
          </div>

          {/* Method Dropdown */}
          <div className="w-full sm:w-40">
            <Select
              value={paymentMethod}
              onChange={(val) => {
                setPaymentMethod(val);
                setPage(1);
              }}
              searchable={false}
              placeholder="All Methods"
              options={[
                { label: 'All Methods', value: '' },
                { label: 'UPI', value: 'upi' },
                { label: 'Cards', value: 'card' },
                { label: 'Net Banking', value: 'netbanking' },
                { label: 'Wallet', value: 'wallet' }
              ]}
            />
          </div>

          {/* Toggle More Filters */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={cn(
              'h-9 sm:h-10 px-3.5 flex items-center gap-1.5 rounded-md border text-xs sm:text-sm font-semibold transition-colors cursor-pointer shrink-0',
              showAdvancedFilters || hasActiveFilters
                ? 'bg-orange-50 border-orange-200 text-saffron'
                : 'border-gray-200 bg-white text-slate-700 hover:bg-slate-50'
            )}
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-saffron ml-0.5"></span>}
          </button>
        </div>

        {/* Collapsible Advanced Filters */}
        {showAdvancedFilters && (
          <div className="pt-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
            {/* Date Range Start */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700">From Date</label>
                {startDate && (
                  <button
                    type="button"
                    onClick={() => {
                      setStartDate('');
                      setPage(1);
                    }}
                    className="text-[10px] text-gray-400 hover:text-rose-600 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              <DatePicker
                value={startDate}
                onChange={(date) => {
                  setStartDate(date);
                  setPage(1);
                }}
                placeholder="From date..."
              />
            </div>

            {/* Date Range End */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700">To Date</label>
                {endDate && (
                  <button
                    type="button"
                    onClick={() => {
                      setEndDate('');
                      setPage(1);
                    }}
                    className="text-[10px] text-gray-400 hover:text-rose-600 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              <DatePicker
                value={endDate}
                onChange={(date) => {
                  setEndDate(date);
                  setPage(1);
                }}
                placeholder="To date..."
              />
            </div>

            {/* Min Amount */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Min Amount (₹)</label>
              <input
                type="number"
                placeholder="0"
                value={minAmount}
                onChange={(e) => {
                  setMinAmount(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-xs bg-white text-slate-800 focus:outline-none focus:border-saffron focus:ring-1 focus:ring-saffron"
              />
            </div>

            {/* Max Amount */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Max Amount (₹)</label>
              <input
                type="number"
                placeholder="10000"
                value={maxAmount}
                onChange={(e) => {
                  setMaxAmount(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-xs bg-white text-slate-800 focus:outline-none focus:border-saffron focus:ring-1 focus:ring-saffron"
              />
            </div>

            {/* Anonymous Filter */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Donor Identity</label>
              <Select
                value={isAnonymous}
                onChange={(val) => {
                  setIsAnonymous(val);
                  setPage(1);
                }}
                searchable={false}
                placeholder="All Devotees"
                options={[
                  { label: 'All (Identified & Anonymous)', value: '' },
                  { label: 'Identified Only', value: 'false' },
                  { label: 'Anonymous Only', value: 'true' }
                ]}
              />
            </div>
          </div>
        )}

        {/* Clear Filters bar */}
        {hasActiveFilters && (
          <div className="pt-2 flex items-center justify-between text-xs text-gray-500 border-t border-gray-100">
            <span>Showing filtered results ({total} total matches)</span>
            <button onClick={clearAllFilters} className="text-saffron hover:underline font-semibold cursor-pointer">
              Clear All Filters ×
            </button>
          </div>
        )}
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto w-full scrollbar-thin">
          <table className="w-full min-w-[850px] text-left text-xs sm:text-sm">
            <thead className="bg-gray-50 text-gray-700 border-b border-gray-200 uppercase text-xs font-bold tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5">Supporter</th>
                <th className="px-5 py-3.5">Amount</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Method</th>
                <th className="px-5 py-3.5">Gateway</th>
                <th className="px-5 py-3.5 font-mono">Transaction ID</th>
                <th className="px-5 py-3.5">Source</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading && !data ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                    Loading payments...
                  </td>
                </tr>
              ) : payments.length > 0 ? (
                payments.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => onSelectPayment(p)}
                    className="hover:bg-gray-50/80 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">
                      {formatDate(p.paidAt || p.createdAt)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-gray-900 truncate max-w-[180px]">
                        {p.isAnonymous ? 'Anonymous Supporter' : p.supporterName || 'Devotee / श्रद्धालु'}
                      </div>
                      {!p.isAnonymous && p.supporterEmail && (
                        <div className="text-[11px] text-gray-500 truncate max-w-[180px]">{p.supporterEmail}</div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-gray-900 whitespace-nowrap">
                      {formatCurrency(p.amount, p.currency)}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">{getStatusBadge(p.status)}</td>
                    <td className="px-5 py-3.5 uppercase text-xs font-semibold text-gray-700 whitespace-nowrap">
                      {p.paymentMethod || 'UPI'}
                    </td>
                    <td className="px-5 py-3.5 uppercase text-xs font-semibold text-gray-500 whitespace-nowrap">
                      {p.paymentGateway}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-600 select-all whitespace-nowrap">
                      {p.gatewayPaymentId ? p.gatewayPaymentId.slice(0, 16) + '...' : p.gatewayOrderId || '—'}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-500 whitespace-nowrap">{p.source}</td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onSelectPayment(p)}
                          className="p-1.5 text-gray-500 hover:text-saffron hover:bg-orange-50 rounded-md transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {(p.status === 'SUCCESS' || p.status === 'PARTIALLY_REFUNDED') && (
                          <button
                            onClick={() => onOpenRefund(p)}
                            className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            title="Record Refund"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center">
                    {status === 'FAILED' ? (
                      <div className="max-w-md mx-auto space-y-2">
                        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <h4 className="font-bold text-gray-800 text-sm">No Failed Payments</h4>
                        <p className="text-xs text-gray-500">
                          All initiated contributions completed successfully or remain in checkout. Zero declined or
                          failed payments detected.
                        </p>
                      </div>
                    ) : status === 'REFUNDED' ? (
                      <div className="max-w-md mx-auto space-y-2">
                        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                          <ShieldCheck className="w-6 h-6" />
                        </div>
                        <h4 className="font-bold text-gray-800 text-sm">No Refunds Recorded</h4>
                        <p className="text-xs text-gray-500">
                          Zero contributions have been refunded or reversed. 100% of received offerings are retained.
                        </p>
                      </div>
                    ) : hasActiveFilters ? (
                      <div className="max-w-md mx-auto space-y-3">
                        <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center mx-auto">
                          <Search className="w-6 h-6" />
                        </div>
                        <h4 className="font-bold text-gray-800 text-sm">No Payments Match Filters</h4>
                        <p className="text-xs text-gray-500">
                          No transactions found matching your search or active filter settings.
                        </p>
                        <button
                          type="button"
                          onClick={clearAllFilters}
                          className="px-3 py-1.5 text-xs font-semibold text-saffron hover:bg-orange-50 border border-orange-200 rounded-md cursor-pointer transition-colors"
                        >
                          Clear All Filters
                        </button>
                      </div>
                    ) : (
                      <div className="max-w-md mx-auto space-y-2">
                        <div className="w-12 h-12 rounded-full bg-orange-50 text-saffron flex items-center justify-center mx-auto">
                          <HeartHandshake className="w-6 h-6" />
                        </div>
                        <h4 className="font-bold text-gray-800 text-sm">No Payments Recorded Yet</h4>
                        <p className="text-xs text-gray-500">
                          Devotional offerings and contributions initiated via the public Support Us page will be
                          cataloged here in real time.
                        </p>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Reusable Application Pagination */}
        <Pagination
          page={page}
          totalPages={totalPages}
          totalRecords={total}
          limit={limit}
          onPageChange={(newPage) => setPage(newPage)}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
          limitOptions={[10, 20, 50, 100]}
        />
      </div>
    </div>
  );
};
