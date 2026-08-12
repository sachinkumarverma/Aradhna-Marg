import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SearchInput } from '@components/ui/SearchInput';
import { Pagination } from '@components/ui/Pagination';
import { isFormActuallyDirty } from '@utils/isFormActuallyDirty';
import { apiClient } from '@api/client';
import toast from 'react-hot-toast';
import { useForm, Controller } from 'react-hook-form';
import { Select } from '@components/ui/Select';
import { Button } from '@components/ui/Button';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Save,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Image as ImageIcon
} from 'lucide-react';
import { ImageUploadWithCrop } from '@components/ui/ImageUploadWithCrop';

export function AdminAuthors() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors, isSubmitting, isValid, isDirty, defaultValues }
  } = useForm({ mode: 'onChange' });

  // Fetch Authors
  const { data, isLoading } = useQuery({
    queryKey: ['admin-authors', page, limit, search],
    queryFn: async () => {
      const res = await apiClient.get('/admin/authors', {
        params: { page, limit: 10, search: search || undefined }
      });
      return res.data;
    }
  });

  // Create / Update Mutation
  const saveMutation = useMutation({
    mutationFn: async (formData: any) => {
      if (editingId) {
        await apiClient.put(`/admin/authors/${editingId}`, formData);
      } else {
        await apiClient.post('/admin/authors', formData);
      }
    },
    onSuccess: () => {
      toast.success(`Author ${editingId ? 'updated' : 'created'} successfully`);
      queryClient.invalidateQueries({ queryKey: ['admin-authors'] });
      closeDrawer();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to save author');
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/admin/authors/${id}`);
    },
    onSuccess: () => {
      toast.success('Author deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-authors'] });
    },
    onError: () => toast.error('Failed to delete author')
  });

  const openDrawer = (author?: any) => {
    if (author) {
      setEditingId(author.id);
      reset(author);
    } else {
      setEditingId(null);
      reset({ status: 'ACTIVE' });
    }
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setEditingId(null);
    reset({});
  };

  const currentValues = watch();
  const actuallyDirty = editingId ? isFormActuallyDirty(currentValues, defaultValues) : true;

  const onSubmit = async (data: any) => {
    saveMutation.mutate(data);
  };

  const authors = data?.data || [];
  const totalPages = Math.ceil((data?.meta?.total || 0) / 10);

  return (
    <div className="space-y-6 flex flex-col min-h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-wide text-slate-900 flex items-center gap-2 uppercase">
            <Users className="w-6 h-6 text-saffron" />
            AUTHORS
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage content authors and contributors.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => openDrawer()} variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
            Create Author
          </Button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-md shadow-sm border border-blue-100 flex flex-wrap gap-4 items-center justify-between">
        <SearchInput
          placeholder="Search authors..."
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
        />
      </div>

      <div className="flex-1  relative">
        {isLoading ? (
          <div className="w-full overflow-x-auto bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md border border-blue-100 shadow-sm animate-pulse">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <th key={i} className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((row) => (
                  <tr key={row} className="border-b border-gray-50">
                    {[1, 2, 3, 4, 5].map((col) => (
                      <td key={col} className="px-6 py-4">
                        <div className="h-4 bg-gray-100 rounded w-full"></div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : authors.length === 0 ? (
          <div className="border border-dashed border-gray-300 rounded-md bg-gray-50 flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
              <Users className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-900">No records found.</h3>
            <p className="text-xs text-gray-500 mt-1">Create your first author.</p>
          </div>
        ) : (
          <div className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-t-md border border-blue-100 shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-orange-50 text-orange-900 border-b border-orange-100 uppercase text-xs tracking-wider font-semibold">
                  <tr>
                    <th className="px-6 py-4 font-bold">Author</th>
                    <th className="px-6 py-4 font-bold text-center">Status</th>
                    <th className="px-6 py-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {authors.map((author: any) => (
                    <tr key={author.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {author.photo ? (
                            <img
                              src={author.photo}
                              alt={author.name}
                              className="w-10 h-10 rounded-full object-cover bg-gray-100 border border-gray-200"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                              <ImageIcon className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-gray-900">{author.name}</p>
                            {author.shortDescription && (
                              <p className="text-xs text-gray-500 truncate max-w-[250px]">{author.shortDescription}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide
                        ${author.status === 'ACTIVE' ? 'bg-green-600 text-white' : 'bg-gray-500 text-white'}
                      `}
                        >
                          {author.status === 'ACTIVE' ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <XCircle className="w-3 h-3" strokeWidth={2.5} />
                          )}
                          {author.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end">
                          <button
                            onClick={() => openDrawer(author)}
                            className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                          >
                            <Edit2 className="w-4 h-4" strokeWidth={3.5} />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this author?')) {
                                deleteMutation.mutate(author.id);
                              }
                            }}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                          >
                            <Trash2 className="w-4 h-4" strokeWidth={3.5} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              totalPages={totalPages}
              totalRecords={data?.meta?.total || 0}
              limit={limit}
              onPageChange={setPage}
              onLimitChange={(l) => {
                setLimit(l);
                setPage(1);
              }}
            />
          </div>
        )}
      </div>

      {/* Drawer */}
      {isDrawerOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex justify-end">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={closeDrawer} />
            <div className="relative w-full max-w-4xl bg-gray-50 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 bg-orange-100 border-b border-orange-200">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={closeDrawer}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <div>
                    <h1 className="text-xl font-bold tracking-wide text-slate-900 uppercase">
                      {editingId ? 'Edit Author' : 'Create Author'}
                    </h1>
                  </div>
                </div>
                <button
                  type="submit"
                  form="author-form"
                  disabled={saveMutation.isPending || isUploading || !isValid || (editingId ? !actuallyDirty : false)}
                  className="flex items-center gap-2 px-5 py-2 bg-saffron text-white rounded-md hover:bg-saffron/90 transition-colors font-medium text-sm shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {saveMutation.isPending ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {saveMutation.isPending ? 'Saving...' : 'Save'}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <form id="author-form" onSubmit={handleSubmit(onSubmit)} className="h-full">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                    {/* LEFT COLUMN: Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md shadow-sm border border-blue-100 p-6 space-y-5">
                        <div className="space-y-1.5">
                          <label className="text-sm font-semibold text-gray-800">Author Name *</label>
                          <input
                            {...register('name', { required: true })}
                            className="w-full px-4 py-2.5 bg-white border border-blue-100 rounded-md focus:ring-2 focus:ring-saffron/20 focus:border-saffron outline-none transition-all"
                            placeholder="e.g. Swami Vivekananda"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-sm font-semibold text-gray-800">Short Description</label>
                          <textarea
                            {...register('shortDescription')}
                            rows={5}
                            className="w-full px-4 py-3 bg-white border border-blue-100 rounded-md focus:ring-2 focus:ring-saffron/20 focus:border-saffron outline-none transition-all text-sm leading-relaxed"
                            placeholder="Write a short description..."
                          />
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md shadow-sm border border-blue-100 overflow-hidden">
                        <div className="px-6 py-3 font-bold text-gray-900 bg-gray-50/50 border-b">Advanced SEO</div>
                        <div className="p-6 space-y-4">
                          <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700">SEO Title</label>
                            <input
                              {...register('seoTitle')}
                              className="w-full px-3 py-2 bg-white border border-blue-100 rounded-md outline-none text-sm focus:border-saffron focus:ring-1 focus:ring-saffron"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700">SEO Description</label>
                            <textarea
                              {...register('seoDescription')}
                              rows={3}
                              className="w-full px-3 py-2 bg-white border border-blue-100 rounded-md outline-none text-sm focus:border-saffron focus:ring-1 focus:ring-saffron"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT COLUMN: Settings & Metadata */}
                    <div className="space-y-6">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md shadow-sm border border-blue-100 p-6 space-y-5">
                        <h3 className="font-bold text-gray-900 border-b pb-3">Settings</h3>

                        <div className="space-y-1.5">
                          <label className="text-sm font-semibold text-gray-700">Status</label>
                          <Controller
                            name="status"
                            control={control}
                            defaultValue="ACTIVE"
                            render={({ field }) => (
                              <Select
                                value={field.value}
                                onChange={field.onChange}
                                options={[
                                  { label: 'Active', value: 'ACTIVE' },
                                  { label: 'Inactive', value: 'INACTIVE' }
                                ]}
                                searchable={false}
                              />
                            )}
                          />
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md shadow-sm border border-blue-100 p-6 space-y-5">
                        <h3 className="font-bold text-gray-900 border-b pb-3">Media</h3>
                        <div className="flex flex-col items-center gap-4">
                          <ImageUploadWithCrop
                            value={watch('photo')}
                            onChange={(val) => setValue('photo', val, { shouldValidate: true, shouldDirty: true })}
                            onRemove={() => setValue('photo', '', { shouldValidate: true, shouldDirty: true })}
                            aspectRatio={1}
                            shape="round"
                            className="w-48 h-48 rounded-full border-2 border-dashed border-gray-300 hover:border-saffron transition-colors mx-auto block"
                            placeholder="Upload"
                          />
                          <p className="text-xs text-gray-500 text-center mt-4">Click to upload a profile photo.</p>
                          <input type="hidden" {...register('photo')} />
                        </div>
                      </div>
                    </div>
                    <div className="h-2 col-span-1 lg:col-span-3"></div>
                  </div>
                </form>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
