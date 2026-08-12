import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Calendar, CheckCircle2, XCircle } from 'lucide-react';
import { useNavigate, Outlet } from 'react-router-dom';
import { DataTable } from '@components/admin/DataTable';
import { Button } from '@components/ui/Button';
import { Select } from '@components/ui/Select';
import { SearchInput } from '@components/ui/SearchInput';
import { Pagination } from '@components/ui/Pagination';
import { apiClient } from '@api/client';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export const AdminFestivals: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
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
    mutationFn: async ({ ids, action }: { ids: string[]; action: string }) => {
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

  const totalPages = Math.ceil((data?.meta?.total || 0) / (limit || 10));

  const columns = [
    {
      header: 'Festival',
      accessor: (row: any) => (
        <div className="flex items-center gap-3">
          {row.bannerImage ? (
            <img
              src={row.bannerImage}
              alt=""
              className="w-12 h-12 object-cover rounded-md border border-gray-200 shrink-0"
            />
          ) : (
            <div className="w-12 h-12 bg-gray-100 rounded-md border border-gray-200 flex items-center justify-center text-gray-400 text-xs shrink-0">
              No img
            </div>
          )}
          <div>
            <p className="font-bold text-gray-900 flex items-center gap-2">{row.name}</p>
            <p className="text-xs text-gray-500 truncate max-w-[200px]">{row.description}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Date',
      accessor: (row: any) => (
        <span className="text-sm text-slate-800 font-medium">
          {row.festivalDate ? format(new Date(row.festivalDate), 'MMM dd, yyyy') : '-'}
        </span>
      )
    },
    {
      header: 'Category',
      accessor: (row: any) => <span className="text-sm font-medium text-gray-600">{row.category || '-'}</span>
    },
    {
      header: 'Featured',
      className: 'text-center',
      accessor: (row: any) => (
        <div className="flex justify-center">
          {row.featured ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="#FBBF24"
              className="w-5 h-5 text-amber-400"
            >
              <path
                fillRule="evenodd"
                d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5 text-gray-300"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
              />
            </svg>
          )}
        </div>
      )
    },
    {
      header: 'Status',
      className: 'text-center',
      accessor: (row: any) => (
        <span
          className={`inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
            row.status === 'Published'
              ? 'bg-green-600 text-white'
              : row.status === 'Draft'
                ? 'bg-amber-600 text-white'
                : 'bg-gray-500 text-white'
          }`}
        >
          {row.status === 'Published' ? (
            <CheckCircle2 className="w-3 h-3" />
          ) : (
            <XCircle className="w-3 h-3" strokeWidth={2.5} />
          )}
          {row.status}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6 flex flex-col min-h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-wide text-slate-900 flex items-center gap-2 uppercase">
            <Calendar className="w-6 h-6 text-saffron" />
            FESTIVALS
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage spiritual festivals, events, and their associated content.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate('/admin/festivals/new')}
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Festival
          </Button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-md shadow-sm border border-blue-100 flex flex-wrap gap-4 items-center justify-between">
        <SearchInput placeholder="Search by name or slug..." value={search} onChange={setSearch} />
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

      <div className="flex-1  relative">
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

      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-x border-b border-blue-100 rounded-b-md -mt-2 overflow-hidden relative z-10">
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

      <Outlet />
    </div>
  );
};
