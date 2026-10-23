import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, X, Play, Pause, SkipForward } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useVideoMiniPlayer } from '../context/VideoPlayerContext';

export default function VideoMiniPlayer() {
  const {
    activeVideo,
    viewMode,
    setViewMode,
    playing,
    setPlaying,
    closePlayer,
    playNext,
    ytPlayerRef,
  } = useVideoMiniPlayer();
  const navigate = useNavigate();

  const handleMaximize = () => {
    setViewMode('full');
    if (activeVideo?.id) {
      navigate(`/watch/${activeVideo.id}`, { state: { video: activeVideo } });
    }
  };

  const handleTogglePlay = (e) => {
    if (e?.stopPropagation) e.stopPropagation();
    if (ytPlayerRef?.current) {
      const state = ytPlayerRef.current.getPlayerState?.();
      if (state === 1) {
        ytPlayerRef.current.pauseVideo?.();
        setPlaying(false);
      } else {
        ytPlayerRef.current.playVideo?.();
        setPlaying(true);
      }
    } else {
      setPlaying(!playing);
    }
  };

  // Keyboard shortcut listener for miniplayer
  useEffect(() => {
    if (viewMode !== 'mini' || !activeVideo) return;

    const onKeyDown = (e) => {
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key.toLowerCase() === 'i') {
        e.preventDefault();
        handleMaximize();
      } else if (e.key === ' ' || e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleTogglePlay();
      }
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [viewMode, activeVideo, playing, ytPlayerRef]);

  if (viewMode !== 'mini' || !activeVideo) {
    return null;
  }

  const isYouTube = activeVideo.source === 'youtube' ||
    Boolean(activeVideo.youtube_id) ||
    Boolean(activeVideo.ytId) ||
    Boolean(typeof activeVideo.id === 'string' && activeVideo.id.startsWith('yt-')) ||
    Boolean(activeVideo.video_url?.includes('youtu'));

  const ytId = activeVideo.ytId || activeVideo.youtube_id || (typeof activeVideo.id === 'string' && activeVideo.id.startsWith('yt-') ? activeVideo.id.replace('yt-', '') : null);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 30 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-24 right-4 sm:bottom-6 sm:right-6 z-[9500] w-72 sm:w-84 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/20 bg-black/90 backdrop-blur-xl group select-none"
      >
        {/* Video Thumbnail / Stream Area */}
        <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
          {activeVideo.thumbnail_url ? (
            <img
              src={activeVideo.thumbnail_url}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-tr from-gray-900 to-black flex items-center justify-center">
              <Play className="w-10 h-10 text-white/40" />
            </div>
          )}

          {/* Persistent Floating Controls Overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-2.5">
            {/* Top Bar: Maximize & Close */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-white/80 bg-black/60 px-2 py-0.5 rounded-full border border-white/10 uppercase tracking-wider">
                Miniplayer
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleMaximize}
                  title="Expand to Fullscreen (i)"
                  className="w-7 h-7 rounded-full bg-black/70 hover:bg-white text-white hover:text-black flex items-center justify-center transition border border-white/20"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={closePlayer}
                  title="Close Miniplayer"
                  className="w-7 h-7 rounded-full bg-black/70 hover:bg-red-500 text-white flex items-center justify-center transition border border-white/20"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Center Play/Pause button */}
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleTogglePlay}
                className="w-11 h-11 rounded-full bg-[#f5b700] hover:bg-amber-400 text-black flex items-center justify-center shadow-lg active:scale-95 transition"
              >
                {playing ? <Pause className="w-5 h-5 fill-black" /> : <Play className="w-5 h-5 fill-black ml-0.5" />}
              </button>
              <button
                type="button"
                onClick={playNext}
                title="Next"
                className="w-8 h-8 rounded-full bg-black/70 hover:bg-white/20 text-white flex items-center justify-center transition"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            <div />
          </div>
        </div>

        {/* Video Title Bar */}
        <div 
          onClick={handleMaximize}
          className="p-3 bg-white/5 hover:bg-white/10 transition cursor-pointer flex items-center justify-between gap-2 border-t border-white/10"
        >
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white truncate">
              {activeVideo.title || 'Playing Video'}
            </p>
            <p className="text-[10px] text-gray-400 truncate">
              {activeVideo.category || 'MacFeed Stream'} • Tap to expand
            </p>
          </div>
          <button
            type="button"
            onClick={handleMaximize}
            className="p-1.5 rounded-lg text-[#f5b700] hover:bg-[#f5b700]/10 transition shrink-0"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
