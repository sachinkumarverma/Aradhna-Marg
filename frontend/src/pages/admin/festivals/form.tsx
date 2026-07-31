import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Upload, Eye, X, Send } from 'lucide-react';
import { apiClient } from '@api/client';
import { uploadFile } from '@api/upload';
import toast from 'react-hot-toast';
import { Select } from '@components/ui/Select';
import { MultiSelect } from '@components/ui/MultiSelect';
import { DatePicker } from '@components/ui/DatePicker';
import { createPortal } from 'react-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const generateSlug = (text: string) => {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
};

const categories = [
  { label: 'National', value: 'National' },
  { label: 'Religious', value: 'Religious' },
  { label: 'Fast', value: 'Fast' },
  { label: 'Celebration', value: 'Celebration' },
  { label: 'Other', value: 'Other' },
];

export const AdminFestivalForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);

  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const { register, handleSubmit, control, watch, setValue, reset, formState: { errors, isValid } } = useForm({
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
      setValue('slug', generateSlug(nameValue), { shouldValidate: true });
    }
  }, [nameValue, isEditing, slugValue, setValue]);

  // Fetch bhajans for multiselect
  const { data: bhajans } = useQuery({
    queryKey: ['admin-bhajans-options'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/bhajans', { params: { limit: 1000 } });
      return res.data.data.map((b: any) => ({ label: b.title, value: b.id }));
    }
  });

  // Fetch articles for multiselect
  const { data: articles } = useQuery({
    queryKey: ['admin-articles-options'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/articles', { params: { limit: 1000 } });
      return res.data.data.map((a: any) => ({ label: a.title, value: a.id }));
    }
  });

  // Fetch data if editing
  const festivalQuery = useQuery({
    queryKey: ['admin-festival', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await apiClient.get(`/admin/festivals/${id}`);
      const data = res.data.data;
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
        articleIds: data.articleIds || []
      });
      if (data.bannerImage) setBannerPreview(data.bannerImage);
      return data;
    },
    enabled: isEditing
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (isEditing) return apiClient.put(`/admin/festivals/${id}`, data);
      return apiClient.post('/admin/festivals', data);
    },
    onSuccess: (res) => {
      setLastSaved(new Date());
      queryClient.invalidateQueries({ queryKey: ['admin-festivals'] });
      if (!isEditing && res.data?.data?.id) {
        navigate(`/admin/festivals/${res.data.data.id}/edit`, { replace: true });
      }
      toast.success(isEditing ? 'Festival updated' : 'Festival created');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to save');
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
              <h1 className="text-xl font-bold text-gray-900">{isEditing ? 'Edit Festival' : 'Create Festival'}</h1>
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
                setValue('status', 'Draft');
                handleSubmit(onSubmit)();
              }}
              disabled={saveMutation.isPending || isUploading || !isValid}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
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
          {festivalQuery.isLoading && isEditing ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-saffron" />
            </div>
          ) : (
            <form id="festival-form" onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* LEFT COLUMN: Main Content */}
              <div className="lg:col-span-2 space-y-6">
                
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-800">Festival Name *</label>
                    <input 
                      {...register('name', { required: 'Name is required' })}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-saffron/20 focus:border-saffron outline-none transition-all text-sm font-medium"
                      placeholder="e.g. Diwali, Holi..."
                    />
                    {errors.name && <p className="text-xs text-red-500">{errors.name.message as string}</p>}
                  </div>



                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-800">Short Description</label>
                    <textarea 
                      {...register('shortDescription')}
                      rows={2}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-saffron/20 focus:border-saffron outline-none transition-all text-sm leading-relaxed"
                      placeholder="A short summary of the festival..."
                    />
                  </div>
                </div>

                {/* Rich Text Editor */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-5">
                  <h3 className="font-bold text-gray-900 border-b pb-3">Festival Details</h3>
                  <Controller
                    name="content"
                    control={control}
                    render={({ field }) => (
                      <div className="pb-10">
                        <ReactQuill 
                          theme="snow"
                          value={field.value}
                          onChange={field.onChange}
                          className="bg-white rounded-b-lg"
                          style={{ height: '350px' }}
                          modules={{
                            toolbar: [
                              [{ 'header': [1, 2, 3, false] }],
                              ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                              [{'list': 'ordered'}, {'list': 'bullet'}],
                              ['link', 'image'],
                              ['clean']
                            ],
                          }}
                        />
                      </div>
                    )}
                  />
                </div>
                
                {/* Advanced SEO */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-3 font-bold text-gray-900 bg-gray-50/50 border-b">
                    Advanced SEO
                  </div>
                  
                  <div className="p-6 space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-700">SEO Title</label>
                      <input 
                        {...register('seoTitle')}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none text-sm focus:border-saffron focus:ring-1 focus:ring-saffron"
                        placeholder="Leave blank to use name"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-700">SEO Meta Description</label>
                      <textarea 
                        {...register('seoDescription')}
                        rows={3}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none text-sm focus:border-saffron focus:ring-1 focus:ring-saffron"
                        placeholder="Leave blank to use short description"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Settings & Metadata */}
              <div className="space-y-6">
                
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-5">
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
                          options={categories}
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
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-5">
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
                        />
                      )}
                    />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-5">
                  <h3 className="font-bold text-gray-900 border-b pb-3">Festival Banner</h3>
                  <div className="space-y-1.5">
                    {bannerPreview ? (
                      <div className="relative rounded-lg overflow-hidden border border-gray-200 group h-[150px]">
                        <img src={bannerPreview} alt="Banner Preview" className="w-full h-full object-cover" />
                        <div className="absolute top-2 right-2 flex gap-1.5">
                          <button 
                            type="button" 
                            onClick={() => window.open(bannerPreview, '_blank')}
                            className="p-1.5 bg-white text-blue-500 rounded-full hover:bg-blue-50 shadow-md border border-gray-100" title="Preview"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            type="button" 
                            onClick={() => { setBannerFile(null); setBannerPreview(null); setValue('bannerImage', ''); }} 
                            className="p-1.5 bg-white text-red-500 rounded-full hover:bg-red-50 shadow-md border border-gray-100" title="Discard"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer group h-[150px]">
                        <input type="file" accept="image/*" className="hidden" id="banner-upload" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setBannerFile(file);
                            setBannerPreview(URL.createObjectURL(file));
                            setValue('bannerImage', 'pending');
                          }
                        }} />
                        <label htmlFor="banner-upload" className="flex flex-col items-center cursor-pointer w-full h-full justify-center">
                          <Upload className="w-6 h-6 text-gray-400 group-hover:text-saffron mb-2" />
                          <p className="text-xs text-gray-600 font-medium">Upload banner</p>
                        </label>
                      </div>
                    )}
                  </div>
                </div>



              </div>
              <div className="h-10 col-span-1 lg:col-span-3"></div> {/* Bottom spacer */}
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
          <div className="max-w-3xl mx-auto bg-white p-8 md:p-12 rounded-xl shadow-sm border border-gray-100">
            <h1 className="text-4xl md:text-5xl font-extrabold text-darkBrown mb-6 font-serif">{watch('name') || 'Untitled Festival'}</h1>
            {watch('shortDescription') && (
              <p className="text-xl text-gray-600 mb-8 leading-relaxed italic border-l-4 border-saffron pl-4">
                {watch('shortDescription')}
              </p>
            )}
            
            {bannerPreview && (
              <div className="mb-10 rounded-xl overflow-hidden shadow-md">
                <img src={bannerPreview} alt="Banner" className="w-full h-auto object-cover max-h-[400px]" />
              </div>
            )}
            
            <div 
              className="prose prose-lg max-w-none text-gray-800 leading-loose [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-darkBrown [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-darkBrown [&_h3]:mt-8 [&_h3]:mb-3 [&_p]:mb-6 [&_a]:text-saffron [&_a]:underline [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-6 [&_blockquote]:border-l-4 [&_blockquote]:border-saffron [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-600 [&_blockquote]:my-6 [&_img]:rounded-xl [&_img]:shadow-md" 
              dangerouslySetInnerHTML={{ __html: watch('content') || '<p class="text-gray-400 italic">Start writing the festival details to see the preview here...</p>' }} 
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
