import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  PlaySquare, Settings, Clock, RefreshCw, CheckCircle2, 
  XCircle, Filter, Search, Link as LinkIcon, ExternalLink, Trash2, ShieldCheck, AlertCircle, X, ArrowUpDown
} from 'lucide-react';
import { apiClient } from '../../../api/client';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

import { Select } from '../../../components/ui/Select';
import { YoutubeApi } from '../../../features/youtube/YoutubeApi';

export const AdminYoutube = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'videos' | 'history' | 'settings'>('videos');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState('published_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [linkDialogOpen, setLinkDialogOpen] = useState<string | null>(null);
  const [selectedBhajanId, setSelectedBhajanId] = useState<string>('');
  const [syncInterval, setSyncInterval] = useState('12h');

  // Fetch Settings
  const { data: settings } = useQuery({
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
      const res = await YoutubeApi.getStats();
      return res.data;
    }
  });

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Fetch Videos
  const { data: videosData, isLoading: isLoadingVideos, isFetching: isFetchingVideos } = useQuery({
    queryKey: ['youtube-videos', searchTerm, statusFilter, typeFilter, sortBy, sortOrder, page, limit],
    queryFn: async () => {
      return await YoutubeApi.getVideos({ 
        search: searchTerm || undefined, 
        status: statusFilter || undefined, 
        type: typeFilter || undefined, 
        sortBy, 
        sortOrder, 
        page, 
        limit 
      });
    }
  });

  // Fetch History
  const { data: historyData, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['youtube-history'],
    queryFn: async () => {
      const res = await YoutubeApi.getHistory();
      return res.data;
    }
  });

  // Sync Mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      return await YoutubeApi.syncNow();
    },
    onSuccess: () => {
      toast.success('Sync completed successfully!');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      queryClient.invalidateQueries({ queryKey: ['youtube-videos'] });
      queryClient.invalidateQueries({ queryKey: ['youtube-history'] });
      queryClient.invalidateQueries({ queryKey: ['youtube-stats'] });
    },
    onError: () => {
      toast.error('Failed to sync with YouTube');
    }
  });

  // Fetch Bhajans for Dropdown
  const { data: bhajansList } = useQuery({
    queryKey: ['youtube-link-bhajans'],
    queryFn: async () => {
      const res = await YoutubeApi.getBhajansForLink();
      return res.data || [];
    }
  });

  // Init selected bhajan when dialog opens
  useEffect(() => {
    if (linkDialogOpen && videosData?.data) {
      const video = videosData.data.find((v: any) => v.id === linkDialogOpen);
      setSelectedBhajanId(video?.linkedBhajan?.id || '');
    }
  }, [linkDialogOpen, videosData]);

  // Link Mutation
  const linkMutation = useMutation({
    mutationFn: async ({ videoId, bhajanId }: { videoId: string, bhajanId: string | null }) => {
      return await YoutubeApi.linkVideo(videoId, bhajanId);
    },
    onSuccess: () => {
      toast.success('Video link updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['youtube-videos'] });
      queryClient.invalidateQueries({ queryKey: ['youtube-stats'] });
      setLinkDialogOpen(null);
    },
    onError: () => {
      toast.error('Failed to update video link');
    }
  });

  // Status Mutation
  const statusMutation = useMutation({
    mutationFn: async ({ videoId, status }: { videoId: string, status: string }) => {
      return await YoutubeApi.updateStatus(videoId, status);
    },
    onSuccess: () => {
      toast.success('Status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['youtube-videos'] });
      queryClient.invalidateQueries({ queryKey: ['youtube-stats'] });
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (videoId: string) => {
      return await YoutubeApi.deleteVideo(videoId);
    },
    onSuccess: () => {
      toast.success('Video deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['youtube-videos'] });
      queryClient.invalidateQueries({ queryKey: ['youtube-stats'] });
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
    <div className="space-y-6 flex flex-col flex-1 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 uppercase">
            <PlaySquare className="w-6 h-6 text-red-600" />
            YOUTUBE IMPORT MANAGEMENT
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
          <p className="text-sm font-bold text-gray-900 truncate w-full" title={settings?.youtubeChannelId}>{settings?.youtubeChannelId ? `${settings.youtubeChannelId.slice(0, 15)}...` : 'Not Configured'}</p>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Settings className="w-5 h-5 text-gray-500" />
              Channel Configuration
            </h2>

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

          <div className="lg:col-span-1">
            {settings?.youtubeChannelId && (
              <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm sticky top-6">
                <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2 text-sm uppercase tracking-wider">
                  <PlaySquare className="w-4 h-4 text-gray-400" />
                  Connected Channel
                </h3>
                <div className="flex flex-col items-center text-center gap-4 mb-6">
                  {stats?.channelThumbnail ? (
                    <img src={stats.channelThumbnail} alt="Channel" className="w-20 h-20 rounded-full object-cover border border-gray-200 shadow-sm" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200 shadow-sm">
                      <PlaySquare className="w-8 h-8 text-gray-300" />
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg leading-tight">{stats?.channelTitle || 'Loading...'}</h4>
                    <p className="text-xs text-gray-500 mt-1 break-all">{settings?.youtubeChannelId}</p>
                  </div>
                </div>
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-500">Total Videos</span>
                    <span className="font-bold text-gray-900">{stats?.channelTotal !== undefined ? stats.channelTotal : (stats?.total || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-500">Status</span>
                    <span className="font-bold text-green-600 flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded-md"><CheckCircle2 className="w-4 h-4"/> Connected</span>
                  </div>
                </div>
              </div>
            )}
          </div>
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
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
              />
              {searchTerm && (
                <button 
                  onClick={() => { setSearchTerm(''); setPage(1); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-2 w-full sm:w-80">
                <Filter className="w-4 h-4 text-gray-400" />
                <Select 
                  value={statusFilter}
                  onChange={(val) => { setStatusFilter(val); setPage(1); }}
                  options={[
                    { label: 'All Statuses', value: '' },
                    { label: 'New', value: 'NEW' },
                    { label: 'Reviewed', value: 'REVIEWED' },
                    { label: 'Linked', value: 'LINKED' },
                    { label: 'Ignored', value: 'IGNORED' }
                  ]}
                  className="w-36"
                  searchable={false}
                />
                <Select
                  value={typeFilter}
                  onChange={(val) => { setTypeFilter(val); setPage(1); }}
                  options={[
                    { label: 'All Types', value: '' },
                    { label: 'Videos', value: 'VIDEO' },
                    { label: 'Shorts', value: 'SHORT' }
                  ]}
                  className="w-32"
                  searchable={false}
                />
              </div>
              <button 
                onClick={() => { 
                  queryClient.invalidateQueries({ queryKey: ['youtube-videos'] }); 
                  queryClient.invalidateQueries({ queryKey: ['youtube-stats'] }); 
                  queryClient.invalidateQueries({ queryKey: ['settings'] }); 
                  queryClient.invalidateQueries({ queryKey: ['youtube-history'] }); 
                }} 
                className="p-2 rounded-lg text-white bg-saffron hover:bg-orange-600 transition-colors shadow-sm flex items-center justify-center"
                title="Refresh Data"
              >
                <RefreshCw className={`w-5 h-5 ${isFetchingVideos ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="overflow-x-auto rounded-t-xl">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-4 font-bold w-[45%]">Video</th>
                    <th className="px-6 py-4 font-bold text-center w-[10%] cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => {
                      if (sortBy === 'import_status') {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortBy('import_status');
                        setSortOrder('asc');
                      }
                      setPage(1);
                    }}>
                      <div className="flex items-center justify-center gap-1">
                        Status
                        <ArrowUpDown className={`w-3 h-3 ${sortBy === 'import_status' ? 'text-saffron' : 'text-gray-400'}`} />
                      </div>
                    </th>
                    <th className="px-6 py-4 font-bold w-[25%]">Linked Bhajan</th>
                    <th className="px-6 py-4 font-bold w-[10%] cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => {
                      if (sortBy === 'published_at') {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortBy('published_at');
                        setSortOrder('desc');
                      }
                      setPage(1);
                    }}>
                      <div className="flex items-center gap-1">
                        Published
                        <ArrowUpDown className={`w-3 h-3 ${sortBy === 'published_at' ? 'text-saffron' : 'text-gray-400'}`} />
                      </div>
                    </th>
                    <th className="px-6 py-4 font-bold text-right w-[10%]">Actions</th>
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
                              <div className="flex items-center gap-2 mt-1">
                                <p className="text-xs text-gray-500">{video.duration} • ID: {video.youtubeVideoId}</p>
                                {(() => {
                                  const str = video.duration || '';
                                  let secs = 0;
                                  const hMatch = str.match(/(\d+)h/);
                                  const mMatch = str.match(/(\d+)m/);
                                  const sMatch = str.match(/(\d+)s/);
                                  if (hMatch) secs += parseInt(hMatch[1], 10) * 3600;
                                  if (mMatch) secs += parseInt(mMatch[1], 10) * 60;
                                  if (sMatch) secs += parseInt(sMatch[1], 10);
                                  
                                  return secs > 0 && secs <= 180 ? (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-600 uppercase tracking-wider">Short</span>
                                  ) : null;
                                })()}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {getStatusBadge(video.importStatus)}
                        </td>
                        <td className="px-6 py-4">
                          {video.linkedBhajan ? (
                            <Link to={`/admin/bhajans/${video.linkedBhajan.id}/edit`} className="text-sm font-semibold text-saffron hover:underline flex items-center gap-1">
                              <LinkIcon className="w-3 h-3" />
                              {video.linkedBhajan.title}
                            </Link>
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
                              onClick={() => statusMutation.mutate({ videoId: video.id, status: 'REVIEWED' })}
                              disabled={statusMutation.isPending || video.importStatus === 'REVIEWED'}
                              className={`p-1.5 rounded transition-colors ${video.importStatus === 'REVIEWED' ? 'text-purple-300 cursor-not-allowed' : 'text-gray-500 hover:text-purple-600 hover:bg-purple-50'}`}
                              title="Mark Reviewed"
                            >
                              <ShieldCheck className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => statusMutation.mutate({ videoId: video.id, status: 'IGNORED' })}
                              disabled={statusMutation.isPending || video.importStatus === 'IGNORED'}
                              className={`p-1.5 rounded transition-colors ${video.importStatus === 'IGNORED' ? 'text-orange-300 cursor-not-allowed' : 'text-gray-500 hover:text-orange-600 hover:bg-orange-50'}`}
                              title="Ignore"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => {
                                if (window.confirm('Are you sure you want to delete this video from the database? It will be re-imported on the next sync unless you ignore it instead.')) {
                                  deleteMutation.mutate(video.id);
                                }
                              }}
                              disabled={deleteMutation.isPending}
                              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
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
            {videosData?.meta && videosData.meta.total > 0 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, videosData.meta.total)} of {videosData.meta.total}</span>
                  <div className="w-40">
                    <Select 
                      value={limit.toString()} 
                      onChange={(val) => { setLimit(parseInt(val)); setPage(1); }}
                      options={[
                        { label: '20 per page', value: '20' },
                        { label: '50 per page', value: '50' },
                        { label: '100 per page', value: '100' }
                      ]}
                      searchable={false}
                      menuPlacement="top"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-600 font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    Previous
                  </button>
                  <button 
                    onClick={() => setPage(p => p + 1)}
                    disabled={page * limit >= videosData.meta.total}
                    className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-600 font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
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
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoadingHistory ? (
                <tr><td colSpan={3} className="p-8 text-center text-gray-500">Loading history...</td></tr>
              ) : !historyData || historyData.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-gray-500">
                    No sync history found.
                  </td>
                </tr>
              ) : (
                historyData.map((log: any) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {log.started_at ? format(new Date(log.started_at), 'dd MMM yyyy, hh:mm a') : '-'}
                    </td>
                    <td className="px-6 py-4">
                      {log.status === 'COMPLETED' ? (
                         <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Completed</span>
                      ) : (
                         <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">Failed</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {log.error_message || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Link Dialog */}
      {linkDialogOpen && createPortal(
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
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
                  { label: 'None (Unlink)', value: '' },
                  ...(bhajansList || []).map((b: any) => ({
                    label: b.title,
                    value: b.id
                  }))
                ]}
                value={selectedBhajanId}
                onChange={(val) => setSelectedBhajanId(val)}
                placeholder="Search bhajans..."
                searchable={true}
              />
              <p className="text-xs text-gray-500 mt-4 mb-6">
                Select a Bhajan from your database to link this YouTube video directly to its page.
              </p>
              
              <button 
                onClick={() => linkMutation.mutate({ videoId: linkDialogOpen, bhajanId: selectedBhajanId || null })}
                disabled={linkMutation.isPending}
                className="w-full py-2.5 bg-saffron text-white rounded-lg font-bold hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                {linkMutation.isPending ? 'Saving...' : 'Save Link'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};
