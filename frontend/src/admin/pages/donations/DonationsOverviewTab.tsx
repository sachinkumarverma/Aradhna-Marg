import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  IndianRupee,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  CreditCard,
  PieChart as PieChartIcon,
  TrendingUp,
  Flame,
  ArrowUpRight
} from 'lucide-react';
import { DonationsApi, type DonationOverviewResponse } from '@admin/features/donations/DonationsApi';
import { DatePicker } from '@components/ui/DatePicker';
import { cn } from '@utils/cn';

interface DonationsOverviewTabProps {
  onNavigateToPayments: (filter?: { status?: string }) => void;
}

export const DonationsOverviewTab: React.FC<DonationsOverviewTabProps> = ({ onNavigateToPayments }) => {
  const [range, setRange] = useState<string>('30d');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

  const { data, isLoading } = useQuery<DonationOverviewResponse>({
    queryKey: ['admin-donations-overview', range, customStart, customEnd],
    queryFn: () => DonationsApi.getOverview(range, customStart || undefined, customEnd || undefined),
    staleTime: 60 * 1000
  });

  const formatCurrency = (amount?: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const metrics = data?.metrics || {
    totalCollected: 0,
    todayCollection: 0,
    thisMonth: 0,
    thisYear: 0,
    successfulPayments: 0,
    pendingPayments: 0,
    failedPayments: 0,
    refundedAmount: 0
  };

  const rangeButtons = [
    { id: 'today', label: 'Today' },
    { id: '7d', label: '7 Days' },
    { id: '30d', label: '30 Days' },
    { id: 'month', label: 'This Month' },
    { id: 'year', label: 'This Year' },
    { id: 'all', label: 'All Time' },
    { id: 'custom', label: 'Custom' }
  ];

  if (isLoading && !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-28 bg-slate-100 rounded-lg"></div>
          ))}
        </div>
        <div className="h-64 bg-slate-100 rounded-lg"></div>
      </div>
    );
  }

  const maxTrendAmount = Math.max(1, ...(data?.trend.map((t) => t.amount) || [1]));

  return (
    <div className="space-y-6">
      {/* 8 Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Total Collected */}
        <div className="bg-gradient-to-br from-emerald-50 to-white p-4 sm:p-5 rounded-md border border-emerald-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Total Collected</span>
            <div className="w-8 h-8 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
              {formatCurrency(metrics.totalCollected)}
            </span>
          </div>
          <p className="text-xs text-emerald-600 font-medium mt-1">Lifetime verified contributions</p>
        </div>

        {/* Today's Collection */}
        <div className="bg-gradient-to-br from-orange-50 to-white p-4 sm:p-5 rounded-md border border-orange-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-orange-800">Today's Collection</span>
            <div className="w-8 h-8 rounded-md bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
              {formatCurrency(metrics.todayCollection)}
            </span>
          </div>
          <p className="text-xs text-orange-600 font-medium mt-1">Contributions since midnight</p>
        </div>

        {/* This Month */}
        <div className="bg-gradient-to-br from-blue-50 to-white p-4 sm:p-5 rounded-md border border-blue-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-blue-800">This Month</span>
            <div className="w-8 h-8 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
              {formatCurrency(metrics.thisMonth)}
            </span>
          </div>
          <p className="text-xs text-blue-600 font-medium mt-1">Current calendar month</p>
        </div>

        {/* This Year */}
        <div className="bg-gradient-to-br from-indigo-50 to-white p-4 sm:p-5 rounded-md border border-indigo-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-indigo-800">This Year</span>
            <div className="w-8 h-8 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
              {formatCurrency(metrics.thisYear)}
            </span>
          </div>
          <p className="text-xs text-indigo-600 font-medium mt-1">Current calendar year</p>
        </div>

        {/* Successful Payments */}
        <div
          onClick={() => onNavigateToPayments({ status: 'SUCCESS' })}
          className="bg-white p-4 sm:p-5 rounded-md border border-gray-200 shadow-sm hover:border-emerald-300 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Successful Payments</span>
            <div className="w-8 h-8 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xl sm:text-2xl font-bold text-gray-900">{metrics.successfulPayments}</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </div>

        {/* Pending Payments */}
        <div
          onClick={() => onNavigateToPayments({ status: 'PENDING' })}
          className="bg-white p-4 sm:p-5 rounded-md border border-gray-200 shadow-sm hover:border-amber-300 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Pending / In-Flight</span>
            <div className="w-8 h-8 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xl sm:text-2xl font-bold text-gray-900">{metrics.pendingPayments}</span>
            <ArrowUpRight className="w-4 h-4 text-amber-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </div>

        {/* Failed Payments */}
        <div
          onClick={() => onNavigateToPayments({ status: 'FAILED' })}
          className="bg-white p-4 sm:p-5 rounded-md border border-gray-200 shadow-sm hover:border-rose-300 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Failed Payments</span>
            <div className="w-8 h-8 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xl sm:text-2xl font-bold text-gray-900">{metrics.failedPayments}</span>
            <ArrowUpRight className="w-4 h-4 text-rose-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </div>

        {/* Refunded Amount */}
        <div
          onClick={() => onNavigateToPayments({ status: 'REFUNDED' })}
          className="bg-white p-4 sm:p-5 rounded-md border border-gray-200 shadow-sm hover:border-amber-300 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Refunded Amount</span>
            <div className="w-8 h-8 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xl sm:text-2xl font-bold text-gray-900">
              {formatCurrency(metrics.refundedAmount)}
            </span>
            <ArrowUpRight className="w-4 h-4 text-amber-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </div>
      </div>

      {/* Collection Trend Section */}
      <div className="bg-white rounded-md border border-gray-200 shadow-sm p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 pb-4">
          <div>
            <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-saffron" />
              Collection Trend
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Verified incoming support contributions over time</p>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {rangeButtons.map((btn) => (
              <button
                key={btn.id}
                onClick={() => setRange(btn.id)}
                className={cn(
                  'px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer',
                  range === btn.id ? 'bg-saffron text-white shadow-xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Range Date Pickers */}
        {range === 'custom' && (
          <div className="pt-3 flex flex-wrap items-center gap-3 text-xs">
            <span className="text-gray-600 font-semibold">Custom Period:</span>
            <div className="w-40">
              <DatePicker value={customStart} onChange={(date) => setCustomStart(date)} placeholder="Start date..." />
            </div>
            <span className="text-gray-400">to</span>
            <div className="w-40">
              <DatePicker value={customEnd} onChange={(date) => setCustomEnd(date)} placeholder="End date..." />
            </div>
          </div>
        )}

        {/* Visual Trend Bars */}
        <div className="pt-6">
          {data?.trend && data.trend.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-end gap-2 h-44 w-full pt-4 overflow-x-auto pb-2 scrollbar-thin">
                {data.trend.map((point) => {
                  const heightPercent = Math.max(8, Math.round((point.amount / maxTrendAmount) * 100));
                  return (
                    <div
                      key={point.date}
                      className="flex-1 min-w-[36px] flex flex-col items-center gap-1.5 group relative"
                    >
                      {/* Tooltip */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-2 bg-slate-900 text-white text-[10px] rounded-md px-2 py-1 pointer-events-none whitespace-nowrap z-20 shadow-md">
                        <p className="font-bold">{formatCurrency(point.amount)}</p>
                        <p className="text-slate-300">{point.count} donations</p>
                        <p className="text-slate-400 text-[9px]">{point.date}</p>
                      </div>

                      <div className="w-full bg-slate-50 rounded-t-sm flex items-end justify-center h-full">
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className="w-full bg-gradient-to-t from-orange-500 to-amber-400 rounded-t-sm group-hover:from-orange-600 group-hover:to-amber-500 transition-all shadow-xs"
                        />
                      </div>
                      <span className="text-[10px] font-mono text-gray-400 truncate w-full text-center">
                        {point.date.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="h-36 flex flex-col items-center justify-center text-gray-400 text-xs">
              <Calendar className="w-6 h-6 mb-1 text-gray-300" />
              No verified contributions recorded during this range.
            </div>
          )}
        </div>
      </div>

      {/* Breakdowns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        {/* Payment Method Breakdown */}
        <div className="bg-white rounded-md border border-gray-200 shadow-sm p-4 sm:p-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="font-bold text-sm sm:text-base text-gray-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-600" />
              Payment Method Breakdown
            </h3>
            <span className="text-xs text-gray-400 font-medium">By volume</span>
          </div>

          <div className="pt-4 space-y-3">
            {data?.paymentMethodBreakdown && data.paymentMethodBreakdown.length > 0 ? (
              data.paymentMethodBreakdown.map((pm) => (
                <div key={pm.method} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-gray-700 uppercase">{pm.method}</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(pm.totalAmount)} ({pm.count} contributions)
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, Math.round((pm.totalAmount / (metrics.totalCollected || 1)) * 100))}%`
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 text-center py-6">No payment method distribution data available.</p>
            )}
          </div>
        </div>

        {/* Contribution Amount Breakdown */}
        <div className="bg-white rounded-md border border-gray-200 shadow-sm p-4 sm:p-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="font-bold text-sm sm:text-base text-gray-900 flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-emerald-600" />
              Contribution Amount Breakdown
            </h3>
            <span className="text-xs text-gray-400 font-medium">Recorded tiers</span>
          </div>

          <div className="pt-4">
            {data?.contributionAmountBreakdown && data.contributionAmountBreakdown.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {data.contributionAmountBreakdown.map((item) => (
                  <div
                    key={item.amount}
                    className="p-3 bg-gray-50 hover:bg-orange-50/50 rounded-md border border-gray-100 transition-colors"
                  >
                    <span className="text-xs font-semibold text-gray-500 uppercase">Tier</span>
                    <p className="text-lg font-bold text-gray-900">₹{item.amount}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {item.count} donations ({formatCurrency(item.total)})
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center py-6">No contribution amount tiers recorded yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
