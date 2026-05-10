import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, useMotionValue, useTransform, useAnimation, AnimatePresence } from 'framer-motion';
import { useVideoMiniPlayer } from '../context/VideoPlayerContext';
import VideoPlayer from './VideoPlayer';

export default function GlobalVideoPlayer() {
  const { activeVideo, viewMode, minimize, maximize, closePlayer, ytPlayerRef } = useVideoMiniPlayer();
  const navigate = useNavigate();
  const location = useLocation();
  const controls = useAnimation();
  const y = useMotionValue(0);

  const isWatchPage = location.pathname.startsWith('/watch/');

  // Auto-maximize if navigating to watch page
  useEffect(() => {
    if (isWatchPage && viewMode === 'mini') {
      maximize();
    }
  }, [isWatchPage, viewMode, maximize]);

  // Animate between full and mini states
  useEffect(() => {
    if (viewMode === 'full') {
      controls.start({
        y: 0,
        height: '100vh',
        width: '100vw',
        bottom: 0,
        borderRadius: 0,
        opacity: 1,
        transition: { type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }
      });
    } else if (viewMode === 'mini') {
      controls.start({
        y: 0,
        height: '70px',
        width: '100vw',
        bottom: 80, // Above bottom navigation
        borderRadius: '16px 16px 0 0',
        opacity: 1,
        transition: { type: 'spring', damping: 25, stiffness: 250 }
      });
    } else {
      controls.start({
        opacity: 0,
        transition: { duration: 0.2 }
      });
    }
  }, [viewMode, controls]);

  if (viewMode === 'closed' || !activeVideo) return null;

  const handleDragEnd = (_, info) => {
    if (viewMode === 'full') {
      // Swipe down to minimize
      if (info.offset.y > 100) {
        minimize();
        if (isWatchPage) navigate(-1); // Go back if we were on watch page
      } else {
        controls.start({ y: 0 });
      }
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
      // For YouTube videos, fetch related from our API
      const vidId = activeVideo.youtube_id || activeVideo.id;
      const resp = await fetch(`/api/search?q=${vidId}`);
      const data = await resp.json();
      if (data.results && data.results.length > 1) {
        // Pick a random related or the next one
        const nextVid = data.results[1]; // Index 1 is usually the first related
        const targetId = nextVid.youtube_id ? `yt-${nextVid.youtube_id}` : nextVid.id;
        navigate(`/watch/${targetId}`);
      }
    } catch (e) {
      console.error('Failed to load next video', e);
    }
  };

  const handlePrevious = () => {
    // Zero reload: just seek to start
    if (ytPlayerRef.current?.seekTo) {
      ytPlayerRef.current.seekTo(0);
    } else {
      window.location.reload();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        drag={viewMode === 'full' ? 'y' : false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        animate={controls}
        initial={{ opacity: 0, y: 100 }}
        exit={{ opacity: 0, y: 100 }}
        style={{
          y,
          position: 'fixed',
          left: 0,
          zIndex: 100,
          backgroundColor: 'var(--bg-secondary, #000)',
          boxShadow: '0 -8px 30px rgba(0,0,0,0.8)',
          overflow: 'hidden',
          touchAction: 'none'
        }}
        className="border-t border-white/5"
        onClick={() => viewMode === 'mini' && handleRestore()}
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
