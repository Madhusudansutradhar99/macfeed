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

  // Use a more robust check for watch page
  const isWatchPage = location.pathname.includes('/watch/');

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
    // If we are restoring, we want to go to the watch page IMMEDIATELY
    // so the height animation starts with isWatchPage = true
    if (!isWatchPage) {
      navigate(`/watch/${activeVideo.id}`);
    }
    maximize();
  };

  const isMini = viewMode === 'mini';

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeVideo.id} // Re-mount if video changes to ensure player stability
        layout
        initial={false}
        animate={{ 
          width: isMini ? '180px' : '100vw',
          // On watch page, we only want the video height. On other pages in full mode, we want a fullscreen overlay.
          height: isMini ? '110px' : (isWatchPage ? '56.25vw' : '100vh'),
          right: isMini ? 20 : 0,
          bottom: isMini ? 20 : 0, // Lowered bottom for mini player
          top: isMini ? 'auto' : 0,
          left: isMini ? 'auto' : 0,
          borderRadius: isMini ? '16px' : 0,
          backgroundColor: isMini ? '#000' : (isWatchPage ? 'rgba(0,0,0,0)' : '#000'),
          zIndex: isMini ? 9999 : (isWatchPage ? 50 : 9999),
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        style={{
          position: 'fixed',
          overflow: 'hidden',
          pointerEvents: isMini ? 'auto' : (isWatchPage ? 'none' : 'auto'),
          boxShadow: isMini ? '0 20px 50px rgba(0,0,0,0.5)' : 'none',
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
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
