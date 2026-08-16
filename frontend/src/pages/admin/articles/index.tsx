import React, { useState } from 'react';
import { ConfirmDialog } from '@components/ui/ConfirmDialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, FileText, CheckCircle2, XCircle, Star } from 'lucide-react';
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
  const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean; action: string; ids: string[] }>({
    isOpen: false,
    action: '',
    ids: []
  });
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
    mutationFn: async ({ ids, action }: { ids: string[]; action: string }) => {
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
    setConfirmConfig({ isOpen: true, action, ids: selectedIds });
  };

  const totalPages = Math.ceil((data?.meta?.total || 0) / (limit || 10));

  const columns = [
    {
      header: 'Title',
      accessor: (row: any) => (
        <div className="flex flex-col gap-1">
          <p className="font-bold text-gray-900 line-clamp-2 leading-snug">{row.title}</p>
          {row.excerpt && <p className="text-xs text-gray-500 truncate max-w-[200px]">{row.excerpt}</p>}
        </div>
      )
    },
    {
      header: 'Featured',
      className: 'text-center w-24',
      accessor: (row: any) => (
        <div className="flex justify-center">
          {row.featured ? (
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
          ) : (
            <span className="text-gray-300">-</span>
          )}
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
      className: 'text-center w-24',
      accessor: (row: any) => (
        <div className="text-sm text-gray-600 justify-center flex">{row.view_count?.toLocaleString() || 0}</div>
      )
    },
    {
      header: 'Published',
      accessor: (row: any) => {
        const displayDate = row.publish_date ? new Date(row.publish_date) : new Date(row.created_at);
        return <span className="text-sm text-slate-800 font-medium">{format(displayDate, 'MMM dd, yyyy')}</span>;
      }
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
          <Button
            onClick={() => navigate('/admin/articles/new')}
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Article
          </Button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-md shadow-sm border border-blue-100 flex flex-wrap gap-4 items-center justify-between">
        <SearchInput placeholder="Search articles..." value={search} onChange={setSearch} />
        <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 w-full sm:w-auto">
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
              { label: 'Most Views', value: 'views' }
            ]}
            className="w-full sm:w-40"
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
          bulkMutation.mutate({ ids: confirmConfig.ids, action: confirmConfig.action });
          setConfirmConfig({ ...confirmConfig, isOpen: false });
        }}
      />
    </div>
  );
};
