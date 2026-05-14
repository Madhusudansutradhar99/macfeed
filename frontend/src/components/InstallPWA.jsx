import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!window.matchMedia('(display-mode: standalone)').matches) {
        setIsVisible(true);
      }
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-black/20 backdrop-blur-sm"
        >
          <div className="relative w-full max-w-[320px] bg-white rounded-[3rem] p-10 shadow-[0_30px_100px_rgba(0,0,0,0.3)] flex flex-col items-center text-center gap-6 border border-gray-100">
            <button 
              onClick={() => setIsVisible(false)}
              className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-all"
            >
              <X size={16} />
            </button>

            <img src="/apple-logo.png" className="w-20 h-20 object-contain" alt="MacFeed" />
            
            <div className="flex flex-col gap-1">
              <h3 className="text-blue-900 text-2xl font-black tracking-tight">MacFeed</h3>
              <p className="text-blue-400 text-[11px] font-bold uppercase tracking-widest">Your Entertainment Hub</p>
            </div>

            <button
              onClick={handleInstall}
              className="w-full py-4 bg-yellow-400 text-blue-900 rounded-2xl font-black uppercase text-[12px] tracking-widest shadow-xl shadow-yellow-400/20 hover:scale-105 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              Watch Now
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
