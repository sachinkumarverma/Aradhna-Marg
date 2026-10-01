import React, { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from '@components/common/Navbar';
import { Footer } from '@components/common/Footer';
import { CustomLoader } from '@components/common/CustomLoader';
import { motion, AnimatePresence } from 'framer-motion';

const PageLoader = () => <CustomLoader fullScreen />;

export const PublicLayout: React.FC = () => {
  const location = useLocation();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [location.pathname]);

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#F9F7F3] font-sans text-darkBrown selection:bg-saffron/20 selection:text-saffron">
      <Navbar />

      <main className="flex-1 flex flex-col w-full relative z-0">
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
      </main>

      <Footer />
    </div>
  );
};
