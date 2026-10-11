import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProposalApi, type AgentProposalItem } from './ProposalApi';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Play,
  RotateCcw,
  Music,
  FileCheck,
  FileText,
  Calendar,
  BookOpen,
  Tag,
  Globe
} from 'lucide-react';
import toast from 'react-hot-toast';
import { CustomLoader } from '@components/common/CustomLoader';
import { AdminButton } from '@admin/components/AdminButton';

export function ProposalReviewSection() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [rejectingProposalId, setRejectingProposalId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [executingProposalId, setExecutingProposalId] = useState<string | null>(null);

  // Fetch proposals
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-agent-proposals', statusFilter],
    queryFn: async () => {
      const statusParam = statusFilter === 'ALL' ? undefined : statusFilter;
      return await ProposalApi.getProposals({ status: statusParam, limit: 50 });
    },
    refetchInterval: 8000
  });

  const proposals: AgentProposalItem[] = data?.data || [];

  // Approve Mutation (PENDING -> APPROVED)
  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      return await ProposalApi.approveProposal(id);
    },
    onSuccess: () => {
      toast.success('Proposal approved! Ready for controlled execution.');
      queryClient.invalidateQueries({ queryKey: ['admin-agent-proposals'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to approve proposal');
    }
  });

  // Reject Mutation (PENDING or APPROVED -> REJECTED)
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      return await ProposalApi.rejectProposal(id, reason);
    },
    onSuccess: () => {
      toast.success('Proposal rejected successfully.');
      setRejectingProposalId(null);
      setRejectionReason('');
      queryClient.invalidateQueries({ queryKey: ['admin-agent-proposals'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to reject proposal');
    }
  });

  // Execute Mutation (APPROVED -> EXECUTING -> COMPLETED)
  const executeMutation = useMutation({
    mutationFn: async (id: string) => {
      setExecutingProposalId(id);
      return await ProposalApi.executeProposal(id);
    },
    onSuccess: () => {
      toast.success('Proposal executed! Changes applied successfully through ToolGateway.');
      setExecutingProposalId(null);
      queryClient.invalidateQueries({ queryKey: ['admin-agent-proposals'] });
    },
    onError: (err: any) => {
      setExecutingProposalId(null);
      toast.error(err.response?.data?.message || 'Failed to execute proposal');
      queryClient.invalidateQueries({ queryKey: ['admin-agent-proposals'] });
    }
  });

  const getEntityIcon = (entityType: string, targetField: string) => {
    if (targetField.startsWith('seo')) {
      return <Globe className="w-4 h-4 text-emerald-600" />;
    }
    switch (entityType) {
      case 'bhajan':
        return <Music className="w-4 h-4" />;
      case 'article':
        return <FileText className="w-4 h-4" />;
      case 'festival':
        return <Calendar className="w-4 h-4" />;
      case 'puran':
        return <BookOpen className="w-4 h-4" />;
      case 'category':
        return <Tag className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-200">
            <Clock className="w-3.5 h-3.5 mr-1 text-amber-600" /> Pending Approval
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-900 border border-blue-200">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-blue-600" /> Approved (Ready)
          </span>
        );
      case 'EXECUTING':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-900 border border-indigo-200 animate-pulse">
            <Zap className="w-3.5 h-3.5 mr-1 text-indigo-600" /> Executing Mutation...
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-200">
            <FileCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Successfully Applied
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-900 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5 mr-1 text-rose-600" /> Execution Failed
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-300">
            <XCircle className="w-3.5 h-3.5 mr-1 text-gray-500" /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Explicit Safety Governance Notice */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4 text-amber-950 flex items-start gap-3 shadow-xs">
        <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm">
          <p className="font-semibold text-amber-900">Human Approval Architecture (Phase 4A & 4B)</p>
          <p className="mt-0.5 text-amber-800">
            AI-generated content is strictly a staged proposal and <strong>has not changed any live content</strong>. An
            administrator must explicitly approve the proposal, and then execute it in a separate step. Sacred verses,
            lyrics, and titles remain protected and immutable.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3 border-b border-gray-200 pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1">
          {[
            { id: 'PENDING', label: 'Pending Approval' },
            { id: 'APPROVED', label: 'Approved (Ready)' },
            { id: 'COMPLETED', label: 'Completed' },
            { id: 'FAILED', label: 'Failed' },
            { id: 'REJECTED', label: 'Rejected' },
            { id: 'ALL', label: 'All Proposals' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors shrink-0 ${
                statusFilter === tab.id
                  ? 'bg-saffron text-white shadow-xs'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Proposals List */}
      {isLoading ? (
        <div className="py-12 flex justify-center">
          <CustomLoader />
        </div>
      ) : proposals.length === 0 ? (
        <div className="py-12 text-center bg-white rounded-lg border border-gray-200 p-8">
          <Sparkles className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-700">No Proposals Found</h3>
          <p className="text-xs text-gray-500 mt-1">
            There are currently no proposals matching status &ldquo;{statusFilter}&rdquo;.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {proposals.map((proposal) => {
            const isPending = proposal.status === 'PENDING';
            const isApproved = proposal.status === 'APPROVED';
            const isExecuting = proposal.status === 'EXECUTING' || executingProposalId === proposal.id;

            // Helper to parse JSON values safely
            const parseJsonValue = (val?: string) => {
              if (!val) return null;
              try {
                return JSON.parse(val);
              } catch {
                return null;
              }
            };

            const currentParsed = parseJsonValue(proposal.currentValue);
            const proposedParsed = parseJsonValue(proposal.proposedValue);

            return (
              <div
                key={proposal.id}
                className="bg-white border border-gray-200 rounded-lg shadow-xs hover:border-gray-300 transition-all p-4 sm:p-5 space-y-4"
              >
                {/* Proposal Header */}
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-saffron/10 text-saffron rounded-md">
                      {getEntityIcon(proposal.entityType, proposal.targetField)}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                          {proposal.entityType}
                        </span>
                        <span className="text-xs text-gray-400">&bull;</span>
                        <span className="text-xs text-gray-400">Field: {proposal.targetField}</span>
                      </div>
                      <h4 className="text-sm sm:text-base font-bold text-gray-900 mt-0.5">
                        {proposal.targetTitle || `Target Entity: ${proposal.entityId}`}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(proposal.status)}
                    <span className="text-xs text-gray-400">{formatDate(proposal.createdAt)}</span>
                  </div>
                </div>

                {/* Content Comparison: CURRENT vs PROPOSED */}
                {proposal.targetField === 'seo_metadata' && (currentParsed || proposedParsed) ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 bg-gray-50/60 p-3.5 rounded-lg border border-gray-100">
                    {/* Current SEO Baseline */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-gray-400"></span> Current SEO Metadata
                      </span>
                      <div className="space-y-2 text-xs sm:text-sm text-gray-700 bg-white p-3 rounded-md border border-gray-200">
                        <div>
                          <span className="text-xs font-semibold text-gray-500 block">SEO Title:</span>
                          <p className="mt-0.5">
                            {currentParsed?.seoTitle || <span className="text-gray-400 italic">None</span>}
                          </p>
                        </div>
                        <div className="pt-2 border-t border-gray-100">
                          <span className="text-xs font-semibold text-gray-500 block">Meta Description:</span>
                          <p className="mt-0.5">
                            {currentParsed?.seoDescription || <span className="text-gray-400 italic">None</span>}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Proposed SEO Improvement */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-saffron flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-saffron"></span> Proposed SEO Metadata (AI)
                      </span>
                      <div className="space-y-2 text-xs sm:text-sm text-gray-900 bg-amber-50/50 p-3 rounded-md border border-amber-200">
                        <div>
                          <span className="text-xs font-semibold text-amber-800 block">SEO Title:</span>
                          <p className="mt-0.5 font-medium">{proposedParsed?.seoTitle || proposal.proposedValue}</p>
                        </div>
                        <div className="pt-2 border-t border-amber-200/60">
                          <span className="text-xs font-semibold text-amber-800 block">Meta Description:</span>
                          <p className="mt-0.5">{proposedParsed?.seoDescription || '-'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 bg-gray-50/60 p-3.5 rounded-lg border border-gray-100">
                    {/* Current Baseline Value */}
                    <div className="space-y-1.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-gray-400"></span> Current{' '}
                        {proposal.targetField === 'meaning' ? 'Meaning' : proposal.targetField}
                      </span>
                      <div className="text-xs sm:text-sm text-gray-700 bg-white p-3 rounded-md border border-gray-200 max-h-48 overflow-y-auto leading-relaxed">
                        {proposal.currentValue && proposal.currentValue.trim() !== '' ? (
                          proposal.currentValue
                        ) : (
                          <span className="text-gray-400 italic">None (Empty field)</span>
                        )}
                      </div>
                    </div>

                    {/* Proposed New Value */}
                    <div className="space-y-1.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-saffron flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-saffron"></span> Proposed{' '}
                        {proposal.targetField === 'meaning' ? 'Meaning' : proposal.targetField} (AI)
                      </span>
                      <div className="text-xs sm:text-sm text-gray-900 bg-amber-50/50 p-3 rounded-md border border-amber-200 max-h-48 overflow-y-auto leading-relaxed font-serif">
                        {proposal.proposedValue}
                      </div>
                    </div>
                  </div>
                )}

                {/* AI Reasoning */}
                {proposal.reasoning && (
                  <div className="text-xs text-gray-600 bg-blue-50/40 p-2.5 rounded-md border border-blue-100/70 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-blue-900">AI Reasoning:</strong> {proposal.reasoning}
                    </span>
                  </div>
                )}

                {/* Review / Rejection / Execution Metadata */}
                <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-gray-100 text-xs text-gray-500">
                  <div className="space-y-0.5">
                    {proposal.reviewedBy && (
                      <p>
                        Reviewed by <strong className="text-gray-700">{proposal.reviewedBy}</strong> on{' '}
                        {formatDate(proposal.reviewedAt || '')}
                      </p>
                    )}
                    {proposal.rejectionReason && (
                      <p className="text-rose-600">
                        <strong>Reason / Error:</strong> {proposal.rejectionReason}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    {/* PENDING State: Approve or Reject */}
                    {isPending && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setRejectingProposalId(proposal.id);
                            setRejectionReason('');
                          }}
                          className="px-3 py-1.5 text-xs font-semibold text-rose-600 bg-white border border-rose-300 rounded-md hover:bg-rose-50 transition-colors"
                        >
                          Reject
                        </button>
                        <AdminButton
                          variant="secondary"
                          size="sm"
                          onClick={() => approveMutation.mutate(proposal.id)}
                          isLoading={approveMutation.isPending}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve
                        </AdminButton>
                      </>
                    )}

                    {/* APPROVED State: Execute Mutation */}
                    {isApproved && (
                      <AdminButton
                        variant="primary"
                        size="sm"
                        onClick={() => executeMutation.mutate(proposal.id)}
                        isLoading={isExecuting}
                      >
                        <Play className="w-3.5 h-3.5 mr-1 fill-current" /> Execute Mutation
                      </AdminButton>
                    )}

                    {/* EXECUTING State */}
                    {isExecuting && (
                      <span className="text-xs text-indigo-600 font-medium flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 animate-spin" /> Executing...
                      </span>
                    )}
                  </div>
                </div>

                {/* Rejection Input Drawer */}
                {rejectingProposalId === proposal.id && (
                  <div className="mt-3 p-3 bg-rose-50/60 rounded-md border border-rose-200 space-y-2">
                    <label className="text-xs font-medium text-rose-900 block">Rejection Reason (Optional):</label>
                    <input
                      type="text"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="e.g. Meaning does not match traditional Sampradaya commentary"
                      className="w-full text-xs px-3 py-1.5 bg-white border border-rose-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setRejectingProposalId(null)}
                        className="px-2.5 py-1 text-xs text-gray-600 hover:text-gray-900"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => rejectMutation.mutate({ id: proposal.id, reason: rejectionReason })}
                        disabled={rejectMutation.isPending}
                        className="px-3 py-1 text-xs font-semibold text-white bg-rose-600 rounded-md hover:bg-rose-700"
                      >
                        Confirm Rejection
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
