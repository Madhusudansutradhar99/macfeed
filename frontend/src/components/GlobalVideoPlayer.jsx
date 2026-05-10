import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoMiniPlayer } from '../context/VideoPlayerContext';
import VideoPlayer from './VideoPlayer';

export default function GlobalVideoPlayer() {
  const { activeVideo, viewMode, minimize, maximize, closePlayer, ytPlayerRef, setPlaying } = useVideoMiniPlayer();
  const navigate = useNavigate();
  const location = useLocation();
  const swipeStartRef = useRef(0);

  const isWatchPage = location.pathname.startsWith('/watch/');

  if (viewMode === 'closed' || !activeVideo) return null;

  const handleTouchStart = (e) => {
    swipeStartRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    const endY = e.changedTouches[0].clientY;
    if (viewMode === 'full' && endY - swipeStartRef.current > 80) {
      minimize();
    }
  };

  const handleRestore = () => {
    maximize();
    if (!isWatchPage) {
      navigate(`/watch/${activeVideo.id}`);
    }
  };

  const isMini = viewMode === 'mini';

  return (
    <AnimatePresence>
      <motion.div
        layout
        initial={false}
        animate={{ 
          width: isMini ? '180px' : '100vw',
          height: isMini ? '110px' : (isWatchPage ? 'auto' : '100vh'),
          right: isMini ? 20 : 0,
          bottom: isMini ? 100 : 0,
          top: isMini ? 'auto' : 0,
          left: isMini ? 'auto' : 0,
          borderRadius: isMini ? '16px' : 0,
          boxShadow: isMini ? '0 10px 40px rgba(0,0,0,0.6)' : 'none',
          zIndex: isMini ? 9999 : (isWatchPage ? 40 : 9999),
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        style={{
          position: 'fixed',
          backgroundColor: isMini ? '#000' : (isWatchPage ? 'transparent' : '#000'),
          overflow: 'hidden',
          pointerEvents: isMini ? 'auto' : (isWatchPage ? 'none' : 'auto'),
        }}
        onClick={() => isMini && handleRestore()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div style={{ 
          width: '100%', 
          height: isMini ? '100%' : 'auto', 
          aspectRatio: isMini ? 'auto' : '16/9',
          pointerEvents: 'auto',
          backgroundColor: '#000' // Ensure video area is black
        }}>
          <VideoPlayer 
            video={activeVideo} 
            viewMode={viewMode}
            onClose={closePlayer}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
