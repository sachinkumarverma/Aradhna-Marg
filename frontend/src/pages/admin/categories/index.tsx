import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SearchInput } from '@components/ui/SearchInput';
import { CategoryApi } from '@features/categories/CategoryApi';
import toast from 'react-hot-toast';
import { useForm, Controller } from 'react-hook-form';
import { Select } from '@components/ui/Select';
import { Button } from '@components/ui/Button';
import { 
  FolderTree, Plus, Edit2, Trash2, RefreshCw, X, Save, Image as ImageIcon,
  CheckCircle2, XCircle, ArrowLeft,
  Music, Heart, Star, Flame, Sun, Moon, Feather, Eye
} from 'lucide-react';

const IconMap: Record<string, any> = {
  FolderTree, Music, Heart, Star, Flame, Sun, Moon, Feather
};

export const AdminCategories = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form setup
  const { register, handleSubmit, reset, setValue, control, watch, formState: { errors, isSubmitting, isValid } } = useForm({ mode: 'onChange' });

  // Fetch Categories
  const { data, isLoading } = useQuery({
    queryKey: ['admin-categories', page, search],
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
      toast.error(err.response?.data?.message || 'Failed to save category');
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
      Object.keys(category).forEach(key => setValue(key, category[key]));
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

  const onSubmit = (data: any) => {
    if (data.displayOrder) data.displayOrder = parseInt(data.displayOrder, 10);
    saveMutation.mutate(data);
  };

  const categories = data?.data || [];
  const totalPages = Math.ceil((data?.meta?.total || 0) / 10);

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 uppercase">
            <FolderTree className="w-6 h-6 text-saffron" />
            CATEGORIES
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage content taxonomies and hierarchies.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => openDrawer()} variant="primary" leftIcon={<Plus className="w-4 h-4" />}>Create Category</Button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-wrap gap-4 items-center justify-between">
        <SearchInput
          placeholder="Search categories..."
          value={search}
          onChange={val => { setSearch(val); setPage(1); }}
        />
      </div>

      <div className="flex-1 min-h-[400px] relative">
        {isLoading ? (
          <div className="w-full overflow-x-auto bg-white rounded-xl border border-gray-200 shadow-sm animate-pulse">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {[1,2,3,4,5].map(i => <th key={i} className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></th>)}
                </tr>
              </thead>
              <tbody>
                {[1,2,3,4,5].map(row => (
                  <tr key={row} className="border-b border-gray-50">
                    {[1,2,3,4,5].map(col => <td key={col} className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-full"></div></td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : categories.length === 0 ? (
          <div className="border border-dashed border-gray-300 rounded-xl bg-gray-50 flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
              <FolderTree className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-900">No records found.</h3>
            <p className="text-xs text-gray-500 mt-1">Create your first category.</p>
          </div>
        ) : (
          <div className="flex-1 bg-white rounded-t-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 text-gray-500 border-b border-gray-100 uppercase text-xs tracking-wider">
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
                        <div className="w-10 h-10 rounded-lg bg-saffron/10 flex items-center justify-center border border-saffron/20">
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
                          {category.status === 'PUBLISHED' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
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
                          <button onClick={() => openDrawer(category)} className="p-2 text-gray-400 hover:text-saffron hover:bg-saffron/10 rounded-lg transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this category?')) {
                                deleteMutation.mutate(category.id);
                              }
                            }}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between py-3 bg-white px-4 rounded-b-xl border border-gray-200 border-t-0 -mt-6 z-10 relative shadow-sm">
          <span className="text-sm text-gray-500">
            Showing page <span className="font-bold text-gray-900">{page}</span> of <span className="font-bold text-gray-900">{totalPages}</span>
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Drawer */}
      {isDrawerOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={closeDrawer} />
          <div className="relative w-full max-w-4xl bg-gray-50 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
              <div className="flex items-center gap-4">
                <button type="button" onClick={closeDrawer} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <h1 className="text-xl font-bold text-gray-900">{editingId ? 'Edit Category' : 'Create Category'}</h1>
              </div>
              <button
                type="submit"
                form="category-form"
                disabled={saveMutation.isPending || !isValid}
                className="flex items-center gap-2 px-5 py-2 bg-saffron text-white rounded-lg hover:bg-saffron/90 transition-colors font-medium text-sm shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
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
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-5">
                      
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-800 block">Banner Image</label>
                        <div className="relative w-full">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            id="banner-upload"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setValue('imageUrl', reader.result as string, { shouldValidate: true });
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <div className="relative w-full h-40 rounded-xl border-2 border-dashed border-gray-300 overflow-hidden hover:border-saffron transition-colors group bg-gray-50">
                            {watch('imageUrl') ? (
                              <div className="w-full h-full relative">
                                <img src={watch('imageUrl')} alt="Banner Preview" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      const imgUrl = watch('imageUrl');
                                      if (imgUrl.startsWith('data:')) {
                                        const w = window.open('');
                                        if (w) w.document.write(`<img src="${imgUrl}" style="max-width: 100%; max-height: 100%; display: block; margin: auto;" />`);
                                      } else {
                                        window.open(imgUrl, '_blank');
                                      }
                                    }}
                                    title="Preview Image"
                                    className="p-3 bg-white/20 hover:bg-white/40 rounded-full backdrop-blur-sm transition-colors z-20 cursor-pointer"
                                  >
                                    <Eye className="w-8 h-8 text-white shadow-sm" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <label htmlFor="banner-upload" className="flex flex-col items-center justify-center w-full h-full cursor-pointer text-gray-400 group-hover:text-saffron transition-colors">
                                <ImageIcon className="w-8 h-8 mb-2" />
                                <span className="text-xs font-medium">Upload Banner</span>
                              </label>
                            )}
                          </div>
                          {watch('imageUrl') && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                setValue('imageUrl', '', { shouldValidate: true });
                              }}
                              className="absolute top-2 right-2 bg-white text-gray-600 hover:text-red-500 rounded-full p-1 shadow-sm border border-gray-200 transition-colors z-10"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <input type="hidden" {...register('imageUrl')} />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-800">Category Name *</label>
                        <input
                          {...register('name', { required: true })}
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none text-gray-900 focus:bg-white focus:border-saffron focus:ring-2 focus:ring-saffron/20 transition-all"
                          placeholder="e.g. Morning Bhajans"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-800">Description</label>
                        <textarea
                          {...register('description')}
                          rows={4}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg outline-none text-gray-900 focus:bg-white focus:border-saffron focus:ring-2 focus:ring-saffron/20 transition-all resize-y"
                          placeholder="Write a short description..."
                        />
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-5">
                      <h3 className="font-bold text-gray-900 border-b pb-3">Advanced SEO</h3>
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-sm font-semibold text-gray-700">SEO Title</label>
                          <input
                            {...register('seoTitle')}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none text-sm focus:border-saffron focus:ring-1 focus:ring-saffron"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-semibold text-gray-700">SEO Description</label>
                          <textarea
                            {...register('seoDescription')}
                            rows={3}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none text-sm focus:border-saffron focus:ring-1 focus:ring-saffron resize-y"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: Settings & Metadata */}
                  <div className="space-y-6">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-5">
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
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none text-sm focus:border-saffron focus:ring-1 focus:ring-saffron"
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

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-5">
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
