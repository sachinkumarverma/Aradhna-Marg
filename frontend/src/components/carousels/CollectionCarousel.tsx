import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, FolderHeart } from 'lucide-react';
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
      const scrollAmount = direction === 'left' ? -260 : 260;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const itemWidthClass =
    type === 'god'
      ? 'min-w-[140px] w-[140px] sm:min-w-[170px] sm:w-[170px] md:min-w-[190px] md:w-[190px]'
      : 'min-w-[200px] w-[200px] sm:min-w-[240px] sm:w-[240px] md:min-w-[260px] md:w-[260px]';

  return (
    <section className="w-full py-2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-200/60 mb-2">
          <div className="flex items-center gap-2.5">
            <div className="shrink-0 flex items-center justify-center">
              {type === 'god' ? (
                <Sparkles className="w-5 h-5 text-saffron fill-saffron" />
              ) : (
                <FolderHeart className="w-5 h-5 text-saffron" />
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-darkBrown font-hindi-heading leading-snug">{title}</h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => scroll('left')}
              aria-label="Scroll left"
              className="w-8 h-8 rounded-full bg-white border border-gray-200 shadow-xs flex items-center justify-center text-darkBrown hover:bg-saffron hover:text-white hover:border-saffron transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              aria-label="Scroll right"
              className="w-8 h-8 rounded-full bg-white border border-gray-200 shadow-xs flex items-center justify-center text-darkBrown hover:bg-saffron hover:text-white hover:border-saffron transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Carousel Track */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-3 scrollbar-hide"
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
            <div key={item.id || i} className={`${itemWidthClass} shrink-0 snap-start`}>
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
    </section>
  );
};
