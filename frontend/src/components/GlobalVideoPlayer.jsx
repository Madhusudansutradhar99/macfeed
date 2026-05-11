import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useMatch } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoMiniPlayer } from '../context/VideoPlayerContext';
import VideoPlayer from './VideoPlayer';

export default function GlobalVideoPlayer() {
  const { activeVideo, viewMode, minimize, maximize, closePlayer, playNext } = useVideoMiniPlayer();
  const navigate = useNavigate();
  const location = useLocation();
  const watchMatch = useMatch('/watch/:id');
  const swipeStartRef = useRef(0);

  // Robust path checking
  const isWatchPage = !!watchMatch || location.pathname.includes('/watch/') || window.location.hash.includes('/watch/');

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
    if (!isWatchPage) {
      navigate(`/watch/${activeVideo.id}`);
    }
    maximize();
  };

  const isMini = viewMode === 'mini';

  return (
    <motion.div
      layout
      initial={false}
      animate={{ 
        width: isMini ? '180px' : '100vw',
        height: isMini ? '110px' : (isWatchPage ? 'auto' : '100vh'),
        right: isMini ? 16 : 0,
        bottom: isMini ? 80 : 0,
        top: isMini ? 'auto' : 0,
        left: isMini ? 'auto' : 0,
        borderRadius: isMini ? '12px' : 0,
        backgroundColor: isMini ? '#000' : (isWatchPage ? 'transparent' : '#000'),
        zIndex: isMini ? 9999 : (isWatchPage ? 1 : 9999),
      }}
      transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
      style={{
        position: isMini ? 'fixed' : (isWatchPage ? 'relative' : 'fixed'),
        overflow: 'hidden',
        pointerEvents: 'auto',
        display: isWatchPage && !isMini ? 'block' : 'flex',
        aspectRatio: isWatchPage && !isMini ? '16/9' : 'auto'
      }}
      onClick={() => isMini && handleRestore()}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div style={{ 
        width: '100%', 
        height: '100%',
        pointerEvents: 'auto',
        backgroundColor: '#000',
        position: 'relative'
      }}>
        <VideoPlayer 
          video={activeVideo} 
          viewMode={viewMode}
          onClose={closePlayer}
          onNext={playNext}
        />
      </div>
    </motion.div>
  );
}
