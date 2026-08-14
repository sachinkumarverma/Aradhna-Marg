import { AutoResizeTextarea } from '@components/ui/AutoResizeTextarea';
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { Languages, ArrowLeft, Save, Loader2, Eye, Send, Upload, X } from 'lucide-react';
import { TranslationPanel } from '../../../features/translations/TranslationPanel';
import { apiClient } from '@api/client';
import { uploadFile, uploadMediaFile } from '@api/upload';
import toast from 'react-hot-toast';
import { Select } from '@components/ui/Select';
import { MultiSelect } from '@components/ui/MultiSelect';

// Simple client-side slugify
import { generateSlug } from '@utils/slugify';

import { createPortal } from 'react-dom';
import { RichTextEditor } from '@components/ui/RichTextEditor';
import { isFormActuallyDirty } from '@utils/isFormActuallyDirty';
import { ImageUploadWithCrop } from '@components/ui/ImageUploadWithCrop';
import { FormLoader } from '@components/admin/FormLoader';

export const AdminArticleForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);

  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState<'original' | 'translation'>('original');
  const [showPreview, setShowPreview] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    control,
    setValue,
    reset,
    formState: { errors, isDirty, isValid, defaultValues, dirtyFields }
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      image_url: '',
      featured_image_id: '',
      category_id: '',
      author_id: '',
      deities: [] as string[],
      festivals: [] as string[],
      tags: [] as string[],
      bhajans: [] as string[],
      related_articles: [] as string[],
      status: 'DRAFT',
      featured: false,
      seo_title: '',
      seo_description: ''
    }
  });

  const titleValue = watch('title');
  const slugValue = watch('slug');

  // Auto slug generation
  useEffect(() => {
    if (!isEditing && titleValue && !slugValue) {
      setValue('slug', generateSlug(titleValue), { shouldValidate: true, shouldDirty: true });
    }
  }, [titleValue, isEditing, slugValue, setValue]);

  // Fetch data if editing
  const articleQuery = useQuery({
    queryKey: ['admin-article', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await apiClient.get(`/admin/articles/${id}`);
      return res.data.data;
    },
    enabled: isEditing
  });

  useEffect(() => {
    if (articleQuery.data) {
      const data = articleQuery.data;
      reset({
        ...data,
        deities: data.article_gods?.map((g: any) => g.god_id) || [],
        festivals: data.article_festivals?.map((f: any) => f.festival_id) || [],
        tags: data.article_tags?.map((t: any) => t.tag_id) || [],
        bhajans: data.article_bhajans?.map((b: any) => b.bhajan_id) || [],
        related_articles: data.related_articles?.map((r: any) => r.related_id) || []
      });
      if (data.media_files?.url) {
        setCoverPreview(data.media_files.url);
      }
    }
  }, [articleQuery.data, reset]);

  // Data fetching for dropdowns
  const { data: catData, isLoading: isCatLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await apiClient.get('/admin/categories?limit=100')).data.data
  });
  const { data: deitiesData, isLoading: isDeitiesLoading } = useQuery({
    queryKey: ['deities'],
    queryFn: async () => (await apiClient.get('/admin/deities?limit=100')).data.data
  });
  const { data: authorsData, isLoading: isAuthorsLoading } = useQuery({
    queryKey: ['authors'],
    queryFn: async () => (await apiClient.get('/admin/authors?limit=100')).data.data
  });
  const { data: festivalsData, isLoading: isFestivalsLoading } = useQuery({
    queryKey: ['festivals'],
    queryFn: async () => (await apiClient.get('/admin/festivals?limit=100')).data.data
  });
  const { data: tagsData, isLoading: isTagsLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => (await apiClient.get('/admin/tags?limit=100')).data.data
  });
  const { data: bhajansData, isLoading: isBhajansLoading } = useQuery({
    queryKey: ['bhajans'],
    queryFn: async () => (await apiClient.get('/admin/bhajans?limit=100')).data.data
  });
  const { data: articlesData, isLoading: isArticlesLoading } = useQuery({
    queryKey: ['articles'],
    queryFn: async () => (await apiClient.get('/admin/articles?limit=100')).data.data
  });

  const mapOpts = (arr: any[], idKey = 'id', labelKey = 'name') =>
    (arr || []).map((a) => ({ value: a[idKey], label: a[labelKey] || a.title }));

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = { ...data };
      if (isEditing) return apiClient.put(`/admin/articles/${id}`, payload);
      return apiClient.post('/admin/articles', payload);
    },
    onSuccess: (res) => {
      setLastSaved(new Date());
      queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
      toast.success(isEditing ? 'Article updated' : 'Article created');
      navigate('/admin/articles');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to save');
    }
  });

  const onSubmit = async (data: any) => {
    if (coverFile) {
      setIsUploading(true);
      try {
        const media = await uploadMediaFile(coverFile);
        data.featured_image_id = media.id;
        // Optionally keep image_url for UI preview purposes if needed by the component,
        // but backend already strips image_url out.
        data.image_url = media.url;
      } catch (err: any) {
        toast.error('Failed to upload image: ' + (err.response?.data?.message || err.message));
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }
    saveMutation.mutate(data);
  };

  const handleClose = () => {
    navigate('/admin/articles');
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
                <button
                  type="button"
                  onClick={handleClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                  <h1 className="text-xl font-bold tracking-wide text-slate-900 uppercase">
                    {isEditing ? 'Edit Article' : 'Create Article'}
                  </h1>
                  {lastSaved && (
                    <p className="text-xs text-green-600 font-medium mt-1">
                      Last saved: {lastSaved.toLocaleTimeString()}
                    </p>
                  )}
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
                    setValue('status', 'DRAFT');
                    handleSubmit(onSubmit)();
                  }}
                  disabled={saveMutation.isPending || isUploading || !isValid || (isEditing ? !actuallyDirty : false)}
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
                  disabled={saveMutation.isPending || isUploading || !isValid || (isEditing ? !actuallyDirty : false)}
                  className="flex items-center gap-2 px-5 py-2 bg-saffron text-white rounded-md hover:bg-saffron/90 transition-colors font-medium text-sm shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {saveMutation.isPending || isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {saveMutation.isPending || isUploading ? 'Publishing...' : 'Publish'}
                </button>
              </div>
            </div>

            {/* Content */}
            {isEditing && articleQuery.isLoading ? (
              <FormLoader />
            ) : (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

                  {activeLanguage === 'original' && (
                    <div className="space-y-6">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md shadow-sm border border-blue-100 p-6 space-y-5">
                        <div className="space-y-1.5">
                          <label className="text-sm font-semibold text-gray-800">Article Title *</label>
                          <input
                            {...register('title', { required: 'Title is required' })}
                            className="w-full px-4 py-2.5 bg-white border border-blue-100 rounded-md focus:ring-2 focus:ring-saffron/20 focus:border-saffron outline-none transition-all"
                            placeholder="e.g. The Significance of Diwali"
                          />
                          {errors.title && <p className="text-xs text-red-500">{errors.title.message as string}</p>}
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-sm font-semibold text-gray-800">Excerpt</label>
                          <AutoResizeTextarea
                            {...register('excerpt')}
                            rows={3}
                            className="w-full px-4 py-3 bg-white border border-blue-100 rounded-md focus:ring-2 focus:ring-saffron/20 focus:border-saffron outline-none transition-all text-sm leading-relaxed"
                            placeholder="A short summary of the article..."
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-sm font-semibold text-gray-800">Cover Image</label>
                          <div className="flex flex-col">
                            <ImageUploadWithCrop
                              value={coverPreview || undefined}
                              onChange={(dataUrl, file) => {
                                setCoverFile(file);
                                setCoverPreview(dataUrl);
                                setValue('image_url', 'pending');
                              }}
                              onRemove={() => {
                                setCoverFile(null);
                                setCoverPreview(null);
                                setValue('image_url', '');
                              }}
                              aspectRatio={16 / 9}
                              className="w-full max-w-2xl aspect-video rounded-md border-2 border-dashed border-gray-300 hover:border-saffron transition-colors"
                              placeholder="Upload 16:9 Cover"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-sm font-semibold text-gray-800">Content *</label>
                          <Controller
                            name="content"
                            control={control}
                            rules={{ required: 'Content is required' }}
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
                          {errors.content && <p className="text-xs text-red-500">{errors.content.message as string}</p>}
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md shadow-sm border border-blue-100 overflow-hidden">
                        <div className="px-6 py-3 font-bold text-gray-900 bg-gray-50/50 border-b">Advanced SEO</div>

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
                            <AutoResizeTextarea
                              {...register('seo_description')}
                              rows={3}
                              className="w-full px-3 py-2 bg-white border border-blue-100 rounded-md outline-none text-sm focus:border-saffron focus:ring-1 focus:ring-saffron"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeLanguage === 'translation' && (
                    <div className="space-y-6">
                      <TranslationPanel
                        contentType="ARTICLE"
                        contentId={id || 'new'}
                        sourceLang="hi"
                        targetLang="en"
                        hasTranslation={
                          !!watch('title_en' as any) || !!watch('excerpt_en' as any) || !!watch('content_en' as any)
                        }
                        isOutdated={!!(dirtyFields.title || dirtyFields.excerpt || dirtyFields.content)}
                        originalContent={{
                          title: watch('title'),
                          excerpt: watch('excerpt'),
                          content: watch('content'),
                          seo_title: watch('seo_title'),
                          seo_description: watch('seo_description')
                        }}
                        onGenerateLive={(t: any) => {
                          setValue('title_en' as any, t.title || '');
                          setValue('excerpt_en' as any, t.excerpt || '');
                          setValue('content_en' as any, t.content || '');
                          setValue('seo_title_en' as any, t.seo_title || '');
                          setValue('seo_description_en' as any, t.seo_description || '');
                        }}
                      />

                      {!(!!watch('title_en' as any) || !!watch('excerpt_en' as any) || !!watch('content_en' as any)) ? (
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 py-16 px-6 text-center shadow-sm">
                          <div className="w-16 h-16 bg-[#F5F7FF] text-[#5542F6] rounded-full flex items-center justify-center mx-auto mb-5">
                            <Languages className="w-8 h-8" />
                          </div>
                          <h3 className="text-lg font-bold text-[#1a1a2e] mb-2">English Translation</h3>
                          <p className="text-gray-500 text-[14px] max-w-sm mx-auto leading-relaxed">
                            No English translation has been generated yet.
                            <br />
                            Click "Generate English Translation" above to start.
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md shadow-sm border border-blue-100 p-6 space-y-5">
                            <div className="space-y-1.5">
                              <label className="text-sm font-semibold text-gray-800">Article Title *</label>
                              <input
                                {...register('title_en' as any, { required: 'Title is required' })}
                                className={`w-full px-4 py-2.5 bg-white border rounded-md focus:ring-2 focus:ring-saffron/20 focus:border-saffron outline-none transition-all text-sm font-medium ${(errors as any).title_en ? 'border-red-500' : 'border-blue-100'}`}
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-sm font-semibold text-gray-800">Excerpt</label>
                              <AutoResizeTextarea
                                {...register('excerpt_en' as any)}
                                rows={3}
                                className="w-full px-4 py-3 bg-white border border-blue-100 rounded-md focus:ring-2 focus:ring-saffron/20 focus:border-saffron outline-none transition-all text-sm leading-relaxed"
                              />
                            </div>
                          </div>

                          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md shadow-sm border border-blue-100 p-6 space-y-5">
                            <h3 className="font-bold text-gray-900 border-b pb-3">Content</h3>
                            <Controller
                              name={'content_en' as any}
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

                          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md shadow-sm border border-blue-100 overflow-hidden">
                            <div className="px-6 py-3 font-bold text-gray-900 bg-gray-50/50 border-b border-blue-100">
                              Advanced SEO
                            </div>

                            <div className="p-6 space-y-4">
                              <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700">SEO Title</label>
                                <input
                                  {...register('seo_title_en' as any)}
                                  className="w-full px-3 py-2 bg-white border border-blue-100 rounded-md outline-none text-sm focus:border-saffron focus:ring-1 focus:ring-saffron"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700">SEO Description</label>
                                <AutoResizeTextarea
                                  {...register('seo_description_en' as any)}
                                  rows={3}
                                  className="w-full px-3 py-2 bg-white border border-blue-100 rounded-md outline-none text-sm focus:border-saffron focus:ring-1 focus:ring-saffron"
                                />
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
                {/* RIGHT COLUMN: Settings & Metadata */}
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md shadow-sm border border-blue-100 p-6 space-y-5">
                    <h3 className="font-bold text-gray-900 border-b pb-3">Taxonomy & Relations</h3>

                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-700">Category *</label>
                      <Controller
                        name="category_id"
                        control={control}
                        rules={{ required: 'Category is required' }}
                        render={({ field }) => (
                          <Select
                            options={mapOpts(catData)}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Search category..."
                            isLoading={isCatLoading}
                            error={!!errors.category_id}
                          />
                        )}
                      />
                      {errors.category_id && (
                        <p className="text-xs text-red-500">{errors.category_id.message as string}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-700">Author</label>
                      <Controller
                        name="author_id"
                        control={control}
                        render={({ field }) => (
                          <Select
                            options={mapOpts(authorsData)}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Select author..."
                            isLoading={isAuthorsLoading}
                          />
                        )}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-700">Tags</label>
                      <Controller
                        name="tags"
                        control={control}
                        render={({ field }) => (
                          <MultiSelect
                            options={mapOpts(tagsData)}
                            values={field.value}
                            onChange={field.onChange}
                            placeholder="Select tags..."
                            isLoading={isTagsLoading}
                          />
                        )}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-700">Deities</label>
                      <Controller
                        name="deities"
                        control={control}
                        render={({ field }) => (
                          <MultiSelect
                            options={mapOpts(deitiesData)}
                            values={field.value}
                            onChange={field.onChange}
                            placeholder="Select deities..."
                          />
                        )}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-700">Festivals</label>
                      <Controller
                        name="festivals"
                        control={control}
                        render={({ field }) => (
                          <MultiSelect
                            options={mapOpts(festivalsData)}
                            values={field.value}
                            onChange={field.onChange}
                            placeholder="Select festivals..."
                          />
                        )}
                      />
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

                    <label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-50 rounded-md border border-gray-200">
                      <input
                        type="checkbox"
                        {...register('featured')}
                        className="w-4 h-4 text-saffron focus:ring-saffron rounded border-gray-300"
                      />
                      <span className="text-sm font-medium text-gray-700">Featured Article</span>
                    </label>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md shadow-sm border border-blue-100 p-6 space-y-5">
                    <h3 className="font-bold text-gray-900 border-b pb-3">Relations</h3>

                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-700">Related Bhajans</label>
                      <Controller
                        name="bhajans"
                        control={control}
                        render={({ field }) => (
                          <MultiSelect
                            options={mapOpts(bhajansData, 'id', 'title')}
                            values={field.value}
                            onChange={field.onChange}
                            placeholder="Select bhajans..."
                          />
                        )}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-700">Related Articles</label>
                      <Controller
                        name="related_articles"
                        control={control}
                        render={({ field }) => (
                          <MultiSelect
                            options={mapOpts(
                              articlesData?.filter((a: any) => a.id !== id),
                              'id',
                              'title'
                            )}
                            values={field.value}
                            onChange={field.onChange}
                            placeholder="Select articles..."
                          />
                        )}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="h-2 col-span-1 lg:col-span-3"></div>
            </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {showPreview &&
        createPortal(
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
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-cream">
                <div className="max-w-3xl mx-auto bg-white p-8 md:p-12 rounded-md shadow-sm border border-gray-100">
                  {(() => {
                    const previewTitle =
                      activeLanguage === 'translation' ? watch('title_en' as any) || watch('title') : watch('title');
                    const previewExcerpt =
                      activeLanguage === 'translation'
                        ? watch('excerpt_en' as any) || watch('excerpt')
                        : watch('excerpt');
                    const rawContent =
                      activeLanguage === 'translation'
                        ? watch('content_en' as any) || watch('content')
                        : watch('content');
                    const isEmptyContent = !rawContent || rawContent === '<p><br></p>' || rawContent === '<p></p>';
                    const previewContentHtml = isEmptyContent
                      ? '<p class="text-gray-400 italic">Start writing your article to see the preview here...</p>'
                      : rawContent.replace(/&nbsp;|[\u00A0\u202F\u2007]/g, ' ');

                    return (
                      <>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-darkBrown mb-6 font-serif">
                          {previewTitle || 'Untitled Article'}
                        </h1>
                        {previewExcerpt && (
                          <p className="text-xl text-gray-600 mb-8 leading-relaxed italic border-l-4 border-saffron pl-4">
                            {previewExcerpt}
                          </p>
                        )}

                        {coverPreview && (
                          <div className="mb-10 rounded-md overflow-hidden shadow-md">
                            <img src={coverPreview} alt="Cover" className="w-full h-auto object-cover max-h-[400px]" />
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
