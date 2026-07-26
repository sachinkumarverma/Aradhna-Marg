import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../api/client';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { 
  FolderTree, Plus, Search, Edit2, Trash2, 
  MoreVertical, RefreshCw, X, Save, Image as ImageIcon,
  CheckCircle2, XCircle
} from 'lucide-react';

export const AdminCategories = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form setup
  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm();

  // Fetch Categories
  const { data, isLoading } = useQuery({
    queryKey: ['admin-categories', page, search],
    queryFn: async () => {
      const res = await apiClient.get('/admin/categories', {
        params: { page, limit: 10, search: search || undefined }
      });
      return res.data;
    }
  });

  // Create / Update Mutation
  const saveMutation = useMutation({
    mutationFn: async (formData: any) => {
      if (editingId) {
        await apiClient.put(`/admin/categories/${editingId}`, formData);
      } else {
        await apiClient.post('/admin/categories', formData);
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
      await apiClient.delete(`/admin/categories/${id}`);
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
    // Convert string to number if needed
    if (data.displayOrder) data.displayOrder = parseInt(data.displayOrder, 10);
    saveMutation.mutate(data);
  };

  const categories = data?.data || [];
  const totalPages = Math.ceil((data?.meta?.total || 0) / 10);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FolderTree className="w-6 h-6 text-saffron" /> Categories
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage content taxonomies and hierarchies.</p>
        </div>
        <button
          onClick={() => openDrawer()}
          className="flex items-center gap-2 px-4 py-2.5 bg-saffron text-white rounded-lg font-medium hover:bg-saffron/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> Create Category
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-4 items-center justify-between bg-gray-50/50">
          <div className="relative w-full max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search categories..." 
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-saffron/20 outline-none"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-600">Category</th>
                <th className="px-6 py-4 font-semibold text-gray-600">Status</th>
                <th className="px-6 py-4 font-semibold text-gray-600">Bhajans</th>
                <th className="px-6 py-4 font-semibold text-gray-600">Order</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 animate-pulse">Loading categories...</td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
                      <FolderTree className="w-6 h-6 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No categories found</h3>
                    <p className="text-gray-500 mt-1">Create your first category to organize content.</p>
                  </td>
                </tr>
              ) : (
                categories.map((category: any) => (
                  <tr key={category.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {category.iconUrl ? (
                          <img src={category.iconUrl} alt="" className="w-10 h-10 rounded-lg object-cover bg-gray-100" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                            <ImageIcon className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
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
                            if(window.confirm('Are you sure you want to delete this category?')) {
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
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
            <span className="text-sm text-gray-600">
              Showing page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages}</span>
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 border rounded-lg text-sm font-medium hover:bg-gray-100 disabled:opacity-50"
              >
                Previous
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 border rounded-lg text-sm font-medium hover:bg-gray-100 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={closeDrawer} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">{editingId ? 'Edit Category' : 'New Category'}</h2>
              <button onClick={closeDrawer} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <form id="category-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Category Name *</label>
                  <input 
                    {...register('name', { required: true })} 
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-saffron/20 outline-none"
                    placeholder="e.g. Morning Bhajans"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">URL Slug</label>
                  <input 
                    {...register('slug')} 
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-saffron/20 outline-none font-mono text-sm"
                    placeholder="Auto-generated if left empty"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <textarea 
                    {...register('description')} 
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-saffron/20 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <select {...register('status')} className="w-full px-3 py-2 border rounded-lg bg-white outline-none">
                      <option value="PUBLISHED">Published</option>
                      <option value="DRAFT">Draft</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Display Order</label>
                    <input 
                      type="number"
                      {...register('displayOrder')} 
                      className="w-full px-3 py-2 border rounded-lg outline-none"
                      defaultValue={0}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Media (Optional)</h3>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Icon URL</label>
                      <input {...register('iconUrl')} className="w-full px-3 py-2 border rounded-lg outline-none text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Banner Image URL</label>
                      <input {...register('imageUrl')} className="w-full px-3 py-2 border rounded-lg outline-none text-sm" />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">SEO (Optional)</h3>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Meta Title</label>
                      <input {...register('seoTitle')} className="w-full px-3 py-2 border rounded-lg outline-none text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Meta Description</label>
                      <textarea {...register('seoDescription')} rows={2} className="w-full px-3 py-2 border rounded-lg outline-none text-sm" />
                    </div>
                  </div>
                </div>

              </form>
            </div>

            <div className="p-6 border-t bg-gray-50 flex gap-3">
              <button 
                type="button"
                onClick={closeDrawer}
                className="flex-1 px-4 py-2 border border-gray-200 bg-white rounded-lg font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                type="submit"
                form="category-form"
                disabled={saveMutation.isPending}
                className="flex-1 px-4 py-2 bg-saffron text-white rounded-lg font-medium hover:bg-saffron/90 flex items-center justify-center gap-2"
              >
                {saveMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
