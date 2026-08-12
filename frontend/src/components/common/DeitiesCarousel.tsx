import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const deities = [
  { id: 1, name: 'Ganesh', image: '/Deities/Ganesh.png' },
  { id: 2, name: 'Krishna', image: '/Deities/Krishna.png' },
  { id: 3, name: 'Mata Durga', image: '/Deities/MataDurga.png' },
  { id: 4, name: 'Radha Raman Ji', image: '/Deities/Radharamanji.png' },
  { id: 5, name: 'Shiv Ji', image: '/Deities/ShivJi.png' },
  { id: 6, name: 'Shri Ram', image: '/Deities/Shriram.png' }
];

export const DeitiesCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Determine how many items to show based on screen size
  // Default to 1 on mobile, 2 on sm, 3 on md, 4 on lg
  const [itemsToShow, setItemsToShow] = useState(4);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) setItemsToShow(1);
      else if (window.innerWidth < 768) setItemsToShow(2);
      else if (window.innerWidth < 1024) setItemsToShow(3);
      else setItemsToShow(4);
    };

    handleResize(); // Init
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = prevIndex + 1;
        // If we reached the end of the sliding window, reset to 0
        if (nextIndex > deities.length - itemsToShow) {
          return 0;
        }
        return nextIndex;
      });
    }, 3000); // 3 seconds interval

    return () => clearInterval(interval);
  }, [itemsToShow]);

  return (
    <div className="relative w-full overflow-hidden">
      <div
        ref={containerRef}
        className="flex transition-transform duration-700 ease-in-out"
        style={{
          transform: `translateX(-${currentIndex * (100 / itemsToShow)}%)`
        }}
      >
        {deities.map((deity) => (
          <div key={deity.id} className="px-3 shrink-0" style={{ width: `${100 / itemsToShow}%` }}>
            <div className="relative w-full aspect-[3/2] rounded-3xl overflow-hidden shadow-md group cursor-pointer">
              {/* Background Image */}
              <img
                src={deity.image}
                alt={deity.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />

              {/* Dark Overlay for contrast */}
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>

              {/* White Pill at bottom center */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white px-6 py-2 rounded-full shadow-lg">
                <span className="text-darkBrown font-bold text-sm tracking-wide uppercase whitespace-nowrap">
                  {deity.name}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Optional Dots for Navigation */}
      <div className="flex justify-center gap-2 mt-6">
        {Array.from({ length: Math.max(1, deities.length - itemsToShow + 1) }).map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`w-2.5 h-2.5 rounded-full transition-colors ${
              currentIndex === idx ? 'bg-saffron' : 'bg-gray-300'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
