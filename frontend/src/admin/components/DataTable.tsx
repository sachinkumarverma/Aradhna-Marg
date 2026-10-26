import React from 'react';
import { Edit2, ExternalLink, Trash2, Sparkles, Inbox, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@utils/cn';

export interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  sortKey?: string | keyof T | ((row: T) => any);
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  selectedRowId?: string | number | null;
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string;
  renderActions?: (row: T) => React.ReactNode;
  onEdit?: (row: T) => void;
  onPreview?: (row: T) => void;
  onDelete?: (row: T) => void;
  onActionClick?: (action: string, row: T) => void;
  emptyIcon?: React.ElementType;
  emptyTitle?: string;
  emptySubtext?: string;
  defaultSortField?: string | null;
  defaultSortDirection?: 'asc' | 'desc';
  onSortChange?: (field: string, direction: 'asc' | 'desc') => void;
}

export function DataTable<T extends { id: string | number }>({
  data,
  columns,
  isLoading,
  selectedRowId,
  onRowClick,
  rowClassName,
  renderActions,
  onEdit,
  onPreview,
  onDelete,
  onActionClick,
  emptyIcon,
  emptyTitle,
  emptySubtext,
  defaultSortField = null,
  defaultSortDirection = 'asc',
  onSortChange
}: DataTableProps<T>) {
  const [sortField, setSortField] = React.useState<string | null>(defaultSortField);
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>(defaultSortDirection);

  const handleHeaderClick = (col: Column<T>) => {
    if (col.sortable === false) return;
    const field = col.header;
    let nextDirection: 'asc' | 'desc';

    if (sortField === field) {
      nextDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      setSortDirection(nextDirection);
    } else {
      setSortField(field);
      const f = field.toLowerCase();
      if (
        f.includes('date') ||
        f.includes('created') ||
        f.includes('updated') ||
        f.includes('publish') ||
        f.includes('views') ||
        f.includes('download') ||
        f.includes('amount') ||
        f.includes('total')
      ) {
        nextDirection = 'desc';
      } else {
        nextDirection = 'asc';
      }
      setSortDirection(nextDirection);
    }

    onSortChange?.(field, nextDirection);
  };

  const sortedData = React.useMemo(() => {
    if (!sortField || !data || data.length <= 1) return data;
    const col = columns.find((c) => c.header === sortField);
    if (!col || col.sortable === false) return data;

    return [...data].sort((a, b) => {
      let valA: any;
      let valB: any;

      if (typeof col.sortKey === 'function') {
        valA = col.sortKey(a);
        valB = col.sortKey(b);
      } else if (typeof col.sortKey === 'string') {
        valA = (a as any)[col.sortKey];
        valB = (b as any)[col.sortKey];
      } else if (typeof col.accessor === 'string' || typeof col.accessor === 'number') {
        valA = a[col.accessor as keyof T];
        valB = b[col.accessor as keyof T];
      } else {
        const h = col.header.toLowerCase();
        if (h.includes('title')) valA = (a as any).hindi_title || (a as any).title || (a as any).name || '';
        else if (h.includes('category')) valA = (a as any).categories?.name || (a as any).category || '';
        else if (h.includes('deity') || h.includes('god'))
          valA = (a as any).gods?.name || (a as any).deities?.name || (a as any).deity || '';
        else if (h.includes('author')) valA = (a as any).authors?.name || (a as any).author || '';
        else if (h.includes('status')) valA = (a as any).status || '';
        else if (h.includes('view')) valA = (a as any).views ?? (a as any).view_count ?? 0;
        else if (h.includes('download')) valA = (a as any).download_count ?? 0;
        else if (h.includes('order')) valA = (a as any).display_order ?? (a as any).displayOrder ?? 0;
        else if (h.includes('created') || h.includes('date') || h.includes('publish') || h.includes('updated')) {
          valA = (a as any).created_at || (a as any).publish_date || (a as any).updated_at || (a as any).festival_date;
        } else if (h.includes('featured')) {
          valA = (a as any).featured ? 1 : 0;
        } else {
          valA = (a as any)[col.header.toLowerCase()] ?? '';
        }

        if (h.includes('title')) valB = (b as any).hindi_title || (b as any).title || (b as any).name || '';
        else if (h.includes('category')) valB = (b as any).categories?.name || (b as any).category || '';
        else if (h.includes('deity') || h.includes('god'))
          valB = (b as any).gods?.name || (b as any).deities?.name || (b as any).deity || '';
        else if (h.includes('author')) valB = (b as any).authors?.name || (b as any).author || '';
        else if (h.includes('status')) valB = (b as any).status || '';
        else if (h.includes('view')) valB = (b as any).views ?? (b as any).view_count ?? 0;
        else if (h.includes('download')) valB = (b as any).download_count ?? 0;
        else if (h.includes('order')) valB = (b as any).display_order ?? (b as any).displayOrder ?? 0;
        else if (h.includes('created') || h.includes('date') || h.includes('publish') || h.includes('updated')) {
          valB = (b as any).created_at || (b as any).publish_date || (b as any).updated_at || (b as any).festival_date;
        } else if (h.includes('featured')) {
          valB = (b as any).featured ? 1 : 0;
        } else {
          valB = (b as any)[col.header.toLowerCase()] ?? '';
        }
      }

      if (valA === valB) return 0;
      if (valA === null || valA === undefined || valA === '') return 1;
      if (valB === null || valB === undefined || valB === '') return -1;

      // Numeric comparison
      const numA = typeof valA === 'number' ? valA : !isNaN(Number(valA)) && valA !== '' ? Number(valA) : null;
      const numB = typeof valB === 'number' ? valB : !isNaN(Number(valB)) && valB !== '' ? Number(valB) : null;
      if (numA !== null && numB !== null) {
        return sortDirection === 'asc' ? numA - numB : numB - numA;
      }

      // Boolean comparison
      if (typeof valA === 'boolean' && typeof valB === 'boolean') {
        return sortDirection === 'asc' ? (valA === valB ? 0 : valA ? 1 : -1) : valA === valB ? 0 : valA ? -1 : 1;
      }

      // Date comparison
      const isDateA = valA instanceof Date || (typeof valA === 'string' && /^\d{4}-\d{2}-\d{2}/.test(valA));
      const isDateB = valB instanceof Date || (typeof valB === 'string' && /^\d{4}-\d{2}-\d{2}/.test(valB));
      if (isDateA && isDateB) {
        const timeA = new Date(valA).getTime();
        const timeB = new Date(valB).getTime();
        if (!isNaN(timeA) && !isNaN(timeB)) {
          return sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
        }
      }

      // Multilingual string comparison (Hindi Devanagari + English)
      const strA = String(valA);
      const strB = String(valB);
      const comp = strA.localeCompare(strB, 'hi', { numeric: true, sensitivity: 'base' });
      return sortDirection === 'asc' ? comp : -comp;
    });
  }, [data, sortField, sortDirection, columns]);

  if (isLoading) {
    return (
      <div className="w-full overflow-x-auto bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md border border-blue-100 shadow-sm animate-pulse">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {[1, 2, 3, 4, 5].map((i) => (
                <th key={i} className="px-6 py-4">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((row) => (
              <tr key={row} className="border-b border-gray-50">
                {[1, 2, 3, 4, 5].map((col) => (
                  <td key={col} className="px-6 py-4">
                    <div className="h-4 bg-gray-100 rounded w-full"></div>
                  </td>
                ))}
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
      <table className="w-full text-sm text-left bg-white">
        <thead className="bg-orange-50 text-orange-900 border-b border-orange-100 uppercase text-xs tracking-wider font-semibold">
          <tr>
            {columns.map((col, idx) => {
              const isSortable = col.sortable !== false;
              const isCurrent = sortField === col.header;

              return (
                <th
                  key={idx}
                  onClick={() => isSortable && handleHeaderClick(col)}
                  className={cn(
                    'px-6 py-4 font-bold select-none bg-orange-50',
                    isSortable && 'cursor-pointer group hover:bg-orange-100 transition-colors',
                    col.className
                  )}
                >
                  <div
                    className={cn(
                      'flex items-center gap-1.5',
                      col.className?.includes('text-center') && 'justify-center',
                      col.className?.includes('text-right') && 'justify-end'
                    )}
                  >
                    <span>{col.header}</span>
                    {isSortable && (
                      <span className="shrink-0">
                        {isCurrent ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-orange-900 stroke-[2.5]" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-orange-900 stroke-[2.5]" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5 text-orange-300 group-hover:text-orange-500 transition-colors" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              );
            })}
            <th className="px-6 py-4 font-bold text-right select-none bg-orange-50">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sortedData.map((row) => {
            const isSelected =
              selectedRowId !== undefined && selectedRowId !== null ? String(row.id) === String(selectedRowId) : false;
            const customRowClass = rowClassName?.(row) || '';
            const isHighlighted =
              isSelected || customRowClass.includes('border-l-') || customRowClass.includes('bg-orange-');

            return (
              <tr
                key={row.id}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  'bg-gray-50/50 hover:bg-blue-100/60 transition-colors group',
                  onRowClick && 'cursor-pointer',
                  isSelected && 'bg-orange-50/90 hover:bg-orange-100/70',
                  customRowClass
                )}
              >
                {columns.map((col, idx) => (
                  <td
                    key={idx}
                    className={cn(
                      'px-6 py-4',
                      col.className,
                      idx === 0 && isHighlighted && 'border-l-4 border-l-saffron'
                    )}
                  >
                    {typeof col.accessor === 'function' ? col.accessor(row) : (row[col.accessor] as React.ReactNode)}
                  </td>
                ))}
                <td className="px-6 py-4" onClick={(e) => (renderActions ? e.stopPropagation() : undefined)}>
                  <div className="flex items-center justify-end gap-2 transition-opacity">
                    {renderActions && renderActions(row)}
                    {onPreview && (
                      <button
                        onClick={() => onPreview(row)}
                        className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                        title="Open PDF"
                      >
                        <ExternalLink className="w-4 h-4" strokeWidth={2.5} />
                      </button>
                    )}
                    {onEdit && (
                      <button
                        onClick={() => onEdit(row)}
                        className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" strokeWidth={3.5} />
                      </button>
                    )}
                    {onActionClick && (
                      <button
                        onClick={() => onActionClick('REGENERATE_AI', row)}
                        className="p-1.5 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-md transition-colors cursor-pointer"
                        title="Regenerate AI Metadata"
                      >
                        <Sparkles className="w-4 h-4" strokeWidth={2.5} />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(row)}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" strokeWidth={3.5} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
