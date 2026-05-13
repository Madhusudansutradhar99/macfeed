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
    // Ensure body can always scroll and match the midnight theme
    document.body.style.overflowY = 'auto';
    document.body.style.backgroundColor = '#000000';
  }, []);

  // Music page is immersive
  if (location.pathname === '/music') {
    return (
      <div className="fixed inset-0 bg-[#000000] text-white overflow-hidden">
        <div className="w-full h-full overflow-y-auto no-scrollbar">
          <Outlet />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#000000] text-white overflow-x-hidden relative">
      <Header />
      <div className="flex flex-1 relative min-w-0">
        <Sidebar />
        <main className="flex-1 p-2 sm:p-4 pt-20 md:p-6 md:pt-24">
          <ErrorBoundary resetKey={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
