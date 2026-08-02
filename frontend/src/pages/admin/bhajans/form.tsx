import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Send } from 'lucide-react';
import { BhajanApi } from '@features/bhajans/BhajanApi';
import { apiClient } from '@api/client';
import toast from 'react-hot-toast';
import { Select } from '@components/ui/Select';
import { TagsInput } from '@components/ui/TagsInput';

// Simple client-side slugify
const generateSlug = (text: string) => {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
};

import { createPortal } from 'react-dom';
// @ts-ignore
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

export const AdminBhajanForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);

  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const { register, handleSubmit, control, watch, setValue, reset, formState: { errors, isValid } } = useForm({
    mode: 'onChange',
    defaultValues: {
      title: '',
      slug: '',
      lyrics: '',
      category_id: '',
      god_id: '',
      original_youtube_url: '',
      video_source_mode: 'automatic',
      status: 'DRAFT',
      seo_title: '',
      seo_description: '',
      seo_keywords: ''
    }
  });

  const titleValue = watch('title');
  const slugValue = watch('slug');
  const lyricsValue = watch('lyrics');
  const videoSourceMode = watch('video_source_mode');

  // Auto slug generation
  useEffect(() => {
    if (!isEditing && titleValue && !slugValue) {
      setValue('slug', generateSlug(titleValue), { shouldValidate: true });
    }
  }, [titleValue, isEditing, slugValue, setValue]);

  // Fetch data if editing
  useQuery({
    queryKey: ['admin-bhajan', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await BhajanApi.getById(id);
      const data = res.data;
      reset({
        ...data,
        video_source_mode: data.original_youtube_url ? 'manual' : 'automatic',
      });
      return data;
    },
    enabled: isEditing
  });

  // Fetch Categories
  const { data: categoriesData } = useQuery({
    queryKey: ['admin-categories-list'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/categories?limit=100');
      return res.data.data;
    }
  });

  // Fetch Deities
  const { data: deitiesData } = useQuery({
    queryKey: ['admin-deities-list'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/deities?limit=100');
      return res.data.data || [];
    }
  });

  const categoryOptions = categoriesData?.map((c: any) => ({ label: c.name, value: c.id })) || [];
  const deityOptions = deitiesData?.map((d: any) => ({ label: d.name, value: d.id })) || [];

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (isEditing) return BhajanApi.update(id!, data);
      return BhajanApi.create(data);
    },
    onSuccess: (res) => {
      setLastSaved(new Date());
      queryClient.invalidateQueries({ queryKey: ['admin-bhajans'] });
      if (!isEditing && res.data?.data?.id) {
        navigate(`/admin/bhajans/${res.data.data.id}/edit`, { replace: true });
      }
      toast.success(isEditing ? 'Bhajan updated' : 'Bhajan created');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to save');
    }
  });

  const onSubmit = (data: any) => saveMutation.mutate(data);

  const handleClose = () => {
    navigate('/admin/bhajans');
  };


  return createPortal(
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-4xl bg-gray-50 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-orange-100 border-b border-orange-200">
          <div className="flex items-center gap-4">
            <button type="button" onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold tracking-wide text-slate-900 uppercase">{isEditing ? 'Edit Bhajan' : 'Create Bhajan'}</h1>
              {lastSaved && <p className="text-xs text-green-600 font-medium mt-1">Last saved: {lastSaved.toLocaleTimeString()}</p>}
            </div>
          </div>
          
          <div className="flex items-center gap-3">

            <button
              type="button"
              onClick={() => {
                setValue('status', 'DRAFT');
                handleSubmit(onSubmit)();
              }}
              disabled={saveMutation.isPending || !isValid}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium text-sm shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              Save as Draft
            </button>
            <button
              onClick={() => {
                setValue('status', 'PUBLISHED');
                handleSubmit(onSubmit)();
              }}
              disabled={saveMutation.isPending || !isValid}
              className="flex items-center gap-2 px-5 py-2 bg-saffron text-white rounded-md hover:bg-saffron/90 transition-colors font-medium text-sm shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {saveMutation.isPending ? 'Publishing...' : 'Publish'}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md shadow-sm border border-blue-100 p-6 space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-800">Bhajan Title *</label>
              <input
                {...register('title', { required: 'Title is required' })}
                className="w-full px-4 py-2.5 bg-white border border-blue-100 rounded-md focus:ring-2 focus:ring-saffron/20 focus:border-saffron outline-none transition-all"
                placeholder="e.g. Shri Hanuman Chalisa"
              />
              {errors.title && <p className="text-xs text-red-500">{errors.title.message as string}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-800">Lyrics *</label>
              <Controller
                name="lyrics"
                control={control}
                rules={{ required: 'Lyrics are required' }}
                render={({ field }) => (
                  <div>
                    <ReactQuill 
                      theme="snow" 
                      value={field.value || ''} 
                      onChange={field.onChange} 
                      className="bg-white rounded-b-md" 
                    />
                  </div>
                )}
              />
              {errors.lyrics && <p className="text-xs text-red-500">{errors.lyrics.message as string}</p>}
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md shadow-sm border border-blue-100 overflow-hidden">
            <div className="px-6 py-3 font-bold text-gray-900 bg-gray-50/50 border-b">
              Advanced SEO
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">SEO Title</label>
                <input
                  {...register('seo_title')}
                  className="w-full px-3 py-2 bg-white border border-blue-100 rounded-md outline-none text-sm focus:border-saffron focus:ring-1 focus:ring-saffron"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">SEO Description</label>
                <textarea
                  {...register('seo_description')}
                  rows={3}
                  className="w-full px-3 py-2 bg-white border border-blue-100 rounded-md outline-none text-sm focus:border-saffron focus:ring-1 focus:ring-saffron"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Keywords (Press Enter to add)</label>
                <Controller
                  name="seo_keywords"
                  control={control}
                  render={({ field }) => (
                    <TagsInput value={field.value} onChange={field.onChange} />
                  )}
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Settings & Metadata */}
        <div className="space-y-6">
          
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md shadow-sm border border-blue-100 p-6 space-y-5">
            <h3 className="font-bold text-gray-900 border-b pb-3">Classification</h3>
            
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Category *</label>
              <Controller
                name="category_id"
                control={control}
                rules={{ required: 'Category is required' }}
                render={({ field }) => (
                  <Select
                    options={categoryOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Search category..."
                    error={!!errors.category_id}
                  />
                )}
              />
              {errors.category_id && <p className="text-xs text-red-500">{errors.category_id.message as string}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Primary Deity *</label>
              <Controller
                name="god_id"
                control={control}
                rules={{ required: 'Primary Deity is required' }}
                render={({ field }) => (
                  <Select
                    options={deityOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Search deity..."
                    error={!!errors.god_id}
                  />
                )}
              />
              {errors.god_id && <p className="text-xs text-red-500">{errors.god_id.message as string}</p>}
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md shadow-sm border border-blue-100 p-6 space-y-5">
            <h3 className="font-bold text-gray-900 border-b pb-3">Publishing</h3>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Status</label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    options={[
                      { label: 'Draft (Hidden)', value: 'DRAFT' },
                      { label: 'Published', value: 'PUBLISHED' },
                      { label: 'Archived', value: 'ARCHIVED' }
                    ]}
                    value={field.value}
                    onChange={field.onChange}
                    searchable={false}
                  />
                )}
              />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md shadow-sm border border-blue-100 p-6 space-y-5">
            <h3 className="font-bold text-gray-900 border-b pb-3">Video Configuration</h3>
            
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700">Video Source</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" value="automatic" {...register('video_source_mode')} className="text-saffron focus:ring-saffron" />
                  Automatic
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" value="manual" {...register('video_source_mode')} className="text-saffron focus:ring-saffron" />
                  Manual
                </label>
              </div>

              {videoSourceMode === 'automatic' ? (
                <div className="bg-blue-50/50 p-3 rounded-md border border-blue-100 text-xs text-blue-700">
                  The primary YouTube video will automatically be linked based on title matching during the sync process.
                </div>
              ) : (
                <div className="space-y-1.5 mt-4">
                  <label className="text-sm font-semibold text-gray-700">YouTube URL</label>
                  <input
                    {...register('original_youtube_url', { 
                      pattern: { value: /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/, message: 'Invalid YouTube URL' }
                    })}
                    className="w-full px-3 py-2 bg-white border border-blue-100 rounded-md outline-none focus:border-saffron focus:ring-1 focus:ring-saffron text-sm"
                    placeholder="https://youtube.com/watch?v=..."
                  />
                  {errors.original_youtube_url && <p className="text-xs text-red-500">{errors.original_youtube_url.message as string}</p>}
                </div>
              )}
            </div>
          </div>
          </div>
        </div>
          </div>
        </div>
    </div>,
    document.body
  );
};
