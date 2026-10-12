import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Select } from '@components/ui/Select';
import { Pagination } from '@components/ui/Pagination';
import {
  Play,
  RefreshCw,
  X,
  XCircle,
  AlertTriangle,
  Clock,
  ExternalLink,
  ChevronRight,
  Shield,
  Activity,
  Layers,
  Wrench,
  FileText,
  Calendar,
  Sparkles
} from 'lucide-react';
import {
  AgentApi,
  type AgentRunItem,
  type AgentToolCallItem,
  type AgentDefinitionItem,
  type AgentScheduleItem
} from './AgentApi';
import { AdminButton } from '@admin/components/AdminButton';
import { CustomLoader } from '@components/common/CustomLoader';
import toast from 'react-hot-toast';

const formatStandardCase = (str?: string): string => {
  if (!str) return '';
  return str
    .replace(/[_-]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map((word) => {
      const lower = word.toLowerCase();
      if (lower === 'seo') return 'SEO';
      if (lower === 'ai') return 'AI';
      if (lower === 'id') return 'ID';
      if (lower === 'tier') return 'Tier';
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
};

const getShortAgentDescription = (agentId: string, desc?: string): string => {
  const shortMap: Record<string, string> = {
    content_quality_agent: 'Inspects editorial content for readability, grammar, and completeness.',
    seo_audit_agent: 'Audits website content for missing metadata and SEO issues.',
    system_health_agent: 'Monitors database health, AI queues, and system runtime.'
  };
  return shortMap[agentId] || desc || '';
};

const scheduleIntervalOptions = [
  { value: 'hourly', label: 'Hourly' },
  { value: 'every_6_hours', label: 'Every 6 Hours' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' }
];

export const AgentRunsSection: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [agentFilter, setAgentFilter] = useState<string>('ALL');
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);

  // Fetch registered agent definitions
  const { data: definitions = [] } = useQuery({
    queryKey: ['agent-definitions'],
    queryFn: () => AgentApi.getDefinitions()
  });

  // Fetch scheduled agents (Phase 5B)
  const {
    data: schedules = [],
    isLoading: isLoadingSchedules,
    refetch: refetchSchedules
  } = useQuery({
    queryKey: ['agent-schedules'],
    queryFn: () => AgentApi.getSchedules(),
    refetchInterval: 10000 // auto-refresh schedules
  });

  // Update schedule mutation
  const updateScheduleMutation = useMutation({
    mutationFn: ({
      id,
      payload
    }: {
      id: string;
      payload: { enabled?: boolean; scheduleInterval?: 'hourly' | 'every_6_hours' | 'daily' | 'weekly' };
    }) => AgentApi.updateSchedule(id, payload),
    onSuccess: (_, vars) => {
      toast.success(`Schedule for '${formatStandardCase(vars.id)}' updated`);
      queryClient.invalidateQueries({ queryKey: ['agent-schedules'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update schedule');
    }
  });

  // Run scheduled agent manually mutation
  const runScheduledAgentMutation = useMutation({
    mutationFn: (id: string) => AgentApi.runScheduledAgent(id),
    onSuccess: (data, agentId) => {
      toast.success(`Scheduled agent '${formatStandardCase(agentId)}' executed successfully!`);
      queryClient.invalidateQueries({ queryKey: ['agent-runs'] });
      queryClient.invalidateQueries({ queryKey: ['agent-schedules'] });
      if (data?.run?.id) {
        setSelectedRunId(data.run.id);
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Scheduled agent execution failed');
      queryClient.invalidateQueries({ queryKey: ['agent-runs'] });
      queryClient.invalidateQueries({ queryKey: ['agent-schedules'] });
    }
  });

  // Fetch runs list with pagination
  const {
    data: runsData,
    isLoading: isLoadingRuns,
    isFetching: isFetchingRuns,
    refetch: refetchRuns
  } = useQuery({
    queryKey: ['agent-runs', statusFilter, agentFilter, page, limit],
    queryFn: () =>
      AgentApi.getRuns({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        agentName: agentFilter === 'ALL' ? undefined : agentFilter,
        page,
        limit
      }),
    refetchInterval: 5000 // auto refresh runs
  });

  const runs = runsData?.data || [];
  const totalRecords = runsData?.count || 0;
  const totalPages = Math.ceil(totalRecords / limit);

  // Dynamic list of all available agents combining definitions, schedules, and active runs
  const agentFilterOptions = useMemo(() => {
    const map = new Map<string, string>();

    definitions.forEach((d) => {
      if (d.id) map.set(d.id, d.name || d.id);
    });

    schedules.forEach((s) => {
      if (s.agentId && !map.has(s.agentId)) {
        map.set(s.agentId, s.agentName || s.agentId);
      }
    });

    runs.forEach((r) => {
      if (r.agentName && !map.has(r.agentName)) {
        map.set(r.agentName, r.agentName);
      }
    });

    const defaultAgents = [
      { id: 'content_quality_agent', name: 'Content Quality Agent' },
      { id: 'seo_audit_agent', name: 'SEO Audit Agent' },
      { id: 'system_health_agent', name: 'System Health Agent' }
    ];
    defaultAgents.forEach((a) => {
      if (!map.has(a.id)) {
        map.set(a.id, a.name);
      }
    });

    return [
      { value: 'ALL', label: 'All Agents' },
      ...Array.from(map.entries()).map(([value, label]) => ({
        value,
        label: formatStandardCase(label)
      }))
    ];
  }, [definitions, schedules, runs]);

  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  const handleRefreshRuns = async () => {
    setIsManualRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['agent-runs'] }),
        queryClient.invalidateQueries({ queryKey: ['agent-schedules'] }),
        refetchRuns(),
        refetchSchedules()
      ]);
    } catch {
      // Silent refresh
    } finally {
      setIsManualRefreshing(false);
    }
  };

  // Fetch details for selected run
  const { data: selectedDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['agent-run-details', selectedRunId],
    queryFn: () => (selectedRunId ? AgentApi.getRunDetails(selectedRunId) : null),
    enabled: !!selectedRunId
  });

  // Run Agent Mutation
  const runAgentMutation = useMutation({
    mutationFn: (agentId: string) => AgentApi.runAgent(agentId),
    onSuccess: (data, agentId) => {
      toast.success(`Agent '${formatStandardCase(agentId)}' run completed!`);
      queryClient.invalidateQueries({ queryKey: ['agent-runs'] });
      if (data?.run?.id) {
        setSelectedRunId(data.run.id);
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Agent execution failed');
      queryClient.invalidateQueries({ queryKey: ['agent-runs'] });
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="inline-flex items-center text-xs font-semibold text-emerald-600">Completed</span>;
      case 'RUNNING':
        return (
          <span className="inline-flex items-center text-xs font-semibold text-blue-600 animate-pulse">Running</span>
        );
      case 'FAILED':
        return <span className="inline-flex items-center text-xs font-semibold text-red-600">Failed</span>;
      case 'SKIPPED':
        return <span className="inline-flex items-center text-xs font-semibold text-amber-600">Skipped</span>;
      case 'CANCELLED':
        return <span className="inline-flex items-center text-xs font-semibold text-gray-500">Cancelled</span>;
      case 'TIMEOUT':
        return <span className="inline-flex items-center text-xs font-semibold text-amber-600">Timeout</span>;
      default:
        return <span className="inline-flex items-center text-xs font-semibold text-gray-600">{status}</span>;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white">CRITICAL</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-600 text-white">HIGH</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white">MEDIUM</span>;
      case 'LOW':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500 text-white">LOW</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-500 text-white">{severity}</span>;
    }
  };

  const formatDuration = (run: AgentRunItem) => {
    if (run.state?.durationMs) {
      return `${Math.round(run.state.durationMs / 100) / 10}s`;
    }
    if (run.startedAt && run.completedAt) {
      const diffMs = new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime();
      return `${Math.round(diffMs / 100) / 10}s`;
    }
    return '-';
  };

  const formatTimestamp = (ts?: string | null) => {
    if (!ts) return '-';
    try {
      const date = new Date(ts);
      return date.toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '-';
    }
  };

  const formatIntervalLabel = (interval: string) => {
    switch (interval) {
      case 'hourly':
        return 'Hourly (1h)';
      case 'every_6_hours':
        return 'Every 6 Hours (6h)';
      case 'daily':
        return 'Daily (24h)';
      case 'weekly':
        return 'Weekly (7d)';
      default:
        return interval;
    }
  };

  return (
    <div className="space-y-6">
      {/* Detached Card 1: Scheduled Autonomous Monitoring */}
      <div className="bg-gradient-to-br from-indigo-50 to-white rounded-md border border-indigo-100 shadow-sm p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
              <Calendar className="w-4 h-4 text-saffron" />
              Scheduled Autonomous Monitoring
            </h3>
          </div>
          <AdminButton
            variant="outline"
            onClick={handleRefreshRuns}
            title="Refresh Status"
            aria-label="Refresh Status"
            disabled={isManualRefreshing || isFetchingRuns}
            className="self-start sm:self-auto h-8 w-8 sm:h-9 sm:w-9 p-0 flex items-center justify-center shrink-0 bg-white hover:bg-slate-50 border-gray-200 text-slate-700"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 stroke-[2.2] ${
                isManualRefreshing || isFetchingRuns ? 'animate-spin text-saffron' : 'text-slate-600'
              }`}
            />
          </AdminButton>
        </div>

        {isLoadingSchedules ? (
          <div className="py-8 flex justify-center">
            <CustomLoader text="Loading monitoring schedules..." />
          </div>
        ) : schedules.length === 0 ? (
          <div className="p-4 text-xs text-gray-500 text-center bg-slate-50 rounded-md">
            No monitoring schedules registered.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
            {schedules.map((sched) => {
              const isRunPending =
                runScheduledAgentMutation.isPending && runScheduledAgentMutation.variables === sched.agentId;
              const isUpdatePending =
                updateScheduleMutation.isPending && updateScheduleMutation.variables?.id === sched.agentId;

              return (
                <div
                  key={sched.id}
                  className="border border-indigo-100/80 bg-white/90 rounded-md p-4 sm:p-5 shadow-xs flex flex-col justify-between gap-3.5"
                >
                  <div className="space-y-3">
                    {/* Header: Name and Enabled Toggle */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm text-slate-900 block leading-snug">
                        {formatStandardCase(sched.agentName || sched.agentId)}
                      </span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={sched.enabled}
                        disabled={isUpdatePending}
                        onClick={() =>
                          updateScheduleMutation.mutate({
                            id: sched.agentId,
                            payload: { enabled: !sched.enabled }
                          })
                        }
                        className="flex items-center gap-2 cursor-pointer group focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                        title={sched.enabled ? 'Click to disable schedule' : 'Click to enable schedule'}
                      >
                        <span
                          className={`text-xs font-semibold transition-colors ${
                            sched.enabled ? 'text-emerald-600' : 'text-slate-400'
                          }`}
                        >
                          {isUpdatePending ? '...' : sched.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                        <span
                          className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                            sched.enabled ? 'bg-emerald-500' : 'bg-slate-300 group-hover:bg-slate-400'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                              sched.enabled ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </span>
                      </button>
                    </div>

                    {getShortAgentDescription(sched.agentId, sched.description) && (
                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                        {getShortAgentDescription(sched.agentId, sched.description)}
                      </p>
                    )}

                    {/* Schedule Selector & Status Grid */}
                    <div className="bg-slate-50/80 border border-slate-200/80 rounded-md p-3 space-y-2.5 text-[11px]">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-gray-500 font-semibold uppercase text-[10px] shrink-0">Schedule:</span>
                        <div className="w-36">
                          <Select
                            options={scheduleIntervalOptions}
                            value={sched.scheduleInterval}
                            disabled={isUpdatePending}
                            onChange={(val) =>
                              updateScheduleMutation.mutate({
                                id: sched.agentId,
                                payload: {
                                  scheduleInterval: val as 'hourly' | 'every_6_hours' | 'daily' | 'weekly'
                                }
                              })
                            }
                            searchable={false}
                            triggerClassName="h-7 sm:h-7.5 text-[11px] px-2.5 py-0 font-medium bg-white border-gray-200"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-gray-600 pt-0.5">
                        <span className="text-gray-500">Last Run:</span>
                        <span className="font-medium text-slate-900">{formatTimestamp(sched.lastRunAt)}</span>
                      </div>

                      <div className="flex items-center justify-between text-gray-600">
                        <span className="text-gray-500">Last Status:</span>
                        <div>
                          {sched.lastRunStatus ? (
                            getStatusBadge(sched.lastRunStatus)
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-gray-600">
                        <span className="text-gray-500">Next Run:</span>
                        <span className="font-medium text-slate-900">{formatTimestamp(sched.nextRunAt)}</span>
                      </div>

                      {sched.consecutiveFailures > 0 && (
                        <div className="text-rose-600 flex items-center gap-1.5 font-semibold text-[10px]">
                          <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                          <span>{sched.consecutiveFailures} consecutive failure(s)</span>
                        </div>
                      )}

                      {sched.isRunning && (
                        <div className="text-blue-600 flex items-center gap-1.5 font-semibold text-[10px] animate-pulse">
                          <Clock className="w-3 h-3 text-blue-600 shrink-0" />
                          <span>Currently executing...</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Footer: Run Now */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-[11px]">
                    <span className="text-gray-400 font-medium text-xs">
                      {formatIntervalLabel(sched.scheduleInterval)}
                    </span>
                    <AdminButton
                      onClick={() => runScheduledAgentMutation.mutate(sched.agentId)}
                      disabled={isRunPending || sched.isRunning}
                      variant="primary"
                      leftIcon={
                        <Play
                          className={`w-3.5 h-3.5 shrink-0 ${isRunPending || sched.isRunning ? 'animate-spin' : ''}`}
                        />
                      }
                      className="h-8 px-3.5 text-xs font-semibold gap-1.5"
                    >
                      {isRunPending || sched.isRunning ? 'Executing...' : 'Run Now'}
                    </AdminButton>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detached Section 2: Agent Runs Table & Toolbar */}
      <div className="space-y-4">
        {/* Table Filter Toolbar */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-md shadow-sm border border-blue-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 uppercase">Status:</span>
            {['ALL', 'COMPLETED', 'RUNNING', 'FAILED', 'TIMEOUT'].map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setPage(1);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer transition-colors ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold text-gray-500 uppercase">Agent:</span>
            <div className="w-44 sm:w-52">
              <Select
                value={agentFilter}
                onChange={(val) => {
                  setAgentFilter(val);
                  setPage(1);
                }}
                options={agentFilterOptions}
                searchable={false}
                triggerClassName="h-9 sm:h-10 text-xs sm:text-sm font-medium bg-white border-gray-200"
              />
            </div>
            <AdminButton
              variant="outline"
              onClick={handleRefreshRuns}
              title="Refresh"
              aria-label="Refresh"
              disabled={isManualRefreshing || isFetchingRuns}
              className="h-9 w-9 sm:h-10 sm:w-10 p-0 flex items-center justify-center shrink-0 bg-white hover:bg-slate-50 border-gray-200 text-slate-700"
            >
              <RefreshCw
                className={`w-4 h-4 shrink-0 stroke-[2.2] ${
                  isManualRefreshing || isFetchingRuns ? 'animate-spin text-saffron' : 'text-slate-600'
                }`}
              />
            </AdminButton>
          </div>
        </div>

        {/* Runs Table Body in standard DataTable container */}
        <div className="w-full overflow-x-auto bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md border border-blue-100 shadow-sm">
          {isLoadingRuns ? (
            <div className="py-16 flex justify-center">
              <CustomLoader fullScreen={false} size="md" text="Loading agent runs..." />
            </div>
          ) : runs.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">
              <Activity className="w-10 h-10 mx-auto mb-2 opacity-30 text-saffron" />
              <p className="font-medium text-gray-600">No agent runs found</p>
              <p className="text-xs text-gray-400 mt-1">Autonomous runs will appear here once executed or scheduled.</p>
            </div>
          ) : (
            <>
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-orange-50 text-orange-900 border-b border-orange-100 uppercase text-xs tracking-wider sticky top-0 font-semibold">
                  <tr>
                    <th className="px-6 py-4 font-bold">Agent Name</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                    <th className="px-6 py-4 font-bold">Trigger</th>
                    <th className="px-6 py-4 font-bold">Started At</th>
                    <th className="px-6 py-4 font-bold">Duration</th>
                    <th className="px-6 py-4 font-bold">Findings</th>
                    <th className="px-6 py-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {runs.map((run) => {
                    const findingsCount = run.state?.findings?.length || 0;
                    const isSelected = selectedRunId === run.id;
                    return (
                      <tr
                        key={run.id}
                        onClick={() => setSelectedRunId(run.id)}
                        className={`transition-colors cursor-pointer group ${
                          isSelected ? 'bg-orange-50/90 hover:bg-orange-100/70' : 'bg-gray-50/50 hover:bg-blue-100/60'
                        }`}
                      >
                        <td
                          className={`px-6 py-4 font-medium text-gray-900 ${
                            isSelected ? 'border-l-4 border-l-saffron' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Activity className="w-4 h-4 text-saffron shrink-0" />
                            <span className="font-semibold text-gray-900">{formatStandardCase(run.agentName)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(run.status)}</td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-semibold text-slate-700">{run.triggerType}</span>
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {new Date(run.startedAt || run.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </td>
                        <td className="px-6 py-4 text-gray-500 font-medium">{formatDuration(run)}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`text-xs font-semibold ${
                              findingsCount > 0 ? 'text-amber-600' : 'text-emerald-600'
                            }`}
                          >
                            {findingsCount} finding(s)
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-saffron font-bold text-xs inline-flex items-center gap-1 hover:underline">
                            Inspect <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <Pagination
                page={page}
                totalPages={totalPages}
                totalRecords={totalRecords}
                limit={limit}
                onPageChange={(p) => setPage(p)}
                onLimitChange={(l) => {
                  setLimit(l);
                  setPage(1);
                }}
                limitOptions={[10, 20, 50]}
              />
            </>
          )}
        </div>
      </div>

      {/* Selected Run Inspection Modal / Drawer with Portal for 100% full height backdrop */}
      {selectedRunId &&
        createPortal(
          <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
            <div className="fixed inset-0" onClick={() => setSelectedRunId(null)} />
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-200 z-10 animate-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="px-5 py-4 border-b border-gray-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-saffron" />
                    {formatStandardCase(selectedDetails?.run?.agentName)} — Execution Details
                  </h4>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">Run ID: {selectedRunId}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRunId(null)}
                  className="text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 p-1.5 rounded-lg transition-colors cursor-pointer"
                  title="Close"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">
                {isLoadingDetails ? (
                  <div className="py-12 flex justify-center">
                    <CustomLoader text="Loading run details..." />
                  </div>
                ) : selectedDetails ? (
                  <>
                    {/* Summary Banner */}
                    <div className="bg-slate-50 border border-slate-200 rounded p-3.5 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                          Summary Status
                        </span>
                        <p className="text-sm font-bold text-slate-900 mt-0.5">
                          {selectedDetails.run.state?.summary?.overview || 'Execution completed without overview.'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">{getStatusBadge(selectedDetails.run.status)}</div>
                    </div>

                    {/* Multi-Step Orchestration Metrics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="bg-white border border-gray-200 p-2.5 rounded text-center">
                        <span className="text-[10px] uppercase font-bold text-gray-500">Iterations</span>
                        <p className="text-sm font-bold text-slate-900 mt-0.5">
                          {selectedDetails.run.iterationCount || 1}
                        </p>
                      </div>
                      <div className="bg-white border border-gray-200 p-2.5 rounded text-center">
                        <span className="text-[10px] uppercase font-bold text-gray-500">Tool Calls</span>
                        <p className="text-sm font-bold text-slate-900 mt-0.5">
                          {selectedDetails.toolCalls?.length || 0}
                        </p>
                      </div>
                      <div className="bg-white border border-gray-200 p-2.5 rounded text-center">
                        <span className="text-[10px] uppercase font-bold text-gray-500">Tokens</span>
                        <p className="text-sm font-bold text-slate-900 mt-0.5">
                          {selectedDetails.run.totalTokensUsed || 0}
                        </p>
                      </div>
                      <div className="bg-white border border-gray-200 p-2.5 rounded text-center">
                        <span className="text-[10px] uppercase font-bold text-gray-500">Trigger</span>
                        <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedDetails.run.triggerType}</p>
                      </div>
                    </div>

                    {/* Error / Failure Banner */}
                    {selectedDetails.run.errorMessage && (
                      <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded text-xs space-y-1">
                        <strong className="font-bold flex items-center gap-1">
                          <XCircle className="w-4 h-4 text-rose-600" /> Execution Issue:
                        </strong>
                        <p className="text-rose-700">{selectedDetails.run.errorMessage}</p>
                      </div>
                    )}

                    {/* Staged Proposals Link */}
                    {(selectedDetails.run.state?.proposalIds?.length > 0 || selectedDetails.run.state?.proposalId) && (
                      <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded text-xs font-medium flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-saffron" />
                          Proposal Staged for Human Review
                        </span>
                        <a
                          href="/admin/ai-proposals"
                          className="text-saffron-dark font-bold hover:underline inline-flex items-center gap-1"
                        >
                          View in Proposal Review <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}

                    {/* Findings Section */}
                    <div>
                      <h5 className="font-bold text-sm text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-saffron" />
                        Structured Findings ({selectedDetails.run.state?.findings?.length || 0})
                      </h5>

                      {!selectedDetails.run.state?.findings || selectedDetails.run.state.findings.length === 0 ? (
                        <div className="bg-green-50 border border-green-200 text-green-800 p-3 rounded text-xs font-medium">
                          ✓ Zero issues discovered. System passed all quality and health evaluations.
                        </div>
                      ) : (
                        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                          {selectedDetails.run.state.findings.map((finding: any, idx: number) => (
                            <div
                              key={finding.id || idx}
                              className="border border-slate-200 rounded-md p-3 bg-white hover:border-slate-300 transition-colors space-y-1.5"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-slate-900 text-xs">
                                  {finding.title || finding.type}
                                </span>
                                {getSeverityBadge(finding.severity)}
                              </div>
                              <p className="text-gray-700">{finding.message}</p>
                              {finding.recommendation && (
                                <div className="bg-amber-50/70 border-l-2 border-amber-500 pl-2 py-1 text-amber-900 text-[11px]">
                                  <strong>Recommendation:</strong> {finding.recommendation}
                                </div>
                              )}
                              {finding.evidence && (
                                <pre className="bg-slate-100 p-1.5 rounded font-mono text-[10px] text-slate-700 overflow-x-auto">
                                  {JSON.stringify(finding.evidence, null, 2)}
                                </pre>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Tool Calls Audit Trail */}
                    <div>
                      <h5 className="font-bold text-sm text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                        <Wrench className="w-4 h-4 text-saffron" />
                        Audited Tool Calls ({selectedDetails.toolCalls?.length || 0})
                      </h5>

                      {selectedDetails.toolCalls?.length === 0 ? (
                        <p className="text-gray-500 italic">No tool calls logged for this run.</p>
                      ) : (
                        <div className="border border-gray-200 rounded overflow-hidden">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-100 text-gray-700 font-bold border-b border-gray-200">
                              <tr>
                                <th className="py-2.5 px-3.5">Tool Name</th>
                                <th className="py-2.5 px-3.5">Tier</th>
                                <th className="py-2.5 px-3.5">Status</th>
                                <th className="py-2.5 px-3.5 font-mono text-right">Duration</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {selectedDetails.toolCalls.map((tc: AgentToolCallItem) => (
                                <tr key={tc.id} className="hover:bg-slate-50 transition-colors">
                                  <td className="py-2.5 px-3.5 font-semibold text-slate-900">
                                    {formatStandardCase(tc.toolName)}
                                  </td>
                                  <td className="py-2.5 px-3.5 text-gray-600 font-mono text-[11px]">
                                    {formatStandardCase(tc.permissionTier)}
                                  </td>
                                  <td className="py-2.5 px-3.5">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                        tc.status === 'SUCCESS'
                                          ? 'bg-green-100 text-green-800'
                                          : tc.status === 'BLOCKED'
                                            ? 'bg-red-100 text-red-800'
                                            : 'bg-amber-100 text-amber-800'
                                      }`}
                                    >
                                      {tc.status}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3.5 text-gray-600 font-mono text-right">
                                    {tc.durationMs}ms
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </>
                ) : null}
              </div>

              {/* Modal Footer */}
              <div className="px-5 py-3.5 border-t border-gray-200 bg-slate-50 flex justify-end">
                <button
                  onClick={() => setSelectedRunId(null)}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded text-xs cursor-pointer shadow-2xs"
                >
                  Done
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
