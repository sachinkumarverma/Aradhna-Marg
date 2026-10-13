import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Download,
  FileSpreadsheet,
  Scale,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  History,
  X,
  ShieldCheck
} from 'lucide-react';
import {
  DonationsApi,
  type DonationReportData,
  type ReconciliationResult,
  type ReconciliationDiscrepancyItem,
  type PaymentAuditLog,
  type PaymentItem
} from '@admin/features/donations/DonationsApi';
import { AdminButton } from '@admin/components/AdminButton';
import { Select } from '@components/ui/Select';
import { DatePicker } from '@components/ui/DatePicker';
import { cn } from '@utils/cn';
import toast from 'react-hot-toast';

export interface DonationsReportsTabProps {
  onSelectPayment?: (payment: PaymentItem) => void;
}

export const DonationsReportsTab: React.FC<DonationsReportsTabProps> = ({ onSelectPayment }) => {
  // General report filters
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Reconciliation section state
  const [isReconciling, setIsReconciling] = useState<boolean>(false);
  const [reconStartDate, setReconStartDate] = useState<string>('');
  const [reconEndDate, setReconEndDate] = useState<string>('');
  const [liveFetch, setLiveFetch] = useState<boolean>(true);
  const [selectedDiscrepancy, setSelectedDiscrepancy] = useState<ReconciliationDiscrepancyItem | null>(null);
  const [inspectLoadingId, setInspectLoadingId] = useState<string | null>(null);
  const [showAuditLogs, setShowAuditLogs] = useState<boolean>(false);
  const [showRunReconModal, setShowRunReconModal] = useState<boolean>(false);

  const { data, isLoading } = useQuery<DonationReportData>({
    queryKey: ['admin-donations-reports', startDate, endDate, status, paymentMethod],
    queryFn: () =>
      DonationsApi.getReports({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        status: status || undefined,
        paymentMethod: paymentMethod || undefined
      }),
    staleTime: 60 * 1000
  });

  const {
    data: latestRecon,
    isLoading: isLoadingRecon,
    refetch: refetchRecon
  } = useQuery<ReconciliationResult | null>({
    queryKey: ['admin-donations-reconciliation-latest'],
    queryFn: () => DonationsApi.getLatestReconciliation(),
    staleTime: 60 * 1000
  });

  const {
    data: auditLogs,
    isLoading: isLoadingAuditLogs,
    refetch: refetchAuditLogs
  } = useQuery<PaymentAuditLog[]>({
    queryKey: ['admin-donations-audit-logs'],
    queryFn: () => DonationsApi.getAuditLogs(30),
    enabled: showAuditLogs
  });

  const formatCurrency = (amount?: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Never';
    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(dateStr));
  };

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      await DonationsApi.exportCsv({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        status: status || undefined,
        paymentMethod: paymentMethod || undefined
      });
      toast.success('Donations CSV report downloaded successfully');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const handleRunReconciliation = async () => {
    setIsReconciling(true);
    try {
      const res = await DonationsApi.runReconciliation({
        startDate: reconStartDate || undefined,
        endDate: reconEndDate || undefined,
        liveFetch
      });
      await refetchRecon();
      if (res.status === 'RECONCILED' && res.mismatchesCount === 0) {
        toast.success('✓ Reconciliation complete: 100% match with Gateway Ledger!');
      } else if (res.status === 'UNAVAILABLE' || res.status === 'ERROR') {
        toast.error('Gateway unavailable — reconciliation could not be completed.');
      } else {
        toast.error(`⚠ Found ${res.mismatchesCount} discrepancies with ₹${res.difference} difference`);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || 'Reconciliation failed');
    } finally {
      setIsReconciling(false);
    }
  };

  const handleInspectDiscrepancy = async (item: ReconciliationDiscrepancyItem) => {
    if (item.localPaymentId && onSelectPayment) {
      setInspectLoadingId(item.id);
      try {
        const payment = await DonationsApi.getPaymentById(item.localPaymentId);
        if (payment) {
          onSelectPayment(payment);
          return;
        }
      } catch {
        // Fallback to local popup
      } finally {
        setInspectLoadingId(null);
      }
    }
    setSelectedDiscrepancy(item);
  };

  const report = data || {
    grossCollection: 0,
    refunds: 0,
    netCollection: 0,
    successfulTransactions: 0,
    failedTransactions: 0,
    periodBreakdown: []
  };

  const isGatewayUnavailable = latestRecon && (latestRecon.status === 'UNAVAILABLE' || latestRecon.status === 'ERROR');
  const isReconClean = latestRecon && latestRecon.status === 'RECONCILED' && latestRecon.mismatchesCount === 0;

  return (
    <div className="space-y-8">
      {/* ---------------------------------------------------------------- */}
      {/* SECTION 1: FINANCIAL OVERVIEW & CONTROLS */}
      {/* ---------------------------------------------------------------- */}
      <div className="space-y-6">
        {/* Report Controls & Filter Card */}
        <div className="bg-white rounded-md border border-gray-200 p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 pb-3.5">
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-saffron shrink-0" />
                <span>Financial Collection Reports</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Generate gross, refund, and net revenue summaries with CSV exports
              </p>
            </div>

            <AdminButton
              onClick={handleExportCsv}
              variant="primary"
              disabled={isExporting}
              size="sm"
              leftIcon={<Download className="w-4 h-4 shrink-0" />}
              className="cursor-pointer"
            >
              {isExporting ? 'Exporting CSV...' : 'Export CSV'}
            </AdminButton>
          </div>

          {/* Filters */}
          <div className="bg-slate-50 p-3.5 rounded-md border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700">Start Date</label>
                {startDate && (
                  <button
                    type="button"
                    onClick={() => setStartDate('')}
                    className="text-[10px] text-gray-400 hover:text-rose-600 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              <DatePicker value={startDate} onChange={(date) => setStartDate(date)} placeholder="Start date..." />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700">End Date</label>
                {endDate && (
                  <button
                    type="button"
                    onClick={() => setEndDate('')}
                    className="text-[10px] text-gray-400 hover:text-rose-600 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              <DatePicker value={endDate} onChange={(date) => setEndDate(date)} placeholder="End date..." />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Status</label>
              <Select
                value={status}
                onChange={(val) => setStatus(val)}
                searchable={false}
                options={[
                  { label: 'All Statuses', value: '' },
                  { label: 'Success Only', value: 'SUCCESS' },
                  { label: 'Failed Only', value: 'FAILED' },
                  { label: 'Refunded Only', value: 'REFUNDED' }
                ]}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Payment Method</label>
              <Select
                value={paymentMethod}
                onChange={(val) => setPaymentMethod(val)}
                searchable={false}
                options={[
                  { label: 'All Methods', value: '' },
                  { label: 'UPI', value: 'upi' },
                  { label: 'Cards', value: 'card' },
                  { label: 'Net Banking', value: 'netbanking' },
                  { label: 'Wallet', value: 'wallet' }
                ]}
              />
            </div>
          </div>
        </div>

        {/* 5 Primary Financial Report KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {/* Gross Collection */}
          <div className="bg-gradient-to-br from-orange-50 to-white p-4 sm:p-5 rounded-md border border-orange-100 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Gross Collection</span>
            <div className="mt-1.5 flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                {formatCurrency(report.grossCollection)}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">Total collected revenue</p>
          </div>

          {/* Refunds */}
          <div className="bg-gradient-to-br from-amber-50 to-white p-4 sm:p-5 rounded-md border border-amber-200/80 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wide text-amber-700">Refunds</span>
            <div className="mt-1.5 flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-bold text-amber-800 tracking-tight">
                {formatCurrency(report.refunds)}
              </span>
            </div>
            <p className="text-xs text-amber-600/80 mt-1">Disbursed refunds</p>
          </div>

          {/* Net Collection */}
          <div className="bg-gradient-to-br from-emerald-50 to-white p-4 sm:p-5 rounded-md border border-emerald-200/80 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Net Collection</span>
            <div className="mt-1.5 flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-bold text-emerald-700 tracking-tight">
                {formatCurrency(report.netCollection)}
              </span>
            </div>
            <p className="text-xs text-emerald-600 mt-1">Gross minus refunds</p>
          </div>

          {/* Successful Transactions */}
          <div className="bg-gradient-to-br from-blue-50 to-white p-4 sm:p-5 rounded-md border border-blue-100 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Successful Txns</span>
            <div className="mt-1.5 flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                {report.successfulTransactions}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">Completed contributions</p>
          </div>

          {/* Failed Transactions */}
          <div className="bg-gradient-to-br from-rose-50 to-white p-4 sm:p-5 rounded-md border border-rose-100 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wide text-rose-700">Failed Txns</span>
            <div className="mt-1.5 flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-bold text-rose-700 tracking-tight">
                {report.failedTransactions}
              </span>
            </div>
            <p className="text-xs text-rose-500 mt-1">Declined at gateway</p>
          </div>
        </div>

        {/* Periodic Breakdown Table */}
        <div className="bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-b border-gray-100">
            <h4 className="font-bold text-sm sm:text-base text-gray-900">Monthly Collection Breakdown</h4>
            <p className="text-xs text-gray-500 mt-0.5">Aggregate performance grouped by monthly collection cycle</p>
          </div>

          <div className="overflow-x-auto w-full scrollbar-thin">
            <table className="w-full min-w-[600px] text-left text-xs sm:text-sm">
              <thead className="bg-gray-50 text-gray-700 border-b border-gray-200 uppercase text-xs font-bold tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Month / Period</th>
                  <th className="px-5 py-3.5 text-right">Transactions</th>
                  <th className="px-5 py-3.5 text-right">Gross (₹)</th>
                  <th className="px-5 py-3.5 text-right">Refunds (₹)</th>
                  <th className="px-5 py-3.5 text-right">Net Collection (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading && !data ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-gray-400">
                      Generating reconciliation report...
                    </td>
                  </tr>
                ) : report.periodBreakdown && report.periodBreakdown.length > 0 ? (
                  report.periodBreakdown.map((row) => (
                    <tr key={row.period} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-5 py-3.5 font-semibold text-gray-900">{row.period}</td>
                      <td className="px-5 py-3.5 text-right font-medium text-gray-700">{row.count}</td>
                      <td className="px-5 py-3.5 text-right font-bold text-gray-900">{formatCurrency(row.gross)}</td>
                      <td className="px-5 py-3.5 text-right font-medium text-amber-700">
                        {row.refunds > 0 ? formatCurrency(row.refunds) : '₹0'}
                      </td>
                      <td className="px-5 py-3.5 text-right font-bold text-emerald-700">{formatCurrency(row.net)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center">
                      <div className="max-w-md mx-auto space-y-2">
                        <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
                          <FileSpreadsheet className="w-5 h-5" />
                        </div>
                        <h5 className="font-bold text-gray-700 text-xs uppercase tracking-wider">
                          No Periodic Report Data
                        </h5>
                        <p className="text-xs text-gray-400">
                          No transactions recorded within the chosen date range or filter criteria. Try adjusting the
                          date filters above.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* SECTION 2: GATEWAY RECONCILIATION ENGINE */}
      {/* ---------------------------------------------------------------- */}
      <div className="bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden space-y-6 p-5 sm:p-6">
        {/* Header & Primary Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-saffron shrink-0" />
              <h3 className="font-bold text-base sm:text-lg text-slate-900">Gateway Financial Reconciliation</h3>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Reconcile your application ledger against Razorpay gateway records.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <AdminButton
              onClick={() => setShowAuditLogs(true)}
              variant="outline"
              size="sm"
              leftIcon={<History className="w-4 h-4 text-gray-500" />}
              className="cursor-pointer"
            >
              Audit History
            </AdminButton>

            <AdminButton
              onClick={() => setShowRunReconModal(true)}
              disabled={isReconciling}
              variant="primary"
              size="sm"
              leftIcon={<RefreshCw className={cn('w-4 h-4', isReconciling && 'animate-spin')} />}
              className="cursor-pointer"
            >
              {isReconciling ? 'Reconciling...' : 'Run Reconciliation'}
            </AdminButton>
          </div>
        </div>

        {/* Reconciliation Status Comparison Card */}
        {latestRecon ? (
          <div className="space-y-4">
            {/* Main Visual Banner (Clean vs Gateway Unavailable vs Attention Required) */}
            <div
              className={`rounded-md border p-4 sm:p-5 ${
                isReconClean
                  ? 'bg-gradient-to-br from-emerald-500/10 via-emerald-50/40 to-white border-emerald-300'
                  : isGatewayUnavailable
                    ? 'bg-gradient-to-br from-amber-500/10 via-orange-50/40 to-white border-amber-300'
                    : 'bg-gradient-to-br from-rose-500/10 via-amber-50/40 to-white border-rose-300'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/5 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  {isReconClean ? (
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  ) : isGatewayUnavailable ? (
                    <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center shadow-xs">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-xs">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                  )}
                  <div>
                    <span
                      className={`text-base sm:text-lg font-bold tracking-tight ${
                        isReconClean ? 'text-emerald-800' : isGatewayUnavailable ? 'text-amber-800' : 'text-rose-800'
                      }`}
                    >
                      {isReconClean
                        ? 'Reconciled'
                        : isGatewayUnavailable
                          ? 'Gateway Unavailable'
                          : 'Attention Required'}
                    </span>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {isReconClean
                        ? 'Application collections perfectly match Gateway reported revenue.'
                        : isGatewayUnavailable
                          ? 'Gateway unavailable — reconciliation could not be completed.'
                          : `Identified ${latestRecon.mismatchesCount} discrepancies requiring investigation.`}
                    </p>
                  </div>
                </div>

                {/* Right Top End: Combined Gateway Badge and Timestamp */}
                <div className="flex flex-wrap items-center sm:justify-end gap-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 font-medium text-emerald-800 bg-white/90 px-2.5 py-1 rounded-full border border-emerald-200/90 shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    Live Gateway Verification
                  </span>
                  {latestRecon?.createdAt && (
                    <span className="text-slate-600 bg-white/80 px-2.5 py-1 rounded-full border border-slate-200/80 text-[11px] shadow-2xs">
                      Fetched: <span className="font-semibold text-slate-800">{formatDate(latestRecon.createdAt)}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Exact comparison columns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Application Box */}
                <div className="bg-white/80 rounded-md p-4 border border-gray-200 shadow-xs">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Application Records
                  </span>
                  <div className="mt-1.5 flex items-baseline justify-between">
                    <span className="text-2xl font-bold text-gray-900">{formatCurrency(latestRecon.localTotal)}</span>
                    <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                      {latestRecon.localCount} payments
                    </span>
                  </div>
                </div>

                {/* Gateway Box */}
                <div className="bg-white/80 rounded-md p-4 border border-gray-200 shadow-xs">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Gateway Records</span>
                  <div className="mt-1.5 flex items-baseline justify-between">
                    <span className="text-2xl font-bold text-gray-900">{formatCurrency(latestRecon.gatewayTotal)}</span>
                    <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                      {latestRecon.gatewayCount} payments
                    </span>
                  </div>
                </div>

                {/* Difference Box */}
                <div
                  className={`rounded-md p-4 border shadow-xs ${
                    latestRecon.difference === 0
                      ? 'bg-emerald-50/70 border-emerald-200'
                      : 'bg-rose-50/80 border-rose-200'
                  }`}
                >
                  <span
                    className={`text-xs font-semibold uppercase tracking-wide ${
                      latestRecon.difference === 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    Variance Difference
                  </span>
                  <div className="mt-1.5 flex items-baseline justify-between">
                    <span
                      className={`text-2xl font-bold ${
                        latestRecon.difference === 0 ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {formatCurrency(latestRecon.difference)}
                    </span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        latestRecon.difference === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {latestRecon.difference === 0 ? 'Zero Variance' : 'Variance Detected'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Reconciliation KPI summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                <span className="text-xs font-semibold text-gray-500 uppercase">Records Checked</span>
                <p className="text-base font-bold text-gray-900 mt-1">{latestRecon.recordsChecked}</p>
              </div>

              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                <span className="text-xs font-semibold text-gray-500 uppercase">Mismatches Found</span>
                <p
                  className={`text-base font-bold mt-1 ${
                    latestRecon.mismatchesCount > 0 ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  {latestRecon.mismatchesCount}
                </p>
              </div>

              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                <span className="text-xs font-semibold text-gray-500 uppercase">Audit Verified By</span>
                <p className="text-xs font-mono font-semibold text-gray-700 truncate mt-1">{latestRecon.performedBy}</p>
              </div>
            </div>

            {/* Affected Transactions / Discrepancy Table */}
            {latestRecon.discrepancies && latestRecon.discrepancies.length > 0 ? (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                    <span>Discrepancies & Variances ({latestRecon.discrepancies.length})</span>
                  </h4>
                  <span className="text-xs text-gray-500">
                    Click Inspect on any transaction to drill into the record
                  </span>
                </div>

                <div className="border border-gray-200 rounded-md overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[700px]">
                    <thead className="bg-gray-50 text-gray-700 uppercase font-bold text-xs tracking-wider border-b border-gray-200">
                      <tr>
                        <th className="px-3.5 py-2.5">Discrepancy Type</th>
                        <th className="px-3.5 py-2.5">Gateway Reference</th>
                        <th className="px-3.5 py-2.5">App Reference</th>
                        <th className="px-3.5 py-2.5 text-right">App Amount</th>
                        <th className="px-3.5 py-2.5 text-right">Gateway Amount</th>
                        <th className="px-3.5 py-2.5 text-right">Diff</th>
                        <th className="px-3.5 py-2.5">Explanation</th>
                        <th className="px-3.5 py-2.5 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {latestRecon.discrepancies.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="px-3.5 py-2.5 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                item.type === 'MISSING_LOCAL'
                                  ? 'bg-rose-100 text-rose-800'
                                  : item.type === 'MISSING_GATEWAY'
                                    ? 'bg-amber-100 text-amber-800'
                                    : item.type === 'AMOUNT_MISMATCH'
                                      ? 'bg-purple-100 text-purple-800'
                                      : item.type === 'STATUS_MISMATCH'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {item.type}
                            </span>
                          </td>

                          <td className="px-3.5 py-2.5 font-mono text-gray-700 whitespace-nowrap">
                            {item.gatewayPaymentId || item.gatewayOrderId || '—'}
                          </td>

                          <td className="px-3.5 py-2.5 font-mono text-gray-700 whitespace-nowrap">
                            {item.localPaymentId ? (
                              <span className="text-saffron font-semibold">{item.localPaymentId.slice(0, 8)}...</span>
                            ) : (
                              '—'
                            )}
                          </td>

                          <td className="px-3.5 py-2.5 text-right font-medium text-gray-800">
                            {item.localAmount !== undefined ? formatCurrency(item.localAmount) : '—'}
                          </td>

                          <td className="px-3.5 py-2.5 text-right font-medium text-gray-800">
                            {item.gatewayAmount !== undefined ? formatCurrency(item.gatewayAmount) : '—'}
                          </td>

                          <td className="px-3.5 py-2.5 text-right font-bold text-rose-600">
                            {item.amountDifference ? formatCurrency(item.amountDifference) : '—'}
                          </td>

                          <td className="px-3.5 py-2.5 text-gray-600 max-w-xs truncate" title={item.description}>
                            {item.description}
                          </td>

                          <td className="px-3.5 py-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleInspectDiscrepancy(item)}
                              disabled={inspectLoadingId === item.id}
                              className="px-2.5 py-1 text-xs font-semibold bg-white hover:bg-saffron hover:text-white text-gray-700 rounded-md border border-gray-200 transition-colors cursor-pointer"
                            >
                              {inspectLoadingId === item.id ? 'Loading...' : 'Inspect'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50/50 border border-emerald-200 rounded-md p-4 text-center">
                <ShieldCheck className="w-6 h-6 text-emerald-600 mx-auto mb-1.5" />
                <p className="text-xs font-bold text-emerald-800">Zero Discrepancies Recorded</p>
                <p className="text-[11px] text-emerald-600 mt-0.5">
                  Every local payment and refund record matches Razorpay gateway records without deviation.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-md p-8 text-center space-y-3">
            <Scale className="w-10 h-10 text-gray-400 mx-auto" />
            <h4 className="font-bold text-gray-800 text-sm">No Reconciliation Audit Run Yet</h4>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Click &quot;Run Reconciliation&quot; above to cross-reference all local donations against the live
              Razorpay gateway ledger and generate an audit discrepancy report.
            </p>
            <AdminButton
              onClick={handleRunReconciliation}
              disabled={isReconciling}
              variant="primary"
              size="sm"
              leftIcon={<RefreshCw className={cn('w-4 h-4', isReconciling && 'animate-spin')} />}
              className="cursor-pointer"
            >
              {isReconciling ? 'Running...' : 'Run First Reconciliation'}
            </AdminButton>
          </div>
        )}
      </div>

      {/* Discrepancy Detail Modal */}
      {selectedDiscrepancy &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
              onClick={() => setSelectedDiscrepancy(null)}
            />
            <div className="relative bg-white rounded-md max-w-lg w-full p-6 space-y-4 shadow-2xl border border-gray-200 z-10">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <h3 className="font-bold text-gray-900 text-base">Discrepancy Investigation</h3>
                </div>
                <button
                  onClick={() => setSelectedDiscrepancy(null)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-md"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-gray-50 rounded-md border border-gray-200 space-y-1">
                  <span className="font-bold text-gray-500 uppercase text-[10px]">Issue Type</span>
                  <p className="font-mono font-bold text-gray-800">{selectedDiscrepancy.type}</p>
                  <p className="text-gray-600 mt-1">{selectedDiscrepancy.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 border border-gray-200 rounded-md">
                    <span className="text-gray-400 text-[10px] uppercase font-bold">App Record</span>
                    <p className="font-mono text-gray-800 mt-1">ID: {selectedDiscrepancy.localPaymentId || 'None'}</p>
                    <p className="font-bold text-gray-900 mt-0.5">
                      Amount:{' '}
                      {selectedDiscrepancy.localAmount !== undefined
                        ? formatCurrency(selectedDiscrepancy.localAmount)
                        : '—'}
                    </p>
                    <p className="text-gray-600">Status: {selectedDiscrepancy.localStatus || '—'}</p>
                  </div>

                  <div className="p-3 border border-gray-200 rounded-md">
                    <span className="text-gray-400 text-[10px] uppercase font-bold">Gateway Record</span>
                    <p className="font-mono text-gray-800 mt-1">
                      Pay ID: {selectedDiscrepancy.gatewayPaymentId || 'None'}
                    </p>
                    <p className="font-bold text-gray-900 mt-0.5">
                      Amount:{' '}
                      {selectedDiscrepancy.gatewayAmount !== undefined
                        ? formatCurrency(selectedDiscrepancy.gatewayAmount)
                        : '—'}
                    </p>
                    <p className="text-gray-600">Status: {selectedDiscrepancy.gatewayStatus || '—'}</p>
                  </div>
                </div>

                {selectedDiscrepancy.amountDifference ? (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-rose-800">
                    <span className="font-bold">Calculated Variance: </span>
                    <span className="font-bold">{formatCurrency(selectedDiscrepancy.amountDifference)}</span>
                  </div>
                ) : null}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedDiscrepancy(null)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-md text-xs font-semibold hover:bg-slate-800 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Audit Logs Modal */}
      {showAuditLogs &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
              onClick={() => setShowAuditLogs(false)}
            />
            <div className="relative bg-white rounded-md max-w-3xl w-full p-6 space-y-4 shadow-2xl max-h-[85vh] flex flex-col border border-gray-200 z-10">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-saffron" />
                  <h3 className="font-bold text-gray-900 text-base">Payment Audit Trail</h3>
                </div>
                <button
                  onClick={() => setShowAuditLogs(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-md"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-gray-500">
                Immutable administrative log of payment verifications, status transitions, refunds, and reconciliation
                events.
              </p>

              <div className="overflow-y-auto flex-1 space-y-2 border border-gray-200 rounded-md p-2">
                {isLoadingAuditLogs ? (
                  <p className="text-xs text-gray-400 text-center py-6">Loading audit trail...</p>
                ) : auditLogs && auditLogs.length > 0 ? (
                  auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 bg-gray-50 hover:bg-gray-100/80 rounded-md text-xs space-y-1 transition-colors border border-gray-200/70"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900 font-mono">{log.action}</span>
                        <span className="text-[11px] text-gray-500 font-mono">{formatDate(log.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-gray-600">
                        <span className="bg-gray-200 px-1.5 py-0.5 rounded font-bold text-[10px]">{log.actorType}</span>
                        <span>Actor: {log.actorId || 'System'}</span>
                        {log.paymentId && (
                          <span className="font-mono text-gray-500">Payment: {log.paymentId.slice(0, 8)}...</span>
                        )}
                      </div>
                      {log.details && (
                        <pre className="text-[10px] bg-white p-2 rounded border border-gray-200 text-gray-600 overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 text-center py-6">No audit records found.</p>
                )}
              </div>

              <div className="flex justify-end pt-2 border-t">
                <button
                  onClick={() => setShowAuditLogs(false)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-md text-xs font-semibold hover:bg-slate-800 cursor-pointer"
                >
                  Close Audit Trail
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Run Reconciliation Configuration Modal */}
      {showRunReconModal &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
              onClick={() => !isReconciling && setShowRunReconModal(false)}
            />

            <div className="relative w-full max-w-lg bg-white rounded-md shadow-2xl border border-gray-200 overflow-hidden z-10 space-y-5 p-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3.5">
                <div className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-saffron shrink-0" />
                  <h3 className="font-bold text-slate-900 text-base">Run Financial Reconciliation</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRunReconModal(false)}
                  disabled={isReconciling}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-gray-500">
                Compare your application payment ledger against Razorpay gateway records to detect missing payments,
                amount discrepancies, and status mismatches.
              </p>

              {/* Data Source Selection */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Reconciliation Data Source
                </label>

                <div className="space-y-2">
                  <label
                    onClick={() => setLiveFetch(true)}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-md border text-xs cursor-pointer transition-all',
                      liveFetch
                        ? 'border-saffron bg-orange-50/40 text-slate-900 ring-1 ring-saffron/20'
                        : 'border-gray-200 bg-white hover:bg-gray-50 text-slate-700'
                    )}
                  >
                    <input
                      type="radio"
                      name="reconDataSource"
                      checked={liveFetch}
                      onChange={() => setLiveFetch(true)}
                      className="mt-0.5 text-saffron focus:ring-saffron"
                    />
                    <div className="space-y-0.5">
                      <span className="font-semibold text-slate-900">Fetch fresh data from Razorpay (Recommended)</span>
                      <p className="text-gray-500 text-[11px]">
                        Queries live Razorpay API to inspect the latest captured, authorized, and refunded payments.
                      </p>
                    </div>
                  </label>

                  <label
                    onClick={() => setLiveFetch(false)}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-md border text-xs cursor-pointer transition-all',
                      !liveFetch
                        ? 'border-saffron bg-orange-50/40 text-slate-900 ring-1 ring-saffron/20'
                        : 'border-gray-200 bg-white hover:bg-gray-50 text-slate-700'
                    )}
                  >
                    <input
                      type="radio"
                      name="reconDataSource"
                      checked={!liveFetch}
                      onChange={() => setLiveFetch(false)}
                      className="mt-0.5 text-saffron focus:ring-saffron"
                    />
                    <div className="space-y-0.5">
                      <span className="font-semibold text-slate-900">Use existing local ledger snapshot</span>
                      <p className="text-gray-500 text-[11px]">
                        Compares only stored application records without issuing live requests to Razorpay.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Optional Date Scope */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Period Scope{' '}
                  <span className="text-gray-400 font-normal lowercase">(optional — leave blank for all records)</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <DatePicker value={reconStartDate} onChange={setReconStartDate} placeholder="Start date..." />
                  <DatePicker value={reconEndDate} onChange={setReconEndDate} placeholder="End date..." />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                <AdminButton
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRunReconModal(false)}
                  disabled={isReconciling}
                >
                  Cancel
                </AdminButton>
                <AdminButton
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={async () => {
                    setShowRunReconModal(false);
                    await handleRunReconciliation();
                  }}
                  disabled={isReconciling}
                  leftIcon={<RefreshCw className={cn('w-4 h-4', isReconciling && 'animate-spin')} />}
                >
                  {isReconciling ? 'Reconciling...' : 'Run Reconciliation'}
                </AdminButton>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default DonationsReportsTab;
