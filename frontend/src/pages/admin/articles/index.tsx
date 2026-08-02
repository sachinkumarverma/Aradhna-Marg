import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, FileText } from 'lucide-react';
import { useNavigate, Outlet } from 'react-router-dom';
import { DataTable } from '@components/admin/DataTable';
import { Button } from '@components/ui/Button';
import { Select } from '@components/ui/Select';
import { SearchInput } from '@components/ui/SearchInput';
import { Pagination } from '@components/ui/Pagination';
import { apiClient } from '@api/client';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export const AdminArticles: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sort, setSort] = useState('newest');

  // Fetch articles
  const { data, isLoading } = useQuery({
    queryKey: ['admin-articles', page, search, statusFilter, sort],
    queryFn: async () => {
      const res = await apiClient.get('/admin/articles', {
        params: { page, limit: 10, search, status: statusFilter, sort }
      });
      return res.data;
    }
  });

  const bulkMutation = useMutation({
    mutationFn: async ({ ids, action }: { ids: string[], action: string }) => {
      await apiClient.post('/admin/articles/bulk', { ids, action });
    },
    onSuccess: (_, variables) => {
      toast.success(`Successfully applied ${variables.action} to items`);
      queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
    },
    onError: () => {
      toast.error('Failed to perform bulk action');
    }
  });

  const handleBulkAction = (action: string, selectedIds: string[]) => {
    if (selectedIds.length === 0) return toast.error('No items selected');
    if (window.confirm(`Are you sure you want to ${action} ${selectedIds.length} items?`)) {
      bulkMutation.mutate({ ids: selectedIds, action });
    }
  };

  const totalPages = Math.ceil((data?.meta?.total || 0) / (limit || 10));

  const columns = [
    {
      header: 'Title',
      accessor: (row: any) => (
        <div className="flex items-center gap-3">
          {row.media_files?.url ? (
            <img src={row.media_files.url} alt="" className="w-10 h-10 object-cover rounded-md border border-gray-200" />
          ) : (
            <div className="w-10 h-10 bg-gray-100 rounded-md border border-gray-200 flex items-center justify-center text-gray-400 text-xs">No img</div>
          )}
          <div>
            <p className="font-bold text-gray-900 flex items-center gap-2">
              {row.title}
              {row.featured && <span className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Featured</span>}
            </p>
            <p className="text-xs text-gray-500 truncate max-w-[200px]">/{row.slug}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Category',
      accessor: (row: any) => <span className="text-sm font-medium text-gray-600">{row.categories?.name || '-'}</span>
    },
    {
      header: 'Author',
      accessor: (row: any) => <span className="text-sm font-medium text-gray-600">{row.authors?.name || '-'}</span>
    },
    {
      header: 'Status',
      accessor: (row: any) => (
        <span className={`px-2 py-1 rounded-md text-xs font-medium border ${row.status === 'PUBLISHED' ? 'bg-green-50 text-green-700 border-green-200' :
            row.status === 'DRAFT' ? 'bg-amber-50 text-amber-700 border-amber-200' :
              'bg-gray-100 text-gray-700 border-gray-200'
          }`}>
          {row.status}
        </span>
      )
    },
    {
      header: 'Views',
      accessor: (row: any) => <span className="text-sm text-gray-600">{row.view_count?.toLocaleString() || 0}</span>
    },
    {
      header: 'Published',
      accessor: (row: any) => <span className="text-sm text-slate-800 font-medium">{row.publish_date ? format(new Date(row.publish_date), 'MMM dd, yyyy') : '-'}</span>
    }
  ];

  return (
    <div className="space-y-6 flex flex-col min-h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-wide text-slate-900 flex items-center gap-2 uppercase">
            <FileText className="w-6 h-6 text-saffron" />
            ARTICLES
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage spiritual knowledge, stories, and lifestyle articles.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => navigate('/admin/articles/new')} variant="primary" leftIcon={<Plus className="w-4 h-4" />}>Create Article</Button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-md shadow-sm border border-blue-100 flex flex-wrap gap-4 items-center justify-between">
        <SearchInput
          placeholder="Search articles..."
          value={search}
          onChange={setSearch}
        />
        <div className="flex items-center gap-3">
          <Select
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            options={[
              { label: 'All Statuses', value: '' },
              { label: 'Published', value: 'PUBLISHED' },
              { label: 'Draft', value: 'DRAFT' },
              { label: 'Archived', value: 'ARCHIVED' }
            ]}
            className="w-40"
            searchable={false}
          />
          <Select
            value={sort}
            onChange={(val) => setSort(val)}
            options={[
              { label: 'Newest First', value: 'newest' },
              { label: 'Oldest First', value: 'oldest' },
              { label: 'Most Views', value: 'views' }
            ]}
            className="w-40"
            searchable={false}
          />
        </div>
      </div>

      <div className="flex-1  relative">
        <DataTable
          data={data?.data || []}
          columns={columns}
          isLoading={isLoading}
          onEdit={(row) => navigate(`/admin/articles/${row.id}/edit`)}
          onDelete={(row) => handleBulkAction('DELETE', [row.id])}
          emptyIcon={FileText}
          emptySubtext="Create your first article."
        />
      </div>

      
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-x border-b border-blue-100 rounded-b-md -mt-2 overflow-hidden relative z-10">
        <Pagination 
          page={page} 
          totalPages={totalPages} 
          totalRecords={data?.meta?.total || 0} 
          limit={limit} 
          onPageChange={setPage} 
          onLimitChange={(l) => { setLimit(l); setPage(1); }} 
        />
      </div>
    

      <Outlet />
    </div>
  );
};
