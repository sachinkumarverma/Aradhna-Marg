import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { HeartHandshake, LayoutDashboard, CreditCard, Users, FileSpreadsheet, RefreshCw } from 'lucide-react';
import { AdminButton } from '@admin/components/AdminButton';
import { cn } from '@utils/cn';
import type { PaymentItem } from '@admin/features/donations/DonationsApi';
import { DonationsOverviewTab } from './DonationsOverviewTab';
import { DonationsPaymentsTab } from './DonationsPaymentsTab';
import { DonationsSupportersTab } from './DonationsSupportersTab';
import { DonationsReportsTab } from './DonationsReportsTab';
import { PaymentDetailDrawer } from './PaymentDetailDrawer';
import { RefundModal } from './RefundModal';

export type DonationTabKey = 'overview' | 'payments' | 'supporters' | 'reports';

const VALID_TABS: readonly DonationTabKey[] = ['overview', 'payments', 'supporters', 'reports'] as const;

export interface AdminDonationsProps {
  defaultTab?: DonationTabKey;
}

export const AdminDonations: React.FC<AdminDonationsProps> = ({ defaultTab = 'overview' }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const urlTab = searchParams.get('tab') as DonationTabKey | null;

  const [activeTab, setActiveTab] = useState<DonationTabKey>(
    urlTab && VALID_TABS.includes(urlTab) ? urlTab : defaultTab
  );

  // Cross-tab drill-down filter state (e.g., clicking failed payments from overview)
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string | undefined>(undefined);

  // Drawer & modal states
  const [selectedPayment, setSelectedPayment] = useState<PaymentItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [refundPayment, setRefundPayment] = useState<PaymentItem | null>(null);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState<boolean>(false);

  // Keep visited tabs alive in DOM to avoid remounting, refetching, and layout flickering
  const [visitedTabs, setVisitedTabs] = useState<Set<DonationTabKey>>(() => new Set([activeTab]));

  useEffect(() => {
    if (urlTab && VALID_TABS.includes(urlTab) && urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
  }, [urlTab]);

  useEffect(() => {
    setVisitedTabs((prev) => {
      if (prev.has(activeTab)) return prev;
      const next = new Set(prev);
      next.add(activeTab);
      return next;
    });
  }, [activeTab]);

  const handleTabChange = (tab: DonationTabKey) => {
    setActiveTab(tab);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('tab', tab);
        return next;
      },
      { replace: true }
    );
  };

  const handleNavigateToPayments = (filter?: { status?: string }) => {
    if (filter?.status) {
      setPaymentStatusFilter(filter.status);
    }
    handleTabChange('payments');
  };

  const handleOpenPaymentDetail = (payment: PaymentItem) => {
    setSelectedPayment(payment);
    setIsDrawerOpen(true);
  };

  const handleClosePaymentDetail = () => {
    setIsDrawerOpen(false);
  };

  const handleOpenRefund = (payment: PaymentItem) => {
    setRefundPayment(payment);
    setIsRefundModalOpen(true);
  };

  const handleCloseRefund = () => {
    setIsRefundModalOpen(false);
    setRefundPayment(null);
  };

  const handleRefundSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-donations-overview'] });
    queryClient.invalidateQueries({ queryKey: ['admin-donations-payments'] });
    queryClient.invalidateQueries({ queryKey: ['admin-donations-supporters'] });
    queryClient.invalidateQueries({ queryKey: ['admin-donations-reports'] });
    if (selectedPayment) {
      setIsDrawerOpen(false);
      setSelectedPayment(null);
    }
  };

  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin-donations-overview'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-donations-payments'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-donations-supporters'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-donations-reports'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-donations-reconciliation-latest'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-donations-audit-logs'] })
    ]);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'supporters', label: 'Supporters', icon: Users },
    { id: 'reports', label: 'Reports & Audits', icon: FileSpreadsheet }
  ] as const;

  return (
    <div className="space-y-6 flex flex-col flex-1 pb-8 w-full max-w-full min-w-0">
      {/* Top Header matching other sections */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-2xl font-bold tracking-wide text-slate-900 flex items-center gap-2 uppercase truncate">
            <HeartHandshake className="w-5 h-5 sm:w-6 sm:h-6 text-saffron shrink-0" />
            <span className="truncate">DONATIONS & SUPPORT</span>
          </h1>
          <p className="hidden sm:block text-sm text-gray-500 mt-1">
            Manage devotional offerings, track supporter engagements, audit transaction flows, and generate financial
            reports.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <AdminButton
            onClick={handleRefreshAll}
            variant="outline"
            title="Refresh"
            aria-label="Refresh"
            disabled={isRefreshing}
            className="h-8 w-8 sm:h-9 sm:w-9 p-0 flex items-center justify-center shrink-0 bg-white hover:bg-slate-50 border-gray-200 text-slate-700"
          >
            <RefreshCw
              className={cn(
                'w-4 h-4 shrink-0 stroke-[2.2]',
                isRefreshing ? 'animate-spin text-saffron' : 'text-slate-600'
              )}
            />
          </AdminButton>
        </div>
      </div>

      {/* Internal Module Tabs */}
      <div className="border-b border-gray-200 pt-1">
        <div className="flex overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id as DonationTabKey)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-bold uppercase border-b-2 transition-colors whitespace-nowrap cursor-pointer',
                  isActive
                    ? 'border-saffron text-saffron'
                    : 'border-transparent text-gray-600 hover:text-black hover:border-gray-300'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Panels with keep-alive mounting for smooth flicker-free switching */}
      <div>
        {visitedTabs.has('overview') && (
          <div className={activeTab === 'overview' ? 'block' : 'hidden'}>
            <DonationsOverviewTab onNavigateToPayments={handleNavigateToPayments} />
          </div>
        )}

        {visitedTabs.has('payments') && (
          <div className={activeTab === 'payments' ? 'block' : 'hidden'}>
            <DonationsPaymentsTab
              initialStatusFilter={paymentStatusFilter}
              onSelectPayment={handleOpenPaymentDetail}
              onOpenRefund={handleOpenRefund}
            />
          </div>
        )}

        {visitedTabs.has('supporters') && (
          <div className={activeTab === 'supporters' ? 'block' : 'hidden'}>
            <DonationsSupportersTab onSelectPayment={handleOpenPaymentDetail} />
          </div>
        )}

        {visitedTabs.has('reports') && (
          <div className={activeTab === 'reports' ? 'block' : 'hidden'}>
            <DonationsReportsTab onSelectPayment={handleOpenPaymentDetail} />
          </div>
        )}
      </div>

      {/* Payment Detail Drawer */}
      <PaymentDetailDrawer
        payment={selectedPayment}
        isOpen={isDrawerOpen}
        onClose={handleClosePaymentDetail}
        onOpenRefund={handleOpenRefund}
      />

      {/* Refund Confirmation / Execution Modal */}
      <RefundModal
        payment={refundPayment}
        isOpen={isRefundModalOpen}
        onClose={handleCloseRefund}
        onSuccess={handleRefundSuccess}
      />
    </div>
  );
};

export default AdminDonations;
