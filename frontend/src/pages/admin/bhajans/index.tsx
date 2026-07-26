import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Filter, Download } from 'lucide-react';
import { DataTable } from '../../../components/admin/DataTable';
import { Button } from '../../../components/ui/Button';
import { apiClient } from '../../../api/client';
import { format } from 'date-fns';

export const AdminBhajans: React.FC = () => {
  const [page, setPage] = useState(1);

  // Fetch bhajans with Admin token
  const { data, isLoading } = useQuery({
    queryKey: ['admin-bhajans', page],
    queryFn: async () => {
      // Mocking for architecture phase
      // const res = await apiClient.get(`/admin/bhajans?page=${page}`);
      // return res.data.data;
      return {
        data: [
          { id: '1', title: 'Hanuman Chalisa Fast', slug: 'hanuman-chalisa-fast', status: 'PUBLISHED', metadata_status: 'COMPLETED', created_at: new Date().toISOString(), views: 154200 },
          { id: '2', title: 'Shiv Tandav Stotram', slug: 'shiv-tandav', status: 'DRAFT', metadata_status: 'PENDING', created_at: new Date().toISOString(), views: 0 },
        ],
        meta: { currentPage: 1, totalPages: 5, totalItems: 50 }
      };
    }
  });

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
      header: 'Status',
      accessor: (row: any) => (
        <span className={`px-2 py-1 rounded-md text-xs font-medium ${
          row.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
        }`}>
          {row.status}
        </span>
      )
    },
    {
      header: 'AI Status',
      accessor: (row: any) => (
        <span className={`px-2 py-1 rounded-md text-xs font-medium ${
          row.metadata_status === 'COMPLETED' ? 'bg-purple-100 text-purple-700' : 'bg-yellow-100 text-yellow-700'
        }`}>
          {row.metadata_status}
        </span>
      )
    },
    {
      header: 'Views',
      accessor: 'views'
    },
    {
      header: 'Created',
      accessor: (row: any) => format(new Date(row.created_at), 'MMM dd, yyyy')
    }
  ];

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bhajans</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and supervise all imported and generated content.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" leftIcon={<Filter className="w-4 h-4" />}>Filter</Button>
          <Button variant="outline" leftIcon={<Download className="w-4 h-4" />}>Export</Button>
          <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>Add Manual</Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 relative">
        <DataTable 
          data={data?.data || []} 
          columns={columns} 
          isLoading={isLoading}
          onEdit={(row) => console.log('Edit', row)}
          onPreview={(row) => console.log('Preview', row)}
          onDelete={(row) => console.log('Delete', row)}
          onActionClick={(action, row) => console.log('Action', action, row)}
        />
      </div>

      {/* Pagination Controls mock */}
      <div className="flex items-center justify-between py-2">
        <span className="text-sm text-gray-500">Showing 1 to 20 of {data?.meta.totalItems || 0} entries</span>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" disabled>Previous</Button>
          <Button variant="outline" size="sm">Next</Button>
        </div>
      </div>

    </div>
  );
};
