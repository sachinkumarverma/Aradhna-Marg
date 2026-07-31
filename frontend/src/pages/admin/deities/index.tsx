import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SearchInput } from '@components/ui/SearchInput';
import { DeityApi } from '@features/deities/DeityApi';
import toast from 'react-hot-toast';
import { useForm, Controller } from 'react-hook-form';
import { Select } from '@components/ui/Select';
import { Button } from '@components/ui/Button';
import { 
  Plus, Edit2, Trash2, RefreshCw, Save, ArrowLeft, CheckCircle2, XCircle, Image as ImageIcon,
  Flame, Star, X, Sparkles
} from 'lucide-react';

export const AdminDeities = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form setup
  const { register, handleSubmit, reset, setValue, control, watch, formState: { isSubmitting, isValid } } = useForm({ mode: 'onChange' });

  // Fetch Deities
  const { data, isLoading } = useQuery({
    queryKey: ['admin-deities', page, search],
    queryFn: async () => {
      return await DeityApi.getDeities({ page, limit: 10, search: search || undefined });
    }
  });

  // Create / Update Mutation
  const saveMutation = useMutation({
    mutationFn: async (formData: any) => {
      if (editingId) {
        await DeityApi.updateDeity(editingId, formData);
      } else {
        await DeityApi.createDeity(formData);
      }
    },
    onSuccess: () => {
      toast.success(`Deity ${editingId ? 'updated' : 'created'} successfully`);
      queryClient.invalidateQueries({ queryKey: ['admin-deities'] });
      closeDrawer();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to save deity');
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await DeityApi.deleteDeity(id);
    },
    onSuccess: () => {
      toast.success('Deity deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-deities'] });
    },
    onError: () => toast.error('Failed to delete deity')
  });

  const openDrawer = (deity?: any) => {
    if (deity) {
      setEditingId(deity.id);
      Object.keys(deity).forEach(key => setValue(key, deity[key]));
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

  const deities = data?.data || [];
  const totalPages = Math.ceil((data?.meta?.total || 0) / 10);

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 uppercase">
            <Sparkles className="w-6 h-6 text-saffron" />
            DEITIES
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage deities, their profiles, and details.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => openDrawer()} variant="primary" leftIcon={<Plus className="w-4 h-4" />}>Create Deity</Button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-wrap gap-4 items-center justify-between">
        <SearchInput
          placeholder="Search deities..."
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
        ) : deities.length === 0 ? (
          <div className="border border-dashed border-gray-300 rounded-xl bg-gray-50 flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
              <Flame className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-900">No records found.</h3>
            <p className="text-xs text-gray-500 mt-1">Create your first deity.</p>
          </div>
        ) : (
        <div className="flex-1 bg-white rounded-t-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-100 uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-bold">Deity</th>
                  <th className="px-6 py-4 font-bold">Featured</th>
                  <th className="px-6 py-4 font-bold">Order</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                  <th className="px-6 py-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {deities.map((deity: any) => (
                  <tr key={deity.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {deity.image ? (
                          <img src={deity.image} alt={deity.name} className="w-20 h-10 rounded-lg object-cover border border-gray-200" />
                        ) : (
                          <div className="w-20 h-10 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
                            <Flame className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-900">{deity.name}</p>
                          <p className="text-xs text-gray-500">{deity.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {deity.featured ? (
                        <Star className="w-5 h-5 text-yellow-400 fill-current" />
                      ) : (
                        <Star className="w-5 h-5 text-gray-300" />
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {deity.displayOrder || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border
                        ${deity.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-700 border-gray-200'}
                      `}>
                        {deity.status === 'ACTIVE' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        {deity.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openDrawer(deity)} className="p-2 text-gray-400 hover:text-saffron hover:bg-saffron/10 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            if(window.confirm('Are you sure you want to delete this deity?')) {
                              deleteMutation.mutate(deity.id);
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
          
          <div className="relative w-full max-w-4xl bg-gray-50 h-full flex flex-col shadow-2xl animate-in slide-in-from-right">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
              <div className="flex items-center gap-4">
                <button 
                  onClick={closeDrawer}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingId ? 'Edit Deity' : 'Create Deity'}
                </h2>
              </div>
              <button
                type="submit"
                form="deity-form"
                disabled={saveMutation.isPending || !isValid}
                className="flex items-center gap-2 px-5 py-2 bg-saffron text-white rounded-lg hover:bg-saffron/90 transition-colors font-medium text-sm shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saveMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saveMutation.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <form id="deity-form" onSubmit={handleSubmit(onSubmit)} className="h-full">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                  
                  {/* LEFT COLUMN: Main Content */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-5">
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-800">Deity Name *</label>
                        <input 
                          {...register('name', { required: true })} 
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none text-gray-900 focus:bg-white focus:border-saffron focus:ring-2 focus:ring-saffron/20 transition-all" 
                          placeholder="e.g. Lord Shiva"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-800">Short Description</label>
                        <textarea 
                          {...register('shortDescription')} 
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

                  {/* RIGHT COLUMN: Metadata & Media */}
                  <div className="space-y-6">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-5">
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

                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700">Display Order</label>
                        <input 
                          type="number"
                          {...register('displayOrder')} 
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none text-sm focus:border-saffron focus:ring-1 focus:ring-saffron" 
                          placeholder="0"
                        />
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <input 
                          type="checkbox" 
                          id="featured"
                          {...register('featured')}
                          className="w-4 h-4 text-saffron rounded border-gray-300 focus:ring-saffron"
                        />
                        <label htmlFor="featured" className="text-sm font-medium text-gray-700 select-none cursor-pointer">
                          Featured Deity
                        </label>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-5">
                      <h3 className="font-bold text-gray-900 border-b pb-3">Media</h3>
                      <div className="flex flex-col items-center gap-4 w-full">
                        <div className="relative w-full">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            id="photo-upload"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setValue('image', reader.result as string, { shouldValidate: true });
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <label htmlFor="photo-upload" className="block relative w-full h-40 rounded-xl border-2 border-dashed border-gray-300 overflow-hidden hover:border-saffron transition-colors cursor-pointer group bg-gray-50">
                            {watch('image') ? (
                              <>
                                <img src={watch('image')} alt="Preview" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <ImageIcon className="w-8 h-8 text-white" />
                                </div>
                              </>
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 group-hover:text-saffron transition-colors">
                                <ImageIcon className="w-8 h-8 mb-2" />
                                <span className="text-xs font-medium">Upload</span>
                              </div>
                            )}
                          </label>
                          {watch('image') && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                setValue('image', '', { shouldValidate: true });
                              }}
                              className="absolute top-2 right-2 bg-white text-gray-600 hover:text-red-500 rounded-full p-1 shadow-sm border border-gray-200 transition-colors z-10"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 text-center">Click to upload deity image.</p>
                        <input type="hidden" {...register('image')} />
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
}
