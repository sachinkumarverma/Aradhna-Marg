import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { apiClient } from '@api/client';
import { format } from 'date-fns';
import { Select } from '@components/ui/Select';
import { Settings, Save, AlertCircle, RefreshCw, UploadCloud, X, Pencil } from 'lucide-react';
import { uploadFile } from '@api/upload';
import { ImageUploadWithCrop } from '@components/ui/ImageUploadWithCrop';
import { AutoResizeTextarea } from '@components/ui/AutoResizeTextarea';

const TABS = ['General', 'Contact', 'Social Media', 'YouTube Automation', 'SEO', 'Analytics', 'Advertisement', 'System'];

// ── Shared primitives ──────────────────────────────────────────────────────

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="text-sm font-medium text-gray-700">{label}</label>
    {children}
  </div>
);

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>((props, ref) => {
  const [isLocked, setIsLocked] = useState(true);
  return (
    <div className="relative flex items-center group">
      <input 
        {...props} 
        ref={ref} 
        readOnly={isLocked}
        className={`w-full px-3 py-2 border rounded-md transition-all outline-none ${
          isLocked 
            ? 'bg-gray-50 border-gray-200 text-gray-500 pr-10 focus:ring-0 focus:border-gray-200 cursor-default' 
            : 'bg-white border-gray-300 text-gray-900 pr-10 focus:ring-2 focus:ring-saffron/20 focus:border-saffron'
        } ${props.className || ''}`} 
      />
      {isLocked && (
        <button
          type="button"
          onClick={() => setIsLocked(false)}
          className="absolute right-2 p-1.5 text-gray-400 hover:text-saffron transition-colors rounded hover:bg-orange-50 opacity-50 group-hover:opacity-100"
          title="Edit field"
        >
          <Pencil className="w-4 h-4" />
        </button>
      )}
    </div>
  );
});
Input.displayName = 'Input';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>((props, ref) => {
  const [isLocked, setIsLocked] = useState(true);
  return (
    <div className="relative group">
      <AutoResizeTextarea 
        {...props} 
        ref={ref} 
        readOnly={isLocked}
        className={`w-full px-3 py-2 border rounded-md transition-all outline-none ${
          isLocked 
            ? 'bg-gray-50 border-gray-200 text-gray-500 pr-10 focus:ring-0 focus:border-gray-200 cursor-default' 
            : 'bg-white border-gray-300 text-gray-900 pr-10 focus:ring-2 focus:ring-saffron/20 focus:border-saffron'
        } ${props.className || ''}`} 
      />
      {isLocked && (
        <button
          type="button"
          onClick={() => setIsLocked(false)}
          className="absolute right-2 top-2 p-1.5 text-gray-400 hover:text-saffron transition-colors rounded hover:bg-orange-50 opacity-50 group-hover:opacity-100"
          title="Edit field"
        >
          <Pencil className="w-4 h-4" />
        </button>
      )}
    </div>
  );
});
Textarea.displayName = 'Textarea';

const SaveButton = ({ isPending }: { isPending: boolean }) => (
  <div className="pt-4 border-t border-gray-100 flex justify-end">
    <button
      type="submit"
      disabled={isPending}
      className="flex items-center gap-2 px-5 py-2.5 bg-saffron text-white rounded-md font-medium hover:bg-saffron/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
      {isPending ? 'Saving...' : 'Save Changes'}
    </button>
  </div>
);

// ── Helper: create a section mutation ─────────────────────────────────────

function useSectionSave(endpoint: string, queryClient: ReturnType<typeof useQueryClient>) {
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.put(endpoint, data);
      return res.data.data;
    },
    onSuccess: (newData) => {
      toast.success('Settings saved!');
      queryClient.setQueryData(['admin-settings'], (old: any) => ({ ...old, ...newData }));
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    },
  });
}

// ── Section forms ──────────────────────────────────────────────────────────

