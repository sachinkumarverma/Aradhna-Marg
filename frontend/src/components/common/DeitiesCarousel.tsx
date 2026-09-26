import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const defaultDeities = [
  { id: 1, name: 'Ganesh', slug: 'ganesh', image: '/Deities/Ganesh.png' },
  { id: 2, name: 'Krishna', slug: 'krishna', image: '/Deities/Krishna.png' },
  { id: 3, name: 'Mata Durga', slug: 'mata-durga', image: '/Deities/MataDurga.png' },
  { id: 4, name: 'Radha Raman Ji', slug: 'radha-raman-ji', image: '/Deities/Radharamanji.png' },
  { id: 5, name: 'Shiv Ji', slug: 'shiv-ji', image: '/Deities/ShivJi.png' },
  { id: 6, name: 'Shri Ram', slug: 'shri-ram', image: '/Deities/Shriram.png' }
];

interface DeitiesCarouselProps {
  deities?: any[];
}

export const DeitiesCarousel: React.FC<DeitiesCarouselProps> = ({ deities: apiDeities }) => {
  const displayDeities = apiDeities && apiDeities.length > 0 ? apiDeities : defaultDeities;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Determine how many items to show based on screen size
  const [itemsToShow, setItemsToShow] = useState(4);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) setItemsToShow(1);
      else if (window.innerWidth < 768) setItemsToShow(2);
      else if (window.innerWidth < 1024) setItemsToShow(3);
      else setItemsToShow(4);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const maxIndex = Math.max(0, displayDeities.length - itemsToShow);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : maxIndex));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < maxIndex ? prev + 1 : 0));
  };

  useEffect(() => {
    if (displayDeities.length <= itemsToShow || isPaused) return;

    const interval = setInterval(() => {
      handleNext();
    }, 3500);

    return () => clearInterval(interval);
  }, [itemsToShow, displayDeities.length, isPaused, maxIndex]);

  // Touch Swipe Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 40;

    if (distance > minSwipeDistance) {
      handleNext();
    } else if (distance < -minSwipeDistance) {
      handlePrev();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const getImageSrc = (deity: any) => {
    if (deity.image && deity.image.trim()) return deity.image;
    const nameLower = (deity.name || '').toLowerCase();
    if (nameLower.includes('ganesh')) return '/Deities/Ganesh.png';
    if (nameLower.includes('krishna')) return '/Deities/Krishna.png';
    if (nameLower.includes('durga')) return '/Deities/MataDurga.png';
    if (nameLower.includes('radha')) return '/Deities/Radharamanji.png';
    if (nameLower.includes('shiv')) return '/Deities/ShivJi.png';
    if (nameLower.includes('ram')) return '/Deities/Shriram.png';
    return '/Deities/Krishna.png';
  };

  return (
    <div
      className="relative w-full group/carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Left Navigation Arrow (50% on image, 50% outside) */}
      {displayDeities.length > itemsToShow && (
        <button
          onClick={handlePrev}
          className="absolute left-2.5 -translate-x-1/2 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white text-darkBrown hover:bg-saffron hover:text-white shadow-xl border border-gray-100 flex items-center justify-center transition-all duration-300 cursor-pointer"
          aria-label="Previous Slide"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Right Navigation Arrow (50% on image, 50% outside) */}
      {displayDeities.length > itemsToShow && (
        <button
          onClick={handleNext}
          className="absolute right-2.5 translate-x-1/2 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white text-darkBrown hover:bg-saffron hover:text-white shadow-xl border border-gray-100 flex items-center justify-center transition-all duration-300 cursor-pointer"
          aria-label="Next Slide"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Items Slider Track */}
      <div className="overflow-hidden w-full rounded-2xl">
        <div
          className="flex transition-transform duration-700 ease-out"
          style={{
            transform: `translateX(-${currentIndex * (100 / itemsToShow)}%)`
          }}
        >
          {displayDeities.map((deity: any) => (
            <div key={deity.id || deity.name} className="px-2.5 shrink-0" style={{ width: `${100 / itemsToShow}%` }}>
              <Link
                to={`/gods/${deity.slug || deity.id}`}
                className="group block relative w-full aspect-square rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-black/5 hover:border-saffron/40 cursor-pointer"
              >
                {/* Background Image */}
                <img
                  src={getImageSrc(deity)}
                  alt={deity.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />

                {/* Dark Overlay for contrast */}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>

                {/* Tag at bottom center */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm px-4 py-1.5 rounded-md shadow-md group-hover:bg-saffron transition-colors">
                  <span className="text-darkBrown group-hover:text-white font-bold text-xs tracking-wide uppercase whitespace-nowrap transition-colors">
                    {deity.name}
                  </span>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Dots */}
      {displayDeities.length > itemsToShow && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                currentIndex === idx ? 'w-8 bg-saffron' : 'w-2.5 bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
