import React from 'react';
import { MoreVertical, Edit2, Eye, Trash2, Loader2, Sparkles } from 'lucide-react';
import { cn } from '../../utils/cn';

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
}

export function DataTable<T extends { id: string | number }>({
  data,
  columns,
  isLoading,
  onEdit,
  onPreview,
  onDelete,
  onActionClick
}: DataTableProps<T>) {

  if (isLoading) {
    return (
      <div className="w-full flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-saffron" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full text-center py-12 text-gray-500 border border-dashed border-gray-300 rounded-xl bg-gray-50">
        No records found.
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto bg-white rounded-xl border border-gray-200 shadow-sm">
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
                    <button onClick={() => onPreview(row)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Preview">
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                  {onEdit && (
                    <button onClick={() => onEdit(row)} className="p-1.5 text-gray-400 hover:text-saffron hover:bg-saffron/10 rounded-md transition-colors" title="Edit">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                  {onActionClick && (
                    <button onClick={() => onActionClick('REGENERATE_AI', row)} className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-md transition-colors" title="Regenerate AI Metadata">
                      <Sparkles className="w-4 h-4" />
                    </button>
                  )}
                  {onDelete && (
                    <button onClick={() => onDelete(row)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4" />
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
