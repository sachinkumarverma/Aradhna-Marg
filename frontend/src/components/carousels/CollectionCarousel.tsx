import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CollectionCard } from '@components/cards/CollectionCard';

interface CollectionCarouselProps {
  title: string;
  items: any[];
  type: 'category' | 'god' | 'festival';
}

export const CollectionCarousel: React.FC<CollectionCarouselProps> = ({ title, items, type }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full py-8">
      <div className="flex items-end justify-between px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-6">
        <h2 className="text-2xl font-bold text-darkBrown tracking-tight">{title}</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => scroll('left')}
            className="w-8 h-8 rounded-full bg-white border border-black/10 flex items-center justify-center text-darkBrown hover:bg-saffron hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-8 h-8 rounded-full bg-white border border-black/10 flex items-center justify-center text-darkBrown hover:bg-saffron hover:text-white transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-4 scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <style
          dangerouslySetInnerHTML={{
            __html: `
          .scrollbar-hide::-webkit-scrollbar { display: none; }
        `
          }}
        />

        {items.map((item, i) => (
          <div key={item.id || i} className="min-w-[160px] w-[160px] sm:min-w-[200px] sm:w-[200px] shrink-0 snap-start">
            <CollectionCard
              id={item.id}
              name={item.name}
              count={item.count}
              thumbnailUrl={item.thumbnail}
              type={type}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