const GeneralSection = ({ defaults }: { defaults: any }) => {
  const qc = useQueryClient();
  const mutation = useSectionSave('/settings/general', qc);
  const { register, handleSubmit, watch, setValue } = useForm({ values: defaults });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);

  const onSubmit = async (data: any) => {
    let payload = { ...data };
    if (logoFile) {
      setUploadingLogo(true);
      try {
        payload.siteLogo = await uploadFile(logoFile);
        setLogoFile(null);
      } catch {
        // continue without logo upload
      }
      setUploadingLogo(false);
    }
    if (faviconFile) {
      setUploadingFavicon(true);
      try {
        payload.favicon = await uploadFile(faviconFile);
        setFaviconFile(null);
      } catch {
        // continue without favicon upload
      }
      setUploadingFavicon(false);
    }
    mutation.mutate(payload);
  };

  const ImageUpload = ({ field, file, setFile, uploading, label, ratio }: any) => {
    const val = watch(field);
    return (
      <Field label={label}>
        <div className="w-full max-w-sm flex flex-col">
          <ImageUploadWithCrop
            value={val || undefined}
            onChange={(dataUrl, fileObj) => {
              setFile(fileObj);
              setValue(field, dataUrl, { shouldDirty: true });
            }}
            onRemove={() => { setValue(field, '', { shouldDirty: true }); setFile(null); }}
            aspectRatio={ratio}
            className={`w-full ${ratio === 1 ? 'max-w-[280px] aspect-square' : 'aspect-video'} rounded-md border-2 border-dashed border-gray-300 hover:border-saffron transition-colors`}
            placeholder={`Upload ${label}`}
          />
        </div>
      </Field>
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 animate-in fade-in duration-300">
      <h3 className="text-lg font-semibold border-b pb-2">General Settings</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="Website Name"><Input {...register('siteName')} /></Field>
        <Field label="Copyright Text"><Input {...register('copyrightText')} /></Field>
        <div className="md:col-span-2"><Field label="Website Description"><Textarea {...register('siteDescription')} rows={3} /></Field></div>
        <ImageUpload field="siteLogo" file={logoFile} setFile={setLogoFile} uploading={uploadingLogo} label="Logo Upload" ratio={1} />
        <ImageUpload field="favicon" file={faviconFile} setFile={setFaviconFile} uploading={uploadingFavicon} label="Favicon Upload" ratio={1} />
      </div>
      <SaveButton isPending={mutation.isPending} />
    </form>
  );
};

const ContactSection = ({ defaults }: { defaults: any }) => {
  const qc = useQueryClient();
  const mutation = useSectionSave('/settings/contact', qc);
  const { register, handleSubmit } = useForm({ values: defaults });
  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5 animate-in fade-in duration-300">
      <h3 className="text-lg font-semibold border-b pb-2">Contact Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="Email Address"><Input {...register('contactEmail')} type="email" /></Field>
        <div className="md:col-span-2"><Field label="Address"><Textarea {...register('contactAddress')} rows={2} /></Field></div>
      </div>
      <SaveButton isPending={mutation.isPending} />
    </form>
  );
};

const SocialSection = ({ defaults }: { defaults: any }) => {
  const qc = useQueryClient();
  const mutation = useSectionSave('/settings/social', qc);
  const { register, handleSubmit } = useForm({ values: defaults });
  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5 animate-in fade-in duration-300">
      <h3 className="text-lg font-semibold border-b pb-2">Social Profiles</h3>
      <div className="grid grid-cols-1 gap-5 max-w-lg">
        <Field label="Facebook URL"><Input {...register('facebookUrl')} /></Field>
        <Field label="Instagram URL"><Input {...register('instagramUrl')} /></Field>
        <Field label="YouTube URL"><Input {...register('youtubeUrl')} /></Field>
        <Field label="Twitter URL"><Input {...register('twitterUrl')} /></Field>
      </div>
      <SaveButton isPending={mutation.isPending} />
    </form>
  );
};

const YoutubeSection = ({ defaults }: { defaults: any }) => {
  const qc = useQueryClient();
  const mutation = useSectionSave('/settings/youtube', qc);
  const { register, handleSubmit, control, watch } = useForm({ values: defaults });

  const lastSync = defaults?.youtubeLastSync ? new Date(defaults.youtubeLastSync) : null;
  const currentInterval = watch('youtubeSyncInterval') || defaults?.youtubeSyncInterval;
  
  let nextSyncStr = 'N/A';
  if (lastSync && currentInterval) {
    const nextSync = new Date(lastSync);
    if (currentInterval === '1h') nextSync.setHours(nextSync.getHours() + 1);
    else if (currentInterval === '6h') nextSync.setHours(nextSync.getHours() + 6);
    else if (currentInterval === '12h') nextSync.setHours(nextSync.getHours() + 12);
    else if (currentInterval === '24h') nextSync.setHours(nextSync.getHours() + 24);
    
    if (nextSync.getTime() < new Date().getTime()) {
      nextSyncStr = 'Pending (Next Cron execution)';
    } else {
      nextSyncStr = format(nextSync, 'dd MMM yyyy, hh:mm a');
    }
  }

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5 animate-in fade-in duration-300">
      <h3 className="text-lg font-semibold border-b pb-2">YouTube Sync Settings</h3>
      <div className="grid grid-cols-1 gap-5 max-w-lg">
        <Field label="Channel ID"><Input {...register('youtubeChannelId')} className="w-full px-3 py-2 border rounded-md bg-white font-mono text-sm focus:ring-2 focus:ring-saffron/20 focus:border-saffron outline-none" /></Field>
        <Field label="Channel URL"><Input {...register('youtubeChannelUrl')} /></Field>
        <div className="p-4 bg-gray-50 border rounded-md space-y-4 mt-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" {...register('youtubeAutoSync')} className="w-4 h-4 text-saffron rounded" />
            <div><p className="text-sm font-medium text-gray-900">Enable Auto Sync</p><p className="text-xs text-gray-500">Automatically pull new videos from YouTube</p></div>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" {...register('youtubeIncrementalSync')} className="w-4 h-4 text-saffron rounded" />
            <div><p className="text-sm font-medium text-gray-900">Incremental Sync</p><p className="text-xs text-gray-500">Only fetch new videos since last sync</p></div>
          </label>
          <div className="pt-2 border-t border-gray-200">
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Sync Interval</label>
            <Controller name="youtubeSyncInterval" control={control} defaultValue="daily"
              render={({ field }) => (
                <Select value={field.value} onChange={field.onChange} searchable={false}
                  options={[{ label: 'Every 1 Hour', value: '1h' }, { label: 'Every 6 Hours', value: '6h' }, { label: 'Every 12 Hours', value: '12h' }, { label: 'Daily', value: '24h' }]} />
              )} />
          </div>
          <div className="pt-2 border-t border-gray-200 space-y-2">
              <p className="text-sm mt-4 text-gray-500">
                Last Sync: <strong className="text-gray-900">{defaults?.youtubeLastSync ? format(new Date(defaults.youtubeLastSync), 'dd MMM yyyy, hh:mm a') : 'Never'}</strong>
              </p>
              <p className="text-sm mt-1 text-gray-500">
                Next Scheduled: <strong className="text-gray-900">{nextSyncStr}</strong>
              </p>
          </div>
        </div>
      </div>
      <SaveButton isPending={mutation.isPending} />
    </form>
  );
};

