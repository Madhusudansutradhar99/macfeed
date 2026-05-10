import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoMiniPlayer } from '../context/VideoPlayerContext';
import VideoPlayer from './VideoPlayer';

export default function GlobalVideoPlayer() {
  const { activeVideo, viewMode, minimize, maximize, closePlayer, ytPlayerRef } = useVideoMiniPlayer();
  const navigate = useNavigate();
  const location = useLocation();

  const isWatchPage = location.pathname.startsWith('/watch/');

  if (viewMode === 'closed' || !activeVideo || isWatchPage) return null;

  const swipeStartRef = useRef(0);

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

  const handleNext = async () => {
    if (!activeVideo) return;
    try {
      const vidId = activeVideo.youtube_id || activeVideo.id;
      const resp = await fetch(`/api/search?q=${vidId}`);
      const data = await resp.json();
      if (data.results && data.results.length > 1) {
        const nextVid = data.results[1];
        const targetId = nextVid.youtube_id ? `yt-${nextVid.youtube_id}` : nextVid.id;
        navigate(`/watch/${targetId}`);
      }
    } catch (e) {
      console.error('Failed to load next video', e);
    }
  };

  const handlePrevious = () => {
    if (ytPlayerRef.current?.seekTo) {
      ytPlayerRef.current.seekTo(0);
    } else {
      window.location.reload();
    }
  };

  const isMini = viewMode === 'mini';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          width: isMini ? '180px' : '100vw',
          height: isMini ? '110px' : '100vh',
          right: isMini ? 20 : 0,
          bottom: isMini ? 100 : 0,
          borderRadius: isMini ? '16px' : 0,
          boxShadow: isMini ? '0 10px 40px rgba(0,0,0,0.6)' : 'none'
        }}
        exit={{ opacity: 0, y: 100 }}
        style={{
          position: 'fixed',
          zIndex: 9999,
          backgroundColor: '#000',
          overflow: 'hidden',
          touchAction: 'none'
        }}
        onClick={() => isMini && handleRestore()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <VideoPlayer 
          video={activeVideo} 
          viewMode={viewMode}
          onClose={closePlayer}
          onNext={handleNext}
          onPrevious={handlePrevious}
        />
      </motion.div>
    </AnimatePresence>
  );
}
