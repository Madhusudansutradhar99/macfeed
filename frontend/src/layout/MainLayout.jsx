import React from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ErrorBoundary from '../components/ErrorBoundary';
import { RefreshCw } from 'lucide-react';

const MainLayout = () => {
  const location = useLocation();

  React.useEffect(() => {
    // Ensure full viewport coverage and no scrollbar issues on mobile
    document.body.style.overflow = 'hidden';
    document.body.style.backgroundColor = 'var(--bg-primary)';
    document.documentElement.style.backgroundColor = 'var(--bg-primary)';
    document.documentElement.style.overflow = 'hidden';
  }, []);

  // Music page is immersive
  if (location.pathname === '/music') {
    return (
      <div className="fixed inset-0 bg-primary text-primary overflow-hidden">
        <div className="w-full h-full overflow-y-auto no-scrollbar">
          <Outlet />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col text-primary overflow-hidden fixed inset-0" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Header />
      <div className="flex flex-1 relative min-w-0 w-full overflow-hidden">
        <Sidebar />
        <main id="main-content" className="flex-1 min-w-0 w-full overflow-y-auto overflow-x-hidden pt-20" style={{ backgroundColor: 'var(--bg-primary)' }}>
          <div className="p-2 sm:p-4 md:p-6">
            <ErrorBoundary resetKey={location.pathname}>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
