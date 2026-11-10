import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Server,
  Database,
  Cloud,
  PlaySquare,
  Bot,
  Clock
} from 'lucide-react';
import { apiClient } from '@api/client';
import { format } from 'date-fns';

export const AdminSystemHealth: React.FC = () => {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['system-health'],
    queryFn: async () => {
      const headers = { 'Cache-Control': 'no-cache, no-store' };
      try {
        const res = await apiClient.get('/internal/health', { headers });
        return res.data?.data || res.data;
      } catch {
        const fallbackRes = await apiClient.get('/v1/health', { headers });
        return fallbackRes.data?.data || fallbackRes.data;
      }
    },
    refetchInterval: 30000 // auto refresh every 30s
  });

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'OK') return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    return <XCircle className="w-5 h-5 text-red-500" />;
  };

  const ServiceCard = ({
    title,
    icon: Icon,
    status,
    bgClassName = 'bg-gradient-to-br from-blue-50 to-white',
    borderClassName = 'border-blue-100'
  }: {
    title: string;
    icon: any;
    status?: string;
    bgClassName?: string;
    borderClassName?: string;
  }) => (
    <div
      className={`${bgClassName} p-5 rounded-md border ${borderClassName} shadow-sm flex items-center justify-between`}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gray-50 rounded-md">
          <Icon className="w-5 h-5 text-gray-600" />
        </div>
        <span className="font-semibold text-gray-800">{title}</span>
      </div>
      {status ? (
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold ${status === 'OK' ? 'text-green-600' : 'text-red-600'}`}>{status}</span>
          <StatusIcon status={status} />
        </div>
      ) : (
        <div className="w-5 h-5 rounded-full border-2 border-gray-200 border-t-gray-400 animate-spin" />
      )}
    </div>
  );

  return (
    <div className="space-y-6 flex flex-col flex-1 pb-8">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-2xl font-bold tracking-wide text-slate-900 flex items-center gap-2 uppercase truncate">
            <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-saffron shrink-0" />
            <span className="truncate">SYSTEM HEALTH</span>
          </h1>
          <p className="hidden sm:block text-sm text-gray-500 mt-1">
            Read-only monitoring of all core services and application status.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          title="Refresh"
          aria-label="Refresh"
          className="flex items-center justify-center h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3.5 bg-saffron text-white rounded-md hover:bg-saffron/90 transition-colors font-medium shadow-sm disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          <RefreshCw className={`w-4 h-4 shrink-0 ${isFetching ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline ml-1.5 text-sm font-semibold">Refresh</span>
        </button>
      </div>

      {isError && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-md text-red-700 text-sm font-medium">
          Failed to fetch system health data. Please check your connection to the API server.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ServiceCard
          title="API Server"
          icon={Server}
          status={isLoading ? undefined : data?.api_status}
          bgClassName="bg-gradient-to-br from-blue-50 to-white"
          borderClassName="border-blue-100"
        />
        <ServiceCard
          title="Supabase DB"
          icon={Database}
          status={isLoading ? undefined : data?.database_status}
          bgClassName="bg-gradient-to-br from-green-50 to-white"
          borderClassName="border-green-100"
        />
        <ServiceCard
          title="Supabase Storage"
          icon={Cloud}
          status={isLoading ? undefined : data?.storage_status}
          bgClassName="bg-gradient-to-br from-orange-50 to-white"
          borderClassName="border-orange-100"
        />
        <ServiceCard
          title="YouTube API"
          icon={PlaySquare}
          status={isLoading ? undefined : data?.youtube_api_status}
          bgClassName="bg-gradient-to-br from-red-50 to-white"
          borderClassName="border-red-100"
        />
        <ServiceCard
          title="Groq AI"
          icon={Bot}
          status={isLoading ? undefined : data?.groq_ai_status}
          bgClassName="bg-gradient-to-br from-purple-50 to-white"
          borderClassName="border-purple-100"
        />
        <ServiceCard
          title="Cron Jobs"
          icon={Clock}
          status={isLoading ? undefined : data?.cron_jobs_status}
          bgClassName="bg-gradient-to-br from-amber-50 to-white"
          borderClassName="border-amber-100"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        {/* Last Health Check */}
        <div className="bg-gradient-to-br from-green-50 to-white p-5 sm:p-6 rounded-md border border-green-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Last Health Check</h3>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Live
              </span>
            </div>
            {data ? (
              <div>
                <p className="text-xl font-bold tracking-wide text-slate-900 uppercase">
                  {format(new Date(data.server_time), 'dd MMM yyyy')}
                </p>
                <p className="text-sm font-semibold text-gray-600 mt-0.5">
                  {format(new Date(data.server_time), 'h:mm:ss a')}
                </p>
              </div>
            ) : (
              <div className="h-14 flex items-center text-gray-400">Loading...</div>
            )}
          </div>
          <p className="text-[11px] text-gray-400 mt-3 pt-2 border-t border-green-100/60">Auto-refreshed every 30s</p>
        </div>

        {/* Environment */}
        <div className="bg-gradient-to-br from-amber-50 to-white p-5 sm:p-6 rounded-md border border-amber-100 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Environment</h3>
            {data ? (
              <div>
                <p className="text-xl font-bold tracking-wide text-slate-900 uppercase">{data.environment}</p>
                <div className="mt-1 space-y-0.5">
                  <p className="text-sm text-gray-600 font-medium">
                    Uptime:{' '}
                    <span className="font-bold text-slate-800">
                      {Math.floor(data.uptime_seconds / 3600)}h {Math.floor((data.uptime_seconds % 3600) / 60)}m
                    </span>
                  </p>
                  <p className="text-xs text-gray-500">
                    Started:{' '}
                    {format(
                      new Date(new Date(data.server_time).getTime() - data.uptime_seconds * 1000),
                      'dd MMM, h:mm:ss a'
                    )}
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-14 flex items-center text-gray-400">Loading...</div>
            )}
          </div>
          <p className="text-[11px] text-gray-400 mt-3 pt-2 border-t border-amber-100/60">Node.js process status</p>
        </div>

        {/* Version Info */}
        <div className="bg-gradient-to-br from-gray-50 to-white p-5 sm:p-6 rounded-md border border-gray-200 shadow-sm min-w-0 overflow-hidden flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Version Information</h3>
            {data ? (
              <div className="space-y-2 min-w-0">
                <div className="flex items-center justify-between text-sm gap-2">
                  <span className="text-gray-500 shrink-0">Frontend</span>
                  <span className="font-bold text-gray-900 font-mono text-xs">{data.version?.frontend || '1.0.0'}</span>
                </div>
                <div className="flex items-center justify-between text-sm gap-2">
                  <span className="text-gray-500 shrink-0">Backend</span>
                  <span className="font-bold text-gray-900 font-mono text-xs">{data.version?.backend || '1.0.0'}</span>
                </div>
                <div className="flex items-center justify-between text-sm gap-2 min-w-0">
                  <span className="text-gray-500 shrink-0">Database</span>
                  <span
                    className="font-bold text-gray-900 font-mono text-xs truncate max-w-[140px] sm:max-w-[180px] text-right block"
                    title={data.version?.database}
                  >
                    {data.version?.database}
                  </span>
                </div>
              </div>
            ) : (
              <div className="h-14 flex items-center text-gray-400">Loading...</div>
            )}
          </div>
          <p className="text-[11px] text-gray-400 mt-3 pt-2 border-t border-gray-100">Latest active migration</p>
        </div>
      </div>
    </div>
  );
};