const SeoSection = ({ defaults }: { defaults: any }) => {
  const qc = useQueryClient();
  const mutation = useSectionSave('/settings/seo', qc);
  const { register, handleSubmit } = useForm({ values: defaults });
  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5 animate-in fade-in duration-300">
      <h3 className="text-lg font-semibold border-b pb-2">Search Engine Optimization</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="md:col-span-2"><Field label="Global Site Title"><Input {...register('seoSiteTitle')} /></Field></div>
        <div className="md:col-span-2"><Field label="Global Meta Description"><Textarea {...register('seoMetaDescription')} rows={3} /></Field></div>
        <div className="md:col-span-2"><Field label="Meta Keywords"><Input {...register('seoMetaKeywords')} /></Field></div>
      </div>
      <SaveButton isPending={mutation.isPending} />
    </form>
  );
};

const AnalyticsSection = ({ defaults }: { defaults: any }) => {
  const qc = useQueryClient();
  const mutation = useSectionSave('/settings/analytics', qc);
  const { register, handleSubmit } = useForm({ values: defaults });
  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5 animate-in fade-in duration-300">
      <h3 className="text-lg font-semibold border-b pb-2">Tracking &amp; Analytics</h3>
      <label className="flex items-center gap-3 p-4 border bg-gray-50 rounded-md cursor-pointer max-w-lg">
        <input type="checkbox" {...register('enableAnalytics')} className="w-4 h-4 text-saffron rounded" />
        <div><p className="text-sm font-medium text-gray-900">Enable Analytics</p><p className="text-xs text-gray-500">Inject tracking codes into the public site</p></div>
      </label>
      <div className="grid grid-cols-1 gap-5 max-w-lg">
        <Field label="Google Analytics ID"><Input {...register('googleAnalyticsId')} className="w-full px-3 py-2 border rounded-md bg-white font-mono text-sm focus:ring-2 focus:ring-saffron/20 focus:border-saffron outline-none" /></Field>
        <Field label="Google Search Console Verification"><Input {...register('googleSearchConsole')} className="w-full px-3 py-2 border rounded-md bg-white font-mono text-sm focus:ring-2 focus:ring-saffron/20 focus:border-saffron outline-none" /></Field>
        <Field label="Microsoft Clarity ID"><Input {...register('microsoftClarity')} className="w-full px-3 py-2 border rounded-md bg-white font-mono text-sm focus:ring-2 focus:ring-saffron/20 focus:border-saffron outline-none" /></Field>
      </div>
      <SaveButton isPending={mutation.isPending} />
    </form>
  );
};

