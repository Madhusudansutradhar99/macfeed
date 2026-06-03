import React, { Suspense } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import { Outlet, useLocation } from 'react-router-dom';
import ErrorBoundary from '../components/ErrorBoundary';
import Loader from '../components/Loader';
import { RefreshCw, X } from 'lucide-react';

const MainLayout = () => {
  const location = useLocation();
  const [infoModal, setInfoModal] = React.useState({ isOpen: false, title: '', content: '' });

  React.useEffect(() => {
    const handleOpenInfo = (e) => {
      setInfoModal({
        isOpen: true,
        title: e.detail.title,
        content: e.detail.content
      });
    };
    window.addEventListener('open-info-modal', handleOpenInfo);
    return () => window.removeEventListener('open-info-modal', handleOpenInfo);
  }, []);

  // Music page is immersive
  if (location.pathname === '/music') {
    return (
      <div className="fixed inset-0 bg-[#020205] text-primary overflow-hidden">
        {/* Global Shifting RGB glows behind music content */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="global-glow-1" />
          <div className="global-glow-2" />
          <div className="global-glow-3" />
        </div>
        <div className="w-full h-full overflow-hidden relative z-10 bg-transparent">
          <Outlet />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex flex-col text-primary bg-[#020205] relative overflow-x-hidden">
      
      {/* Global Premium Ambient Shifting RGB Glow Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="global-glow-1" />
        <div className="global-glow-2" />
        <div className="global-glow-3" />
      </div>

      <Header />
      <div className="flex flex-1 relative min-w-0 w-full z-10">
        <Sidebar />
        <main id="main-content" className="flex-1 min-w-0 w-full pt-[80px] bg-transparent">
          <div className={location.pathname === '/' ? 'p-0 pb-[100px] md:pb-6' : 'p-2 sm:p-4 md:p-6 pb-[100px] md:pb-6'}>
            <ErrorBoundary resetKey={location.pathname}>
              <Suspense fallback={<Loader subtle={location.pathname !== '/'} />}>
                <Outlet />
              </Suspense>
            </ErrorBoundary>
          </div>
        </main>
      </div>
      <BottomNav />

      {/* Premium Glassmorphic Info Modal */}
      {infoModal.isOpen && (
        <div className="fixed inset-0 z-[8000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md transition-all duration-300">
          <div className="w-full max-w-md rounded-3xl p-6 md:p-8 bg-[#0a0a0c]/95 backdrop-blur-2xl shadow-2xl relative border border-white/10 flex flex-col gap-4">
            <button 
              onClick={() => setInfoModal({ isOpen: false, title: '', content: '' })}
              className="absolute top-5 right-5 text-white/40 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base md:text-lg font-black uppercase tracking-widest text-[#f59e0b] italic border-b border-white/10 pb-3">
              {infoModal.title}
            </h3>
            <div className="text-white/70 text-xs md:text-sm font-medium leading-relaxed whitespace-pre-wrap py-2">
              {infoModal.content}
            </div>
            <button
              onClick={() => setInfoModal({ isOpen: false, title: '', content: '' })}
              className="mt-4 w-full py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest bg-gradient-to-r from-[#0ea5e9] to-[#00f2fe] text-black shadow-lg shadow-sky-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainLayout;
