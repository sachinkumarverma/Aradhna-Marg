import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, CheckCircle2, XCircle, RefreshCw, Server, Database, Cloud, PlaySquare, Bot, Clock } from 'lucide-react';
import { apiClient } from '../../api/client';
import { format } from 'date-fns';

export const AdminSystemHealth: React.FC = () => {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['system-health'],
    queryFn: async () => {
      const res = await apiClient.get('/v1/health');
      return res.data.data;
    },
    refetchInterval: 30000 // auto refresh every 30s
  });

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'OK') return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    return <XCircle className="w-5 h-5 text-red-500" />;
  };

  const ServiceCard = ({ title, icon: Icon, status }: { title: string, icon: any, status?: string }) => (
    <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gray-50 rounded-lg">
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
    <div className="space-y-6 flex flex-col h-full max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-6 h-6 text-saffron" />
            System Health
          </h1>
          <p className="text-sm text-gray-500 mt-1">Read-only monitoring of all core services and application status.</p>
        </div>
        <button 
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 px-4 py-2 bg-saffron text-white rounded-lg hover:bg-saffron/90 transition-colors font-medium shadow-sm disabled:opacity-40"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {isError && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-red-700 text-sm font-medium">
          Failed to fetch system health data. Please check your connection to the API server.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ServiceCard title="API Server" icon={Server} status={isLoading ? undefined : data?.api_status} />
        <ServiceCard title="Supabase DB" icon={Database} status={isLoading ? undefined : data?.database_status} />
        <ServiceCard title="Supabase Storage" icon={Cloud} status={isLoading ? undefined : data?.storage_status} />
        <ServiceCard title="YouTube API" icon={PlaySquare} status={isLoading ? undefined : data?.youtube_api_status} />
        <ServiceCard title="Groq AI" icon={Bot} status={isLoading ? undefined : data?.groq_ai_status} />
        <ServiceCard title="Cron Jobs" icon={Clock} status={isLoading ? undefined : data?.cron_jobs_status} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        
        {/* Last Checked */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Last Checked</h3>
          {data ? (
            <div>
              <p className="text-xl font-bold text-gray-900">{format(new Date(data.server_time), 'dd MMM yyyy')}</p>
              <p className="text-gray-500">{format(new Date(data.server_time), 'h:mm:ss a')}</p>
            </div>
          ) : (
            <div className="h-14 flex items-center text-gray-400">Loading...</div>
          )}
        </div>

        {/* Environment */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Environment</h3>
          {data ? (
            <div>
              <p className="text-xl font-bold text-gray-900">{data.environment}</p>
              <div className="mt-1 space-y-0.5">
                <p className="text-sm text-gray-500">Uptime: {Math.floor(data.uptime_seconds / 3600)}h {Math.floor((data.uptime_seconds % 3600) / 60)}m</p>
                <p className="text-sm text-gray-500">Started: {format(new Date(new Date(data.server_time).getTime() - (data.uptime_seconds * 1000)), 'dd MMM, h:mm:ss a')}</p>
              </div>
            </div>
          ) : (
            <div className="h-14 flex items-center text-gray-400">Loading...</div>
          )}
        </div>

        {/* Version Info */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Version Information</h3>
          {data ? (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Frontend</span>
                <span className="font-bold text-gray-900">{data.version?.frontend}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Backend</span>
                <span className="font-bold text-gray-900">{data.version?.backend}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Database</span>
                <span className="font-bold text-gray-900">{data.version?.database}</span>
              </div>
            </div>
          ) : (
            <div className="h-14 flex items-center text-gray-400">Loading...</div>
          )}
        </div>

      </div>

    </div>
  );
};
