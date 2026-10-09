import React from 'react';
import type { SearchFilters as ISearchFilters } from '@hooks/useSearch';
import { Check } from 'lucide-react';
import { cn } from '@utils/cn';

interface SearchFiltersProps {
  filters: ISearchFilters;
  onChange: (filters: ISearchFilters) => void;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({ filters, onChange }) => {
  const toggleFilter = (key: keyof ISearchFilters, value: any) => {
    onChange({
      ...filters,
      [key]: filters[key] === value ? undefined : value
    });
  };

  return (
    <div className="w-full bg-white rounded-2xl p-6 shadow-sm border border-black/5">
      <h3 className="font-bold text-lg text-darkBrown mb-6">Filters</h3>

      {/* Availability */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Availability</h4>
        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div
              className={cn(
                'w-5 h-5 rounded border flex items-center justify-center transition-colors',
                filters.hasPdf ? 'bg-saffron border-saffron' : 'border-gray-300 group-hover:border-saffron'
              )}
            >
              {filters.hasPdf && <Check className="w-3 h-3 text-white" />}
            </div>
            <input
              type="checkbox"
              className="hidden"
              checked={!!filters.hasPdf}
              onChange={() => toggleFilter('hasPdf', true)}
            />
            <span className="text-darkBrown">Has PDF</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer group">
            <div
              className={cn(
                'w-5 h-5 rounded border flex items-center justify-center transition-colors',
                filters.hasVideo ? 'bg-saffron border-saffron' : 'border-gray-300 group-hover:border-saffron'
              )}
            >
              {filters.hasVideo && <Check className="w-3 h-3 text-white" />}
            </div>
            <input
              type="checkbox"
              className="hidden"
              checked={!!filters.hasVideo}
              onChange={() => toggleFilter('hasVideo', true)}
            />
            <span className="text-darkBrown">Has Video</span>
          </label>
        </div>
      </div>

      {/* Mock Categories Filter */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Category</h4>
        <div className="space-y-2">
          {['Aarti', 'Chalisa', 'Mantra', 'Stotram'].map((cat) => (
            <label key={cat} className="flex items-center gap-3 cursor-pointer group">
              <div
                className={cn(
                  'w-4 h-4 rounded-full border flex items-center justify-center transition-colors',
                  filters.categoryId === cat ? 'border-saffron' : 'border-gray-300 group-hover:border-saffron'
                )}
              >
                {filters.categoryId === cat && <div className="w-2 h-2 rounded-full bg-saffron" />}
              </div>
              <input
                type="radio"
                className="hidden"
                checked={filters.categoryId === cat}
                onChange={() => toggleFilter('categoryId', cat)}
              />
              <span className="text-darkBrown">{cat}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};
