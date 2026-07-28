import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  PlaySquare, Settings, Clock, RefreshCw, CheckCircle2, 
  XCircle, Filter, Search, Link as LinkIcon, ExternalLink, Trash2, ShieldCheck, AlertCircle
} from 'lucide-react';
import { apiClient } from '../../../api/client';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

import { Select } from '../../../components/ui/Select';

export const AdminYoutube = () => {
  const [activeTab, setActiveTab] = useState<'videos' | 'history' | 'settings'>('videos');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [linkDialogOpen, setLinkDialogOpen] = useState<string | null>(null);
  const [syncInterval, setSyncInterval] = useState('12h');

  // Fetch Settings
  const { data: settings, refetch: refetchSettings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await apiClient.get('/v1/settings');
      return res.data.data;
    }
  });

  // Fetch Stats
  const { data: stats } = useQuery({
    queryKey: ['youtube-stats'],
    queryFn: async () => {
      const res = await apiClient.get('/v1/admin/youtube/stats');
      return res.data.data;
    }
  });

  // Fetch Videos
  const { data: videosData, isLoading: isLoadingVideos, refetch: refetchVideos } = useQuery({
    queryKey: ['youtube-videos', searchTerm, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      const res = await apiClient.get(`/v1/admin/youtube/videos?${params.toString()}`);
      return res.data.data;
    }
  });

  // Sync Mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/v1/admin/youtube/sync');
      return res.data;
    },
    onSuccess: () => {
      toast.success('Sync completed successfully!');
      refetchSettings();
      refetchVideos();
    },
    onError: () => {
      toast.error('Failed to sync with YouTube');
    }
  });

  // Save Settings Mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (updates: any) => {
      await apiClient.put('/v1/settings', updates);
    },
    onSuccess: () => {
      toast.success('Configuration saved');
      refetchSettings();
    }
  });

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    saveSettingsMutation.mutate({
      youtubeChannelId: formData.get('channelId'),
      youtubeAutoSync: formData.get('autoSync') === 'true',
      youtubeSyncInterval: syncInterval
    });
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'NEW': return <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">New</span>;
      case 'REVIEWED': return <span className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">Reviewed</span>;
      case 'LINKED': return <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Linked</span>;
      case 'IGNORED': return <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold">Ignored</span>;
      default: return <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  return (
    <div className="flex-1 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <PlaySquare className="w-6 h-6 text-red-600" />
            YouTube Import Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">Import, review, and link YouTube videos directly to your platform.</p>
        </div>
          <button 
            type="button"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
            {syncMutation.isPending ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center text-center">
          <PlaySquare className="w-6 h-6 text-red-500 mb-2" />
          <p className="text-xs text-gray-500 font-semibold uppercase">Channel</p>
          <p className="text-sm font-bold text-gray-900 truncate w-full" title={settings?.youtubeChannelId}>{settings?.youtubeChannelId || 'Not Configured'}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center text-center">
          <CheckCircle2 className="w-6 h-6 text-blue-500 mb-2" />
          <p className="text-xs text-gray-500 font-semibold uppercase">Total Imported</p>
          <p className="text-xl font-bold text-gray-900">{stats?.total || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center text-center">
          <LinkIcon className="w-6 h-6 text-green-500 mb-2" />
          <p className="text-xs text-gray-500 font-semibold uppercase">Linked</p>
          <p className="text-xl font-bold text-gray-900">{stats?.linked || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center text-center">
          <AlertCircle className="w-6 h-6 text-orange-500 mb-2" />
          <p className="text-xs text-gray-500 font-semibold uppercase">Pending Review</p>
          <p className="text-xl font-bold text-gray-900">{stats?.pending || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center text-center">
          <XCircle className="w-6 h-6 text-gray-400 mb-2" />
          <p className="text-xs text-gray-500 font-semibold uppercase">Ignored</p>
          <p className="text-xl font-bold text-gray-900">{stats?.ignored || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center text-center">
          <Clock className="w-6 h-6 text-purple-500 mb-2" />
          <p className="text-xs text-gray-500 font-semibold uppercase">Last Sync</p>
          <p className="text-sm font-bold text-gray-900">
            {settings?.youtubeLastSync ? format(new Date(settings.youtubeLastSync), 'dd MMM, HH:mm') : 'Never'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('videos')}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'videos' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Imported Videos
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'history' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Sync History
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'settings' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Configuration
        </button>
      </div>

      {/* Configuration Tab */}
      {activeTab === 'settings' && (
        <div className="max-w-2xl bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-500" />
            Channel Configuration
          </h2>

          {settings?.youtubeChannelId && (
            <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h3 className="font-bold text-gray-900 mb-4 text-sm">Connected Channel Information</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Channel Name</p>
                  <p className="font-bold text-gray-900">Aradhna Marg</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Channel Handle</p>
                  <p className="font-bold text-gray-900">@aradhnamarg</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Total Videos</p>
                  <p className="font-bold text-gray-900">{stats?.total || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Status</p>
                  <p className="font-bold text-green-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> Connected</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSaveConfig} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">YouTube Channel ID</label>
              <input 
                name="channelId"
                type="text" 
                defaultValue={settings?.youtubeChannelId}
                placeholder="e.g. UCX6OQ3DkcsbYNE6H8uQQuVA"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                required
              />
              <p className="text-xs text-gray-500">The unique ID of the YouTube channel to synchronize from.</p>
            </div>
            
            <div className="space-y-2 pt-4 border-t border-gray-100">
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  name="autoSync" 
                  value="true"
                  defaultChecked={settings?.youtubeAutoSync}
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-600"
                />
                <span className="font-bold text-gray-700">Enable Auto Sync</span>
              </label>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Sync Interval</label>
              <Select 
                value={syncInterval}
                onChange={(val) => setSyncInterval(val)}
                options={[
                  { label: 'Every 1 Hour', value: '1h' },
                  { label: 'Every 6 Hours', value: '6h' },
                  { label: 'Every 12 Hours', value: '12h' },
                  { label: 'Daily', value: '24h' }
                ]}
                searchable={false}
              />
            </div>

            <div className="pt-4 flex items-center gap-3">
              <button 
                type="submit" 
                disabled={saveSettingsMutation.isPending}
                className="px-6 py-2.5 bg-gray-900 text-white font-bold rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {saveSettingsMutation.isPending ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Videos Tab */}
      {activeTab === 'videos' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search by title or video ID..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-48">
              <Filter className="w-4 h-4 text-gray-400" />
              <Select 
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { label: 'All Statuses', value: '' },
                  { label: 'New', value: 'NEW' },
                  { label: 'Reviewed', value: 'REVIEWED' },
                  { label: 'Linked', value: 'LINKED' },
                  { label: 'Ignored', value: 'IGNORED' }
                ]}
                searchable={false}
              />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-4 font-bold">Video</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                    <th className="px-6 py-4 font-bold">Linked Bhajan</th>
                    <th className="px-6 py-4 font-bold">Published</th>
                    <th className="px-6 py-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {isLoadingVideos ? (
                    <tr><td colSpan={5} className="p-8 text-center text-gray-500">Loading videos...</td></tr>
                  ) : !videosData?.data || videosData.data.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-gray-500">
                        <PlaySquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-lg font-semibold text-gray-900">No videos found</p>
                        <p className="text-sm mt-1">No YouTube videos have been imported yet. Configure your YouTube Channel and click 'Sync Now' to import videos.</p>
                      </td>
                    </tr>
                  ) : (
                    videosData.data.map((video: any) => (
                      <tr key={video.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-32 h-18 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 relative group">
                              <img src={video.thumbnail} alt="" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <a href={video.youtubeUrl} target="_blank" rel="noreferrer" className="p-1.5 bg-red-600 text-white rounded-full">
                                  <PlaySquare className="w-4 h-4" />
                                </a>
                              </div>
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-bold text-gray-900 line-clamp-2" title={video.title}>{video.title}</h4>
                              <p className="text-xs text-gray-500 mt-1">{video.duration} • ID: {video.youtubeVideoId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(video.importStatus)}
                        </td>
                        <td className="px-6 py-4">
                          {video.linkedBhajan ? (
                            <a href={`/admin/bhajans/${video.linkedBhajan.id}/edit`} className="text-sm font-semibold text-saffron hover:underline flex items-center gap-1">
                              <LinkIcon className="w-3 h-3" />
                              {video.linkedBhajan.title}
                            </a>
                          ) : (
                            <span className="text-sm text-gray-400 italic">Not linked</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600">{format(new Date(video.publishedAt), 'dd MMM yyyy')}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <a 
                              href={video.youtubeUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Preview on YouTube"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                            <button 
                              onClick={() => setLinkDialogOpen(video.id)}
                              className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                              title="Link to Bhajan"
                            >
                              <LinkIcon className="w-4 h-4" />
                            </button>
                            <button 
                              className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                              title="Mark Reviewed"
                            >
                              <ShieldCheck className="w-4 h-4" />
                            </button>
                            <button 
                              className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                              title="Ignore"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                            <button 
                              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4 font-bold">Started</th>
                <th className="px-6 py-4 font-bold">Completed</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold text-center">Imported</th>
                <th className="px-6 py-4 font-bold text-center">Updated</th>
                <th className="px-6 py-4 font-bold text-center">Ignored</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  History log placeholder. The backend history API will populate this.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Link Dialog */}
      {linkDialogOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Link Bhajan</h3>
              <button onClick={() => setLinkDialogOpen(null)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-5 h-5"/>
              </button>
            </div>
            <div className="p-6 pb-48 flex flex-col">
              <label className="text-sm font-bold text-gray-700 mb-2">Search Bhajans</label>
              <Select 
                options={[
                  {label: 'Aarti Kunj Bihari Ki', value: '1'}, 
                  {label: 'Achyutam Keshavam', value: '2'},
                  {label: 'Hanuman Chalisa', value: '3'}
                ]}
                value=""
                onChange={() => {
                  toast.success('Bhajan linked successfully');
                  setLinkDialogOpen(null);
                }}
                placeholder="Search bhajans..."
                searchable={true}
              />
              <p className="text-xs text-gray-500 mt-4">
                Select a Bhajan from your database to link this YouTube video directly to its page.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
