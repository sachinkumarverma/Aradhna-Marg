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
  CheckCircle2,
  Zap,
  ExternalLink
} from 'lucide-react';
import { SeoApi } from '@admin/features/seo/SeoApi';
import { apiClient } from '@api/client';
import { cn } from '@utils/cn';
import { toast } from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { getAdminPath } from '@utils/host';

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

  // Form states for Default SEO
  const [siteTitle, setSiteTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [isSavingSeo, setIsSavingSeo] = useState(false);

  // Form states for Schema toggles
  const [schemas, setSchemas] = useState({
    schemaOrganization: false,
    schemaWebsite: false,
    schemaBreadcrumb: false,
    schemaArticle: false,
    schemaSearchAction: false
  });
  const [isSavingSchema, setIsSavingSchema] = useState(false);

  // Loading states for Tools
  const [isGeneratingSitemap, setIsGeneratingSitemap] = useState(false);
  const [isGeneratingRobots, setIsGeneratingRobots] = useState(false);
  const [isStartingBulk, setIsStartingBulk] = useState(false);
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

  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await apiClient.get('/v1/settings');
      return res.data.data;
    }
  });

  // Query recent bulk SEO jobs
  const { data: bulkJobs } = useQuery({
    queryKey: ['admin-seo-bulk-jobs'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/ai/jobs', { params: { limit: 10 } });
      const allJobs = res.data?.data?.data || [];
      return allJobs.filter((j: any) => j.action_type === 'BULK_SEO' || (j.job_name && j.job_name.includes('SEO')));
    },
    enabled: activeTab === 'generator',
    refetchInterval: activeTab === 'generator' ? 4000 : false
  });

  // Sync settings into controlled local state
  useEffect(() => {
    if (settings) {
      setSiteTitle(settings.seoSiteTitle || '');
      setMetaDescription(settings.seoMetaDescription || '');
      setSchemas({
        schemaOrganization: !!settings.schemaOrganization,
        schemaWebsite: !!settings.schemaWebsite,
        schemaBreadcrumb: !!settings.schemaBreadcrumb,
        schemaArticle: !!settings.schemaArticle,
        schemaSearchAction: !!settings.schemaSearchAction
      });
    }
  }, [settings]);

  const handleSaveDefaultSeo = async () => {
    setIsSavingSeo(true);
    try {
      await apiClient.put('/v1/settings', {
        seoSiteTitle: siteTitle,
        seoMetaDescription: metaDescription
      });
      await queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Default SEO fallbacks saved successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save SEO settings');
    } finally {
      setIsSavingSeo(false);
    }
  };

  const handleSaveSchemaSettings = async () => {
    setIsSavingSchema(true);
    try {
      await apiClient.put('/v1/settings', schemas);
      await queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Schema settings saved successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save schema settings');
    } finally {
      setIsSavingSchema(false);
    }
  };

  const handleGenerateSitemap = async () => {
    setIsGeneratingSitemap(true);
    try {
      const res = await SeoApi.generateSitemap();
      await queryClient.invalidateQueries({ queryKey: ['settings'] });
      const count = res.data?.count ?? 0;
      toast.success(`XML Sitemap generated successfully (${count} URLs)`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to generate sitemap');
    } finally {
      setIsGeneratingSitemap(false);
    }
  };

  const handleGenerateRobots = async () => {
    setIsGeneratingRobots(true);
    try {
      await SeoApi.generateRobots();
      toast.success('robots.txt generated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to generate robots.txt');
    } finally {
      setIsGeneratingRobots(false);
    }
  };

  const handleGenerateBulk = async () => {
    setIsStartingBulk(true);
    try {
      const res = await SeoApi.generateBulk();
      queryClient.invalidateQueries({ queryKey: ['admin-seo-bulk-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['seo-overview'] });
      const total = res.data?.totalItems ?? 0;
      toast.success(`Bulk SEO job queued (${total} records to evaluate)`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Bulk generation failed to start');
    } finally {
      setIsStartingBulk(false);
    }
  };

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
    { id: 'tools', label: 'Tools (Sitemap & Robots)', icon: Globe },
    { id: 'generator', label: 'Bulk SEO Tools', icon: Search }
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
        </div>
      )}

      {activeTab === 'issues' && (
        <div className="space-y-6">
          {latestAgentAudit?.state?.summary && (
            <div className="bg-gradient-to-br from-orange-50/60 to-white p-4 sm:p-5 rounded-md border border-orange-200 shadow-sm space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-orange-100 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-saffron shrink-0" />
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">AI SEO Audit Agent Findings</h3>
                  <span className="text-xs bg-orange-100 text-orange-800 font-semibold px-2 py-0.5 rounded-full">
                    Latest Run
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Audited {latestAgentAudit.state.summary.totalAudited || 0} items • Found{' '}
                  <strong className="text-red-600">{latestAgentAudit.state.summary.totalIssues || 0}</strong> issues
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold text-gray-600">Severity Breakdown:</span>
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
          )}

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
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md border border-blue-100 shadow-sm p-6 space-y-5">
            <h3 className="font-bold text-gray-900 border-b pb-3">Default SEO Fallbacks</h3>
            <p className="text-xs text-gray-500 mb-4">
              These values will act as fallbacks when content-specific SEO fields are empty.
            </p>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Default Site Title</label>
              <input
                type="text"
                value={siteTitle}
                onChange={(e) => setSiteTitle(e.target.value)}
                placeholder="e.g. Aradhna Marg | Devotional Bhajans, Puranas & Festivals"
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md outline-none text-sm focus:border-saffron focus:ring-1 focus:ring-saffron"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Default Meta Description</label>
              <textarea
                rows={4}
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="e.g. Discover authentic devotional bhajans, sacred puranas, and festival wisdom on Aradhna Marg."
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md outline-none text-sm focus:border-saffron focus:ring-1 focus:ring-saffron resize-y"
              />
            </div>
            <button
              onClick={handleSaveDefaultSeo}
              disabled={isSavingSeo}
              className="px-4 py-2 bg-saffron text-white rounded-md font-medium hover:bg-saffron/90 disabled:opacity-60 w-full mt-2 transition-colors flex items-center justify-center gap-2"
            >
              {isSavingSeo ? 'Saving Fallbacks...' : 'Save Default SEO'}
            </button>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md border border-blue-100 shadow-sm p-6 space-y-5">
            <h3 className="font-bold text-gray-900 border-b pb-3">Structured Data (Schema.org)</h3>
            <p className="text-xs text-gray-500 mb-4">
              The backend will automatically determine the correct schema fields for each page type. These switches
              simply enable or disable schema generation globally.
            </p>

            <div className="space-y-4">
              {[
                { key: 'schemaOrganization', label: 'Organization Schema' },
                { key: 'schemaWebsite', label: 'Website Schema' },
                { key: 'schemaBreadcrumb', label: 'Breadcrumb Schema' },
                { key: 'schemaArticle', label: 'Article Schema' },
                { key: 'schemaSearchAction', label: 'SearchAction Schema' }
              ].map((schema) => (
                <label key={schema.key} className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm font-medium text-gray-700">{schema.label}</span>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={schemas[schema.key as keyof typeof schemas] || false}
                      onChange={(e) =>
                        setSchemas((prev) => ({
                          ...prev,
                          [schema.key]: e.target.checked
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-saffron"></div>
                  </div>
                </label>
              ))}
            </div>
            <button
              onClick={handleSaveSchemaSettings}
              disabled={isSavingSchema}
              className="px-4 py-2 bg-gray-900 text-white rounded-md font-medium hover:bg-gray-800 disabled:opacity-60 w-full mt-2 transition-colors flex items-center justify-center gap-2"
            >
              {isSavingSchema ? 'Saving Schemas...' : 'Save Schema Settings'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'tools' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md border border-blue-100 shadow-sm p-6 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
              <Globe className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">XML Sitemap</h3>
            <p className="text-sm text-gray-500 mb-6">
              Generate an updated XML sitemap for search engines. <br />
              Last generated:{' '}
              <strong>
                {settings?.sitemapLastGenerated
                  ? new Date(settings.sitemapLastGenerated).toLocaleString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : 'Never'}
              </strong>{' '}
              <br />
              URLs: <strong>{settings?.sitemapUrlsCount || 0}</strong> <br />
              Status: <strong className="text-green-600">Available</strong>
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={handleGenerateSitemap}
                disabled={isGeneratingSitemap}
                className="flex-1 px-4 py-2 bg-saffron text-white rounded-md font-medium hover:bg-saffron/90 disabled:opacity-60 transition-colors"
              >
                {isGeneratingSitemap ? 'Generating...' : 'Generate'}
              </button>
              <a
                href="/sitemap.xml"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md font-medium hover:bg-gray-200 block text-center transition-colors"
              >
                View Sitemap
              </a>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md border border-blue-100 shadow-sm p-6 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Robots.txt</h3>
            <p className="text-sm text-gray-500 mb-6">
              Automatically generate a standard robots.txt file to guide search engine crawlers properly.
            </p>
            <div className="flex gap-3 w-full mt-auto">
              <button
                onClick={handleGenerateRobots}
                disabled={isGeneratingRobots}
                className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-md font-medium hover:bg-gray-800 disabled:opacity-60 transition-colors"
              >
                {isGeneratingRobots ? 'Generating...' : 'Generate robots.txt'}
              </button>
              <a
                href="/robots.txt"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md font-medium hover:bg-gray-200 block text-center transition-colors"
              >
                View robots.txt
              </a>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'generator' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md border border-blue-100 shadow-sm p-8 text-center">
            <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-saffron" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Bulk SEO Tools</h2>
            <p className="text-gray-500 mb-8 max-w-2xl mx-auto">
              Automatically generate missing SEO titles and meta descriptions for all content in the background. This
              process will <strong>never</strong> overwrite manually entered SEO values. It will generate values{' '}
              <strong>only when</strong> the SEO Title or Meta Description is empty.
            </p>

            <div className="bg-gray-50 p-4 rounded-md border border-gray-200 text-left space-y-4 mb-8">
              <h4 className="font-semibold text-gray-900">Supported content types:</h4>
              <div className="grid grid-cols-2 gap-3">
                {['Bhajans', 'Articles', 'Festivals', 'Puranas', 'Categories'].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerateBulk}
              disabled={isStartingBulk}
              className="px-6 py-3 bg-saffron text-white rounded-md font-bold hover:bg-saffron/90 disabled:opacity-60 w-full shadow-sm text-lg flex items-center justify-center gap-2 transition-colors"
            >
              <Zap className="w-5 h-5" />
              {isStartingBulk ? 'Queueing Bulk Job...' : 'Start Bulk Generation Job'}
            </button>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md border border-blue-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Background Job Status</h3>
              <Link
                to={getAdminPath('/ai')}
                className="text-xs text-saffron hover:underline flex items-center gap-1 font-medium"
              >
                Queue <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-md divide-y divide-gray-100">
              {bulkJobs && bulkJobs.length > 0 ? (
                bulkJobs.slice(0, 4).map((job: any) => (
                  <div key={job.id} className="p-3 text-left space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-800 truncate max-w-[150px]">{job.job_name}</span>
                      <span
                        className={cn(
                          'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase',
                          job.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-800'
                            : job.status === 'PROCESSING'
                              ? 'bg-blue-100 text-blue-800 animate-pulse'
                              : job.status === 'FAILED'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-700'
                        )}
                      >
                        {job.status}
                      </span>
                    </div>
                    {job.status === 'PROCESSING' && (
                      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all duration-300"
                          style={{ width: `${job.progress || 10}%` }}
                        />
                      </div>
                    )}
                    <div className="flex items-center justify-between text-[11px] text-gray-500">
                      <span>
                        {job.processed_items || 0} / {job.total_items || 0} items
                      </span>
                      <span>
                        {new Date(job.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-gray-500 text-center">
                  <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm">No SEO generation jobs have been executed yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
