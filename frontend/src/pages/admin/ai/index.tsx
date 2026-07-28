import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../api/client';
import toast from 'react-hot-toast';
import { 
  Bot, CheckCircle2, XCircle, Clock, Zap, Play, RotateCcw, Trash2, 
  AlertCircle, FileText, Calendar, FolderTree, BookOpen, Music, RefreshCw
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';

export function AdminAI() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'assistant' | 'bulk' | 'queue' | 'history' | 'failed'>('assistant');

  // Fetch Stats
  const { data: stats } = useQuery({
    queryKey: ['admin-ai-stats'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/ai/stats');
      return res.data?.data || { today: 0, completed: 0, failed: 0, pending: 0 };
    },
    refetchInterval: 10000 // poll every 10 seconds
  });

  // Fetch Jobs based on active tab
  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ['admin-ai-jobs', activeTab],
    queryFn: async () => {
      let status = '';
      if (activeTab === 'queue') status = 'PENDING,PROCESSING';
      if (activeTab === 'history') status = 'COMPLETED';
      if (activeTab === 'failed') status = 'FAILED';
      
      const res = await apiClient.get('/admin/ai/jobs', {
        params: { status, limit: 50 }
      });
      return res.data?.data || { data: [], count: 0 };
    },
    enabled: ['queue', 'history', 'failed'].includes(activeTab),
    refetchInterval: activeTab === 'queue' ? 5000 : false
  });

  const jobs = jobsData?.data || [];

  // Mutations
  const queueMutation = useMutation({
    mutationFn: async (payload: { job_name: string; content_type: string; action_type: string; total_items?: number }) => {
      await apiClient.post('/admin/ai/queue', payload);
    },
    onSuccess: () => {
      toast.success('AI Job added to queue');
      queryClient.invalidateQueries({ queryKey: ['admin-ai-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-ai-jobs'] });
      setActiveTab('queue');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to queue job');
    }
  });

  const retryMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.post(`/admin/ai/jobs/${id}/retry`);
    },
    onSuccess: () => {
      toast.success('Job queued for retry');
      queryClient.invalidateQueries({ queryKey: ['admin-ai-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-ai-jobs'] });
    }
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.post(`/admin/ai/jobs/${id}/cancel`);
    },
    onSuccess: () => {
      toast.success('Job cancelled');
      queryClient.invalidateQueries({ queryKey: ['admin-ai-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-ai-jobs'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/admin/ai/jobs/${id}`);
    },
    onSuccess: () => {
      toast.success('Job deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-ai-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-ai-jobs'] });
    }
  });

  const handleQueueJob = (job_name: string, content_type: string, action_type: string, total_items = 1) => {
    queueMutation.mutate({ job_name, content_type, action_type, total_items });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3 mr-1" /> Completed</span>;
      case 'FAILED': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" /> Failed</span>;
      case 'PROCESSING': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 animate-pulse"><Zap className="w-3 h-3 mr-1" /> Processing</span>;
      default: return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"><Clock className="w-3 h-3 mr-1" /> Pending</span>;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-IN', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
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
        { name: 'Rewrite Content', type: 'REWRITE_CONTENT' },
        { name: 'Expand Content', type: 'EXPAND_CONTENT' },
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
      actions: [
        { name: 'Generate Short Description', type: 'GENERATE_SHORT_DESC' }
      ]
    },
    {
      title: 'Categories',
      icon: <FolderTree className="w-6 h-6 text-orange-500" />,
      actions: [
        { name: 'Generate SEO', type: 'GENERATE_SEO' }
      ]
    }
  ];

  return (
    <div className="flex flex-col space-y-6 pb-8">
      {/* Header & Stats Overview */}
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Processing Pipeline</h1>
          <p className="text-sm text-gray-500 mt-1">Automate repetitive content tasks with AI. Your API keys and configurations are securely managed by the server.</p>
        </div>
        
        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Today's Jobs</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.today || 0}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                <Bot className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Queue</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.pending || 0}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Completed Jobs</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.completed || 0}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Failed Jobs</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.failed || 0}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-gray-200">
        {[
          { id: 'assistant', label: 'Content Assistant' },
          { id: 'bulk', label: 'Bulk Processing' },
          { id: 'queue', label: 'Processing Queue' },
          { id: 'history', label: 'History' },
          { id: 'failed', label: 'Failed Jobs' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id 
                ? 'border-saffron text-saffron' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col min-h-[400px]">
        
        {/* Content Assistant Tab */}
        {activeTab === 'assistant' && (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Content Assistant</h2>
            <p className="text-sm text-gray-500 mb-6">Select an AI action for individual content types. The system will queue a job to process the requested enhancements.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assistantCards.map(card => (
                <div key={card.title} className="border border-gray-100 rounded-xl p-5 hover:border-saffron/30 hover:shadow-md transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gray-50 rounded-lg">
                      {card.icon}
                    </div>
                    <h3 className="font-semibold text-gray-900">{card.title}</h3>
                  </div>
                  <div className="space-y-2">
                    {card.actions.map(action => (
                      <button
                        key={action.name}
                        disabled={action.disabled || queueMutation.isPending}
                        onClick={() => handleQueueJob(`${action.name} for ${card.title}`, card.title, action.type, 1)}
                        className={`w-full flex items-center justify-between px-4 py-2 text-sm rounded-lg border transition-colors ${
                          action.disabled 
                            ? 'bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-saffron hover:text-saffron hover:bg-orange-50'
                        }`}
                      >
                        <span>{action.name}</span>
                        <Play className={`w-4 h-4 ${action.disabled ? 'text-gray-300' : ''}`} />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bulk Processing Tab */}
        {activeTab === 'bulk' && (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Bulk Processing Tools</h2>
            <p className="text-sm text-gray-500 mb-6">Run AI operations across multiple records. The system will only process records where the target fields are currently empty (it will never overwrite manual content).</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { name: 'Generate SEO Meta Descriptions', desc: 'Generates missing SEO descriptions for all Bhajans and Articles', type: 'BULK_SEO', content: 'Global', items: 150 },
                { name: 'Generate Article Excerpts', desc: 'Creates short summaries for articles missing an excerpt', type: 'BULK_EXCERPT', content: 'Articles', items: 45 },
                { name: 'Generate Festival Summaries', desc: 'Fills missing descriptions for upcoming festivals', type: 'BULK_FESTIVAL', content: 'Festivals', items: 12 },
              ].map(tool => (
                <div key={tool.name} className="flex flex-col border border-gray-200 rounded-xl p-5 bg-gray-50/50">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{tool.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{tool.desc}</p>
                    <div className="mt-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      ~{tool.items} records detected
                    </div>
                  </div>
                  <div className="mt-5 pt-4 border-t border-gray-200">
                    <Button 
                      onClick={() => handleQueueJob(tool.name, tool.content, tool.type, tool.items)}
                      disabled={queueMutation.isPending}
                      className="w-full justify-center"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Run Bulk Job
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Table Views (Queue, History, Failed) */}
        {['queue', 'history', 'failed'].includes(activeTab) && (
          <div className="flex-1 overflow-x-auto">
            {jobsLoading ? (
              <div className="flex items-center justify-center h-64 text-gray-400">
                <RefreshCw className="w-6 h-6 animate-spin" />
              </div>
            ) : jobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <Bot className="w-12 h-12 mb-3 opacity-20" />
                <p>No jobs found in this view.</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 text-gray-500 border-b border-gray-100 uppercase text-xs tracking-wider sticky top-0">
                  <tr>
                    <th className="px-6 py-4 font-bold">Job Name</th>
                    <th className="px-6 py-4 font-bold">Content Type</th>
                    {activeTab === 'queue' && <th className="px-6 py-4 font-bold">Progress</th>}
                    {activeTab === 'history' && <th className="px-6 py-4 font-bold">Items Processed</th>}
                    <th className="px-6 py-4 font-bold">Status</th>
                    {activeTab === 'history' ? <th className="px-6 py-4 font-bold">Completed Time</th> : <th className="px-6 py-4 font-bold">Started</th>}
                    {activeTab === 'failed' && <th className="px-6 py-4 font-bold">Error</th>}
                    <th className="px-6 py-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {jobs.map((job: any) => (
                    <tr key={job.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{job.job_name}</td>
                      <td className="px-6 py-4 text-gray-500">{job.content_type}</td>
                      
                      {activeTab === 'queue' && (
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 max-w-[150px]">
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${job.status === 'PROCESSING' ? 'bg-blue-500' : 'bg-gray-300'}`}
                                style={{ width: `${job.progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 w-8">{job.progress}%</span>
                          </div>
                        </td>
                      )}
                      
                      {activeTab === 'history' && (
                        <td className="px-6 py-4 text-gray-500">
                          {job.processed_items} / {job.total_items}
                        </td>
                      )}
                      
                      <td className="px-6 py-4">
                        {getStatusBadge(job.status)}
                      </td>
                      
                      {activeTab === 'history' ? (
                        <td className="px-6 py-4 text-gray-500">{formatDate(job.completed_at)}</td>
                      ) : (
                        <td className="px-6 py-4 text-gray-500">{formatDate(job.started_at)}</td>
                      )}
                      
                      {activeTab === 'failed' && (
                        <td className="px-6 py-4 text-red-500 max-w-[200px] truncate" title={job.error_message}>
                          {job.error_message || 'Unknown error'}
                        </td>
                      )}

                      <td className="px-6 py-4 text-right space-x-2">
                        {['PENDING', 'PROCESSING'].includes(job.status) && (
                          <button 
                            onClick={() => cancelMutation.mutate(job.id)}
                            disabled={cancelMutation.isPending}
                            className="p-1.5 text-gray-400 hover:text-orange-500 transition-colors"
                            title="Cancel Job"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        {job.status === 'FAILED' && (
                          <button 
                            onClick={() => retryMutation.mutate(job.id)}
                            disabled={retryMutation.isPending}
                            className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors"
                            title="Retry Job"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                        {['COMPLETED', 'FAILED'].includes(job.status) && (
                          <button 
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this job record?')) {
                                deleteMutation.mutate(job.id);
                              }
                            }}
                            disabled={deleteMutation.isPending}
                            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
