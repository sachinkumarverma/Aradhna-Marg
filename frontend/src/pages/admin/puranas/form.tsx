import { AutoResizeTextarea } from "@components/ui/AutoResizeTextarea";
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { Languages,  ArrowLeft, Save, Loader2, Upload, Eye, Send, X, FileText  } from 'lucide-react';
import { TranslationPanel } from '../../../features/translations/TranslationPanel';
import { apiClient } from '@api/client';
import { uploadFile } from '@api/upload';
import toast from 'react-hot-toast';
import { Select } from '@components/ui/Select';

// Simple client-side slugify
const generateSlug = (text: string) => {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
};

const languages = [
  { label: 'Hindi', value: 'Hindi' },
  { label: 'English', value: 'English' }
];

import { createPortal } from 'react-dom';
import { RichTextEditor } from "@components/ui/RichTextEditor";
import { isFormActuallyDirty } from '@utils/isFormActuallyDirty';
import { ImageUploadWithCrop } from '@components/ui/ImageUploadWithCrop';

export const AdminPuranForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);

  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState<'original' | 'translation'>('original');

  const { register, handleSubmit, control, watch, setValue, reset, formState: { errors, isValid, isDirty, defaultValues, dirtyFields } } = useForm({
    mode: 'onChange',
    defaultValues: {
      title: '',
      slug: '',
      short_description: '',
      cover_image: '',
      pdf_file: '',
      language: '',
      author: '',
      status: 'DRAFT',
      seo_title: '',
      seo_description: '',
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
  useQuery({
    queryKey: ['admin-puran', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await apiClient.get(`/admin/puranas/${id}`);
      const data = res.data.data;
      reset(data);
      if (data.cover_image) setCoverPreview(data.cover_image);
      return data;
    },
    enabled: isEditing
  });

  // Fetch authors for select
  const { data: authorOptions = [], isLoading: isLoadingAuthors } = useQuery({
    queryKey: ['admin-authors-options'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/authors', { params: { limit: 1000 } });
      return res.data.data.map((a: any) => ({ label: a.name, value: a.name }));
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (isEditing) return apiClient.put(`/admin/puranas/${id}`, data);
      return apiClient.post('/admin/puranas', data);
    },
    onSuccess: (res) => {
      setLastSaved(new Date());
      queryClient.invalidateQueries({ queryKey: ['admin-puranas'] });
      if (!isEditing && res.data?.data?.id) {
        navigate(`/admin/puranas/${res.data.data.id}/edit`, { replace: true });
      }
      toast.success(isEditing ? 'Purana updated' : 'Purana created');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to save');
    }
  });

  const onSubmit = async (data: any) => {
    if (coverFile || pdfFile) {
      setIsUploading(true);
      try {
        if (coverFile) {
          data.cover_image = await uploadFile(coverFile);
        }
        if (pdfFile) {
          data.pdf_file = await uploadFile(pdfFile);
        }
      } catch (err: any) {
        toast.error('Upload failed: ' + (err.response?.data?.message || err.message));
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }
    saveMutation.mutate(data);
  };

  const handleClose = () => {
    navigate('/admin/puranas');
  };

  const currentValues = watch();
  const actuallyDirty = isEditing ? isFormActuallyDirty(currentValues, defaultValues) : true;

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
              <h1 className="text-xl font-bold tracking-wide text-slate-900 uppercase">{isEditing ? 'Edit Purana' : 'Create Purana'}</h1>
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
              {(saveMutation.isPending || isUploading) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {(saveMutation.isPending || isUploading) ? 'Publishing...' : 'Publish'}
            </button>
          </div>
        </div>

        {/* Content */}
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

                <div className={activeLanguage === 'original' ? 'block space-y-6' : 'hidden'}>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md shadow-sm border border-blue-100 p-6 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-800">Title *</label>
                  <input
                    {...register('title', { required: 'Title is required' })}
                    className="w-full px-4 py-2.5 bg-white border border-blue-100 rounded-md focus:ring-2 focus:ring-saffron/20 focus:border-saffron outline-none transition-all"
                    placeholder="e.g. Shiva Purana"
                  />
                  {errors.title && <p className="text-xs text-red-500">{errors.title.message as string}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-800">Description</label>
                  <Controller
                    name="short_description"
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
                    <AutoResizeTextarea
                      {...register('seo_description')}
                      rows={3}
                      className="w-full px-3 py-2 bg-white border border-blue-100 rounded-md outline-none text-sm focus:border-saffron focus:ring-1 focus:ring-saffron"
                    />
                  </div>
                </div>
              </div>
            </div>

                <div className={activeLanguage === 'translation' ? 'block space-y-6' : 'hidden'}>
                  <TranslationPanel
                    contentType="PURAN"
                    contentId={id || 'new'}
                    sourceLang="hi"
                    targetLang="en"
                    hasTranslation={!!watch('title_en' as any) || !!watch('description_en' as any)}
                    isOutdated={!!(dirtyFields.title || dirtyFields.short_description)}
                    originalContent={{
                      title: watch("title"), description: watch("short_description"), seo_title: watch("seo_title"), seo_description: watch("seo_description")
                    }}
                    onGenerateLive={(t: any) => {
                      setValue('title_en' as any, t.title || '');
                      setValue('description_en' as any, t.description || '');
                      setValue('seo_title_en' as any, t.seo_title || '');
                      setValue('seo_description_en' as any, t.seo_description || '');
                    }}
                  />

                  {!(!!watch('title_en' as any) || !!watch('description_en' as any)) ? (
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
                          <label className="text-sm font-semibold text-gray-800">Puran Title *</label>
                          <input 
                            {...register('title_en' as any, { required: 'Title is required' })}
                            className={`w-full px-4 py-2.5 bg-white border rounded-md focus:ring-2 focus:ring-saffron/20 focus:border-saffron outline-none transition-all text-sm font-medium ${(errors as any).title_en ? 'border-red-500' : 'border-blue-100'}`}
                          />
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md shadow-sm border border-blue-100 p-6 space-y-5">
                        <h3 className="font-bold text-gray-900 border-b pb-3">Puran Description</h3>
                        <Controller
                          name={"description_en" as any}
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
                              {...register('seo_title_en' as any)}
                              className="w-full px-3 py-2 bg-white border border-blue-100 rounded-md outline-none text-sm focus:border-saffron focus:ring-1 focus:ring-saffron"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700">SEO Meta Description</label>
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
              
</div>
              {/* RIGHT COLUMN: Settings & Metadata */}
            <div className="space-y-6">

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md shadow-sm border border-blue-100 p-6 space-y-5">
                <h3 className="font-bold text-gray-900 border-b pb-3">Publishing Details</h3>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Language *</label>
                  <Controller
                    name="language"
                    control={control}
                    rules={{ required: 'Language is required' }}
                    render={({ field }) => (
                      <Select
                        options={languages}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select language..."
                        error={!!errors.language}
                      />
                    )}
                  />
                  {errors.language && <p className="text-xs text-red-500">{errors.language.message as string}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Author</label>
                  <Controller
                    name="author"
                    control={control}
                    render={({ field }) => (
                      <Select
                        options={authorOptions}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select author..."
                        isLoading={isLoadingAuthors}
                      />
                    )}
                  />
                </div>

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
                <h3 className="font-bold text-gray-900 border-b pb-3">Media Files</h3>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-800">Cover Image</label>
                  <div className="flex flex-col items-center">
                    <ImageUploadWithCrop
                      value={coverPreview || undefined}
                      onChange={(dataUrl, file) => {
                        setCoverFile(file);
                        setCoverPreview(dataUrl);
                        setValue('cover_image', 'pending');
                      }}
                      onRemove={() => { setCoverFile(null); setCoverPreview(null); setValue('cover_image', ''); }}
                      aspectRatio={3 / 4}
                      className="w-full max-w-[200px] aspect-[3/4] rounded-md border-2 border-dashed border-gray-300 hover:border-saffron transition-colors"
                      placeholder="Upload 3:4 Cover"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-800">PDF File *</label>
                  {pdfFile || watch('pdf_file') ? (
                    <div className="relative rounded-md overflow-hidden border border-gray-200 bg-red-50 flex flex-col items-center justify-center h-[160px] group">
                      <FileText className="w-10 h-10 text-red-500 mb-2" />
                      <span className="text-sm font-medium text-red-700 px-4 text-center truncate w-full">
                        {pdfFile ? pdfFile.name : 'PDF Uploaded'}
                      </span>
                      <div className="absolute top-2 right-2 flex gap-1">
                        <button
                          type="button"
                          onClick={() => window.open(pdfFile ? URL.createObjectURL(pdfFile) : watch('pdf_file'), '_blank')}
                          className="p-1.5 bg-white text-blue-500 rounded-full hover:bg-blue-50 shadow-md border border-gray-100" title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => { setPdfFile(null); setValue('pdf_file', ''); }}
                          className="p-1.5 bg-white text-red-500 rounded-full hover:bg-red-50 shadow-md border border-gray-100" title="Discard"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-md bg-gray-50 p-4 flex flex-col items-center justify-center text-center hover:border-saffron transition-colors cursor-pointer group h-[160px]">
                      <input type="file" accept="application/pdf" className="hidden" id="purana-pdf-upload" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setPdfFile(file);
                          setValue('pdf_file', 'pending'); // satisfy validation
                        }
                      }} />
                      <label htmlFor="purana-pdf-upload" className="flex flex-col items-center cursor-pointer w-full h-full justify-center">
                        <FileText className="w-8 h-8 text-gray-400 group-hover:text-saffron mb-2 transition-colors" />
                        <p className="text-sm text-gray-600 font-medium">Click to upload PDF</p>
                      </label>
                    </div>
                  )}
                  {errors.pdf_file && <p className="text-xs text-red-500">{errors.pdf_file.message as string}</p>}
                </div>
              </div>
            </div>
          </div>
          <div className="h-2 col-span-1 lg:col-span-3"></div>
        </div>
      </div>
    </div>,
    document.body
  );
};
