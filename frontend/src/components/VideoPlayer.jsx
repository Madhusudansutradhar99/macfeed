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
  X,
  Settings,
  ChevronUp,
} from 'lucide-react';
import { ScreenOrientation } from '@capacitor/screen-orientation';

const formatTime = (seconds) => {
  if (!seconds || Number.isNaN(seconds)) return '0:00';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
  return hours > 0
    ? `${hours}:${minutes.toString().padStart(2, '0')}:${secs}`
    : `${minutes}:${secs}`;
};

function ControlBtn({ onClick, title, children, className = '' }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`relative rounded-full p-2 text-white/90 transition-all duration-150 hover:bg-white/10 hover:text-white active:scale-90 ${className}`}
    >
      {children}
    </button>
  );
}

export default function VideoPlayer({ video, onClose, onMiniChange, onError }) {
  const containerRef = useRef(null);
  const ytDomContainer = useRef(null);
  const ytPlayerRef = useRef(null);
  const ytTimerRef = useRef(null);
  const ytFailSafeRef = useRef(null);
  const nativeVideoRef = useRef(null);
  const controlsTimeout = useRef(null);
  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [availableQualities, setAvailableQualities] = useState([]);
  const [currentQuality, setCurrentQuality] = useState('auto');
  const [forceLandscape, setForceLandscape] = useState(false);

  const isYouTube = video?.source === 'youtube';

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => {
      if (playing) setShowControls(false);
    }, 3000); // 3 seconds as requested
  }, [playing]);

  const toggleControls = useCallback((e) => {
    if (e) e.stopPropagation();
    setShowControls(prev => {
      const next = !prev;
      if (next) showControlsTemporarily();
      else clearTimeout(controlsTimeout.current);
      return next;
    });
    setShowQualityMenu(false);
  }, [showControlsTemporarily]);

  const skip = useCallback(
    (seconds) => {
      if (isYouTube && ytPlayerRef.current?.seekTo) {
        const currentTime = ytPlayerRef.current.getCurrentTime?.() || 0;
        const videoDuration = ytPlayerRef.current.getDuration?.() || duration || 0;
        const target = Math.max(0, Math.min(videoDuration || currentTime + seconds, currentTime + seconds));
        ytPlayerRef.current.seekTo(target, true);
        return;
      }

      if (nativeVideoRef.current) {
        const target = Math.max(0, Math.min(nativeVideoRef.current.duration || duration || 0, nativeVideoRef.current.currentTime + seconds));
        nativeVideoRef.current.currentTime = target;
      }
    },
    [duration, isYouTube]
  );

  const toggleFullscreen = useCallback(async () => {
    const host = containerRef.current;
    if (!host) return;

    try {
      if (!document.fullscreenElement) {
        const request = host.requestFullscreen?.bind(host) || host.webkitRequestFullscreen?.bind(host);
        if (request) await request();
        try {
          await ScreenOrientation.lock({ orientation: 'landscape-primary' });
          setForceLandscape(false);
        } catch (err) {
          // FIX 1: CSS fallback for landscape
          if (window.innerWidth < window.innerHeight) {
            setForceLandscape(true);
          }
        }
      } else {
        await document.exitFullscreen().catch(() => { });
        try {
          await ScreenOrientation.unlock();
        } catch (err) {
          // ignore
        }
        setForceLandscape(false);
      }
    } catch (err) {
      // Keep fullscreen usable even if lock fails.
    }
  }, []);

  const handleMiniPlayer = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => { });
    }
    onMiniChange?.(current, playing);
  }, [onMiniChange, current, playing]);

  const handleTouchStart = useCallback((event) => {
    const touch = event.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  }, []);

  const handleTouchEnd = useCallback(
    (event) => {
      const start = touchStartRef.current;
      if (!start.time) return;

      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - start.x;
      const deltaY = touch.clientY - start.y;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      // YouTube-style horizontal swipe seeking.
      if (absX > 70 && absX > absY * 1.2) {
        if (deltaX > 0) skip(10);
        else skip(-10);
        showControlsTemporarily();
      }

      // FIX 3: Swipe UP to enter fullscreen (80px threshold)
      if (deltaY < -80 && absY > absX * 1.2) {
        if (!document.fullscreenElement) {
          toggleFullscreen();
        }
      }

      // FIX 3: Swipe DOWN to exit fullscreen or minimize (80px threshold)
      if (deltaY > 80 && absY > absX * 1.2) {
        if (document.fullscreenElement) {
          toggleFullscreen();
        } else if (window.innerWidth <= 768 && onMiniChange) {
          onMiniChange(true);
        }
      }

      touchStartRef.current = { x: 0, y: 0, time: 0 };
    },
    [onMiniChange, showControlsTemporarily, skip, toggleFullscreen]
  );

  useEffect(() => {
    const onFsChange = async () => {
      const isFs = !!document.fullscreenElement;
      setIsFullscreen(isFs);
      if (isFs) {
        try {
          await ScreenOrientation.lock({ orientation: 'landscape-primary' });
          setForceLandscape(false);
        } catch (err) {
          if (window.innerWidth < window.innerHeight) {
            setForceLandscape(true);
          }
        }
      } else {
        try {
          await ScreenOrientation.unlock();
        } catch (err) {
          // ignore
        }
        setForceLandscape(false);
      }
    };

    const onOrientation = () => {
      // Removed auto-exit logic to keep landscape permanent
    };

    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
    window.addEventListener('orientationchange', onOrientation);

    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange);
      window.removeEventListener('orientationchange', onOrientation);
    };
  }, [forceLandscape]);

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
      const youtubeId = match ? match[1] : '';

      ytDomContainer.current.innerHTML = '';
      const host = document.createElement('div');
      ytDomContainer.current.appendChild(host);

      ytPlayerRef.current = new window.YT.Player(host, {
        videoId: youtubeId,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 1,
          controls: 0,
          rel: 0,
          modestbranding: 1,
          enablejsapi: 1,
          playsinline: 1,
          fs: 0,
          disablekb: 1,
        },
        events: {
          onReady: (event) => {
            setLoadFailed(false);
            setDuration(event.target.getDuration?.() || 0);
            setVolume((event.target.getVolume?.() || 100) / 100);

            if (ytTimerRef.current) clearInterval(ytTimerRef.current);
            ytTimerRef.current = setInterval(() => {
              try {
                const cur = event.target.getCurrentTime?.() || 0;
                const dur = event.target.getDuration?.() || 0;
                setCurrent(cur);
                if (dur > 0) setDuration(dur);
              } catch (err) {
                // ignore
              }
            }, 250);

            setTimeout(() => {
              try {
                const iframe = ytDomContainer.current?.querySelector('iframe');
                if (iframe) {
                  iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture; encrypted-media');
                  iframe.setAttribute('allowfullscreen', '');
                  iframe.setAttribute('playsinline', '1');
                  iframe.style.touchAction = 'manipulation';
                }
              } catch (err) {
                // ignore
              }
            }, 100);

            // Fetch qualities
            if (event.target.getAvailableQualityLevels) {
              const levels = event.target.getAvailableQualityLevels();
              setAvailableQualities(levels);
            }
          },
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.PLAYING) setPlaying(true);
            if (event.data === window.YT.PlayerState.PAUSED) setPlaying(false);
            if (event.data === window.YT.PlayerState.ENDED) {
              setPlaying(false);
              // FIX 3: Auto play next related video
              fetch(`/api/related?videoId=${video.id || ''}`)
                .then(res => res.json())
                .then(data => {
                  if (data.results && data.results.length > 0) {
                    const nextVid = data.results[0];
                    // Navigate or call onClose and then open new one?
                    // The best way in this app structure is to trigger a custom event or use the context.
                    // Since VideoPlayer is a component, we might need a way to tell the parent.
                    // For now, let's try to find a global way or just reload with new video ID.
                    window.location.href = `/#/watch/${nextVid.id}`;
                    window.location.reload();
                  }
                })
                .catch(() => {});
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

    return () => {
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
    };
  }, [isYouTube, onError, video?.video_url]);

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
          handleMiniPlayer();
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
  }, [handleMiniPlayer, skip, toggleFullscreen, setPlaying, setMuted, setVolume]); // Added missing deps

  if (!video) return null;

  return (
    <div 
      className={`flex w-full flex-col ${isFullscreen ? 'fixed inset-0 z-[100] bg-black h-screen w-screen' : ''} ${forceLandscape ? 'rotate-90 origin-center' : ''}`}
      style={forceLandscape ? { width: '100vh', height: '100vw', position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(90deg)' } : {}}
    >
      <div
        ref={containerRef}
        className={`${isFullscreen ? 'h-full w-full' : 'relative w-full rounded-2xl sm:rounded-[32px] aspect-video'} overflow-hidden select-none bg-black flex items-center justify-center`}
        onMouseMove={showControlsTemporarily}
        onTouchStart={handleTouchStart}
        onTouchEnd={(e) => {
          handleTouchEnd(e);
          // If it's a simple tap (short duration, small delta)
          const start = touchStartRef.current;
          if (!start.time) return;
          const deltaX = Math.abs(e.changedTouches[0].clientX - start.x);
          const deltaY = Math.abs(e.changedTouches[0].clientY - start.y);
          const duration = Date.now() - start.time;
          
          if (duration < 300 && deltaX < 15 && deltaY < 15) {
            e.preventDefault();
            e.stopPropagation();
            toggleControls();
          }
        }}
        onClick={(e) => {
          // If clicking the container itself (not buttons), toggle controls
          if (e.target === e.currentTarget) {
            toggleControls(e);
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

            <div ref={ytDomContainer} className="absolute inset-0 h-full w-full pointer-events-auto" />
            
            {/* FIX: Transparent overlay to capture taps ONLY when controls are hidden or when clicking background */}
            {!controlsVisible && (
              <div 
                className="absolute inset-0 z-30 w-full h-full cursor-pointer" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleControls();
                }}
              />
            )}
          </div>
        ) : (
          <video
            ref={nativeVideoRef}
            data-macfeed-player="youtube"
            src={video.video_url}
            poster={video.thumbnail_url}
            className="block h-full w-full bg-black object-contain"
            playsInline
            onTimeUpdate={(event) => setCurrent(event.target.currentTime)}
            onLoadedMetadata={(event) => setDuration(event.target.duration)}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
            onError={() => onError?.('This video could not be loaded.')}
          />
        )}

        {showControls && (
          <>
            <div
              className="absolute left-0 top-0 z-40 flex w-full items-center justify-between bg-gradient-to-b from-black/80 to-transparent px-4 pb-8 pt-3"
              onClick={(event) => {
                event.stopPropagation();
                showControlsTemporarily(); // Reset timer on interaction
              }}
            >
              <div className="min-w-0 flex-1 pr-3">
                <p className="truncate text-sm font-medium text-white/90">{video.title}</p>
              </div>

              <div className="flex items-center gap-2">
                <ControlBtn onClick={handleMiniPlayer} title="Minimize video">
                  <Minimize className="h-5 w-5" />
                </ControlBtn>
                <ControlBtn onClick={toggleFullscreen} title="Fullscreen">
                  {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
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

            {/* FIX 4: Mobile-friendly Quality Menu */}
            <AnimatePresence>
              {showQualityMenu && (
                <div 
                  className="absolute bottom-24 right-6 z-[1000] bg-black/95 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-3 min-w-[160px] shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 px-4 py-3 border-b border-white/5 mb-2">Quality</p>
                  <div className="flex flex-col gap-1">
                    {['1080p', '720p', '480p', '360p', 'auto'].map((q) => (
                      <button
                        key={q}
                        onClick={() => {
                          if (isYouTube && ytPlayerRef.current?.setPlaybackQuality) {
                            ytPlayerRef.current.setPlaybackQuality(q === '1080p' ? 'hd1080' : q === '720p' ? 'hd720' : q === '480p' ? 'large' : q === '360p' ? 'medium' : 'auto');
                            setCurrentQuality(q);
                          }
                          setShowQualityMenu(false);
                        }}
                        className={`w-full text-left px-5 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all active:scale-95 ${currentQuality === q ? 'bg-white text-black' : 'text-white/60 hover:bg-white/10'}`}
                      >
                        {q === 'auto' ? 'Auto Mode' : q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </AnimatePresence>

            <div
              className="absolute bottom-0 left-0 z-40 w-full bg-gradient-to-t from-black/90 via-black/60 to-transparent px-3 pb-3 pt-8 sm:px-4"
              onClick={(event) => {
                event.stopPropagation();
                showControlsTemporarily(); // Reset timer on interaction
              }}
            >
              <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-white/15">
                <div className="h-full rounded-full bg-white/25" style={{ width: `${(current / (duration || 1)) * 100 || 0}%` }} />
              </div>

              <div className="flex items-center justify-between gap-1 text-white">
                <div className="flex items-center gap-0.5">
                  <ControlBtn onClick={() => setPlaying((prev) => !prev)} title={playing ? 'Pause' : 'Play'}>
                    {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 fill-white" />}
                  </ControlBtn>
                  <ControlBtn onClick={() => skip(-10)} title="Back 10s">
                    <SkipBack className="h-5 w-5" />
                  </ControlBtn>
                  <ControlBtn onClick={() => skip(10)} title="Forward 10s">
                    <SkipForward className="h-5 w-5" />
                  </ControlBtn>
                  <ControlBtn onClick={() => setMuted((prev) => !prev)} title="Mute">
                    {muted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                  </ControlBtn>
                  <span className="ml-2 hidden font-mono text-[11px] tabular-nums text-white/60 sm:block">
                    {formatTime(current)} / {formatTime(duration)}
                  </span>
                </div>

                <div className="flex items-center gap-0.5">
                  <ControlBtn 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowQualityMenu(!showQualityMenu);
                    }} 
                    title="Quality"
                    className={showQualityMenu ? 'bg-white/20' : ''}
                  >
                    <Settings className="h-5 w-5" />
                  </ControlBtn>
                  <ControlBtn onClick={toggleFullscreen} title="Fullscreen">
                    {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                  </ControlBtn>
                </div>
              </div>

              <div className="hidden flex-wrap gap-x-3 gap-y-0.5 pt-1 text-[8px] text-white/20 sm:flex">
                <span>K Play</span>
                <span>J -10s</span>
                <span>L +10s</span>
                <span>M Mute</span>
                <span>F Full</span>
                <span>←→ 10s</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