const AdvertisementSection = ({ defaults }: { defaults: any }) => {
  const qc = useQueryClient();
  const mutation = useSectionSave('/settings/advertisement', qc);
  const { register, handleSubmit } = useForm({ values: defaults });
  const AdTextarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>((props, ref) => {
    const [isLocked, setIsLocked] = useState(true);
    return (
      <div className="relative group">
        <textarea 
          {...props} 
          ref={ref} 
          readOnly={isLocked}
          className={`w-full px-3 py-2 border rounded-md transition-all font-mono text-xs outline-none ${
            isLocked 
              ? 'bg-gray-50 border-gray-200 text-gray-500 pr-10 focus:ring-0 focus:border-gray-200 cursor-default' 
              : 'bg-white border-gray-300 text-gray-900 pr-10 focus:ring-2 focus:ring-saffron/20 focus:border-saffron'
          } ${props.className || ''}`} 
        />
        {isLocked && (
          <button
            type="button"
            onClick={() => setIsLocked(false)}
            className="absolute right-2 top-2 p-1.5 text-gray-400 hover:text-saffron transition-colors rounded hover:bg-orange-50 opacity-50 group-hover:opacity-100"
            title="Edit field"
          >
            <Pencil className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  });
  AdTextarea.displayName = 'AdTextarea';
  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5 animate-in fade-in duration-300">
      <h3 className="text-lg font-semibold border-b pb-2">Monetization &amp; Ads</h3>
      <label className="flex items-center gap-3 p-4 border bg-gray-50 rounded-md cursor-pointer max-w-lg">
        <input type="checkbox" {...register('enableAds')} className="w-4 h-4 text-saffron rounded" />
        <div><p className="text-sm font-medium text-gray-900">Enable Display Ads</p></div>
      </label>
      <div className="grid grid-cols-1 gap-5">
        <Field label="Top Banner Ad Code"><AdTextarea {...register('adTopBanner')} rows={3} /></Field>
        <Field label="Inline Ad Code"><AdTextarea {...register('adInline')} rows={3} /></Field>
        <Field label="Sidebar Ad Code"><AdTextarea {...register('adSidebar')} rows={3} /></Field>
        <Field label="Footer Ad Code"><AdTextarea {...register('adFooter')} rows={3} /></Field>
      </div>
      <SaveButton isPending={mutation.isPending} />
    </form>
  );
};

const SystemSection = ({ defaults }: { defaults: any }) => {
  const qc = useQueryClient();
  const mutation = useSectionSave('/settings/system', qc);
  const { register, handleSubmit } = useForm({ values: defaults });
  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5 animate-in fade-in duration-300">
      <h3 className="text-lg font-semibold border-b pb-2">System Controls</h3>
      <div className="grid grid-cols-1 gap-4">
        <label className="flex items-center gap-3 p-4 border bg-gray-50 rounded-md cursor-pointer">
          <input type="checkbox" {...register('maintenanceMode')} className="w-4 h-4 text-red-500 rounded focus:ring-red-500" />
          <div><p className="text-sm font-bold text-gray-900">Maintenance Mode</p><p className="text-xs text-gray-500">Take the public site offline</p></div>
        </label>
      </div>
      <SaveButton isPending={mutation.isPending} />
    </form>
  );
};

// ── Main page ──────────────────────────────────────────────────────────────

export const AdminSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState(TABS[0]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const res = await apiClient.get('/settings');
      return res.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] flex-1">
        <RefreshCw className="w-8 h-8 text-saffron animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Loading settings...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 p-6 rounded-md border border-red-100 flex items-start gap-4">
        <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
        <div>
          <h3 className="text-red-800 font-semibold mb-1">Error Loading Settings</h3>
          <p className="text-red-600 text-sm mb-4">Could not retrieve settings from the server.</p>
          <button onClick={() => refetch()} className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-md text-sm font-medium hover:bg-red-50">Try Again</button>
        </div>
      </div>
    );
  }

  const sectionMap: Record<string, React.ReactNode> = {
    'General': <GeneralSection defaults={data} />,
    'Contact': <ContactSection defaults={data} />,
    'Social Media': <SocialSection defaults={data} />,
    'YouTube Automation': <YoutubeSection defaults={data} />,
    'SEO': <SeoSection defaults={data} />,
    'Analytics': <AnalyticsSection defaults={data} />,
    'Advertisement': <AdvertisementSection defaults={data} />,
    'System': <SystemSection defaults={data} />,
  };

  return (
    <div className="space-y-6 flex flex-col flex-1 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-wide text-slate-900 flex items-center gap-2 uppercase">
            <Settings className="w-6 h-6 text-saffron" /> SYSTEM SETTINGS
          </h1>
          <p className="text-sm text-gray-500 mt-1">Configure global application parameters</p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md border border-blue-100 shadow-sm flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar Tabs */}
        <div className="md:w-64 border-b md:border-b-0 md:border-r border-gray-100 bg-gray-50/50 p-4 shrink-0 flex flex-row md:flex-col overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`text-left px-4 py-2.5 rounded-md text-sm font-bold transition-colors whitespace-nowrap uppercase ${
                activeTab === tab ? 'bg-saffron/10 text-saffron' : 'text-gray-900 hover:bg-gray-100 hover:text-black'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content Area — each section is its own independent form */}
        <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
          {sectionMap[activeTab]}
        </div>
      </div>
    </div>
  );
};
