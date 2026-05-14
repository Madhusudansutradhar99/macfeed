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
          <div className="bg-secondary/95 backdrop-blur-3xl border border-white/10 p-2 pl-3 rounded-2xl shadow-2xl flex items-center justify-between gap-4" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
             <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--accent-color)', color: 'var(--text-on-accent)' }}>
                   <Download className="w-5 h-5" />
                </div>
                <div className="overflow-hidden">
                   <h3 className="text-primary font-black uppercase italic tracking-tighter text-[10px] leading-tight truncate">Install Pro</h3>
                   <p className="text-[8px] text-secondary font-bold uppercase tracking-widest opacity-60 truncate">Full Experience</p>
                </div>
             </div>

             <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={handleInstall}
                  className="px-4 py-2 rounded-lg font-black uppercase text-[9px] tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
                  style={{ backgroundColor: 'var(--accent-color)', color: 'var(--text-on-accent)' }}
                >
                  <Sparkles className="w-3 h-3" /> INSTALL
                </button>
                <button
                  onClick={() => setIsVisible(false)}
                  className="p-2 text-secondary hover:text-primary transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
             </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
