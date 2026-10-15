import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ConfirmDialog } from '@components/ui/ConfirmDialog';
import { apiClient } from '@api/client';
import toast from 'react-hot-toast';
import { Bot, CheckCircle2, Clock, RotateCcw, Trash2, AlertCircle, XCircle, RefreshCw } from 'lucide-react';
import { CustomLoader } from '@components/common/CustomLoader';
import { AdminButton } from '@admin/components/AdminButton';

export const AdminAIJobs: React.FC = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'ALL' | 'QUEUE' | 'COMPLETED' | 'FAILED'>('ALL');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    setIsManualRefreshing(true);
    try {
      await Promise.all([refetch(), queryClient.invalidateQueries({ queryKey: ['admin-ai-stats'] })]);
    } finally {
      setIsManualRefreshing(false);
    }
  };

  // Fetch Stats
  const { data: stats } = useQuery({
    queryKey: ['admin-ai-stats'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/ai/stats');
      return res.data?.data || { today: 0, completed: 0, failed: 0, pending: 0 };
    },
    refetchInterval: 10000
  });

  // Fetch Jobs based on active filter
  const {
    data: jobsData,
    isLoading: jobsLoading,
    isFetching,
    refetch
  } = useQuery({
    queryKey: ['admin-ai-jobs-activity', filter],
    queryFn: async () => {
      let status = '';
      if (filter === 'QUEUE') status = 'PENDING,PROCESSING';
      if (filter === 'COMPLETED') status = 'COMPLETED';
      if (filter === 'FAILED') status = 'FAILED';

      const res = await apiClient.get('/admin/ai/jobs', {
        params: { status: status || undefined, limit: 50 }
      });
      return res.data?.data || { data: [], count: 0 };
    },
    refetchInterval: filter === 'QUEUE' ? 5000 : 15000
  });

  const jobs = jobsData?.data || [];

  // Mutations
  const retryMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.post(`/admin/ai/jobs/${id}/retry`);
    },
    onSuccess: () => {
      toast.success('Job queued for retry');
      queryClient.invalidateQueries({ queryKey: ['admin-ai-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-ai-jobs-activity'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to retry job');
    }
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.post(`/admin/ai/jobs/${id}/cancel`);
    },
    onSuccess: () => {
      toast.success('Job cancelled');
      queryClient.invalidateQueries({ queryKey: ['admin-ai-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-ai-jobs-activity'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to cancel job');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/admin/ai/jobs/${id}`);
    },
    onSuccess: () => {
      toast.success('Job log deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-ai-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-ai-jobs-activity'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete job log');
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-green-100 text-green-800">
            Completed
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-red-100 text-red-800">
            Failed
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-blue-100 text-blue-800 animate-pulse">
            Processing
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-gray-100 text-gray-800">
            Pending
          </span>
        );
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6 flex flex-col flex-1 pb-8 w-full max-w-full min-w-0">
      {/* Header & Stats Overview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-2xl font-bold tracking-wide text-slate-900 flex items-center gap-2 uppercase truncate">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-saffron shrink-0" />
              <span className="truncate">AI JOBS & ACTIVITY</span>
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Unified operational monitor for background AI processing jobs, queue status, and worker logs.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <AdminButton
              onClick={handleManualRefresh}
              variant="outline"
              title="Refresh"
              aria-label="Refresh"
              disabled={isManualRefreshing}
              className="h-8 w-8 sm:h-9 sm:w-9 p-0 flex items-center justify-center shrink-0 bg-white hover:bg-slate-50 border-gray-200 text-slate-700"
            >
              <RefreshCw
                className={`w-4 h-4 shrink-0 stroke-[2.2] ${isManualRefreshing ? 'animate-spin text-saffron' : 'text-slate-600'}`}
              />
            </AdminButton>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-white p-3.5 sm:p-5 rounded-md shadow-xs border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-500">Today's Jobs</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-0.5 sm:mt-1">{stats?.today || 0}</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-white p-3.5 sm:p-5 rounded-md shadow-xs border border-orange-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-500">Queue / In Progress</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-0.5 sm:mt-1">
                  {(stats?.pending || 0) + (stats?.processing || 0)}
                </p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-white p-3.5 sm:p-5 rounded-md shadow-xs border border-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-500">Completed Jobs</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-0.5 sm:mt-1">{stats?.completed || 0}</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-white p-3.5 sm:p-5 rounded-md shadow-xs border border-red-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-500">Failed Jobs</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-0.5 sm:mt-1">{stats?.failed || 0}</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs Toolbar */}
      <div className="flex border-b border-gray-200 overflow-x-auto scrollbar-hide gap-1 sm:gap-2">
        {[
          { id: 'ALL', label: 'All Jobs' },
          { id: 'QUEUE', label: 'Queue / In Progress' },
          { id: 'COMPLETED', label: 'Completed' },
          { id: 'FAILED', label: 'Failed' }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id as any)}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold uppercase border-b-2 transition-colors shrink-0 ${
              filter === tab.id
                ? 'border-saffron text-saffron'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Jobs Table Container */}
      <div className="bg-white rounded-md border border-gray-200 shadow-xs overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          {jobsLoading ? (
            <div className="flex items-center justify-center h-64">
              <CustomLoader fullScreen={false} size="md" text="Loading AI jobs..." />
            </div>
          ) : jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <Bot className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm font-medium">No jobs found in this view.</p>
              <p className="text-xs text-gray-400 mt-1">
                Jobs will appear here when you run single or bulk operations.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-orange-50 text-orange-900 border-b border-orange-100 uppercase text-xs tracking-wider sticky top-0 font-semibold">
                <tr>
                  <th className="px-6 py-4 font-bold">Job Name</th>
                  <th className="px-6 py-4 font-bold">Content Type</th>
                  <th className="px-6 py-4 font-bold">Progress / Processed</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                  <th className="px-6 py-4 font-bold">Started / Completed</th>
                  <th className="px-6 py-4 font-bold">Details</th>
                  <th className="px-6 py-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {jobs.map((job: any) => (
                  <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-900">{job.job_name}</td>
                    <td className="px-6 py-4 text-gray-600 font-medium">{job.content_type}</td>

                    <td className="px-6 py-4">
                      {job.status === 'PROCESSING' ? (
                        <div className="flex items-center gap-2 max-w-[150px]">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500 bg-blue-500"
                              style={{ width: `${job.progress}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono text-gray-600 w-8">{job.progress}%</span>
                        </div>
                      ) : (
                        <span className="text-xs font-mono text-gray-600">
                          {job.processed_items ?? 0} / {job.total_items ?? 1} items
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4">{getStatusBadge(job.status)}</td>

                    <td className="px-6 py-4 text-xs text-gray-500">
                      {job.completed_at ? formatDate(job.completed_at) : formatDate(job.started_at)}
                    </td>

                    <td className="px-6 py-4 text-xs">
                      {job.error_message ? (
                        <span className="text-red-500 max-w-[200px] truncate block" title={job.error_message}>
                          {job.error_message}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right space-x-2">
                      {['PENDING', 'PROCESSING'].includes(job.status) && (
                        <button
                          onClick={() => cancelMutation.mutate(job.id)}
                          disabled={cancelMutation.isPending}
                          className="p-1.5 text-orange-500 hover:text-orange-600 transition-colors cursor-pointer"
                          title="Cancel Job"
                        >
                          <XCircle className="w-4 h-4" strokeWidth={2.5} />
                        </button>
                      )}
                      {job.status === 'FAILED' && (
                        <button
                          onClick={() => retryMutation.mutate(job.id)}
                          disabled={retryMutation.isPending}
                          className="p-1.5 text-blue-500 hover:text-blue-600 transition-colors cursor-pointer"
                          title="Retry Job"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                      {['COMPLETED', 'FAILED'].includes(job.status) && (
                        <button
                          onClick={() => setDeleteConfirmId(job.id)}
                          disabled={deleteMutation.isPending}
                          className="p-1.5 text-red-500 hover:text-red-600 transition-colors cursor-pointer"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" strokeWidth={2.5} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!deleteConfirmId}
        title="Delete Job Log"
        message="Are you sure you want to delete this AI job log? This action cannot be undone."
        confirmText="Delete"
        isDestructive={true}
        onCancel={() => setDeleteConfirmId(null)}
        onConfirm={() => {
          if (deleteConfirmId) {
            deleteMutation.mutate(deleteConfirmId);
            setDeleteConfirmId(null);
          }
        }}
      />
    </div>
  );
};
