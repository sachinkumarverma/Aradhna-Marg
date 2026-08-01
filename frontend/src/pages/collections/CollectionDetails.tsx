import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { CollectionHero } from '@components/layout/CollectionHero';
import { BhajanCard } from '@components/cards/BhajanCard';
import { useInfiniteBhajans } from '@hooks/useInfiniteBhajans';
import { Button } from '@components/ui/Button';
import { Loader2 } from 'lucide-react';

export const CollectionDetails: React.FC = () => {
  const { id } = useParams();
  const location = useLocation();
  
  // Determine type based on URL (e.g. /categories/123 vs /gods/123)
  const collectionType = location.pathname.split('/')[1]; // 'categories', 'gods', 'festivals'
  
  // Mock metadata based on type
  const title = collectionType === 'gods' ? 'Shiva Bhajans' : 'Aarti Sangrah';
  const description = `Discover the most divine collection of ${title}. Read lyrics, watch videos, and download PDFs.`;

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } = useInfiniteBhajans(collectionType, { id });

  // Mock grid data for architecture foundation
  const mockGrid = Array(12).fill({
    title: 'Om Namah Shivaya Mantra',
    godName: 'Shiva',
    views: 89000,
    duration: '5 Min'
  });

  return (
    <div className="w-full min-h-screen bg-[#F9F7F3] pb-20">
      <CollectionHero 
        title={title}
        description={description}
        breadcrumbs={[
          { label: 'Explore', path: '/explore' },
          { label: title, path: '#' }
        ]}
        stats={[
          { label: 'Bhajans', value: '120+' },
          { label: 'Total Views', value: '2.5M' }
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-darkBrown tracking-tight">All {title}</h2>
          
          {/* Simple Sorting Mock */}
          <select className="bg-white border border-gray-200 rounded-md px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-saffron">
            <option>Most Popular</option>
            <option>Newest</option>
            <option>A-Z</option>
          </select>
        </div>

        {/* Infinite Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {mockGrid.map((item, i) => (
            <BhajanCard 
              key={i}
              title={item.title}
              godName={item.godName}
              views={item.views}
              duration={item.duration}
            />
          ))}
        </div>

        {/* Load More Trigger (In production, replace with IntersectionObserver) */}
        <div className="mt-12 flex justify-center">
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => fetchNextPage()}
            disabled={!hasNextPage || isFetchingNextPage}
            isLoading={isFetchingNextPage}
          >
            {isFetchingNextPage ? 'Loading more...' : hasNextPage ? 'Load More' : 'No more bhajans'}
          </Button>
        </div>

        {/* SEO FAQ Section Placeholder */}
        <div className="mt-24 p-8 bg-white rounded-3xl border border-black/5">
          <h3 className="text-2xl font-bold text-darkBrown mb-6">About {title}</h3>
          <div className="space-y-4 text-darkBrown/80 leading-relaxed">
            <p>
              This section is rendered dynamically for SEO. It contains a rich text description of the category, history of the bhajans, and frequently asked questions marked up with FAQ schema.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
