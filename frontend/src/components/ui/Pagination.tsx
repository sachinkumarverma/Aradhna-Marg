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
    <div className="flex items-center justify-between py-2.5 px-3 sm:px-6 bg-orange-50 border-t border-orange-100 mt-auto rounded-b-md gap-2">
      {/* Total records (Left End on both Mobile and Desktop) */}
      <div className="text-xs sm:text-sm text-gray-700 font-medium whitespace-nowrap shrink-0">
        <span className="font-bold text-gray-900">{totalRecords}</span> records
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-1 justify-center mx-auto sm:mx-0">
        {/* Previous Button */}
        <button
          type="button"
          disabled={page === 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0 flex items-center justify-center rounded-full text-gray-600 hover:text-orange-900 hover:bg-orange-100/70 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400 transition-colors"
          title="Previous page"
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
        </button>

        {/* Mobile View (< sm): Compact "page / totalPages" badge */}
        <div className="flex items-center sm:hidden px-0.5">
          <span className="text-[11px] font-semibold text-orange-950 bg-white/90 border border-orange-200/90 px-2 py-0.5 rounded-full shadow-xs whitespace-nowrap">
            {page} / {totalPages}
          </span>
        </div>

        {/* Desktop View (>= sm): Full page number buttons */}
        <div className="hidden sm:flex items-center gap-1">
          {getPageNumbers().map((p, idx) =>
            p === '...' ? (
              <span
                key={`dots-${idx}`}
                className="w-8 h-8 flex items-center justify-center text-gray-400 text-sm font-medium select-none"
              >
                ...
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p as number)}
                className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full text-sm font-medium transition-colors ${
                  page === p ? 'bg-orange-900 text-white shadow-xs' : 'text-orange-900 hover:bg-orange-100'
                }`}
              >
                {p}
              </button>
            )
          )}
        </div>

        {/* Next Button */}
        <button
          type="button"
          disabled={page === totalPages}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full text-gray-600 hover:text-orange-900 hover:bg-orange-100/70 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400 transition-colors"
          title="Next page"
        >
          <ArrowLeft className="w-4 h-4 shrink-0 transform rotate-180" />
        </button>
      </div>

      {/* Rows per page selector */}
      <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600 font-medium whitespace-nowrap shrink-0">
        <span className="hidden lg:inline">Rows per page</span>
        <span className="hidden sm:inline lg:hidden">Rows:</span>
        <div className="w-[66px] sm:w-20 shrink-0">
          <Select
            options={limitOptions.map((l) => ({ label: l.toString(), value: l.toString() }))}
            value={limit.toString()}
            onChange={(val) => onLimitChange(Number(val))}
            searchable={false}
            menuPlacement="top"
            triggerClassName="px-2 py-1 text-xs font-bold rounded-md bg-white border border-orange-200 text-orange-950 shadow-xs"
          />
        </div>
      </div>
    </div>
  );
}
