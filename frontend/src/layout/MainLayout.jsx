import React from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ErrorBoundary from '../components/ErrorBoundary';

const MainLayout = () => {
  const location = useLocation();

  // Shorts & Music pages are immersive — different layout
  if (location.pathname === '/shorts' || location.pathname === '/music') {
    return (
      <div className="min-h-screen bg-primary text-primary overflow-hidden">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-primary text-primary overflow-x-hidden">
      <Header />
      <div className="flex flex-1 relative min-w-0">
        <Sidebar />
        <main className="flex-1 p-2 sm:p-4 pt-4 sm:pt-4 md:p-6 md:pt-6 overflow-y-auto overflow-x-hidden">
          <ErrorBoundary resetKey={location.pathname}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15, ease: 'circOut' }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
