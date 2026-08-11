import { AutoResizeTextarea } from "@components/ui/AutoResizeTextarea";
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { Languages,  ArrowLeft, Save, Loader2, Upload, Eye, X, Send, XCircle  } from 'lucide-react';
import { TranslationPanel } from '../../../features/translations/TranslationPanel';
import { apiClient } from '@api/client';
import { uploadFile } from '@api/upload';
import toast from 'react-hot-toast';
import { Select } from '@components/ui/Select';
import { MultiSelect } from '@components/ui/MultiSelect';
import { DatePicker } from '@components/ui/DatePicker';
import { createPortal } from 'react-dom';
import { RichTextEditor } from "@components/ui/RichTextEditor";
import { isFormActuallyDirty } from '@utils/isFormActuallyDirty';
import { ImageUploadWithCrop } from '@components/ui/ImageUploadWithCrop';

const generateSlug = (text: string) => {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
};



export const AdminFestivalForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);

  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState<'original' | 'translation'>('original');
  const [showPreview, setShowPreview] = useState(false);

  const { register, handleSubmit, control, watch, setValue, reset, setError, formState: { errors, isValid, isDirty, defaultValues, dirtyFields } } = useForm({
    mode: 'onChange',
    defaultValues: {
      name: '',
      slug: '',
      shortDescription: '',
      content: '',
      bannerImage: '',
      festivalDate: '',
      category: '',
      featured: false,
      status: 'Draft',
      seoTitle: '',
      seoDescription: '',
      bhajanIds: [] as string[],
      articleIds: [] as string[]
    }
  });

  const nameValue = watch('name');
  const slugValue = watch('slug');

  // Auto slug generation
  useEffect(() => {
    if (!isEditing && nameValue && !slugValue) {
      setValue('slug', generateSlug(nameValue), { shouldValidate: true, shouldDirty: true });
    }
  }, [nameValue, isEditing, slugValue, setValue]);

  // Fetch bhajans for multiselect
  const { data: bhajans, isLoading: isLoadingBhajans } = useQuery({
    queryKey: ['admin-bhajans-options'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/bhajans', { params: { limit: 1000 } });
      return res.data.data.map((b: any) => ({ label: b.title, value: b.id }));
    }
  });

  // Fetch articles for multiselect
  const { data: articles, isLoading: isLoadingArticles } = useQuery({
    queryKey: ['admin-articles-options'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/articles', { params: { limit: 1000 } });
      return res.data.data.map((a: any) => ({ label: a.title, value: a.id }));
    }
  });

  // Fetch categories for select
  const { data: categoryOptions = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['admin-categories-options'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/categories', { params: { limit: 1000 } });
      return res.data.data.map((c: any) => ({ label: c.name, value: c.name }));
    }
  });

  // Fetch data if editing
  const festivalQuery = useQuery({
    queryKey: ['admin-festival', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await apiClient.get(`/admin/festivals/${id}`);
      return res.data.data;
    },
    enabled: isEditing
  });

  useEffect(() => {
    if (festivalQuery.data) {
      const data = festivalQuery.data;
      reset({
        name: data.name || '',
        slug: data.slug || '',
        shortDescription: data.shortDescription || '',
        content: data.content || '',
        bannerImage: data.bannerImage || '',
        festivalDate: data.festivalDate || '',
        category: data.category || '',
        featured: data.featured || false,
        status: data.status || 'Draft',
        seoTitle: data.seoTitle || '',
        seoDescription: data.seoDescription || '',
        bhajanIds: data.bhajanIds || [],
        articleIds: data.articleIds || [],
        name_en: data.name_en || '',
        shortDescription_en: data.shortDescription_en || '',
        content_en: data.content_en || '',
        seoTitle_en: data.seoTitle_en || '',
        seoDescription_en: data.seoDescription_en || ''
      });
      if (data.bannerImage) setBannerPreview(data.bannerImage);
    }
  }, [festivalQuery.data, reset]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (isEditing) return apiClient.put(`/admin/festivals/${id}`, data);
      return apiClient.post('/admin/festivals', data);
    },
    onSuccess: (res) => {
      setLastSaved(new Date());
      queryClient.invalidateQueries({ queryKey: ['admin-festivals'] });
      toast.success(isEditing ? 'Festival updated' : 'Festival created');
      navigate('/admin/festivals');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to save';
      if (msg.toLowerCase().includes('already exists') || msg.toLowerCase().includes('duplicate')) {
        setError('name', { type: 'manual', message: 'This festival name already exists.' });
      } else {
        toast.error(msg);
      }
    }
  });

  const onSubmit = async (data: any) => {
    if (bannerFile) {
      setIsUploading(true);
      try {
        data.bannerImage = await uploadFile(bannerFile);
      } catch (err: any) {
        toast.error('Upload failed: ' + (err.response?.data?.message || err.message));
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }
    // format date if needed
    if (!data.festivalDate) data.festivalDate = null;
    
    saveMutation.mutate(data);
  };

  const handleClose = () => {
    navigate('/admin/festivals');
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  const currentValues = watch();
  const actuallyDirty = isEditing ? isFormActuallyDirty(currentValues, defaultValues) : true;

  return (
    <>
      {createPortal(
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
              <h1 className="text-xl font-bold tracking-wide text-slate-900 uppercase">{isEditing ? 'Edit Festival' : 'Create Festival'}</h1>
              {lastSaved && <p className="text-xs text-green-600 font-medium mt-1">Last saved: {lastSaved.toLocaleTimeString()}</p>}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePreview}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium text-sm shadow-sm"
            >
              <Eye className="w-4 h-4" />
              Live Preview
            </button>
            <button
              type="button"
              onClick={() => {
                setValue('status', 'Draft');
                handleSubmit(onSubmit)();
              }}
              disabled={saveMutation.isPending || isUploading || !isValid || (isEditing ? !actuallyDirty : false)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium text-sm shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              Save Draft
            </button>
            <button
              type="button"
              onClick={() => {
                setValue('status', 'Published');
                handleSubmit(onSubmit)();
              }}
              disabled={saveMutation.isPending || isUploading || !isValid || (isEditing ? !actuallyDirty : false)}
              className="flex items-center gap-2 px-5 py-2 bg-saffron text-white rounded-md hover:bg-saffron/90 transition-colors font-medium text-sm shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {(saveMutation.isPending || isUploading) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {(saveMutation.isPending || isUploading) ? 'Publishing...' : 'Publish'}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {festivalQuery.isLoading && isEditing ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-saffron" />
            </div>
          ) : (
            <form id="festival-form" onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* LEFT COLUMN: Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Language Switcher Tabs */}
                <div className="flex space-x-1 bg-gray-100/50 p-1 rounded-lg border border-gray-200">
                  <button
                      type="button"
                      onClick={() => setActiveLanguage('original')}
                      className={`flex-1 py-2 px-4 text-sm font-bold rounded-md transition-all ${
                        activeLanguage === 'original'
                          ? 'bg-white text-saffron shadow-sm border border-gray-200'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Hindi (Original)
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveLanguage('translation')}
                      className={`flex-1 py-2 px-4 text-sm font-bold rounded-md transition-all flex justify-center items-center gap-2 ${
                        activeLanguage === 'translation'
                          ? 'bg-white text-indigo-600 shadow-sm border border-gray-200'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      English (Translation)
                  </button>
                </div>

                <div className={activeLanguage === 'original' ? 'block space-y-6' : 'hidden'}>
                
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md shadow-sm border border-blue-100 p-6 space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-800">Festival Name *</label>
                    <input 
                      {...register('name', { required: 'Name is required' })}
                      className={`w-full px-4 py-2.5 bg-white border rounded-md focus:ring-2 focus:ring-saffron/20 focus:border-saffron outline-none transition-all text-sm font-medium ${errors.name ? 'border-red-500' : 'border-blue-100'}`}
                      placeholder="e.g. Diwali, Holi..."
                    />
                    {errors.name && <p className="text-red-500 text-xs font-medium mt-1.5 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" />{errors.name.message as string}</p>}
                  </div>



                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-800">Short Description</label>
                    <AutoResizeTextarea 
                      {...register('shortDescription')}
                      rows={2}
                      className="w-full px-4 py-3 bg-white border border-blue-100 rounded-md focus:ring-2 focus:ring-saffron/20 focus:border-saffron outline-none transition-all text-sm leading-relaxed"
                      placeholder="A short summary of the festival..."
                    />
                  </div>
                </div>

                {/* Rich Text Editor */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md shadow-sm border border-blue-100 p-6 space-y-5">
                  <h3 className="font-bold text-gray-900 border-b pb-3">Festival Details</h3>
                  <Controller
                    name="content"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <RichTextEditor 
                          value={field.value}
                          onChange={field.onChange}
                          className="bg-white rounded-b-md"
                        />
                      </div>
                    )}
                  />
                </div>
                
                {/* Advanced SEO */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md shadow-sm border border-blue-100 overflow-hidden">
                  <div className="px-6 py-3 font-bold text-gray-900 bg-gray-50/50 border-b">
                    Advanced SEO
                  </div>
                  
                  <div className="p-6 space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-700">SEO Title</label>
                      <input 
                        {...register('seoTitle')}
                        className="w-full px-3 py-2 bg-white border border-blue-100 rounded-md outline-none text-sm focus:border-saffron focus:ring-1 focus:ring-saffron"
                        placeholder="Leave blank to use name"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-700">SEO Meta Description</label>
                      <AutoResizeTextarea 
                        {...register('seoDescription')}
                        rows={3}
                        className="w-full px-3 py-2 bg-white border border-blue-100 rounded-md outline-none text-sm focus:border-saffron focus:ring-1 focus:ring-saffron"
                        placeholder="Leave blank to use short description"
                      />
                    </div>
                  </div>
                </div>
              </div>

                <div className={activeLanguage === 'translation' ? 'block space-y-6' : 'hidden'}>
                  <TranslationPanel
                    contentType="FESTIVAL"
                    contentId={id || 'new'}
                    sourceLang="hi"
                    targetLang="en"
                    hasTranslation={!!watch('name_en' as any) || !!watch('shortDescription_en' as any) || !!watch('content_en' as any)}
                    isOutdated={!!(dirtyFields.name || dirtyFields.shortDescription || dirtyFields.content)}
                    originalContent={{
                      name: watch("name"), short_description: watch("shortDescription"), content: watch("content"), seo_title: watch("seoTitle"), seo_description: watch("seoDescription")
                    }}
                    onGenerateLive={(t: any) => {
                      setValue('name_en' as any, t.name || '');
                      setValue('shortDescription_en' as any, t.short_description || '');
                      setValue('content_en' as any, t.content || '');
                      setValue('seoTitle_en' as any, t.seo_title || '');
                      setValue('seoDescription_en' as any, t.seo_description || '');
                    }}
                  />

                  {!(!!watch('name_en' as any) || !!watch('shortDescription_en' as any) || !!watch('content_en' as any)) ? (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 py-16 px-6 text-center shadow-sm">
                      <div className="w-16 h-16 bg-[#F5F7FF] text-[#5542F6] rounded-full flex items-center justify-center mx-auto mb-5">
                        <Languages className="w-8 h-8" />
                      </div>
                      <h3 className="text-lg font-bold text-[#1a1a2e] mb-2">English Translation</h3>
                      <p className="text-gray-500 text-[14px] max-w-sm mx-auto leading-relaxed">No English translation has been generated yet.<br/>Click "Generate English Translation" above to start.</p>
                    </div>
                  ) : (
                    <>
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md shadow-sm border border-blue-100 p-6 space-y-5">
                        <div className="space-y-1.5">
                          <label className="text-sm font-semibold text-gray-800">Festival Name *</label>
                          <input 
                            {...register('name_en' as any, { required: 'Name is required' })}
                            className={`w-full px-4 py-2.5 bg-white border rounded-md focus:ring-2 focus:ring-saffron/20 focus:border-saffron outline-none transition-all text-sm font-medium ${(errors as any).name_en ? 'border-red-500' : 'border-blue-100'}`}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-sm font-semibold text-gray-800">Short Description</label>
                          <AutoResizeTextarea 
                            {...register('shortDescription_en' as any)}
                            rows={2}
                            className="w-full px-4 py-3 bg-white border border-blue-100 rounded-md focus:ring-2 focus:ring-saffron/20 focus:border-saffron outline-none transition-all text-sm leading-relaxed"
                          />
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md shadow-sm border border-blue-100 p-6 space-y-5">
                        <h3 className="font-bold text-gray-900 border-b pb-3">Festival Details</h3>
                        <Controller
                          name={"content_en" as any}
                          control={control}
                          render={({ field }) => (
                            <div>
                              <RichTextEditor 
                                value={field.value || ''}
                                onChange={field.onChange}
                                className="bg-white rounded-b-md"
                              />
                            </div>
                          )}
                        />
                      </div>
                      
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md shadow-sm border border-blue-100 overflow-hidden">
                        <div className="px-6 py-3 font-bold text-gray-900 bg-gray-50/50 border-b border-blue-100">
                          Advanced SEO
                        </div>
                        
                        <div className="p-6 space-y-4">
                          <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700">SEO Title</label>
                            <input 
                              {...register('seoTitle_en' as any)}
                              className="w-full px-3 py-2 bg-white border border-blue-100 rounded-md outline-none text-sm focus:border-saffron focus:ring-1 focus:ring-saffron"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700">SEO Meta Description</label>
                            <AutoResizeTextarea 
                              {...register('seoDescription_en' as any)}
                              rows={3}
                              className="w-full px-3 py-2 bg-white border border-blue-100 rounded-md outline-none text-sm focus:border-saffron focus:ring-1 focus:ring-saffron"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              
</div>
              {/* RIGHT COLUMN: Settings & Metadata */}
              <div className="space-y-6">
                
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md shadow-sm border border-blue-100 p-6 space-y-5">
                  <h3 className="font-bold text-gray-900 border-b pb-3">Publishing Details</h3>
                  
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Festival Date</label>
                    <Controller
                      name="festivalDate"
                      control={control}
                      render={({ field }) => (
                        <DatePicker
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select festival date..."
                          disablePastDates
                        />
                      )}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Category</label>
                    <Controller
                      name="category"
                      control={control}
                      render={({ field }) => (
                        <Select 
                          options={categoryOptions}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select category..."
                        />
                      )}
                    />
                  </div>
                  
                  <div className="flex items-center gap-3 pt-2">
                    <input
                      type="checkbox"
                      id="featured"
                      {...register('featured')}
                      className="w-4 h-4 text-saffron border-gray-300 rounded focus:ring-saffron"
                    />
                    <label htmlFor="featured" className="text-sm font-semibold text-gray-800 cursor-pointer">
                      Mark as Featured Festival
                    </label>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Status</label>
                    <Controller
                      name="status"
                      control={control}
                      render={({ field }) => (
                        <Select
                          options={[
                            { label: 'Draft (Hidden)', value: 'Draft' },
                            { label: 'Published', value: 'Published' },
                            { label: 'Archived', value: 'Archived' }
                          ]}
                          value={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
                  </div>
                </div>

                {/* Related Content */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md shadow-sm border border-blue-100 p-6 space-y-5">
                  <h3 className="font-bold text-gray-900 border-b pb-3">Related Content</h3>
                  
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-800">Related Bhajans</label>
                    <Controller
                      name="bhajanIds"
                      control={control}
                      render={({ field }) => (
                        <MultiSelect 
                          options={bhajans || []}
                          values={field.value || []}
                          onChange={field.onChange}
                          placeholder="Search and select bhajans..."
                          isLoading={isLoadingBhajans}
                        />
                      )}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-800">Related Articles</label>
                    <Controller
                      name="articleIds"
                      control={control}
                      render={({ field }) => (
                        <MultiSelect 
                          options={articles || []}
                          values={field.value || []}
                          onChange={field.onChange}
                          placeholder="Search and select articles..."
                          isLoading={isLoadingArticles}
                        />
                      )}
                    />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md shadow-sm border border-blue-100 p-6 space-y-5">
                  <h3 className="font-bold text-gray-900 border-b pb-3">Festival Banner</h3>
                  <div className="space-y-1.5 flex flex-col">
                    <ImageUploadWithCrop
                      value={bannerPreview || undefined}
                      onChange={(dataUrl, file) => {
                        setBannerFile(file);
                        setBannerPreview(dataUrl);
                        setValue('bannerImage', 'pending');
                      }}
                      onRemove={() => { setBannerFile(null); setBannerPreview(null); setValue('bannerImage', ''); }}
                      aspectRatio={16/9}
                      className="w-full max-w-2xl aspect-video rounded-md border-2 border-dashed border-gray-300 hover:border-saffron transition-colors"
                      placeholder="Upload 16:9 Banner"
                    />
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  )}

  {showPreview && createPortal(
    <div className="fixed inset-0 z-[110] bg-black/60 flex justify-center items-center backdrop-blur-sm p-4 md:p-10 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-4xl h-full flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50 shrink-0">
          <div className="flex items-center gap-2 text-saffron">
            <Eye className="w-5 h-5" />
            <h3 className="font-bold text-lg">Live Preview</h3>
          </div>
          <button 
            type="button"
            onClick={() => setShowPreview(false)} 
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
          >
            <X className="w-5 h-5"/>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-cream">
          <div className="max-w-3xl mx-auto bg-white p-8 md:p-12 rounded-md shadow-sm border border-gray-100">
            {(() => {
              const previewName = activeLanguage === 'translation' ? (watch('name_en' as any) || watch('name')) : watch('name');
              const previewDesc = activeLanguage === 'translation' ? (watch('shortDescription_en' as any) || watch('shortDescription')) : watch('shortDescription');
              const rawContent = activeLanguage === 'translation' ? (watch('content_en' as any) || watch('content')) : watch('content');
              const isEmptyContent = !rawContent || rawContent === '<p><br></p>' || rawContent === '<p></p>';
              const previewContentHtml = isEmptyContent 
                ? '<p class="text-gray-400 italic">Start writing the festival details to see the preview here...</p>' 
                : rawContent.replace(/&nbsp;|[\u00A0\u202F\u2007]/g, ' ');

              return (
                <>
                  <h1 className="text-4xl md:text-5xl font-extrabold text-darkBrown mb-6 font-serif">{previewName || 'Untitled Festival'}</h1>
                  {previewDesc && (
                    <p className="text-xl text-gray-600 mb-8 leading-relaxed italic border-l-4 border-saffron pl-4">
                      {previewDesc}
                    </p>
                  )}
                  
                  {bannerPreview && (
                    <div className="mb-10 rounded-md overflow-hidden shadow-md">
                      <img src={bannerPreview} alt="Banner" className="w-full h-auto object-cover max-h-[400px]" />
                    </div>
                  )}
                  
                  <div 
                    className="prose prose-lg max-w-none text-gray-800 leading-loose [&_*]:!whitespace-normal [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-darkBrown [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-darkBrown [&_h3]:mt-8 [&_h3]:mb-3 [&_p]:mb-6 [&_a]:text-saffron [&_a]:underline [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-6 [&_blockquote]:border-l-4 [&_blockquote]:border-saffron [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-600 [&_blockquote]:my-6 [&_img]:rounded-md [&_img]:shadow-md" 
                    dangerouslySetInnerHTML={{ __html: previewContentHtml }} 
                  />
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )}
  </>
  );
};
