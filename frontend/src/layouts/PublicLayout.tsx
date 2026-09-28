import React, { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from '@components/common/Navbar';
import { Footer } from '@components/common/Footer';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center bg-cream">
    <Loader2 className="w-10 h-10 animate-spin text-saffron" />
  </div>
);

export const PublicLayout: React.FC = () => {
  const location = useLocation();
  const mainRef = React.useRef<HTMLElement>(null);

  // Automatically scroll to the top of the main container when navigating to a new route
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="h-screen w-full flex flex-col bg-[#F9F7F3] font-sans text-darkBrown selection:bg-saffron/20 selection:text-saffron overflow-hidden">
      <Navbar containerRef={mainRef} />

      <main ref={mainRef} className="flex-1 flex flex-col w-full relative z-0 overflow-y-auto overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="flex-1 flex flex-col w-full"
          >
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          </motion.div>
        </AnimatePresence>
        <Footer />
      </main>
    </div>
  );
};
