import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SearchInput } from '@components/ui/SearchInput';
import { TagApi } from '@features/tags/TagApi';
import toast from 'react-hot-toast';
import { useForm, Controller } from 'react-hook-form';
import { Select } from '@components/ui/Select';
import { Button } from '@components/ui/Button';
import { 
  Tag as TagIcon, Plus, Edit2, Trash2, RefreshCw, Save, ArrowLeft, CheckCircle2, XCircle
} from 'lucide-react';

export function AdminTags() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form setup
  const { register, handleSubmit, reset, setValue, control, formState: { isSubmitting, isValid } } = useForm({ mode: 'onChange' });

  // Fetch Tags
  const { data, isLoading } = useQuery({
    queryKey: ['admin-tags', page, search],
    queryFn: async () => {
      return await TagApi.getTags({ page, limit: 10, search: search || undefined });
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
      toast.error(err.response?.data?.message || 'Failed to save tag');
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
      Object.keys(tag).forEach(key => setValue(key, tag[key]));
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

  const onSubmit = (data: any) => {
    saveMutation.mutate(data);
  };

  const tags = data?.data || [];
  const totalPages = Math.ceil((data?.meta?.total || 0) / 10);

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 uppercase">
            <TagIcon className="w-6 h-6 text-saffron" />
            TAGS
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage lightweight labels for content.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => openDrawer()} variant="primary" leftIcon={<Plus className="w-4 h-4" />}>Create Tag</Button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-wrap gap-4 items-center justify-between">
        <SearchInput
          placeholder="Search tags..."
          value={search}
          onChange={val => { setSearch(val); setPage(1); }}
        />
      </div>

      <div className="flex-1 min-h-[400px] relative flex flex-col">
        {/* Table Container */}
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
        ) : tags.length === 0 ? (
          <div className="border border-dashed border-gray-300 rounded-xl bg-gray-50 flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
              <TagIcon className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-900">No records found.</h3>
            <p className="text-xs text-gray-500 mt-1">Create your first tag.</p>
          </div>
        ) : (
        <div className="flex-1 bg-white rounded-t-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-100 uppercase text-xs tracking-wider">
              <tr>
                <th className="px-6 py-4 font-bold">Tag</th>
                <th className="px-6 py-4 font-bold">Color</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold">Created At</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tags.map((tag: any) => (
                <tr key={tag.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-900">{tag.name}</p>
                        {tag.description && <p className="text-xs text-gray-500 truncate max-w-[200px]">{tag.description}</p>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       {tag.color && (
                         <div className="w-6 h-6 rounded-full border border-gray-200" style={{ backgroundColor: tag.color }} />
                       )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border
                        ${tag.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-700 border-gray-200'}
                      `}>
                        {tag.status === 'ACTIVE' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        {tag.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(tag.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openDrawer(tag)} className="p-2 text-gray-400 hover:text-saffron hover:bg-saffron/10 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            if(window.confirm('Are you sure you want to delete this tag?')) {
                              deleteMutation.mutate(tag.id);
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
          <div className="relative w-full max-w-md bg-gray-50 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
              <div className="flex items-center gap-4">
                <button type="button" onClick={closeDrawer} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{editingId ? 'Edit Tag' : 'Create Tag'}</h1>
                </div>
              </div>
              <button
                type="submit"
                form="tag-form"
                disabled={saveMutation.isPending || !isValid}
                className="flex items-center gap-2 px-5 py-2 bg-saffron text-white rounded-lg hover:bg-saffron/90 transition-colors font-medium text-sm shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saveMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saveMutation.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <form id="tag-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-800">Tag Name *</label>
                    <input 
                      {...register('name', { required: true })} 
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-saffron/20 focus:border-saffron outline-none transition-all"
                      placeholder="e.g. Featured"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-800">Description</label>
                    <textarea 
                      {...register('description')} 
                      rows={3}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-saffron/20 focus:border-saffron outline-none transition-all text-sm leading-relaxed"
                      placeholder="Write a short description..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-800">Color</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="color"
                        {...register('color')} 
                        className="w-12 h-12 p-1 bg-white border border-gray-200 rounded-lg cursor-pointer"
                      />
                      <span className="text-sm text-gray-500">Pick a color for the tag badge</span>
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
