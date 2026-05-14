import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Sparkles } from 'lucide-react';

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Only show if not already installed
      if (!window.matchMedia('(display-mode: standalone)').matches) {
        setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the PWA install prompt');
    }
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-6 right-6 md:left-auto md:right-10 z-[5000] max-w-md"
        >
          <div className="bg-secondary/80 backdrop-blur-2xl border border-accent/30 p-4 sm:p-6 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col sm:flex-row items-center sm:justify-between gap-4 sm:gap-6" style={{ borderColor: 'var(--accent-color)' }}>
             <div className="flex items-center justify-between w-full sm:w-auto">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-accent/20 shrink-0" style={{ backgroundColor: 'var(--accent-color)', color: 'var(--text-on-accent)' }}>
                     <Download className="w-5 h-5 sm:w-7 sm:h-7" />
                  </div>
                  <div>
                     <h3 className="text-primary font-black uppercase italic tracking-tighter text-[11px] sm:text-sm">Install MacFeed Pro</h3>
                     <p className="text-[9px] sm:text-[10px] text-secondary font-bold uppercase tracking-widest opacity-60">Experience full screen power</p>
                  </div>
               </div>
               {/* Mobile Close Button */}
               <button
                  onClick={() => setIsVisible(false)}
                  className="sm:hidden p-2 text-secondary hover:text-primary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
             </div>

             <div className="flex items-center w-full sm:w-auto gap-2">
                <button
                  onClick={handleInstall}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:scale-105 transition-all active:scale-95 flex items-center justify-center gap-2"
                  style={{ backgroundColor: 'var(--accent-color)', color: 'var(--text-on-accent)' }}
                >
                  <Sparkles className="w-3 h-3" /> INSTALL
                </button>
                {/* Desktop Close Button */}
                <button
                  onClick={() => setIsVisible(false)}
                  className="hidden sm:block p-3 text-secondary hover:text-primary transition-colors shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
             </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
