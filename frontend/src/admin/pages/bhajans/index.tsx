import React, { useState, useEffect } from 'react';
import { ConfirmDialog } from '@components/ui/ConfirmDialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Music2, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { useNavigate, useSearchParams, Outlet } from 'react-router-dom';
import { DataTable } from '@admin/components/DataTable';
import { AdminButton } from '@admin/components/AdminButton';
import { Select } from '@components/ui/Select';
import { SearchInput } from '@components/ui/SearchInput';
import { Pagination } from '@components/ui/Pagination';
import { BhajanApi } from '@admin/features/bhajans/BhajanApi';
import { format } from 'date-fns';
import { getAdminPath } from '@utils/host';
import toast from 'react-hot-toast';

export const AdminBhajans: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean; action: string; ids: string[] }>({
    isOpen: false,
    action: '',
    ids: []
  });
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') || '');
  const [sort, setSort] = useState(() => searchParams.get('sort') || 'newest');

  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam !== null) {
      setStatusFilter(statusParam);
    }
    const sortParam = searchParams.get('sort');
    if (sortParam !== null) {
      setSort(sortParam);
    }
  }, [searchParams]);

  // Fetch bhajans
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-bhajans', page, limit, search, statusFilter, sort],
    queryFn: async () => {
      const res = await BhajanApi.getList({
        page,
        limit,
        search: search || undefined,
        status: statusFilter || undefined,
        sort: sort || undefined
      });
      return res;
    }
  });

  const bulkMutation = useMutation({
    mutationFn: async ({ ids, action }: { ids: string[]; action: 'PUBLISH' | 'DRAFT' | 'ARCHIVE' | 'DELETE' }) => {
      await BhajanApi.bulkAction(ids, action);
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
    setConfirmConfig({ isOpen: true, action, ids: selectedIds });
  };

  const totalPages = Math.ceil((data?.meta?.total || 0) / (limit || 10));

  const columns = [
    {
      header: 'Title',
      sortKey: (row: any) => row.hindi_title || row.title || row.english_title || '',
      accessor: (row: any) => {
        const primaryTitle = row.hindi_title || row.title;
        const secondaryTitle =
          row.english_title ||
          row.title_en ||
          (row.hindi_title && row.title && row.title !== row.hindi_title ? row.title : null);

        return (
          <div className="flex flex-col gap-0.5">
            <p className="font-bold text-gray-900 line-clamp-2 leading-snug">{primaryTitle}</p>
            {secondaryTitle && <p className="text-xs text-gray-500 font-normal line-clamp-1">{secondaryTitle}</p>}
          </div>
        );
      }
    },
    {
      header: 'Category',
      sortKey: (row: any) => row.categories?.name || '',
      accessor: (row: any) => <span className="text-sm font-medium text-gray-600">{row.categories?.name || '-'}</span>
    },
    {
      header: 'Deity',
      sortKey: (row: any) => row.gods?.name || '',
      accessor: (row: any) => <span className="text-sm font-medium text-gray-600">{row.gods?.name || '-'}</span>
    },
    {
      header: 'Status',
      sortKey: 'status',
      className: 'text-center w-32',
      accessor: (row: any) => (
        <span
          className={`inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
            row.status === 'PUBLISHED'
              ? 'bg-green-600 text-white'
              : row.status === 'DRAFT'
                ? 'bg-amber-600 text-white'
                : 'bg-gray-500 text-white'
          }`}
        >
          {row.status === 'PUBLISHED' ? (
            <CheckCircle2 className="w-3 h-3" />
          ) : (
            <XCircle className="w-3 h-3" strokeWidth={2.5} />
          )}
          {row.status}
        </span>
      )
    },
    {
      header: 'Views',
      sortKey: (row: any) => row.views || 0,
      className: 'text-center w-24',
      accessor: (row: any) => (
        <div className="text-sm text-gray-600 justify-center flex">{row.views?.toLocaleString() || 0}</div>
      )
    },
    {
      header: 'Created',
      sortKey: 'created_at',
      accessor: (row: any) => (
        <span className="text-sm text-slate-800 font-medium">{format(new Date(row.created_at), 'MMM dd, yyyy')}</span>
      )
    }
  ];

  return (
    <div className="space-y-6 flex flex-col min-h-full">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-2xl font-bold tracking-wide text-slate-900 flex items-center gap-2 uppercase truncate">
            <Music2 className="w-5 h-5 sm:w-6 sm:h-6 text-saffron shrink-0" />
            <span className="truncate">BHAJANS</span>
          </h1>
          <p className="hidden sm:block text-sm text-gray-500 mt-1">
            Manage and supervise all imported and generated content.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <AdminButton
            onClick={() => refetch()}
            variant="outline"
            title="Refresh"
            aria-label="Refresh"
            disabled={isFetching}
            className="h-8 w-8 sm:h-9 sm:w-9 p-0 flex items-center justify-center shrink-0 bg-white hover:bg-slate-50 border-gray-200 text-slate-700"
          >
            <RefreshCw
              className={`w-4 h-4 shrink-0 stroke-[2.2] ${isFetching ? 'animate-spin text-saffron' : 'text-slate-600'}`}
            />
          </AdminButton>
          <AdminButton
            onClick={() => navigate(getAdminPath('/bhajans/new'))}
            variant="primary"
            title="Create Bhajan"
            aria-label="Create Bhajan"
            className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3.5 gap-0 shrink-0"
          >
            <Plus className="w-4 h-4 shrink-0 stroke-[2.8]" strokeWidth={2.8} />
            <span className="hidden sm:inline ml-1.5 text-sm font-semibold">Create Bhajan</span>
          </AdminButton>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-md shadow-sm border border-blue-100 flex flex-wrap gap-4 items-center justify-between">
        <div className="grid grid-cols-2 sm:flex sm:flex-row flex-wrap items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          <Select
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            options={[
              { label: 'All Statuses', value: '' },
              { label: 'Published', value: 'PUBLISHED' },
              { label: 'Draft', value: 'DRAFT' },
              { label: 'Archived', value: 'ARCHIVED' }
            ]}
            className="w-full sm:w-40"
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
            className="w-full sm:w-40"
            searchable={false}
          />
        </div>
        <SearchInput placeholder="Search bhajan..." value={search} onChange={setSearch} />
      </div>

      <div className="flex-1 min-h-0 relative">
        <DataTable
          data={data?.data || []}
          columns={columns}
          isLoading={isLoading || isFetching}
          skeletonRows={limit}
          onEdit={(row) => navigate(getAdminPath(`/bhajans/${row.id}/edit`))}
          onDelete={(row) => handleBulkAction('DELETE', [row.id])}
          emptyIcon={Music2}
          emptySubtext="Create your first bhajan."
        />
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-x border-b border-blue-100 rounded-b-md -mt-2 relative z-20">
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
      <ConfirmDialog
        isOpen={confirmConfig.isOpen}
        title="Confirm Action"
        message={`Are you sure you want to ${confirmConfig.action} ${confirmConfig.ids.length} items?`}
        confirmText={confirmConfig.action === 'DELETE' ? 'Delete' : 'Confirm'}
        isDestructive={confirmConfig.action === 'DELETE'}
        onCancel={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        onConfirm={() => {
          bulkMutation.mutate({ ids: confirmConfig.ids, action: confirmConfig.action as any });
          setConfirmConfig({ ...confirmConfig, isOpen: false });
        }}
      />
    </div>
  );
};
