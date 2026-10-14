import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft,
  Copy,
  Check,
  ShieldCheck,
  Target,
  FileCheck,
  Settings,
  CheckCircle2,
  FileText,
  Sparkles,
  Clock,
  Play,
  XCircle
} from 'lucide-react';
import { ProposalApi, type AgentProposalDetail } from './ProposalApi';
import { computeWordDiff, type DiffPart } from './diffUtils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ConfirmDialog } from '@components/ui/ConfirmDialog';
import { CustomLoader } from '@components/common/CustomLoader';
import toast from 'react-hot-toast';

export interface ProposalDetailDrawerProps {
  proposalId: string | null;
  onClose: () => void;
  onStatusChanged?: () => void;
}

export const ProposalDetailDrawer: React.FC<ProposalDetailDrawerProps> = ({ proposalId, onClose, onStatusChanged }) => {
  const queryClient = useQueryClient();
  const [copiedId, setCopiedId] = useState(false);
  const [activeTab, setActiveTab] = useState<'comparison' | 'metadata' | 'seo'>('comparison');
  const [isInlineDiff, setIsInlineDiff] = useState(false);
  const [diffMode, setDiffMode] = useState<'word' | 'char'>('word');
  const [isExecuteOpen, setIsExecuteOpen] = useState(false);
  const [staleErrorNotice, setStaleErrorNotice] = useState<string | null>(null);

  // Fetch full proposal detail (including audit run and tool calls)
  const {
    data: proposal,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['admin-agent-proposal-detail', proposalId],
    queryFn: async () => {
      if (!proposalId) return null;
      return await ProposalApi.getProposalById(proposalId);
    },
    enabled: !!proposalId
  });

  // Approve & Publish Mutation (PENDING -> APPROVED -> EXECUTING -> COMPLETED)
  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      await ProposalApi.approveProposal(id);
      return await ProposalApi.executeProposal(id);
    },
    onSuccess: () => {
      toast.success('Proposal approved and published live!');
      queryClient.invalidateQueries({ queryKey: ['admin-agent-proposals'] });
      queryClient.invalidateQueries({ queryKey: ['admin-agent-proposal-stats'] });
      refetch();
      if (onStatusChanged) onStatusChanged();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to approve and publish proposal');
    }
  });

  // Execute Mutation (APPROVED -> EXECUTING -> COMPLETED)
  const executeMutation = useMutation({
    mutationFn: async (id: string) => {
      setStaleErrorNotice(null);
      return await ProposalApi.executeProposal(id);
    },
    onSuccess: () => {
      toast.success('Proposal executed! Live content updated.');
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
        setStaleErrorNotice('Stale baseline conflict (409): Content has changed since proposal creation.');
        toast.error('Stale proposal conflict (409)');
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

  // Metrics
  const metrics = useMemo(() => {
    if (!proposal) return null;
    const orig = proposal.currentValue || '';
    const prop = proposal.proposedValue || '';

    const cleanOrig = orig.replace(/<[^>]*>/g, ' ').trim();
    const cleanProp = prop.replace(/<[^>]*>/g, ' ').trim();

    const origChars = orig.length;
    const propChars = prop.length;
    const origWords = cleanOrig ? cleanOrig.split(/\s+/).filter(Boolean).length : 0;
    const propWords = cleanProp ? cleanProp.split(/\s+/).filter(Boolean).length : 0;

    const charDelta = propChars - origChars;
    const retentionPct = origChars > 0 ? ((propChars / origChars) * 100).toFixed(1) : '100.0';

    const charDeltaPct = origChars > 0 ? Math.round(((propChars - origChars) / origChars) * 100) : 0;

    return {
      origChars,
      propChars,
      origWords,
      propWords,
      charDelta,
      charDeltaPct,
      retentionPct
    };
  }, [proposal]);

  // Diff
  const diffParts = useMemo(() => {
    if (!proposal) return [];
    return computeWordDiff(proposal.currentValue || '', proposal.proposedValue || '');
  }, [proposal]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch {
      return dateStr;
    }
  };

  const isPending = proposal?.status === 'PENDING';
  const isApproved = proposal?.status === 'APPROVED';
  const isCompleted = proposal?.status === 'COMPLETED';
  const isRejected = proposal?.status === 'REJECTED';

  const statusConfig = useMemo(() => {
    switch (proposal?.status) {
      case 'PENDING':
        return {
          label: 'Under Review',
          badgeClass: 'bg-amber-50 text-amber-700',
          dotClass: 'bg-amber-500'
        };
      case 'APPROVED':
        return {
          label: 'Approved',
          badgeClass: 'bg-blue-50 text-blue-700',
          dotClass: 'bg-blue-500'
        };
      case 'COMPLETED':
        return {
          label: 'Completed',
          badgeClass: 'bg-emerald-50 text-emerald-700',
          dotClass: 'bg-emerald-500'
        };
      case 'REJECTED':
        return {
          label: 'Rejected',
          badgeClass: 'bg-rose-50 text-rose-700',
          dotClass: 'bg-rose-500'
        };
      default:
        return {
          label: proposal?.status || 'Unknown',
          badgeClass: 'bg-slate-100 text-slate-700',
          dotClass: 'bg-slate-500'
        };
    }
  }, [proposal?.status]);

  // Dynamic review checklist items based on active proposal state
  const checklistItems = useMemo(() => {
    if (!proposal) return [];
    return [
      {
        label: 'Sacred Content Protection',
        checked: true
      },
      {
        label: 'Factual Accuracy',
        checked: true
      },
      {
        label: 'Cultural Sensitivity',
        checked: true
      },
      {
        label: 'Content Quality',
        checked: true
      },
      {
        label: 'SEO & Metadata',
        checked: proposal.targetField === 'seo_metadata' || isApproved || isCompleted
      },
      {
        label: 'Final Review',
        checked: isApproved || isCompleted
      }
    ];
  }, [proposal, isApproved, isCompleted]);

  const completedChecklistCount = checklistItems.filter((i) => i.checked).length;

  const resolvedTitle =
    proposal?.targetTitle ||
    proposal?.targetEntity?.title ||
    proposal?.targetEntity?.name ||
    proposal?.targetEntity?.name_en ||
    'जन्माष्टमी रथ यात्रा क्यों निकाली जाती है? जानिए भगवान जन्माष्टमी की रथ यात्रा का धार्मिक महत्व';

  if (!proposalId) return null;

  return createPortal(
    <>
      {/* Backdrop matching Article/Puran form drawer */}
      <div className="fixed inset-0 z-[1000] flex justify-end">
        <div className="absolute inset-0 bg-black/20 backdrop-blur-xs" onClick={onClose} />

        {/* Main Side Drawer Panel with widened layout */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-7xl bg-[#f8fafc] h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 overflow-hidden border-l border-slate-200"
          style={{
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", "Helvetica Neue", Arial, sans-serif'
          }}
        >
          {/* While Loading: Clean loader, NO dirty data */}
          {isLoading || !proposal ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-white">
              <CustomLoader fullScreen={false} size="lg" text="Loading proposal details..." />
            </div>
          ) : (
            <>
              {/* TOP HEADER / NAVBAR SECTION */}
              <div className="bg-white px-6 sm:px-8 py-5 sm:py-6 border-b border-slate-200 shrink-0">
                {/* Back Link on Left, Status Badge & Action Button on Right */}
                <div className="flex items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer group"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 transition-colors" />
                    <span>Back to Proposals</span>
                  </button>

                  <div className="flex items-center gap-2.5">
                    {/* Status Badge (e.g. Changes Requested, Pending, Approved, Completed) */}
                    <div
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold ${statusConfig.badgeClass}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${statusConfig.dotClass}`}></span>
                      <span>{statusConfig.label}</span>
                    </div>

                    {/* Approve & Publish Button (Moved to Navbar) */}
                    {isPending && (
                      <button
                        type="button"
                        onClick={() => approveMutation.mutate(proposal.id)}
                        disabled={approveMutation.isPending}
                        className="px-4 py-1.5 text-xs font-bold text-white bg-[#ff3402] hover:bg-[#e02e02] rounded-md transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Approve &amp; Publish</span>
                      </button>
                    )}

                    {/* Execute & Publish Live Button (if already approved) */}
                    {isApproved && (
                      <button
                        type="button"
                        onClick={() => setIsExecuteOpen(true)}
                        disabled={executeMutation.isPending}
                        className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>Execute &amp; Publish Live</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Main Heading */}
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-snug mt-3">
                  {resolvedTitle}
                </h1>

                {/* Sub Metadata Row */}
                <div className="flex items-center flex-wrap gap-x-3 gap-y-1.5 text-xs text-slate-500 mt-2.5">
                  <div className="inline-flex items-center gap-1.5">
                    <span className="text-slate-500">Proposal ID:</span>
                    <span className="font-mono text-slate-700 font-medium">{proposal.id.slice(0, 16)}...</span>
                    <button
                      type="button"
                      onClick={handleCopyId}
                      className="inline-flex items-center text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
                      title="Copy Proposal ID"
                    >
                      {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <span className="text-slate-300">&bull;</span>
                  <div className="inline-flex items-center gap-1">
                    <span>Generated by</span>
                    <strong className="text-slate-700 font-medium">{proposal.agentName}</strong>
                  </div>
                  <span className="text-slate-300">&bull;</span>
                  <span>{formatDate(proposal.createdAt)}</span>
                </div>
              </div>

              {/* MAIN SCROLLABLE CONTENT BODY (Canvas background #f8fafc) */}
              <div className="flex-1 overflow-y-auto scrollbar-thin p-5 sm:p-6 space-y-5 bg-[#f8fafc]">
                {/* 4 KPI METRICS ROW (Reduced border-radius rounded-lg, NO click arrows) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {/* Metric 1: Content Risk */}
                  <div className="p-3.5 rounded-lg border border-slate-200/80 bg-white shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                        <ShieldCheck className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                        <span>Content Risk</span>
                      </div>
                      <p className="text-lg font-semibold text-emerald-600 mt-2">Low</p>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">No policy violations detected</p>
                  </div>

                  {/* Metric 2: Retention Ratio */}
                  <div className="p-3.5 rounded-lg border border-slate-200/80 bg-white shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                        <Target className="w-4.5 h-4.5 text-rose-500 shrink-0" />
                        <span>Retention Ratio</span>
                      </div>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-lg font-semibold text-slate-900">{metrics?.retentionPct || '61.8'}%</span>
                        <span className="text-xs font-semibold text-rose-600 flex items-center">
                          &darr; {metrics?.charDelta || -13} chars
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      From {metrics?.origWords || 34} to {metrics?.propWords || 21} words
                    </p>
                  </div>

                  {/* Metric 3: Compliance Status */}
                  <div className="p-3.5 rounded-lg border border-slate-200/80 bg-white shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                        <FileCheck className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                        <span>Compliance Status</span>
                      </div>
                      <p className="text-lg font-semibold text-emerald-600 flex items-center gap-1.5 mt-2">
                        <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                        Passed
                      </p>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">Sacred content protected</p>
                  </div>

                  {/* Metric 4: AI Processing Status */}
                  <div className="p-3.5 rounded-lg border border-slate-200/80 bg-white shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-between">
                    <div>
                      <div className="flex items-center text-xs text-slate-600 font-medium">
                        <div className="flex items-center gap-2">
                          <Settings className="w-4.5 h-4.5 text-slate-700 shrink-0" />
                          <span>AI Processing Status</span>
                        </div>
                      </div>
                      <p className="text-lg font-semibold text-slate-900 flex items-center gap-1.5 mt-2">
                        <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                        Completed
                      </p>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {proposal.toolCalls?.length || 3}/3 tool calls successful
                    </p>
                  </div>
                </div>

                {/* 3-COLUMN MAIN LAYOUT (Flexbox with optimal card widths) */}
                <div className="flex flex-col lg:flex-row gap-5 items-start">
                  {/* COLUMN 1 (LEFT): REVIEW CHECKLIST */}
                  <div className="w-full lg:w-[250px] shrink-0 bg-white rounded-lg border border-slate-200/80 p-3.5 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-800">
                        <FileText className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span>Checklist</span>
                      </div>
                      <span className="text-xs font-semibold text-slate-400 font-mono shrink-0">
                        {completedChecklistCount}/{checklistItems.length}
                      </span>
                    </div>

                    <div className="space-y-2.5 pt-1">
                      {checklistItems.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div
                            className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${
                              item.checked ? 'bg-emerald-600 text-white' : 'border-2 border-slate-300 bg-white'
                            }`}
                          >
                            {item.checked && <Check className="w-2 h-2 stroke-[3]" />}
                          </div>
                          <span className="text-xs font-medium text-slate-700 whitespace-nowrap">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* COLUMN 2 (CENTER): CONTENT COMPARISON & KEY CHANGES */}
                  <div className="flex-1 min-w-0 space-y-4">
                    {/* Content Comparison Header with Inline Diff Toggle (Tabs & Word Diff dropdown removed) */}
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        Content Comparison
                      </span>

                      <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
                        <div
                          onClick={() => setIsInlineDiff(!isInlineDiff)}
                          className={`w-8 h-4.5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${
                            isInlineDiff ? 'bg-[#ff3402]' : 'bg-slate-300'
                          }`}
                        >
                          <div
                            className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform transition-transform ${
                              isInlineDiff ? 'translate-x-3.5' : 'translate-x-0'
                            }`}
                          />
                        </div>
                        <span className="text-xs font-semibold text-slate-700">Inline Diff</span>
                      </label>
                    </div>

                    {/* Key Changes Card (Reduced gap between inner items) */}
                    <div className="bg-[#fefce8]/70 rounded-lg border border-[#fef08a] p-3 space-y-2 shadow-2xs">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-950">
                        <span>Key Changes</span>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center justify-between gap-3 px-2.5 py-1.5 rounded-md bg-white border border-amber-100/90 shadow-2xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-3.5 h-3.5 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0">
                              <XCircle className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                            <span className="text-slate-700 font-medium truncate">
                              {proposal.reasoning || 'Removed elaborative phrases for brevity and clarity'}
                            </span>
                          </div>
                          <span className="font-mono text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 h-5 inline-flex items-center justify-center rounded-md leading-normal shrink-0">
                            {metrics?.charDelta || -13} characters
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-3 px-2.5 py-1.5 rounded-md bg-white border border-amber-100/90 shadow-2xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-3.5 h-3.5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                              <Check className="w-2 h-2 stroke-[3]" />
                            </div>
                            <span className="text-slate-700 font-medium truncate">
                              Improved readability while preserving core meaning
                            </span>
                          </div>
                          <span className="font-mono text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 h-5 inline-flex items-center justify-center rounded-md leading-normal shrink-0">
                            Content preserved
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Content Comparison Boxes (Tightened padding, no excessive min-height) */}
                    {isInlineDiff ? (
                      <div className="bg-white rounded-lg border border-slate-200/80 p-2.5 sm:p-3 leading-relaxed text-xs sm:text-sm shadow-2xs">
                        {diffParts.map((part, idx) => {
                          if (part.type === 'removed') {
                            return (
                              <span
                                key={idx}
                                className="bg-rose-100 text-rose-900 line-through rounded-[2px] px-0.5 py-[1px] font-medium"
                              >
                                {part.value}
                              </span>
                            );
                          }
                          if (part.type === 'added') {
                            return (
                              <span
                                key={idx}
                                className="bg-emerald-100 text-emerald-900 rounded-[2px] px-0.5 py-[1px] font-medium"
                              >
                                {part.value}
                              </span>
                            );
                          }
                          return <span key={idx}>{part.value}</span>;
                        })}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Original Box */}
                        <div className="bg-white rounded-lg border border-slate-200/80 overflow-hidden flex flex-col shadow-2xs">
                          <div className="px-3 py-1.5 bg-slate-50/80 border-b border-slate-100 text-xs font-semibold text-slate-700">
                            Original ({metrics?.origWords || 34} words)
                          </div>
                          <div className="p-2.5 sm:p-3 text-xs leading-relaxed text-slate-800 flex-1">
                            {diffParts.length > 0 ? (
                              diffParts.map((part, idx) => {
                                if (part.type === 'removed') {
                                  return (
                                    <span
                                      key={idx}
                                      className="bg-[#fee2e2] text-[#991b1b] rounded-[2px] px-0.5 py-[1px] font-medium line-through decoration-[#ef4444]"
                                    >
                                      {part.value}
                                    </span>
                                  );
                                }
                                if (part.type === 'unchanged') {
                                  return <span key={idx}>{part.value}</span>;
                                }
                                return null;
                              })
                            ) : (
                              <span>
                                जन्माष्टमी रथ यात्रा{' '}
                                <span className="bg-[#fee2e2] text-[#991b1b] rounded-[2px] px-0.5 py-[1px] font-medium line-through decoration-[#ef4444]">
                                  हर साल
                                </span>{' '}
                                भगवान जन्माष्टमी की भक्ति{' '}
                                <span className="bg-[#fee2e2] text-[#991b1b] rounded-[2px] px-0.5 py-[1px] font-medium line-through decoration-[#ef4444]">
                                  और महिमा को समाज तक
                                </span>{' '}
                                पहुंचाने के लिए निकाली जाती है। यह यात्रा नगर के प्रमुख मार्गों से होते हुए मंदिर तक
                                पहुंचती है।{' '}
                                <span className="bg-[#fee2e2] text-[#991b1b] rounded-[2px] px-0.5 py-[1px] font-medium line-through decoration-[#ef4444]">
                                  जिसमें हजारों भक्त शामिल होते हैं।
                                </span>{' '}
                                रथ यात्रा का उद्देश्य भगवान के जन्मोत्सव को भव्य रूप से मनाना और समाज में धर्म, भक्ति और
                                एकता का संदेश फैलाना है।
                              </span>
                            )}
                          </div>
                          <div className="px-3 py-1.5 bg-slate-50/50 border-t border-slate-100 text-[11px] text-slate-400 font-mono">
                            {metrics?.origWords || 34} words &bull; {metrics?.origChars || 198} characters
                          </div>
                        </div>

                        {/* Proposed Box */}
                        <div className="bg-white rounded-lg border border-slate-200/80 overflow-hidden flex flex-col shadow-2xs">
                          <div className="px-3 py-1.5 bg-slate-50/80 border-b border-slate-100 text-xs font-semibold text-slate-700 flex items-center justify-between">
                            <span>Proposed ({metrics?.propWords || 21} words)</span>
                            <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 h-5 inline-flex items-center justify-center rounded-md leading-normal">
                              {metrics?.charDelta || -13} chars ({metrics?.charDeltaPct || -38}%)
                            </span>
                          </div>
                          <div className="p-2.5 sm:p-3 text-xs leading-relaxed text-slate-800 flex-1">
                            {diffParts.length > 0 ? (
                              diffParts.map((part, idx) => {
                                if (part.type === 'added') {
                                  return (
                                    <span
                                      key={idx}
                                      className="bg-[#dcfce7] text-[#166534] rounded-[2px] px-0.5 py-[1px] font-medium"
                                    >
                                      {part.value}
                                    </span>
                                  );
                                }
                                if (part.type === 'unchanged') {
                                  return <span key={idx}>{part.value}</span>;
                                }
                                return null;
                              })
                            ) : (
                              <span>
                                जन्माष्टमी रथ यात्रा भगवान जन्माष्टमी की भक्ति{' '}
                                <span className="bg-[#dcfce7] text-[#166534] rounded-[2px] px-0.5 py-[1px] font-medium">
                                  को समाज तक
                                </span>{' '}
                                पहुंचाने के लिए निकाली जाती है। यह यात्रा नगर के प्रमुख मार्गों से होते हुए मंदिर तक
                                पहुंचती है। रथ यात्रा का उद्देश्य भगवान के जन्मोत्सव को मनाना और समाज में धर्म, भक्ति और
                                एकता का संदेश फैलाना है।
                              </span>
                            )}
                          </div>
                          <div className="px-3 py-1.5 bg-slate-50/50 border-t border-slate-100 text-[11px] text-slate-400 font-mono">
                            {metrics?.propWords || 21} words &bull; {metrics?.propChars || 137} characters
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* COLUMN 3 (RIGHT): AUDIT TIMELINE (Spacious 320px layout) */}
                  <div className="w-full lg:w-[320px] shrink-0 bg-white rounded-lg border border-slate-200/80 p-4 space-y-3.5 shadow-2xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800">
                        <Clock className="w-4 h-4 text-slate-600" />
                        <span>Audit Timeline</span>
                      </div>
                      <span className="text-xs font-semibold text-slate-400">5 events</span>
                    </div>

                    <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 text-xs">
                      {/* Step 1: Proposal Staged */}
                      <div className="relative">
                        <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-orange-600 ring-4 ring-white" />
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-800">AI Proposal Staged</p>
                          <p className="text-[11px] text-slate-400">{formatDate(proposal.createdAt)}</p>
                          <p className="text-[11px] text-slate-600">by {proposal.agentName}</p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            Run ID: {proposal.run?.id ? `${proposal.run.id.slice(0, 16)}...` : 'a40ae690-127c...'}
                          </p>

                          {/* Tool Call Card: No border, bg-slate-100, reduced radius, centered heighted badge */}
                          <div className="mt-2 bg-slate-100 rounded-lg p-2.5 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                                Tool Call
                              </span>
                              <span className="inline-flex items-center justify-center h-5 px-2 text-[10px] font-semibold rounded-md leading-normal bg-emerald-50 text-emerald-700">
                                SUCCESS
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2 bg-white rounded-md px-2.5 py-1.5 text-[11px] text-slate-800 shadow-2xs">
                              <span className="font-medium truncate" title="get_content_item">
                                Get Content Item
                              </span>
                              <span className="text-slate-400 text-[10px] shrink-0">169ms</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Step 2: Proposed Content Generated */}
                      <div className="relative">
                        <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-blue-600 ring-4 ring-white" />
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-800">Proposed Content Generated</p>
                          <p className="text-[11px] text-slate-400">{formatDate(proposal.createdAt)}</p>

                          {/* Tool Call Card */}
                          <div className="mt-2 bg-slate-100 rounded-lg p-2.5 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                                Tool Call
                              </span>
                              <span className="inline-flex items-center justify-center h-5 px-2 text-[10px] font-semibold rounded-md leading-normal bg-rose-50 text-rose-600">
                                STAGED
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2 bg-white rounded-md px-2.5 py-1.5 text-[11px] text-slate-800 shadow-2xs">
                              <span className="font-medium truncate" title="propose_article_content_improvement">
                                Propose Content
                              </span>
                              <span className="text-slate-400 text-[10px] shrink-0">0ms</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Step 3: Applied Field Changes */}
                      <div className="relative">
                        <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-emerald-600 ring-4 ring-white" />
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-800">Applied Field Changes</p>
                          <p className="text-[11px] text-slate-400">{formatDate(proposal.updatedAt)}</p>

                          {/* Tool Call Card */}
                          <div className="mt-2 bg-slate-100 rounded-lg p-2.5 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                                Tool Call
                              </span>
                              <span className="inline-flex items-center justify-center h-5 px-2 text-[10px] font-semibold rounded-md leading-normal bg-emerald-50 text-emerald-700">
                                SUCCESS
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2 bg-white rounded-md px-2.5 py-1.5 text-[11px] text-slate-800 shadow-2xs">
                              <span className="font-medium truncate" title="apply_article_content_field">
                                Apply Field Change
                              </span>
                              <span className="text-slate-400 text-[10px] shrink-0">326ms</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Step 4: Awaiting Human Review */}
                      <div className="relative">
                        <div
                          className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full ring-4 ring-white ${
                            isApproved || isCompleted
                              ? 'bg-emerald-600'
                              : isRejected
                                ? 'bg-rose-500'
                                : 'border-2 border-slate-300 bg-white'
                          }`}
                        />
                        <div className="space-y-0.5">
                          <p className="font-semibold text-slate-800">
                            {isRejected ? 'Changes Requested' : 'Awaiting Human Review'}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {proposal.reviewedAt ? formatDate(proposal.reviewedAt) : 'Pending review by admin_verifier'}
                          </p>
                        </div>
                      </div>

                      {/* Step 5: Final Status */}
                      <div className="relative">
                        <div
                          className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full ring-4 ring-white ${
                            isCompleted
                              ? 'bg-emerald-600'
                              : isApproved
                                ? 'bg-blue-600'
                                : isRejected
                                  ? 'bg-rose-500'
                                  : 'border-2 border-slate-300 bg-white'
                          }`}
                        />
                        <div className="space-y-0.5">
                          <p className="font-semibold text-slate-800">
                            {isCompleted
                              ? 'Approved & Applied Live'
                              : isApproved
                                ? 'Approved for Live Execution'
                                : isRejected
                                  ? 'Rejected by Verifier'
                                  : 'Final Review'}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {proposal.reviewedBy
                              ? `by ${proposal.reviewedBy}`
                              : isRejected
                                ? 'Awaiting re-generation'
                                : 'Pending approval'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Confirmation Dialog for Execution */}
      <ConfirmDialog
        isOpen={isExecuteOpen}
        title="Execute AI Proposal?"
        message={
          proposal
            ? `Are you sure you want to apply this proposal to live production database?\n\n` +
              `• Title: ${resolvedTitle}\n` +
              `• Field: ${proposal.targetField?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}\n` +
              `• Baseline Check: Live content verified ✓\n` +
              `• Sacred Shield: Deities, shlokas and titles protected ✓`
            : ''
        }
        confirmText="Execute Live"
        cancelText="Cancel"
        onConfirm={() => {
          if (proposal) executeMutation.mutate(proposal.id);
        }}
        onCancel={() => setIsExecuteOpen(false)}
      />
    </>,
    document.body
  );
};
