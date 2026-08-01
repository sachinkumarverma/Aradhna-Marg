import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, SlidersHorizontal } from 'lucide-react';
import { SearchBar } from '@components/search/SearchBar';
import { SearchFilters } from './components/SearchFilters';
import { BhajanCard } from '@components/cards/BhajanCard';
import { useSearch } from '@hooks/useSearch';
import type { SearchFilters as IFilters } from '@hooks/useSearch';
import { Button } from '@components/ui/Button';

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [filters, setFilters] = useState<IFilters>({});
  const [sort, setSort] = useState('RELEVANCE');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Execute the search query hook (TanStack)
  const { data, isLoading, isError } = useSearch(query, filters, sort, 1);

  // Update URL if user types in the master search bar at the top of this page
  // (Assuming they hit enter and the SearchBar navigates, this component re-renders)
  
  return (
    <div className="w-full min-h-screen bg-[#F9F7F3] pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Search Area */}
        <div className="mb-10 mt-6 flex flex-col items-start">
          <h1 className="text-3xl md:text-4xl font-extrabold text-darkBrown tracking-tight mb-6">
            Search <span className="text-saffron">Bhajans</span>
          </h1>
          <div className="w-full max-w-3xl">
            <SearchBar />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Desktop Filters Sidebar */}
          <div className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-24">
              <SearchFilters filters={filters} onChange={setFilters} />
            </div>
          </div>

          {/* Mobile Filter Toggle */}
          <div className="lg:hidden flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-500">
              {data ? `${data.length} results` : 'Search results'}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              leftIcon={<SlidersHorizontal className="w-4 h-4" />}
              onClick={() => setShowMobileFilters(!showMobileFilters)}
            >
              Filters
            </Button>
          </div>

          {/* Main Results Area */}
          <div className="flex-1 w-full">
            
            {/* Sorting Header */}
            <div className="hidden lg:flex items-center justify-between mb-6">
              <span className="text-sm font-medium text-gray-500">
                {isLoading ? 'Searching...' : `Found ${data?.length || 0} results for "${query}"`}
              </span>
              <select 
                className="bg-white border border-gray-200 rounded-md px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-saffron"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="RELEVANCE">Relevance</option>
                <option value="NEWEST">Newest First</option>
                <option value="VIEWS">Most Viewed</option>
              </select>
            </div>

            {/* Results Grid */}
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-saffron" />
              </div>
            ) : isError ? (
              <div className="text-center py-20 text-red-500">
                Failed to fetch search results. Please try again.
              </div>
            ) : data && data.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {data.map((bhajan: any, i: number) => (
                  <BhajanCard
                    key={bhajan.id || i}
                    title={bhajan.title}
                    godName={bhajan.god_name || 'Unknown'}
                    views={bhajan.views}
                    duration={`${bhajan.reading_time || 5} Min`}
                    thumbnailUrl={bhajan.thumbnail_url}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">🔍</span>
                </div>
                <h3 className="text-xl font-bold text-darkBrown mb-2">No results found</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  We couldn't find anything matching "{query}". Try checking your spelling or using more general terms.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
