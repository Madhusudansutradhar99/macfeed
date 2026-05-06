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
          <div className="bg-secondary/80 backdrop-blur-2xl border border-accent/30 p-6 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center justify-between gap-6" style={{ borderColor: 'var(--accent-color)' }}>
             <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-accent rounded-2xl flex items-center justify-center shadow-lg shadow-accent/20 shrink-0" style={{ backgroundColor: 'var(--accent-color)' }}>
                   <Download className="w-7 h-7 text-white" />
                </div>
                <div>
                   <h3 className="text-primary font-black uppercase italic tracking-tighter text-sm">Install MacFeed Pro</h3>
                   <p className="text-[10px] text-secondary font-bold uppercase tracking-widest opacity-60">Experience full screen power</p>
                </div>
             </div>

             <div className="flex items-center gap-2">
                <button
                  onClick={handleInstall}
                  className="bg-accent text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:scale-105 transition-all active:scale-95 flex items-center gap-2"
                  style={{ backgroundColor: 'var(--accent-color)' }}
                >
                  <Sparkles className="w-3 h-3" /> INSTALL
                </button>
                <button
                  onClick={() => setIsVisible(false)}
                  className="p-3 text-secondary hover:text-primary transition-colors"
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
