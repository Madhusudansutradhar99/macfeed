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
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-6 bg-black/20 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] w-full max-w-[320px] overflow-hidden relative border border-white/20"
          >
            <button 
              onClick={() => setIsVisible(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-black/10 flex items-center justify-center text-black/40 hover:bg-black/20 transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-10 flex flex-col items-center text-center">
               <img src="/apple-logo.png" className="w-20 h-20 mb-6 drop-shadow-xl" alt="MacFeed" />
               
               <h3 className="text-[#1e3a8a] text-2xl font-black uppercase italic tracking-tighter mb-1">MacFeed</h3>
               <p className="text-[#3b82f6] text-xs font-bold uppercase tracking-widest opacity-60 mb-8">Your Entertainment Hub</p>

               <button
                 onClick={handleInstall}
                 className="w-full bg-[#facc15] hover:bg-[#eab308] text-[#1e3a8a] py-4 rounded-2xl font-black uppercase text-sm tracking-widest transition-all active:scale-95 shadow-[0_10px_20px_rgba(250,204,21,0.3)]"
               >
                 Watch Now
               </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
