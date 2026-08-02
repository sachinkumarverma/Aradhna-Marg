import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Select } from './Select';

interface PaginationProps {
  page: number;
  totalPages: number;
  totalRecords: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  limitOptions?: number[];
}

export function Pagination({
  page,
  totalPages,
  totalRecords,
  limit,
  onPageChange,
  onLimitChange,
  limitOptions = [10, 20, 50]
}: PaginationProps) {
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (page <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (page >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', page - 1, page, page + 1, '...', totalPages);
      }
    }
    return pages;
  };

  if (totalPages === 0) return null;

  return (
    <div className="flex items-center justify-between py-3 px-4 sm:px-6 bg-orange-50 border-t border-orange-100 mt-auto">
      <div className="text-sm text-gray-700 font-medium whitespace-nowrap hidden sm:block">
        <span className="font-bold text-gray-900">{totalRecords}</span> records
      </div>

      <div className="flex items-center gap-1 overflow-x-auto mx-auto sm:mx-4 hide-scrollbar">
        <button 
          disabled={page === 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          className="w-8 h-8 flex-shrink-0 flex items-center justify-center text-gray-400 hover:text-orange-900 disabled:opacity-50 disabled:hover:text-gray-400"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        
        {getPageNumbers().map((p, idx) => (
          p === '...' ? (
            <span key={`dots-${idx}`} className="w-8 h-8 flex items-center justify-center text-gray-400 text-sm font-medium">
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full text-sm font-medium transition-colors ${
                page === p ? 'bg-orange-900 text-white' : 'text-orange-900 hover:bg-orange-100'
              }`}
            >
              {p}
            </button>
          )
        ))}

        <button 
          disabled={page === totalPages}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          className="w-8 h-8 flex-shrink-0 flex items-center justify-center text-gray-400 hover:text-orange-900 disabled:opacity-50 disabled:hover:text-gray-400 transform rotate-180"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-3 text-sm text-gray-600 font-medium whitespace-nowrap">
        <span className="hidden lg:inline">Rows per page</span>
        <div className="w-16 sm:w-18">
          <Select
            options={limitOptions.map(l => ({ label: l.toString(), value: l.toString() }))}
            value={limit.toString()}
            onChange={(val) => onLimitChange(Number(val))}
            searchable={false}
            menuPlacement="top"
          />
        </div>
      </div>
    </div>
  );
}
