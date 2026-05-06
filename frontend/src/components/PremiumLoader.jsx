import React from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';

export default function PremiumLoader() {
  return createPortal(
    <div className="fixed inset-0 bg-[#000000] z-[99999] flex flex-col items-center justify-center overflow-hidden">
      {/* Background Glow */}
      <div className="absolute w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-purple-600/10 blur-[100px] sm:blur-[150px] rounded-full animate-pulse" />
      
      {/* Mobile-optimized scaling container */}
      <div className="relative transform scale-75 sm:scale-100 flex flex-col items-center">
        <div className="relative">
          {/* Outer Ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
            className="w-24 h-24 rounded-full border-2 border-white/5 border-t-purple-500 border-r-blue-500 shadow-[0_0_50px_rgba(168,85,247,0.3)]"
            style={{ transformZ: 0 }}
          />
          
          {/* Middle Ring */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            className="absolute inset-4 rounded-full border-2 border-white/5 border-b-blue-400 border-l-purple-400"
            style={{ transformZ: 0 }}
          />
          
          {/* Logo/Center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.img
              src="/macfeed-logo.png"
              alt="Logo"
              animate={{ 
                scale: [1, 1.15, 1],
                opacity: [0.8, 1, 0.8] 
              }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="w-10 h-10 object-contain"
            />
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center">
          <motion.h2 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-white font-black text-2xl tracking-[0.4em] italic uppercase text-center"
          >
            MACFEED <span className="text-purple-500">PRO</span>
          </motion.h2>
          <div className="mt-4 w-48 h-[2px] bg-white/5 relative overflow-hidden rounded-full">
            <motion.div
              animate={{ left: ["-100%", "100%"] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-purple-500 to-transparent"
            />
          </div>
          <p className="mt-6 text-[10px] font-black uppercase tracking-[0.5em] text-white/20">Establishing Secure Sync</p>
        </div>
      </div>
    </div>,
    document.body
  );
}
