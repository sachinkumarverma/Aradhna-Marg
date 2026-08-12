import { useState, useEffect, useRef } from 'react';

export const useAutoScroll = () => {
  const [isScrolling, setIsScrolling] = useState(false);
  const [speed, setSpeed] = useState<1 | 2 | 3>(1);
  const scrollRef = useRef<number | null>(null);

  const toggleScroll = () => setIsScrolling(!isScrolling);
  const changeSpeed = (newSpeed: 1 | 2 | 3) => setSpeed(newSpeed);

  useEffect(() => {
    if (isScrolling) {
      const step = () => {
        window.scrollBy(0, speed);
        // Stop if hit bottom
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
          setIsScrolling(false);
          return;
        }
        scrollRef.current = requestAnimationFrame(step);
      };
      scrollRef.current = requestAnimationFrame(step);
    }

    return () => {
      if (scrollRef.current) cancelAnimationFrame(scrollRef.current);
    };
  }, [isScrolling, speed]);

  return {
    isScrolling,
    speed,
    toggleScroll,
    changeSpeed
  };
};
