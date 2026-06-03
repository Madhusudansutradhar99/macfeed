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
          className="fixed inset-0 z-[999999] bg-[#020205] flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Central Animation Container */}
          <div className="relative flex flex-col items-center">
            {/* Pulsing Background Glow */}
            <motion.div 
              animate={{ 
                scale: [1, 1.15, 1],
                opacity: [0.25, 0.5, 0.25]
              }}
              transition={{ repeat: Infinity, duration: 2.0, ease: "easeInOut" }}
              className="absolute w-[260px] h-[260px] bg-blue-600/20 blur-[90px] rounded-full"
            />

            {/* Glowing Circular SVG Logo Animation */}
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.0, ease: "easeOut" }}
              className="relative z-10 flex items-center justify-center"
            >
              <svg viewBox="0 0 100 100" className="w-36 h-36 md:w-40 md:h-40 object-contain drop-shadow-[0_0_35px_rgba(59,130,246,0.85)] animate-pulse" style={{ animationDuration: '3s' }}>
                {/* Outer Glow (Large Blue blur) */}
                <path 
                  d="M 41.5 78.5 A 30 30 0 1 1 58.5 78.5 C 55 81.5, 51.5 83, 50 83 C 48.5 83, 45 81.5, 41.5 78.5"
                  fill="none" 
                  stroke="#2563eb" 
                  strokeWidth="12" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className="opacity-40 blur-[8px]"
                />
                <line 
                  x1="50" y1="81" x2="50" y2="52" 
                  stroke="#2563eb" 
                  strokeWidth="14" 
                  strokeLinecap="round"
                  className="opacity-40 blur-[8px]"
                />
                <circle 
                  cx="50" cy="50" r="7.5" 
                  fill="#2563eb"
                  className="opacity-40 blur-[8px]"
                />

                {/* Mid Glow (Cyan/Light Blue medium blur) */}
                <path 
                  d="M 41.5 78.5 A 30 30 0 1 1 58.5 78.5 C 55 81.5, 51.5 83, 50 83 C 48.5 83, 45 81.5, 41.5 78.5"
                  fill="none" 
                  stroke="#3b82f6" 
                  strokeWidth="7" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className="opacity-75 blur-[2.5px]"
                />
                <line 
                  x1="50" y1="81" x2="50" y2="52" 
                  stroke="#3b82f6" 
                  strokeWidth="8.5" 
                  strokeLinecap="round"
                  className="opacity-75 blur-[2.5px]"
                />
                <circle 
                  cx="50" cy="50" r="6" 
                  fill="#3b82f6"
                  className="opacity-75 blur-[2.5px]"
                />

                {/* Sharp Foreground (White) */}
                <path 
                  d="M 41.5 78.5 A 30 30 0 1 1 58.5 78.5 C 55 81.5, 51.5 83, 50 83 C 48.5 83, 45 81.5, 41.5 78.5"
                  fill="none" 
                  stroke="#ffffff" 
                  strokeWidth="3.2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
                <line 
                  x1="50" y1="81" x2="50" y2="52" 
                  stroke="#ffffff" 
                  strokeWidth="4.5" 
                  strokeLinecap="round"
                />
                <circle 
                  cx="50" cy="50" r="4.2" 
                  fill="#ffffff"
                />
              </svg>
            </motion.div>

            {/* Text Animation */}
            <div className="mt-10 overflow-hidden">
              <motion.h1
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.7 }}
                className="text-white text-xl md:text-2xl font-black uppercase tracking-[0.25em] text-center"
              >
                Welcome to <span className="text-[#0ea5e9]">MacFeed</span>
              </motion.h1>
            </div>
          </div>

          {/* Bottom Branding */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ delay: 1.0 }}
            className="absolute bottom-12 flex flex-col items-center gap-2"
          >
             <div className="w-1 h-1 rounded-full bg-blue-500 animate-ping" />
             <span className="text-[7px] text-white/30 font-black uppercase tracking-widest">v3.0.6 Premium</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
