import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, X, Maximize2, Minimize2 } from 'lucide-react';
import { useMusicPlayer } from '../context/MusicContext';

// Helper to format time (e.g. 01:23)
const formatTime = (timeInSeconds) => {
  if (!timeInSeconds || isNaN(timeInSeconds)) return '00:00';
  const mins = Math.floor(timeInSeconds / 60);
  const secs = Math.floor(timeInSeconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export default function LocalPlayerOverlay() {
  const {
    isLocalPlayerOpen, setIsLocalPlayerOpen, activeLocalSong: currentSong,
    playingLocal: playing, setPlayingLocal: setPlaying,
    volumeLocal: volume, setVolumeLocal: setVolume,
    mutedLocal: isMuted, setMutedLocal: setIsMuted
  } = useMusicPlayer();

  const videoRef = useRef(null);
  
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef(null);

  // Auto-hide controls when mouse is not moving
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (playing) setShowControls(false);
    }, 2500);
  };

  useEffect(() => {
    if (!isLocalPlayerOpen && videoRef.current) {
      videoRef.current.pause();
    }
  }, [isLocalPlayerOpen]);

  useEffect(() => {
    if (videoRef.current) {
      if (playing) {
        videoRef.current.play().catch(e => console.warn("Play interrupted", e));
      } else {
        videoRef.current.pause();
      }
    }
  }, [playing]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Try to load the object URL if it's a file object passed in currentSong.url
  const [videoSrc, setVideoSrc] = useState('');
  useEffect(() => {
    if (currentSong && currentSong.url) {
       // If it's a browser File object, create a blob URL
       if (currentSong.url instanceof File || currentSong.url instanceof Blob) {
           const url = URL.createObjectURL(currentSong.url);
           setVideoSrc(url);
           return () => URL.revokeObjectURL(url);
       } else {
           setVideoSrc(currentSong.url);
       }
    }
  }, [currentSong]);

  const handleTimeUpdate = () => {
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      if (playing) videoRef.current.play();
    }
  };

  const handleSeek = (e) => {
    const newTime = Number(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const skip = (amount) => {
    if (videoRef.current) {
      videoRef.current.currentTime += amount;
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const closePlayer = () => {
    setPlaying(false);
    setIsLocalPlayerOpen(false);
  };

  if (!isLocalPlayerOpen || !currentSong) return null;

  return (
    <AnimatePresence>
      <motion.div
        drag={!isExpanded}
        dragMomentum={false}
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ 
          opacity: 1, 
          scale: 1, 
          y: 0,
          width: isExpanded ? '100vw' : 'clamp(300px, 80vw, 450px)',
          height: isExpanded ? '100vh' : 'auto',
          left: isExpanded ? 0 : undefined,
          top: isExpanded ? 0 : undefined,
          bottom: isExpanded ? undefined : '5%',
          right: isExpanded ? undefined : '5%',
          borderRadius: isExpanded ? '0px' : '16px'
        }}
        exit={{ opacity: 0, scale: 0.8, y: 50 }}
        transition={{ type: 'spring', bounce: 0.1, duration: 0.4 }}
        className={`fixed z-[9999] bg-black shadow-2xl overflow-hidden border border-white/10 ${isExpanded ? '' : 'aspect-video'}`}
        style={isExpanded ? {} : { right: '2rem', bottom: '2rem', position: 'fixed', touchAction: 'none' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => playing && setShowControls(false)}
        onClick={handleMouseMove}
      >
        
        <video
          ref={videoRef}
          src={videoSrc}
          className="w-full h-full object-contain bg-black"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setPlaying(false)}
          playsInline
          onClick={() => setPlaying(!playing)}
        />

        {/* Controls Overlay */}
        <AnimatePresence>
          {showControls && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/60 flex flex-col justify-between p-3 sm:p-4 pointer-events-none"
            >
              
              {/* Top Bar: Title & Actions */}
              <div className="flex items-center justify-between pointer-events-auto">
                <span className="text-white font-bold text-xs sm:text-sm tracking-wide truncate max-w-[70%] drop-shadow-md">
                  {currentSong.title || 'Local Video'}
                </span>
                <div className="flex items-center gap-1 sm:gap-2">
                  <button onClick={() => setIsExpanded(!isExpanded)} className="p-1.5 sm:p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all backdrop-blur-md">
                    {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                  </button>
                  <button onClick={closePlayer} className="p-1.5 sm:p-2 text-white/70 hover:text-red-400 bg-white/10 hover:bg-white/20 rounded-full transition-all backdrop-blur-md">
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Bottom Bar: Timeline & Playback */}
              <div className="flex flex-col gap-2 pointer-events-auto">
                {/* Timeline */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="text-white/80 text-[9px] sm:text-[10px] font-medium w-8 text-right">{formatTime(currentTime)}</span>
                  <input 
                    type="range" 
                    min="0" 
                    max={duration || 0} 
                    value={currentTime} 
                    onChange={handleSeek}
                    className="flex-1 h-1.5 bg-white/20 rounded-full appearance-none outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[#00f2fe] [&::-webkit-slider-thumb]:rounded-full cursor-pointer"
                  />
                  <span className="text-white/80 text-[9px] sm:text-[10px] font-medium w-8">{formatTime(duration)}</span>
                </div>

                {/* Playback Controls */}
                <div className="flex items-center justify-center gap-4 sm:gap-6 mt-1">
                  <button onClick={() => skip(-10)} className="text-white/70 hover:text-white transition-colors">
                    <SkipBack size={18} />
                  </button>
                  
                  <button 
                    onClick={() => setPlaying(!playing)}
                    className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white text-black rounded-full shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 transition-all"
                  >
                    {playing ? <Pause size={18} className="fill-black" /> : <Play size={18} className="fill-black ml-1" />}
                  </button>
                  
                  <button onClick={() => skip(10)} className="text-white/70 hover:text-white transition-colors">
                    <SkipForward size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
