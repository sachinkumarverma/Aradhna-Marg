import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, ChevronDown, Eye, Send, Upload, X, Image as ImageIcon } from 'lucide-react';
import { apiClient } from '../../../api/client';
import { uploadFile } from '../../../api/upload';
import toast from 'react-hot-toast';
import { Select } from '../../../components/ui/Select';
import { MultiSelect } from '../../../components/ui/MultiSelect';
import { cn } from '../../../utils/cn';

// Simple client-side slugify
const generateSlug = (text: string) => {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
};

import { createPortal } from 'react-dom';
// @ts-ignore
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

export const AdminArticleForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);

  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const { register, handleSubmit, control, watch, setValue, reset, formState: { errors, isValid } } = useForm({
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
      publish_date: '',
      seo_title: '',
      seo_description: '',
    }
  });

  const titleValue = watch('title');
  const slugValue = watch('slug');

  // Auto slug generation
  useEffect(() => {
    if (!isEditing && titleValue && !slugValue) {
      setValue('slug', generateSlug(titleValue), { shouldValidate: true });
    }
  }, [titleValue, isEditing, slugValue, setValue]);

  // Fetch data if editing
  useQuery({
    queryKey: ['admin-article', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await apiClient.get(`/admin/articles/${id}`);
      const data = res.data.data;
      reset({
        ...data,
        publish_date: data.publish_date ? new Date(data.publish_date).toISOString().slice(0, 16) : '',
        deities: data.article_gods?.map((g: any) => g.god_id) || [],
        festivals: data.article_festivals?.map((f: any) => f.festival_id) || [],
        tags: data.article_tags?.map((t: any) => t.tag_id) || [],
        bhajans: data.article_bhajans?.map((b: any) => b.bhajan_id) || [],
        related_articles: data.related_articles?.map((r: any) => r.related_id) || [],
      });
      if (data.image_url) {
        setCoverPreview(data.image_url);
      }
      return data;
    },
    enabled: isEditing
  });

  // Data fetching for dropdowns
  const { data: catData } = useQuery({ queryKey: ['categories'], queryFn: async () => (await apiClient.get('/admin/categories?limit=100')).data.data });
  const { data: deitiesData } = useQuery({ queryKey: ['deities'], queryFn: async () => (await apiClient.get('/admin/deities?limit=100')).data.data });
  const { data: authorsData } = useQuery({ queryKey: ['authors'], queryFn: async () => (await apiClient.get('/admin/authors?limit=100')).data.data });
  const { data: festivalsData } = useQuery({ queryKey: ['festivals'], queryFn: async () => (await apiClient.get('/admin/festivals?limit=100')).data.data });
  const { data: tagsData } = useQuery({ queryKey: ['tags'], queryFn: async () => (await apiClient.get('/admin/tags?limit=100')).data.data });
  const { data: bhajansData } = useQuery({ queryKey: ['bhajans'], queryFn: async () => (await apiClient.get('/admin/bhajans?limit=100')).data.data });
  const { data: articlesData } = useQuery({ queryKey: ['articles'], queryFn: async () => (await apiClient.get('/admin/articles?limit=100')).data.data });

  const mapOpts = (arr: any[], idKey = 'id', labelKey = 'name') => (arr || []).map(a => ({ value: a[idKey], label: a[labelKey] || a.title }));

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = { ...data, publish_date: data.publish_date ? new Date(data.publish_date).toISOString() : null };
      if (isEditing) return apiClient.put(`/admin/articles/${id}`, payload);
      return apiClient.post('/admin/articles', payload);
    },
    onSuccess: (res) => {
      setLastSaved(new Date());
      queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
      if (!isEditing && res.data?.data?.id) {
        navigate(`/admin/articles/${res.data.data.id}/edit`, { replace: true });
      }
      toast.success(isEditing ? 'Article updated' : 'Article created');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to save');
    }
  });

  const onSubmit = async (data: any) => {
    if (coverFile) {
      setIsUploading(true);
      try {
        data.image_url = await uploadFile(coverFile);
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

  return (
    <>
      {createPortal(
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-4xl bg-gray-50 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
          <div className="flex items-center gap-4">
            <button type="button" onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{isEditing ? 'Edit Article' : 'Create Article'}</h1>
              {lastSaved && <p className="text-xs text-green-600 font-medium mt-1">Last saved: {lastSaved.toLocaleTimeString()}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePreview}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm shadow-sm"
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
              disabled={saveMutation.isPending || isUploading || !isValid}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              Save as Draft
            </button>
            <button
              onClick={() => {
                setValue('status', 'PUBLISHED');
                handleSubmit(onSubmit)();
              }}
              disabled={saveMutation.isPending || isUploading || !isValid}
              className="flex items-center gap-2 px-5 py-2 bg-saffron text-white rounded-lg hover:bg-saffron/90 transition-colors font-medium text-sm shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
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
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-800">Article Title *</label>
              <input
                {...register('title', { required: 'Title is required' })}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-saffron/20 focus:border-saffron outline-none transition-all"
                placeholder="e.g. The Significance of Diwali"
              />
              {errors.title && <p className="text-xs text-red-500">{errors.title.message as string}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-800">Excerpt</label>
              <textarea
                {...register('excerpt')}
                rows={3}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-saffron/20 focus:border-saffron outline-none transition-all text-sm leading-relaxed"
                placeholder="A short summary of the article..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-800">Cover Image</label>
              {coverPreview ? (
                <div className="relative rounded-lg overflow-hidden border border-gray-200 group">
                  <img src={coverPreview} alt="Cover Preview" className="w-full h-64 object-cover" />
                  <div className="absolute top-3 right-3 flex gap-2">
                    <button 
                      type="button" 
                      onClick={() => window.open(coverPreview, '_blank')}
                      className="p-2 bg-white text-blue-500 rounded-full hover:bg-blue-50 shadow-md border border-gray-100" title="Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      type="button" 
                      onClick={() => { setCoverFile(null); setCoverPreview(null); setValue('image_url', ''); }} 
                      className="p-2 bg-white text-red-500 rounded-full hover:bg-red-50 shadow-md border border-gray-100" title="Discard"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer group">
                  <input type="file" accept="image/*" className="hidden" id="cover-upload" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setCoverFile(file);
                      setCoverPreview(URL.createObjectURL(file));
                    }
                  }} />
                  <label htmlFor="cover-upload" className="flex flex-col items-center cursor-pointer w-full h-full">
                    <Upload className="w-8 h-8 text-gray-400 group-hover:text-saffron mb-3" />
                    <p className="text-sm text-gray-600 font-medium">Click to upload cover image</p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP up to 5MB</p>
                  </label>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-800">Content *</label>
              <Controller
                name="content"
                control={control}
                rules={{ required: 'Content is required' }}
                render={({ field }) => (
                  <div className="pb-10">
                    <ReactQuill 
                      theme="snow" 
                      value={field.value || ''} 
                      onChange={field.onChange} 
                      className="bg-white rounded-b-lg" 
                      style={{ height: '350px' }} 
                    />
                  </div>
                )}
              />
              {errors.content && <p className="text-xs text-red-500">{errors.content.message as string}</p>}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-3 font-bold text-gray-900 bg-gray-50/50 border-b">
                Advanced SEO
              </div>
              
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">SEO Title</label>
                  <input
                    {...register('seo_title')}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none text-sm focus:border-saffron focus:ring-1 focus:ring-saffron"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">SEO Description</label>
                  <textarea
                    {...register('seo_description')}
                    rows={3}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none text-sm focus:border-saffron focus:ring-1 focus:ring-saffron"
                  />
                </div>
              </div>
            </div>
        </div>

        {/* RIGHT COLUMN: Settings & Metadata */}
        <div className="space-y-6">
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-5">
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
                    error={!!errors.category_id}
                  />
                )}
              />
              {errors.category_id && <p className="text-xs text-red-500">{errors.category_id.message as string}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Author</label>
              <Controller
                name="author_id"
                control={control}
                render={({ field }) => (
                  <Select options={mapOpts(authorsData)} value={field.value} onChange={field.onChange} placeholder="Select author..." />
                )}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Tags</label>
              <Controller
                name="tags"
                control={control}
                render={({ field }) => (
                  <MultiSelect options={mapOpts(tagsData)} values={field.value} onChange={field.onChange} placeholder="Select tags..." />
                )}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Deities</label>
              <Controller
                name="deities"
                control={control}
                render={({ field }) => (
                  <MultiSelect options={mapOpts(deitiesData)} values={field.value} onChange={field.onChange} placeholder="Select deities..." />
                )}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Festivals</label>
              <Controller
                name="festivals"
                control={control}
                render={({ field }) => (
                  <MultiSelect options={mapOpts(festivalsData)} values={field.value} onChange={field.onChange} placeholder="Select festivals..." />
                )}
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-5">
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

            <label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-50 rounded-lg border border-gray-200">
              <input type="checkbox" {...register('featured')} className="w-4 h-4 text-saffron focus:ring-saffron rounded border-gray-300" />
              <span className="text-sm font-medium text-gray-700">Featured Article</span>
            </label>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-5">
            <h3 className="font-bold text-gray-900 border-b pb-3">Relations</h3>
            
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Related Bhajans</label>
              <Controller
                name="bhajans"
                control={control}
                render={({ field }) => (
                  <MultiSelect options={mapOpts(bhajansData, 'id', 'title')} values={field.value} onChange={field.onChange} placeholder="Select bhajans..." />
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
                    options={mapOpts(articlesData?.filter((a: any) => a.id !== id), 'id', 'title')} 
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
          <div className="max-w-3xl mx-auto bg-white p-8 md:p-12 rounded-xl shadow-sm border border-gray-100">
            <h1 className="text-4xl md:text-5xl font-extrabold text-darkBrown mb-6 font-serif">{watch('title') || 'Untitled Article'}</h1>
            {watch('excerpt') && (
              <p className="text-xl text-gray-600 mb-8 leading-relaxed italic border-l-4 border-saffron pl-4">
                {watch('excerpt')}
              </p>
            )}
            
            {coverPreview && (
              <div className="mb-10 rounded-xl overflow-hidden shadow-md">
                <img src={coverPreview} alt="Cover" className="w-full h-auto object-cover max-h-[400px]" />
              </div>
            )}
            
            <div 
              className="prose prose-lg max-w-none text-gray-800 leading-loose [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-darkBrown [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-darkBrown [&_h3]:mt-8 [&_h3]:mb-3 [&_p]:mb-6 [&_a]:text-saffron [&_a]:underline [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-6 [&_blockquote]:border-l-4 [&_blockquote]:border-saffron [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-600 [&_blockquote]:my-6 [&_img]:rounded-xl [&_img]:shadow-md" 
              dangerouslySetInnerHTML={{ __html: watch('content') || '<p class="text-gray-400 italic">Start writing your article to see the preview here...</p>' }} 
            />
          </div>
        </div>
      </div>
    </div>,
    document.body
  )}
  </>
  );
};
