import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Filter, Download, Trash2, Archive, CheckCircle, Music2 } from 'lucide-react';
import { useNavigate, Outlet } from 'react-router-dom';
import { DataTable } from '../../../components/admin/DataTable';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { SearchInput } from '../../../components/ui/SearchInput';
import { apiClient } from '../../../api/client';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export const AdminBhajans: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sort, setSort] = useState('newest');

  // Fetch bhajans
  const { data, isLoading } = useQuery({
    queryKey: ['admin-bhajans', page, search, statusFilter, sort],
    queryFn: async () => {
      const res = await apiClient.get('/admin/bhajans', {
        params: { page, limit: 10, search, status: statusFilter, sort }
      });
      return res.data;
    }
  });

  const bulkMutation = useMutation({
    mutationFn: async ({ ids, action }: { ids: string[], action: string }) => {
      await apiClient.post('/admin/bhajans/bulk', { ids, action });
    },
    onSuccess: (_, variables) => {
      toast.success(`Successfully applied ${variables.action} to items`);
      queryClient.invalidateQueries({ queryKey: ['admin-bhajans'] });
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

  const columns = [
    {
      header: 'Title',
      accessor: (row: any) => (
        <div>
          <p className="font-bold text-gray-900">{row.title}</p>
          <p className="text-xs text-gray-500 truncate max-w-[200px]">/{row.slug}</p>
        </div>
      )
    },
    {
      header: 'Category',
      accessor: (row: any) => <span className="text-sm font-medium text-gray-600">{row.categories?.name || '-'}</span>
    },
    {
      header: 'Deity',
      accessor: (row: any) => <span className="text-sm font-medium text-gray-600">{row.gods?.name || '-'}</span>
    },
    {
      header: 'Status',
      accessor: (row: any) => (
        <span className={`px-2 py-1 rounded-md text-xs font-medium border ${
          row.status === 'PUBLISHED' ? 'bg-green-50 text-green-700 border-green-200' : 
          row.status === 'DRAFT' ? 'bg-amber-50 text-amber-700 border-amber-200' :
          'bg-gray-100 text-gray-700 border-gray-200'
        }`}>
          {row.status}
        </span>
      )
    },
    {
      header: 'Views',
      accessor: (row: any) => <span className="text-sm text-gray-600">{row.views?.toLocaleString() || 0}</span>
    },
    {
      header: 'Created',
      accessor: (row: any) => <span className="text-sm text-gray-500">{format(new Date(row.created_at), 'MMM dd, yyyy')}</span>
    }
  ];

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 uppercase">
            <Music2 className="w-6 h-6 text-saffron" />
            BHAJANS
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage and supervise all imported and generated content.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => navigate('/admin/bhajans/new')} variant="primary" leftIcon={<Plus className="w-4 h-4" />}>Create Bhajan</Button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-wrap gap-4 items-center justify-between">
        <SearchInput 
          placeholder="Search by title, slug, lyrics..."
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
              { label: 'Alphabetical A-Z', value: 'alphabetical' },
              { label: 'Most Views', value: 'views' }
            ]}
            className="w-40"
            searchable={false}
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 relative">
        <DataTable 
          data={data?.data || []} 
          columns={columns} 
          isLoading={isLoading}
          onEdit={(row) => navigate(`/admin/bhajans/${row.id}/edit`)}
          onDelete={(row) => handleBulkAction('DELETE', [row.id])}
          emptyIcon={Music2}
          emptySubtext="Create your first bhajan."
        />
      </div>

      <div className="flex items-center justify-between py-2 bg-white px-4 rounded-b-xl border-t border-gray-100">
        <span className="text-sm text-gray-500">
          Showing page <span className="font-bold text-gray-900">{data?.meta?.page || 1}</span> of <span className="font-bold text-gray-900">{Math.ceil((data?.meta?.total || 0) / (data?.meta?.limit || 10))}</span>
        </span>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            Previous
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            disabled={!data?.meta || page >= Math.ceil(data.meta.total / data.meta.limit)}
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      <Outlet />
    </div>
  );
};
