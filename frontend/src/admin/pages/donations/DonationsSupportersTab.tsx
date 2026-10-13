import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, X, ChevronLeft, ChevronRight, History, Users } from 'lucide-react';
import { DonationsApi, type SupporterItem, type PaymentItem } from '@admin/features/donations/DonationsApi';
import { Pagination } from '@components/ui/Pagination';

interface DonationsSupportersTabProps {
  onSelectPayment: (payment: PaymentItem) => void;
}

export const DonationsSupportersTab: React.FC<DonationsSupportersTabProps> = ({ onSelectPayment }) => {
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);
  const [search, setSearch] = useState<string>('');
  const [selectedSupporterKey, setSelectedSupporterKey] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-donations-supporters', page, limit, search],
    queryFn: () => DonationsApi.getSupporters({ page, limit, search: search.trim() || undefined }),
    staleTime: 60 * 1000
  });

  const { data: supporterDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['admin-donations-supporter-details', selectedSupporterKey],
    queryFn: () => (selectedSupporterKey ? DonationsApi.getSupporterDetails(selectedSupporterKey) : null),
    enabled: !!selectedSupporterKey
  });

  const supporters: SupporterItem[] = data?.data || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
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

  return (
    <div className="space-y-4">
      {/* Search Header */}
      <div className="bg-white rounded-md border border-gray-200 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search supporters by name or email..."
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

        <div className="text-xs text-gray-500 font-medium">
          Showing <span className="font-bold text-gray-900">{total}</span> unique supporters
        </div>
      </div>

      {/* Supporters Table */}
      <div className="bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto w-full scrollbar-thin">
          <table className="w-full min-w-[700px] text-left text-xs sm:text-sm">
            <thead className="bg-gray-50 text-gray-700 border-b border-gray-200 uppercase text-xs font-bold tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Supporter Name</th>
                <th className="px-5 py-3.5">Email</th>
                <th className="px-5 py-3.5 text-center">Contributions</th>
                <th className="px-5 py-3.5">Total Contribution</th>
                <th className="px-5 py-3.5">First Contribution</th>
                <th className="px-5 py-3.5">Last Contribution</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading && !data ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    Loading supporters...
                  </td>
                </tr>
              ) : supporters.length > 0 ? (
                supporters.map((s) => (
                  <tr
                    key={s.supporterKey}
                    onClick={() => setSelectedSupporterKey(s.supporterKey)}
                    className="hover:bg-gray-50/80 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3.5 font-semibold text-gray-900">
                      <div className="flex items-center gap-2">
                        <span>{s.supporterName}</span>
                        {s.isAnonymous && (
                          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                            Anonymous
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">
                      {s.isAnonymous ? '—' : s.supporterEmail || 'Not specified'}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200">
                        {s.contributionCount}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-gray-900">{formatCurrency(s.totalContributed)}</td>
                    <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">{formatDate(s.firstContribution)}</td>
                    <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">{formatDate(s.lastContribution)}</td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSupporterKey(s.supporterKey);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-saffron hover:bg-orange-50 rounded-md transition-colors"
                      >
                        <History className="w-3.5 h-3.5" />
                        History
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    {search ? (
                      <div className="max-w-md mx-auto space-y-3">
                        <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center mx-auto">
                          <Search className="w-6 h-6" />
                        </div>
                        <h4 className="font-bold text-gray-800 text-sm">No Supporters Found</h4>
                        <p className="text-xs text-gray-500">
                          No supporter records matched &quot;{search}&quot;. Try searching by another name or email.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setSearch('');
                            setPage(1);
                          }}
                          className="px-3 py-1.5 text-xs font-semibold text-saffron hover:bg-orange-50 border border-orange-200 rounded-md cursor-pointer transition-colors"
                        >
                          Clear Search
                        </button>
                      </div>
                    ) : (
                      <div className="max-w-md mx-auto space-y-2">
                        <div className="w-12 h-12 rounded-full bg-orange-50 text-saffron flex items-center justify-center mx-auto">
                          <Users className="w-6 h-6" />
                        </div>
                        <h4 className="font-bold text-gray-800 text-sm">No Supporter Profiles Yet</h4>
                        <p className="text-xs text-gray-500">
                          Once devotees contribute, their profiles, giving frequency, and historical offerings will be
                          aggregated here.
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
          limitOptions={[10, 20, 50]}
        />
      </div>

      {/* Supporter Contribution History Drawer */}
      {selectedSupporterKey && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedSupporterKey(null)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <div>
                  <h3 className="font-bold text-base text-gray-900">
                    {supporterDetails?.supporter?.supporterName || 'Supporter Profile'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {supporterDetails?.supporter?.supporterEmail || 'Anonymous'}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedSupporterKey(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-200/50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Supporter Summary Banner */}
              <div className="p-5 border-b border-gray-100 bg-gradient-to-br from-orange-50 to-white">
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-white p-3 rounded-md border border-orange-100 shadow-xs">
                    <span className="text-[11px] font-semibold uppercase text-gray-500">Total Donated</span>
                    <p className="text-xl font-bold text-gray-900 mt-0.5">
                      {formatCurrency(supporterDetails?.supporter?.totalContributed || 0)}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-md border border-orange-100 shadow-xs">
                    <span className="text-[11px] font-semibold uppercase text-gray-500">Contributions</span>
                    <p className="text-xl font-bold text-gray-900 mt-0.5">
                      {supporterDetails?.supporter?.contributionCount || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payments History List */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                  Contribution History
                </h4>

                {isLoadingDetails ? (
                  <p className="text-xs text-gray-400 text-center py-6">Loading history...</p>
                ) : supporterDetails?.payments && supporterDetails.payments.length > 0 ? (
                  supporterDetails.payments.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        setSelectedSupporterKey(null);
                        onSelectPayment(p);
                      }}
                      className="p-3 bg-gray-50 hover:bg-orange-50/50 rounded-md border border-gray-200 hover:border-orange-200 transition-all cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-gray-900 text-sm">{formatCurrency(p.amount)}</div>
                        <div className="text-[11px] text-gray-500 mt-0.5">
                          {formatDate(p.paidAt || p.createdAt)} • {p.paymentMethod || 'UPI'}
                        </div>
                      </div>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {p.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 text-center py-6">No contributions recorded for this profile.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
