import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SearchInput } from '@components/ui/SearchInput';
import { Pagination } from '@components/ui/Pagination';
import { TagApi } from '@features/tags/TagApi';
import toast from 'react-hot-toast';
import { isFormActuallyDirty } from '@utils/isFormActuallyDirty';
import { useForm, Controller } from 'react-hook-form';
import { Select } from '@components/ui/Select';
import { Button } from '@components/ui/Button';
import {
  Tag as TagIcon,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Save,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  ArrowUpDown
} from 'lucide-react';

export function AdminTags() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sort, setSort] = useState('created_at');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    setError,
    formState: { isSubmitting, isValid, isDirty, errors, defaultValues }
  } = useForm({ mode: 'onChange' });

  // Fetch Tags
  const { data, isLoading } = useQuery({
    queryKey: ['admin-tags', page, limit, search, sort, order],
    queryFn: async () => {
      return await TagApi.getTags({ page, limit, search: search || undefined, sort, order });
    }
  });

  // Create / Update Mutation
  const saveMutation = useMutation({
    mutationFn: async (formData: any) => {
      if (editingId) {
        await TagApi.updateTag(editingId, formData);
      } else {
        await TagApi.createTag(formData);
      }
    },
    onSuccess: () => {
      toast.success(`Tag ${editingId ? 'updated' : 'created'} successfully`);
      queryClient.invalidateQueries({ queryKey: ['admin-tags'] });
      closeDrawer();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to save tag';
      if (msg.toLowerCase().includes('already exists') || msg.toLowerCase().includes('duplicate')) {
        setError('name', { type: 'manual', message: 'This tag name already exists.' });
      } else {
        toast.error(msg);
      }
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await TagApi.deleteTag(id);
    },
    onSuccess: () => {
      toast.success('Tag deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-tags'] });
    },
    onError: () => toast.error('Failed to delete tag')
  });

  const openDrawer = (tag?: any) => {
    if (tag) {
      setEditingId(tag.id);
      reset(tag);
    } else {
      setEditingId(null);
      reset({ status: 'ACTIVE', color: '#EAB308' }); // default color
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

  const onSubmit = (formData: any) => {
    saveMutation.mutate(formData);
  };

  const tags = data?.data || [];
  const totalRecords = data?.meta?.total || 0;
  const totalPages = Math.ceil(totalRecords / limit);

  const currentColor = watch('color') || '';
  const isValidColor = (str: string) => {
    const s = new Option().style;
    s.color = str;
    return s.color !== '';
  };
  const previewColor = isValidColor(currentColor) ? currentColor : '#FFFFFF';

  return (
    <div className="space-y-4 flex flex-col min-h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-wide text-slate-900 flex items-center gap-2 uppercase">
            <TagIcon className="w-6 h-6 text-saffron" />
            TAGS
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage lightweight labels for content.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => openDrawer()} variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
            Create Tag
          </Button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-md shadow-sm border border-blue-100 flex flex-wrap gap-4 items-center justify-between">
        <SearchInput
          placeholder="Search tags..."
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
        />
      </div>

      <div className="flex-1  relative flex flex-col">
        {/* Table Container */}
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
        ) : tags.length === 0 ? (
          <div className="border border-dashed border-gray-300 rounded-md bg-gray-50 flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
              <TagIcon className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-900">No records found.</h3>
            <p className="text-xs text-gray-500 mt-1">Create your first tag.</p>
          </div>
        ) : (
          <div className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md border border-blue-100 shadow-sm overflow-hidden flex flex-col mb-6">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-orange-50 text-orange-900 border-b border-orange-100 uppercase text-xs tracking-wider font-semibold">
                  <tr>
                    <th className="px-6 py-4 font-bold">Tag</th>
                    <th className="px-6 py-4 font-bold text-center">Color</th>
                    <th className="px-6 py-4 font-bold text-center">Status</th>
                    <th
                      className="px-6 py-4 font-bold cursor-pointer group hover:bg-orange-100/50 transition-colors"
                      onClick={() => {
                        if (sort === 'created_at') {
                          setOrder(order === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSort('created_at');
                          setOrder('desc');
                        }
                      }}
                    >
                      <div className="flex items-center gap-1">
                        Created At
                        <ArrowUpDown
                          className={`w-3 h-3 transition-colors ${sort === 'created_at' ? 'text-orange-900' : 'text-orange-300 group-hover:text-orange-400'}`}
                        />
                      </div>
                    </th>
                    <th className="px-6 py-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tags.map((tag: any) => (
                    <tr key={tag.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-3">
                        <div>
                          <p className="font-semibold text-gray-900">{tag.name}</p>
                          {tag.description && (
                            <p className="text-xs text-gray-500 truncate max-w-[200px]">{tag.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        {tag.color && (
                          <div
                            className="w-5 h-5 rounded-full border border-gray-200 mx-auto"
                            style={{ backgroundColor: tag.color }}
                          />
                        )}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider text-white
                        ${tag.status === 'ACTIVE' ? 'bg-green-600' : 'bg-red-600'}
                      `}
                        >
                          {tag.status === 'ACTIVE' ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5" strokeWidth={2.5} />
                          )}
                          {tag.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-slate-800 font-medium">
                        {new Date(tag.createdAt)
                          .toLocaleString('en-GB', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                          .replace(',', '')}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end">
                          <button
                            onClick={() => openDrawer(tag)}
                            className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                          >
                            <Edit2 className="w-4 h-4" strokeWidth={3.5} />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this tag?')) {
                                deleteMutation.mutate(tag.id);
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
              totalRecords={totalRecords}
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
            <div className="relative w-full max-w-md bg-gray-50 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
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
                      {editingId ? 'Edit Tag' : 'Create Tag'}
                    </h1>
                  </div>
                </div>
                <button
                  type="submit"
                  form="tag-form"
                  disabled={saveMutation.isPending || !isValid || (editingId ? !actuallyDirty : false)}
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
                <form id="tag-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md shadow-sm border border-blue-100 p-6 space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-800">Tag Name *</label>
                      <input
                        {...register('name', {
                          required: 'Tag Name is required',
                          validate: (value) => {
                            const isDuplicate = data?.data?.some(
                              (t: any) => t.name.toLowerCase() === value.trim().toLowerCase() && t.id !== editingId
                            );
                            return isDuplicate ? 'This tag name already exists.' : true;
                          }
                        })}
                        className={`w-full px-4 py-2.5 bg-white border rounded-md focus:ring-2 focus:ring-saffron/20 focus:border-saffron outline-none transition-all ${errors.name ? 'border-red-500' : 'border-blue-100'}`}
                        placeholder="e.g. Featured"
                      />
                      {errors.name && (
                        <p className="text-red-500 text-xs font-medium mt-1.5 flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" />
                          {errors.name.message as string}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-800">Description</label>
                      <textarea
                        {...register('description')}
                        rows={3}
                        className="w-full px-4 py-3 bg-white border border-blue-100 rounded-md focus:ring-2 focus:ring-saffron/20 focus:border-saffron outline-none transition-all text-sm leading-relaxed"
                        placeholder="Write a short description..."
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-800">Color</label>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 border border-gray-200 rounded-md flex-shrink-0"
                          style={{ backgroundColor: previewColor }}
                        />
                        <input
                          type="text"
                          {...register('color')}
                          placeholder="#HEX or Color Name"
                          className="w-full px-4 py-2 bg-white border border-blue-100 rounded-md focus:ring-2 focus:ring-saffron/20 focus:border-saffron outline-none transition-all"
                        />
                      </div>
                    </div>

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
                </form>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
