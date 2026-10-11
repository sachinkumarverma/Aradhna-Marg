import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Search,
  ExternalLink,
  ChevronRight,
  Shield,
  Activity,
  Layers,
  Wrench,
  FileText,
  Calendar
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

export const AgentRunsSection: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [agentFilter, setAgentFilter] = useState<string>('ALL');

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
      toast.success(`Schedule for '${vars.id}' updated`);
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
      toast.success(`Scheduled agent '${agentId}' executed successfully!`);
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

  // Fetch runs list
  const {
    data: runsData,
    isLoading: isLoadingRuns,
    isFetching: isFetchingRuns,
    refetch: refetchRuns
  } = useQuery({
    queryKey: ['agent-runs', statusFilter, agentFilter],
    queryFn: () =>
      AgentApi.getRuns({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        agentName: agentFilter === 'ALL' ? undefined : agentFilter,
        limit: 50
      }),
    refetchInterval: 5000 // auto refresh runs
  });

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
      toast.success(`Agent '${agentId}' run completed!`);
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

  const runs = runsData?.data || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" /> Completed
          </span>
        );
      case 'RUNNING':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-semibold bg-blue-100 text-blue-900 animate-pulse">
            <Clock className="w-3.5 h-3.5" /> Running
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-semibold bg-rose-100 text-rose-800">
            <XCircle className="w-3.5 h-3.5" /> Failed
          </span>
        );
      case 'SKIPPED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-semibold bg-amber-100 text-amber-800">
            <AlertTriangle className="w-3.5 h-3.5" /> Skipped
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-700">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-800">
            {status}
          </span>
        );
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
      {/* Top Banner: Scheduled Autonomous Monitoring (Phase 5B) */}
      <div className="bg-white border border-indigo-100 rounded-md p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
              <Calendar className="w-4 h-4 text-saffron" />
              Scheduled Autonomous Monitoring (Phase 5B)
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Read-only automated surveillance. Scheduled agents inspect health, SEO, and content quality on defined
              schedules without content mutation.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRefreshRuns}
            disabled={isManualRefreshing || isFetchingRuns}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded cursor-pointer transition-colors shadow-2xs"
          >
            <RotateCcw
              className={`w-3 h-3 ${isManualRefreshing || isFetchingRuns ? 'animate-spin text-saffron' : 'text-gray-500'}`}
            />
            <span>{isManualRefreshing || isFetchingRuns ? 'Refreshing...' : 'Refresh Status'}</span>
          </button>
        </div>

        {isLoadingSchedules ? (
          <div className="py-6 flex justify-center">
            <CustomLoader text="Loading monitoring schedules..." />
          </div>
        ) : schedules.length === 0 ? (
          <div className="p-4 text-xs text-gray-500 text-center bg-slate-50 rounded">
            No monitoring schedules registered.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {schedules.map((sched) => {
              const isRunPending =
                runScheduledAgentMutation.isPending && runScheduledAgentMutation.variables === sched.agentId;
              const isUpdatePending =
                updateScheduleMutation.isPending && updateScheduleMutation.variables?.id === sched.agentId;

              return (
                <div
                  key={sched.id}
                  className="border border-slate-200 rounded-md p-3.5 bg-gradient-to-br from-slate-50 to-white flex flex-col justify-between gap-3 shadow-2xs"
                >
                  <div>
                    {/* Header: Name and Enabled Toggle */}
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <span className="font-bold text-sm text-slate-900 block">{sched.agentName}</span>
                        <span className="text-[10px] text-gray-500 font-mono">{sched.agentId}</span>
                      </div>
                      <button
                        type="button"
                        disabled={isUpdatePending}
                        onClick={() =>
                          updateScheduleMutation.mutate({
                            id: sched.agentId,
                            payload: { enabled: !sched.enabled }
                          })
                        }
                        className={`px-2.5 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                          sched.enabled
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        }`}
                        title={sched.enabled ? 'Click to disable schedule' : 'Click to enable schedule'}
                      >
                        {isUpdatePending ? '...' : sched.enabled ? 'Enabled' : 'Disabled'}
                      </button>
                    </div>

                    <p className="text-xs text-gray-600 line-clamp-2 mb-3">{sched.description}</p>

                    {/* Schedule Selector & Status Grid */}
                    <div className="bg-slate-50/80 border border-slate-100 rounded p-2.5 space-y-2 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 font-semibold uppercase text-[10px]">Schedule:</span>
                        <select
                          value={sched.scheduleInterval}
                          disabled={isUpdatePending}
                          onChange={(e) =>
                            updateScheduleMutation.mutate({
                              id: sched.agentId,
                              payload: {
                                scheduleInterval: e.target.value as 'hourly' | 'every_6_hours' | 'daily' | 'weekly'
                              }
                            })
                          }
                          className="bg-white border border-gray-200 text-slate-800 font-semibold rounded px-1.5 py-0.5 text-[11px] focus:outline-none cursor-pointer"
                        >
                          <option value="hourly">Hourly</option>
                          <option value="every_6_hours">Every 6 Hours</option>
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between text-gray-600">
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
                        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded px-2 py-1 flex items-center gap-1.5 font-semibold text-[10px]">
                          <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                          <span>{sched.consecutiveFailures} consecutive failure(s)</span>
                        </div>
                      )}

                      {sched.isRunning && (
                        <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded px-2 py-1 flex items-center gap-1.5 font-semibold text-[10px] animate-pulse">
                          <Clock className="w-3 h-3 text-blue-600 shrink-0" />
                          <span>Currently executing...</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Footer: Run Now */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                    <span className="text-gray-400 font-mono text-[10px]">
                      {formatIntervalLabel(sched.scheduleInterval)}
                    </span>
                    <AdminButton
                      onClick={() => runScheduledAgentMutation.mutate(sched.agentId)}
                      disabled={isRunPending || sched.isRunning}
                      variant="primary"
                      className="h-7 px-3 text-xs gap-1 font-semibold"
                    >
                      <Play className={`w-3 h-3 ${isRunPending || sched.isRunning ? 'animate-spin' : ''}`} />
                      <span>{isRunPending || sched.isRunning ? 'Executing...' : 'Run Now'}</span>
                    </AdminButton>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-md border border-gray-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase">Status:</span>
          {['ALL', 'COMPLETED', 'RUNNING', 'FAILED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 text-xs font-semibold rounded cursor-pointer transition-colors ${
                statusFilter === st ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase">Agent:</span>
          <select
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
            className="text-xs font-medium border border-gray-200 rounded px-2 py-1 bg-white focus:outline-none"
          >
            <option value="ALL">All Agents</option>
            {definitions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleRefreshRuns}
            disabled={isManualRefreshing || isFetchingRuns}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-60 cursor-pointer shadow-2xs ml-1"
            title="Refresh agent runs list"
          >
            <RotateCcw
              className={`w-3 h-3 transition-transform ${
                isManualRefreshing || isFetchingRuns ? 'animate-spin text-saffron' : 'text-gray-500'
              }`}
            />
            <span>{isManualRefreshing || isFetchingRuns ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Runs Table */}
      <div className="bg-white border border-gray-200 rounded-md shadow-2xs overflow-hidden">
        {isLoadingRuns ? (
          <div className="py-12 flex justify-center">
            <CustomLoader text="Loading agent runs..." />
          </div>
        ) : runs.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-sm">
            No agent runs found. Click "Run Agent" above to initiate an autonomous analysis run.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Agent Name</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Trigger</th>
                  <th className="py-3 px-4">Started At</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Findings</th>
                  <th className="py-3 px-4 text-right">Action</th>
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
                      className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                        isSelected ? 'bg-orange-50/50' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-saffron" />
                          <span>{run.agentName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(run.status)}</td>
                      <td className="py-3 px-4 text-gray-600">{run.triggerType}</td>
                      <td className="py-3 px-4 text-gray-600">
                        {new Date(run.startedAt || run.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </td>
                      <td className="py-3 px-4 text-gray-600 font-mono">{formatDuration(run)}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold ${
                            findingsCount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {findingsCount} finding(s)
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-saffron font-bold text-xs inline-flex items-center gap-0.5 hover:underline">
                          Inspect <ChevronRight className="w-3 h-3" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Selected Run Inspection Modal / Drawer */}
      {selectedRunId && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-200">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-gray-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-saffron" />
                  {selectedDetails?.run?.agentName} — Execution Details
                </h4>
                <p className="text-xs text-gray-500 font-mono mt-0.5">Run ID: {selectedRunId}</p>
              </div>
              <button
                onClick={() => setSelectedRunId(null)}
                className="text-gray-400 hover:text-gray-700 text-sm font-bold p-1 rounded cursor-pointer"
              >
                ✕ Close
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
                              <span className="font-bold text-slate-900 text-xs">{finding.title || finding.type}</span>
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
                        <table className="w-full text-left text-[11px]">
                          <thead className="bg-slate-100 text-gray-700 font-bold border-b border-gray-200">
                            <tr>
                              <th className="py-2 px-3">Tool Name</th>
                              <th className="py-2 px-3">Tier</th>
                              <th className="py-2 px-3">Status</th>
                              <th className="py-2 px-3 font-mono">Duration</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 font-mono">
                            {selectedDetails.toolCalls.map((tc: AgentToolCallItem) => (
                              <tr key={tc.id} className="hover:bg-slate-50">
                                <td className="py-2 px-3 font-bold text-slate-900">{tc.toolName}</td>
                                <td className="py-2 px-3 text-gray-600">{tc.permissionTier}</td>
                                <td className="py-2 px-3">
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
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
                                <td className="py-2 px-3 text-gray-600">{tc.durationMs}ms</td>
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
            <div className="px-5 py-3 border-t border-gray-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedRunId(null)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded text-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
