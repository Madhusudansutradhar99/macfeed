import React from 'react';
import { motion } from 'framer-motion';

export function SkeletonVideoCard({ count = 3 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl overflow-hidden bg-white/5 border border-white/10 group cursor-pointer"
        >
          {/* Thumbnail */}
          <div className="relative w-full pt-[56.25%] bg-gradient-to-r from-white/10 to-white/5 overflow-hidden">
            <motion.div
              className="absolute inset-0"
              animate={{
                backgroundPosition: ['200% 0', '-200% 0']
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
                backgroundSize: '200% 100%'
              }}
            />
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            {/* Title skeleton */}
            <div className="space-y-2">
              <motion.div
                className="h-3 bg-gradient-to-r from-white/10 to-white/5 rounded-full"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <motion.div
                className="h-3 bg-gradient-to-r from-white/10 to-white/5 rounded-full w-3/4"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 }}
              />
            </div>

            {/* Stats skeleton */}
            <div className="flex gap-2">
              <motion.div
                className="h-2 bg-gradient-to-r from-white/10 to-white/5 rounded-full flex-1"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
              />
            </div>
          </div>
        </motion.div>
      ))}
    </>
  );
}

export function SkeletonMusicCard({ count = 3 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="flex gap-3 p-3 rounded-xl bg-white/5 border border-white/10"
        >
          {/* Album art */}
          <motion.div
            className="w-12 h-12 md:w-16 md:h-16 rounded-lg bg-gradient-to-r from-white/10 to-white/5 flex-shrink-0"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />

          {/* Info */}
          <div className="flex-1 space-y-2">
            <motion.div
              className="h-3 bg-gradient-to-r from-white/10 to-white/5 rounded-full w-2/3"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 }}
            />
            <motion.div
              className="h-2 bg-gradient-to-r from-white/10 to-white/5 rounded-full w-1/2"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
            />
          </div>
        </motion.div>
      ))}
    </>
  );
}

export function SkeletonList({ count = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="h-12 bg-gradient-to-r from-white/10 to-white/5 rounded-lg"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.05 }}
        />
      ))}
    </div>
  );
}
