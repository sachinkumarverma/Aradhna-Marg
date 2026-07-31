import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Calendar } from 'lucide-react';
import { useNavigate, Outlet } from 'react-router-dom';
import { DataTable } from '@components/admin/DataTable';
import { Button } from '@components/ui/Button';
import { Select } from '@components/ui/Select';
import { SearchInput } from '@components/ui/SearchInput';
import { apiClient } from '@api/client'; 
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export const AdminFestivals: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sort, setSort] = useState('newest');

  // Fetch festivals
  const { data, isLoading } = useQuery({
    queryKey: ['admin-festivals', page, search, statusFilter, sort],
    queryFn: async () => {
      const res = await apiClient.get('/admin/festivals', {
        params: { page, limit: 10, search, status: statusFilter, sort }
      });
      return res.data;
    }
  });

  const bulkMutation = useMutation({
    mutationFn: async ({ ids, action }: { ids: string[], action: string }) => {
      await apiClient.post('/admin/festivals/bulk', { ids, action });
    },
    onSuccess: (_, variables) => {
      toast.success(`Successfully applied ${variables.action} to items`);
      queryClient.invalidateQueries({ queryKey: ['admin-festivals'] });
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
      header: 'Festival',
      accessor: (row: any) => (
        <div className="flex items-center gap-3">
          {row.bannerImage ? (
            <img src={row.bannerImage} alt="" className="w-12 h-8 object-cover rounded-md border border-gray-200" />
          ) : (
            <div className="w-12 h-8 bg-gray-100 rounded-md border border-gray-200 flex items-center justify-center text-gray-400 text-xs">No img</div>
          )}
          <div>
            <p className="font-bold text-gray-900 flex items-center gap-2">
              {row.name}
              {row.featured && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wider">Featured</span>}
            </p>
            <p className="text-xs text-gray-500 truncate max-w-[200px]">/{row.slug}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Date',
      accessor: (row: any) => <span className="text-sm text-gray-600">{row.festivalDate ? format(new Date(row.festivalDate), 'MMM dd, yyyy') : '-'}</span>
    },
    {
      header: 'Category',
      accessor: (row: any) => <span className="text-sm font-medium text-gray-600">{row.category || '-'}</span>
    },
    {
      header: 'Status',
      accessor: (row: any) => (
        <span className={`px-2 py-1 rounded-md text-xs font-medium border ${
          row.status === 'Published' ? 'bg-green-50 text-green-700 border-green-200' : 
          row.status === 'Draft' ? 'bg-amber-50 text-amber-700 border-amber-200' :
          'bg-gray-100 text-gray-700 border-gray-200'
        }`}>
          {row.status}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 uppercase">
            <Calendar className="w-6 h-6 text-saffron" />
            FESTIVALS
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage spiritual festivals, events, and their associated content.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => navigate('/admin/festivals/new')} variant="primary" leftIcon={<Plus className="w-4 h-4" />}>Add Festival</Button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-wrap gap-4 items-center justify-between">
        <SearchInput 
          placeholder="Search by name or slug..."
          value={search}
          onChange={setSearch}
        />
        <div className="flex items-center gap-3">
          <Select 
            value={statusFilter} 
            onChange={(val) => setStatusFilter(val)}
            options={[
              { label: 'All Statuses', value: '' },
              { label: 'Published', value: 'Published' },
              { label: 'Draft', value: 'Draft' },
              { label: 'Archived', value: 'Archived' }
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
              { label: 'Alphabetical', value: 'name' },
              { label: 'By Festival Date', value: 'festivalDate' }
            ]}
            className="w-40"
            searchable={false}
          />
        </div>
      </div>

      <div className="flex-1 min-h-[400px] relative">
        <DataTable 
          data={data?.data || []} 
          columns={columns} 
          isLoading={isLoading}
          onEdit={(row) => navigate(`/admin/festivals/${row.id}/edit`)}
          onDelete={(row) => handleBulkAction('DELETE', [row.id])}
          emptyIcon={Calendar}
          emptySubtext="Create your first festival."
        />
      </div>

      <div className="flex items-center justify-between py-3 bg-white px-4 rounded-b-xl border border-gray-200 border-t-0 -mt-6 z-10 relative shadow-sm">
        <span className="text-sm text-gray-500">
          Showing page <span className="font-bold text-gray-900">{data?.meta?.page || 1}</span> of <span className="font-bold text-gray-900">{Math.ceil((data?.meta?.total || 0) / (data?.meta?.limit || 10)) || 1}</span>
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
