import React from 'react';
import { Edit2, Eye, Trash2, Sparkles, Inbox } from 'lucide-react';
import { cn } from '@utils/cn';

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  onEdit?: (row: T) => void;
  onPreview?: (row: T) => void;
  onDelete?: (row: T) => void;
  onActionClick?: (action: string, row: T) => void;
  emptyIcon?: React.ElementType;
  emptyTitle?: string;
  emptySubtext?: string;
}

export function DataTable<T extends { id: string | number }>({
  data,
  columns,
  isLoading,
  onEdit,
  onPreview,
  onDelete,
  onActionClick,
  emptyIcon,
  emptyTitle,
  emptySubtext
}: DataTableProps<T>) {

  if (isLoading) {
    return (
      <div className="w-full overflow-x-auto bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md border border-blue-100 shadow-sm animate-pulse">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {[1,2,3,4,5].map(i => <th key={i} className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></th>)}
            </tr>
          </thead>
          <tbody>
            {[1,2,3,4,5,6,7,8,9,10].map(row => (
              <tr key={row} className="border-b border-gray-50">
                {[1,2,3,4,5].map(col => <td key={col} className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-full"></div></td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (!data || data.length === 0) {
    const EmptyIcon = emptyIcon || Inbox;
    return (
      <div className="w-full border border-dashed border-gray-300 rounded-md bg-gray-50 flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
          <EmptyIcon className="w-6 h-6 text-gray-400" />
        </div>
        <h3 className="text-sm font-medium text-gray-900 mb-1">{emptyTitle || 'No records found.'}</h3>
        <p className="text-sm text-gray-500">{emptySubtext || 'There is currently no data to display here.'}</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md border border-blue-100 shadow-sm">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 text-gray-500 border-b border-gray-100 uppercase text-xs tracking-wider">
          <tr>
            <th className="px-6 py-4 font-bold">
              <input type="checkbox" className="rounded border-gray-300 text-saffron focus:ring-saffron" />
            </th>
            {columns.map((col, idx) => (
              <th key={idx} className={cn("px-6 py-4 font-bold", col.className)}>
                {col.header}
              </th>
            ))}
            <th className="px-6 py-4 font-bold text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50/50 transition-colors group">
              <td className="px-6 py-4">
                <input type="checkbox" className="rounded border-gray-300 text-saffron focus:ring-saffron" />
              </td>
              {columns.map((col, idx) => (
                <td key={idx} className={cn("px-6 py-4", col.className)}>
                  {typeof col.accessor === 'function' ? col.accessor(row) : (row[col.accessor] as React.ReactNode)}
                </td>
              ))}
              <td className="px-6 py-4">
                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {onPreview && (
                    <button onClick={() => onPreview(row)} className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors" title="Preview">
                      <Eye className="w-4 h-4" strokeWidth={2.5} />
                    </button>
                  )}
                  {onEdit && (
                    <button onClick={() => onEdit(row)} className="p-1.5 text-saffron hover:text-orange-700 hover:bg-saffron/10 rounded-md transition-colors" title="Edit">
                      <Edit2 className="w-4 h-4" strokeWidth={2.5} />
                    </button>
                  )}
                  {onActionClick && (
                    <button onClick={() => onActionClick('REGENERATE_AI', row)} className="p-1.5 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-md transition-colors" title="Regenerate AI Metadata">
                      <Sparkles className="w-4 h-4" strokeWidth={2.5} />
                    </button>
                  )}
                  {onDelete && (
                    <button onClick={() => onDelete(row)} className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4" strokeWidth={2.5} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
