import React from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ErrorBoundary from '../components/ErrorBoundary';
import { RefreshCw } from 'lucide-react';

const MainLayout = () => {
  const location = useLocation();
  const [refreshing, setRefreshing] = React.useState(false);
  const [pullDist, setPullDist] = React.useState(0);
  const touchStart = React.useRef(0);

  const allowedRoutes = ['/', '/music', '/sports', '/search'];
  const isAllowed = (allowedRoutes.includes(location.pathname) || location.pathname.startsWith('/search')) && !location.pathname.startsWith('/watch');

  React.useEffect(() => {
    // Ensure body can always scroll
    document.body.style.overflowY = 'auto';
    document.body.style.overscrollBehaviorY = isAllowed ? 'contain' : 'auto';
  }, [isAllowed]);

  const handleTouchStart = (e) => {
    if (!isAllowed || window.scrollY > 0) return;
    touchStart.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    if (!isAllowed || window.scrollY > 0 || refreshing) return;
    const dist = e.touches[0].clientY - touchStart.current;
    if (dist > 0) {
      setPullDist(Math.min(dist * 0.4, 80));
    }
  };

  const handleTouchEnd = () => {
    if (pullDist > 60) {
      setRefreshing(true);
      setPullDist(40);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      setPullDist(0);
    }
  };

  // Shorts & Music pages are immersive — different layout
  if (location.pathname === '/shorts' || location.pathname === '/music') {
    return (
      <div className="fixed inset-0 bg-primary text-primary overflow-hidden">
        <div className="scroll-container">
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
        <main className="flex-1 p-2 sm:p-4 pt-24 sm:pt-24 md:p-6 md:pt-24">
          <ErrorBoundary resetKey={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
