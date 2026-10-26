import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@utils/cn';

export interface SortHeaderProps {
  label?: string;
  field?: string;
  columnKey?: string;
  currentSortField?: string | null;
  currentDirection?: 'asc' | 'desc';
  sortConfig?: { key: string; direction: 'asc' | 'desc' } | null;
  onSort?: (field: string) => void;
  className?: string;
  align?: 'left' | 'center' | 'right';
  children?: React.ReactNode;
}

export const SortHeader: React.FC<SortHeaderProps> = ({
  label = '',
  field,
  columnKey,
  currentSortField,
  currentDirection = 'asc',
  sortConfig,
  onSort,
  className,
  align = 'left',
  children
}) => {
  const targetField = field || columnKey || '';
  const effectiveSortField = currentSortField !== undefined ? currentSortField : sortConfig?.key;
  const effectiveDirection =
    currentSortField !== undefined && currentDirection !== undefined
      ? currentDirection
      : sortConfig?.direction || currentDirection || 'asc';

  const isCurrent = Boolean(targetField && effectiveSortField === targetField);

  return (
    <th
      onClick={() => onSort?.(targetField)}
      className={cn(
        'px-6 py-4 font-bold select-none cursor-pointer group hover:bg-orange-100/70 transition-colors',
        align === 'center' && 'text-center',
        align === 'right' && 'text-right',
        className
      )}
    >
      <div
        className={cn(
          'flex items-center gap-1.5',
          align === 'center' && 'justify-center',
          align === 'right' && 'justify-end'
        )}
      >
        <span>{children || label}</span>
        <span className="shrink-0">
          {isCurrent ? (
            effectiveDirection === 'asc' ? (
              <ArrowUp className="w-3.5 h-3.5 text-orange-900 stroke-[2.5]" />
            ) : (
              <ArrowDown className="w-3.5 h-3.5 text-orange-900 stroke-[2.5]" />
            )
          ) : (
            <ArrowUpDown className="w-3.5 h-3.5 text-orange-300 group-hover:text-orange-500 transition-colors" />
          )}
        </span>
      </div>
    </th>
  );
};
