import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, AlertCircle } from 'lucide-react';

export default function OfflineStatus() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
        setIsOffline(false);
        setShow(false);
    };
    const handleOffline = () => {
        setIsOffline(true);
        setShow(true);
        setTimeout(() => setShow(false), 2000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-0 left-0 right-0 z-[10000] p-4 flex justify-center pointer-events-none"
        >
          <div className="bg-red-500/90 backdrop-blur-xl border border-white/20 px-8 py-3 rounded-full shadow-2xl flex items-center gap-4 pointer-events-auto">
             <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                <WifiOff className="w-4 h-4 text-white" />
             </div>
             <div className="flex flex-col">
                <span className="text-white font-black uppercase italic tracking-widest text-[10px]">Connection Lost</span>
                <span className="text-white/60 text-[8px] font-bold uppercase tracking-widest">Entering Offline Mode</span>
             </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
