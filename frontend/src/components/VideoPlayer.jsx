import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipBack,
  SkipForward,
  PictureInPicture2,
  X,
} from 'lucide-react';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { useVideoMiniPlayer } from '../context/VideoPlayerContext';

const formatTime = (seconds) => {
  if (!seconds || Number.isNaN(seconds)) return '0:00';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
  return hours > 0
    ? `${hours}:${minutes.toString().padStart(2, '0')}:${secs}`
    : `${minutes}:${secs}`;
};

const YT_QUALITY_OPTIONS = [
  { label: 'Auto', value: 'auto', apiValue: 'auto' },
  { label: '1080p', value: 'hd1080', apiValue: 'hd1080' },
  { label: '720p', value: 'hd720', apiValue: 'hd720' },
  { label: '480p', value: 'large', apiValue: 'large' },
  { label: '360p', value: 'medium', apiValue: 'medium' },
  { label: '240p', value: 'small', apiValue: 'small' },
  { label: '144p', value: 'tiny', apiValue: 'tiny' },
];

const YT_QUALITY_LABELS = {
  auto: 'Auto',
  highres: '1080p',
  hd2160: '2160p',
  hd1440: '1440p',
  hd1080: '1080p',
  hd720: '720p',
  large: '480p',
  medium: '360p',
  small: '240p',
  tiny: '144p',
};

const getQualityLabel = (quality) => YT_QUALITY_LABELS[quality] || 'Auto';

function ControlBtn({ onClick, title, children, className = '' }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`relative rounded-full p-1.5 text-white/90 transition-all duration-150 hover:bg-white/10 hover:text-white active:scale-90 ${className}`}
    >
      {children}
    </button>
  );
}

