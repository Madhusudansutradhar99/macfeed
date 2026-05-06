import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, X, Maximize2, Volume2, VolumeX, SkipForward } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoMiniPlayer } from '../context/VideoPlayerContext';

function formatTime(s) {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60)
    .toString()
    .padStart(2, '0');
  return `${m}:${sec}`;
}

export default function VideoGlobalMiniPlayer() {
  const ctx = useVideoMiniPlayer();
  const navigate = useNavigate();

  const containerRef = useRef(null);
  const videoDisplayRef = useRef(null);

  const {
    miniVideo,
    isOpen,
    playing,
    muted,
    volume,
    currentTime,
    duration,
    progress,
    videoRef,
    setPlaying,
    setMuted,
    setVolume,
    closeMini,
    restoreFromMini,
    seek,
  } = ctx || {};

  // Sync video src to the video element from context
  useEffect(() => {
    if (videoDisplayRef.current && videoRef.current) {
      // Mirror the context video to the display video
      videoDisplayRef.current.src = miniVideo?.video_url || '';
      if (videoRef.current.currentTime) {
        videoDisplayRef.current.currentTime = videoRef.current.currentTime;
      }
    }
  }, [miniVideo, videoRef]);

  // Sync display video time periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (videoDisplayRef.current && videoRef.current) {
        const timeDiff = Math.abs(
          videoDisplayRef.current.currentTime - videoRef.current.currentTime
        );
        if (timeDiff > 1) {
          videoDisplayRef.current.currentTime = videoRef.current.currentTime;
        }
        if (playing && videoDisplayRef.current.paused) {
          videoDisplayRef.current.play().catch(() => {});
        }
        if (!playing && !videoDisplayRef.current.paused) {
          videoDisplayRef.current.pause();
        }
      }
    }, 500);
    return () => clearInterval(interval);
  }, [playing, videoRef]);

  const handleRestore = useCallback(() => {
    if (!restoreFromMini) return;
    const state = restoreFromMini();
    if (state.video) {
      navigate(
        `/watch/${state.video.id}?t=${Math.floor(state.time)}&autoplay=${state.playing ? 1 : 0}`
      );
    }
  }, [restoreFromMini, navigate]);

  // Handle 'i' key to restore
  useEffect(() => {
    const handleKey = (e) => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key.toLowerCase() === 'i' && isOpen) {
        e.preventDefault();
        handleRestore();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, handleRestore]);

  const handleSeekClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    seek(pct);
    if (videoDisplayRef.current) {
      videoDisplayRef.current.currentTime = (pct / 100) * (duration || 1);
    }
  };

  if (!ctx || !isOpen || !miniVideo) return null;

  return (
    <AnimatePresence>
      <motion.div
        drag
        dragMomentum={false}
        initial={{ 
          x: window.innerWidth < 768 ? window.innerWidth - 220 : window.innerWidth - 400, 
          y: window.innerWidth < 768 ? window.innerHeight - 150 : window.innerHeight - 280, 
          opacity: 0, 
          scale: 0.8 
        }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed z-[80] select-none group cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'none' }}
      >
        <div className="w-[200px] sm:w-[250px] md:w-[370px] bg-secondary rounded-2xl overflow-hidden shadow-2xl border border-primary backdrop-blur-xl transition-all duration-500">
          {/* Video display */}
          <div className="relative w-full aspect-video bg-black overflow-hidden">
            <video
              ref={videoDisplayRef}
              src={miniVideo?.video_url}
              poster={miniVideo?.thumbnail_url}
              className="w-full h-auto object-cover pointer-events-none"
              style={{ width: '100%', height: 'auto' }}
              muted={muted}
              loop={false}
            />

            {/* Hover overlay with play/pause */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
              <button
                onClick={(e) => { e.stopPropagation(); setPlaying((p) => !p); }}
                className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition border border-white/20"
              >
                {playing ? (
                  <Pause className="w-6 h-6 text-white" />
                ) : (
                  <Play className="w-6 h-6 text-white fill-white ml-0.5" />
                )}
              </button>
            </div>

            {/* Expand button */}
            <button
              onClick={(e) => { e.stopPropagation(); handleRestore(); }}
              className="absolute top-2 left-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-accent transition opacity-0 group-hover:opacity-100"
              style={{ '--accent': 'var(--accent-color)' }}
              title="Expand (I)"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            {/* Close button */}
            <button
              onClick={(e) => { e.stopPropagation(); closeMini(); }}
              className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-red-600 transition opacity-0 group-hover:opacity-100"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Bottom controls */}
          <div className="px-3 pt-2 pb-3">
            {/* Progress bar */}
            <div
              className="seek-bar w-full h-1 bg-primary/10 rounded-full cursor-pointer group/seek mb-2 relative"
              onClick={(e) => { e.stopPropagation(); handleSeekClick(e); }}
            >
              <div
                className="absolute h-full bg-accent rounded-full transition-all"
                style={{ width: `${progress}%`, backgroundColor: 'var(--accent-color)' }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover/seek:opacity-100 transition"
                style={{ left: `calc(${progress}% - 6px)` }}
              />
            </div>

            {/* Info + controls row */}
            <div className="flex items-center gap-2">
              {/* Title */}
              <div className="flex-1 min-w-0 cursor-pointer" onClick={handleRestore}>
                <div className="text-primary text-xs font-semibold truncate hover:text-accent transition" style={{ '--accent': 'var(--accent-color)' }}>
                  {miniVideo?.title}
                </div>
                <div className="text-secondary text-[10px] font-mono">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); setPlaying((p) => !p); }}
                  className="p-1.5 rounded-full hover:bg-primary/10 text-primary transition"
                >
                  {playing ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4 fill-current" />
                  )}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setMuted((m) => !m); }}
                  className="p-1.5 rounded-full hover:bg-primary/10 text-secondary hover:text-primary transition"
                >
                  {muted ? (
                    <VolumeX className="w-3.5 h-3.5" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleRestore(); }}
                  className="p-1.5 rounded-full hover:bg-primary/10 text-secondary hover:text-primary transition"
                  title="Expand"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); closeMini(); }}
                  className="p-1.5 rounded-full hover:bg-red-500/20 text-secondary hover:text-red-400 transition"
                  title="Close"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
