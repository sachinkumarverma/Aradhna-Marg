import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from '@i18n/LanguageContext';

export interface SimplePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  disabled?: boolean;
}

export const SimplePagination: React.FC<SimplePaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
  disabled = false
}) => {
  const { language } = useTranslation();

  if (totalPages <= 1) return null;

  return (
    <div className={`flex items-center justify-center gap-4 mt-6 sm:mt-8 mb-2 sm:mb-3 ${className}`}>
      <button
        type="button"
        disabled={disabled || currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="w-9 h-9 rounded-lg bg-white border border-gray-200 text-slate-600 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:not-disabled:bg-saffron hover:not-disabled:text-white hover:not-disabled:border-saffron transition-all shadow-2xs cursor-pointer active:scale-95"
        title="Previous"
        aria-label="Previous page"
      >
        <ChevronLeft className="w-4 h-4 stroke-[2]" />
      </button>

      <span className="text-sm font-semibold text-slate-700 select-none px-1 tracking-wide font-sans">
        {language === 'hi' ? `${currentPage} / ${totalPages}` : `${currentPage} of ${totalPages}`}
      </span>

      <button
        type="button"
        disabled={disabled || currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="w-9 h-9 rounded-lg bg-white border border-gray-200 text-slate-600 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:not-disabled:bg-saffron hover:not-disabled:text-white hover:not-disabled:border-saffron transition-all shadow-2xs cursor-pointer active:scale-95"
        title="Next"
        aria-label="Next page"
      >
        <ChevronRight className="w-4 h-4 stroke-[2]" />
      </button>
    </div>
  );
};