export default React.memo(function VideoPlayer({ video, onClose, viewMode = 'full', onNext, onPrevious, onError }) {
  const { 
    playing, setPlaying, 
    muted, setMuted, 
    volume, setVolume, 
    currentTime, setCurrentTime, 
    duration, setDuration, 
    closePlayer, 
    setViewMode,
    ytPlayerRef 
  } = useVideoMiniPlayer();
  const containerRef = useRef(null);
  const ytDomContainer = useRef(null);
  const ytTimerRef = useRef(null);
  const ytFailSafeRef = useRef(null);
  const nativeVideoRef = useRef(null);
  const controlsTimeout = useRef(null);
  const touchStartRef = useRef({ x: 0, y: 0, time: 0, isTap: true });
  const isSwipingRef = useRef(false);
  const fullscreenOverlayRef = useRef(null);
  // FIX: DOM refs for zero-re-render realtime updates
  const progressBarRef = useRef(null);
  const scrubberKnobRef = useRef(null);
  const bufferBarRef = useRef(null);
  const currentTimeRef = useRef(null);
  const durationRef = useRef(null);
  const playBtnRef = useRef(null);
  const durationStateRef = useRef(0);
  const playingRef = useRef(playing);
  useEffect(() => { playingRef.current = playing; }, [playing]);
  const inputRangeRef = useRef(null);

  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [availableQualities, setAvailableQualities] = useState([]);
  const [currentQuality, setCurrentQuality] = useState('auto');
  const [forceLandscape, setForceLandscape] = useState(false);
  // Robust YouTube detection
  const isYouTube = video?.source === 'youtube' || 
    Boolean(video?.youtube_id) || 
    Boolean(video?.ytId) || 
    Boolean(typeof video?.id === 'string' && video.id.startsWith('yt-')) ||
    Boolean(video?.video_url?.includes('youtu'));

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    clearTimeout(controlsTimeout.current);
    // FIX 2: Always auto-hide after 3s (works in normal & fullscreen)
    controlsTimeout.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, []);

  const toggleControls = useCallback(() => {
    // FIX 2: Tap toggles controls in both normal AND fullscreen
    setShowControls(prev => {
      const next = !prev;
      if (next) showControlsTemporarily();
      else clearTimeout(controlsTimeout.current);
      return next;
    });
    setShowQualityMenu(false);
  }, [showControlsTemporarily]);

  const handleQualityChange = useCallback((quality) => {
    // YouTube API blocks setPlaybackQuality() due to cross-origin restrictions.
    // YouTube automatically selects the best quality available.
    console.warn('[YT-Player] Quality selection blocked by YouTube API (cross-origin restriction). YouTube auto-selects optimal quality.');
    setShowQualityMenu(false);
    showControlsTemporarily();
  }, [showControlsTemporarily]);

  const handleToggleMiniPlayer = useCallback(() => {
    if (viewMode === 'mini') {
      setViewMode('full');
    } else {
      setViewMode('mini');
      if (onClose) onClose();
    }
  }, [viewMode, setViewMode, onClose]);

  const skip = useCallback(
    (seconds) => {
      try {
        if (isYouTube && ytPlayerRef.current?.seekTo) {
          const cur = ytPlayerRef.current.getCurrentTime?.() || 0;
          const videoDuration = ytPlayerRef.current.getDuration?.() || durationStateRef.current || duration || 0;
          const target = Math.max(0, Math.min(videoDuration > 0 ? videoDuration : cur + seconds, cur + seconds));
          ytPlayerRef.current.seekTo(target, true);
          setCurrentTime(target);
          if (currentTimeRef.current) currentTimeRef.current.textContent = formatTime(target);
          if (videoDuration > 0) {
            const pct = Math.min(100, Math.max(0, (target / videoDuration) * 100));
            if (progressBarRef.current) progressBarRef.current.style.width = `${pct}%`;
            if (scrubberKnobRef.current) scrubberKnobRef.current.style.left = `${pct}%`;
            if (inputRangeRef.current) inputRangeRef.current.value = pct;
          }
          return;
        }

        if (nativeVideoRef.current) {
          const cur = nativeVideoRef.current.currentTime || 0;
          const videoDuration = nativeVideoRef.current.duration || durationStateRef.current || duration || 0;
          const target = Math.max(0, Math.min(videoDuration > 0 ? videoDuration : cur + seconds, cur + seconds));
          nativeVideoRef.current.currentTime = target;
          setCurrentTime(target);
          if (currentTimeRef.current) currentTimeRef.current.textContent = formatTime(target);
          if (videoDuration > 0) {
            const pct = Math.min(100, Math.max(0, (target / videoDuration) * 100));
            if (progressBarRef.current) progressBarRef.current.style.width = `${pct}%`;
            if (scrubberKnobRef.current) scrubberKnobRef.current.style.left = `${pct}%`;
            if (inputRangeRef.current) inputRangeRef.current.value = pct;
          }
        }
      } catch (err) {}
    },
    [duration, isYouTube]
  );

  const handleSeek = useCallback((e) => {
    e.stopPropagation();
    try {
      const pct = parseFloat(e.target.value);
      if (progressBarRef.current) progressBarRef.current.style.width = `${pct}%`;
      if (scrubberKnobRef.current) scrubberKnobRef.current.style.left = `${pct}%`;

      if (isYouTube && ytPlayerRef.current?.seekTo) {
        const videoDuration = ytPlayerRef.current.getDuration?.() || durationStateRef.current || duration || 0;
        const targetTime = (pct / 100) * videoDuration;
        ytPlayerRef.current.seekTo(targetTime, true);
        setCurrentTime(targetTime);
        if (currentTimeRef.current) currentTimeRef.current.textContent = formatTime(targetTime);
      } else if (nativeVideoRef.current) {
        const videoDuration = nativeVideoRef.current.duration || durationStateRef.current || duration || 0;
        const targetTime = (pct / 100) * videoDuration;
        nativeVideoRef.current.currentTime = targetTime;
        setCurrentTime(targetTime);
        if (currentTimeRef.current) currentTimeRef.current.textContent = formatTime(targetTime);
      }
    } catch (err) {}
  }, [duration, isYouTube]);

  const toggleFullscreen = useCallback(async () => {
    const host = containerRef.current;
    if (!host) return;

    try {
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        const request = host.requestFullscreen?.bind(host) || host.webkitRequestFullscreen?.bind(host);
        if (request) {
          await request();
        } else {
          // Fallback: manually set fullscreen state if API is unavailable
          setIsFullscreen(true);
        }
        
        try {
          await ScreenOrientation.lock({ orientation: 'landscape-primary' });
          setForceLandscape(false);
        } catch (err) {
          if (window.innerWidth < window.innerHeight) {
            setForceLandscape(true);
          }
        }
      } else {
        const exit = document.exitFullscreen?.bind(document) || document.webkitExitFullscreen?.bind(document);
        if (exit) await exit();
        else setIsFullscreen(false);

        try {
          await ScreenOrientation.unlock();
        } catch (err) { }
        setForceLandscape(false);
      }
    } catch (err) {
      // Manual fallback if API fails
      setIsFullscreen(prev => !prev);
    }
  }, []);


  const handleTouchStart = useCallback((event) => {
    const touch = event.touches[0];
    touchStartRef.current = { 
      x: touch.clientX, 
      y: touch.clientY, 
      time: Date.now(), 
      isTap: true 
    };
    isSwipingRef.current = false;
  }, []);

  const handleTouchMove = useCallback((event) => {
    // Block page scroll when touching the video area
    if (event.cancelable) event.preventDefault();
    event.stopPropagation();

    const touch = event.touches[0];
    const start = touchStartRef.current;
    if (!start.time) return;

    const deltaX = Math.abs(touch.clientX - start.x);
    const deltaY = Math.abs(touch.clientY - start.y);

    if (deltaX > 10 || deltaY > 10) {
      touchStartRef.current.isTap = false;
      isSwipingRef.current = true;
      if (showControls) setShowControls(false);
    }
  }, [showControls]);

  const handleTouchEnd = useCallback(
    (event) => {
      const start = touchStartRef.current;
      if (!start.time) return;

      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - start.x;
      const deltaY = touch.clientY - start.y;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      const duration = Date.now() - start.time;

      const container = containerRef.current;

      // Tap detection
      if (start.isTap && duration < 300 && absX < 10 && absY < 10) {
        toggleControls();
      } else if (absY > 80 && absY > absX * 1.5) {
        // Vertical Swipe
        if (document.fullscreenElement || document.webkitFullscreenElement) {
          if (deltaY > 80) { // Swipe Down: Exit Fullscreen
            if (document.exitFullscreen) {
              document.exitFullscreen().catch(() => {
                if (document.webkitExitFullscreen) document.webkitExitFullscreen();
              });
            } else if (document.webkitExitFullscreen) {
              document.webkitExitFullscreen();
            }
          }
        } else {
          if (deltaY < -80) { // Swipe Up: Enter Fullscreen
            if (container?.requestFullscreen) {
              container.requestFullscreen().catch(() => {
                if (container?.webkitRequestFullscreen) container.webkitRequestFullscreen();
              });
            } else if (container?.webkitRequestFullscreen) {
              container.webkitRequestFullscreen();
            }
            }
          }
        } else {
        // Horizontal Swipe
        if (deltaX > 0) skip(10);
        else skip(-10);
        showControlsTemporarily();
      }

      touchStartRef.current = { x: 0, y: 0, time: 0, isTap: true };
      isSwipingRef.current = false;
    },
    [viewMode, skip, showControlsTemporarily, toggleControls]
  );

  useEffect(() => {
    const overlay = fullscreenOverlayRef.current;
    if (!overlay) return;

    let startY = 0;

    const onTouchStart = (e) => {
      startY = e.touches[0].clientY;
    };

    const onTouchEnd = (e) => {
      const endY = e.changedTouches[0].clientY;
      if (endY - startY > 80) {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }
      }
    };

    overlay.addEventListener('touchstart', onTouchStart, { passive: false });
    overlay.addEventListener('touchend', onTouchEnd, { passive: false });

    return () => {
      overlay.removeEventListener('touchstart', onTouchStart);
      overlay.removeEventListener('touchend', onTouchEnd);
    };
  }, [isFullscreen]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onFsChange = () => {
      const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
      setIsFullscreen(isFs);
      
      if (isFs) {
        ScreenOrientation.lock({ orientation: 'landscape-primary' }).catch(() => {
          if (window.innerWidth < window.innerHeight) setForceLandscape(true);
        });
      } else {
        ScreenOrientation.unlock().catch(() => {});
        setForceLandscape(false);
      }
    };

    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);

    // FIX 1: Native Listeners for strict scroll block only on video
    if (container) {
      container.addEventListener('touchstart', handleTouchStart, { passive: false });
      container.addEventListener('touchmove', handleTouchMove, { passive: false });
      container.addEventListener('touchend', handleTouchEnd, { passive: false });
    }
    
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange);
      if (container) {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  useEffect(() => {
    if (!isYouTube) {
      if (ytTimerRef.current) clearInterval(ytTimerRef.current);
      if (ytFailSafeRef.current) clearTimeout(ytFailSafeRef.current);
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch (err) {
          // ignore
        }
        ytPlayerRef.current = null;
      }
      return;
    }

    const initYouTube = () => {
      if (!ytDomContainer.current) return;

      const match = video?.video_url?.match(
        /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/
      );
      const youtubeId = video?.youtube_id || video?.ytId || (match ? match[1] : (typeof video?.id === 'string' && video.id.startsWith('yt-') ? video.id.replace('yt-', '') : ''));

      if (ytDomContainer.current) {
        ytDomContainer.current.innerHTML = '';
      }
      const host = document.createElement('div');
      ytDomContainer.current?.appendChild(host);

      console.log('[YT-Player] Initializing instant playback for ID:', youtubeId);
      ytPlayerRef.current = new window.YT.Player(host, {
        videoId: youtubeId,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 1,
          controls: 0,
          rel: 0,
          modestbranding: 1,
          showinfo: 0,
          iv_load_policy: 3,
          autohide: 1,
          enablejsapi: 1,
          playsinline: 1,
          fs: 0,
          origin: window.location.origin,
          widget_referrer: window.location.origin,
        },
        events: {
          onReady: (event) => {
            setLoadFailed(false);
            try {
              const initDur = event.target.getDuration?.() || 0;
              if (initDur > 0) {
                durationStateRef.current = initDur;
                setDuration(initDur);
                if (durationRef.current) durationRef.current.textContent = formatTime(initDur);
              }
              setVolume((event.target.getVolume?.() || 100) / 100);

              event.target.playVideo?.();
              setPlaying(true);
            } catch (err) {
              try {
                event.target.mute?.();
                event.target.playVideo?.();
                setPlaying(true);
              } catch (_) {}
            }
          },
          onStateChange: (event) => {
            const state = event.data;
            if (state === window.YT.PlayerState.PLAYING) setPlaying(true);
            else if (state === window.YT.PlayerState.PAUSED) setPlaying(false);
            else if (state === window.YT.PlayerState.ENDED) {
              setPlaying(false);
              onNext?.();
            }
          },
          onError: () => {
            setLoadFailed(true);
            onError?.('The YouTube player could not load this video.');
          },
        },
      });
    };

    if (!window.YT || !window.YT.Player) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScript = document.getElementsByTagName('script')[0];
      firstScript.parentNode.insertBefore(tag, firstScript);

      const poll = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(poll);
          if (ytFailSafeRef.current) clearTimeout(ytFailSafeRef.current);
          initYouTube();
        }
      }, 100);

      ytFailSafeRef.current = setTimeout(() => {
        clearInterval(poll);
        setLoadFailed(true);
        onError?.('The YouTube player timed out while loading.');
      }, 10000);
    } else {
      initYouTube();
    }

    // Single, resilient 150ms sync interval that never crashes
    const syncProgress = () => {
      try {
        const player = ytPlayerRef.current;
        if (!player || typeof player.getCurrentTime !== 'function') return;

        const cur = player.getCurrentTime() || 0;
        const dur = (typeof player.getDuration === 'function' ? player.getDuration() : 0) || durationStateRef.current || duration || 0;

        // Buffer sync
        let bufferPct = 0;
        if (typeof player.getVideoLoadedFraction === 'function') {
          bufferPct = (player.getVideoLoadedFraction() || 0) * 100;
        }

        // Real-time State Sync
        if (typeof player.getPlayerState === 'function') {
          const ytState = player.getPlayerState();
          if (ytState === 1 && !playingRef.current) setPlaying(true);
          else if ((ytState === 2 || ytState === 0) && playingRef.current) setPlaying(false);
        }

        if (dur > 0) {
          durationStateRef.current = dur;
          const pct = Math.min(100, Math.max(0, (cur / dur) * 100));
          if (progressBarRef.current) progressBarRef.current.style.width = `${pct}%`;
          if (scrubberKnobRef.current) scrubberKnobRef.current.style.left = `${pct}%`;
          if (bufferBarRef.current) bufferBarRef.current.style.width = `${bufferPct}%`;
          if (inputRangeRef.current && document.activeElement !== inputRangeRef.current) {
            inputRangeRef.current.value = pct;
          }
          if (currentTimeRef.current) currentTimeRef.current.textContent = formatTime(cur);
          if (durationRef.current) durationRef.current.textContent = formatTime(dur);
        } else if (cur > 0) {
          if (currentTimeRef.current) currentTimeRef.current.textContent = formatTime(cur);
        }
      } catch (err) {
        // Catch gracefully
      }
    };

    const syncInterval = setInterval(syncProgress, 150);

    return () => {
      clearInterval(syncInterval);
      if (ytFailSafeRef.current) clearTimeout(ytFailSafeRef.current);
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch (err) {
          // ignore
        }
        ytPlayerRef.current = null;
      }
    };
  }, [isYouTube, video?.id, video?.youtube_id, video?.ytId, video?.video_url, onNext]);

  useEffect(() => {
    if (!isYouTube) return;
    const player = ytPlayerRef.current;
    if (!player) return;

    if (playing) player.playVideo?.();
    else player.pauseVideo?.();
  }, [isYouTube, playing]);

  useEffect(() => {
    if (!isYouTube) return;
    const player = ytPlayerRef.current;
    if (!player) return;

    if (muted) player.mute?.();
    else {
      player.unMute?.();
      player.setVolume?.(Math.round(volume * 100));
    }
  }, [isYouTube, muted, volume]);

  useEffect(() => {
    if (!isFullscreen) setShowQualityMenu(false);
  }, [isFullscreen]);

  useEffect(() => {
    const onKeyDown = (event) => {
      const tagName = event.target?.tagName;
      if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') return;

      switch (event.key.toLowerCase()) {
        case ' ':
        case 'k':
          event.preventDefault();
          setPlaying((prev) => !prev);
          break;
        case 'arrowleft':
          event.preventDefault();
          skip(-10);
          break;
        case 'arrowright':
          event.preventDefault();
          skip(10);
          break;
        case 'm':
          event.preventDefault();
          setMuted((prev) => !prev);
          break;
        case 'j':
          event.preventDefault();
          skip(-10);
          break;
        case 'l':
          event.preventDefault();
          skip(10);
          break;
        case 'i':
          event.preventDefault();
          handleToggleMiniPlayer();
          break;
        case 'n':
          event.preventDefault();
          onNext?.();
          break;
        case 't':
          event.preventDefault();
          // Theater mode is intentionally mapped to fullscreen/minimize only for this simplified player.
          toggleFullscreen();
          break;
        case 'arrowup':
          event.preventDefault();
          setVolume((prev) => Math.min(1, Number((prev + 0.1).toFixed(2))));
          break;
        case 'arrowdown':
          event.preventDefault();
          setVolume((prev) => Math.max(0, Number((prev - 0.1).toFixed(2))));
          break;
        case 'f':
          event.preventDefault();
          toggleFullscreen();
          break;
        case 'escape':
          if (document.fullscreenElement) {
            event.preventDefault();
            document.exitFullscreen().catch(() => { });
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [skip, toggleFullscreen, setPlaying, setMuted, setVolume, handleToggleMiniPlayer, onNext]);

  if (!video) return null;

  return (
    <div 
      className={`flex w-full flex-col transition-all duration-500 ease-in-out ${isFullscreen ? 'fixed inset-0 z-[9999] bg-black h-screen w-screen' : ''} ${forceLandscape ? 'rotate-90 origin-center' : ''}`}
      style={forceLandscape ? { 
        width: '100vh', 
        height: '100vw', 
        position: 'fixed', 
        top: '50%', 
        left: '50%', 
        transform: 'translate(-50%, -50%) rotate(90deg)',
        zIndex: 9999
      } : (isFullscreen ? { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999 } : {})}
    >
      <div
        ref={containerRef}
        className={`${isFullscreen ? 'h-full w-full' : (viewMode === 'mini' ? 'w-full h-full' : 'relative w-full rounded-2xl sm:rounded-[32px] aspect-video')} overflow-hidden select-none bg-black flex items-center justify-center transition-all duration-300 ease-in-out flex-shrink-0`}
        style={{ touchAction: 'none' }}
        onMouseMove={showControlsTemporarily}
        onClick={(e) => {
          if (!isFullscreen) {
            e.stopPropagation();
            toggleControls();
          }
        }}
      >
        {isYouTube ? (
          <div className="relative h-full w-full bg-black flex items-center justify-center">
            {loadFailed ? (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/90 px-6 text-center">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.25em] text-red-300">Playback unavailable</p>
                  <p className="mt-2 text-xs text-white/70">Please retry the page or choose another video.</p>
                </div>
              </div>
            ) : null}

            {/* Fullscreen Swipe Overlay */}
            {isFullscreen && (
              <div 
                className="absolute top-0 bottom-0 left-0 w-[100px] z-[60] bg-transparent pointer-events-auto"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              />
            )}

            {/* Click overlay for full play/pause and control toggle */}
            <div 
              className="absolute inset-0 z-[15] cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                if (isYouTube && ytPlayerRef.current) {
                  const state = ytPlayerRef.current.getPlayerState?.();
                  if (state === 1) {
                    ytPlayerRef.current.pauseVideo?.();
                    setPlaying(false);
                  } else {
                    ytPlayerRef.current.playVideo?.();
                    setPlaying(true);
                  }
                }
                toggleControls();
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                toggleFullscreen();
              }}
            />

            <div ref={ytDomContainer} className="absolute inset-0 h-full w-full z-[10] pointer-events-none" />

            {/* MacFeed Center Play Button Overlay when paused */}
            <AnimatePresence>
              {!playing && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute inset-0 z-[25] flex items-center justify-center pointer-events-none"
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (ytPlayerRef.current) {
                        ytPlayerRef.current.playVideo?.();
                        setPlaying(true);
                      }
                    }}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-[#f5b700] via-amber-400 to-[#f5b700] text-black flex items-center justify-center shadow-[0_0_40px_rgba(245,183,0,0.65)] pointer-events-auto hover:scale-110 active:scale-95 transition-transform"
                    title="Play Video"
                  >
                    <Play className="w-8 h-8 fill-black ml-1" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Transparent overlay for mini mode maximize only */}
            {viewMode === 'mini' && (
              <div 
                className="absolute inset-0 z-30 w-full h-full cursor-pointer bg-transparent" 
                onClick={() => maximize?.()}
              />
            )}
          </div>
        ) : (
          <><video
            ref={nativeVideoRef}
            data-macfeed-player="youtube"
            src={video.video_url}
            poster={video.thumbnail_url?.replace('maxresdefault.jpg', 'mqdefault.jpg')}
            className="block h-full w-full bg-black object-contain"
            playsInline
            autoPlay={!(navigator.connection && (navigator.connection.effectiveType === '2g' || navigator.connection.effectiveType === '3g'))}
            onTimeUpdate={(event) => {
              const cur = event.target.currentTime || 0;
              const dur = event.target.duration || durationStateRef.current || duration || 0;
              setCurrentTime(cur);
              if (currentTimeRef.current) currentTimeRef.current.textContent = formatTime(cur);
              if (dur > 0) {
                durationStateRef.current = dur;
                const pct = Math.min(100, Math.max(0, (cur / dur) * 100));
                if (progressBarRef.current) progressBarRef.current.style.width = `${pct}%`;
                if (scrubberKnobRef.current) scrubberKnobRef.current.style.left = `${pct}%`;
                if (inputRangeRef.current && document.activeElement !== inputRangeRef.current) {
                  inputRangeRef.current.value = pct;
                }
                if (durationRef.current) durationRef.current.textContent = formatTime(dur);
              }
            }}
            onLoadedMetadata={(event) => {
              const dur = event.target.duration || 0;
              if (dur > 0) {
                durationStateRef.current = dur;
                setDuration(dur);
                if (durationRef.current) durationRef.current.textContent = formatTime(dur);
              }
            }}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => { setPlaying(false); onNext?.(); }}
            onError={() => onError?.('This video could not be loaded.')}
          />
        
<img src="/watermark.png" className="absolute top-4 right-4 w-10 h-10 opacity-60 z-[90] w-6 h-6 z-[60] opacity-80 pointer-events-none drop-shadow-md mix-blend-plus-lighter" alt="watermark" />
<img src="/watermark.png" className="absolute top-4 right-4 w-12 h-12 z-[90] opacity-100 pointer-events-none drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]" alt="watermark" />
</>
)}

        {viewMode === 'full' && (
          <>
            {/* CUSTOM TOP BAR: Removed in fullscreen to avoid any click interference with YT settings */}
            {!isFullscreen && (
              <div
                className="absolute left-0 top-0 z-40 flex w-full items-center justify-between bg-gradient-to-b from-black/80 to-transparent px-4 pb-8 pt-3 transition-opacity duration-300"
                onClick={(event) => {
                  event.stopPropagation();
                  showControlsTemporarily(); 
                }}
                onTouchStart={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
                onMouseEnter={showControlsTemporarily}
              >
                <div className="min-w-0 flex-1 pr-3">
                  <p className="truncate text-sm font-medium text-white/90">{video.title}</p>
                </div>

                <div className="flex items-center gap-2">
                  <ControlBtn onClick={toggleFullscreen} title="Fullscreen">
                    <Maximize className="h-5 w-5" />
                  </ControlBtn>
                  {onClose ? (
                    <ControlBtn
                      onClick={(event) => {
                        event.stopPropagation();
                        onClose();
                      }}
                      title="Close"
                    >
                      <X className="h-5 w-5" />
                    </ControlBtn>
                  ) : null}
                </div>
              </div>
            )}

            {/* Custom quality button hidden to avoid overlap with native YT quality selector */}
            {false && isFullscreen && isYouTube ? (
              <div className="absolute bottom-24 right-4 z-[70] sm:right-6" onClick={(event) => event.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => {
                    setShowQualityMenu((prev) => !prev);
                    showControlsTemporarily();
                  }}
                  title={`Quality: ${getQualityLabel(currentQuality)}`}
                  aria-label={`Quality: ${getQualityLabel(currentQuality)}`}
                  className={`inline-flex min-h-12 min-w-12 items-center justify-center rounded-full bg-black/45 px-3 text-[10px] font-black uppercase tracking-[0.18em] text-white transition-all hover:bg-white/15 active:scale-95 ${showQualityMenu ? 'bg-white/20 text-white' : ''}`}
                >
                  {getQualityLabel(currentQuality)}
                </button>

                <AnimatePresence>
                  {showQualityMenu ? (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute bottom-14 right-0 z-[80] w-44 overflow-hidden rounded-3xl border border-white/10 bg-black/95 p-2 shadow-[0_24px_60px_rgba(0,0,0,0.75)] backdrop-blur-2xl"
                    >
                      <div className="px-3 py-2 text-[9px] font-black uppercase tracking-[0.28em] text-white/40">
                        Quality
                      </div>
                      <div className="flex max-h-72 flex-col gap-1 overflow-y-auto pb-1">
                        {YT_QUALITY_OPTIONS
                          .filter((option) => option.value === 'auto' || availableQualities.length === 0 || availableQualities.includes(option.value))
                          .map((option) => {
                            const isActive = currentQuality === option.value || (option.value === 'auto' && currentQuality === 'auto');
                            return (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => handleQualityChange(option.apiValue)}
                                className={`flex min-h-12 items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-black uppercase tracking-wider transition-all active:scale-95 ${isActive ? 'bg-white text-black' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
                              >
                                <span>{option.label}</span>
                                {isActive ? <span className="text-[9px] font-black uppercase tracking-[0.28em]">Selected</span> : null}
                              </button>
                            );
                          })}
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            ) : null}

          {/* MACFEED CUSTOM CONTROLS */}
          <div 
            className={`absolute bottom-0 left-0 right-0 p-2 sm:p-3 pt-8 bg-gradient-to-t from-black/95 via-black/60 to-transparent transition-opacity duration-300 z-[100] ${showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            onClick={(e) => e.stopPropagation()}
          >
              {/* Luxury Amber Progress Bar */}
              <div className="mb-1 w-full group relative flex items-center h-4 cursor-pointer select-none">
                <input
                  ref={inputRangeRef}
                  type="range"
                  min="0"
                  max="100"
                  step="0.1"
                  defaultValue="0"
                  onChange={handleSeek}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  className="absolute w-full h-full opacity-0 cursor-pointer z-30 touch-none"
                />
                <div className="w-full h-1.5 sm:h-2 bg-white/20 rounded-full relative overflow-hidden pointer-events-none">
                  {/* Buffer Bar */}
                  <div ref={bufferBarRef} className="absolute inset-y-0 left-0 bg-white/30 transition-all duration-300" style={{ width: '0%' }} />
                  {/* Progress Bar (Gold / Amber) */}
                  <div ref={progressBarRef} className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-400 to-[#f5b700] shadow-[0_0_12px_rgba(245,183,0,0.7)]" style={{ width: '0%' }} />
                </div>
                {/* Scrubber Knob */}
                <div 
                  ref={scrubberKnobRef}
                  className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-[#f5b700] rounded-full pointer-events-none z-20 shadow-[0_0_10px_rgba(245,183,0,0.9)] border-2 border-white scale-100 transition-transform group-hover:scale-125"
                  style={{ left: '0%', transform: 'translate(-50%, -50%)' }}
                />
              </div>

              <div className="flex items-center justify-between gap-1 text-white">
                <div className="flex items-center gap-1 sm:gap-2">
                  {/* MacFeed Gold Transport Play Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isYouTube && ytPlayerRef.current) {
                        const state = ytPlayerRef.current.getPlayerState?.();
                        if (state === 1) {
                          ytPlayerRef.current.pauseVideo?.();
                          setPlaying(false);
                        } else {
                          ytPlayerRef.current.playVideo?.();
                          setPlaying(true);
                        }
                      } else if (nativeVideoRef.current) {
                        if (nativeVideoRef.current.paused) {
                          nativeVideoRef.current.play();
                          setPlaying(true);
                        } else {
                          nativeVideoRef.current.pause();
                          setPlaying(false);
                        }
                      }
                    }}
                    title={playing ? 'Pause' : 'Play'}
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 border shadow-lg mr-1 ${
                      playing
                        ? 'bg-gradient-to-tr from-[#f5b700] to-amber-400 text-black border-[#f5b700] shadow-[0_0_15px_rgba(245,183,0,0.55)]'
                        : 'bg-white/10 hover:bg-white/20 text-white border-white/20 hover:border-amber-400/50 shadow-[0_4px_12px_rgba(0,0,0,0.4)]'
                    }`}
                  >
                    <span ref={playBtnRef} data-playing={playing ? '1' : '0'}>
                      {playing ? <Pause className="h-4 w-4 fill-black text-black" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
                    </span>
                  </button>
                  <ControlBtn onClick={() => skip(-10)} title="Back 10s (J)">
                    <SkipBack className="h-4 w-4 sm:h-5 sm:w-5" />
                  </ControlBtn>
                  <ControlBtn onClick={() => skip(10)} title="Forward 10s (L)">
                    <SkipForward className="h-4 w-4 sm:h-5 sm:w-5" />
                  </ControlBtn>
                  <div className="hidden sm:flex items-center gap-0.5 px-1 group/vol">
                    <ControlBtn onClick={() => setMuted((prev) => !prev)} title="Mute (M)" className="p-0.5">
                      {muted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </ControlBtn>
                    <input 
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={muted ? 0 : volume}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        setVolume(v);
                        if (v > 0) setMuted(false);
                      }}
                      className="w-12 h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-[#f5b700]"
                    />
                  </div>
                  <div className="sm:hidden flex items-center">
                    <ControlBtn onClick={() => setMuted((prev) => !prev)} title="Mute (M)">
                      {muted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </ControlBtn>
                  </div>
                  {/* Time display */}
                  <span className="ml-1 font-mono text-[10px] sm:text-xs tabular-nums text-white/70">
                    <span ref={currentTimeRef} className="text-white font-bold">0:00</span> / <span ref={durationRef}>0:00</span>
                  </span>
                </div>

                <div className="flex items-center gap-1 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('open-jog-wheel'));
                    }}
                    title="Open Master Jog Wheel"
                    className="hidden xs:flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#f5b700]/15 hover:bg-[#f5b700]/30 border border-[#f5b700]/40 text-[#f5b700] text-[11px] font-bold transition active:scale-95 shadow-[0_0_10px_rgba(245,183,0,0.2)]"
                  >
                    <span>Jog Wheel 🎛️</span>
                  </button>

                  <ControlBtn onClick={handleToggleMiniPlayer} title="Miniplayer (I)">
                    <PictureInPicture2 className="h-4 w-4 sm:h-5 sm:w-5" />
                  </ControlBtn>

                  <ControlBtn onClick={toggleFullscreen} title="Fullscreen (F)">
                    {isFullscreen ? <Minimize className="h-4 w-4 sm:h-5 sm:w-5" /> : <Maximize className="h-4 w-4 sm:h-5 sm:w-5" />}
                  </ControlBtn>
                  <ControlBtn onClick={onNext} title="Next Video (N)">
                    <SkipForward className="h-4 w-4 sm:h-5 sm:w-5 fill-white" />
                  </ControlBtn>
                </div>
              </div>

              <div className="hidden flex-wrap gap-x-3 gap-y-0.5 pt-1 text-[8px] text-white/30 sm:flex">
                <span>K Play</span>
                <span>J -10s</span>
                <span>L +10s</span>
                <span>I Miniplayer</span>
                <span>N Next</span>
                <span>F Full</span>
                <span>M Mute</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
});
