import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function StartupAnimation({ onComplete }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 400); // Allow exit animation to finish
    }, 1200);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[999999] bg-[#020617] flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Central Animation Container */}
          <div className="relative flex flex-col items-center">
            {/* Pulsing Background Glow */}
            <motion.div 
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              className="absolute w-[300px] h-[300px] bg-blue-600/30 blur-[100px] rounded-full"
            />

            {/* Logo Animation */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0, rotateY: 90 }}
              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="relative z-10"
            >
              <img 
                src="/macfeed-logo.png" 
                alt="MacFeed" 
                className="w-32 h-32 object-contain drop-shadow-[0_0_40px_rgba(59,130,246,0.6)]"
              />
            </motion.div>

            {/* Text Animation */}
            <div className="mt-8 overflow-hidden">
              <motion.h1
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="text-white text-4xl font-black italic tracking-tighter uppercase"
              >
                MAC<span className="text-blue-500">FEED</span>
              </motion.h1>
            </div>

            {/* Cinematic Progress Bar */}
            <div className="mt-6 w-40 h-[1px] bg-white/10 relative overflow-hidden rounded-full">
              <motion.div
                initial={{ left: "-100%" }}
                animate={{ left: "100%" }}
                transition={{ duration: 1.5, ease: "easeInOut", repeat: Infinity }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
              />
            </div>

            {/* Subtext */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-6 text-[10px] font-black text-white/20 uppercase tracking-[0.5em] italic"
            >
              Ultimate Entertainment Hub
            </motion.p>
          </div>

          {/* Bottom Branding */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 1.5 }}
            className="absolute bottom-12 flex flex-col items-center gap-2"
          >
             <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
             <span className="text-[8px] text-white/40 font-black uppercase tracking-widest">v2.5.0 Premium</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
