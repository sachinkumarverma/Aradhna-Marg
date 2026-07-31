import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Upload, Eye, Send, X, FileText } from 'lucide-react';
import { apiClient } from '../../../api/client';
import { uploadFile } from '../../../api/upload';
import toast from 'react-hot-toast';
import { Select } from '../../../components/ui/Select';

// Simple client-side slugify
const generateSlug = (text: string) => {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
};

const languages = [
  { label: 'Hindi', value: 'Hindi' },
  { label: 'English', value: 'English' },
  { label: 'Sanskrit', value: 'Sanskrit' },
  { label: 'Gujarati', value: 'Gujarati' },
  { label: 'Marathi', value: 'Marathi' },
  { label: 'Punjabi', value: 'Punjabi' },
  { label: 'Tamil', value: 'Tamil' },
  { label: 'Telugu', value: 'Telugu' },
  { label: 'Kannada', value: 'Kannada' },
  { label: 'Bengali', value: 'Bengali' },
];

import { createPortal } from 'react-dom';
// @ts-ignore
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

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

  const { register, handleSubmit, control, watch, setValue, reset, formState: { errors, isValid } } = useForm({
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
      setValue('slug', generateSlug(titleValue), { shouldValidate: true });
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


  return createPortal(
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
              <h1 className="text-xl font-bold text-gray-900">{isEditing ? 'Edit Purana' : 'Create Purana'}</h1>
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
              <label className="text-sm font-semibold text-gray-800">Title *</label>
              <input
                {...register('title', { required: 'Title is required' })}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-saffron/20 focus:border-saffron outline-none transition-all"
                placeholder="e.g. Shiva Purana"
              />
              {errors.title && <p className="text-xs text-red-500">{errors.title.message as string}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-800">Cover Image</label>
                {coverPreview ? (
                  <div className="relative rounded-lg overflow-hidden border border-gray-200 group h-[200px]">
                    <img src={coverPreview} alt="Cover Preview" className="w-full h-full object-cover" />
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
                        onClick={() => { setCoverFile(null); setCoverPreview(null); setValue('cover_image', ''); }} 
                        className="p-2 bg-white text-red-500 rounded-full hover:bg-red-50 shadow-md border border-gray-100" title="Discard"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer group h-[200px]">
                    <input type="file" accept="image/*" className="hidden" id="purana-cover-upload" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setCoverFile(file);
                        setCoverPreview(URL.createObjectURL(file));
                        setValue('cover_image', 'pending'); // to satisfy validation if required
                      }
                    }} />
                    <label htmlFor="purana-cover-upload" className="flex flex-col items-center cursor-pointer w-full h-full justify-center">
                      <Upload className="w-8 h-8 text-gray-400 group-hover:text-saffron mb-3" />
                      <p className="text-sm text-gray-600 font-medium">Click to upload cover</p>
                    </label>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-800">PDF File *</label>
                {pdfFile || watch('pdf_file') ? (
                  <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-red-50 flex flex-col items-center justify-center h-[200px] group">
                    <FileText className="w-12 h-12 text-red-500 mb-2" />
                    <span className="text-sm font-medium text-red-700 px-4 text-center truncate w-full">
                      {pdfFile ? pdfFile.name : 'PDF Uploaded'}
                    </span>
                    <div className="absolute top-3 right-3 flex gap-2">
                      <button 
                        type="button" 
                        onClick={() => window.open(pdfFile ? URL.createObjectURL(pdfFile) : watch('pdf_file'), '_blank')}
                        className="p-2 bg-white text-blue-500 rounded-full hover:bg-blue-50 shadow-md border border-gray-100" title="Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        type="button" 
                        onClick={() => { setPdfFile(null); setValue('pdf_file', ''); }} 
                        className="p-2 bg-white text-red-500 rounded-full hover:bg-red-50 shadow-md border border-gray-100" title="Discard"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer group h-[200px]">
                    <input type="file" accept="application/pdf" className="hidden" id="purana-pdf-upload" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setPdfFile(file);
                        setValue('pdf_file', 'pending'); // satisfy validation
                      }
                    }} />
                    <label htmlFor="purana-pdf-upload" className="flex flex-col items-center cursor-pointer w-full h-full justify-center">
                      <FileText className="w-8 h-8 text-gray-400 group-hover:text-red-500 mb-3" />
                      <p className="text-sm text-gray-600 font-medium">Click to upload PDF</p>
                    </label>
                  </div>
                )}
                {errors.pdf_file && <p className="text-xs text-red-500">{errors.pdf_file.message as string}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-800">Description</label>
              <Controller
                name="short_description"
                control={control}
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
              <input
                {...register('author')}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-saffron focus:ring-1 focus:ring-saffron text-sm"
                placeholder="Optional author name..."
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
        </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
