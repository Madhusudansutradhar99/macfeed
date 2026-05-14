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
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-10 z-[5000] max-w-sm"
        >
          <div className="bg-secondary/90 backdrop-blur-3xl border border-accent/20 p-3 sm:p-4 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center sm:justify-between gap-3 sm:gap-4" style={{ borderColor: 'var(--accent-color)' }}>
             <div className="flex items-center justify-between w-full sm:w-auto">
                <div className="flex items-center gap-2">
                   <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shadow-lg shadow-accent/20 shrink-0" style={{ backgroundColor: 'var(--accent-color)', color: 'var(--text-on-accent)' }}>
                      <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                   </div>
                   <div>
                      <h3 className="text-primary font-black uppercase italic tracking-tighter text-[10px] sm:text-xs">Install MacFeed Pro</h3>
                      <p className="text-[8px] sm:text-[9px] text-secondary font-bold uppercase tracking-widest opacity-60">Experience full screen power</p>
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
                   className="w-full sm:w-auto px-4 py-2 rounded-lg font-black uppercase text-[9px] tracking-widest shadow-xl hover:scale-105 transition-all active:scale-95 flex items-center justify-center gap-2"
                   style={{ backgroundColor: 'var(--accent-color)', color: 'var(--text-on-accent)' }}
                 >
                   <Sparkles className="w-2.5 h-2.5" /> INSTALL
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
