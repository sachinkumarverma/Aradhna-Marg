import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SearchInput } from '@components/ui/SearchInput';
import { Pagination } from '@components/ui/Pagination';
import { CategoryApi } from '@features/categories/CategoryApi';
import toast from 'react-hot-toast';
import { isFormActuallyDirty } from '@utils/isFormActuallyDirty';
import { useForm, Controller } from 'react-hook-form';
import { Select } from '@components/ui/Select';
import { Button } from '@components/ui/Button';
import {
  FolderTree, Plus, Edit2, Trash2, RefreshCw, X, Save, Image as ImageIcon,
  CheckCircle2, XCircle, ArrowLeft,
  Music, Heart, Star, Flame, Sun, Moon, Feather, Eye
} from 'lucide-react';
import { ImageUploadWithCrop } from '@components/ui/ImageUploadWithCrop';

const IconMap: Record<string, any> = {
  FolderTree, Music, Heart, Star, Flame, Sun, Moon, Feather
};

export const AdminCategories = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form setup
  const { register, handleSubmit, reset, setValue, control, watch, setError, formState: { errors, isSubmitting, isValid, isDirty, defaultValues } } = useForm({ mode: 'onChange' });

  // Fetch Categories
  const { data, isLoading } = useQuery({
    queryKey: ['admin-categories', page, limit, search],
    queryFn: async () => {
      return await CategoryApi.getCategories({ page, limit: 10, search: search || undefined });
    }
  });

  // Create / Update Mutation
  const saveMutation = useMutation({
    mutationFn: async (formData: any) => {
      if (editingId) {
        await CategoryApi.updateCategory(editingId, formData);
      } else {
        await CategoryApi.createCategory(formData);
      }
    },
    onSuccess: () => {
      toast.success(`Category ${editingId ? 'updated' : 'created'} successfully`);
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      closeDrawer();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to save category';
      if (msg.toLowerCase().includes('already exists') || msg.toLowerCase().includes('duplicate')) {
        setError('name', { type: 'manual', message: 'This category name already exists.' });
      } else {
        toast.error(msg);
      }
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await CategoryApi.deleteCategory(id);
    },
    onSuccess: () => {
      toast.success('Category deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
    },
    onError: () => toast.error('Failed to delete category')
  });

  const openDrawer = (category?: any) => {
    if (category) {
      setEditingId(category.id);
      reset(category);
    } else {
      setEditingId(null);
      reset({});
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

  const onSubmit = (data: any) => {
    if (data.displayOrder) data.displayOrder = parseInt(data.displayOrder, 10);
    saveMutation.mutate(data);
  };

  const categories = data?.data || [];
  const totalPages = Math.ceil((data?.meta?.total || 0) / 10);

  return (
    <div className="space-y-6 flex flex-col min-h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-wide text-slate-900 flex items-center gap-2 uppercase">
            <FolderTree className="w-6 h-6 text-saffron" />
            CATEGORIES
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage content taxonomies and hierarchies.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => openDrawer()} variant="primary" leftIcon={<Plus className="w-4 h-4" />}>Create Category</Button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-md shadow-sm border border-blue-100 flex flex-wrap gap-4 items-center justify-between">
        <SearchInput
          placeholder="Search categories..."
          value={search}
          onChange={val => { setSearch(val); setPage(1); }}
        />
      </div>

      <div className="flex-1  relative">
        {isLoading ? (
          <div className="w-full overflow-x-auto bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md border border-blue-100 shadow-sm animate-pulse">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {[1, 2, 3, 4, 5].map(i => <th key={i} className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></th>)}
                </tr>
              </thead>
              <tbody>
                {[1,2,3,4,5,6,7,8,9,10].map(row => (
                  <tr key={row} className="border-b border-gray-50">
                    {[1, 2, 3, 4, 5].map(col => <td key={col} className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-full"></div></td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : categories.length === 0 ? (
          <div className="border border-dashed border-gray-300 rounded-md bg-gray-50 flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
              <FolderTree className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-900">No records found.</h3>
            <p className="text-xs text-gray-500 mt-1">Create your first category.</p>
          </div>
        ) : (
          <div className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-t-md border border-blue-100 shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-orange-50 text-orange-900 border-b border-orange-100 uppercase text-xs tracking-wider font-semibold">
                <tr>
                    <th className="px-6 py-4 font-bold">Category</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                    <th className="px-6 py-4 font-bold">Bhajans</th>
                    <th className="px-6 py-4 font-bold">Order</th>
                    <th className="px-6 py-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {categories.map((category: any) => (
                    <tr key={category.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-md bg-saffron/10 flex items-center justify-center border border-saffron/20">
                            {(() => {
                              const IconComponent = category.iconUrl && IconMap[category.iconUrl] ? IconMap[category.iconUrl] : FolderTree;
                              return <IconComponent className="w-5 h-5 text-saffron" />;
                            })()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{category.name}</p>
                            <p className="text-xs text-gray-500">/{category.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border
                        ${category.status === 'PUBLISHED' ? 'bg-green-50 text-green-700 border-green-200' :
                            category.status === 'DRAFT' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              'bg-gray-50 text-gray-700 border-gray-200'}
                      `}>
                          {category.status === 'PUBLISHED' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" strokeWidth={2.5} />}
                          {category.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-medium">
                        {category.bhajanCount}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {category.displayOrder}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openDrawer(category)} className="p-2 text-saffron hover:text-orange-600 hover:bg-saffron/10 rounded-md transition-colors">
                            <Edit2 className="w-4 h-4" strokeWidth={2.5} />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this category?')) {
                                deleteMutation.mutate(category.id);
                              }
                            }}
                            className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          >
                            <Trash2 className="w-4 h-4" strokeWidth={2.5} />
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
            onLimitChange={(l) => { setLimit(l); setPage(1); }} 
          />
        </div>
      )}
      </div>

      

      {/* Drawer */}
      {isDrawerOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={closeDrawer} />
          <div className="relative w-full max-w-4xl bg-gray-50 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-orange-100 border-b border-orange-200">
              <div className="flex items-center gap-4">
                <button type="button" onClick={closeDrawer} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <h1 className="text-xl font-bold tracking-wide text-slate-900 uppercase">{editingId ? 'Edit Category' : 'Create Category'}</h1>
              </div>
              <button
                type="submit"
                form="category-form"
                disabled={saveMutation.isPending || !isValid || (editingId ? !actuallyDirty : false)}
                className="flex items-center gap-2 px-5 py-2 bg-saffron text-white rounded-md hover:bg-saffron/90 transition-colors font-medium text-sm shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saveMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saveMutation.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <form id="category-form" onSubmit={handleSubmit(onSubmit)} className="h-full">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">

                  {/* LEFT COLUMN: Main Content */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md shadow-sm border border-blue-100 p-6 space-y-5">

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-800 block">Banner Image</label>
                        <div className="w-full flex flex-col">
                          <ImageUploadWithCrop
                            value={watch('imageUrl')}
                            onChange={(val) => setValue('imageUrl', val, { shouldValidate: true, shouldDirty: true })}
                            onRemove={() => setValue('imageUrl', '', { shouldValidate: true, shouldDirty: true })}
                            aspectRatio={16/9}
                            shape="rect"
                            className="w-full max-w-xl aspect-video rounded-md border-2 border-dashed border-gray-300 hover:border-saffron transition-colors"
                            placeholder="Upload 16:9 Banner"
                          />
                        </div>
                        <input type="hidden" {...register('imageUrl')} />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-800">Category Name *</label>
                        <input
                          {...register('name', { 
                            required: 'Category Name is required',
                            validate: (value) => {
                              const isDuplicate = data?.data?.some(
                                (t: any) => t.name.toLowerCase() === value.trim().toLowerCase() && t.id !== editingId
                              );
                              return isDuplicate ? 'This category name already exists.' : true;
                            }
                          })}
                          className={`w-full px-4 py-2.5 bg-gray-50 border rounded-md outline-none text-gray-900 focus:bg-white focus:border-saffron focus:ring-2 focus:ring-saffron/20 transition-all ${errors.name ? 'border-red-500' : 'border-blue-100'}`}
                          placeholder="e.g. Morning Bhajans"
                        />
                        {errors.name && <p className="text-red-500 text-xs font-medium mt-1.5 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" />{errors.name.message as string}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-800">Description</label>
                        <textarea
                          {...register('description')}
                          rows={4}
                          className="w-full px-4 py-3 bg-gray-50 border border-blue-100 rounded-md outline-none text-gray-900 focus:bg-white focus:border-saffron focus:ring-2 focus:ring-saffron/20 transition-all resize-y"
                          placeholder="Write a short description..."
                        />
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md shadow-sm border border-blue-100 p-6 space-y-5">
                      <h3 className="font-bold text-gray-900 border-b pb-3">Advanced SEO</h3>
                      <div className="space-y-4">
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
                            className="w-full px-3 py-2 bg-white border border-blue-100 rounded-md outline-none text-sm focus:border-saffron focus:ring-1 focus:ring-saffron resize-y"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: Settings & Metadata */}
                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md shadow-sm border border-blue-100 p-6 space-y-5">
                      <h3 className="font-bold text-gray-900 border-b pb-3">Visibility</h3>

                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700">Status</label>
                        <Controller
                          name="status"
                          control={control}
                          defaultValue="PUBLISHED"
                          render={({ field }) => (
                            <Select
                              value={field.value}
                              onChange={field.onChange}
                              options={[
                                { label: 'Published', value: 'PUBLISHED' },
                                { label: 'Draft', value: 'DRAFT' },
                                { label: 'Archived', value: 'ARCHIVED' }
                              ]}
                              searchable={false}
                            />
                          )}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700">Display Order</label>
                        <input
                          type="number"
                          {...register('displayOrder')}
                          className="w-full px-3 py-2 bg-white border border-blue-100 rounded-md outline-none text-sm focus:border-saffron focus:ring-1 focus:ring-saffron"
                          defaultValue={0}
                        />
                      </div>

                      <div className="space-y-3 pt-4 border-t border-gray-100">
                        <label className="flex items-start gap-3 cursor-pointer group">
                          <div className="flex items-center h-5 mt-0.5">
                            <input type="checkbox" {...register('showInNavigation')} className="w-4 h-4 text-saffron rounded border-gray-300 focus:ring-saffron cursor-pointer" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900 group-hover:text-saffron transition-colors">Show in Navigation</p>
                            <p className="text-xs text-gray-500">Display this category in the main menu</p>
                          </div>
                        </label>
                        <label className="flex items-start gap-3 cursor-pointer group">
                          <div className="flex items-center h-5 mt-0.5">
                            <input type="checkbox" {...register('isFeatured')} className="w-4 h-4 text-saffron rounded border-gray-300 focus:ring-saffron cursor-pointer" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900 group-hover:text-saffron transition-colors">Featured Category</p>
                            <p className="text-xs text-gray-500">Highlight this category on the homepage</p>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md shadow-sm border border-blue-100 p-6 space-y-5">
                      <h3 className="font-bold text-gray-900 border-b pb-3">Media</h3>
                      <div className="space-y-6">
                        <div className="space-y-1.5">
                          <label className="text-sm font-semibold text-gray-700 block">Category Icon</label>
                          <Controller
                            name="iconUrl"
                            control={control}
                            defaultValue="FolderTree"
                            render={({ field }) => (
                              <Select
                                value={field.value || 'FolderTree'}
                                onChange={field.onChange}
                                options={[
                                  { label: 'Folder', value: 'FolderTree', icon: <FolderTree /> },
                                  { label: 'Music', value: 'Music', icon: <Music /> },
                                  { label: 'Heart', value: 'Heart', icon: <Heart /> },
                                  { label: 'Star', value: 'Star', icon: <Star /> },
                                  { label: 'Flame', value: 'Flame', icon: <Flame /> },
                                  { label: 'Sun', value: 'Sun', icon: <Sun /> },
                                  { label: 'Moon', value: 'Moon', icon: <Moon /> },
                                  { label: 'Feather', value: 'Feather', icon: <Feather /> }
                                ]}
                                searchable={false}
                              />
                            )}
                          />
                        </div>
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
};
