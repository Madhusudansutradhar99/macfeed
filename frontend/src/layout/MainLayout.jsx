import React, { Suspense } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import FloatingPromptBar from '../components/FloatingPromptBar';
import { Outlet, useLocation } from 'react-router-dom';
import ErrorBoundary from '../components/ErrorBoundary';
import Loader from '../components/Loader';
import { X } from 'lucide-react';

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
      <div className="fixed inset-0 bg-gradient-to-br from-[#08182b] via-[#0d2847] to-[#091c33] text-white overflow-hidden">
        <Header />
        <div className="w-full h-full overflow-hidden relative z-10 pt-[64px]">
          <Outlet />
        </div>
      </div>
    );
  }

  const isWatchPage = location.pathname.startsWith('/watch/');
  const isShortsPage = location.pathname === '/shorts';

  return (
    <div className="w-full min-h-screen flex flex-col text-white bg-gradient-to-br from-[#08182b] via-[#0d2847] to-[#091c33] relative overflow-x-hidden">
      {/* ── Fixed Light Blue Glassmorphic Ambient Atmosphere ── */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        {/* Soft Sky Blue Frosted Glass Orb (Top Left) */}
        <div className="absolute -top-[15%] -left-[10%] w-[750px] h-[750px] rounded-full bg-sky-400/[0.22] blur-[160px]" />
        {/* Electric Cyan Ambient Glass Orb (Top Right) */}
        <div className="absolute top-[8%] -right-[8%] w-[700px] h-[700px] rounded-full bg-cyan-400/[0.20] blur-[150px]" />
        {/* Light Azure Frosted Orb (Center) */}
        <div className="absolute top-[35%] left-[20%] w-[850px] h-[850px] rounded-full bg-blue-300/[0.12] blur-[180px]" />
        {/* Deep Ocean Glass Orb (Bottom Left) */}
        <div className="absolute top-[60%] -left-[5%] w-[800px] h-[800px] rounded-full bg-sky-500/[0.18] blur-[180px]" />
        {/* Luminous Royal Azure Orb (Bottom Center) */}
        <div className="absolute top-[80%] left-[25%] w-[900px] h-[900px] rounded-full bg-blue-600/[0.22] blur-[200px]" />
        {/* Crystalline Light Specular Highlight */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(186,230,253,0.12)_0%,_transparent_70%)]" />
      </div>

      <Header />
      <div className="flex flex-1 relative min-w-0 w-full z-10">
        <Sidebar />
        <main id="main-content" className="flex-1 min-w-0 w-full pt-[68px] bg-transparent">
          <div className={location.pathname === '/' ? 'p-0 pb-[120px]' : 'p-2 sm:p-4 md:p-6 pb-[120px]'}>
            <ErrorBoundary resetKey={location.pathname}>
              <Suspense fallback={<Loader subtle={location.pathname !== '/'} />}>
                <Outlet />
              </Suspense>
            </ErrorBoundary>
          </div>
        </main>
      </div>

      {/* Floating Prompt Bar (visible on explore, movies, series, search, etc.) */}
      {!isWatchPage && !isShortsPage && <FloatingPromptBar />}

      <BottomNav />

      {/* Premium Digen Info Modal */}
      {infoModal.isOpen && (
        <div className="fixed inset-0 z-[8000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-all duration-300">
          <div className="w-full max-w-md rounded-2xl p-6 bg-[#14161f] shadow-2xl relative border border-white/10 flex flex-col gap-4">
            <button 
              onClick={() => setInfoModal({ isOpen: false, title: '', content: '' })}
              className="absolute top-5 right-5 text-white/40 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-black uppercase tracking-wider text-[#f5b700] border-b border-white/10 pb-3">
              {infoModal.title}
            </h3>
            <div className="text-white/80 text-xs md:text-sm font-medium leading-relaxed whitespace-pre-wrap py-2">
              {infoModal.content}
            </div>
            <button
              onClick={() => setInfoModal({ isOpen: false, title: '', content: '' })}
              className="mt-2 w-full py-2.5 rounded-xl font-bold uppercase text-xs tracking-wider bg-white text-black hover:bg-gray-200 transition-all"
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
