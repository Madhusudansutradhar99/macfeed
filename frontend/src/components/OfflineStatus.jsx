import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi } from 'lucide-react';

export default function OfflineStatus() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [show, setShow] = useState(!navigator.onLine);
  const [message, setMessage] = useState('You are offline — showing cached content');
  const hideTimerRef = React.useRef(null);
  const refreshTimerRef = React.useRef(null);

  const showBanner = (nextMessage, offline) => {
    setIsOffline(offline);
    setMessage(nextMessage);
    setShow(true);

    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);

    hideTimerRef.current = setTimeout(() => setShow(false), 2000);
  };

  useEffect(() => {
    const handleOnline = () => {
      showBanner('Back online!', false);
    };

    const handleOffline = () => {
      showBanner('You are offline — showing cached content', true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.2 }}
          className="fixed top-0 left-0 right-0 z-[10000] p-4 flex justify-center pointer-events-none"
        >
          <motion.div 
            className={`${isOffline ? 'bg-red-500/90' : 'bg-green-500/90'} backdrop-blur-xl border border-white/20 px-6 md:px-8 py-3 rounded-full shadow-2xl flex items-center gap-3 pointer-events-auto will-change-transform`}
            transition={{ duration: 0.2 }}
          >
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              {isOffline ? (
                <WifiOff className="w-4 h-4 text-white" />
              ) : (
                <Wifi className="w-4 h-4 text-white" />
              )}
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-white font-black uppercase italic tracking-widest text-[10px]">
                {isOffline ? 'Offline Mode' : 'Back Online'}
              </span>
              <span className="text-white/80 text-[8px] font-bold uppercase tracking-widest">
                {message}
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

