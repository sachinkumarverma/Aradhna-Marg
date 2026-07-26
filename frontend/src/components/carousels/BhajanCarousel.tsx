import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { BhajanCard } from '../cards/BhajanCard';

interface BhajanCarouselProps {
  title: string;
  items: any[]; // Replacing with proper type in a real app
  onViewAll?: () => void;
}

export const BhajanCarousel: React.FC<BhajanCarouselProps> = ({ title, items, onViewAll }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full py-8">
      <div className="flex items-end justify-between px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-6">
        <h2 className="text-2xl font-bold text-darkBrown tracking-tight">{title}</h2>
        <div className="flex items-center gap-3">
          {onViewAll && (
            <button onClick={onViewAll} className="text-sm font-bold text-saffron hover:text-darkBrown transition-colors hidden sm:block mr-2">
              View All
            </button>
          )}
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
        className="flex gap-6 overflow-x-auto snap-x snap-mandatory px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-4 scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <style dangerouslySetInnerHTML={{__html: `
          .scrollbar-hide::-webkit-scrollbar { display: none; }
        `}} />
        
        {items.map((item, i) => (
          <div key={i} className="min-w-[280px] w-[280px] sm:min-w-[320px] sm:w-[320px] shrink-0 snap-start">
            <BhajanCard 
              title={item.title}
              godName={item.godName}
              duration={item.duration}
              views={item.views}
              thumbnailUrl={item.thumbnailUrl}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
