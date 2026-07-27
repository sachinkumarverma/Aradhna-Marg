import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { apiClient } from '../../../api/client';
import { Select } from '../../../components/ui/Select';
import { Settings, Save, AlertCircle, RefreshCw, Server, ShieldCheck, ShieldAlert, UploadCloud, X } from 'lucide-react';
import { supabase } from '../../../api/supabase';

const TABS = [
  'General', 'Contact', 'Social Media', 'YouTube Automation', 
  'SEO', 'Analytics', 'Advertisement', 'System'
];

export const AdminSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const queryClient = useQueryClient();
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);

  // 1. Load Data
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const res = await apiClient.get('/settings');
      return res.data.data;
    }
  });

  // System Health mock data (Since there are no real health endpoints yet, we simulate them or use real connections)
  const [systemHealth] = useState({
    supabase: 'Connected',
    youtubeApi: 'Connected',
    supabaseStorage: 'Connected',
    backgroundJobs: 'Running',
    searchIndex: 'Healthy',
    lastYoutubeSync: data?.youtubeLastSync || 'Never',
    lastPdfGeneration: '1 hour ago'
  });

  // 2. React Hook Form Setup
  const { register, handleSubmit, formState: { isDirty, isSubmitting }, reset, setValue, control, watch } = useForm({
    defaultValues: data || {},
    values: data || {},
  });

  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, fieldName: 'siteLogo' | 'favicon') => {
    const file = event.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    if (fieldName === 'siteLogo') {
      setLogoFile(file);
    } else {
      setFaviconFile(file);
    }
    setValue(fieldName, url, { shouldDirty: true });
  };

  // 3. Save Mutation
  const updateMutation = useMutation({
    mutationFn: async (formData: any) => {
      let updatedData = { ...formData };
      
      // Handle uploads on save
      if (logoFile) {
        setUploadingLogo(true);
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `siteLogo-${Date.now()}.${fileExt}`;
        const { error, data: uploadData } = await supabase.storage.from('public').upload(`settings/${fileName}`, logoFile);
        setUploadingLogo(false);
        if (!error && uploadData) {
          const { data: { publicUrl } } = supabase.storage.from('public').getPublicUrl(`settings/${fileName}`);
          updatedData.siteLogo = publicUrl;
        }
      }
      
      if (faviconFile) {
        setUploadingFavicon(true);
        const fileExt = faviconFile.name.split('.').pop();
        const fileName = `favicon-${Date.now()}.${fileExt}`;
        const { error, data: uploadData } = await supabase.storage.from('public').upload(`settings/${fileName}`, faviconFile);
        setUploadingFavicon(false);
        if (!error && uploadData) {
          const { data: { publicUrl } } = supabase.storage.from('public').getPublicUrl(`settings/${fileName}`);
          updatedData.favicon = publicUrl;
        }
      }

      const res = await apiClient.put('/settings', updatedData);
      return res.data.data;
    },
    onSuccess: (newData) => {
      toast.success('Settings updated successfully!');
      queryClient.setQueryData(['admin-settings'], newData);
      reset(newData);
      setLogoFile(null);
      setFaviconFile(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update settings');
    }
  });

  const onSubmit = (formData: any) => {
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-saffron animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Loading settings...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 p-6 rounded-lg border border-red-100 flex items-start gap-4">
        <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
        <div>
          <h3 className="text-red-800 font-semibold mb-1">Error Loading Settings</h3>
          <p className="text-red-600 text-sm mb-4">Could not retrieve settings from the server.</p>
          <button onClick={() => refetch()} className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="w-6 h-6 text-saffron" /> System Settings
          </h1>
          <p className="text-sm text-gray-500 mt-1">Configure global application parameters (V2)</p>
        </div>
        <button
          onClick={handleSubmit(onSubmit)}
          disabled={!isDirty || isSubmitting || updateMutation.isPending}
          className="flex items-center gap-2 px-5 py-2.5 bg-saffron text-white rounded-lg font-medium hover:bg-saffron/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting || updateMutation.isPending ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isSubmitting || updateMutation.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar Tabs */}
        <div className="md:w-64 border-b md:border-b-0 md:border-r border-gray-100 bg-gray-50/50 p-4 shrink-0 flex flex-row md:flex-col overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab 
                  ? 'bg-saffron/10 text-saffron' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <form id="settings-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {activeTab === 'General' && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-lg font-semibold border-b pb-2">General Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Website Name</label>
                    <input {...register('siteName')} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-saffron/20 focus:border-saffron outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Copyright Text</label>
                    <input {...register('copyrightText')} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-saffron/20 focus:border-saffron outline-none" />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-medium text-gray-700">Website Description</label>
                    <textarea {...register('siteDescription')} rows={3} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-saffron/20 focus:border-saffron outline-none" />
                  </div>
                  
                  {/* Logo Upload */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Logo Upload</label>
                    {watch('siteLogo') ? (
                      <div className="relative rounded-lg overflow-hidden border border-gray-200 group h-[200px] w-full max-w-sm">
                        <img src={watch('siteLogo')} alt="Logo Preview" className="w-full h-full object-cover bg-gray-50" />
                        <div className="absolute top-3 right-3 flex gap-2">
                          <button 
                            type="button" 
                            onClick={() => window.open(watch('siteLogo'), '_blank')}
                            className="p-2 bg-white text-blue-500 rounded-full hover:bg-blue-50 shadow-md border border-gray-100" title="Preview"
                          >
                            <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                          </button>
                          <button 
                            type="button" 
                            onClick={() => {
                              setValue('siteLogo', '', { shouldDirty: true });
                              setLogoFile(null);
                            }} 
                            className="p-2 bg-white text-red-500 rounded-full hover:bg-red-50 shadow-md border border-gray-100" title="Discard"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer group h-[200px] w-full max-w-sm">
                        <input type="file" accept="image/*" className="hidden" id="site-logo-upload" onChange={(e) => handleFileUpload(e, 'siteLogo')} disabled={uploadingLogo} />
                        <label htmlFor="site-logo-upload" className="flex flex-col items-center cursor-pointer w-full h-full justify-center">
                          {uploadingLogo ? <RefreshCw className="w-8 h-8 animate-spin text-saffron mb-3" /> : <UploadCloud className="w-8 h-8 text-gray-400 group-hover:text-saffron mb-3" />}
                          <p className="text-sm text-gray-600 font-medium">Click to upload Logo</p>
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Favicon Upload */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Favicon Upload</label>
                    {watch('favicon') ? (
                      <div className="relative rounded-lg overflow-hidden border border-gray-200 group h-[200px] w-full max-w-sm">
                        <img src={watch('favicon')} alt="Favicon Preview" className="w-full h-full object-cover bg-gray-50" />
                        <div className="absolute top-3 right-3 flex gap-2">
                          <button 
                            type="button" 
                            onClick={() => window.open(watch('favicon'), '_blank')}
                            className="p-2 bg-white text-blue-500 rounded-full hover:bg-blue-50 shadow-md border border-gray-100" title="Preview"
                          >
                            <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                          </button>
                          <button 
                            type="button" 
                            onClick={() => {
                              setValue('favicon', '', { shouldDirty: true });
                              setFaviconFile(null);
                            }} 
                            className="p-2 bg-white text-red-500 rounded-full hover:bg-red-50 shadow-md border border-gray-100" title="Discard"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer group h-[200px] w-full max-w-sm">
                        <input type="file" accept="image/*" className="hidden" id="favicon-upload" onChange={(e) => handleFileUpload(e, 'favicon')} disabled={uploadingFavicon} />
                        <label htmlFor="favicon-upload" className="flex flex-col items-center cursor-pointer w-full h-full justify-center">
                          {uploadingFavicon ? <RefreshCw className="w-8 h-8 animate-spin text-saffron mb-3" /> : <UploadCloud className="w-8 h-8 text-gray-400 group-hover:text-saffron mb-3" />}
                          <p className="text-sm text-gray-600 font-medium">Click to upload Favicon</p>
                        </label>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )}

            {activeTab === 'Contact' && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-lg font-semibold border-b pb-2">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Email Address</label>
                    <input {...register('contactEmail')} type="email" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-saffron/20 focus:border-saffron outline-none" />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-medium text-gray-700">Physical Address</label>
                    <textarea {...register('contactAddress')} rows={2} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-saffron/20 focus:border-saffron outline-none" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Social Media' && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-lg font-semibold border-b pb-2">Social Profiles</h3>
                <div className="grid grid-cols-1 gap-5 max-w-lg">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Facebook URL</label>
                    <input {...register('facebookUrl')} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-saffron/20 focus:border-saffron outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Instagram URL</label>
                    <input {...register('instagramUrl')} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-saffron/20 focus:border-saffron outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">YouTube URL</label>
                    <input {...register('youtubeUrl')} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-saffron/20 focus:border-saffron outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Twitter URL</label>
                    <input {...register('twitterUrl')} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-saffron/20 focus:border-saffron outline-none" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'YouTube Automation' && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-lg font-semibold border-b pb-2">YouTube Sync Settings</h3>
                <div className="grid grid-cols-1 gap-5 max-w-lg">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Channel ID</label>
                    <input {...register('youtubeChannelId')} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-saffron/20 font-mono text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Channel URL</label>
                    <input {...register('youtubeChannelUrl')} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-saffron/20" />
                  </div>
                  
                  <div className="p-4 bg-gray-50 border rounded-lg space-y-4 mt-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" {...register('youtubeAutoSync')} className="w-4 h-4 text-saffron rounded" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Enable Auto Sync</p>
                        <p className="text-xs text-gray-500">Automatically pull new videos from YouTube</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" {...register('youtubeIncrementalSync')} className="w-4 h-4 text-saffron rounded" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Incremental Sync</p>
                        <p className="text-xs text-gray-500">Only fetch new videos since last sync</p>
                      </div>
                    </label>

                    <div className="pt-2 border-t border-gray-200">
                      <label className="text-sm font-medium text-gray-700 block mb-1.5">Sync Interval</label>
                      <Controller
                        name="youtubeSyncInterval"
                        control={control}
                        defaultValue="daily"
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onChange={field.onChange}
                            options={[
                              { label: 'Hourly', value: 'hourly' },
                              { label: 'Daily', value: 'daily' },
                              { label: 'Weekly', value: 'weekly' }
                            ]}
                            searchable={false}
                          />
                        )}
                      />
                    </div>

                    <div className="pt-2 border-t border-gray-200 space-y-2">
                      <p className="text-sm text-gray-500">Last Sync: <strong className="text-gray-900">{data?.youtubeLastSync || 'Never'}</strong></p>
                      <p className="text-sm text-gray-500">Next Scheduled: <strong className="text-gray-900">{data?.youtubeNextSync || 'N/A'}</strong></p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'SEO' && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-lg font-semibold border-b pb-2">Search Engine Optimization</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-medium text-gray-700">Global Site Title</label>
                    <input {...register('seoSiteTitle')} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-medium text-gray-700">Global Meta Description</label>
                    <textarea {...register('seoMetaDescription')} rows={3} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Analytics' && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-lg font-semibold border-b pb-2">Tracking & Analytics</h3>
                <label className="flex items-center gap-3 p-4 border bg-gray-50 rounded-lg cursor-pointer max-w-lg mb-4">
                  <input type="checkbox" {...register('enableAnalytics')} className="w-4 h-4 text-saffron rounded" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Enable Analytics</p>
                    <p className="text-xs text-gray-500">Inject tracking codes into the public site</p>
                  </div>
                </label>
                <div className="grid grid-cols-1 gap-5 max-w-lg">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Google Analytics ID</label>
                    <input {...register('googleAnalyticsId')} className="w-full px-3 py-2 border rounded-lg font-mono text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Google Search Console Verification</label>
                    <input {...register('googleSearchConsole')} className="w-full px-3 py-2 border rounded-lg font-mono text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Microsoft Clarity ID</label>
                    <input {...register('microsoftClarity')} className="w-full px-3 py-2 border rounded-lg font-mono text-sm" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Advertisement' && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-lg font-semibold border-b pb-2">Monetization & Ads</h3>
                <label className="flex items-center gap-3 p-4 border bg-gray-50 rounded-lg cursor-pointer max-w-lg mb-4">
                  <input type="checkbox" {...register('enableAds')} className="w-4 h-4 text-saffron rounded" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Enable Display Ads</p>
                  </div>
                </label>
                <div className="grid grid-cols-1 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Top Banner Ad Code</label>
                    <textarea {...register('adTopBanner')} rows={3} className="w-full px-3 py-2 border rounded-lg font-mono text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Inline Ad Code</label>
                    <textarea {...register('adInline')} rows={3} className="w-full px-3 py-2 border rounded-lg font-mono text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Sidebar Ad Code</label>
                    <textarea {...register('adSidebar')} rows={3} className="w-full px-3 py-2 border rounded-lg font-mono text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Footer Ad Code</label>
                    <textarea {...register('adFooter')} rows={3} className="w-full px-3 py-2 border rounded-lg font-mono text-xs" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'System' && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-lg font-semibold border-b pb-2">System Controls</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="flex items-center gap-3 p-4 border bg-gray-50 rounded-lg cursor-pointer">
                    <input type="checkbox" {...register('maintenanceMode')} className="w-4 h-4 text-red-500 rounded focus:ring-red-500" />
                    <div>
                      <p className="text-sm font-bold text-gray-900">Maintenance Mode</p>
                      <p className="text-xs text-gray-500">Take the public site offline</p>
                    </div>
                  </label>
                </div>
              </div>
            )}

          </form>
        </div>
      </div>
    </div>
  );
};
