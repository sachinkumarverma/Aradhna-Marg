import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Music2,
  PlaySquare,
  BrainCircuit,
  Activity,
  FileText,
  CheckCircle2,
  XCircle,
  HeartHandshake,
  ArrowRight,
  Smartphone
} from 'lucide-react';
import { DonationsApi, type PaymentItem } from '@admin/features/donations/DonationsApi';

import { StatCard } from '@admin/components/StatCard';
import { apiClient } from '@api/client';
import { getAdminPath } from '@utils/host';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      const res = await apiClient.get('/v1/admin/dashboard/stats');
      return res.data.data;
    }
  });

  const { data: activityData, isLoading: isLoadingActivity } = useQuery({
    queryKey: ['admin-dashboard-activity'],
    queryFn: async () => {
      const res = await apiClient.get('/v1/admin/dashboard/activity?limit=5');
      return res.data.data.activity;
    }
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await apiClient.get('/v1/settings');
      return res.data.data;
    }
  });

  const { data: donationsOverview, isLoading: isLoadingDonationsOverview } = useQuery({
    queryKey: ['admin-dashboard-donations-overview'],
    queryFn: () => DonationsApi.getOverview('30d')
  });

  const { data: recentDonations, isLoading: isLoadingRecentDonations } = useQuery({
    queryKey: ['admin-dashboard-donations-recent'],
    queryFn: () => DonationsApi.getPayments({ page: 1, limit: 4, status: 'SUCCESS' })
  });

  const recentBhajans = (activityData || []).slice(0, 5);

  if (isLoadingStats && isLoadingActivity) {
    return (
      <div className="space-y-6 flex flex-col min-h-full animate-pulse">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold tracking-wide text-slate-900 flex items-center gap-2 uppercase truncate">
            <LayoutDashboard className="w-5 h-5 sm:w-6 sm:h-6 text-saffron shrink-0" />
            <span className="truncate">DASHBOARD</span>
          </h1>
          <p className="hidden sm:block text-sm text-gray-500 mt-1">Platform overview and automation status</p>
        </div>

        {/* Primary Stats Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 sm:gap-4">
          <div className="rounded-md border p-4 sm:p-5 shadow-xs bg-gradient-to-br from-blue-50 to-white border-blue-100 flex items-start justify-between">
            <div className="space-y-2">
              <div className="h-3.5 w-28 bg-blue-200/70 rounded"></div>
              <div className="h-7 w-20 bg-slate-300 rounded"></div>
            </div>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-blue-100/80 shrink-0"></div>
          </div>

          <div className="rounded-md border p-4 sm:p-5 shadow-xs bg-gradient-to-br from-orange-50 to-white border-orange-100 flex items-start justify-between">
            <div className="space-y-2">
              <div className="h-3.5 w-28 bg-orange-200/70 rounded"></div>
              <div className="h-7 w-16 bg-slate-300 rounded"></div>
            </div>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-orange-100/80 shrink-0"></div>
          </div>

          <div className="rounded-md border p-4 sm:p-5 shadow-xs bg-gradient-to-br from-amber-50 to-white border-amber-100 flex items-start justify-between">
            <div className="space-y-2">
              <div className="h-3.5 w-24 bg-amber-200/70 rounded"></div>
              <div className="h-7 w-12 bg-slate-300 rounded"></div>
            </div>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-amber-100/80 shrink-0"></div>
          </div>

          <div className="rounded-md border p-4 sm:p-5 shadow-xs bg-gradient-to-br from-purple-50 to-white border-purple-100 flex items-start justify-between">
            <div className="space-y-2">
              <div className="h-3.5 w-32 bg-purple-200/70 rounded"></div>
              <div className="h-7 w-12 bg-slate-300 rounded"></div>
            </div>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-purple-100/80 shrink-0"></div>
          </div>

          <div className="rounded-md border p-4 sm:p-5 shadow-xs bg-gradient-to-br from-emerald-50 to-white border-emerald-100 flex items-start justify-between">
            <div className="space-y-2">
              <div className="h-3.5 w-24 bg-emerald-200/70 rounded"></div>
              <div className="h-7 w-14 bg-slate-300 rounded"></div>
            </div>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-emerald-100/80 shrink-0"></div>
          </div>
        </div>

        {/* Middle Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
          {/* Recently Added Bhajans (5 rows) */}
          <div className="lg:col-span-2 bg-gradient-to-br from-slate-50 to-white rounded-md border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-4 py-3.5 sm:px-5 sm:py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="h-4 sm:h-5 w-44 bg-slate-200 rounded"></div>
            </div>
            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-[500px] sm:min-w-[520px] text-left text-xs sm:text-sm">
                <thead className="bg-orange-50 text-orange-900 border-b border-orange-100 uppercase text-[11px] sm:text-xs tracking-wider font-semibold">
                  <tr>
                    <th className="px-4 py-3 sm:px-5 sm:py-4">Event</th>
                    <th className="px-4 py-3 sm:px-5 sm:py-4">Target</th>
                    <th className="px-4 py-3 sm:px-5 sm:py-4 text-center">Status</th>
                    <th className="px-4 py-3 sm:px-5 sm:py-4">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="bg-gray-50/50">
                      <td className="px-4 py-2.5 sm:px-5 sm:py-3">
                        <div className="h-3.5 w-24 bg-slate-200/70 rounded"></div>
                      </td>
                      <td className="px-4 py-2.5 sm:px-5 sm:py-3">
                        <div className="h-3.5 w-40 sm:w-56 bg-slate-200/80 rounded"></div>
                      </td>
                      <td className="px-4 py-2.5 sm:px-5 sm:py-3 text-center">
                        <div className="h-4 w-16 bg-slate-200/80 rounded-full mx-auto"></div>
                      </td>
                      <td className="px-4 py-2.5 sm:px-5 sm:py-3">
                        <div className="h-3.5 w-28 bg-slate-200/70 rounded"></div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* YouTube Automation Skeleton */}
          <div className="bg-gradient-to-br from-red-50 to-white rounded-md border border-red-100 shadow-xs p-4 sm:p-5 flex flex-col justify-between">
            <div>
              <div className="h-4 sm:h-5 w-36 bg-slate-200 rounded mb-4"></div>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-3.5 w-12 bg-slate-200/60 rounded"></div>
                  <div className="h-5 w-16 bg-green-100 rounded-full"></div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-3.5 w-16 bg-slate-200/60 rounded"></div>
                  <div className="h-3.5 w-28 bg-slate-200/70 rounded"></div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-3.5 w-16 bg-slate-200/60 rounded"></div>
                  <div className="h-3.5 w-20 bg-slate-200/70 rounded"></div>
                </div>
              </div>
            </div>
            <div>
              <hr className="border-gray-100 my-4" />
              <div className="h-9 sm:h-10 w-full bg-slate-100 rounded-md border border-gray-200"></div>
            </div>
          </div>
        </div>

        {/* Devotional Support & Donations Widget Skeleton */}
        <div className="bg-gradient-to-br from-amber-50/60 via-orange-50/30 to-white rounded-md border border-amber-200/70 shadow-xs p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3.5 border-b border-amber-100/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-200/70 shrink-0"></div>
              <div className="space-y-1.5">
                <div className="h-4 w-48 bg-slate-200 rounded"></div>
                <div className="h-3 w-64 bg-slate-100 rounded"></div>
              </div>
            </div>
            <div className="h-7 w-28 bg-orange-100/70 border border-orange-200 rounded-md"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white/90 p-3 rounded-md border border-amber-100 shadow-2xs space-y-2">
                <div className="h-3 w-24 bg-slate-200/60 rounded"></div>
                <div className="h-6 w-28 bg-slate-200/80 rounded"></div>
              </div>
            ))}
          </div>

          <div>
            <div className="h-3.5 w-36 bg-slate-200/70 rounded mb-2.5"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2.5 bg-white rounded-md border border-gray-100 shadow-2xs"
                >
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-24 bg-slate-200/70 rounded"></div>
                    <div className="h-3 w-16 bg-slate-100 rounded"></div>
                  </div>
                  <div className="h-5 w-12 bg-emerald-100/60 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg sm:text-2xl font-bold tracking-wide text-slate-900 flex items-center gap-2 uppercase truncate">
          <LayoutDashboard className="w-5 h-5 sm:w-6 sm:h-6 text-saffron shrink-0" />
          <span className="truncate">DASHBOARD</span>
        </h1>
        <p className="hidden sm:block text-sm text-gray-500 mt-1">Platform overview and automation status</p>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 sm:gap-4">
        <StatCard
          title="Total Content Views"
          value={new Intl.NumberFormat('en-IN').format(stats?.totalViews ?? stats?.todayViews ?? 0)}
          icon={Activity}
          colorClassName="bg-blue-100 text-blue-600"
          bgClassName="bg-gradient-to-br from-blue-50 to-white"
          borderClassName="border-blue-100"
          onClick={() => navigate(getAdminPath('/bhajans?sort=views'))}
        />
        <StatCard
          title="Published Bhajans"
          value={new Intl.NumberFormat('en-IN').format(stats?.published || 0)}
          icon={Music2}
          colorClassName="bg-saffron/20 text-saffron"
          bgClassName="bg-gradient-to-br from-orange-50 to-white"
          borderClassName="border-orange-100"
          onClick={() => navigate(getAdminPath('/bhajans?status=PUBLISHED'))}
        />
        <StatCard
          title="Draft Bhajans"
          value={new Intl.NumberFormat('en-IN').format(stats?.draft || 0)}
          icon={FileText}
          colorClassName="bg-yellow-100 text-yellow-600"
          bgClassName="bg-gradient-to-br from-amber-50 to-white"
          borderClassName="border-amber-100"
          onClick={() => navigate(getAdminPath('/bhajans?status=DRAFT'))}
        />
        <StatCard
          title="Pending AI Processing"
          value={stats?.pendingAi || 0}
          icon={BrainCircuit}
          colorClassName="bg-purple-100 text-purple-600"
          bgClassName="bg-gradient-to-br from-purple-50 to-white"
          borderClassName="border-purple-100"
          onClick={() => navigate(getAdminPath('/ai-jobs'))}
        />
        <StatCard
          title="App Installs"
          value={new Intl.NumberFormat('en-IN').format(stats?.pwaInstalls?.total || 0)}
          icon={Smartphone}
          colorClassName="bg-emerald-100 text-emerald-600"
          bgClassName="bg-gradient-to-br from-emerald-50 to-white"
          borderClassName="border-emerald-100"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Recent Activity Table (Last 5 Bhajans) */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-50 to-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3.5 sm:px-5 sm:py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-sm sm:text-base text-gray-900">Recently Added Bhajans</h3>
            <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              Last 5 items
            </span>
          </div>
          <div className="p-0 overflow-x-auto w-full scrollbar-thin">
            <table className="w-full min-w-[500px] sm:min-w-[520px] text-left text-xs sm:text-sm whitespace-nowrap">
              <thead className="bg-orange-50 text-orange-900 border-b border-orange-100 uppercase text-[11px] sm:text-xs tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3 sm:px-5 sm:py-4 font-bold">Event</th>
                  <th className="px-4 py-3 sm:px-5 sm:py-4 font-bold">Target</th>
                  <th className="px-4 py-3 sm:px-5 sm:py-4 font-bold text-center">Status</th>
                  <th className="px-4 py-3 sm:px-5 sm:py-4 font-bold">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoadingActivity ? (
                  [1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="animate-pulse bg-gray-50/50">
                      <td className="px-4 py-2.5 sm:px-5 sm:py-3">
                        <div className="h-3.5 w-24 bg-slate-200/70 rounded"></div>
                      </td>
                      <td className="px-4 py-2.5 sm:px-5 sm:py-3">
                        <div className="h-3.5 w-48 bg-slate-200/80 rounded"></div>
                      </td>
                      <td className="px-4 py-2.5 sm:px-5 sm:py-3 text-center">
                        <div className="h-4 w-16 bg-slate-200/80 rounded-full mx-auto"></div>
                      </td>
                      <td className="px-4 py-2.5 sm:px-5 sm:py-3">
                        <div className="h-3.5 w-28 bg-slate-200/70 rounded"></div>
                      </td>
                    </tr>
                  ))
                ) : recentBhajans.length > 0 ? (
                  recentBhajans.map((activity: any) => (
                    <tr key={activity.id} className="bg-gray-50/50 hover:bg-blue-100/60 transition-colors">
                      <td className="px-4 py-2.5 sm:px-5 sm:py-3">Bhajan Created</td>
                      <td className="px-4 py-2.5 sm:px-5 sm:py-3 font-medium text-gray-900">{activity.title}</td>
                      <td className="px-4 py-2.5 sm:px-5 sm:py-3 text-center">
                        <span
                          className={`inline-flex items-center justify-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${
                            activity.status === 'PUBLISHED'
                              ? 'bg-green-600 text-white'
                              : activity.status === 'DRAFT'
                                ? 'bg-amber-600 text-white'
                                : 'bg-gray-500 text-white'
                          }`}
                        >
                          {activity.status === 'PUBLISHED' ? (
                            <CheckCircle2 className="w-2.5 h-2.5" />
                          ) : (
                            <XCircle className="w-2.5 h-2.5" strokeWidth={2.5} />
                          )}
                          {activity.status === 'PUBLISHED' ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 sm:px-5 sm:py-3 text-slate-800 font-medium">
                        {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(
                          new Date(activity.created_at)
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-5 sm:px-5 sm:py-6 text-center text-gray-500 text-xs sm:text-sm">
                      No recent activity found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* YouTube Sync Status Module */}
        <div className="bg-gradient-to-br from-red-50 to-white rounded-md border border-red-100 shadow-sm p-4 sm:p-5">
          <h3 className="font-semibold text-sm sm:text-base text-gray-900 mb-3 sm:mb-4">YouTube Automation</h3>

          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 text-xs sm:text-sm">Status</span>
              <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-green-600 bg-green-50 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500"></span> Active
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-500 text-xs sm:text-sm">Last Sync</span>
              <span className="text-xs sm:text-sm font-medium text-gray-900">
                {settings?.youtubeLastSync
                  ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(
                      new Date(settings.youtubeLastSync)
                    )
                  : 'Never'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-500 text-xs sm:text-sm">Auto Sync</span>
              <span className="text-xs sm:text-sm font-medium text-gray-900">
                {settings?.youtubeSyncInterval || '12h'} Interval
              </span>
            </div>

            <hr className="border-gray-100" />

            <button
              onClick={() => navigate(getAdminPath('/youtube'))}
              className="w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 py-2 sm:py-2.5 rounded-md text-xs sm:text-sm font-medium transition-colors border border-gray-200 cursor-pointer"
            >
              <PlaySquare className="w-4 h-4 text-red-500" />
              Manage Synchronization
            </button>
          </div>
        </div>
      </div>

      {/* Devotional Support & Donations Widget */}
      <div className="bg-gradient-to-br from-amber-50/60 via-orange-50/30 to-white rounded-md border border-amber-200/70 shadow-sm p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3.5 border-b border-amber-100/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-[#ff3b00] text-white flex items-center justify-center shadow-xs">
              <HeartHandshake className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-gray-900 flex items-center gap-2">
                Devotional Support & Donations
              </h3>
              <p className="text-xs text-gray-500">Voluntary community contributions & offerings</p>
            </div>
          </div>
          <button
            onClick={() => navigate(getAdminPath('/donations'))}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#ff3b00] hover:text-[#d9480f] bg-white hover:bg-orange-50/60 border border-orange-200 px-3 py-1.5 rounded-md transition-all shadow-2xs self-start sm:self-auto cursor-pointer"
          >
            <span>View Donations</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
          <div className="bg-white/90 p-3 rounded-md border border-amber-100 shadow-2xs">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Collected</p>
            <p className="text-lg font-black text-slate-900 mt-0.5">
              {isLoadingDonationsOverview ? (
                <span className="inline-block h-5 w-20 bg-slate-200 rounded animate-pulse"></span>
              ) : (
                `₹${new Intl.NumberFormat('en-IN').format(donationsOverview?.metrics?.totalCollected || 0)}`
              )}
            </p>
          </div>
          <div className="bg-white/90 p-3 rounded-md border border-amber-100 shadow-2xs">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">This Month</p>
            <p className="text-lg font-black text-emerald-600 mt-0.5">
              {isLoadingDonationsOverview ? (
                <span className="inline-block h-5 w-20 bg-slate-200 rounded animate-pulse"></span>
              ) : (
                `₹${new Intl.NumberFormat('en-IN').format(donationsOverview?.metrics?.thisMonth || 0)}`
              )}
            </p>
          </div>
          <div className="bg-white/90 p-3 rounded-md border border-amber-100 shadow-2xs">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Successful Payments</p>
            <p className="text-lg font-black text-slate-900 mt-0.5">
              {isLoadingDonationsOverview ? (
                <span className="inline-block h-5 w-16 bg-slate-200 rounded animate-pulse"></span>
              ) : (
                new Intl.NumberFormat('en-IN').format(donationsOverview?.metrics?.successfulPayments || 0)
              )}
            </p>
          </div>
        </div>

        {/* Recent Contributions */}
        <div>
          <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Recent Contributions</p>
          {isLoadingRecentDonations ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2.5 bg-white rounded-md border border-gray-100 shadow-2xs animate-pulse"
                >
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-24 bg-slate-200/70 rounded"></div>
                    <div className="h-3 w-16 bg-slate-100 rounded"></div>
                  </div>
                  <div className="h-5 w-12 bg-emerald-100/60 rounded"></div>
                </div>
              ))}
            </div>
          ) : recentDonations?.data && recentDonations.data.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {recentDonations.data.map((payment: PaymentItem) => (
                <div
                  key={payment.id}
                  onClick={() => navigate(getAdminPath('/donations?tab=payments'))}
                  className="flex items-center justify-between p-2.5 bg-white rounded-md border border-gray-100 hover:border-orange-200 transition-all cursor-pointer shadow-2xs"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-semibold text-gray-900 truncate">
                      {payment.isAnonymous ? 'Anonymous Supporter' : payment.supporterName || 'Supporter'}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {payment.paidAt
                        ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'short' }).format(new Date(payment.paidAt))
                        : 'Recent'}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 shrink-0">
                    ₹{payment.amount}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 bg-white/70 rounded-md border border-dashed border-gray-200 text-xs text-gray-400">
              No recent contributions recorded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
