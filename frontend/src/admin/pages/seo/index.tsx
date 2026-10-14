import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  FileText,
  Globe,
  LayoutDashboard,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Zap,
  ExternalLink,
  ArrowRight,
  Bot,
  Info,
  CheckCircle2,
  Code2
} from 'lucide-react';
import { SeoApi } from '@admin/features/seo/SeoApi';
import { apiClient } from '@api/client';
import { cn } from '@utils/cn';
import { toast } from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { getAdminPath } from '@utils/host';
import { DEFAULT_SEO, SITE_NAME_EN, SITE_NAME_HI, SITE_ORIGIN } from '@/constants/seo';

const JumpingDots = ({ colorClass = 'text-gray-400' }: { colorClass?: string }) => (
  <div className={`flex items-center gap-1.5 h-9 mt-2 ${colorClass}`}>
    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
  </div>
);

export const AdminSEO = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');

  // Loading states
  const [isRunningAgentAudit, setIsRunningAgentAudit] = useState(false);

  const { data: overview, isLoading: isLoadingOverview } = useQuery({
    queryKey: ['seo-overview'],
    queryFn: async () => {
      const data = await SeoApi.getOverview();
      return data.data;
    }
  });

  const { data: issues, isLoading: isLoadingIssues } = useQuery({
    queryKey: ['seo-issues'],
    queryFn: async () => {
      const data = await SeoApi.getIssues();
      return data.data;
    }
  });

  const { data: latestAgentAudit, isLoading: isLoadingAgentAudit } = useQuery({
    queryKey: ['seo-agent-audit-latest'],
    queryFn: async () => {
      const res = await SeoApi.getLatestAgentAudit();
      return res.data;
    }
  });

  const getEditLink = (type: string, id?: string) => {
    const normalized = (type || '').toLowerCase();
    if (normalized.startsWith('bhajan')) return getAdminPath(`/bhajans/${id}/edit`);
    if (normalized.startsWith('article')) return getAdminPath(`/articles/${id}/edit`);
    if (normalized.startsWith('festival')) return getAdminPath(`/festivals/${id}/edit`);
    if (normalized.startsWith('puran')) return getAdminPath(`/puranas/${id}/edit`);
    if (normalized.startsWith('categor')) return getAdminPath('/categories');
    return getAdminPath(`/${normalized}/${id}/edit`);
  };

  const agentFindings = (latestAgentAudit?.state?.findings || []).map((f: any) => ({
    id: f.contentId,
    title: f.contentTitle,
    type: f.contentType,
    issue: f.message || f.issueType?.replace(/_/g, ' '),
    severity: f.severity,
    recommendation: f.recommendation,
    source: 'agent' as const
  }));

  const legacyIssues = (issues || []).map((i: any) => ({
    id: i.id,
    title: i.title,
    type: i.type,
    issue: i.issue,
    severity: 'HIGH' as const,
    recommendation: 'Add SEO title/description',
    source: 'database' as const
  }));

  const displayIssues = agentFindings.length > 0 ? agentFindings : legacyIssues;
  const isLoadingIssuesTable = isLoadingIssues || isLoadingAgentAudit;

  const handleRunAgentAudit = async () => {
    setIsRunningAgentAudit(true);
    try {
      const res = await SeoApi.runAgentAudit();
      await queryClient.invalidateQueries({ queryKey: ['seo-agent-audit-latest'] });
      await queryClient.invalidateQueries({ queryKey: ['seo-overview'] });
      await queryClient.invalidateQueries({ queryKey: ['seo-issues'] });
      const issuesCount = res.data?.findingsCount ?? 0;
      toast.success(`SEO Audit Agent finished. Identified ${issuesCount} issues.`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'SEO Audit Agent run failed');
    } finally {
      setIsRunningAgentAudit(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview & Audit', icon: LayoutDashboard },
    { id: 'issues', label: 'SEO Issues', icon: ShieldAlert },
    { id: 'settings', label: 'Default SEO & Schema', icon: Settings },
    { id: 'tools', label: 'Deployed SEO Files', icon: Globe }
  ];

  return (
    <div className="space-y-6 flex flex-col flex-1 pb-8">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-2xl font-bold tracking-wide text-slate-900 flex items-center gap-2 uppercase truncate">
              <Search className="w-5 h-5 sm:w-6 sm:h-6 text-saffron shrink-0" />
              <span className="truncate">SEO ENGINE</span>
            </h1>
            <p className="hidden sm:block text-sm text-gray-500 mt-1">
              Monitor, audit, and manage global search engine optimization.
            </p>
          </div>
          <button
            onClick={handleRunAgentAudit}
            disabled={isRunningAgentAudit}
            className="flex items-center gap-2 px-3.5 py-2 bg-saffron hover:bg-orange-600 text-white rounded-md text-xs sm:text-sm font-semibold transition-all shadow-sm shrink-0 disabled:opacity-50 cursor-pointer"
          >
            <Zap className={cn('w-4 h-4', isRunningAgentAudit && 'animate-spin')} />
            <span>{isRunningAgentAudit ? 'Auditing Website...' : 'Run SEO Audit Agent'}</span>
          </button>
        </div>

        <div className="flex overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-bold uppercase border-b-2 transition-colors whitespace-nowrap',
                activeTab === tab.id
                  ? 'border-saffron text-saffron'
                  : 'border-transparent text-gray-900 hover:text-black hover:border-gray-300'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            <div
              onClick={() => navigate(getAdminPath('/bhajans'))}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(getAdminPath('/bhajans'));
                }
              }}
              className="bg-gradient-to-br from-blue-50 to-white p-3.5 sm:p-5 rounded-md border border-blue-100 shadow-sm cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.015] active:scale-[0.99] hover:border-blue-300 select-none group"
            >
              <h3 className="text-xs sm:text-sm font-semibold text-gray-500 group-hover:text-blue-700 transition-colors">
                Total Bhajans
              </h3>
              {isLoadingOverview ? (
                <JumpingDots />
              ) : (
                <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2 text-gray-900 group-hover:text-blue-900 transition-colors">
                  {overview?.totalBhajans || 0}
                </p>
              )}
            </div>
            <div
              onClick={() => navigate(getAdminPath('/articles'))}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(getAdminPath('/articles'));
                }
              }}
              className="bg-gradient-to-br from-green-50 to-white p-3.5 sm:p-5 rounded-md border border-green-100 shadow-sm cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.015] active:scale-[0.99] hover:border-green-300 select-none group"
            >
              <h3 className="text-xs sm:text-sm font-semibold text-gray-500 group-hover:text-green-700 transition-colors">
                Total Articles
              </h3>
              {isLoadingOverview ? (
                <JumpingDots />
              ) : (
                <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2 text-gray-900 group-hover:text-green-900 transition-colors">
                  {overview?.totalArticles || 0}
                </p>
              )}
            </div>
            <div
              onClick={() => navigate(getAdminPath('/festivals'))}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(getAdminPath('/festivals'));
                }
              }}
              className="bg-gradient-to-br from-orange-50 to-white p-3.5 sm:p-5 rounded-md border border-orange-100 shadow-sm cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.015] active:scale-[0.99] hover:border-orange-300 select-none group"
            >
              <h3 className="text-xs sm:text-sm font-semibold text-gray-500 group-hover:text-orange-700 transition-colors">
                Total Festivals
              </h3>
              {isLoadingOverview ? (
                <JumpingDots />
              ) : (
                <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2 text-gray-900 group-hover:text-orange-900 transition-colors">
                  {overview?.totalFestivals || 0}
                </p>
              )}
            </div>
            <div
              onClick={() => navigate(getAdminPath('/puranas'))}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(getAdminPath('/puranas'));
                }
              }}
              className="bg-gradient-to-br from-purple-50 to-white p-3.5 sm:p-5 rounded-md border border-purple-100 shadow-sm cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.015] active:scale-[0.99] hover:border-purple-300 select-none group"
            >
              <h3 className="text-xs sm:text-sm font-semibold text-gray-500 group-hover:text-purple-700 transition-colors">
                Total Puranas
              </h3>
              {isLoadingOverview ? (
                <JumpingDots />
              ) : (
                <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2 text-gray-900 group-hover:text-purple-900 transition-colors">
                  {overview?.totalPuranas || 0}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
            <div className="bg-gradient-to-br from-red-50 to-white p-4 sm:p-5 rounded-md border border-red-200 shadow-sm flex items-center justify-between">
              <div>
                <h3 className="text-xs sm:text-sm font-semibold text-red-600">Missing SEO Titles</h3>
                {isLoadingOverview ? (
                  <JumpingDots colorClass="text-red-400" />
                ) : (
                  <p className="text-2xl sm:text-3xl font-bold text-red-700 mt-1 sm:mt-2">
                    {overview?.missingTitles || 0}
                  </p>
                )}
              </div>
              <AlertTriangle className="w-8 h-8 sm:w-10 sm:h-10 text-red-200 shrink-0" />
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-white p-4 sm:p-5 rounded-md border border-orange-200 shadow-sm flex items-center justify-between">
              <div>
                <h3 className="text-xs sm:text-sm font-semibold text-orange-600">Duplicate Meta Descriptions</h3>
                {isLoadingOverview ? (
                  <JumpingDots colorClass="text-orange-400" />
                ) : (
                  <p className="text-2xl sm:text-3xl font-bold text-orange-700 mt-1 sm:mt-2">
                    {overview?.duplicateDescriptions || 0}
                  </p>
                )}
              </div>
              <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-orange-200 shrink-0" />
            </div>
          </div>

          <h2 className="text-lg font-bold mt-8 mb-4">SEO Audit Health</h2>
          <div className="bg-gradient-to-br from-red-50 to-white rounded-md border border-red-100 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-orange-50 text-orange-900 border-b border-orange-100 text-sm font-semibold">
                  <th className="px-6 py-4">Content Type</th>
                  <th className="px-6 py-4 font-semibold text-center">Optimized</th>
                  <th className="px-6 py-4 font-semibold text-center">Missing Title</th>
                  <th className="px-6 py-4 font-semibold text-center">Missing Desc</th>
                  <th className="px-6 py-4 font-semibold text-center">Duplicate Title</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {isLoadingOverview ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <Activity className="w-8 h-8 text-saffron animate-bounce" />
                        <span className="text-gray-500 font-medium animate-pulse">
                          Scanning content and auditing SEO metadata...
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  overview?.audit?.map((item: any) => (
                    <tr
                      key={item.type}
                      className="border-b border-gray-100 last:border-0 bg-gray-50/50 hover:bg-blue-100/60 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-gray-900 capitalize">{item.type}</td>
                      <td className="px-6 py-4 text-center text-green-600 font-medium">{item.optimized}</td>
                      <td
                        className="px-6 py-4 text-center text-red-600 font-medium cursor-pointer hover:underline"
                        onClick={() => navigate(getAdminPath(`/${item.type}?filter=missingTitle`))}
                      >
                        {item.missingTitle}
                      </td>
                      <td
                        className="px-6 py-4 text-center text-red-600 font-medium cursor-pointer hover:underline"
                        onClick={() => navigate(getAdminPath(`/${item.type}?filter=missingDesc`))}
                      >
                        {item.missingDesc}
                      </td>
                      <td
                        className="px-6 py-4 text-center text-orange-500 font-medium cursor-pointer hover:underline"
                        onClick={() => navigate(getAdminPath(`/${item.type}?filter=duplicateTitle`))}
                      >
                        {item.duplicateTitle}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Quick-jump to AI Processing for Bulk Generation - only shown when missing SEO items exist */}
          {((overview?.missingTitles || 0) > 0 || (overview?.missingDescriptions || 0) > 0) && (
            <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-white p-4 rounded-md border border-orange-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-saffron/10 text-saffron flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {(overview?.missingTitles || 0) + (overview?.missingDescriptions || 0)} content items are missing
                    SEO tags
                  </h4>
                  <p className="text-xs text-slate-500">
                    You can generate and fill missing meta titles and descriptions in bulk using AI Processing.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate(getAdminPath('/ai-processing?tab=bulk'))}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-saffron hover:bg-orange-600 text-white text-xs font-semibold rounded-md shadow-sm transition-colors whitespace-nowrap self-start sm:self-auto cursor-pointer"
              >
                <span>Generate in AI Processing</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'issues' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-orange-50/70 via-amber-50/50 to-white p-4 sm:p-5 rounded-md border border-orange-200 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-orange-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-orange-100 text-saffron rounded-md shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">AI SEO Audit Agent Findings</h3>
                    <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                      Autonomous Analysis
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Source: <strong>SEO Audit Agent</strong> • Read & Analyze inspection • No content is modified until
                    you fix or approve changes.
                  </p>
                </div>
              </div>
            </div>

            {latestAgentAudit?.state?.summary ? (
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="text-gray-600">
                  Audited <strong>{latestAgentAudit.state.summary.totalAudited || 0}</strong> content items • Found{' '}
                  <strong className="text-red-600">{latestAgentAudit.state.summary.totalIssues || 0}</strong> issues
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-semibold text-gray-500 mr-1">Severity:</span>
                  <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 font-bold">
                    Critical: {latestAgentAudit.state.summary.bySeverity?.CRITICAL || 0}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-700 font-bold">
                    High: {latestAgentAudit.state.summary.bySeverity?.HIGH || 0}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-700 font-bold">
                    Medium: {latestAgentAudit.state.summary.bySeverity?.MEDIUM || 0}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-bold">
                    Low: {latestAgentAudit.state.summary.bySeverity?.LOW || 0}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-500 flex items-center justify-between">
                <span>No audit snapshot available yet. Click "Run SEO Audit Agent" to analyze all public pages.</span>
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-white rounded-md border border-amber-100 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-orange-50 text-orange-900 border-b border-orange-100 text-sm font-semibold">
                  <th className="px-6 py-3">Content Type</th>
                  <th className="px-6 py-3 font-semibold">Title</th>
                  <th className="px-6 py-3 font-semibold">Issue</th>
                  <th className="px-6 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {isLoadingIssuesTable ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <Search className="w-8 h-8 text-gray-300 animate-bounce" />
                        <span className="text-gray-400 font-medium animate-pulse">Fetching SEO issues...</span>
                      </div>
                    </td>
                  </tr>
                ) : displayIssues.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      <ShieldCheck className="w-12 h-12 text-green-400 mx-auto mb-3" strokeWidth={2.5} />
                      <h3 className="text-lg font-bold text-gray-900 mb-1">Excellent!</h3>
                      <p>All content is currently optimized. No SEO issues found.</p>
                    </td>
                  </tr>
                ) : (
                  displayIssues.map((issue: any, i: number) => (
                    <tr
                      key={i}
                      className="border-b border-gray-100 last:border-0 bg-gray-50/50 hover:bg-blue-100/60 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-gray-900 capitalize">
                        <span className="inline-block px-2 py-0.5 bg-orange-100/70 text-orange-800 rounded text-xs font-semibold">
                          {issue.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-800 font-medium truncate max-w-[220px]" title={issue.title}>
                        {issue.title}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {issue.severity && (
                            <span
                              className={cn(
                                'text-[10px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0',
                                issue.severity === 'CRITICAL' && 'bg-red-100 text-red-700',
                                issue.severity === 'HIGH' && 'bg-orange-100 text-orange-700',
                                issue.severity === 'MEDIUM' && 'bg-amber-100 text-amber-800',
                                issue.severity === 'LOW' && 'bg-blue-100 text-blue-700'
                              )}
                            >
                              {issue.severity}
                            </span>
                          )}
                          <span className="text-slate-800 font-medium text-xs sm:text-sm">{issue.issue}</span>
                        </div>
                        {issue.recommendation && <p className="text-xs text-gray-500 mt-1">{issue.recommendation}</p>}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <Link
                          to={getEditLink(issue.type, issue.id)}
                          className="text-saffron hover:underline font-semibold text-xs inline-flex items-center gap-1 whitespace-nowrap"
                        >
                          Fix Issue
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Clear Resolution Guidance */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-md p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-slate-200/70 rounded text-slate-700 shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-slate-800">Resolving SEO Issues</span>
                <p className="text-slate-500 mt-0.5">
                  Click <strong>Fix Issue</strong> on any row above to edit that content item directly and adjust its
                  title or description according to the recommendation.
                </p>
              </div>
            </div>
            <Link
              to={getAdminPath('/ai-agents?tab=overview')}
              className="text-saffron hover:underline font-bold inline-flex items-center gap-1 shrink-0"
            >
              <span>View in AI Agents</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Default SEO Fallbacks Card */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between space-y-5">
              <div>
                <div className="flex items-center justify-between border-b pb-3 mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-saffron" />
                      <span>Default SEO Fallbacks</span>
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Compiled in{' '}
                      <code className="text-[11px] font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-700">
                        constants/seo.ts
                      </code>
                    </p>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                    Read-Only
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Hindi Defaults */}
                  <div className="bg-slate-50 border border-slate-200/70 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Hindi (Primary Default)
                      </span>
                      <span className="text-[10px] bg-saffron/10 text-saffron font-bold px-1.5 py-0.5 rounded">
                        Default
                      </span>
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold text-slate-500">Site Title</div>
                      <p className="text-xs text-slate-900 font-hindi-body font-medium leading-relaxed mt-0.5">
                        {DEFAULT_SEO.hi.title}
                      </p>
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold text-slate-500">Meta Description</div>
                      <p className="text-xs text-slate-600 font-hindi-body leading-relaxed mt-0.5">
                        {DEFAULT_SEO.hi.description}
                      </p>
                    </div>
                  </div>

                  {/* English Defaults */}
                  <div className="bg-slate-50 border border-slate-200/70 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        English (Fallback)
                      </span>
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold text-slate-500">Site Title</div>
                      <p className="text-xs text-slate-900 font-medium leading-relaxed mt-0.5">
                        {DEFAULT_SEO.en.title}
                      </p>
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold text-slate-500">Meta Description</div>
                      <p className="text-xs text-slate-600 leading-relaxed mt-0.5">{DEFAULT_SEO.en.description}</p>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-gray-500 italic">
                * Note: Individual Bhajans, Articles, Festivals, and Puranas use their own specific SEO title and
                description fields when set.
              </p>
            </div>

            {/* Active Structured Data Card */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between space-y-5">
              <div>
                <div className="flex items-center justify-between border-b pb-3 mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-blue-500" />
                      <span>Active Structured Data (Schema.org)</span>
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Compiled in{' '}
                      <code className="text-[11px] font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-700">
                        components/seo/SchemaRenderer.tsx
                      </code>
                    </p>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Active in Code
                  </span>
                </div>

                <div className="space-y-2.5">
                  {[
                    {
                      name: 'WebSite Schema',
                      desc: 'Defines root website entity and Google SearchAction query input.',
                      target: 'Homepage (/)'
                    },
                    {
                      name: 'Organization Schema',
                      desc: 'Official branding, logo, and social profile links.',
                      target: 'Site-wide'
                    },
                    {
                      name: 'BreadcrumbList Schema',
                      desc: 'Hierarchical navigation trail for search results snippets.',
                      target: 'All listing and detail pages'
                    },
                    {
                      name: 'Article Schema',
                      desc: 'Rich headline, author, datePublished, and thumbnail.',
                      target: 'Article detail pages'
                    },
                    {
                      name: 'MusicComposition Schema',
                      desc: 'Sacred devotional lyrics metadata and composition structure.',
                      target: 'Bhajan detail pages'
                    },
                    {
                      name: 'Book / Publication Schema',
                      desc: 'Sacred scriptures and holy purana metadata.',
                      target: 'Purana detail pages'
                    },
                    {
                      name: 'Event Schema',
                      desc: 'Festival start/end dates and sacred observance schedule.',
                      target: 'Festival detail pages'
                    }
                  ].map((item) => (
                    <div
                      key={item.name}
                      className="flex items-start justify-between gap-3 p-2.5 rounded-lg border border-slate-100 bg-slate-50/70"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="text-xs font-bold text-slate-900">{item.name}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 pl-5">{item.desc}</p>
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium px-1.5 py-0.5 bg-white border border-slate-200 rounded shrink-0">
                        {item.target}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-[11px] text-gray-500 italic">
                * All schemas conform strictly to Google Search Central and schema.org standard specifications.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tools' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sitemap Card */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold">
                    <Globe className="w-6 h-6" />
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Build-Time Generated
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Production XML Sitemap</h3>
                <p className="text-xs text-slate-500 mb-4">
                  Generated during frontend compilation from live published Bhajans, Articles, Festivals, Puranas,
                  Categories, and Deities. Deployed directly to Vercel edge.
                </p>
                <div className="bg-slate-50 border border-slate-200/70 rounded-lg p-3 mb-6">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Production URL
                  </div>
                  <a
                    href="https://aradhnamarg.com/sitemap.xml"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono text-saffron hover:underline flex items-center gap-1.5 break-all"
                  >
                    https://aradhnamarg.com/sitemap.xml
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                </div>
              </div>
              <a
                href="https://aradhnamarg.com/sitemap.xml"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm"
              >
                <span>Open Production Sitemap</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {/* Robots.txt Card */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
                    <FileText className="w-6 h-6" />
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Static Asset
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Production Robots.txt</h3>
                <p className="text-xs text-slate-500 mb-4">
                  Static crawler directives served from frontend public files. Configured to allow all public website
                  pages and public API rendering (
                  <code className="text-[11px] bg-slate-100 px-1 py-0.5 rounded text-slate-700">/api/v1/public/</code>)
                  while keeping private and admin routes blocked.
                </p>
                <div className="bg-slate-50 border border-slate-200/70 rounded-lg p-3 mb-6">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Production URL
                  </div>
                  <a
                    href="https://aradhnamarg.com/robots.txt"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono text-saffron hover:underline flex items-center gap-1.5 break-all"
                  >
                    https://aradhnamarg.com/robots.txt
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                </div>
              </div>
              <a
                href="https://aradhnamarg.com/robots.txt"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm"
              >
                <span>Open Production Robots.txt</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
