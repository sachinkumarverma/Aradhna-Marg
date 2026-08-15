import React, { useState } from 'react';
import { ConfirmDialog } from '@components/ui/ConfirmDialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, BookOpen, CheckCircle2, XCircle } from 'lucide-react';
import { useNavigate, Outlet } from 'react-router-dom';
import { DataTable } from '@components/admin/DataTable';
import { Button } from '@components/ui/Button';
import { Select } from '@components/ui/Select';
import { SearchInput } from '@components/ui/SearchInput';
import { Pagination } from '@components/ui/Pagination';
import { apiClient } from '@api/client';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export const AdminPuranas: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean; action: string; ids: string[] }>({
    isOpen: false,
    action: '',
    ids: []
  });
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [languageFilter, setLanguageFilter] = useState('');
  const [sort, setSort] = useState('newest');

  // Fetch puranas
  const { data, isLoading } = useQuery({
    queryKey: ['admin-puranas', page, search, statusFilter, languageFilter, sort],
    queryFn: async () => {
      const res = await apiClient.get('/admin/puranas', {
        params: { page, limit: 10, search, status: statusFilter, language: languageFilter, sort }
      });
      return res.data;
    }
  });

  const bulkMutation = useMutation({
    mutationFn: async ({ ids, action }: { ids: string[]; action: string }) => {
      await apiClient.post('/admin/puranas/bulk', { ids, action });
    },
    onSuccess: (_, variables) => {
      toast.success(`Successfully applied ${variables.action} to items`);
      queryClient.invalidateQueries({ queryKey: ['admin-puranas'] });
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
      accessor: (row: any) => (
        <div className="flex items-center gap-3">
          {row.cover_image ? (
            <img
              src={row.cover_image}
              alt=""
              className="w-12 h-12 object-cover rounded-md border border-gray-200 shrink-0"
            />
          ) : (
            <div className="w-12 h-12 bg-gray-100 rounded-md border border-gray-200 flex items-center justify-center text-gray-400 text-xs shrink-0">
              No img
            </div>
          )}
          <div>
            <p className="font-bold text-gray-900 flex items-center gap-2">{row.title}</p>
            {row.description && <p className="text-xs text-gray-500 truncate max-w-[200px]">{row.description}</p>}
          </div>
        </div>
      )
    },
    {
      header: 'Language',
      accessor: (row: any) => <span className="text-sm font-medium text-gray-600">{row.language || '-'}</span>
    },
    {
      header: 'Downloads',
      accessor: (row: any) => <span className="text-sm text-gray-600">{row.download_count?.toLocaleString() || 0}</span>
    },
    {
      header: 'Views',
      accessor: (row: any) => <span className="text-sm text-gray-600">{row.view_count?.toLocaleString() || 0}</span>
    },
    {
      header: 'Status',
      className: 'text-center',
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
      header: 'Updated Date',
      accessor: (row: any) => (
        <span className="text-sm text-slate-800 font-medium">
          {row.updated_at ? format(new Date(row.updated_at), 'MMM dd, yyyy') : '-'}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6 flex flex-col min-h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-wide text-slate-900 flex items-center gap-2 uppercase">
            <BookOpen className="w-6 h-6 text-saffron" />
            PURANAS
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage document-based content like PDFs and holy scriptures.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate('/admin/puranas/new')}
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Purana
          </Button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-md shadow-sm border border-blue-100 flex flex-wrap gap-4 items-center justify-between">
        <SearchInput placeholder="Search by title or description..." value={search} onChange={setSearch} />
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
            value={languageFilter}
            onChange={(val) => setLanguageFilter(val)}
            options={[
              { label: 'All Languages', value: '' },
              { label: 'Hindi', value: 'Hindi' },
              { label: 'English', value: 'English' },
              { label: 'Sanskrit', value: 'Sanskrit' },
              { label: 'Gujarati', value: 'Gujarati' }
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
              { label: 'Most Downloaded', value: 'downloads' },
              { label: 'Most Viewed', value: 'views' },
              { label: 'Alphabetical', value: 'alphabetical' }
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
          onEdit={(row) => navigate(`/admin/puranas/${row.id}/edit`)}
          onDelete={(row) => handleBulkAction('DELETE', [row.id])}
          emptyIcon={BookOpen}
          emptySubtext="Create your first purana."
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
      <ConfirmDialog
        isOpen={confirmConfig.isOpen}
        title="Confirm Action"
        message={`Are you sure you want to ${confirmConfig.action} ${confirmConfig.ids.length} items?`}
        confirmText={confirmConfig.action === 'DELETE' ? 'Delete' : 'Confirm'}
        isDestructive={confirmConfig.action === 'DELETE'}
        onCancel={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        onConfirm={() => {
          bulkMutation.mutate({ ids: confirmConfig.ids, action: confirmConfig.action });
          setConfirmConfig({ ...confirmConfig, isOpen: false });
        }}
      />
    </div>
  );
};
