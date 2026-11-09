import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  Users as UsersIcon,
  UserCheck,
  UserX,
  RefreshCw,
  Calendar,
  Clock,
  Mail,
  CheckCircle2,
  XCircle,
  Power
} from 'lucide-react';
import { UsersApi, type AdminUserItem, type GetUsersResponse } from '@admin/features/users/UsersApi';
import { SearchInput } from '@components/ui/SearchInput';
import { Select } from '@components/ui/Select';
import { Pagination } from '@components/ui/Pagination';
import { ConfirmDialog } from '@components/ui/ConfirmDialog';
import { StatCard } from '@admin/components/StatCard';
import { AdminButton } from '@admin/components/AdminButton';
import { DataTable, type Column } from '@admin/components/DataTable';
import { cn } from '@utils/cn';

export function AdminUsers() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modal confirmation for deactivating a user
  const [confirmTarget, setConfirmTarget] = useState<{ user: AdminUserItem; targetActive: boolean } | null>(null);

  // Fetch Users
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-users', page, limit, search, statusFilter, sortBy, sortOrder],
    queryFn: () =>
      UsersApi.getUsers({
        page,
        limit,
        search: search.trim() || undefined,
        status: statusFilter,
        sortBy,
        sortOrder
      })
  });

  // Fetch Statistics
  const { data: statsData } = useQuery({
    queryKey: ['admin-user-stats'],
    queryFn: () => UsersApi.getUserStats()
  });

  const stats = statsData?.data || { total: 0, active: 0, inactive: 0 };

  // Status Mutation (Activate / Deactivate)
  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => UsersApi.toggleStatus(id, isActive),
    onSuccess: (response, variables) => {
      queryClient.setQueriesData<GetUsersResponse>({ queryKey: ['admin-users'] }, (current) => {
        if (!current) return current;

        return {
          ...current,
          data: current.data.map((user) =>
            user.id === variables.id ? { ...user, ...response.data, is_active: variables.isActive } : user
          )
        };
      });
      toast.success(
        variables.isActive ? 'User account activated successfully' : 'User account deactivated successfully'
      );
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      setConfirmTarget(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update user status');
    }
  });

  const handleActionClick = (user: AdminUserItem) => {
    if (user.is_active) {
      setConfirmTarget({ user, targetActive: false });
    } else {
      toggleMutation.mutate({ id: user.id, isActive: true });
    }
  };

  const handleConfirmAction = () => {
    if (!confirmTarget) return;
    toggleMutation.mutate({ id: confirmTarget.user.id, isActive: confirmTarget.targetActive });
  };

  const formatDateSafe = (dateString?: string | null) => {
    if (!dateString) return 'Never';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return 'Never';
      return format(d, 'MMM dd, yyyy, hh:mm a');
    } catch {
      return 'Never';
    }
  };

  const getUserInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const columns: Column<AdminUserItem>[] = [
    {
      header: 'Devotee',
      sortKey: 'name',
      accessor: (row: AdminUserItem) => (
        <div className="flex items-center gap-3">
          {row.avatar_url ? (
            <img
              src={row.avatar_url}
              alt={row.name}
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-full object-cover border border-amber-200/80 shadow-2xs shrink-0"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 text-white font-bold text-xs flex items-center justify-center shadow-2xs shrink-0">
              {getUserInitials(row.name)}
            </div>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-gray-900 text-sm truncate max-w-[200px]">{row.name}</span>
              {row.is_verified && (
                <span title="Verified Account" className="inline-flex text-emerald-600">
                  <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-100" />
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
              <Mail className="w-3 h-3 text-gray-400 shrink-0" />
              <span className="truncate max-w-[220px]">{row.email}</span>
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Authentication',
      sortKey: (row: AdminUserItem) => (row.google_id ? 'Google' : 'Email'),
      className: 'w-44',
      accessor: (row: AdminUserItem) =>
        row.google_id ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/70">
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Google</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
            <Mail className="w-3 h-3 text-gray-500" />
            <span>Email / Pass</span>
          </span>
        )
    },
    {
      header: 'Signup Date',
      sortKey: 'created_at',
      className: 'w-44',
      accessor: (row: AdminUserItem) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-800 font-medium">
          <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span>{formatDateSafe(row.created_at)}</span>
        </div>
      )
    },
    {
      header: 'Last Logged In',
      sortKey: (row: AdminUserItem) => row.last_login_at || '',
      className: 'w-44',
      accessor: (row: AdminUserItem) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-800 font-medium">
          <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          {row.last_login_at ? (
            <span className="text-gray-900 font-semibold">{formatDateSafe(row.last_login_at)}</span>
          ) : (
            <span className="text-gray-400 italic">Never</span>
          )}
        </div>
      )
    },
    {
      header: 'Status',
      sortKey: 'is_active',
      className: 'text-center w-36',
      accessor: (row: AdminUserItem) => (
        <span
          className={`inline-flex items-center justify-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
            row.is_active ? 'bg-green-600 text-white' : 'bg-rose-600 text-white'
          }`}
        >
          {row.is_active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" strokeWidth={2.5} />}
          {row.is_active ? 'ACTIVE' : 'DEACTIVATED'}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6 flex flex-col min-h-full">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-2xl font-bold tracking-wide text-slate-900 flex items-center gap-2 uppercase truncate">
            <UsersIcon className="w-5 h-5 sm:w-6 sm:h-6 text-saffron shrink-0" />
            <span className="truncate">REGISTERED USERS</span>
          </h1>
          <p className="hidden sm:block text-sm text-gray-500 mt-1">
            Manage devotee accounts, view signup activity, and activate or deactivate user access.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <AdminButton
            onClick={() => {
              refetch();
              queryClient.invalidateQueries({ queryKey: ['admin-user-stats'] });
            }}
            variant="outline"
            title="Refresh"
            aria-label="Refresh"
            disabled={isFetching}
            className="h-8 w-8 sm:h-9 sm:w-9 p-0 flex items-center justify-center shrink-0 bg-white hover:bg-slate-50 border-gray-200 text-slate-700"
          >
            <RefreshCw
              className={cn(
                'w-4 h-4 shrink-0 stroke-[2.2]',
                isFetching ? 'animate-spin text-saffron' : 'text-slate-600'
              )}
            />
          </AdminButton>
        </div>
      </div>

      {/* Summary KPI Cards (3 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
        <StatCard
          title="Total Devotees"
          value={stats.total}
          icon={UsersIcon}
          colorClassName="bg-blue-100 text-blue-600"
          bgClassName="bg-gradient-to-br from-blue-50 to-white"
          borderClassName="border-blue-100"
          onClick={() => {
            setStatusFilter('all');
            setPage(1);
          }}
          className={statusFilter === 'all' ? 'ring-2 ring-blue-500' : ''}
        />
        <StatCard
          title="Active Accounts"
          value={stats.active}
          icon={UserCheck}
          colorClassName="bg-emerald-100 text-emerald-600"
          bgClassName="bg-gradient-to-br from-emerald-50 to-white"
          borderClassName="border-emerald-100"
          onClick={() => {
            setStatusFilter('active');
            setPage(1);
          }}
          className={statusFilter === 'active' ? 'ring-2 ring-emerald-500' : ''}
        />
        <StatCard
          title="Deactivated"
          value={stats.inactive}
          icon={UserX}
          colorClassName="bg-rose-100 text-rose-600"
          bgClassName="bg-gradient-to-br from-rose-50 to-white"
          borderClassName="border-rose-100"
          onClick={() => {
            setStatusFilter('inactive');
            setPage(1);
          }}
          className={statusFilter === 'inactive' ? 'ring-2 ring-rose-500' : ''}
        />
      </div>

      {/* Controls: Selects for Filter/Sort and Search */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-md shadow-sm border border-blue-100 flex flex-wrap gap-4 items-center justify-between">
        <div className="grid grid-cols-1 sm:flex sm:flex-row flex-wrap items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          <Select
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val as any);
              setPage(1);
            }}
            options={[
              { label: 'All Statuses', value: 'all' },
              { label: 'Active', value: 'active' },
              { label: 'Deactivated', value: 'inactive' }
            ]}
            className="w-full sm:w-44"
            searchable={false}
          />
          <Select
            value={`${sortBy}-${sortOrder}`}
            onChange={(val) => {
              const [sb, so] = val.split('-');
              setSortBy(sb);
              setSortOrder(so as 'asc' | 'desc');
              setPage(1);
            }}
            options={[
              { label: 'Newest Registered', value: 'created_at-desc' },
              { label: 'Oldest Registered', value: 'created_at-asc' },
              { label: 'Recently Active', value: 'last_login_at-desc' },
              { label: 'Name (A-Z)', value: 'name-asc' },
              { label: 'Name (Z-A)', value: 'name-desc' }
            ]}
            className="w-full sm:w-48"
            searchable={false}
          />
        </div>
        <SearchInput
          placeholder="Search by devotee name or email..."
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
        />
      </div>

      {/* Main Table Container using DataTable */}
      <div className="flex-1 min-h-0 relative">
        <DataTable
          data={data?.data || []}
          columns={columns}
          isLoading={isLoading}
          skeletonRows={limit}
          renderActions={(user) => (
            <AdminButton
              variant="outline"
              size="sm"
              onClick={() => handleActionClick(user)}
              disabled={toggleMutation.isPending && toggleMutation.variables?.id === user.id}
              title={user.is_active ? 'Deactivate account' : 'Activate account'}
              leftIcon={
                user.is_active ? (
                  <Power className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                )
              }
              className={cn(
                'h-8 min-w-[96px] px-3 text-xs font-semibold transition-colors',
                user.is_active
                  ? 'text-rose-700 hover:text-white hover:bg-rose-600 border-rose-200 hover:border-rose-600'
                  : 'text-emerald-700 hover:text-white hover:bg-emerald-600 border-emerald-200 hover:border-emerald-600'
              )}
            >
              {user.is_active ? 'Deactivate' : 'Activate'}
            </AdminButton>
          )}
          emptyIcon={UsersIcon}
          emptyTitle="No users found"
          emptySubtext={
            search
              ? `No user matched "${search}". Try searching with a different keyword.`
              : 'No users have registered on the platform yet.'
          }
        />
      </div>

      {/* Standard Admin Pagination Container */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-x border-b border-blue-100 rounded-b-md -mt-2 relative z-20">
        <Pagination
          page={page}
          totalPages={data?.meta?.totalPages || 1}
          totalRecords={data?.meta?.total || 0}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={(l) => {
            setLimit(l);
            setPage(1);
          }}
        />
      </div>

      {/* Confirmation Dialog for Deactivation */}
      {confirmTarget && (
        <ConfirmDialog
          isOpen={true}
          title="Deactivate Devotee Account"
          message={`Are you sure you want to deactivate the account for "${confirmTarget.user.name}" (${confirmTarget.user.email})? While deactivated, this user will not be able to log in or access their saved favorites.`}
          confirmText="Yes, Deactivate"
          cancelText="Cancel"
          isDestructive={true}
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirmTarget(null)}
        />
      )}
    </div>
  );
}
