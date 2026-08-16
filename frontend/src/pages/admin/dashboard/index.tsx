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
  XCircle
} from 'lucide-react';
import { StatCard } from '@components/admin/StatCard';
import { apiClient } from '@api/client';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  // Mocking the API fetch for UI Foundation
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      const res = await apiClient.get('/v1/admin/dashboard/stats');
      return res.data.data;
    }
  });

  const { data: activityData } = useQuery({
    queryKey: ['admin-dashboard-activity'],
    queryFn: async () => {
      const res = await apiClient.get('/v1/admin/dashboard/activity');
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

  if (isLoading) {
    return (
      <div className="space-y-6 flex flex-col min-h-full">
        <div>
          <h1 className="text-2xl font-bold tracking-wide text-slate-900 flex items-center gap-2 uppercase">
            <LayoutDashboard className="w-6 h-6 text-saffron" />
            DASHBOARD
          </h1>
          <p className="text-sm text-gray-500 mt-1">Platform overview and automation status</p>
        </div>
        <div className="space-y-6 animate-pulse flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-md border border-gray-100 shadow-sm h-32"
              ></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <div className="lg:col-span-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md border border-blue-100 h-64"></div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md border border-blue-100 h-64"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-wide text-slate-900 flex items-center gap-2 uppercase">
          <LayoutDashboard className="w-6 h-6 text-saffron" />
          DASHBOARD
        </h1>
        <p className="text-sm text-gray-500 mt-1">Platform overview and automation status</p>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Views (Today)"
          value={new Intl.NumberFormat('en-IN').format(stats?.todayViews || 0)}
          icon={Activity}
          trend={{ value: 12, isPositive: true }}
          colorClassName="bg-blue-100 text-blue-600"
          bgClassName="bg-gradient-to-br from-blue-50 to-white"
          borderClassName="border-blue-100"
        />
        <StatCard
          title="Published Bhajans"
          value={new Intl.NumberFormat('en-IN').format(stats?.published || 0)}
          icon={Music2}
          colorClassName="bg-saffron/20 text-saffron"
          bgClassName="bg-gradient-to-br from-orange-50 to-white"
          borderClassName="border-orange-100"
        />
        <StatCard
          title="Draft Bhajans"
          value={new Intl.NumberFormat('en-IN').format(stats?.draft || 0)}
          icon={FileText}
          colorClassName="bg-yellow-100 text-yellow-600"
          bgClassName="bg-gradient-to-br from-amber-50 to-white"
          borderClassName="border-amber-100"
        />
        <StatCard
          title="Pending AI Processing"
          value={stats?.pendingAi || 0}
          icon={BrainCircuit}
          colorClassName="bg-purple-100 text-purple-600"
          bgClassName="bg-gradient-to-br from-purple-50 to-white"
          borderClassName="border-purple-100"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Table Mock */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-50 to-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Recently Added Bhajans</h3>
          </div>
          <div className="p-0">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-orange-50 text-orange-900 border-b border-orange-100 uppercase text-xs tracking-wider font-semibold">
                <tr>
                  <th className="px-5 py-4 font-bold">Event</th>
                  <th className="px-5 py-4 font-bold">Target</th>
                  <th className="px-5 py-4 font-bold text-center">Status</th>
                  <th className="px-5 py-4 font-bold">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {activityData?.length > 0 ? (
                  activityData.map((activity: any) => (
                    <tr key={activity.id}>
                      <td className="px-5 py-3">Bhajan Created</td>
                      <td className="px-5 py-3 font-medium text-gray-900">{activity.title}</td>
                      <td className="px-5 py-3 text-center">
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
                      <td className="px-5 py-3 text-slate-800 font-medium">
                        {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(
                          new Date(activity.created_at)
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-5 py-6 text-center text-gray-500">
                      No recent activity found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* YouTube Sync Status Module */}
        <div className="bg-gradient-to-br from-red-50 to-white rounded-md border border-red-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-4">YouTube Automation</h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 text-sm">Status</span>
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-green-500"></span> Active
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-500 text-sm">Last Sync</span>
              <span className="text-sm font-medium text-gray-900">
                {settings?.youtubeLastSync
                  ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(
                      new Date(settings.youtubeLastSync)
                    )
                  : 'Never'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-500 text-sm">Auto Sync</span>
              <span className="text-sm font-medium text-gray-900">
                {settings?.youtubeSyncInterval || '12h'} Interval
              </span>
            </div>

            <hr className="border-gray-100" />

            <button
              onClick={() => navigate('/admin/youtube')}
              className="w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 py-2.5 rounded-md text-sm font-medium transition-colors border border-gray-200"
            >
              <PlaySquare className="w-4 h-4 text-red-500" />
              Manage Synchronization
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
