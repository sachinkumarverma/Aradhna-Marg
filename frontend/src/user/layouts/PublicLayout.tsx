import React, { Suspense, useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigationType } from 'react-router-dom';
import { Navbar } from '@components/common/Navbar';
import { Footer } from '@components/common/Footer';
import { CustomLoader } from '@components/common/CustomLoader';
import { motion, AnimatePresence } from 'framer-motion';

const PageLoader = () => <CustomLoader fullScreen />;

// In-memory scroll position store keyed by location.key and pathname
interface ScrollRecord {
  top: number;
  isBottom: boolean;
}
const scrollPositions = new Map<string, ScrollRecord>();

export const PublicLayout: React.FC = () => {
  const location = useLocation();
  const navigationType = useNavigationType();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isRestoringRef = useRef(false);

  // Handle scroll restoration on navigation
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    if (navigationType === 'POP') {
      const saved = scrollPositions.get(location.key) ?? scrollPositions.get(location.pathname);
      const targetTop = saved?.top ?? 0;
      const wasAtBottom = saved?.isBottom ?? false;

      isRestoringRef.current = true;

      const performScroll = () => {
        if (!scrollContainerRef.current) return;
        const el = scrollContainerRef.current;
        if (wasAtBottom) {
          el.scrollTo({ top: el.scrollHeight, left: 0, behavior: 'instant' as ScrollBehavior });
        } else {
          el.scrollTo({ top: targetTop, left: 0, behavior: 'instant' as ScrollBehavior });
        }
      };

      // 1. Instant execution
      performScroll();

      // 2. Multi-stage timeouts to handle async content & animations
      const t1 = setTimeout(performScroll, 50);
      const t2 = setTimeout(performScroll, 150);
      const t3 = setTimeout(performScroll, 300);
      const t4 = setTimeout(performScroll, 500);

      // 3. ResizeObserver during initial 600ms mount window
      let resizeObserver: ResizeObserver | null = null;
      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => {
          if (isRestoringRef.current) {
            performScroll();
          }
        });
        resizeObserver.observe(container);
      }

      const releaseTimer = setTimeout(() => {
        isRestoringRef.current = false;
        if (resizeObserver) {
          resizeObserver.disconnect();
        }
      }, 650);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
        clearTimeout(releaseTimer);
        if (resizeObserver) {
          resizeObserver.disconnect();
        }
        isRestoringRef.current = false;
      };
    } else {
      // Forward navigation: scroll to top
      container.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    }
  }, [location.key, location.pathname, navigationType]);

  // Continuously record scroll position of the current active page
  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Don't overwrite saved records while restoration is running
    if (isRestoringRef.current) return;

    const top = container.scrollTop;
    const maxScroll = container.scrollHeight - container.clientHeight;
    const isBottom = maxScroll > 0 && top >= maxScroll - 80;

    scrollPositions.set(location.key, { top, isBottom });
    scrollPositions.set(location.pathname, { top, isBottom });
  };

  return (
    <div className="h-screen w-full flex flex-col bg-[#F9F7F3] font-sans text-darkBrown selection:bg-saffron/20 selection:text-saffron overflow-hidden">
      <Navbar containerRef={scrollContainerRef} />

      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 w-full overflow-y-auto overflow-x-hidden flex flex-col main-scroll-container"
      >
        <main className="flex-1 w-full relative z-0 flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="flex-1 w-full flex flex-col"
            >
              <div className="flex-1 w-full">
                <Suspense fallback={<PageLoader />}>
                  <Outlet />
                </Suspense>
              </div>

              <Footer />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};
