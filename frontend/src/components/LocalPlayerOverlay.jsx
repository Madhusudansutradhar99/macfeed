import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Lock, Unlock, Maximize, ChevronsLeft, ChevronsRight, 
  Play, Pause, Sun, PlayCircle, Monitor, MessageSquare, 
  Settings, Volume2, RotateCcw, RotateCw, Camera, Headphones, 
  Sliders, PictureInPicture, VolumeX, SkipBack, SkipForward, 
  Repeat, Check, X, ChevronRight, Minimize2, MoreHorizontal, MoreVertical,
  Layout, RefreshCcw, ZoomIn, Type, Palette, Shield, Zap,
  Keyboard, FileText, Download, List, Settings2
} from 'lucide-react';
import { useMusicPlayer } from '../context/MusicContext';
import { Filesystem } from '@capacitor/filesystem';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import useVideoPlayer from './LocalVideoPlayer/useVideoPlayer';

const formatTime = (s) => {
  if (!s || isNaN(s)) return '00:00:00';
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = Math.floor(s % 60);
  if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];
const ASPECT_RATIOS = ['Fit', 'Fill', 'Stretch', '4:3', '16:9'];
const DECODERS = ['Auto', 'Software', 'Hardware'];
const BUFFER_SIZES = ['Small', 'Medium', 'Large'];
const PRELOADS = ['None', 'Metadata', 'Auto'];
const FONT_SIZES = ['Small', 'Medium', 'Large'];
const COLORS = ['White', 'Yellow', 'Green'];
const BG_MODES = ['None', 'Dark', 'Black'];
const SCREENSHOT_QUALITIES = ['Low', 'Medium', 'High'];
const SCREENSHOT_FORMATS = ['PNG', 'JPG'];

