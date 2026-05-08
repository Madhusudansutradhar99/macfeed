import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  ThumbsUp,
  SkipBack,
  SkipForward,
  PictureInPicture2,
  X,
  MonitorPlay,
  Settings,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useVideoMiniPlayer } from '../context/VideoPlayerContext';
import { ScreenOrientation } from '@capacitor/screen-orientation';

const formatTime = (s) => {
  if (!s || isNaN(s)) return '0:00';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60)
    .toString()
    .padStart(2, '0');
  return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${sec}` : `${m}:${sec}`;
};

function KeyToast({ label }) {
  return (
    <motion.div
      key={label + Date.now()}
      initial={{ opacity: 0, y: 10, scale: 0.85 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ duration: 0.15 }}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
    >
      <div className="bg-black/80 backdrop-blur text-white text-base font-semibold px-5 py-2.5 rounded-xl shadow-2xl">
        {label}
      </div>
    </motion.div>
  );
}

function SkipFlash({ dir }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={`absolute top-1/2 -translate-y-1/2 z-30 pointer-events-none flex flex-col items-center
        ${dir < 0 ? 'left-12' : 'right-12'}`}
    >
      <div className="bg-white/20 backdrop-blur rounded-full px-4 py-2 text-white text-sm font-bold">
        {dir < 0 ? `◀◀ ${Math.abs(dir)}s` : `${Math.abs(dir)}s ▶▶`}
      </div>
    </motion.div>
  );
}

function ControlBtn({ onClick, title, children, active, className = '' }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`relative p-2 rounded-full transition-all duration-150 
        hover:bg-white/10 active:scale-90 
        ${active ? 'text-white bg-white/10' : 'text-white/80 hover:text-white'}
        ${className}`}
    >
      {children}
    </button>
  );
}

export default function VideoPlayer({ video, onLike, onClose, onTheaterChange, onMiniChange, onError }) {
  const videoRef = useRef(null);
  const ytDomContainer = useRef(null);
  const ytPlayerRef = useRef(null);
  const ytTimerRef = useRef(null);
  const ytFailSafeRef = useRef(null);

  const containerRef = useRef(null);
  const controlsTimeout = useRef(null);
  const miniPlayerCtx = useVideoMiniPlayer();
  const navigate = useNavigate();

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [theater, setTheater] = useState(false);
  const [qualityLevels, setQualityLevels] = useState([]);
  const [currentQuality, setCurrentQuality] = useState('auto');
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(video?.likes || 0);
  const [buffered, setBuffered] = useState(0);
  const [seekHover, setSeekHover] = useState(null);
  const [toast, setToast] = useState(null);
  const [skipFlash, setSkipFlash] = useState(null);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isPortraitFs, setIsPortraitFs] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const toastTimer = useRef(null);

  // ── Helpers ──
  const showToast = useCallback((label) => {
    setToast(label);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 800);
  }, []);

  const showSkip = (sec) => {
    setSkipFlash(sec);
    setTimeout(() => setSkipFlash(null), 600);
  };

  const skip = useCallback(
    (sec) => {
      if (video?.source === 'youtube') {
        if (ytPlayerRef.current && ytPlayerRef.current.seekTo) {
          const t = ytPlayerRef.current.getCurrentTime() || 0;
          const d = ytPlayerRef.current.getDuration() || duration;
          const target = d > 0 ? Math.max(0, Math.min(d, t + sec)) : Math.max(0, t + sec);
          ytPlayerRef.current.seekTo(target, true);
          showSkip(sec);
        }
      } else if (videoRef.current) {
        const d = videoRef.current.duration || duration;
        const target = d > 0 ? Math.max(0, Math.min(d, videoRef.current.currentTime + sec)) : Math.max(0, videoRef.current.currentTime + sec);
        videoRef.current.currentTime = target;
        showSkip(sec);
      }
    },
    [duration, video?.source]
  );

  // Send to global mini player
  const handleMiniPlayer = useCallback(() => {
    if (miniPlayerCtx) {
      let time = 0;
      if (video?.source === 'youtube' && ytPlayerRef.current?.getCurrentTime) {
        time = ytPlayerRef.current.getCurrentTime();
      } else {
        time = videoRef.current?.currentTime || 0;
      }
      miniPlayerCtx.openMini(video, time, playing);
      navigate('/');
      onMiniChange?.(true);
      showToast('⊡ Mini Player');
    }
  }, [miniPlayerCtx, video, playing, navigate, onMiniChange, showToast]);

  // ── Swipe to Minimize (Mobile) ──
  const touchStart = useRef({ x: 0, y: 0 });

  const handleTouchStart = useCallback((e) => {
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  }, []);

  const handleTouchEnd = useCallback(
    (e) => {
      if (!touchStart.current.y) return;
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;

      const deltaX = Math.abs(touchEndX - touchStart.current.x);
      const deltaY = touchEndY - touchStart.current.y;

      // Swipe down to minimize or exit portrait FS
      if (deltaY > 80 && deltaY > deltaX * 1.5) {
        if (isPortraitFs) {
          setIsPortraitFs(false);
          showToast('Exit Fullscreen');
        } else if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          handleMiniPlayer();
        }
      }
      
      // Swipe up to enter portrait FS
      if (deltaY < -80 && Math.abs(deltaY) > deltaX * 1.5) {
        if (!isPortraitFs && window.innerWidth <= 768) {
          setIsPortraitFs(true);
          showToast('⛶ Fullscreen');
        }
      }

      touchStart.current = { x: 0, y: 0 };
    },
    [handleMiniPlayer, isPortraitFs, showToast]
  );

  // ── YouTube API Setup ──
  useEffect(() => {
    if (video?.source !== 'youtube') {
      if (ytTimerRef.current) clearInterval(ytTimerRef.current);
      if (ytFailSafeRef.current) clearTimeout(ytFailSafeRef.current);
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch (e) { }
        ytPlayerRef.current = null;
      }
      return;
    }

    const initYT = () => {
      if (!ytDomContainer.current) return;

      const videoIdMatch = video.video_url.match(
        /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/
      );
      const ytId = videoIdMatch ? videoIdMatch[1] : '';

      const params = new URLSearchParams(window.location.search);
      const startT = parseInt(params.get('t')) || 0;

      ytDomContainer.current.innerHTML = '';
      const child = document.createElement('div');
      ytDomContainer.current.appendChild(child);

      ytPlayerRef.current = new window.YT.Player(child, {
        videoId: ytId,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 1,
          controls: 1,
          rel: 0,
          modestbranding: 1,
          enablejsapi: 1,
          start: startT,
          playsinline: 1,
        },
        events: {
          onReady: (e) => {
            setLoadFailed(false);
            if (ytFailSafeRef.current) clearTimeout(ytFailSafeRef.current);
            setDuration(e.target.getDuration());
            setVolume(e.target.getVolume() / 100);
            if (ytTimerRef.current) clearInterval(ytTimerRef.current);
            ytTimerRef.current = setInterval(() => {
              if (e.target && e.target.getCurrentTime) {
                const cur = e.target.getCurrentTime();
                const dur = e.target.getDuration();
                setCurrent(cur);
                if (dur > 0) setDuration(dur);
                setBuffered(e.target.getVideoLoadedFraction() * 100 || 0);

                // Quality update
                if (e.target.getAvailableQualityLevels) {
                  const levels = e.target.getAvailableQualityLevels();
                  if (levels.length > 0 && qualityLevels.length === 0) setQualityLevels(levels);
                  const q = e.target.getPlaybackQuality();
                  if (q) setCurrentQuality(q);
                }
              }
            }, 200); // Higher frequency for real-time response
          },
          onStateChange: (e) => {
            if (e.data === window.YT.PlayerState.PLAYING) setPlaying(true);
            else if (
              e.data === window.YT.PlayerState.PAUSED ||
              e.data === window.YT.PlayerState.ENDED
            )
              setPlaying(false);
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
      const first = document.getElementsByTagName('script')[0];
      first.parentNode.insertBefore(tag, first);

      const checkYT = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(checkYT);
          if (ytFailSafeRef.current) clearTimeout(ytFailSafeRef.current);
          initYT();
        }
      }, 100);
      ytFailSafeRef.current = setTimeout(() => {
        clearInterval(checkYT);
        setLoadFailed(true);
        onError?.('The YouTube player timed out while loading.');
      }, 10000);
    } else {
      setTimeout(initYT, 100);
    }

    return () => {
      if (ytTimerRef.current) clearInterval(ytTimerRef.current);
      if (ytFailSafeRef.current) clearTimeout(ytFailSafeRef.current);
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch (e) { }
        ytPlayerRef.current = null;
      }
    };
  }, [video?.video_url, video?.source]);

  // ── State Sync ──
  useEffect(() => {
    if (video?.source === 'youtube') {
      if (ytPlayerRef.current?.playVideo) {
        if (playing) ytPlayerRef.current.playVideo();
        else ytPlayerRef.current.pauseVideo();
      }
      return;
    }
    const vid = videoRef.current;
    if (!vid) return;
    if (playing) vid.play().catch(() => setPlaying(false));
    else vid.pause();
  }, [playing, video?.source]);

  useEffect(() => {
    if (video?.source === 'youtube') {
      if (ytPlayerRef.current?.setVolume) {
        if (muted) ytPlayerRef.current.mute();
        else {
          ytPlayerRef.current.unMute();
          ytPlayerRef.current.setVolume(volume * 100);
        }
      }
      return;
    }
    if (videoRef.current) {
      videoRef.current.muted = muted;
      videoRef.current.volume = volume;
    }
  }, [muted, volume, video?.source]);

  useEffect(() => {
    if (video?.source === 'youtube') {
      if (ytPlayerRef.current?.setPlaybackRate) {
        ytPlayerRef.current.setPlaybackRate(playbackRate);
      }
      return;
    }
    if (videoRef.current) videoRef.current.playbackRate = playbackRate;
  }, [playbackRate, video?.source]);

  // Reset on video change
  useEffect(() => {
    if (video?.source === 'youtube') return; // Handled by iframe reload
    setPlaying(false);
    setCurrent(0);
    setDuration(0);
    setLiked(false);
    setLikes(video?.likes || 0);
    setTheater(false);
    setPlaybackRate(1);

    const params = new URLSearchParams(window.location.search);
    const t = parseInt(params.get('t'));
    const autoplay = params.get('autoplay');
    if (t && videoRef.current) videoRef.current.currentTime = t;
    if (autoplay === '1') setTimeout(() => setPlaying(true), 300);
  }, [video?.id, video?.source]);

  useEffect(() => {
    onTheaterChange?.(theater);
  }, [theater, onTheaterChange]);

  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    // If the window lost focus (likely to the iframe), try to regain it on mouse activity
    if (document.activeElement?.tagName === 'IFRAME') {
      window.focus();
    }
    clearTimeout(controlsTimeout.current);
    if (playing) {
      controlsTimeout.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, [playing]);

  useEffect(() => {
    resetControlsTimer();
    return () => clearTimeout(controlsTimeout.current);
  }, [playing, resetControlsTimer]);

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (window.innerWidth <= 768) {
      if (!isPortraitFs) {
        setIsPortraitFs(true);
        showToast('⛶ Landscape FS');
        try { await ScreenOrientation.lock({ orientation: 'landscape' }); } catch (e) { }
      } else {
        setIsPortraitFs(false);
        showToast('Exit Fullscreen');
        try { await ScreenOrientation.unlock(); } catch (e) { }
      }
    } else {
      if (!document.fullscreenElement) containerRef.current?.requestFullscreen();
      else document.exitFullscreen();
    }
  }, [isPortraitFs, showToast]);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handleKey = (e) => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      switch (e.key.toLowerCase()) {
        case 'k':
        case ' ':
          e.preventDefault();
          if (document.activeElement) document.activeElement.blur();
          setPlaying((p) => {
            showToast(p ? '⏸ Pause' : '▶ Play');
            return !p;
          });
          break;
        case 'j':
          e.preventDefault();
          skip(-10);
          showToast('◀◀ -10s');
          break;
        case 'l':
          e.preventDefault();
          skip(10);
          showToast('▶▶ +10s');
          break;
        case 'm':
          e.preventDefault();
          setMuted((m) => {
            showToast(m ? '🔊 Unmuted' : '🔇 Muted');
            return !m;
          });
          break;
        case 'f':
          e.preventDefault();
          if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
            showToast('⛶ Fullscreen');
          } else {
            document.exitFullscreen();
            showToast('Exit Fullscreen');
          }
          break;
        case 'escape':
          if (document.fullscreenElement) {
            e.preventDefault();
            document.exitFullscreen();
            showToast('Exit Fullscreen');
          }
          break;
        case 't':
          e.preventDefault();
          setTheater((t) => {
            showToast(t ? 'Normal' : '🎭 Theater');
            return !t;
          });
          break;
        case 'i':
          e.preventDefault();
          e.stopPropagation();
          if (handleMiniPlayer) handleMiniPlayer();
          break;
        case 'arrowup':
          e.preventDefault();
          setVolume((v) => {
            const nv = Math.min(1, parseFloat((v + 0.1).toFixed(1)));
            showToast(`🔊 ${Math.round(nv * 100)}%`);
            return nv;
          });
          break;
        case 'arrowdown':
          e.preventDefault();
          setVolume((v) => {
            const nv = Math.max(0, parseFloat((v - 0.1).toFixed(1)));
            showToast(`🔊 ${Math.round(nv * 100)}%`);
            return nv;
          });
          break;
        case 'arrowleft':
          e.preventDefault();
          skip(-5);
          showToast('← -5s');
          break;
        case 'arrowright':
          e.preventDefault();
          skip(5);
          showToast('+5s →');
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', handleKey, true);
    return () => window.removeEventListener('keydown', handleKey, true);
  }, [skip, toggleFullscreen, showToast, handleMiniPlayer]);

  const handleSeekClick = (e) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const target = percent * duration;

    if (video?.source === 'youtube') {
      if (ytPlayerRef.current?.seekTo) ytPlayerRef.current.seekTo(target, true);
    } else if (videoRef.current && duration) {
      videoRef.current.currentTime = target;
    }
  };

  const handleSeekHover = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    setSeekHover({ pct, time: (pct / 100) * duration });
  };

  const handleProgress = () => {
    if (video?.source === 'youtube') return; // Handled in initYT
    const vid = videoRef.current;
    if (vid?.buffered.length > 0) {
      setBuffered((vid.buffered.end(vid.buffered.length - 1) / vid.duration) * 100 || 0);
    }
  };

  const handleLike = (e) => {
    e.stopPropagation();
    if (!liked) {
      setLiked(true);
      setLikes((l) => l + 1);
      onLike?.();
    }
  };

  const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  return (
    <div className="flex flex-col w-full">
      <div
        ref={containerRef}
        className={`relative bg-black overflow-hidden select-none w-full
          ${!isPortraitFs && !theater ? 'aspect-video' : 'h-auto'}
          ${theater && !isFullscreen ? 'rounded-none' : 'rounded-2xl'}
          ${isPortraitFs ? 'yt-fullscreen' : ''}`}
        onMouseMove={resetControlsTimer}
        onMouseLeave={() => {
          playing && setShowControls(false);
          setShowVolumeSlider(false);
          setShowSpeedMenu(false);
        }}
        onClick={() => setPlaying((p) => !p)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {video?.source === 'youtube' ? (
          <div className="w-full h-full bg-black relative overflow-hidden">
            {loadFailed ? (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/90 text-center p-6">
                <div>
                  <p className="text-red-300 font-black uppercase tracking-[0.25em] text-sm">Playback unavailable</p>
                  <p className="mt-2 text-white/70 text-xs">Please retry the page or choose another video.</p>
                </div>
              </div>
            ) : null}
            <div
              ref={ytDomContainer}
              className="absolute inset-0 w-full h-full pointer-events-auto transition-all duration-500 ease-in-out"
              style={{
                transform: isZoomed ? 'scale(1.12)' : 'scale(1)',
                width: isZoomed ? '100%' : '100%',
                height: isZoomed ? '100%' : '100%',
              }}
            />
          </div>
        ) : (
          <video
            ref={videoRef}
            src={video?.video_url}
            poster={video?.thumbnail_url}
            className="w-full h-auto max-h-full bg-black block transition-all duration-500 ease-in-out"
            style={{
              transform: isZoomed ? 'scale(1.12)' : 'scale(1)',
              objectFit: isZoomed ? 'cover' : 'contain',
              width: '100%',
              height: 'auto'
            }}
            playsInline
            onTimeUpdate={(e) => setCurrent(e.target.currentTime)}
            onLoadedMetadata={(e) => setDuration(e.target.duration)}
            onProgress={handleProgress}
            onEnded={() => setPlaying(false)}
            onError={() => {
              setPlaying(false);
              setLoadFailed(true);
              onError?.('This video could not be loaded.');
            }}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          />
        )}

        {/* Keyboard toast */}
        <AnimatePresence>{toast && <KeyToast key={toast} label={toast} />}</AnimatePresence>

        {/* Skip flash */}
        <AnimatePresence>
          {skipFlash && <SkipFlash key={`skip${skipFlash}${Date.now()}`} dir={skipFlash} />}
        </AnimatePresence>

        <AnimatePresence>
          {showControls && (
            <>
              {/* ── Top Bar (Shared for both YouTube and MP4) ── */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="absolute top-0 left-0 w-full bg-gradient-to-b from-black/80 to-transparent px-4 pt-3 pb-8 z-[5000] pointer-events-auto block"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between">
                  <span className="text-white/90 text-sm font-medium truncate max-w-[70%] drop-shadow-md">
                    {video?.title}
                  </span>
                  <div className="flex items-center gap-2 drop-shadow-md">
                    <ControlBtn
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsZoomed(!isZoomed);
                        showToast(isZoomed ? 'Original' : 'Fill Screen');
                      }}
                      title="Zoom to Fill"
                      active={isZoomed}
                    >
                      <Maximize className={`w-[18px] h-[18px] ${isZoomed ? 'rotate-45' : ''}`} />
                    </ControlBtn>
                    {video?.source === 'youtube' && (
                      <>
                        <ControlBtn
                          onClick={handleLike}
                          title="Like"
                          active={liked}
                          className={liked ? '!text-purple-400' : ''}
                        >
                          <div className="flex items-center gap-1">
                            <ThumbsUp
                              className={`w-[18px] h-[18px] ${liked ? 'fill-purple-400' : ''}`}
                            />
                            <span className="text-[11px] font-semibold hidden sm:inline">
                              {likes}
                            </span>
                          </div>
                        </ControlBtn>
                        <ControlBtn
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMiniPlayer();
                          }}
                          title="Mini Player (I)"
                        >
                          <PictureInPicture2 className="w-[18px] h-[18px]" />
                        </ControlBtn>
                      </>
                    )}
                    <ControlBtn
                      onClick={(e) => {
                        e.stopPropagation();
                        setTheater((t) => !t);
                      }}
                      title="Theater Mode (T)"
                      active={theater}
                    >
                      <MonitorPlay className="w-[18px] h-[18px]" />
                    </ControlBtn>
                    <ControlBtn
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFullscreen();
                      }}
                      title="Fullscreen (F)"
                    >
                      {isFullscreen ? (
                        <Minimize className="w-[20px] h-[20px]" />
                      ) : (
                        <Maximize className="w-[20px] h-[20px]" />
                      )}
                    </ControlBtn>
                    {onClose && (
                      <ControlBtn
                        onClick={(e) => {
                          e.stopPropagation();
                          onClose();
                        }}
                        title="Close"
                      >
                        <X className="w-5 h-5" />
                      </ControlBtn>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* ── Center and Bottom Controls ── */}
              <>
                {/* Center play/pause */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                  <AnimatePresence>
                    {!playing && (
                      <motion.div
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 1.4, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="w-16 h-16 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20 pointer-events-auto"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPlaying(true);
                        }}
                      >
                        <Play className="w-8 h-8 text-white fill-white ml-1" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Bottom controls */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.2 }}
                  className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/90 via-black/60 to-transparent px-4 pt-8 pb-3 flex flex-col gap-1.5 z-[5001] pointer-events-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* ── Seek bar ── */}
                  <div
                    className="relative w-full h-[5px] bg-white/20 rounded-full cursor-pointer group/seek"
                    style={{
                      paddingTop: '6px',
                      paddingBottom: '6px',
                      marginTop: '-6px',
                      marginBottom: '-6px',
                    }}
                    onClick={handleSeekClick}
                    onMouseMove={handleSeekHover}
                    onMouseLeave={() => setSeekHover(null)}
                  >
                    <div className="absolute inset-y-0 my-auto h-[5px] w-full rounded-full overflow-hidden group-hover/seek:h-[7px] transition-all duration-150">
                      <div
                        className="absolute h-full bg-white/25 rounded-full"
                        style={{ width: `${buffered}%` }}
                      />
                      <div
                        className="absolute h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                        style={{ width: `${(current / (duration || 1)) * 100 || 0}%` }}
                      >
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[14px] h-[14px] bg-white rounded-full shadow-lg scale-0 group-hover/seek:scale-100 transition-transform duration-150 border-2 border-purple-400" />
                      </div>
                    </div>
                    {seekHover && (
                      <div
                        className="absolute -top-8 bg-black/90 text-white text-[11px] px-2 py-1 rounded-lg pointer-events-none whitespace-nowrap font-mono shadow-lg"
                        style={{
                          left: `clamp(16px, ${seekHover.pct}%, calc(100% - 40px))`,
                          transform: 'translateX(-50%)',
                        }}
                      >
                        {formatTime(seekHover.time)}
                      </div>
                    )}
                  </div>

                  {/* ── Button row ── */}
                  <div className="flex items-center justify-between gap-1 text-white mt-1">
                    {/* Left controls */}
                    <div className="flex items-center gap-0.5">
                      <ControlBtn
                        onClick={(e) => {
                          e.stopPropagation();
                          setPlaying((p) => !p);
                        }}
                        title={playing ? 'Pause (K)' : 'Play (K)'}
                      >
                        {playing ? (
                          <Pause className="w-[22px] h-[22px]" />
                        ) : (
                          <Play className="w-[22px] h-[22px] fill-white ml-0.5" />
                        )}
                      </ControlBtn>
                      <ControlBtn
                        onClick={(e) => {
                          e.stopPropagation();
                          skip(-5);
                        }}
                        title="Rewind 5s"
                      >
                        <div className="relative">
                          <SkipBack className="w-5 h-5" />
                          <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 text-[7px] font-bold">
                            5
                          </span>
                        </div>
                      </ControlBtn>
                      <ControlBtn
                        onClick={(e) => {
                          e.stopPropagation();
                          skip(5);
                        }}
                        title="Forward 5s"
                      >
                        <div className="relative">
                          <SkipForward className="w-5 h-5" />
                          <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 text-[7px] font-bold">
                            5
                          </span>
                        </div>
                      </ControlBtn>

                      <div
                        className="flex items-center"
                        onMouseEnter={() => setShowVolumeSlider(true)}
                        onMouseLeave={() => setShowVolumeSlider(false)}
                      >
                        <ControlBtn
                          onClick={(e) => {
                            e.stopPropagation();
                            setMuted((m) => !m);
                          }}
                          title="Mute (M)"
                        >
                          {muted || volume === 0 ? (
                            <VolumeX className="w-5 h-5" />
                          ) : (
                            <Volume2 className="w-5 h-5" />
                          )}
                        </ControlBtn>
                        <div
                          className={`overflow-hidden transition-all duration-200 ${showVolumeSlider ? 'w-20 opacity-100 ml-1' : 'w-0 opacity-0'}`}
                        >
                          <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.01}
                            value={muted ? 0 : volume}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              e.stopPropagation();
                              setVolume(Number(e.target.value));
                              if (Number(e.target.value) > 0) setMuted(false);
                            }}
                            className="w-full accent-purple-500 cursor-pointer h-1"
                          />
                        </div>
                      </div>
                      <span className="text-[11px] text-white/60 font-mono tabular-nums ml-2 hidden sm:block">
                        {formatTime(current)} / {formatTime(duration)}
                      </span>
                    </div>

                    {/* Right controls */}
                    <div className="flex items-center gap-0.5">
                      <ControlBtn
                        onClick={handleLike}
                        title="Like"
                        active={liked}
                        className={liked ? '!text-purple-400' : ''}
                      >
                        <div className="flex items-center gap-1">
                          <ThumbsUp
                            className={`w-[18px] h-[18px] ${liked ? 'fill-purple-400' : ''}`}
                          />
                          <span className="text-[11px] font-semibold hidden sm:inline">
                            {likes}
                          </span>
                        </div>
                      </ControlBtn>
                      <div className="relative">
                        <ControlBtn
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowSpeedMenu((s) => !s);
                            setShowQualityMenu(false);
                          }}
                          title="Settings"
                          active={showSpeedMenu || showQualityMenu || playbackRate !== 1 || currentQuality !== 'auto'}
                        >
                          <Settings className="w-[18px] h-[18px]" />
                        </ControlBtn>
                        <AnimatePresence>
                          {(showSpeedMenu || showQualityMenu) && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              className="absolute bottom-full right-0 mb-2 bg-[#1a1a2e]/95 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl overflow-hidden py-1 min-w-[150px]"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {showSpeedMenu && (
                                <>
                                  <div className="px-3 py-1.5 text-[10px] text-gray-500 font-bold uppercase tracking-wider border-b border-white/5 flex justify-between items-center">
                                    <span>Playback Speed</span>
                                    {video?.source === 'youtube' && qualityLevels.length > 0 && (
                                      <button
                                        onClick={() => { setShowSpeedMenu(false); setShowQualityMenu(true); }}
                                        className="text-purple-400 hover:text-purple-300"
                                      >
                                        Quality →
                                      </button>
                                    )}
                                  </div>
                                  {SPEEDS.map((s) => (
                                    <button
                                      key={s}
                                      onClick={() => {
                                        setPlaybackRate(s);
                                        setShowSpeedMenu(false);
                                        showToast(`⚡ ${s}x`);
                                      }}
                                      className={`w-full text-left px-3 py-1.5 text-sm transition hover:bg-white/10 ${playbackRate === s ? 'text-purple-400 font-semibold bg-purple-500/10' : 'text-white/80'}`}
                                    >
                                      {s === 1 ? 'Normal' : `${s}x`}
                                    </button>
                                  ))}
                                </>
                              )}

                              {showQualityMenu && (
                                <>
                                  <div className="px-3 py-1.5 text-[10px] text-gray-500 font-bold uppercase tracking-wider border-b border-white/5 flex justify-between items-center">
                                    <button
                                      onClick={() => { setShowQualityMenu(false); setShowSpeedMenu(true); }}
                                      className="text-purple-400 hover:text-purple-300"
                                    >
                                      ← Speed
                                    </button>
                                    <span>Quality</span>
                                  </div>
                                  {['auto', ...qualityLevels].map((q) => (
                                    <button
                                      key={q}
                                      onClick={() => {
                                        if (ytPlayerRef.current?.setPlaybackQuality) {
                                          ytPlayerRef.current.setPlaybackQuality(q);
                                          setCurrentQuality(q);
                                          setShowQualityMenu(false);
                                          showToast(`🎬 ${q.toUpperCase()}`);
                                        }
                                      }}
                                      className={`w-full text-left px-3 py-1.5 text-sm transition hover:bg-white/10 ${currentQuality === q ? 'text-purple-400 font-semibold bg-purple-500/10' : 'text-white/80'}`}
                                    >
                                      {q.toUpperCase()}
                                    </button>
                                  ))}
                                </>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <ControlBtn
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMiniPlayer();
                        }}
                        title="Mini Player (I)"
                      >
                        <PictureInPicture2 className="w-[18px] h-[18px]" />
                      </ControlBtn>
                      <ControlBtn
                        onClick={(e) => {
                          e.stopPropagation();
                          setTheater((t) => !t);
                        }}
                        title="Theater Mode (T)"
                        active={theater}
                      >
                        <MonitorPlay className="w-[18px] h-[18px]" />
                      </ControlBtn>
                      <ControlBtn
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFullscreen();
                        }}
                        title="Fullscreen (F)"
                      >
                        {isFullscreen ? (
                          <Minimize className="w-[20px] h-[20px]" />
                        ) : (
                          <Maximize className="w-[20px] h-[20px]" />
                        )}
                      </ControlBtn>
                    </div>
                  </div>
                  <div className="hidden sm:flex flex-wrap gap-x-3 gap-y-0.5 text-[8px] text-white/20 mt-0.5">
                    <span>K Play</span>
                    <span>J -10s</span>
                    <span>L +10s</span>
                    <span>I Mini</span>
                    <span>M Mute</span>
                    <span>T Theater</span>
                    <span>F Full</span>
                    <span>↑↓ Vol</span>
                    <span>←→ 5s</span>
                  </div>
                </motion.div>
              </>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* ── Mobile-Only Action Bar (BELOW Video) ── */}
      <div className="sm:hidden flex items-center justify-between px-3 py-2 mt-2 bg-[#181828] rounded-xl border border-white/5">
        <button
          onClick={handleMiniPlayer}
          className="flex items-center gap-2 text-purple-400 font-medium text-sm py-1.5 px-3 bg-purple-500/10 rounded-lg active:scale-95 transition-transform"
        >
          <PictureInPicture2 className="w-4 h-4" /> Minimize Video
        </button>
      </div>
    </div>
  );
}
