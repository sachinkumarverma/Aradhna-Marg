import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  RotateCcw,
  AlertCircle,
  FileText,
  Calendar,
  FolderTree,
  BookOpen,
  Music,
  Tag,
  ShieldCheck,
  Eye,
  Bot,
  User
} from 'lucide-react';
import { AdminButton } from '@admin/components/AdminButton';
import { CustomLoader } from '@components/common/CustomLoader';
import { SearchInput } from '@components/ui/SearchInput';
import { Select } from '@components/ui/Select';
import { Pagination } from '@components/ui/Pagination';
import { ConfirmDialog } from '@components/ui/ConfirmDialog';
import { ProposalApi, type AgentProposalItem, type ProposalStats } from '@admin/features/agents/ProposalApi';
import { ProposalDetailModal } from '@admin/features/agents/ProposalDetailModal';
import toast from 'react-hot-toast';

export const AdminProposals: React.FC = () => {
  const queryClient = useQueryClient();

  // Search & Filter state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('ALL');
  const [agentFilter, setAgentFilter] = useState<string>('ALL');
  const [targetFieldFilter, setTargetFieldFilter] = useState<string>('ALL');

  // Selected proposal for Detail Modal
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);

  // Quick Action execution confirmation dialog
  const [quickExecuteProposal, setQuickExecuteProposal] = useState<AgentProposalItem | null>(null);
  const [quickRejectProposal, setQuickRejectProposal] = useState<AgentProposalItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

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
    queryKey: [
      'admin-agent-proposals',
      page,
      limit,
      statusFilter,
      entityTypeFilter,
      agentFilter,
      targetFieldFilter,
      search
    ],
    queryFn: async () => {
      return await ProposalApi.getProposals({
        page,
        limit,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        entityType: entityTypeFilter === 'ALL' ? undefined : entityTypeFilter,
        agentName: agentFilter === 'ALL' ? undefined : agentFilter,
        targetField: targetFieldFilter === 'ALL' ? undefined : targetFieldFilter,
        search: search.trim() || undefined
      });
    },
    refetchInterval: 12000
  });

  const proposals: AgentProposalItem[] = proposalsData?.data || [];
  const totalRecords = proposalsData?.count || 0;
  const totalPages = Math.ceil(totalRecords / limit) || 1;

  // Approve Mutation (PENDING -> APPROVED)
  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      return await ProposalApi.approveProposal(id);
    },
    onSuccess: () => {
      toast.success('Proposal approved! Ready for controlled execution.');
      queryClient.invalidateQueries({ queryKey: ['admin-agent-proposals'] });
      queryClient.invalidateQueries({ queryKey: ['admin-agent-proposal-stats'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to approve proposal');
    }
  });

  // Reject Mutation (PENDING/APPROVED -> REJECTED)
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

  // Execute Mutation (APPROVED -> EXECUTING -> COMPLETED)
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
      const statusCode = err.response?.status;
      const msg = err.response?.data?.message || err.message;
      if (statusCode === 409 || msg?.includes('Stale proposal') || msg?.includes('409')) {
        toast.error('Stale proposal conflict (409): Live content has changed.');
      } else {
        toast.error(msg || 'Failed to execute proposal');
      }
      queryClient.invalidateQueries({ queryKey: ['admin-agent-proposals'] });
      queryClient.invalidateQueries({ queryKey: ['admin-agent-proposal-stats'] });
    }
  });

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'bhajan':
        return <Music className="w-4 h-4 text-orange-600" />;
      case 'article':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'festival':
        return <Calendar className="w-4 h-4 text-purple-600" />;
      case 'puran':
        return <BookOpen className="w-4 h-4 text-emerald-600" />;
      case 'category':
        return <FolderTree className="w-4 h-4 text-amber-600" />;
      default:
        return <Tag className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
            <CheckCircle2 className="w-3 h-3" /> Approved
          </span>
        );
      case 'EXECUTING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200 animate-pulse">
            <RotateCcw className="w-3 h-3 animate-spin" /> Executing
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Completed
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3 h-3" /> Failed
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700 border border-gray-200">
            <XCircle className="w-3 h-3" /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setEntityTypeFilter('ALL');
    setAgentFilter('ALL');
    setTargetFieldFilter('ALL');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-darkBrown tracking-tight">AI Proposals Management</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
              Phase 5D UX
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Review, diff, approve, and execute AI-staged mutations under strict human editorial governance.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              refetch();
              queryClient.invalidateQueries({ queryKey: ['admin-agent-proposal-stats'] });
            }}
            disabled={isFetching}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-60 shadow-xs cursor-pointer"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-saffron' : 'text-gray-500'}`} />
            <span>{isFetching ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          {
            label: 'Pending',
            count: stats.pending,
            statusKey: 'PENDING',
            color: 'text-amber-700',
            bg: 'bg-amber-50/70',
            border: 'border-amber-200',
            activeBorder: 'ring-2 ring-amber-500'
          },
          {
            label: 'Approved (Ready)',
            count: stats.approved,
            statusKey: 'APPROVED',
            color: 'text-blue-700',
            bg: 'bg-blue-50/70',
            border: 'border-blue-200',
            activeBorder: 'ring-2 ring-blue-500'
          },
          {
            label: 'Executing',
            count: stats.executing,
            statusKey: 'EXECUTING',
            color: 'text-purple-700',
            bg: 'bg-purple-50/70',
            border: 'border-purple-200',
            activeBorder: 'ring-2 ring-purple-500'
          },
          {
            label: 'Completed',
            count: stats.completed,
            statusKey: 'COMPLETED',
            color: 'text-emerald-700',
            bg: 'bg-emerald-50/70',
            border: 'border-emerald-200',
            activeBorder: 'ring-2 ring-emerald-500'
          },
          {
            label: 'Failed',
            count: stats.failed,
            statusKey: 'FAILED',
            color: 'text-rose-700',
            bg: 'bg-rose-50/70',
            border: 'border-rose-200',
            activeBorder: 'ring-2 ring-rose-500'
          },
          {
            label: 'Rejected',
            count: stats.rejected,
            statusKey: 'REJECTED',
            color: 'text-gray-700',
            bg: 'bg-gray-50/70',
            border: 'border-gray-200',
            activeBorder: 'ring-2 ring-gray-500'
          }
        ].map((item) => {
          const isActive = statusFilter === item.statusKey;
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                setStatusFilter(isActive ? 'ALL' : item.statusKey);
                setPage(1);
              }}
              className={`p-3.5 rounded-xl border transition-all text-left cursor-pointer shadow-xs ${item.bg} ${
                item.border
              } ${isActive ? `${item.activeBorder} shadow-sm` : 'hover:border-gray-300'}`}
            >
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">{item.label}</span>
              <span className={`text-xl font-black mt-1 block ${item.color}`}>{item.count}</span>
            </button>
          );
        })}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="w-full md:w-80">
            <SearchInput
              value={search}
              onChange={(val) => {
                setSearch(val);
                setPage(1);
              }}
              placeholder="Search by title, proposal ID, entity ID..."
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Status Filter */}
            <Select
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val);
                setPage(1);
              }}
              options={[
                { value: 'ALL', label: 'All Statuses' },
                { value: 'PENDING', label: 'Pending Approval' },
                { value: 'APPROVED', label: 'Approved (Ready)' },
                { value: 'EXECUTING', label: 'Executing' },
                { value: 'COMPLETED', label: 'Completed' },
                { value: 'FAILED', label: 'Failed' },
                { value: 'REJECTED', label: 'Rejected' }
              ]}
              className="w-40 text-xs"
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
                { value: 'bhajan', label: 'Bhajans' },
                { value: 'article', label: 'Articles' },
                { value: 'festival', label: 'Festivals' },
                { value: 'puran', label: 'Puranas' },
                { value: 'category', label: 'Categories' }
              ]}
              className="w-36 text-xs"
            />

            {/* Target Field Filter */}
            <Select
              value={targetFieldFilter}
              onChange={(val) => {
                setTargetFieldFilter(val);
                setPage(1);
              }}
              options={[
                { value: 'ALL', label: 'All Fields' },
                { value: 'meaning', label: 'Bhajan Meaning' },
                { value: 'seo_metadata', label: 'SEO Metadata' },
                { value: 'content', label: 'Main Content' },
                { value: 'content_en', label: 'English Content' },
                { value: 'excerpt', label: 'Excerpt' },
                { value: 'short_description', label: 'Short Description' }
              ]}
              className="w-40 text-xs"
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
                { value: 'BhajanMeaningAgent', label: 'BhajanMeaningAgent' },
                { value: 'SeoImprovementAgent', label: 'SeoImprovementAgent' },
                { value: 'ContentImprovementAgent', label: 'ContentImprovementAgent' }
              ]}
              className="w-48 text-xs"
            />

            {(search ||
              statusFilter !== 'ALL' ||
              entityTypeFilter !== 'ALL' ||
              agentFilter !== 'ALL' ||
              targetFieldFilter !== 'ALL') && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-2.5 py-1.5 text-xs font-semibold text-gray-500 hover:text-darkBrown transition-colors cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Proposals List / Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2">
            <CustomLoader />
            <p className="text-xs text-gray-500">Loading proposals...</p>
          </div>
        ) : proposals.length === 0 ? (
          <div className="py-16 text-center p-8 space-y-2">
            <Sparkles className="w-10 h-10 text-gray-300 mx-auto" />
            <h3 className="text-base font-bold text-gray-700">No Proposals Found</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              No AI proposals match the current filter criteria. You can trigger proposals manually from content forms
              or review agents.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4">Field</th>
                  <th className="py-3 px-4">Generating Agent</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4">Reviewed By</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {proposals.map((proposal) => {
                  const isPending = proposal.status === 'PENDING';
                  const isApproved = proposal.status === 'APPROVED';

                  return (
                    <tr
                      key={proposal.id}
                      className="hover:bg-amber-50/30 transition-colors group cursor-pointer"
                      onClick={() => setSelectedProposalId(proposal.id)}
                    >
                      {/* Entity & Title */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200 group-hover:border-saffron/30">
                            {getEntityIcon(proposal.entityType)}
                          </div>
                          <div className="min-w-0 max-w-xs">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                              {proposal.entityType}
                            </span>
                            <p className="font-bold text-gray-900 truncate text-xs sm:text-sm">
                              {proposal.targetTitle || `ID: ${proposal.entityId.slice(0, 8)}...`}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Target Field */}
                      <td className="py-3.5 px-4 font-mono font-medium text-gray-700">
                        <span className="px-2 py-0.5 rounded bg-gray-100 border border-gray-200 text-[11px]">
                          {proposal.targetField}
                        </span>
                      </td>

                      {/* Generating Agent */}
                      <td className="py-3.5 px-4 text-gray-600">
                        <span className="inline-flex items-center gap-1.5 font-medium">
                          <Bot className="w-3.5 h-3.5 text-saffron shrink-0" />
                          <span className="truncate max-w-[140px]">{proposal.agentName}</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">{getStatusBadge(proposal.status)}</td>

                      {/* Created Date */}
                      <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap">{formatDate(proposal.createdAt)}</td>

                      {/* Reviewed By */}
                      <td className="py-3.5 px-4 text-gray-600 whitespace-nowrap">
                        {proposal.reviewedBy ? (
                          <span className="inline-flex items-center gap-1 font-medium text-gray-800">
                            <User className="w-3 h-3 text-gray-400" /> {proposal.reviewedBy}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Actions for PENDING */}
                          {isPending && (
                            <>
                              <button
                                type="button"
                                onClick={() => setQuickRejectProposal(proposal)}
                                className="px-2.5 py-1 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors cursor-pointer"
                                title="Reject proposal"
                              >
                                Reject
                              </button>
                              <button
                                type="button"
                                onClick={() => approveMutation.mutate(proposal.id)}
                                disabled={approveMutation.isPending}
                                className="px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors cursor-pointer"
                                title="Approve proposal"
                              >
                                Approve
                              </button>
                            </>
                          )}

                          {/* Quick Action for APPROVED */}
                          {isApproved && (
                            <button
                              type="button"
                              onClick={() => setQuickExecuteProposal(proposal)}
                              className="px-2.5 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                              title="Execute approved proposal"
                            >
                              <Play className="w-3 h-3 fill-emerald-800" />
                              <span>Execute</span>
                            </button>
                          )}

                          {/* Primary Review & Diff Button */}
                          <AdminButton
                            variant="secondary"
                            onClick={() => setSelectedProposalId(proposal.id)}
                            leftIcon={<Eye className="w-3.5 h-3.5 text-gray-500" />}
                            className="!py-1 !px-2.5 !text-[11px]"
                          >
                            Review & Diff
                          </AdminButton>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Server-Side Pagination Footer */}
        {totalRecords > 0 && (
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
            limitOptions={[10, 25, 50]}
          />
        )}
      </div>

      {/* Proposal Detail Review Modal */}
      {selectedProposalId && (
        <ProposalDetailModal
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
              `• Target Field: ${quickExecuteProposal.targetField}\n` +
              `• Live Stale Check: Will verify baseline matches live content ✓\n` +
              `• Sacred Content: Lyrics and titles remain immutable ✓\n\n` +
              `This action cannot be automatically reversed.`
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
      {quickRejectProposal && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 max-w-md w-full p-6 space-y-4">
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
                className="px-3.5 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
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
        </div>
      )}
    </div>
  );
};
