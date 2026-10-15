import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiClient } from '@api/client';
import toast from 'react-hot-toast';
import { Zap, Play, FileText, Calendar, FolderTree, BookOpen, Music, BrainCircuit, ArrowUpRight } from 'lucide-react';
import { AdminButton } from '@admin/components/AdminButton';
import { getAdminPath } from '@utils/host';

export function AdminAIProcessing() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab') as 'single' | 'bulk' | null;
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>(
    urlTab && ['single', 'bulk'].includes(urlTab) ? urlTab : 'single'
  );

  useEffect(() => {
    if (urlTab && ['single', 'bulk'].includes(urlTab) && urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
  }, [urlTab]);

  const handleTabChange = (tab: 'single' | 'bulk') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Fetch real Bulk Counts from Database
  const { data: bulkCounts, isLoading: isLoadingBulkCounts } = useQuery({
    queryKey: ['admin-ai-bulk-counts'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/ai/bulk-counts');
      return res.data?.data || { bulkSeo: 0, bulkExcerpt: 0, bulkFestival: 0, bulkBhajanMeaning: 0 };
    },
    enabled: activeTab === 'bulk',
    refetchInterval: activeTab === 'bulk' ? 5000 : false
  });

  // Queue Mutation
  const queueMutation = useMutation({
    mutationFn: async (payload: {
      job_name: string;
      content_type: string;
      action_type: string;
      total_items?: number;
    }) => {
      await apiClient.post('/admin/ai/queue', payload);
    },
    onSuccess: (_, variables) => {
      toast.success(`Job "${variables.job_name}" added to queue!`);
      queryClient.invalidateQueries({ queryKey: ['admin-ai-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-ai-bulk-counts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-ai-jobs-activity'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to queue job');
    }
  });

  const handleQueueJob = (job_name: string, content_type: string, action_type: string, total_items = 1) => {
    queueMutation.mutate({ job_name, content_type, action_type, total_items });
  };

  const assistantCards = [
    {
      title: 'Bhajans',
      icon: <Music className="w-6 h-6 text-saffron" />,
      actions: [
        { name: 'Generate Meaning', type: 'GENERATE_MEANING' },
        { name: 'Translate (Future)', type: 'TRANSLATE', disabled: true }
      ]
    },
    {
      title: 'Articles',
      icon: <FileText className="w-6 h-6 text-blue-500" />,
      actions: [
        { name: 'Generate Summary', type: 'GENERATE_SUMMARY' },
        { name: 'Improve Grammar', type: 'IMPROVE_GRAMMAR' },
        { name: 'Generate SEO', type: 'GENERATE_SEO' }
      ]
    },
    {
      title: 'Festivals',
      icon: <Calendar className="w-6 h-6 text-green-500" />,
      actions: [
        { name: 'Improve Description', type: 'IMPROVE_DESCRIPTION' },
        { name: 'Generate SEO', type: 'GENERATE_SEO' }
      ]
    },
    {
      title: 'Puranas',
      icon: <BookOpen className="w-6 h-6 text-purple-500" />,
      actions: [{ name: 'Generate Short Description', type: 'GENERATE_SHORT_DESC' }]
    },
    {
      title: 'Categories',
      icon: <FolderTree className="w-6 h-6 text-orange-500" />,
      actions: [{ name: 'Generate SEO', type: 'GENERATE_SEO' }]
    }
  ];

  return (
    <div className="space-y-6 flex flex-col flex-1 pb-8 w-full max-w-full min-w-0">
      {/* Header & Direct Execution Notice */}
      <div className="space-y-4">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold tracking-wide text-slate-900 flex items-center gap-2 uppercase truncate">
            <BrainCircuit className="w-5 h-5 sm:w-6 sm:h-6 text-saffron shrink-0" />
            <span className="truncate">AI PROCESSING</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Run AI-powered operations directly on your content. The system generates results and automatically updates
            database records.
          </p>
        </div>

        {/* Mental Model / Direct AI Notice */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-md p-4 flex items-center gap-3 shadow-2xs">
          <div className="p-2 bg-blue-100 rounded-md text-blue-800 shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider bg-blue-200/80 text-blue-950 px-2 py-0.5 rounded">
                Direct Execution
              </span>
              <span className="text-xs font-semibold text-blue-900">Single & Bulk Operations</span>
            </div>
            <p className="text-xs text-blue-950/80 mt-1">
              Operations triggered here execute directly without a proposal staging step. Choose a single content action
              below or run bulk processing across eligible records.
            </p>
          </div>
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto scrollbar-hide gap-1 sm:gap-2">
        {[
          { id: 'single', label: 'Single Content Operations' },
          { id: 'bulk', label: 'Bulk Operations' }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabChange(tab.id as any)}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold uppercase border-b-2 transition-colors shrink-0 ${
              activeTab === tab.id
                ? 'border-saffron text-saffron'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-gradient-to-br from-indigo-50/50 to-white rounded-md border border-indigo-100 shadow-xs flex flex-col">
        {/* Single Operations Tab */}
        {activeTab === 'single' && (
          <div className="p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">AI Operations for Content</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 mb-4 sm:mb-6">
              Select an action for individual content types. The background worker will process the request and update
              the corresponding record directly.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6">
              {assistantCards.map((card) => (
                <div
                  key={card.title}
                  className="border border-indigo-100/80 bg-white/90 rounded-md p-3.5 sm:p-5 hover:border-saffron/30 hover:shadow-md transition-all shadow-xs"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4">
                    <div className="p-1.5 sm:p-2 bg-gray-50 rounded-md">{card.icon}</div>
                    <h3 className="font-semibold text-sm sm:text-base text-gray-900">{card.title}</h3>
                  </div>
                  <div className="space-y-2">
                    {card.actions.map((action) => (
                      <button
                        key={action.name}
                        disabled={action.disabled || queueMutation.isPending}
                        onClick={() => handleQueueJob(`${action.name} for ${card.title}`, card.title, action.type, 1)}
                        className={`w-full flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm rounded-md border transition-colors cursor-pointer ${
                          action.disabled
                            ? 'bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-saffron hover:text-saffron hover:bg-orange-50'
                        }`}
                      >
                        <span>{action.name}</span>
                        <Play className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${action.disabled ? 'text-gray-300' : ''}`} />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bulk Operations Tab */}
        {activeTab === 'bulk' && (
          <div className="p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Bulk Operations</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 mb-4 sm:mb-6">
              Run AI operations across multiple records. The system only processes records where target fields are
              currently empty (it will never overwrite manual editorial content).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5 lg:gap-6">
              {[
                {
                  name: 'Generate Bhajan Meanings',
                  desc: 'Creates devotional meaning (Bhavarth in Hindi & English) for bhajans missing a description',
                  type: 'BULK_BHAJAN_MEANING',
                  content: 'Bhajans',
                  items: bulkCounts?.bulkBhajanMeaning ?? 0,
                  redirectPath: getAdminPath('/bhajans'),
                  redirectTooltip: 'View bhajans missing a devotional meaning'
                },
                {
                  name: 'Generate Missing SEO',
                  desc: 'Generates missing SEO titles and meta descriptions for Bhajans and Articles',
                  type: 'BULK_SEO',
                  content: 'Global',
                  items: bulkCounts?.bulkSeo ?? 0,
                  redirectPath: getAdminPath('/seo?tab=issues'),
                  redirectTooltip: 'View missing SEO records in SEO Engine Issues'
                },
                {
                  name: 'Generate Article Excerpts',
                  desc: 'Creates short summaries for articles missing an excerpt',
                  type: 'BULK_EXCERPT',
                  content: 'Articles',
                  items: bulkCounts?.bulkExcerpt ?? 0,
                  redirectPath: getAdminPath('/articles?missing=excerpt'),
                  redirectTooltip: 'View articles missing an excerpt'
                },
                {
                  name: 'Generate Festival Summaries',
                  desc: 'Fills missing descriptions for upcoming festivals',
                  type: 'BULK_FESTIVAL',
                  content: 'Festivals',
                  items: bulkCounts?.bulkFestival ?? 0,
                  redirectPath: getAdminPath('/festivals?missing=description'),
                  redirectTooltip: 'View festivals missing short description'
                }
              ].map((tool) => (
                <div
                  key={tool.name}
                  className="flex flex-col justify-between border border-gray-200 rounded-md p-3.5 sm:p-5 bg-white/90 shadow-xs"
                >
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold text-sm sm:text-base text-gray-900">{tool.name}</h3>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1 leading-relaxed">{tool.desc}</p>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-2">
                      {tool.items > 0 ? (
                        <button
                          type="button"
                          onClick={() => navigate(tool.redirectPath)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-orange-50 text-orange-800 border border-orange-200/90 hover:bg-orange-100 hover:text-orange-900 hover:border-orange-300 transition-all cursor-pointer group shadow-2xs"
                          title={tool.redirectTooltip}
                        >
                          <span>
                            {tool.items} eligible record{tool.items === 1 ? '' : 's'} detected
                          </span>
                          <ArrowUpRight className="w-3.5 h-3.5 text-orange-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </button>
                      ) : (
                        <div className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                          {isLoadingBulkCounts ? 'Auditing database...' : '0 eligible records detected'}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-gray-200">
                    <AdminButton
                      onClick={() => handleQueueJob(tool.name, tool.content, tool.type, tool.items)}
                      disabled={queueMutation.isPending || tool.items === 0}
                      className="w-full justify-center"
                      leftIcon={<Zap className="w-4 h-4" />}
                    >
                      {tool.items === 0 ? 'No Eligible Records' : 'Run Bulk Job'}
                    </AdminButton>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Backward compatibility alias
export { AdminAIProcessing as AdminAI };
