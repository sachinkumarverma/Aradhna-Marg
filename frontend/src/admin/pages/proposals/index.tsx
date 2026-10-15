import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sparkles, CheckCircle2, XCircle, Clock, Play, RefreshCw, AlertCircle, Eye, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { DataTable } from '@admin/components/DataTable';
import { AdminButton } from '@admin/components/AdminButton';
import { Select } from '@components/ui/Select';
import { SearchInput } from '@components/ui/SearchInput';
import { Pagination } from '@components/ui/Pagination';
import { ConfirmDialog } from '@components/ui/ConfirmDialog';
import { ProposalApi, type AgentProposalItem, type ProposalStats } from '@admin/features/agents/ProposalApi';
import { ProposalDetailDrawer } from '@admin/features/agents/ProposalDetailDrawer';
import toast from 'react-hot-toast';

export interface AdminProposalsProps {
  showHeader?: boolean;
}

export const AdminProposals: React.FC<AdminProposalsProps> = ({ showHeader = true }) => {
  const queryClient = useQueryClient();

  // Search & Filter state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('ALL');
  const [agentFilter, setAgentFilter] = useState<string>('ALL');

  // Selected proposal for Detail Side Panel Drawer
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);

  // Quick Action execution confirmation dialog
  const [quickExecuteProposal, setQuickExecuteProposal] = useState<AgentProposalItem | null>(null);
  const [quickRejectProposal, setQuickRejectProposal] = useState<AgentProposalItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    setIsManualRefreshing(true);
    try {
      await Promise.all([refetch(), queryClient.invalidateQueries({ queryKey: ['admin-agent-proposal-stats'] })]);
    } finally {
      setIsManualRefreshing(false);
    }
  };

  // 1. Fetch Backend Lifecycle Statistics
  const { data: statsData } = useQuery({
    queryKey: ['admin-agent-proposal-stats'],
    queryFn: async () => {
      return await ProposalApi.getStats();
    },
    refetchInterval: 10000
  });

  const stats: ProposalStats = statsData || {
    pending: 0,
    approved: 0,
    rejected: 0,
    executing: 0,
    completed: 0,
    failed: 0,
    total: 0
  };

  // 2. Fetch Paginated Proposal List
  const {
    data: proposalsData,
    isLoading,
    isFetching,
    refetch
  } = useQuery({
    queryKey: ['admin-agent-proposals', page, limit, statusFilter, entityTypeFilter, agentFilter, search],
    queryFn: async () => {
      return await ProposalApi.getProposals({
        page,
        limit,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        entityType: entityTypeFilter === 'ALL' ? undefined : entityTypeFilter,
        agentName: agentFilter === 'ALL' ? undefined : agentFilter,
        search: search.trim() || undefined
      });
    },
    refetchInterval: 12000
  });

  const proposals: AgentProposalItem[] = proposalsData?.data || [];
  const totalRecords = proposalsData?.count || 0;
  const totalPages = Math.ceil(totalRecords / limit) || 1;

  // Approve & Execute Mutation
  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      await ProposalApi.approveProposal(id);
      return await ProposalApi.executeProposal(id);
    },
    onSuccess: () => {
      toast.success('Proposal approved and applied live!');
      queryClient.invalidateQueries({ queryKey: ['admin-agent-proposals'] });
      queryClient.invalidateQueries({ queryKey: ['admin-agent-proposal-stats'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to approve and apply proposal');
    }
  });

  // Execute Mutation
  const executeMutation = useMutation({
    mutationFn: async (id: string) => {
      return await ProposalApi.executeProposal(id);
    },
    onSuccess: () => {
      toast.success('Proposal executed! Live content updated via ToolGateway.');
      setQuickExecuteProposal(null);
      queryClient.invalidateQueries({ queryKey: ['admin-agent-proposals'] });
      queryClient.invalidateQueries({ queryKey: ['admin-agent-proposal-stats'] });
    },
    onError: (err: any) => {
      setQuickExecuteProposal(null);
      const msg = err.response?.data?.message || err.message;
      toast.error(msg || 'Failed to execute proposal');
      queryClient.invalidateQueries({ queryKey: ['admin-agent-proposals'] });
      queryClient.invalidateQueries({ queryKey: ['admin-agent-proposal-stats'] });
    }
  });

  // Reject Mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      return await ProposalApi.rejectProposal(id, reason);
    },
    onSuccess: () => {
      toast.success('Proposal rejected.');
      setQuickRejectProposal(null);
      setRejectionReason('');
      queryClient.invalidateQueries({ queryKey: ['admin-agent-proposals'] });
      queryClient.invalidateQueries({ queryKey: ['admin-agent-proposal-stats'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to reject proposal');
    }
  });

  // Status badge matching Articles / Puranas / Bhajans design system tokens
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-green-600 text-white">
            COMPLETED
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-red-600 text-white">
            FAILED
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-blue-600 text-white">
            APPROVED
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-amber-600 text-white">
            NEEDS REVIEW
          </span>
        );
      case 'EXECUTING':
        return (
          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-purple-600 text-white animate-pulse">
            EXECUTING
          </span>
        );
      case 'REJECTED':
      default:
        return (
          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-gray-500 text-white">
            REJECTED
          </span>
        );
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setEntityTypeFilter('ALL');
    setAgentFilter('ALL');
    setPage(1);
  };

  const columns = [
    {
      header: 'TARGET ENTITY',
      accessor: (row: AgentProposalItem) => (
        <div className="min-w-0">
          <p className="font-bold text-gray-900 line-clamp-1 font-anek leading-snug text-sm">
            {row.targetTitle || `Entity ID: ${row.entityId.slice(0, 12)}...`}
          </p>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mt-0.5">{row.entityType}</p>
        </div>
      )
    },
    {
      header: 'FIELD',
      accessor: (row: AgentProposalItem) => (
        <span className="text-[11px] font-medium text-slate-600">
          {(row.targetField || 'content').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
        </span>
      )
    },
    {
      header: 'GENERATING AGENT',
      accessor: (row: AgentProposalItem) => (
        <span className="truncate max-w-[170px] text-sm text-gray-700 font-medium block">{row.agentName}</span>
      )
    },
    {
      header: 'STATUS',
      className: 'text-center w-32',
      accessor: (row: AgentProposalItem) => getStatusBadge(row.status)
    },
    {
      header: 'CREATED',
      accessor: (row: AgentProposalItem) => (
        <span className="text-sm text-slate-800 font-medium">
          {row.createdAt ? format(new Date(row.createdAt), 'MMM dd, yyyy') : '—'}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6 flex flex-col min-h-full">
      {/* Top Header matching other sections */}
      {showHeader && (
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-2xl font-bold tracking-wide text-slate-900 flex items-center gap-2 uppercase truncate">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-saffron shrink-0" />
              <span className="truncate">AI PROPOSALS</span>
            </h1>
            <p className="hidden sm:block text-sm text-gray-500 mt-1">
              Review and approve AI-generated content proposals.
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
      )}

      {/* 4 User-Facing Summary Stat Cards: Needs Review (Pending), Completed, Failed, Rejected */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Needs Review (PENDING) */}
        <div
          onClick={() => {
            setStatusFilter(statusFilter === 'PENDING' ? 'ALL' : 'PENDING');
            setPage(1);
          }}
          title="Proposals waiting for human review and decision."
          className={`p-4 rounded-md border transition-all cursor-pointer shadow-sm ${
            statusFilter === 'PENDING'
              ? 'ring-1 ring-amber-400 border-amber-400 bg-amber-50/60'
              : 'border-amber-200/80 bg-gradient-to-br from-amber-50/50 to-white hover:border-amber-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Needs Review</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{stats.pending}</p>
          <p className="text-[11px] text-gray-500 mt-1 line-clamp-1">Waiting for human review &amp; decision</p>
        </div>

        {/* Completed */}
        <div
          onClick={() => {
            setStatusFilter(statusFilter === 'COMPLETED' ? 'ALL' : 'COMPLETED');
            setPage(1);
          }}
          title="Approved proposals whose execution completed successfully."
          className={`p-4 rounded-md border transition-all cursor-pointer shadow-sm ${
            statusFilter === 'COMPLETED'
              ? 'ring-1 ring-emerald-400 border-emerald-400 bg-emerald-50/60'
              : 'border-emerald-200/80 bg-gradient-to-br from-emerald-50/50 to-white hover:border-emerald-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Completed</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{stats.completed}</p>
          <p className="text-[11px] text-gray-500 mt-1 line-clamp-1">Execution completed successfully</p>
        </div>

        {/* Failed */}
        <div
          onClick={() => {
            setStatusFilter(statusFilter === 'FAILED' ? 'ALL' : 'FAILED');
            setPage(1);
          }}
          title="Approved proposals whose execution failed."
          className={`p-4 rounded-md border transition-all cursor-pointer shadow-sm ${
            statusFilter === 'FAILED'
              ? 'ring-1 ring-rose-400 border-rose-400 bg-rose-50/60'
              : 'border-rose-200/80 bg-gradient-to-br from-rose-50/50 to-white hover:border-rose-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Failed</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{stats.failed}</p>
          <p className="text-[11px] text-gray-500 mt-1 line-clamp-1">Approved execution failed</p>
        </div>

        {/* Rejected */}
        <div
          onClick={() => {
            setStatusFilter(statusFilter === 'REJECTED' ? 'ALL' : 'REJECTED');
            setPage(1);
          }}
          title="Proposals rejected during human review."
          className={`p-4 rounded-md border transition-all cursor-pointer shadow-sm ${
            statusFilter === 'REJECTED'
              ? 'ring-1 ring-gray-400 border-gray-400 bg-gray-100'
              : 'border-gray-200/80 bg-gradient-to-br from-gray-50/50 to-white hover:border-gray-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Rejected</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center shrink-0">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{stats.rejected}</p>
          <p className="text-[11px] text-gray-500 mt-1 line-clamp-1">Declined during human review</p>
        </div>
      </div>

      {/* Filter & Search Toolbar (same rounded-md border radius & padding as other sections) */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-md shadow-sm border border-blue-100 flex flex-wrap gap-4 items-center justify-between">
        <div className="grid grid-cols-2 sm:flex sm:flex-row flex-wrap items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          {/* Status Filter */}
          <Select
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
            options={[
              { value: 'ALL', label: 'All Statuses' },
              { value: 'PENDING', label: 'Needs Review' },
              { value: 'APPROVED', label: 'Approved' },
              { value: 'EXECUTING', label: 'Executing' },
              { value: 'COMPLETED', label: 'Completed' },
              { value: 'FAILED', label: 'Failed' },
              { value: 'REJECTED', label: 'Rejected' }
            ]}
            className="w-full sm:w-36"
            searchable={false}
          />

          {/* Entity Type Filter */}
          <Select
            value={entityTypeFilter}
            onChange={(val) => {
              setEntityTypeFilter(val);
              setPage(1);
            }}
            options={[
              { value: 'ALL', label: 'All Entities' },
              { value: 'article', label: 'Articles' },
              { value: 'bhajan', label: 'Bhajans' },
              { value: 'festival', label: 'Festivals' },
              { value: 'puran', label: 'Puranas' },
              { value: 'category', label: 'Categories' }
            ]}
            className="w-full sm:w-36"
            searchable={false}
          />

          {/* Agent Filter */}
          <Select
            value={agentFilter}
            onChange={(val) => {
              setAgentFilter(val);
              setPage(1);
            }}
            options={[
              { value: 'ALL', label: 'All Agents' },
              { value: 'ContentImprovementAgent', label: 'ContentImprovementAgent' },
              { value: 'SeoOptimizationAgent', label: 'SeoOptimizationAgent' },
              { value: 'LyricsPreservationAgent', label: 'LyricsPreservationAgent' },
              { value: 'GrammarImprovementAgent', label: 'GrammarImprovementAgent' }
            ]}
            className="w-full sm:w-52"
            searchable={false}
          />

          {(search || statusFilter !== 'ALL' || entityTypeFilter !== 'ALL' || agentFilter !== 'ALL') && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs text-saffron hover:underline font-semibold px-2 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        <SearchInput
          placeholder="Search proposals by title, ID..."
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
        />
      </div>

      {/* Proposals DataTable (Exact same DataTable component and tokens as other sections) */}
      <div className="flex-1 min-h-0 relative">
        <DataTable
          data={proposals}
          columns={columns}
          isLoading={isLoading}
          selectedRowId={selectedProposalId}
          onRowClick={(row) => setSelectedProposalId(row.id)}
          rowClassName={(row) =>
            selectedProposalId && String(selectedProposalId) === String(row.id) ? 'bg-orange-50/80 font-medium' : ''
          }
          renderActions={(proposal) => {
            const isPending = proposal.status === 'PENDING';
            const isApproved = proposal.status === 'APPROVED';

            return (
              <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                {isPending && (
                  <>
                    <button
                      type="button"
                      onClick={() => setQuickRejectProposal(proposal)}
                      className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                      title="Reject Proposal"
                      aria-label="Reject Proposal"
                    >
                      <X className="w-4 h-4 stroke-[2.5]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => approveMutation.mutate(proposal.id)}
                      disabled={approveMutation.isPending}
                      className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                      title="Approve Proposal"
                      aria-label="Approve Proposal"
                    >
                      <Check className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </>
                )}

                {isApproved && (
                  <button
                    type="button"
                    onClick={() => setQuickExecuteProposal(proposal)}
                    className="p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer"
                    title="Execute Proposal"
                    aria-label="Execute Proposal"
                  >
                    <Play className="w-4 h-4 fill-emerald-600 stroke-[2.5]" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedProposalId(proposal.id)}
                  className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                  title="View Proposal Details"
                  aria-label="View Proposal Details"
                >
                  <Eye className="w-4 h-4 stroke-[2]" />
                </button>
              </div>
            );
          }}
          emptyIcon={Sparkles}
          emptyTitle="No Proposals Found"
          emptySubtext="No AI proposals match the current filters."
        />
      </div>

      {/* Pagination Footer (same connected rounded-b-md as other sections) */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-x border-b border-blue-100 rounded-b-md -mt-2 relative z-20">
        <Pagination
          page={page}
          totalPages={totalPages}
          totalRecords={totalRecords}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={(l) => {
            setLimit(l);
            setPage(1);
          }}
        />
      </div>

      {/* Proposal Detail Side Panel Drawer */}
      {selectedProposalId && (
        <ProposalDetailDrawer
          proposalId={selectedProposalId}
          onClose={() => setSelectedProposalId(null)}
          onStatusChanged={() => {
            queryClient.invalidateQueries({ queryKey: ['admin-agent-proposals'] });
            queryClient.invalidateQueries({ queryKey: ['admin-agent-proposal-stats'] });
          }}
        />
      )}

      {/* Quick Execute Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!quickExecuteProposal}
        title="Execute AI Proposal?"
        message={
          quickExecuteProposal
            ? `Are you sure you want to execute and apply this approved proposal to live content?\n\n` +
              `• Entity: ${quickExecuteProposal.entityType.toUpperCase()}\n` +
              `• Target Field: ${quickExecuteProposal.targetField?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}\n` +
              `• Live Stale Check: Baseline will be verified against live content ✓\n` +
              `• Sacred Guard: Lyrics and sacred titles remain immutable ✓\n\n` +
              `This action will mutate live production content.`
            : ''
        }
        confirmText="Execute Change"
        cancelText="Cancel"
        onConfirm={() => {
          if (quickExecuteProposal) executeMutation.mutate(quickExecuteProposal.id);
        }}
        onCancel={() => setQuickExecuteProposal(null)}
      />

      {/* Quick Reject Modal */}
      {quickRejectProposal &&
        createPortal(
          <div className="fixed inset-0 z-[1050] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-md w-full p-5 space-y-3.5">
              <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-600" /> Reject AI Proposal
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Are you sure you want to reject this proposal? Rejected proposals cannot be executed and will not modify
                live content.
              </p>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Rejection Reason (Optional):</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Inaccurate devotional context, redundant tags..."
                  rows={3}
                  className="w-full text-xs p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saffron focus:border-saffron outline-none resize-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setQuickRejectProposal(null)}
                  className="px-3.5 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <AdminButton
                  variant="danger"
                  onClick={() => {
                    if (quickRejectProposal)
                      rejectMutation.mutate({ id: quickRejectProposal.id, reason: rejectionReason });
                  }}
                  isLoading={rejectMutation.isPending}
                >
                  Confirm Rejection
                </AdminButton>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
