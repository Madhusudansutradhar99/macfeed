import React, { useCallback, useEffect, useRef, useState } from 'react';
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

  const isYouTube = video?.source === 'youtube';

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => {
      if (playing) setShowControls(false);
    }, 2500);
  }, [playing]);

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
          await ScreenOrientation.lock({ orientation: 'landscape' });
        } catch (err) {
          // orientation lock is optional
        }
      } else {
        await document.exitFullscreen().catch(() => {});
        try {
          await ScreenOrientation.unlock();
        } catch (err) {
          // ignore
        }
      }
    } catch (err) {
      // Keep fullscreen usable even if lock fails.
    }
  }, []);

  const handleMiniPlayer = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
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

      // Swipe down exits fullscreen or minimizes on mobile.
      if (deltaY > 90 && absY > absX * 1.2) {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        } else if (window.innerWidth <= 768 && onMiniChange) {
          onMiniChange(true);
        }
      }

      touchStartRef.current = { x: 0, y: 0, time: 0 };
    },
    [onMiniChange, showControlsTemporarily, skip]
  );

  useEffect(() => {
    const onFsChange = async () => {
      const isFs = !!document.fullscreenElement;
      setIsFullscreen(isFs);
      if (isFs) {
        try {
          await ScreenOrientation.lock({ orientation: 'landscape' });
        } catch (err) {
          // ignore
        }
      } else {
        try {
          await ScreenOrientation.unlock();
        } catch (err) {
          // ignore
        }
      }
    };

    const onOrientation = () => {
      if (document.fullscreenElement && window.innerHeight > window.innerWidth) {
        document.exitFullscreen().catch(() => {});
      }
    };

    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
    window.addEventListener('orientationchange', onOrientation);

    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange);
      window.removeEventListener('orientationchange', onOrientation);
    };
  }, []);

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
          },
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.PLAYING) setPlaying(true);
            if (event.data === window.YT.PlayerState.PAUSED || event.data === window.YT.PlayerState.ENDED) {
              setPlaying(false);
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
            document.exitFullscreen().catch(() => {});
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [handleMiniPlayer, skip, toggleFullscreen]);

  if (!video) return null;

  return (
    <div className={`flex w-full flex-col ${isFullscreen ? 'fixed inset-0 z-[100] bg-black h-screen w-screen' : ''}`}>
      <div
        ref={containerRef}
        className={`${isFullscreen ? 'h-full w-full' : 'relative w-full rounded-2xl sm:rounded-[32px] aspect-video'} overflow-hidden select-none bg-black flex items-center justify-center`}
        onMouseMove={showControlsTemporarily}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={() => setShowControls((prev) => !prev)}
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
            <div className="absolute inset-0 z-10 w-full h-full cursor-pointer" />
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
              className="absolute left-0 top-0 z-20 flex w-full items-center justify-between bg-gradient-to-b from-black/80 to-transparent px-4 pb-8 pt-3"
              onClick={(event) => event.stopPropagation()}
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

            <div
              className="absolute bottom-0 left-0 z-20 w-full bg-gradient-to-t from-black/90 via-black/60 to-transparent px-3 pb-3 pt-8 sm:px-4"
              onClick={(event) => event.stopPropagation()}
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