export default function LocalPlayerOverlay() {
  const { 
    isLocalPlayerOpen, setIsLocalPlayerOpen, activeLocalSong: currentSong, 
    playingLocal: playing, setPlayingLocal: setPlaying,
    volumeLocal: volume, setVolumeLocal: setVolume,
    mutedLocal: isMuted, setMutedLocal: setIsMuted,
    next, prev
  } = useMusicPlayer();

  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const controlsTimeout = useRef(null);
  const touchStart = useRef({ x: 0, y: 0, time: 0 });
  const lastTap = useRef(0);
  const swipeUpStart = useRef(0);

    // Initialize native/HLS player hook (probes capabilities and attaches hls.js when needed)
    const { hls, error: playerError } = useVideoPlayer(videoRef, { currentSong, preloadMode });

  // Core UI States
  const [showControls, setShowControls] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [bufferProgress, setBufferProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [brightness, setBrightness] = useState(100);

  // Direct DOM Refs for high-performance updates
  const currentTimeRef = useRef(null);
  const durationRef = useRef(null);
  const progressBarRef = useRef(null);
  const bufferBarRef = useRef(null);
  const thumbRef = useRef(null);
  const [showExtraPanel, setShowExtraPanel] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [settingsTab, setSettingsTab] = useState('PLAYBACK');

  // Settings States
  const [playbackRate, setPlaybackRate] = useState(1);
  const [autoPlayNext, setAutoPlayNext] = useState(true);
  const [resumePos, setResumePos] = useState(true);
  const [loopVideo, setLoopVideo] = useState(false);
  const [aspectRatio, setAspectRatio] = useState('Fit');
  const [hwAccel, setHwAccel] = useState(true);
  const [decoder, setDecoder] = useState('Auto');
  const [bufferSize, setBufferSize] = useState('Medium');
  const [preloadMode, setPreloadMode] = useState('Auto');
  const [volumeBoost, setVolumeBoost] = useState(100);
  const [eqPreset, setEqPreset] = useState('Normal');
  const [fontSize, setFontSize] = useState('Medium');
  const [targetQuality, setTargetQuality] = useState('Auto');
  const [subtitleColor, setSubtitleColor] = useState('White');
  const [subtitleBg, setSubtitleBg] = useState('None');
  const [ssQuality, setSsQuality] = useState('High');
  const [ssFormat, setSsFormat] = useState('PNG');
  const [subtitles, setSubtitles] = useState([]);
  const [activeSubtitle, setActiveSubtitle] = useState(null);
  const [audioTracks, setAudioTracks] = useState([]);
  
  // Gesture & Feedback States
  const [activeGesture, setActiveGesture] = useState(null); 
  const [gestureValue, setGestureValue] = useState(0);
  const [showSkipAnim, setShowSkipAnim] = useState(null); 
  const [toast, setToast] = useState(null);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [savedTime, setSavedTime] = useState(0);
  const [orientation, setOrientation] = useState('portrait');
  const [physOrientation, setPhysOrientation] = useState(window.innerWidth > window.innerHeight ? 'landscape' : 'portrait');
  const [wheelRotation, setWheelRotation] = useState(0);

  useEffect(() => {
    const checkOrientation = () => {
        const orient = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
        setPhysOrientation(orient);
        if (orient === 'portrait') {
            setShowExtraPanel(false);
        }
    };
    // Aggressive polling for orientation changes on mobile
    const interval = setInterval(checkOrientation, 500);
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    return () => {
        clearInterval(interval);
        window.removeEventListener('resize', checkOrientation);
        window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  const showMXToast = useCallback((msg, icon, color = '#FFFFFF') => {
    setToast({ msg, icon, color });
    setTimeout(() => setToast(null), 2000);
  }, []);

  const resetControlsTimeout = useCallback(() => {
    if (isLocked) {
        setShowControls(true);
        return;
    }
    setShowControls(true);
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => {
        if (playing && !showSettings && !showExtraPanel) setShowControls(false);
    }, 3000);
  }, [playing, isLocked, showSettings, showExtraPanel]);

  useEffect(() => {
    resetControlsTimeout();
    return () => { if (controlsTimeout.current) clearTimeout(controlsTimeout.current); };
  }, [playing, isLocked, resetControlsTimeout]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isLocalPlayerOpen || !currentSong) return;

    const saveInterval = setInterval(() => {
        if (video.currentTime > 5 && video.currentTime < video.duration - 10) {
            const key = `mx_resume_${currentSong.name || currentSong.title}`;
            localStorage.setItem(key, video.currentTime.toString());
        }
    }, 5000);

    return () => {
        clearInterval(saveInterval);
        if (video.currentTime > 5 && video.currentTime < video.duration - 10) {
            const key = `mx_resume_${currentSong.name || currentSong.title}`;
            localStorage.setItem(key, video.currentTime.toString());
        }
    };
  }, [isLocalPlayerOpen, currentSong]);

  useEffect(() => {
    if (isLocalPlayerOpen && currentSong && videoRef.current) {
        try {
            const history = JSON.parse(localStorage.getItem('macfeed_local_history') || '[]');
            const entry = {
                id: currentSong.id,
                title: currentSong.title || currentSong.name,
                path: currentSong.path,
                thumbnail_url: currentSong.thumbnail_url,
                lastPlayed: Date.now(),
                source: 'local'
            };
            const filtered = history.filter(h => (h.path && h.path === entry.path) || h.title !== entry.title);
            filtered.unshift(entry);
            localStorage.setItem('macfeed_local_history', JSON.stringify(filtered.slice(0, 50)));
        } catch(e) {}

        const setupPlayer = async () => {
            const video = videoRef.current;
            if (!video) return;
            setIsLoading(true);
            
            try {
                if (currentSong.path) {
                    const fileUri = await Filesystem.getUri({ path: currentSong.path });
                    video.src = fileUri.uri;
                } else if (currentSong.file) {
                    const objectURL = URL.createObjectURL(currentSong.file);
                    video.src = objectURL;
                } else {
                    video.src = currentSong.video_url;
                }

                video.preload = 'auto';
                video.load();
                if ('decoding' in video) video.decoding = 'async';
                
                // Performance optimizations
                video.style.transform = 'translate3d(0,0,0) scale3d(1,1,1)';
                video.style.willChange = 'auto';
                video.style.contain = 'layout style paint';
                video.style.backfaceVisibility = 'hidden';
                video.style.WebkitBackfaceVisibility = 'hidden';
                
                // Don't play immediately - let the 'playing' state handle it
                setPlaying(true); // Trigger play via the effect below
                
            } catch (err) {
                console.error("Player setup error:", err);
                setIsLoading(false);
            }
        };
        setupPlayer();
    }
  }, [isLocalPlayerOpen, currentSong]);

  useEffect(() => {
    let isMounted = true;
    const handleOrientation = async () => {
        if (!isLocalPlayerOpen || !isMounted) return;
        try {
            if (orientation === 'landscape') {
                if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
                    await document.documentElement.requestFullscreen().catch(() => {});
                }
                await ScreenOrientation.lock({ orientation: 'landscape' }).catch(() => {});
            } else {
                await ScreenOrientation.lock({ orientation: 'portrait' }).catch(() => {});
                if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
            }
        } catch (e) { 
            console.warn("Orientation logic failed:", e);
        }
    };
    handleOrientation();
    return () => { 
        isMounted = false;
        try { 
            ScreenOrientation.unlock();
            window.screen?.orientation?.unlock(); 
        } catch(e) {} 
    };
  }, [isLocalPlayerOpen, orientation]);

  const handleVideoMetadata = () => {
    if (!videoRef.current) return;
    const v = videoRef.current;
    setDuration(v.duration);
    setIsLoading(false);
    
    const detectedOrient = v.videoWidth > v.videoHeight ? 'landscape' : 'portrait';
    if (orientation !== detectedOrient) {
        setOrientation(detectedOrient);
    }

    if (resumePos) {
        const key = `mx_resume_${currentSong.name || currentSong.title}`;
        const saved = localStorage.getItem(key);
        if (saved && parseFloat(saved) > 5) {
            setSavedTime(parseFloat(saved));
            setShowResumeDialog(true);
        }
    }
  };

  const handleResume = (confirm) => {
    if (confirm && videoRef.current) videoRef.current.currentTime = savedTime;
    setShowResumeDialog(false);
    setPlaying(true);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isLocalPlayerOpen) return;

    const updateUI = () => {
        if (!video || !isLocalPlayerOpen || isLocked) return;
        const cur = video.currentTime;
        const dur = video.duration || 1;
        const prog = (cur / dur) * 100;
        if (progressBarRef.current) progressBarRef.current.style.width = `${prog}%`;
        if (thumbRef.current) thumbRef.current.style.left = `calc(${prog}% - 10px)`;
        if (video.buffered.length > 0) {
            const bEnd = video.buffered.end(video.buffered.length - 1);
            if (bufferBarRef.current) bufferBarRef.current.style.width = `${(bEnd / dur) * 100}%`;
        }
        if (currentTimeRef.current) currentTimeRef.current.innerText = formatTime(cur);
        if (durationRef.current) durationRef.current.innerText = formatTime(dur);
    };

    let rafId;
    if ('requestVideoFrameCallback' in video) {
        const callback = () => {
            updateUI();
            video.requestVideoFrameCallback(callback);
        };
        video.requestVideoFrameCallback(callback);
    } else {
        const loop = () => {
            updateUI();
            rafId = requestAnimationFrame(loop);
        };
        rafId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(rafId);
    }
  }, [isLocalPlayerOpen, currentSong, isLocked]);

  useEffect(() => {
    if (videoRef.current) {
        videoRef.current.volume = (volume * (volumeBoost / 100));
        videoRef.current.muted = isMuted;
        videoRef.current.playbackRate = playbackRate;
        videoRef.current.loop = loopVideo;
    }
  }, [volume, isMuted, playbackRate, volumeBoost, loopVideo]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    if (playing) {
        // Wait for data to be available before playing
        const playIfReady = () => {
            if (video.readyState >= 2) { // HAVE_CURRENT_DATA or better
                video.play().catch(e => {
                    console.debug("[Play] Deferred play attempt:", e.name);
                });
            }
        };
        
        // Try immediate play first
        const playPromise = video.play().catch(e => {
            if (e.name === 'AbortError') {
                // Wait for canplay event
                video.addEventListener('canplay', playIfReady, { once: true });
            } else {
                console.debug("[Play] Error:", e.message);
                setPlaying(false);
            }
        });
        
        return () => {
            video.removeEventListener('canplay', playIfReady);
        };
    } else {
        video.pause();
    }
  }, [playing]);

  const toggleLock = (e) => {
    e?.stopPropagation();
    const newLock = !isLocked;
    setIsLocked(newLock);
    setShowControls(true);
    showMXToast(newLock ? 'Controls Locked' : 'Controls Unlocked', newLock ? <Lock size={16}/> : <Unlock size={16}/>, '#FCD34D');
  };

  const skip = (amount) => {
    if (videoRef.current) {
        videoRef.current.currentTime += amount;
        setShowSkipAnim(amount > 0 ? 'right' : 'left');
        setTimeout(() => setShowSkipAnim(null), 800);
    }
  };

  const handleCapture = (e) => {
    e?.stopPropagation();
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0);
    const link = document.createElement('a');
    link.download = `MX_Capture_${Date.now()}.${ssFormat.toLowerCase()}`;
    link.href = canvas.toDataURL(`image/${ssFormat === 'PNG' ? 'png' : 'jpeg'}`, ssQuality === 'High' ? 1.0 : ssQuality === 'Medium' ? 0.7 : 0.4);
    link.click();
    showMXToast('Screenshot Saved', <Camera size={16}/>, '#38BDF8');
  };

  const toggleROT = async (e) => {
    e?.stopPropagation();
    const newOrient = orientation === 'portrait' ? 'landscape' : 'portrait';
    
    try {
        if (newOrient === 'landscape') {
            if (document.documentElement.requestFullscreen) {
                await document.documentElement.requestFullscreen().catch(() => {});
            }
            if (window.screen?.orientation?.lock) {
                await window.screen.orientation.lock('landscape').catch(() => {});
            }
            await ScreenOrientation.lock({ orientation: 'landscape' }).catch(() => {});
            showMXToast('ORIENTATION: LANDSCAPE', <RefreshCcw size={16}/>, '#34D399');
        } else {
            if (window.screen?.orientation?.lock) {
                await window.screen.orientation.lock('portrait').catch(() => {});
            }
            await ScreenOrientation.lock({ orientation: 'portrait' }).catch(() => {});
            if (document.fullscreenElement) {
                await document.exitFullscreen().catch(() => {});
            }
            showMXToast('ORIENTATION: PORTRAIT', <RefreshCcw size={16}/>, '#34D399');
        }
    } catch(err) {
        console.warn("Rotation error:", err);
        showMXToast(`FORCING ${newOrient.toUpperCase()}`, <RefreshCcw size={16}/>, '#34D399');
    }
    setOrientation(newOrient);
  };

  const handleTouchStart = (e) => {
    if (showExtraPanel) return;
    const touch = e.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    swipeUpStart.current = touch.clientY;
    setActiveGesture(null);
  };

  const handleTouchMove = (e) => {
    if (isLocked || showExtraPanel) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStart.current.x;
    const deltaY = touch.clientY - touchStart.current.y;
    const width = window.innerWidth;
    const height = window.innerHeight;

    if (!activeGesture) {
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 30) setActiveGesture('seek');
        else if (Math.abs(deltaY) > 30) {
            if (touchStart.current.x < width * 0.3) setActiveGesture('brightness');
            else if (touchStart.current.x > width * 0.7) setActiveGesture('volume');
        }
    }

    if (activeGesture === 'brightness') setBrightness(prev => Math.max(0, Math.min(100, prev - (deltaY / height) * 100)));
    else if (activeGesture === 'volume') setVolume(prev => Math.max(0, Math.min(1, prev - (deltaY / height))));
    else if (activeGesture === 'seek') setGestureValue((deltaX / width) * 30);
  };

  const handleTouchEnd = (e) => {
    if (showExtraPanel) return;
    const touchY = e.changedTouches[0].clientY;
    const deltaY = swipeUpStart.current - touchY;

    if (deltaY > 100 && !showExtraPanel && !isLocked && physOrientation === 'landscape') {
        setShowExtraPanel(true);
        return;
    }
    if (deltaY < -100 && showExtraPanel) {
        setShowExtraPanel(false);
        return;
    }

    if (activeGesture === 'seek' && videoRef.current) videoRef.current.currentTime += gestureValue;
    
    window._lastGestureTime = Date.now();
    setTimeout(() => {
        if (Date.now() - window._lastGestureTime >= 800) setActiveGesture(null);
    }, 800);

    const now = Date.now();
    if (now - lastTap.current < 300) {
        const touchX = e.changedTouches[0].clientX;
        if (touchX < window.innerWidth / 2) skip(-10);
        else skip(10);
    }
    lastTap.current = now;
  };

  useEffect(() => {
    const handleKey = (e) => {
        if (!isLocalPlayerOpen) return;
        switch(e.code) {
            case 'Space': e.preventDefault(); setPlaying(!playing); break;
            case 'ArrowLeft': e.preventDefault(); skip(-10); break;
            case 'ArrowRight': e.preventDefault(); skip(10); break;
            case 'ArrowUp': e.preventDefault(); setVolume(v => Math.min(1, v + 0.1)); break;
            case 'ArrowDown': e.preventDefault(); setVolume(v => Math.max(0, v - 0.1)); break;
            case 'KeyF': e.preventDefault(); containerRef.current?.requestFullscreen(); break;
            case 'KeyL': e.preventDefault(); toggleLock(); break;
            case 'KeyM': e.preventDefault(); setIsMuted(!isMuted); break;
            case 'KeyS': e.preventDefault(); handleCapture(); break;
            case 'KeyR': e.preventDefault(); toggleROT(); break;
            case 'KeyQ': e.preventDefault(); setSettingsTab('QUALITY'); setShowSettings(true); break;
            case 'KeyA': e.preventDefault(); setSettingsTab('AUDIO'); setShowSettings(true); break;
        }
        resetControlsTimeout();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [playing, isLocalPlayerOpen, isMuted, volume, isLocked, orientation, playbackRate]);

  // ONLY RENDER IF PLAYER IS OPEN AND SONG EXISTS
  if (!isLocalPlayerOpen || !currentSong) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-[#000] flex flex-col items-center justify-center overflow-hidden font-sans select-none touch-none"
        onMouseMove={resetControlsTimeout}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => { 
          if(!isLocked) {
            if (showExtraPanel) {
              setShowExtraPanel(false);
            } else {
              setShowControls(!showControls);
            }
          }
        }}
      >
        {/* Real-time Brightness Overlay (Must be ABOVE video z-10) */}
        <div className="fixed inset-0 pointer-events-none z-[15]" style={{ backgroundColor: 'black', opacity: Math.max(0, 1 - (brightness / 100)) }} />

        <video
          ref={videoRef}
          className="w-full h-full relative z-[10]"
          style={{ 
            objectFit: aspectRatio === 'Fit' ? 'contain' : aspectRatio === 'Fill' ? 'cover' : aspectRatio === 'Stretch' ? 'fill' : 'contain', 
            aspectRatio: (aspectRatio === '16:9' || aspectRatio === '4:3') ? aspectRatio.replace(':', '/') : 'auto',
            /* REMOVED EXPENSIVE FILTERS FOR BATTERY SAVING */
            contain: 'strict',
            imageRendering: 'optimizeQuality',
            willChange: 'transform, contents',
            transform: 'translate3d(0,0,0) perspective(1000px)',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            filter: showExtraPanel ? 'blur(8px) brightness(0.5)' : 'none',
            transition: 'filter 0.5s ease'
          }}
          onLoadedMetadata={handleVideoMetadata}
          onCanPlay={() => setIsLoading(false)}
          onWaiting={() => setIsLoading(true)}
          onPlaying={() => { setIsLoading(false); setPlaying(true); }}
          onPlay={() => setIsLoading(false)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          playsInline
          decoding="async"
        >
          {activeSubtitle && <track src={activeSubtitle} kind="subtitles" srcLang="en" label="English" default />}
        </video>

        {/* Premium Transparent Cinematic Loader with Safety Exit */}
        {isLoading && (
            <div className="absolute inset-0 z-[500] flex flex-col items-center justify-center pointer-events-none">
                <div className="relative w-32 h-32 flex items-center justify-center">
                    <motion.div 
                        animate={{ scale: [1, 1.5, 1], rotate: 360 }} 
                        transition={{ repeat: Infinity, duration: 3 }} 
                        className="absolute inset-0 border-2 border-dashed border-blue-500/30 rounded-full" 
                    />
                    <motion.div 
                        animate={{ rotate: 360 }} 
                        transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }} 
                        className="absolute inset-2 border-t-2 border-blue-400 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.3)]" 
                    />
                    <div className="w-12 h-12 bg-blue-500/10 backdrop-blur-sm border border-blue-500/20 rounded-2xl flex items-center justify-center">
                        <motion.div 
                           animate={{ scale: [0.8, 1.1, 0.8] }}
                           transition={{ repeat: Infinity, duration: 1 }}
                        >
                           <Zap size={20} className="text-blue-400 fill-blue-400" />
                        </motion.div>
                    </div>
                </div>
                <div className="mt-6 flex flex-col items-center gap-1">
                   <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.6em] animate-pulse">16K HYPER ENGINE</p>
                   <p className="text-white/20 text-[8px] font-black uppercase tracking-widest">Optimizing Hardware Decoders...</p>
                   <p className="text-white/10 text-[7px] font-bold uppercase tracking-widest mt-2">Buffer: {bufferSize} | Decoder: {decoder}</p>
                </div>
            </div>
        )}

        {/* Toast Notification */}
        <AnimatePresence>
            {toast && (
                <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 60, opacity: 1 }} exit={{ opacity: 0 }} className="absolute top-0 left-1/2 -translate-x-1/2 z-[1000] bg-black/80 px-4 py-2 rounded-full flex items-center gap-2 border border-white/10 shadow-2xl backdrop-blur-md">
                    <span style={{ color: toast.color }}>{toast.icon}</span>
                    <span className="text-white text-[10px] font-black uppercase tracking-widest">{toast.msg}</span>
                </motion.div>
            )}
        </AnimatePresence>



        {/* TOP BAR */}
        <AnimatePresence>
            {showControls && !isLocked && (
                <motion.div 
                    initial={{ y: -100 }} animate={{ y: 0 }} exit={{ y: -100 }}
                    transition={{ type: 'tween', ease: 'circOut', duration: 0.2 }}
                    className="absolute top-0 left-0 right-0 z-50 p-6 flex items-center justify-between bg-gradient-to-b from-black to-transparent"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex items-center gap-6">
                        <button onClick={() => { window.screen?.orientation?.unlock(); setIsLocalPlayerOpen(false); }} className="text-white p-2">
                            <ArrowLeft size={24} />
                        </button>
                        <h2 className="text-white text-sm font-bold truncate max-w-[150px] sm:max-w-[300px]">{currentSong.name || currentSong.title}</h2>
                    </div>

                    <div className="flex items-center gap-4">
                        <button 
                            onClick={toggleROT}
                            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white"
                        >
                            <RefreshCcw size={18} />
                        </button>
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                const idx = ASPECT_RATIOS.indexOf(aspectRatio);
                                const nextRatio = ASPECT_RATIOS[(idx + 1) % ASPECT_RATIOS.length];
                                setAspectRatio(nextRatio);
                                showMXToast(`Ratio: ${nextRatio}`, <Maximize size={16}/>, "#38BDF8");
                            }}
                            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white"
                        >
                            <Monitor size={18} />
                        </button>
                        <button onClick={handleCapture} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white">
                            <Camera size={18} />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* CENTER CONTROLS */}
        <AnimatePresence>
            {showControls && !isLocked && (
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="absolute inset-0 flex items-center justify-center gap-16 z-40 pointer-events-none"
                >
                    <button onClick={e => { e.stopPropagation(); if (videoRef.current) videoRef.current.currentTime -= 10; }} className="pointer-events-auto text-white p-4">
                        <ChevronsLeft size={32} />
                    </button>
                    <button onClick={e => { e.stopPropagation(); setPlaying(!playing); }} className="pointer-events-auto text-white p-4">
                        {playing ? <Pause size={48} fill="white" /> : <Play size={48} fill="white" />}
                    </button>
                    <button onClick={e => { e.stopPropagation(); if (videoRef.current) videoRef.current.currentTime += 10; }} className="pointer-events-auto text-white p-4">
                        <ChevronsRight size={32} />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>

        {/* BOTTOM SECTION */}
        <AnimatePresence>
            {showControls && !isLocked && (
                <motion.div 
                    initial={{ y: 150 }} animate={{ y: 0 }} exit={{ y: 150 }}
                    transition={{ type: 'tween', ease: 'circOut', duration: 0.2 }}
                    className="absolute bottom-0 left-0 right-0 z-50 p-6 flex flex-col gap-6 bg-gradient-to-t from-black to-transparent"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between gap-6">
                        <div 
                            className="flex-1 flex items-center gap-4 py-4 cursor-pointer"
                            onTouchStart={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const pos = (e.touches[0].clientX - rect.left) / rect.width;
                                if (videoRef.current) videoRef.current.currentTime = pos * videoRef.current.duration;
                            }}
                            onTouchMove={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const pos = Math.max(0, Math.min(1, (e.touches[0].clientX - rect.left) / rect.width));
                                if (videoRef.current) videoRef.current.currentTime = pos * videoRef.current.duration;
                            }}
                            onClick={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const pos = (e.clientX - rect.left) / rect.width;
                              if (videoRef.current) videoRef.current.currentTime = pos * videoRef.current.duration;
                            }}
                        >
                            <span ref={currentTimeRef} className="text-white text-[10px] font-black min-w-[45px]">00:00</span>
                            <div className="flex-1 h-1.5 bg-white/10 rounded-full relative">
                                <div ref={bufferBarRef} className="absolute top-0 left-0 h-full bg-white/5 rounded-full" style={{ width: '0%' }} />
                                <div ref={progressBarRef} className="absolute top-0 left-0 h-full bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{ width: '0%' }}>
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-xl scale-110" />
                                </div>
                            </div>
                            <span ref={durationRef} className="text-white text-[10px] font-black min-w-[45px]">00:00</span>
                        </div>

                        {/* Desktop Site Mode: More Button to open Wheel (Landscape Only) */}
                        {physOrientation === 'landscape' && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); setShowExtraPanel(!showExtraPanel); }}
                                className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-90 border border-white/5"
                            >
                                <Settings2 size={24} className={showExtraPanel ? "text-accent animate-spin-slow" : ""} />
                            </button>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* GESTURE VISUALS */}
        <AnimatePresence>
            {activeGesture === 'brightness' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute left-10 top-1/2 -translate-y-1/2 z-[200] flex flex-col items-center gap-4 bg-black/40 p-4 rounded-full backdrop-blur-md border border-white/10">
                    <Sun className="w-5 h-5 text-white" />
                    <div className="h-40 w-1 bg-white/20 rounded-full relative overflow-hidden">
                        <div className="absolute bottom-0 left-0 right-0 bg-white" style={{ height: `${brightness}%` }} />
                    </div>
                </motion.div>
            )}
            {activeGesture === 'volume' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute right-20 top-1/2 -translate-y-1/2 z-[200] flex flex-col items-center gap-4 bg-black/40 p-4 rounded-full backdrop-blur-md border border-white/10">
                    <Volume2 className="w-5 h-5 text-white" />
                    <div className="h-40 w-1 bg-white/20 rounded-full relative overflow-hidden">
                        <div className="absolute bottom-0 left-0 right-0 bg-white" style={{ height: `${volume * 100}%` }} />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* COMPACT FAR-LEFT ENDFIELD TERMINAL (ZERO-GAP & BOLD BORDERS) */}
        <AnimatePresence>
            {showExtraPanel && (
                <motion.div 
                    initial={{ opacity: 0, x: -50 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    exit={{ opacity: 0, x: -50 }}
                    className="absolute inset-0 z-[150] flex items-center justify-start overflow-hidden pointer-events-auto bg-black/20 backdrop-blur-[2px]"
                    onClick={() => setShowExtraPanel(false)}
                >
                    {/* 
                        EXPANDED INTERACTIVE AREA (LEFT SIDE):
                        Now covers a larger width to ensure scrolling anywhere on the left
                        rotates the wheel, not just on the frames.
                    */}
                    <div 
                        onWheel={(e) => {
                            const sensitivity = 0.8;
                            const maxRot = (14 - 1) * 18;
                            setWheelRotation(prev => Math.max(0, Math.min(prev - (e.deltaY * sensitivity), maxRot)));
                        }}
                        className="relative h-full w-[400px] md:w-[500px] flex items-center justify-start pointer-events-auto group/wheel"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Drag Area (Full height & width of the interactive zone) */}
                        <motion.div 
                            drag="y"
                            dragConstraints={{ top: -2000, bottom: 2000 }}
                            onDrag={(e, info) => {
                                const sensitivity = 1.2;
                                const maxRot = (14 - 1) * 18;
                                setWheelRotation(prev => Math.max(0, Math.min(prev - (info.delta.y * sensitivity), maxRot)));
                            }}
                            className="absolute inset-0 z-[200] cursor-grab active:cursor-grabbing"
                        />
                        {/* COMPACT & TIGHT MOBILE WHEEL (Smaller radius and size) */}
                        <div className="absolute left-[-220px] md:left-[-280px] w-[300px] md:w-[400px] h-[300px] md:h-[400px] flex items-center justify-center pointer-events-none scale-[0.8] md:scale-100 origin-left">
                            
                            {/* 1. OUTER GOLD RING (STABLE ARROW) */}
                            <motion.div 
                                animate={showExtraPanel ? { rotate: 360 } : {}}
                                transition={{ repeat: Infinity, duration: 60, ease: 'linear' }}
                                className="absolute w-[320px] md:w-[420px] h-[320px] md:h-[420px] rounded-full border-[3px] border-dashed border-yellow-500/20" 
                            />
                            
                            {/* STABLE SYSTEM ARROW (FIXED AT RIGHT) */}
                            <div className="absolute right-[15px] top-[50%] translate-y-[-50%] rotate-[-90deg] z-50">
                                <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[14px] border-t-yellow-400 shadow-[0_0_20px_#fbbf24]" />
                            </div>

                            {/* 2. INNER CYAN SYSTEM RING (THICK BORDER) */}
                            <motion.div 
                                animate={showExtraPanel ? { rotate: -360 } : {}}
                                transition={{ repeat: Infinity, duration: 30, ease: 'linear' }}
                                className="absolute w-[240px] md:w-[340px] h-[240px] md:h-[340px] rounded-full border-[4px] border-cyan-400/40 shadow-[0_0_25px_rgba(34,211,238,0.2)]"
                            >
                                {[...Array(36)].map((_, i) => (
                                    <div key={i} className="absolute w-1 h-3 bg-cyan-400/40" style={{ left: '50%', top: -2, transform: `rotate(${i * 10}deg)` }} />
                                ))}
                            </motion.div>

                            {/* 3. CORE HUB (CLEAN & MINIMAL) */}
                            <div className="absolute w-[180px] md:w-[280px] h-[180px] md:h-[280px] rounded-full flex flex-col items-center justify-center border-[2px] border-white/5 bg-radial-gradient from-cyan-400/[0.08] to-transparent">
                                <motion.div 
                                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                    className="text-[8px] font-mono text-cyan-400/40 font-black tracking-[0.6em]"
                                >
                                    CORE_STABLE
                                </motion.div>
                            </div>
                        </div>


                        {/* Panels with ZERO-GAP Connections (Aligned to Ring Center) */}
                        <div className="absolute left-[-280px] w-[400px] h-full flex items-center justify-center pointer-events-none">
                            {[
                                { icon: <RefreshCcw size={14} />, label: "Rotation", color: "#fbbf24", onClick: toggleROT },
                                { icon: <Camera size={14} />, label: "Capture", color: "#fbbf24", onClick: handleCapture },
                                { icon: <Headphones size={14} />, label: "Audio", color: "#22d3ee", onClick: () => { setSettingsTab('AUDIO'); setShowSettings(true); } },
                                { icon: <Sliders size={14} />, label: "Equalizer", color: "#22d3ee", onClick: () => { setSettingsTab('AUDIO'); setShowSettings(true); } },
                                { icon: <ZoomIn size={14} />, label: "Zoom/Fit", color: "#fbbf24", onClick: () => {
                                    const idx = ASPECT_RATIOS.indexOf(aspectRatio);
                                    setAspectRatio(ASPECT_RATIOS[(idx + 1) % ASPECT_RATIOS.length]);
                                } },
                                { icon: <Settings size={14} />, label: "Settings", color: "#94a3b8", onClick: () => setShowSettings(true) },
                                { icon: <Monitor size={14} />, label: "Quality", color: "#fbbf24", onClick: () => setShowQualityMenu(true) },
                                { icon: <MessageSquare size={14} />, label: "Subtitles", color: "#22d3ee", onClick: () => { setSettingsTab('SUBTITLES'); setShowSettings(true); } },
                                { icon: <Zap size={14} />, label: "Hardware", color: "#fbbf24", onClick: () => setHwAccel(!hwAccel) },
                                { icon: <PictureInPicture size={14} />, label: "PIP", color: "#22d3ee", onClick: () => videoRef.current?.requestPictureInPicture() },
                                { icon: isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />, label: "Mute", color: "#22d3ee", onClick: () => setIsMuted(!isMuted) },
                                { icon: <SkipForward size={14} />, label: "Next", color: "#fbbf24", onClick: () => { next(); showMXToast('Next Video', <SkipForward size={16}/>); } },
                                { icon: <SkipBack size={14} />, label: "Prev", color: "#fbbf24", onClick: () => { prev(); showMXToast('Prev Video', <SkipBack size={16}/>); } },
                                { icon: <Repeat size={14} />, label: "Loop", color: "#22d3ee", onClick: () => setLoopVideo(!loopVideo) }
                            ].map((action, i) => {
                                const angleStep = 18; 
                                const totalRotation = (i * angleStep) - wheelRotation;
                                const rad = (totalRotation * Math.PI) / 180;
                                
                                // Cyan ring is at 170. Panel is at 350. Wire is 180px long.
                                // Tighter radius on mobile for better thumb reach
                                const panelRadius = window.innerWidth < 768 ? 200 : 350; 
                                
                                const xPos = Math.cos(rad) * panelRadius + 200; // Center offset
                                const yPos = Math.sin(rad) * panelRadius;
                                
                                const normalizedDist = Math.abs(yPos) / (panelRadius * 1.5);
                                const scale = Math.max(0.7, 1.15 - normalizedDist); 
                                const opacity = Math.max(0.3, 1 - normalizedDist);
                                const isFocused = scale > 1.05;

                                return (
                                    <motion.div
                                        key={i}
                                        className="absolute pointer-events-auto flex items-center cursor-pointer group"
                                        style={{ 
                                            x: xPos,
                                            y: yPos,
                                            scale: scale,
                                            opacity: opacity,
                                            zIndex: 300 + Math.round(opacity * 100)
                                        }}
                                        transition={{ type: 'spring', stiffness: 500, damping: 50, mass: 0.5 }}
                                        onTap={(e) => { e.stopPropagation(); action.onClick(); }}
                                    >
                                        {/* LONG ZERO-GAP CONNECTION */}
                                        <div className={`absolute left-[-190px] w-[200px] h-10 pointer-events-none transition-opacity duration-300 ${isFocused ? 'opacity-100' : 'opacity-20'}`}>
                                            <svg width="200" height="40" viewBox="0 0 200 40" fill="none">
                                                {/* Start exactly at Cyan Ring edge (x=0) and reach panel (x=200) */}
                                                <path d="M10 20 H120 L150 5 H200" stroke={action.color} strokeWidth="1.5" strokeOpacity="0.7" />
                                                <path d="M10 20 H120 L150 35 H200" stroke={action.color} strokeWidth="1.5" strokeOpacity="0.7" />
                                                <circle cx="10" cy="20" r="3.5" fill={action.color} />
                                                {isFocused && (
                                                    <motion.circle 
                                                        initial={{ cx: 10 }}
                                                        animate={{ cx: 200 }}
                                                        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                                        r="2.5" fill="white" 
                                                    />
                                                )}
                                            </svg>
                                        </div>

                                        {/* Endfield Style Panel */}
                                        <div 
                                            className={`relative w-32 h-12 bg-black/98 backdrop-blur-3xl border-l-[6px] border-r-[2px] border-y-[2px] transition-all duration-300 flex items-center justify-between px-3 ${isFocused ? `border-l-[${action.color}] border-white/40 shadow-[0_0_25px_${action.color}33] scale-105` : 'border-white/10 opacity-60'}`}
                                            style={{ 
                                                clipPath: 'polygon(15% 0%, 100% 0%, 85% 100%, 0% 100%)',
                                                borderLeftColor: isFocused ? action.color : 'rgba(255,255,255,0.1)'
                                            }}
                                        >
                                            <div className={`transition-all duration-300 ${isFocused ? 'scale-125' : 'text-white/40'}`} style={{ color: isFocused ? action.color : 'rgba(255,255,255,0.4)' }}>
                                                {action.icon}
                                            </div>
                                            <div className="flex flex-col items-end mr-1">
                                                <span className={`text-[8.5px] font-black uppercase tracking-tighter transition-all duration-300 ${isFocused ? 'text-white' : 'text-white/40'}`}>
                                                    {action.label}
                                                </span>
                                                {isFocused && <motion.div layoutId="endfield-line-bold" className="h-[1.5px] w-8 mt-1" style={{ backgroundColor: action.color }} />}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* SETTINGS MODAL */}
        <AnimatePresence>
            {showSettings && (
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 z-[1000] bg-[#000]/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-10"
                    onClick={() => setShowSettings(false)}
                >
                    <motion.div 
                        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                        className="bg-[#111] w-full max-w-4xl h-[80vh] rounded-[2rem] border border-white/5 overflow-hidden flex flex-col sm:flex-row shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Sidebar Tabs */}
                        <div className="w-full sm:w-64 bg-white/[0.02] border-r border-white/5 p-6 flex flex-row sm:flex-col gap-2 overflow-x-auto no-scrollbar">
                            <SettingsTab id="PLAYBACK" label="Playback" icon={<PlayCircle size={18}/>} active={settingsTab} set={setSettingsTab} />
                            <SettingsTab id="QUALITY" label="Video Quality" icon={<Monitor size={18}/>} active={settingsTab} set={setSettingsTab} />
                            <SettingsTab id="PERFORMANCE" label="Performance" icon={<Zap size={18}/>} active={settingsTab} set={setSettingsTab} />
                            <SettingsTab id="AUDIO" label="Audio" icon={<Volume2 size={18}/>} active={settingsTab} set={setSettingsTab} />
                            <SettingsTab id="SUBTITLES" label="Subtitles" icon={<MessageSquare size={18}/>} active={settingsTab} set={setSettingsTab} />
                            <SettingsTab id="ADVANCED" label="Advanced" icon={<Settings2 size={18}/>} active={settingsTab} set={setSettingsTab} />
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar space-y-8">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-white text-xl font-bold tracking-tight">{settingsTab}</h3>
                                <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/50 hover:text-white">
                                    <X size={20} />
                                </button>
                            </div>

                            {settingsTab === 'PLAYBACK' && (
                                <>
                                    <SettingRow label="Playback Speed">
                                        <div className="flex flex-wrap gap-2">
                                            {SPEEDS.map(s => (
                                                <button key={s} onClick={() => setPlaybackRate(s)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${playbackRate === s ? 'bg-white text-black' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>{s}x</button>
                                            ))}
                                        </div>
                                    </SettingRow>
                                    <SettingToggle label="Auto play next" active={autoPlayNext} onToggle={() => setAutoPlayNext(!autoPlayNext)} />
                                    <SettingToggle label="Resume from last position" active={resumePos} onToggle={() => setResumePos(!resumePos)} />
                                    <SettingToggle label="Loop video" active={loopVideo} onToggle={() => setLoopVideo(!loopVideo)} />
                                </>
                            )}

                            {settingsTab === 'QUALITY' && (
                                <>
                                    <SettingRow label="Target Resolution (GPU Precision)">
                                        <div className="flex flex-wrap gap-2">
                                            {['Auto', '1080p', '2K', '4K', '8K', '16K'].map(q => (
                                                <button 
                                                    key={q} 
                                                    onClick={() => {
                                                        setTargetQuality(q);
                                                        showMXToast(`${q} Rendering Activated`, <Monitor size={14}/>, "#FCD34D");
                                                        if (videoRef.current) {
                                                            videoRef.current.style.imageRendering = (q === '16K' || q === '8K') ? 'high-quality' : 'optimizeSpeed';
                                                        }
                                                    }}
                                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${targetQuality === q ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                                                >
                                                    {q}
                                                </button>
                                            ))}
                                        </div>
                                    </SettingRow>
                                    <SettingRow label="Aspect Ratio">
                                        <div className="flex flex-wrap gap-2">
                                            {ASPECT_RATIOS.map(r => (
                                                <button key={r} onClick={() => setAspectRatio(r)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${aspectRatio === r ? 'bg-white text-black' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>{r}</button>
                                            ))}
                                        </div>
                                    </SettingRow>
                                </>
                            )}

                             {settingsTab === 'PERFORMANCE' && (
                                <>
                                    <SettingToggle label="16K HYPER ENGINE (GPU Mode)" active={hwAccel} onToggle={() => {
                                        setHwAccel(!hwAccel);
                                        if (videoRef.current) {
                                            videoRef.current.style.willChange = "transform";
                                        }
                                    }} />
                                    <SettingRow label="Decoder">
                                        <div className="flex gap-2">
                                            {DECODERS.map(d => (
                                                <button key={d} onClick={() => setDecoder(d)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${decoder === d ? 'bg-white text-black' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>{d}</button>
                                            ))}
                                        </div>
                                    </SettingRow>
                                    <SettingRow label="Buffer size">
                                        <div className="flex gap-2">
                                            {BUFFER_SIZES.map(b => (
                                                <button key={b} onClick={() => setBufferSize(b)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${bufferSize === b ? 'bg-white text-black' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>{b}</button>
                                            ))}
                                        </div>
                                    </SettingRow>
                                    <SettingRow label="Preload mode">
                                        <div className="flex gap-2">
                                            {PRELOADS.map(p => (
                                                <button key={p} onClick={() => setPreloadMode(p)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${preloadMode === p ? 'bg-white text-black' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>{p}</button>
                                            ))}
                                        </div>
                                    </SettingRow>
                                </>
                            )}

                            {settingsTab === 'AUDIO' && (
                                <>
                                    <SettingRow label="Audio Track">
                                        <button className="flex items-center gap-2 px-4 py-3 bg-white/5 rounded-xl text-white/60 text-xs font-bold hover:bg-white/10 transition-colors">
                                            <Headphones size={14} /> Default Track (English)
                                        </button>
                                    </SettingRow>
                                    <SettingRow label="Volume Boost">
                                        <div className="flex gap-2">
                                            {[100, 125, 150, 200].map(v => (
                                                <button key={v} onClick={() => setVolumeBoost(v)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${volumeBoost === v ? 'bg-white text-black' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>{v}%</button>
                                            ))}
                                        </div>
                                    </SettingRow>
                                    <SettingRow label="Equalizer Preset">
                                        <div className="flex flex-wrap gap-2">
                                            {['Normal', 'Bass Boost', 'Voice', 'Movie'].map(e => (
                                                <button key={e} onClick={() => setEqPreset(e)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${eqPreset === e ? 'bg-white text-black' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>{e}</button>
                                            ))}
                                        </div>
                                    </SettingRow>
                                </>
                            )}

                            {settingsTab === 'SUBTITLES' && (
                                <>
                                    <button 
                                        onClick={() => {
                                            const input = document.createElement('input');
                                            input.type = 'file';
                                            input.accept = '.srt,.vtt';
                                            input.onchange = (e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    const url = URL.createObjectURL(file);
                                                    setActiveSubtitle(url);
                                                    showMXToast('Subtitles Loaded', <FileText size={16}/>, "#4ADE80");
                                                }
                                            };
                                            input.click();
                                        }}
                                        className="w-full flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors border border-white/5"
                                    >
                                        <div className="flex items-center gap-3">
                                            <FileText size={18} className="text-white/60" />
                                            <span className="text-white text-sm font-bold">Load subtitle file</span>
                                        </div>
                                        <span className="text-white/30 text-[10px] uppercase font-black">.srt / .vtt</span>
                                    </button>
                                    <SettingRow label="Font Size">
                                        <div className="flex gap-2">
                                            {FONT_SIZES.map(f => (
                                                <button key={f} onClick={() => setFontSize(f)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${fontSize === f ? 'bg-white text-black' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>{f}</button>
                                            ))}
                                        </div>
                                    </SettingRow>
                                    <SettingRow label="Color">
                                        <div className="flex gap-2">
                                            {COLORS.map(c => (
                                                <button key={c} onClick={() => setSubtitleColor(c)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${subtitleColor === c ? 'bg-white text-black' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>{c}</button>
                                            ))}
                                        </div>
                                    </SettingRow>
                                    <SettingRow label="Background">
                                        <div className="flex gap-2">
                                            {BG_MODES.map(b => (
                                                <button key={b} onClick={() => setSubtitleBg(b)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${subtitleBg === b ? 'bg-white text-black' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>{b}</button>
                                            ))}
                                        </div>
                                    </SettingRow>
                                </>
                            )}

                            {settingsTab === 'ADVANCED' && (
                                <>
                                    <SettingRow label="Screenshot Quality">
                                        <div className="flex gap-2">
                                            {SCREENSHOT_QUALITIES.map(q => (
                                                <button key={q} onClick={() => setSsQuality(q)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${ssQuality === q ? 'bg-white text-black' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>{q}</button>
                                            ))}
                                        </div>
                                    </SettingRow>
                                    <SettingRow label="Screenshot Format">
                                        <div className="flex gap-2">
                                            {SCREENSHOT_FORMATS.map(f => (
                                                <button key={f} onClick={() => setSsFormat(f)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${ssFormat === f ? 'bg-white text-black' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>{f}</button>
                                            ))}
                                        </div>
                                    </SettingRow>
                                    <div className="p-6 bg-white/[0.03] rounded-3xl border border-white/5">
                                        <h4 className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-4">Desktop Shortcuts</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <Shortcut key="Space" label="Play / Pause" />
                                            <Shortcut key="← →" label="Seek ±10s" />
                                            <Shortcut key="↑ ↓" label="Volume" />
                                            <Shortcut key="F" label="Fullscreen" />
                                            <Shortcut key="L" label="Lock" />
                                            <Shortcut key="S" label="Screenshot" />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* PREMIUM CENTER RESUME MODAL */}
        <AnimatePresence>
            {showResumeDialog && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        onClick={() => handleResume(false)}
                    />
                    <motion.div 
                        initial={{ scale: 0.8, opacity: 0, y: 20 }} 
                        animate={{ scale: 1, opacity: 1, y: 0 }} 
                        exit={{ scale: 0.8, opacity: 0, y: 20 }} 
                        className="relative w-full max-w-[320px] bg-[#111]/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 shadow-[0_30px_100px_rgba(0,0,0,0.8)]"
                    >
                        <div className="flex flex-col items-center text-center gap-6">
                            <div className="w-20 h-20 bg-accent/20 rounded-[2rem] flex items-center justify-center text-accent shadow-[0_0_30px_rgba(var(--accent-rgb),0.2)]">
                                <RefreshCcw size={32} className="animate-spin-slow" />
                            </div>
                            
                            <div className="flex flex-col gap-2">
                                <h3 className="text-white text-xs font-black uppercase tracking-[0.3em] opacity-40">Continue Watching?</h3>
                                <p className="text-white text-2xl font-bold italic tracking-tight">Resume at {formatTime(savedTime)}</p>
                            </div>

                            <div className="flex flex-col w-full gap-3 mt-4">
                                <motion.button 
                                    onTap={() => handleResume(true)} 
                                    className="w-full py-5 bg-accent text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-[0_10px_30px_rgba(var(--accent-rgb),0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                                >
                                    Resume Playback
                                </motion.button>
                                <motion.button 
                                    onTap={() => handleResume(false)} 
                                    className="w-full py-4 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                                >
                                    Start from Beginning
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>

        {/* QUALITY BOTTOM SHEET */}
        <AnimatePresence>
            {showQualityMenu && (
                <motion.div 
                    initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                    className="absolute bottom-0 left-0 right-0 z-[1100] bg-black/95 backdrop-blur-xl border-t border-white/10 p-8 rounded-t-[2.5rem] shadow-2xl"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-white text-lg font-bold">Video Quality</h3>
                        <button onClick={() => setShowQualityMenu(false)} className="p-2 text-white/40 hover:text-white"><X size={20}/></button>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                        {['Auto', '1080p', '2K', '4K', '8K', '16K'].map(q => (
                            <button 
                                key={q} 
                                onClick={() => {
                                    showMXToast(`${q} Hyper Engine Activated`, <Zap size={14}/>, "#FCD34D");
                                    setShowQualityMenu(false);
                                }}
                                className="px-4 py-3 rounded-2xl bg-white/5 text-white/60 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all"
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                    <div className="mt-10 pt-6 border-t border-white/5 flex items-center justify-between">
                        <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">Hardware Acceleration</span>
                        <SettingToggle active={hwAccel} onToggle={() => setHwAccel(!hwAccel)} />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        <style>{`
            .no-scrollbar::-webkit-scrollbar { display: none; }
            .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            .custom-scrollbar::-webkit-scrollbar { width: 4px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        `}</style>
      </motion.div>
    </AnimatePresence>
  );
}

function BottomAction({ icon, label, subLabel, onClick }) {
    return (
        <button onClick={onClick} className="flex flex-col items-center gap-1 group">
            <div className="text-white/90 group-hover:text-white transition-colors">{icon}</div>
            <div className="flex items-center gap-1.5">
                <span className="text-white text-[11px] font-medium opacity-90">{label}</span>
                {subLabel && <span className="text-white/40 text-[10px] font-bold">{subLabel}</span>}
            </div>
        </button>
    );
}

function ExtraAction({ icon, color, label, onClick }) {
    return (
        <button 
            onClick={onClick}
            className="flex flex-col items-center gap-2 group transition-all"
        >
            <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110"
                style={{ color: color }}
            >
                {icon}
            </div>
            <span className="text-white/50 text-[10px] font-black uppercase tracking-widest group-hover:text-white transition-colors">{label}</span>
        </button>
    );
}

function SettingsTab({ id, label, icon, active, set }) {
    const isActive = active === id;
    return (
        <button 
            onClick={() => set(id)}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all whitespace-nowrap ${isActive ? 'bg-white text-black' : 'text-white/40 hover:bg-white/5'}`}
        >
            {icon}
            <span className="text-xs font-bold">{label}</span>
        </button>
    );
}

function SettingRow({ label, children }) {
    return (
        <div className="space-y-4">
            <h4 className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">{label}</h4>
            {children}
        </div>
    );
}

function SettingToggle({ label, active, onToggle }) {
    return (
        <div className="flex items-center justify-between py-2">
            <span className="text-white/80 text-sm font-medium">{label}</span>
            <button 
                onClick={onToggle}
                className={`w-12 h-6 rounded-full relative transition-colors ${active ? 'bg-white' : 'bg-white/10'}`}
            >
                <motion.div 
                    animate={{ x: active ? 26 : 2 }}
                    className={`absolute top-1 w-4 h-4 rounded-full ${active ? 'bg-black' : 'bg-white/40'}`}
                />
            </button>
        </div>
    );
}

function Shortcut({ key, label }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-white/40 text-[11px] font-medium">{label}</span>
            <kbd className="px-2 py-1 bg-white/5 rounded-lg text-white/60 text-[10px] font-bold border border-white/5 min-w-[30px] text-center">{key}</kbd>
        </div>
    );
}
