import React, { useState, useMemo } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  FileText,
  Music,
  Calendar,
  BookOpen,
  FolderTree,
  ArrowRight,
  Copy,
  Check,
  Play,
  RotateCcw,
  FileDiff,
  Layers,
  History,
  Hash,
  Tag,
  User,
  Bot,
  AlertTriangle,
  Info
} from 'lucide-react';
import { FormattedContentPreview } from '@admin/components/FormattedContentPreview';
import { AdminButton } from '@admin/components/AdminButton';
import { CustomLoader } from '@components/common/CustomLoader';
import { ConfirmDialog } from '@components/ui/ConfirmDialog';
import { ProposalApi, type AgentProposalItem, type AgentProposalDetail } from './ProposalApi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface ProposalDetailModalProps {
  proposalId: string | null;
  onClose: () => void;
  onStatusChanged?: () => void;
}

export const ProposalDetailModal: React.FC<ProposalDetailModalProps> = ({ proposalId, onClose, onStatusChanged }) => {
  const queryClient = useQueryClient();
  const [copiedId, setCopiedId] = useState(false);
  const [diffViewMode, setDiffViewMode] = useState<'side-by-side' | 'stacked'>('side-by-side');
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isExecuteOpen, setIsExecuteOpen] = useState(false);
  const [staleErrorNotice, setStaleErrorNotice] = useState<string | null>(null);

  // Fetch full proposal detail (including audit run and tool calls)
  const {
    data: proposal,
    isLoading,
    refetch,
    isFetching
  } = useQuery({
    queryKey: ['admin-agent-proposal-detail', proposalId],
    queryFn: async () => {
      if (!proposalId) return null;
      return await ProposalApi.getProposalById(proposalId);
    },
    enabled: !!proposalId
  });

  // Approve Mutation (PENDING -> APPROVED)
  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      return await ProposalApi.approveProposal(id);
    },
    onSuccess: () => {
      toast.success('Proposal approved! Ready for explicit execution.');
      queryClient.invalidateQueries({ queryKey: ['admin-agent-proposals'] });
      queryClient.invalidateQueries({ queryKey: ['admin-agent-proposal-stats'] });
      refetch();
      if (onStatusChanged) onStatusChanged();
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
      toast.success('Proposal rejected successfully.');
      setIsRejectOpen(false);
      setRejectionReason('');
      queryClient.invalidateQueries({ queryKey: ['admin-agent-proposals'] });
      queryClient.invalidateQueries({ queryKey: ['admin-agent-proposal-stats'] });
      refetch();
      if (onStatusChanged) onStatusChanged();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to reject proposal');
    }
  });

  // Execute Mutation (APPROVED -> EXECUTING -> COMPLETED)
  const executeMutation = useMutation({
    mutationFn: async (id: string) => {
      setStaleErrorNotice(null);
      return await ProposalApi.executeProposal(id);
    },
    onSuccess: () => {
      toast.success('Proposal executed! Changes applied successfully through ToolGateway.');
      setIsExecuteOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-agent-proposals'] });
      queryClient.invalidateQueries({ queryKey: ['admin-agent-proposal-stats'] });
      refetch();
      if (onStatusChanged) onStatusChanged();
    },
    onError: (err: any) => {
      setIsExecuteOpen(false);
      const statusCode = err.response?.status;
      const msg = err.response?.data?.message || err.message;
      if (statusCode === 409 || msg?.includes('Stale proposal') || msg?.includes('409')) {
        setStaleErrorNotice(
          'This proposal is no longer based on the current content and cannot be executed (Content has changed since proposal creation). Proposal marked as FAILED.'
        );
        toast.error('Stale proposal conflict (409): Content has changed.');
      } else {
        toast.error(msg || 'Failed to execute proposal');
      }
      queryClient.invalidateQueries({ queryKey: ['admin-agent-proposals'] });
      queryClient.invalidateQueries({ queryKey: ['admin-agent-proposal-stats'] });
      refetch();
      if (onStatusChanged) onStatusChanged();
    }
  });

  const handleCopyId = () => {
    if (proposal?.id) {
      navigator.clipboard.writeText(proposal.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  // Parse JSON values safely
  const parseJsonValue = (val?: string) => {
    if (!val) return null;
    try {
      return JSON.parse(val);
    } catch {
      return null;
    }
  };

  const currentParsed = useMemo(() => parseJsonValue(proposal?.currentValue), [proposal?.currentValue]);
  const proposedParsed = useMemo(() => parseJsonValue(proposal?.proposedValue), [proposal?.proposedValue]);

  // Derived content safety metrics
  const safetyMetrics = useMemo(() => {
    if (!proposal) return null;
    const currentText = proposal.currentValue || '';
    const proposedText = proposal.proposedValue || '';

    const cleanCurrent = currentText.replace(/<[^>]*>/g, ' ').trim();
    const cleanProposed = proposedText.replace(/<[^>]*>/g, ' ').trim();

    const currentChars = currentText.length;
    const proposedChars = proposedText.length;
    const currentWords = cleanCurrent ? cleanCurrent.split(/\s+/).filter(Boolean).length : 0;
    const proposedWords = cleanProposed ? cleanProposed.split(/\s+/).filter(Boolean).length : 0;

    const charDelta = proposedChars - currentChars;
    const retentionPct = currentChars > 0 ? ((proposedChars / currentChars) * 100).toFixed(1) : '100.0';

    // Count headings
    const currentHeadings = (currentText.match(/<h[1-6]/gi) || []).length;
    const proposedHeadings = (proposedText.match(/<h[1-6]/gi) || []).length;

    const isLongForm = [
      'content',
      'excerpt',
      'content_en',
      'excerpt_en',
      'short_description',
      'description',
      'description_en'
    ].includes(proposal.targetField);

    const isSubstantiveRetentionPassed = currentChars === 0 || parseFloat(retentionPct) >= 70;

    return {
      currentChars,
      proposedChars,
      currentWords,
      proposedWords,
      charDelta,
      retentionPct,
      currentHeadings,
      proposedHeadings,
      isLongForm,
      isSubstantiveRetentionPassed
    };
  }, [proposal]);

  if (!proposalId) return null;

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'bhajan':
        return <Music className="w-5 h-5" />;
      case 'article':
        return <FileText className="w-5 h-5" />;
      case 'festival':
        return <Calendar className="w-5 h-5" />;
      case 'puran':
        return <BookOpen className="w-5 h-5" />;
      case 'category':
        return <FolderTree className="w-5 h-5" />;
      default:
        return <Tag className="w-5 h-5" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5" /> Pending Approval
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Approved (Ready)
          </span>
        );
      case 'EXECUTING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200 animate-pulse">
            <RotateCcw className="w-3.5 h-3.5 animate-spin" /> Executing
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Completed
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" /> Failed
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gray-100 text-gray-700 border border-gray-200">
            <XCircle className="w-3.5 h-3.5" /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const isPending = proposal?.status === 'PENDING';
  const isApproved = proposal?.status === 'APPROVED';
  const isExecuting = proposal?.status === 'EXECUTING' || executeMutation.isPending;
  const isCompleted = proposal?.status === 'COMPLETED';
  const isFailed = proposal?.status === 'FAILED';
  const isRejected = proposal?.status === 'REJECTED';

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
          {/* Modal Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-white via-amber-50/40 to-orange-50/30 border-b border-gray-200 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-saffron/10 text-saffron flex items-center justify-center shrink-0 border border-saffron/20 shadow-xs">
                {proposal ? getEntityIcon(proposal.entityType) : <Tag className="w-5 h-5" />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wider text-saffron bg-saffron/10 px-2 py-0.5 rounded">
                    {proposal?.entityType || 'Entity'}
                  </span>
                  <span className="text-xs text-gray-400">&bull;</span>
                  <span className="text-xs font-mono font-medium text-gray-500">
                    Field: <strong className="text-gray-900">{proposal?.targetField}</strong>
                  </span>
                  {proposal && getStatusBadge(proposal.status)}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate mt-0.5">
                  {proposal?.targetEntity?.title || proposal?.targetTitle || `Entity ID: ${proposal?.entityId}`}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                title="Close review modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-200">
            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <CustomLoader />
                <p className="text-xs text-gray-500">Loading proposal detail and audit timeline...</p>
              </div>
            ) : !proposal ? (
              <div className="py-12 text-center text-gray-500">Proposal not found.</div>
            ) : (
              <>
                {/* Stale Error Notice Banner */}
                {staleErrorNotice && (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-rose-900 flex items-start gap-3 shadow-xs">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-bold">Execution Blocked: Stale Baseline Content</p>
                      <p className="mt-1 text-rose-800">{staleErrorNotice}</p>
                      <p className="mt-1 text-xs text-rose-700">
                        Recommendation: Reject this proposal and trigger a fresh proposal based on the current live
                        content.
                      </p>
                    </div>
                  </div>
                )}

                {/* Identity & Metadata Card */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs">
                  <div>
                    <span className="text-gray-400 block font-medium">Proposal ID</span>
                    <button
                      type="button"
                      onClick={handleCopyId}
                      className="font-mono font-semibold text-gray-800 hover:text-saffron flex items-center gap-1 mt-0.5 text-[11px]"
                      title="Copy Proposal ID"
                    >
                      <span className="truncate max-w-[120px]">{proposal.id}</span>
                      {copiedId ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3 text-gray-400" />
                      )}
                    </button>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-medium">Generating Agent</span>
                    <span className="font-semibold text-gray-800 flex items-center gap-1 mt-0.5">
                      <Bot className="w-3.5 h-3.5 text-saffron" /> {proposal.agentName}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-medium">Created At</span>
                    <span className="font-medium text-gray-700 block mt-0.5">{formatDate(proposal.createdAt)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-medium">Reviewed By</span>
                    <span className="font-semibold text-gray-800 flex items-center gap-1 mt-0.5">
                      <User className="w-3.5 h-3.5 text-gray-400" /> {proposal.reviewedBy || '-'}
                    </span>
                  </div>
                </div>

                {/* Content Safety & Governance Information */}
                {safetyMetrics?.isLongForm && (
                  <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-4 text-xs space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="font-bold text-amber-950 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                        <ShieldCheck className="w-4 h-4 text-amber-700" /> Long-Form Content Safety Metrics
                      </span>
                      <span
                        className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                          safetyMetrics.isSubstantiveRetentionPassed
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {safetyMetrics.isSubstantiveRetentionPassed
                          ? '✓ Substantive Retention Verified'
                          : '⚠ Significant Reduction Detected'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/80 p-3 rounded-lg border border-amber-200/50">
                      <div>
                        <span className="text-gray-500 block">Original Length:</span>
                        <p className="font-bold text-gray-800 mt-0.5">
                          {safetyMetrics.currentChars.toLocaleString()} chars ({safetyMetrics.currentWords} words)
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Proposed Length:</span>
                        <p className="font-bold text-gray-800 mt-0.5">
                          {safetyMetrics.proposedChars.toLocaleString()} chars ({safetyMetrics.proposedWords} words)
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Retention Ratio:</span>
                        <p className="font-bold text-amber-900 mt-0.5">{safetyMetrics.retentionPct}%</p>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Character Delta:</span>
                        <p
                          className={`font-bold mt-0.5 ${
                            safetyMetrics.charDelta >= 0 ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {safetyMetrics.charDelta >= 0 ? `+${safetyMetrics.charDelta}` : safetyMetrics.charDelta} chars
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-gray-600 text-[11px] pt-1">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Sacred verses & titles protected & immutable</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>
                          Headings: {safetyMetrics.currentHeadings} orig &rarr; {safetyMetrics.proposedHeadings} prop
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>YouTube devotional media excluded</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* AI Reasoning / Explanation */}
                {proposal.reasoning && (
                  <div className="bg-blue-50/50 border border-blue-200/70 rounded-xl p-4 text-xs">
                    <span className="font-bold text-blue-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-700" /> AI Rationale & Analysis
                    </span>
                    <p className="mt-1.5 text-blue-950 leading-relaxed font-sans text-xs sm:text-sm">
                      {proposal.reasoning}
                    </p>
                  </div>
                )}

                {/* Rejection Reason if Rejected */}
                {proposal.rejectionReason && (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs">
                    <span className="font-bold text-rose-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <XCircle className="w-3.5 h-3.5 text-rose-700" /> Rejection Reason
                    </span>
                    <p className="mt-1 text-rose-950 font-sans text-xs sm:text-sm">{proposal.rejectionReason}</p>
                  </div>
                )}

                {/* Before / After Diff Header & View Mode Selector */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2 border-b border-gray-200 pb-2">
                    <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <FileDiff className="w-4 h-4 text-saffron" />
                      Visual Content Comparison (Before vs After)
                    </h4>

                    <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg border border-gray-200 text-xs">
                      <button
                        type="button"
                        onClick={() => setDiffViewMode('side-by-side')}
                        className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                          diffViewMode === 'side-by-side'
                            ? 'bg-white text-gray-900 shadow-xs'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Side-by-Side
                      </button>
                      <button
                        type="button"
                        onClick={() => setDiffViewMode('stacked')}
                        className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                          diffViewMode === 'stacked'
                            ? 'bg-white text-gray-900 shadow-xs'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Stacked
                      </button>
                    </div>
                  </div>

                  {/* SEO Metadata Diff */}
                  {proposal.targetField === 'seo_metadata' && (currentParsed || proposedParsed) ? (
                    <div
                      className={`grid ${
                        diffViewMode === 'side-by-side' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
                      } gap-4 bg-gray-50/70 p-4 rounded-xl border border-gray-200`}
                    >
                      {/* Current SEO Baseline */}
                      <div className="space-y-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-gray-400"></span> CURRENT / ORIGINAL SEO
                        </span>
                        <div className="space-y-3 text-xs sm:text-sm text-gray-700 bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
                          <div>
                            <span className="text-xs font-bold text-gray-500 block uppercase tracking-wide">
                              SEO Title:
                            </span>
                            <p className="mt-1 font-medium text-gray-900">
                              {currentParsed?.seoTitle || <span className="text-gray-400 italic">None (Empty)</span>}
                            </p>
                          </div>
                          <div className="pt-3 border-t border-gray-100">
                            <span className="text-xs font-bold text-gray-500 block uppercase tracking-wide">
                              Meta Description:
                            </span>
                            <p className="mt-1 text-gray-700 leading-relaxed">
                              {currentParsed?.seoDescription || (
                                <span className="text-gray-400 italic">None (Empty)</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Proposed SEO Improvement */}
                      <div className="space-y-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-saffron flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-saffron"></span> AI PROPOSED CHANGE (SEO)
                        </span>
                        <div className="space-y-3 text-xs sm:text-sm text-gray-900 bg-amber-50/60 p-4 rounded-xl border border-amber-200 shadow-2xs">
                          <div>
                            <span className="text-xs font-bold text-amber-900 block uppercase tracking-wide">
                              SEO Title:
                            </span>
                            <p className="mt-1 font-bold text-gray-900">
                              {proposedParsed?.seoTitle || proposal.proposedValue}
                            </p>
                          </div>
                          <div className="pt-3 border-t border-amber-200/60">
                            <span className="text-xs font-bold text-amber-900 block uppercase tracking-wide">
                              Meta Description:
                            </span>
                            <p className="mt-1 text-gray-800 leading-relaxed">
                              {proposedParsed?.seoDescription || '-'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Standard Content / Meaning Diff */
                    <div
                      className={`grid ${
                        diffViewMode === 'side-by-side' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
                      } gap-4 bg-gray-50/70 p-4 rounded-xl border border-gray-200`}
                    >
                      {/* Current Baseline */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-gray-400"></span> CURRENT / ORIGINAL VALUE
                          </span>
                          <span className="text-[11px] text-gray-400 font-mono">
                            {(proposal.currentValue || '').length} chars
                          </span>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
                          <FormattedContentPreview
                            content={proposal.currentValue}
                            field={proposal.targetField}
                            maxHeightClass="max-h-[500px]"
                          />
                        </div>
                      </div>

                      {/* Proposed Value */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-saffron flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-saffron"></span> AI PROPOSED CHANGE
                          </span>
                          <span className="text-[11px] text-amber-800 font-mono font-medium">
                            {(proposal.proposedValue || '').length} chars
                          </span>
                        </div>
                        <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200 shadow-2xs">
                          <FormattedContentPreview
                            content={proposal.proposedValue}
                            field={proposal.targetField}
                            isProposed
                            maxHeightClass="max-h-[500px]"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Audit Timeline Section */}
                <div className="bg-gray-50/80 border border-gray-200 rounded-xl p-4 text-xs space-y-3">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-gray-500" /> Audit Lifecycle Timeline
                  </h4>

                  <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                    {/* Event 1: Created */}
                    <div className="relative">
                      <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-saffron flex items-center justify-center text-white ring-4 ring-white">
                        <Sparkles className="w-2.5 h-2.5" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">
                          AI Proposal Staged{' '}
                          <span className="text-gray-500 font-normal">by agent {proposal.agentName}</span>
                        </p>
                        <p className="text-[11px] text-gray-500 mt-0.5">{formatDate(proposal.createdAt)}</p>
                        {proposal.run && (
                          <p className="text-[11px] text-gray-600 mt-0.5">
                            Run ID: <code className="font-mono text-gray-800">{proposal.run.id}</code> (
                            {proposal.run.triggerType} trigger by {proposal.run.triggeredBy || 'system'})
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Event 2: Reviewed (if approved or rejected) */}
                    {(proposal.reviewedAt || proposal.reviewedBy) && (
                      <div className="relative">
                        <div
                          className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full flex items-center justify-center text-white ring-4 ring-white ${
                            proposal.status === 'REJECTED' ? 'bg-rose-500' : 'bg-blue-600'
                          }`}
                        >
                          {proposal.status === 'REJECTED' ? (
                            <XCircle className="w-2.5 h-2.5" />
                          ) : (
                            <CheckCircle2 className="w-2.5 h-2.5" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">
                            {proposal.status === 'REJECTED' ? 'Rejected' : 'Approved'}{' '}
                            <span className="text-gray-500 font-normal">by {proposal.reviewedBy || 'Admin'}</span>
                          </p>
                          <p className="text-[11px] text-gray-500 mt-0.5">{formatDate(proposal.reviewedAt)}</p>
                        </div>
                      </div>
                    )}

                    {/* Event 3: Executed / Completed / Failed */}
                    {(isCompleted || isFailed || isExecuting) && (
                      <div className="relative">
                        <div
                          className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full flex items-center justify-center text-white ring-4 ring-white ${
                            isCompleted ? 'bg-emerald-600' : isFailed ? 'bg-rose-600' : 'bg-purple-600'
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-2.5 h-2.5" />
                          ) : isFailed ? (
                            <XCircle className="w-2.5 h-2.5" />
                          ) : (
                            <RotateCcw className="w-2.5 h-2.5" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">
                            {isCompleted
                              ? 'Executed & Applied Live'
                              : isFailed
                                ? 'Execution Failed'
                                : 'Execution In Progress'}
                          </p>
                          <p className="text-[11px] text-gray-500 mt-0.5">{formatDate(proposal.updatedAt)}</p>
                          {proposal.toolCalls && proposal.toolCalls.length > 0 && (
                            <div className="mt-1.5 space-y-1">
                              <p className="text-[11px] font-semibold text-gray-700">Executed Tool Calls:</p>
                              {proposal.toolCalls.map((tc) => (
                                <div
                                  key={tc.id}
                                  className="text-[11px] font-mono bg-white p-1.5 rounded border border-gray-200 flex items-center justify-between"
                                >
                                  <span>
                                    {tc.toolName} ({tc.durationMs}ms)
                                  </span>
                                  <span
                                    className={`px-1 rounded text-[10px] font-bold ${
                                      tc.status === 'SUCCESS'
                                        ? 'text-emerald-700 bg-emerald-50'
                                        : 'text-rose-700 bg-rose-50'
                                    }`}
                                  >
                                    {tc.status}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Modal Footer / Action Workflow */}
          {proposal && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between flex-wrap gap-3 shrink-0">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Tier-5 Live Mutation requires explicit approval + execution</span>
              </div>

              <div className="flex items-center gap-2">
                {isPending && (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsRejectOpen(true)}
                      disabled={rejectMutation.isPending || approveMutation.isPending}
                      className="px-4 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      Reject Proposal
                    </button>
                    <AdminButton
                      variant="primary"
                      onClick={() => approveMutation.mutate(proposal.id)}
                      isLoading={approveMutation.isPending}
                      leftIcon={<CheckCircle2 className="w-4 h-4" />}
                    >
                      Approve Proposal
                    </AdminButton>
                  </>
                )}

                {isApproved && (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsRejectOpen(true)}
                      disabled={executeMutation.isPending}
                      className="px-3.5 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      Reject
                    </button>
                    <AdminButton
                      variant="primary"
                      onClick={() => setIsExecuteOpen(true)}
                      isLoading={executeMutation.isPending}
                      leftIcon={<Play className="w-4 h-4 fill-white" />}
                      className="!bg-emerald-600 hover:!bg-emerald-700"
                    >
                      Execute Change
                    </AdminButton>
                  </>
                )}

                {isExecuting && (
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-700">
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    <span>Applying changes through ToolGateway...</span>
                  </div>
                )}

                {isCompleted && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" /> Changes Applied
                  </span>
                )}

                {isFailed && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700">
                    <XCircle className="w-4 h-4" /> Execution Failed
                  </span>
                )}

                {isRejected && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600">
                    <XCircle className="w-4 h-4" /> Proposal Rejected
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Execution Confirmation Dialog (Section 10) */}
      <ConfirmDialog
        isOpen={isExecuteOpen}
        title="Execute AI Proposal?"
        message={
          proposal
            ? `This action will apply the approved AI proposed changes to live production content via ToolGateway.\n\n` +
              `• Entity: ${proposal.entityType.toUpperCase()} (${proposal.targetEntity?.title || proposal.entityId})\n` +
              `• Target Field: ${proposal.targetField}\n` +
              `• Human Approval: Approved ✓\n` +
              `• Stale Protection: Live content will be verified before mutation ✓\n` +
              `• Sacred Firewall: Sacred lyrics and titles remain immutable ✓\n\n` +
              `This action cannot be automatically reversed.`
            : ''
        }
        confirmText="Confirm & Apply Mutation"
        cancelText="Cancel"
        onConfirm={() => {
          if (proposal) executeMutation.mutate(proposal.id);
        }}
        onCancel={() => setIsExecuteOpen(false)}
      />

      {/* Reject Confirmation Modal with Reason Input (Section 12) */}
      {isRejectOpen && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 max-w-md w-full p-6 space-y-4">
            <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-600" /> Reject AI Proposal
            </h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              Are you sure you want to reject this proposal? Rejected proposals cannot be executed and will not modify
              any live content.
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
                onClick={() => setIsRejectOpen(false)}
                className="px-3.5 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <AdminButton
                variant="danger"
                onClick={() => {
                  if (proposal) rejectMutation.mutate({ id: proposal.id, reason: rejectionReason });
                }}
                isLoading={rejectMutation.isPending}
              >
                Confirm Rejection
              </AdminButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
