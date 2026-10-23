import React, { useRef, useEffect, useState, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import {
    ArrowLeft, Lock, Unlock, Maximize, ChevronsLeft, ChevronsRight,
    Play, Pause, Sun, PlayCircle, Monitor, MessageSquare,
    Settings, Volume2, RotateCcw, RotateCw, Camera, Headphones,
    Sliders, PictureInPicture, VolumeX, SkipBack, SkipForward,
    Repeat, Check, X, ChevronRight, Minimize2, MoreHorizontal, MoreVertical,
    Layout, RefreshCcw, ZoomIn, Type, Palette, Shield, Zap,
    Keyboard, FileText, Download, List, Settings2, Mic, Globe,
    Film, FolderOpen, Clock, Maximize2
} from 'lucide-react';
import { useMusicPlayer } from '../context/MusicContext';
import { Filesystem } from '@capacitor/filesystem';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import useVideoPlayer from './LocalVideoPlayer/useVideoPlayer';

const VideoRenderer = memo(({ videoRef, aspectRatio, handleVideoMetadata, setIsLoading, setPlaying, activeSubtitle, showControls }) => {
    return (
        <>
        <video
            ref={videoRef}
            className="w-full max-w-full relative z-[10]"
            style={{
                width: '100%',
                height: '100%',
                maxHeight: '100%',
                objectFit: aspectRatio === 'Fit' ? 'contain' : aspectRatio === 'Fill' ? 'cover' : aspectRatio === 'Stretch' ? 'fill' : 'contain',
                aspectRatio: (aspectRatio === '16:9' || aspectRatio === '4:3') ? aspectRatio.replace(':', '/') : 'auto',
                contain: 'strict',
                transform: 'translateZ(0)',
                imageRendering: 'auto',
                backgroundColor: 'black',
                filter: 'none',
                transition: 'none',
                pointerEvents: showControls ? 'auto' : 'none'
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
            preload="auto"
            fetchpriority="high"
        >
            {activeSubtitle && <track src={activeSubtitle} kind="subtitles" srcLang="en" label="English" default />}
        </video>
        <img src="/watermark.png" className="absolute top-4 right-4 w-12 h-12 z-[90] opacity-100 pointer-events-none drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]" alt="watermark" />
        </>
    );
});

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


function LocalPlayerOverlay() {
    const {
        isLocalPlayerOpen, setIsLocalPlayerOpen, activeLocalSong: currentSong, setActiveLocalSong,
        playingLocal: playing, setPlayingLocal: setPlaying,
        volumeLocal: volume, setVolumeLocal: setVolume,
        mutedLocal: isMuted, setMutedLocal: setIsMuted,
        next, prev, playLocalFile, playLocalSong
    } = useMusicPlayer();

    const videoRef = useRef(null);
    const containerRef = useRef(null);
    const controlsTimeout = useRef(null);
    const touchStart = useRef({ x: 0, y: 0, time: 0 });
    const lastTap = useRef(0);
    const swipeUpStart = useRef(0);

    // Core UI States
    const [showControls, setShowControls] = useState(true);
    const [isLocked, setIsLocked] = useState(false);
    const [duration, setDuration] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [brightness, setBrightness] = useState(100);

    // Direct DOM Refs for high-performance updates
    const currentTimeRef = useRef(null);
    const durationRef = useRef(null);
    const progressBarRef = useRef(null);
    const bufferBarRef = useRef(null);
    const thumbRef = useRef(null);
    const seekBarRef = useRef(null);
    const seekRafRef = useRef(null);
    const seekPendingRef = useRef(null);
    const isSeekingRef = useRef(false);
    const seekClientXRef = useRef(null);
    const wheelRafRef = useRef(null);
    const wheelPendingRef = useRef(0);
    const wheelContainerRef = useRef(null);
    const wheelRotationMV = useMotionValue(0);
    const wheelDragRef = useRef(null);
    const wheelTouchStartYRef = useRef(0);
    const panelRefs = useRef([]);
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
    const [forceLandscape, setForceLandscape] = useState(false);
    const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
    const [quickMenuData, setQuickMenuData] = useState(null);

    // --- Auto Dub States ---
    const [isDubbing, setIsDubbing] = useState(false);
    const [dubLanguage, setDubLanguage] = useState('Hindi');
    const [dubStatus, setDubStatus] = useState(null);
    const [showDubMenu, setShowDubMenu] = useState(false);
    const dubAudioRef = useRef(null);
    const DUB_LANGUAGES = ['Hindi', 'Spanish', 'French', 'Japanese', 'German', 'Telugu', 'Tamil'];
    
    const handleStartDubbing = useCallback(async (lang) => {
        setDubLanguage(lang);
        setIsDubbing(true);
        setDubStatus('Uploading and Processing Video for AI Dubbing...');
        
        try {
            if (videoRef.current) {
                videoRef.current.pause();
                setPlaying(false);
            }

            // Fetch the current video blob
            let blob = null;
            if (currentSong && currentSong.file) {
                // If we have the actual File object stored in history or state
                blob = currentSong.file;
            } else if (videoRef.current && videoRef.current.src) {
                const response = await fetch(videoRef.current.src);
                blob = await response.blob();
            }

            if (!blob) {
                setDubStatus('Could not find video file for dubbing.');
                setIsDubbing(false);
                return;
            }

            const formData = new FormData();
            formData.append('file', blob, 'video.mp4');
            formData.append('target_language', lang);

            setDubStatus('Processing Full Video AI Dubbing... This will take a while.');

            const res = await fetch('http://localhost:8001/api/dub', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) {
                throw new Error("Dubbing API failed");
            }

            const dubbedBlob = await res.blob();
            const dubbedUrl = URL.createObjectURL(dubbedBlob);

            if (videoRef.current) {
                // Replace video source with the fully dubbed version!
                videoRef.current.src = dubbedUrl;
                videoRef.current.load();
                videoRef.current.play();
                setPlaying(true);
            }

            setDubStatus('Dubbing Applied successfully!');
            setTimeout(() => setDubStatus(null), 4000);
            
            // Note: In batch mode, we don't duck audio in the player anymore, 
            // because the backend already mixed the dubbed audio into the new video!
            if (videoRef.current) {
                videoRef.current.volume = 1.0; 
            }

        } catch (error) {
            console.error("Dubbing Error:", error);
            setDubStatus('Dubbing failed or server is offline.');
            setIsDubbing(false);
            setTimeout(() => setDubStatus(null), 4000);
        }
    }, [currentSong, setPlaying]);

    const handleStopDubbing = useCallback(() => {
        setIsDubbing(false);
        setDubStatus(null);
        setShowDubMenu(false);
        if (videoRef.current) {
            // Restore original volume
            videoRef.current.volume = window._originalVolume !== undefined ? window._originalVolume : 1.0;
        }
        if (window._dubWs) {
            window._dubWs.close();
            window._dubWs = null;
        }

        if (window._dubMediaRecorder) {
            try { window._dubMediaRecorder.stop(); } catch(e){}
            window._dubMediaRecorder = null;
        }
    }, [setIsMuted]);


    useEffect(() => {
        const handleResize = () => setIsMobileView(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);


    // Web Audio API Refs for Boost & EQ
    const audioCtxRef = useRef(null);
    const sourceNodeRef = useRef(null);
    const gainNodeRef = useRef(null);
    const eqNodesRef = useRef({});

    // Initialize native/HLS player hook
    const { hls, error: playerError, maxHeight: playerMaxHeight, smooth: playerSmooth } = useVideoPlayer(videoRef, { 
        currentSong, 
        preloadMode,
        bufferSize 
    });

    useEffect(() => {
        const checkOrientation = () => {
            const orient = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
            setPhysOrientation(orient);
        };
        checkOrientation();
        const interval = setInterval(checkOrientation, 1000);
        window.addEventListener('resize', checkOrientation);
        window.addEventListener('orientationchange', checkOrientation);

        const handleOpenJog = () => {
            setIsLocalPlayerOpen(true);
            setShowExtraPanel(true);
        };
        window.addEventListener('open-jog-wheel', handleOpenJog);

        return () => {
            clearInterval(interval);
            window.removeEventListener('resize', checkOrientation);
            window.removeEventListener('orientationchange', checkOrientation);
            window.removeEventListener('open-jog-wheel', handleOpenJog);
        };
    }, []);

    const showMXToast = useCallback((msg, icon, color = '#FFFFFF') => {
        setToast({ msg, icon, color });
        setTimeout(() => setToast(null), 2000);
    }, []);

    const resolveSeekPoint = useCallback((clientX) => {
        const seekBar = seekBarRef.current;
        const video = videoRef.current;
        if (!seekBar || !video || !video.duration) return null;

        const rect = seekBar.getBoundingClientRect();
        const position = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        return {
            position,
            time: position * video.duration,
            duration: video.duration,
        };
    }, []);

    const paintSeekPreview = useCallback((clientX) => {
        const nextSeek = resolveSeekPoint(clientX);
        if (!nextSeek) return;
        
        // Store current X position for RAF callback
        seekClientXRef.current = clientX;
        seekPendingRef.current = nextSeek;

        if (seekRafRef.current) return;

        // Single RAF callback to update DOM once per frame
        seekRafRef.current = requestAnimationFrame(() => {
            seekRafRef.current = null;
            const pending = seekPendingRef.current;
            if (!pending) return;

            const percent = pending.position * 100;
            if (progressBarRef.current) progressBarRef.current.style.width = `${percent}%`;
            if (thumbRef.current) thumbRef.current.style.left = `calc(${percent}% - 10px)`;
            if (currentTimeRef.current) currentTimeRef.current.innerText = formatTime(pending.time);
            if (durationRef.current) durationRef.current.innerText = formatTime(pending.duration);
        });
    }, [resolveSeekPoint]);

    const commitSeek = useCallback((clientX) => {
        const pending = resolveSeekPoint(clientX) || seekPendingRef.current;
        const video = videoRef.current;
        if (!pending || !video) return;

        const percent = pending.position * 100;
        video.currentTime = pending.time;
        if (progressBarRef.current) progressBarRef.current.style.width = `${percent}%`;
        if (thumbRef.current) thumbRef.current.style.left = `calc(${percent}% - 10px)`;
        if (currentTimeRef.current) currentTimeRef.current.innerText = formatTime(pending.time);
        if (durationRef.current) durationRef.current.innerText = formatTime(pending.duration);
        seekPendingRef.current = null;
    }, [resolveSeekPoint]);

    const startSeekDrag = useCallback((clientX) => {
        const nextSeek = resolveSeekPoint(clientX);
        if (!nextSeek) return;
        isSeekingRef.current = true;
        seekPendingRef.current = nextSeek;
        if (progressBarRef.current) progressBarRef.current.style.transition = 'none';
        paintSeekPreview(clientX);
    }, [paintSeekPreview, resolveSeekPoint]);

    const endSeekDrag = useCallback((clientX) => {
        if (!isSeekingRef.current) return;
        isSeekingRef.current = false;
        if (seekRafRef.current) {
            cancelAnimationFrame(seekRafRef.current);
            seekRafRef.current = null;
        }
        if (progressBarRef.current) progressBarRef.current.style.transition = 'width 0.12s linear';
        commitSeek(clientX);
    }, [commitSeek]);

    useEffect(() => {
        return () => {
            if (seekRafRef.current) cancelAnimationFrame(seekRafRef.current);
        };
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

    // ── SYNC PLAYING STATE TO NATIVE VIDEO ELEMENT ──
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        if (playing) {
            video.play().catch(() => {});
        } else {
            video.pause();
        }
    }, [playing]);

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
            } catch (e) { }

            const setupPlayer = async () => {
                const video = videoRef.current;
                if (!video) return;
                setIsLoading(true);

                try {
                    // ── SOURCE HANDLED BY useVideoPlayer HOOK ──
                    const key = `mx_resume_${currentSong.name || currentSong.title}`;
                    const resumeTime = localStorage.getItem(key);
                    if (resumeTime) {
                        video.currentTime = parseFloat(resumeTime);
                    }
                    if (playing) video.play().catch(() => { });
                } catch (e) {
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
                        await document.documentElement.requestFullscreen().catch(() => { });
                    }
                    await ScreenOrientation.lock({ orientation: 'landscape' }).catch(() => { });
                } else {
                    await ScreenOrientation.lock({ orientation: 'portrait' }).catch(() => { });
                    if (document.fullscreenElement) await document.exitFullscreen().catch(() => { });
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
            } catch (e) { }
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

    const handleTogglePlay = useCallback((e) => {
        if (e) e.stopPropagation();
        const video = videoRef.current;
        if (!video) return;
        if (video.paused) {
            video.play().then(() => setPlaying(true)).catch(() => {});
        } else {
            video.pause();
            setPlaying(false);
        }
    }, [setPlaying]);

    const handleSkipRelative = useCallback((seconds, e) => {
        if (e) e.stopPropagation();
        const video = videoRef.current;
        if (!video) return;
        const target = Math.max(0, Math.min(video.duration || 0, (video.currentTime || 0) + seconds));
        video.currentTime = target;
        if (currentTimeRef.current) currentTimeRef.current.innerText = formatTime(target);
        if (progressBarRef.current && video.duration) {
            progressBarRef.current.style.width = `${(target / video.duration) * 100}%`;
        }
    }, []);

    const handleClosePlayer = useCallback((e) => {
        if (e) e.stopPropagation();
        try {
            if (videoRef.current) {
                videoRef.current.pause();
                videoRef.current.currentTime = 0;
            }
        } catch (err) {}
        setPlaying(false);
        if (setActiveLocalSong) setActiveLocalSong(null);
        setIsLocalPlayerOpen(false);
        try {
            window.screen?.orientation?.unlock();
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => {});
            }
        } catch (err) {}
    }, [setPlaying, setActiveLocalSong, setIsLocalPlayerOpen]);

    const handleSeekMouseDown = useCallback((e) => {
        e.stopPropagation();
        startSeekDrag(e.clientX);
    }, [startSeekDrag]);

    const handleSeekMouseMove = useCallback((e) => {
        if (!isSeekingRef.current) return;
        e.stopPropagation();
        paintSeekPreview(e.clientX);
    }, [paintSeekPreview]);

    const handleSeekMouseUp = useCallback((e) => {
        if (!isSeekingRef.current) return;
        e.stopPropagation();
        endSeekDrag(e.clientX);
    }, [endSeekDrag]);

    const handleSeekTouchStart = useCallback((e) => {
        e.stopPropagation();
        const touch = e.touches[0];
        if (touch) startSeekDrag(touch.clientX);
    }, [startSeekDrag]);

    const handleSeekTouchMove = useCallback((e) => {
        if (!isSeekingRef.current) return;
        e.stopPropagation();
        const touch = e.touches[0];
        if (touch) paintSeekPreview(touch.clientX);
    }, [paintSeekPreview]);

    const handleSeekTouchEnd = useCallback((e) => {
        if (!isSeekingRef.current) return;
        const touch = e.changedTouches[0];
        if (touch) endSeekDrag(touch.clientX);
    }, [endSeekDrag]);

    const handleSeekClick = useCallback((e) => {
        e.stopPropagation();
        commitSeek(e.clientX);
    }, [commitSeek]);

    const scheduleWheelRotation = useCallback((delta) => {
        const maxRot = (14 - 1) * 18;
        const current = wheelRotationMV.get();
        wheelRotationMV.set(Math.max(0, Math.min(current + delta, maxRot)));
    }, [wheelRotationMV]);

    useEffect(() => {
        const el = wheelDragRef.current;
        if (!el || !showExtraPanel) return;

        const state = {
            isDragging: false,
            pointerId: null,
            startAngle: 0
        };

        const calculateAngle = (clientX, clientY) => {
            const rect = el.getBoundingClientRect();
            const offsetX = isMobileView ? -60 : -100; 
            const centerX = rect.left + offsetX;
            const centerY = rect.top + rect.height / 2;
            return Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
        };

        const handlePointerDown = (e) => {
            state.isDragging = true;
            state.pointerId = e.pointerId;
            state.startAngle = calculateAngle(e.clientX, e.clientY);
            el.setPointerCapture(e.pointerId);
            el.style.cursor = 'grabbing';
        };

        const handlePointerMove = (e) => {
            if (!state.isDragging) return;
            const currentAngle = calculateAngle(e.clientX, e.clientY);
            let deltaAngle = currentAngle - state.startAngle;
            if (deltaAngle > 180) deltaAngle -= 360;
            if (deltaAngle < -180) deltaAngle += 360;
            state.startAngle = currentAngle;
            const sensitivity = 1.0; 
            if (wheelRafRef.current) cancelAnimationFrame(wheelRafRef.current);
            wheelRafRef.current = requestAnimationFrame(() => {
                scheduleWheelRotation(-deltaAngle * sensitivity);
            });
        };

        const handlePointerUp = (e) => {
            state.isDragging = false;
            state.pointerId = null;
            el.releasePointerCapture(e.pointerId);
            el.style.cursor = 'grab';
        };

        el.addEventListener('pointerdown', handlePointerDown);
        window.addEventListener('pointermove', handlePointerMove, { passive: false });
        window.addEventListener('pointerup', handlePointerUp);
        window.addEventListener('pointercancel', handlePointerUp);
        
        el.style.touchAction = 'none';

        return () => {
            if (wheelRafRef.current) cancelAnimationFrame(wheelRafRef.current);
            el.removeEventListener('pointerdown', handlePointerDown);
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
            window.removeEventListener('pointercancel', handlePointerUp);
        };
    }, [scheduleWheelRotation, showExtraPanel, isMobileView]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video || !isLocalPlayerOpen) return;

        const updateUI = () => {
            if (!video || !isLocalPlayerOpen || isLocked) return;
            
            const cur = video.currentTime;
            const dur = video.duration || 1;
            const prog = (cur / dur) * 100;
            
            // Direct DOM updates for maximum performance
            if (progressBarRef.current) progressBarRef.current.style.width = `${prog}%`;
            if (thumbRef.current) thumbRef.current.style.left = `calc(${prog}% - 10px)`;
            if (video.buffered.length > 0) {
                const bEnd = video.buffered.end(video.buffered.length - 1);
                if (bufferBarRef.current) bufferBarRef.current.style.width = `${(bEnd / dur) * 100}%`;
            }
            if (currentTimeRef.current) currentTimeRef.current.innerText = formatTime(cur);
            if (durationRef.current) {
                const formattedDur = formatTime(dur);
                if (durationRef.current.innerText !== formattedDur) {
                    durationRef.current.innerText = formattedDur;
                }
            }
        };

        // Throttled UI loop (250ms) to save CPU/GPU for 8K decoding
        // Higher resolution video needs more CPU cycles for the decoder, not the UI
        const intervalId = setInterval(updateUI, 250);
        return () => clearInterval(intervalId);
    }, [isLocalPlayerOpen, currentSong, isLocked]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video || !isLocalPlayerOpen) return;

        // Initialize Web Audio Context on first play/interaction
        // DISABLED WEB AUDIO FOR 8K STABILITY
        // Connecting high-bitrate video to Web Audio causes demuxer lag
        if (false && !audioCtxRef.current && playing) {
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (AudioContext) {
                    const ctx = new AudioContext();
                    audioCtxRef.current = ctx;

                    const source = ctx.createMediaElementSource(video);
                    sourceNodeRef.current = source;

                    const gainNode = ctx.createGain();
                    gainNodeRef.current = gainNode;

                    const low = ctx.createBiquadFilter();
                    low.type = 'lowshelf';
                    low.frequency.value = 320;

                    const mid = ctx.createBiquadFilter();
                    mid.type = 'peaking';
                    mid.frequency.value = 1000;
                    mid.Q.value = 1;

                    const high = ctx.createBiquadFilter();
                    high.type = 'highshelf';
                    high.frequency.value = 3200;

                    eqNodesRef.current = { low, mid, high };

                    // Connect chain: Source -> EQ -> Gain -> Destination
                    source.connect(low);
                    low.connect(mid);
                    mid.connect(high);
                    high.connect(gainNode);
                    gainNode.connect(ctx.destination);
                }
            } catch (e) {
                console.warn("Web Audio init failed:", e);
            }
        }

        // Apply Volume & Boost
        // video.volume is kept for base volume (0-1)
        // gainNode handles the "Boost" multiplier (1.0 to 2.0)
        video.volume = isMuted ? 0 : volume;
        if (gainNodeRef.current) {
            gainNodeRef.current.gain.setTargetAtTime(volumeBoost / 100, audioCtxRef.current.currentTime, 0.1);
        }

        // Apply EQ Presets
        if (eqNodesRef.current.low) {
            const { low, mid, high } = eqNodesRef.current;
            const now = audioCtxRef.current.currentTime;
            switch (eqPreset) {
                case 'Bass Boost':
                    low.gain.setTargetAtTime(12, now, 0.1);
                    mid.gain.setTargetAtTime(0, now, 0.1);
                    high.gain.setTargetAtTime(-2, now, 0.1);
                    break;
                case 'Voice':
                    low.gain.setTargetAtTime(-5, now, 0.1);
                    mid.gain.setTargetAtTime(8, now, 0.1);
                    high.gain.setTargetAtTime(2, now, 0.1);
                    break;
                case 'Movie':
                    low.gain.setTargetAtTime(5, now, 0.1);
                    mid.gain.setTargetAtTime(-2, now, 0.1);
                    high.gain.setTargetAtTime(5, now, 0.1);
                    break;
                default: // Normal
                    low.gain.setTargetAtTime(0, now, 0.1);
                    mid.gain.setTargetAtTime(0, now, 0.1);
                    high.gain.setTargetAtTime(0, now, 0.1);
            }
        }

        video.playbackRate = playbackRate;
        video.loop = loopVideo;

    }, [volume, isMuted, playbackRate, volumeBoost, loopVideo, eqPreset, playing, isLocalPlayerOpen]);

    // Audio Track Detection
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const updateTracks = () => {
            if (video.audioTracks) {
                const tracks = Array.from(video.audioTracks).map((t, i) => ({
                    id: i,
                    label: t.label || t.language || `Track ${i + 1}`,
                    enabled: t.enabled
                }));
                setAudioTracks(tracks);
            }
        };

        video.addEventListener('loadedmetadata', updateTracks);
        return () => video.removeEventListener('loadedmetadata', updateTracks);
    }, []);

    const handleAudioTrackChange = (index) => {
        const video = videoRef.current;
        if (video && video.audioTracks) {
            Array.from(video.audioTracks).forEach((t, i) => {
                t.enabled = (i === index);
            });
            showMXToast(`Audio: ${video.audioTracks[index].label || 'Track ' + (index + 1)}`, <Headphones size={16} />, "#22d3ee");
            // Refresh state
            const tracks = Array.from(video.audioTracks).map((t, i) => ({
                id: i,
                label: t.label || t.language || `Track ${i + 1}`,
                enabled: t.enabled
            }));
            setAudioTracks(tracks);
        }
    };

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
        showMXToast(newLock ? 'Controls Locked' : 'Controls Unlocked', newLock ? <Lock size={16} /> : <Unlock size={16} />, '#FCD34D');
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
        showMXToast('Screenshot Saved', <Camera size={16} />, '#38BDF8');
    };

    const toggleROT = async (e) => {
        e?.stopPropagation();
        const newOrient = orientation === 'portrait' ? 'landscape' : 'portrait';

        try {
            if (newOrient === 'landscape') {
                if (document.documentElement.requestFullscreen) {
                    await document.documentElement.requestFullscreen().catch(() => { });
                }
                if (window.screen?.orientation?.lock) {
                    await window.screen.orientation.lock('landscape-primary').catch(() => { });
                }
                try {
                    await ScreenOrientation.lock({ orientation: 'landscape-primary' });
                    setForceLandscape(false);
                } catch (e) {
                    if (window.innerWidth < window.innerHeight) setForceLandscape(true);
                }
                showMXToast('ORIENTATION: LANDSCAPE', <RefreshCcw size={16} />, '#34D399');
            } else {
                if (window.screen?.orientation?.lock) {
                    await window.screen.orientation.lock('portrait').catch(() => { });
                }
                try {
                    await ScreenOrientation.lock({ orientation: 'portrait' });
                } catch (e) { }
                if (document.fullscreenElement) {
                    await document.exitFullscreen().catch(() => { });
                }
                setForceLandscape(false);
                showMXToast('ORIENTATION: PORTRAIT', <RefreshCcw size={16} />, '#34D399');
            }
        } catch (err) {
            console.warn("Rotation error:", err);
            showMXToast(`FORCING ${newOrient.toUpperCase()}`, <RefreshCcw size={16} />, '#34D399');
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

    // Fullscreen & orientation safety handlers for mobile
    useEffect(() => {
        const onFsChange = async () => {
            const isFs = !!document.fullscreenElement;
            if (isFs) {
                try { 
                    await ScreenOrientation.lock({ orientation: 'landscape-primary' }); 
                    setForceLandscape(false);
                } catch (e) {
                    if (window.innerWidth < window.innerHeight) setForceLandscape(true);
                }
            } else {
                try { await ScreenOrientation.unlock(); } catch (e) { }
                try { window.screen?.orientation?.unlock?.(); } catch (e) { }
                setForceLandscape(false);
            }
        };

        const onOrientation = () => {
            // Keep landscape permanent
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

    // Force absolute black background on the entire document to prevent notch/safe-area white bleed on mobile
    useEffect(() => {
        if (!isLocalPlayerOpen) return;
        const origBodyBg = document.body.style.backgroundColor;
        const origHtmlBg = document.documentElement.style.backgroundColor;
        
        document.body.style.backgroundColor = '#000000';
        document.documentElement.style.backgroundColor = '#000000';
        
        let metaTheme = document.querySelector('meta[name="theme-color"]');
        let origTheme = metaTheme ? metaTheme.getAttribute('content') : null;
        if (!metaTheme) {
            metaTheme = document.createElement('meta');
            metaTheme.name = 'theme-color';
            document.head.appendChild(metaTheme);
        }
        metaTheme.setAttribute('content', '#000000');

        return () => {
            document.body.style.backgroundColor = origBodyBg;
            document.documentElement.style.backgroundColor = origHtmlBg;
            if (origTheme) metaTheme.setAttribute('content', origTheme);
            else metaTheme.remove();
        };
    }, [isLocalPlayerOpen]);

    useEffect(() => {
        const handleKey = (e) => {
            if (!isLocalPlayerOpen) return;
            switch (e.code) {
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

    // ── LIGHTWEIGHT ENGINE CLEANUP ──
    useEffect(() => {
        return () => {
            if (videoRef.current) {
                videoRef.current.src = '';
                videoRef.current.load();
            }
        };
    }, []);

    // ONLY RENDER IF PLAYER IS OPEN
    if (!isLocalPlayerOpen) return null;

    // GLASSMORHPIC 16K STUDIO LAUNCHPAD WHEN NO LOCAL MEDIA LOADED YET
    if (!currentSong) {
        return (
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] bg-[#07090e]/85 backdrop-blur-3xl flex items-center justify-center p-4 sm:p-6 font-sans select-none"
                    onClick={() => setIsLocalPlayerOpen(false)}
                >
                    {/* Fixed Glass Orbs behind launchpad */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
                        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-cyan-500/15 blur-[120px]" />
                        <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] rounded-full bg-[#f5b700]/15 blur-[130px]" />
                    </div>

                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-2xl bg-[#0d101a]/85 backdrop-blur-2xl border border-white/15 rounded-3xl p-6 sm:p-8 shadow-[0_30px_90px_rgba(0,0,0,0.85),0_0_40px_rgba(245,183,0,0.15)] overflow-hidden"
                    >
                        {/* Top Bar inside modal */}
                        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#f5b700] to-amber-600 flex items-center justify-center text-black font-black shadow-[0_0_20px_rgba(245,183,0,0.4)]">
                                    <Film size={20} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-white text-base sm:text-lg font-black uppercase tracking-tight">
                                            16K Studio Local Player
                                        </h2>
                                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[#f5b700]/20 text-[#f5b700] border border-[#f5b700]/30">
                                            PRO JOG DIAL
                                        </span>
                                    </div>
                                    <p className="text-gray-400 text-xs">
                                        Hardware GPU accelerated zero-latency playback
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsLocalPlayerOpen(false)}
                                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-gray-300 hover:text-white transition active:scale-95"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Drag and Drop Zone */}
                        <div
                            onDragOver={(e) => { e.preventDefault(); }}
                            onDrop={(e) => {
                                e.preventDefault();
                                const file = e.dataTransfer?.files?.[0];
                                if (file && playLocalFile) {
                                    playLocalFile(file);
                                    setShowExtraPanel(true);
                                }
                            }}
                            onClick={() => {
                                document.getElementById('macfeed-launchpad-file-input')?.click();
                            }}
                            className="group relative border-2 border-dashed border-white/20 hover:border-[#f5b700] rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 bg-white/[0.02] hover:bg-white/[0.05]"
                        >
                            <input
                                id="macfeed-launchpad-file-input"
                                type="file"
                                accept="video/*,audio/*,.mkv,.mp4,.webm,.mov,.avi,.mp3"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file && playLocalFile) {
                                        playLocalFile(file);
                                        setShowExtraPanel(true);
                                    }
                                }}
                            />
                            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 group-hover:border-[#f5b700]/50 group-hover:scale-110 group-hover:bg-[#f5b700]/10 flex items-center justify-center text-[#f5b700] mb-3 transition-all duration-300 shadow-lg">
                                <FolderOpen size={28} />
                            </div>
                            <h3 className="text-white text-sm sm:text-base font-bold mb-1">
                                Click to Browse or Drop Video File Here
                            </h3>
                            <p className="text-gray-400 text-xs max-w-sm mb-4">
                                Supports 4K/8K/16K MP4, MKV, WebM, MOV, AVI with frame-accurate Jog Wheel scrubbing
                            </p>
                            <div className="flex flex-wrap items-center justify-center gap-2">
                                <span className="px-3 py-1 rounded-full text-[10px] font-semibold bg-white/5 border border-white/10 text-gray-300">.MP4</span>
                                <span className="px-3 py-1 rounded-full text-[10px] font-semibold bg-white/5 border border-white/10 text-gray-300">.MKV</span>
                                <span className="px-3 py-1 rounded-full text-[10px] font-semibold bg-white/5 border border-white/10 text-gray-300">.WEBM</span>
                                <span className="px-3 py-1 rounded-full text-[10px] font-semibold bg-white/5 border border-white/10 text-gray-300">.MOV</span>
                            </div>
                        </div>

                        {/* Action Buttons Row */}
                        <div className="mt-5 flex flex-col sm:flex-row items-center gap-3">
                            <button
                                onClick={() => {
                                    document.getElementById('macfeed-launchpad-file-input')?.click();
                                }}
                                className="w-full sm:flex-1 py-3 px-5 rounded-2xl bg-white text-black font-bold text-xs flex items-center justify-center gap-2 hover:bg-gray-200 transition shadow-[0_0_20px_rgba(255,255,255,0.25)] active:scale-98"
                            >
                                <FolderOpen size={16} />
                                <span>Open Video from Computer</span>
                            </button>
                            <button
                                onClick={() => {
                                    if (playLocalSong) {
                                        playLocalSong({
                                            id: 'demo-16k',
                                            title: '4K Cinema Test - Tears of Steel (16K Pro Demo)',
                                            video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
                                            thumbnail_url: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&q=80&w=800',
                                            source: 'local',
                                            category: 'Local'
                                        });
                                        setShowExtraPanel(true);
                                    }
                                }}
                                className="w-full sm:flex-1 py-3 px-5 rounded-2xl bg-[#f5b700] hover:bg-amber-400 text-black font-bold text-xs flex items-center justify-center gap-2 border border-[#f5b700] shadow-[0_0_20px_rgba(245,183,0,0.4)] transition active:scale-98"
                            >
                                <Maximize2 size={16} />
                                <span>Try Jog Wheel with Demo Video 🎛️</span>
                            </button>
                        </div>

                        {/* Recent Local Files list */}
                        {(() => {
                            try {
                                const recent = JSON.parse(localStorage.getItem('macfeed_recent_local') || '[]');
                                if (recent && recent.length > 0) {
                                    return (
                                        <div className="mt-5 pt-4 border-t border-white/10">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                                                    <Clock size={12} className="text-[#f5b700]" />
                                                    Recent Local Videos
                                                </span>
                                            </div>
                                            <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
                                                {recent.slice(0, 4).map((f) => (
                                                    <div
                                                        key={f.id}
                                                        onClick={() => {
                                                            document.getElementById('macfeed-launchpad-file-input')?.click();
                                                        }}
                                                        className="flex items-center justify-between p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] cursor-pointer transition text-xs"
                                                    >
                                                        <span className="text-white truncate font-medium max-w-[320px]">{f.name}</span>
                                                        <span className="text-gray-400 font-mono text-[10px]">{f.size}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                }
                            } catch (e) { }
                            return null;
                        })()}
                    </motion.div>
                </motion.div>
            </AnimatePresence>
        );
    }

    return (
        <AnimatePresence>
        <motion.div
            ref={containerRef}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className={`fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center overflow-hidden font-sans select-none touch-none px-2 sm:px-0 rounded-lg sm:rounded-2xl ${forceLandscape ? 'rotate-90 origin-center' : ''}`}
            style={forceLandscape ? { width: '100vh', height: '100vw', position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(90deg)', backgroundColor: 'black' } : { backgroundColor: 'black' }}
            onMouseMove={resetControlsTimeout}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onClick={(e) => {
                    if (e.target.tagName === 'BUTTON' || e.target.closest('button') || e.target.closest('input')) return;
                    if (!isLocked) {
                        if (showExtraPanel) {
                            setShowExtraPanel(false);
                        } else {
                            if (showControls) {
                                setShowControls(false);
                                if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
                            } else {
                                resetControlsTimeout();
                            }
                        }
                    }
                }}
            >
                {brightness < 100 && (
                    <div className="fixed inset-0 pointer-events-none z-[15] rounded-lg sm:rounded-2xl" style={{ backgroundColor: 'black', opacity: Math.max(0, 1 - (brightness / 100)) }} />
                )}

                <VideoRenderer 
                    videoRef={videoRef}
                    aspectRatio={aspectRatio}
                    handleVideoMetadata={handleVideoMetadata}
                    setIsLoading={setIsLoading}
                    setPlaying={setPlaying}
                    activeSubtitle={activeSubtitle}
                    showControls={showControls}
                />

                {(playerError || playerMaxHeight) && showControls && (
                    <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-[60] px-3 py-2 bg-black/70 text-white text-xs rounded-full">
                        {playerError ? `Playback error: ${playerError.message}` : (playerMaxHeight ? (playerSmooth ? `Device reports smooth playback up to ${playerMaxHeight}px` : `Quality capped to ${playerMaxHeight}px for smoother playback`) : null)}
                    </div>
                )}

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
                        <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 60, opacity: 1 }} exit={{ opacity: 0 }} className="absolute top-0 left-1/2 -translate-x-1/2 z-[1000] bg-black/95 px-4 py-2 rounded-full flex items-center gap-2 border border-white/10 shadow-2xl">
                            <span style={{ color: toast.color }}>{toast.icon}</span>
                            <span className="text-white text-[10px] font-black uppercase tracking-widest">{toast.msg}</span>
                        </motion.div>
                    )}
                </AnimatePresence>



                {/* TOP BAR */}
                <AnimatePresence>
                    {showControls && !isLocked && !showExtraPanel && (
                        <motion.div
                            initial={{ y: -100 }} animate={{ y: 0 }} exit={{ y: -100 }}
                            transition={{ type: 'tween', ease: 'circOut', duration: 0.2 }}
                            className="absolute top-0 left-0 right-0 z-[600] p-6 flex items-center justify-between bg-gradient-to-b from-black to-transparent"
                            onClick={e => { e.stopPropagation(); resetControlsTimeout(); }}
                        >
                            <div className="flex items-center gap-6">
                                <button onClick={handleClosePlayer} className="text-white p-2 hover:text-[#f5b700] transition active:scale-95" title="Close Video">
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
                                        showMXToast(`Ratio: ${nextRatio}`, <Maximize size={16} />, "#38BDF8");
                                    }}
                                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white"
                                >
                                    <Monitor size={18} />
                                </button>
                                <div className="relative flex items-center">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setShowDubMenu(!showDubMenu); setShowSettings(false); }} 
                                        className={`w-10 h-10 rounded-full bg-white/10 flex items-center justify-center relative ${isDubbing ? 'text-cyan-400 border border-cyan-400/50' : 'text-white'}`}
                                    >
                                        <Mic size={18} />
                                        {isDubbing && <span className="absolute top-2 right-2 w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></span>}
                                    </button>
                                    
                                    {/* Language Badge */}
                                    <AnimatePresence>
                                        {isDubbing && (
                                            <motion.div
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -10 }}
                                                className="absolute right-full mr-3 whitespace-nowrap bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 text-xs font-black uppercase tracking-widest px-2 py-1 rounded-md"
                                            >
                                                {dubLanguage}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
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
                            initial={{ opacity: 0 }} 
                            animate={{ 
                                opacity: showExtraPanel ? 0.2 : 1,
                                scale: showExtraPanel ? 0.95 : 1
                            }} 
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className={`absolute inset-0 flex items-center justify-center gap-16 z-[500] ${showExtraPanel ? 'pointer-events-none' : 'pointer-events-none'}`}
                        >
                            <button onClick={e => { e.stopPropagation(); if (videoRef.current) videoRef.current.currentTime -= 10; }} className={`pointer-events-auto text-white p-4 transition-opacity ${showExtraPanel ? 'opacity-20' : 'opacity-100'}`}>
                                <ChevronsLeft size={32} />
                            </button>
                            <button onClick={e => { e.stopPropagation(); setPlaying(!playing); }} className={`pointer-events-auto text-white p-4 transition-opacity ${showExtraPanel ? 'opacity-20' : 'opacity-100'}`}>
                                {playing ? <Pause size={48} fill="white" /> : <Play size={48} fill="white" />}
                            </button>
                            <button onClick={e => { e.stopPropagation(); if (videoRef.current) videoRef.current.currentTime += 10; }} className={`pointer-events-auto text-white p-4 transition-opacity ${showExtraPanel ? 'opacity-20' : 'opacity-100'}`}>
                                <ChevronsRight size={32} />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                
                {/* AUTO DUB PROCESSING HUD */}
                <AnimatePresence>
                    {isDubbing && dubStatus && (
                        <motion.div
                            initial={{ opacity: 0, y: -20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="absolute top-24 left-1/2 -translate-x-1/2 z-[600] pointer-events-none"
                        >
                            <div className="px-6 py-3 rounded-2xl bg-black/80 backdrop-blur-md border border-cyan-500/30 flex items-center gap-4 shadow-[0_0_30px_rgba(6,182,212,0.3)]">
                                <div className="relative flex h-4 w-4">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-4 w-4 bg-cyan-500"></span>
                                </div>
                                <span className="text-cyan-400 font-bold tracking-widest text-sm uppercase">{dubStatus}</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>


                {/* AUTO DUB MENU */}
                <AnimatePresence>
                    {showDubMenu && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="absolute bottom-32 right-10 z-[700] w-64 bg-black/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-4 shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
                                <div className="flex items-center gap-2">
                                    <Globe size={18} className="text-cyan-400" />
                                    <span className="text-white font-bold">Auto Dub</span>
                                </div>
                                {isDubbing && (
                                    <button onClick={handleStopDubbing} className="text-xs px-3 py-1 bg-red-500/20 text-red-400 rounded-full hover:bg-red-500/40">
                                        Turn Off
                                    </button>
                                )}
                            </div>
                            <div className="max-h-60 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                                {DUB_LANGUAGES.map(lang => (
                                    <button
                                        key={lang}
                                        onClick={() => handleStartDubbing(lang)}
                                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${dubLanguage === lang && isDubbing ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-400' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}
                                    >
                                        <span className="font-medium">{lang}</span>
                                        {dubLanguage === lang && isDubbing && <Check size={16} />}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

{/* BOTTOM SECTION */}
                <AnimatePresence>
                    {showControls && !isLocked && (
                        <motion.div
                            animate={{ 
                                opacity: showExtraPanel ? 0.3 : 1,
                                y: showExtraPanel ? 20 : 0
                            }}
                            transition={{ type: 'tween', ease: 'circOut', duration: 0.2 }}
                            className={`absolute bottom-0 left-0 right-0 z-[600] p-6 flex flex-col gap-6 bg-gradient-to-t from-black to-transparent ${showExtraPanel ? 'pointer-events-none opacity-30' : 'pointer-events-auto'}`}
                            onClick={e => { e.stopPropagation(); if(!showExtraPanel) resetControlsTimeout(); }}
                        >
                            <div className="flex flex-col gap-3">
                                {/* Seek Bar Row */}
                                <div
                                    ref={seekBarRef}
                                    className="w-full flex items-center gap-3 sm:gap-4 py-2 cursor-pointer select-none"
                                    style={{
                                        transform: 'translateZ(0)',
                                        backfaceVisibility: 'hidden',
                                        WebkitBackfaceVisibility: 'hidden',
                                        willChange: 'transform',
                                        touchAction: 'none',
                                    }}
                                    onMouseDown={handleSeekMouseDown}
                                    onMouseMove={handleSeekMouseMove}
                                    onMouseUp={handleSeekMouseUp}
                                    onMouseLeave={handleSeekMouseUp}
                                    onTouchStart={handleSeekTouchStart}
                                    onTouchMove={handleSeekTouchMove}
                                    onTouchEnd={handleSeekTouchEnd}
                                    onClick={handleSeekClick}
                                >
                                    <span ref={currentTimeRef} className="text-white text-[10px] font-black min-w-[45px]">00:00</span>
                                    <div
                                        className="flex-1 h-1.5 bg-white/10 rounded-full relative"
                                        style={{
                                            transform: 'translateZ(0)',
                                            backfaceVisibility: 'hidden',
                                            WebkitBackfaceVisibility: 'hidden',
                                            willChange: 'transform',
                                            touchAction: 'none',
                                        }}
                                    >
                                        <div ref={bufferBarRef} className="absolute top-0 left-0 h-full bg-white/5 rounded-full" style={{ width: '0%' }} />
                                        <div
                                            ref={progressBarRef}
                                            className="absolute top-0 left-0 h-full bg-[#f5b700] rounded-full shadow-[0_0_12px_rgba(245,183,0,0.6)]"
                                            style={{
                                                width: '0%',
                                                transform: 'translateZ(0)',
                                                backfaceVisibility: 'hidden',
                                                WebkitBackfaceVisibility: 'hidden',
                                                willChange: 'width, transform',
                                            }}
                                        >
                                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-xl scale-110" />
                                        </div>
                                    </div>
                                    <span ref={durationRef} className="text-white text-[10px] font-black min-w-[45px]">00:00</span>
                                </div>

                                {/* Controls Row: Transport & Jog Wheel */}
                                <div className="flex items-center justify-between gap-4">
                                    {/* Left Hint */}
                                    <div className="w-24 hidden sm:block text-[11px] text-gray-400 font-mono tracking-wider">
                                        {aspectRatio}
                                    </div>

                                    {/* Center: Physical Transport Controls */}
                                    <div className="flex items-center justify-center gap-4 mx-auto">
                                        {/* Rewind 10s */}
                                        <button
                                            type="button"
                                            onClick={(e) => handleSkipRelative(-10, e)}
                                            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 flex items-center justify-center text-white/90 border border-white/15 backdrop-blur-md transition-all shadow-md"
                                            title="Rewind 10s"
                                        >
                                            <RotateCcw size={17} />
                                        </button>

                                        {/* Big Gold Glass Play/Pause Button */}
                                        <button
                                            type="button"
                                            onClick={handleTogglePlay}
                                            className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#f5b700] via-amber-400 to-[#f5b700] text-black active:scale-95 flex items-center justify-center shadow-[0_0_30px_rgba(245,183,0,0.6)] hover:shadow-[0_0_45px_rgba(245,183,0,0.85)] border border-[#f5b700]/80 transition-all duration-200"
                                            title={playing ? 'Pause' : 'Play'}
                                        >
                                            {playing ? (
                                                <Pause size={22} className="fill-black text-black" />
                                            ) : (
                                                <Play size={22} className="fill-black text-black ml-0.5" />
                                            )}
                                        </button>

                                        {/* Forward 10s */}
                                        <button
                                            type="button"
                                            onClick={(e) => handleSkipRelative(10, e)}
                                            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 flex items-center justify-center text-white/90 border border-white/15 backdrop-blur-md transition-all shadow-md"
                                            title="Forward 10s"
                                        >
                                            <RotateCw size={17} />
                                        </button>
                                    </div>

                                    {/* Right: Jog Wheel Toggle */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setShowExtraPanel(!showExtraPanel); }}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl transition-all duration-300 active:scale-95 border backdrop-blur-xl ${
                                                showExtraPanel
                                                    ? 'bg-[#f5b700] text-black border-[#f5b700] shadow-[0_0_20px_rgba(245,183,0,0.5)] font-black'
                                                    : 'bg-white/10 hover:bg-white/20 text-white border-white/15 shadow-lg'
                                            }`}
                                            title="Toggle Precision Jog Wheel"
                                        >
                                            <Settings2 size={16} className={showExtraPanel ? "animate-spin-slow text-black" : "text-[#f5b700]"} />
                                            <span className="text-[10px] font-bold tracking-wider uppercase">Jog Wheel</span>
                                        </button>
                                    </div>
                                </div>
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
                            className="absolute inset-0 z-[800] flex items-center justify-start overflow-hidden pointer-events-auto bg-[#05070e]/80 backdrop-blur-3xl border-r border-white/10 shadow-[60px_0_160px_rgba(0,0,0,0.85)]"
                            onClick={() => setShowExtraPanel(false)}
                        >
                            {/* Top Glassmorphic Dismiss Button */}
                            <div className="absolute top-4 left-4 z-[950] flex items-center gap-3">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setShowExtraPanel(false); }}
                                    className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/15 backdrop-blur-xl shadow-lg transition active:scale-95 text-xs font-bold"
                                >
                                    <X size={14} className="text-[#f5b700]" />
                                    <span>Close Wheel</span>
                                </button>
                                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-[10px] font-mono uppercase tracking-widest backdrop-blur-md">
                                    <span>PRECISION JOG DIAL • 16K</span>
                                </div>
                            </div>

                            {/* 
                        EXPANDED INTERACTIVE AREA (LEFT SIDE):
                        Now covers a larger width to ensure scrolling anywhere on the left
                        rotates the wheel, not just on the frames.
                    */}
                            <div
                                onWheel={(e) => {
                                     const sensitivity = 3.2;
                                    scheduleWheelRotation(-(e.deltaY * sensitivity));
                                }}
                                className="relative h-full w-[400px] md:w-[500px] flex items-center justify-start pointer-events-auto group/wheel"
                                onClick={e => e.stopPropagation()}
                                style={{
                                    transform: 'translateZ(0)',
                                    backfaceVisibility: 'hidden',
                                    WebkitBackfaceVisibility: 'hidden',
                                    willChange: 'transform',
                                }}
                            >
                                {/* Drag Area (Full height & width of the interactive zone) */}
                                <div
                                    ref={wheelDragRef}
                                    className="absolute inset-0 z-[200] cursor-grab active:cursor-grabbing"
                                    style={{
                                        transform: 'translateZ(0)',
                                        backfaceVisibility: 'hidden',
                                        WebkitBackfaceVisibility: 'hidden',
                                        willChange: 'transform',
                                        touchAction: 'none'
                                    }}
                                />
                                {/* ULTRA-PREMIUM GLASSMORHPIC PRECISION WHEEL */}
                                <div className="absolute left-[-130px] md:left-[-280px] w-[220px] md:w-[440px] h-[220px] md:h-[440px] flex items-center justify-center pointer-events-none scale-[0.55] md:scale-100 origin-left">

                                    {/* 1. OUTER PRECISION GLASS BEZEL (PHYSICALLY ROTATES WITH USER DRAG) */}
                                    <motion.div
                                        style={{ rotate: wheelRotationMV }}
                                        className="absolute w-[280px] md:w-[460px] h-[280px] md:h-[460px] rounded-full bg-gradient-to-br from-white/[0.08] via-white/[0.02] to-transparent backdrop-blur-3xl border border-white/20 shadow-[0_0_60px_rgba(0,0,0,0.9),inset_0_1px_2px_rgba(255,255,255,0.35),0_0_30px_rgba(245,183,0,0.2)]"
                                    >
                                        {/* 72 Micro-etched Radial Tick Marks */}
                                        {[...Array(72)].map((_, i) => {
                                            const isMajor = i % 6 === 0;
                                            return (
                                                <div
                                                    key={i}
                                                    className={`absolute ${isMajor ? 'w-1 h-3.5 bg-[#f5b700] shadow-[0_0_8px_#f5b700]' : 'w-0.5 h-2 bg-white/30'}`}
                                                    style={{
                                                        left: '50%',
                                                        top: 2,
                                                        transformOrigin: '50% 228px',
                                                        transform: `translateX(-50%) rotate(${i * 5}deg)`,
                                                    }}
                                                />
                                            );
                                        })}
                                    </motion.div>

                                    {/* STABLE PRECISION POINTER (ILLUMINATED AT 3 O'CLOCK / 90 DEG) */}
                                    <div className="absolute right-[12px] top-[50%] -translate-y-1/2 z-50 flex items-center">
                                        <div className="w-8 h-[2px] bg-gradient-to-l from-[#f5b700] to-transparent" />
                                        <div className="w-0 h-0 border-l-[10px] border-l-[#f5b700] border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent drop-shadow-[0_0_15px_#f5b700]" />
                                    </div>

                                    {/* 2. INNER CYAN CHROME SYSTEM RING (COUNTER-ROTATING TICK RING) */}
                                    <motion.div
                                        animate={showExtraPanel ? { rotate: -360 } : {}}
                                        transition={{ repeat: Infinity, duration: 40, ease: 'linear' }}
                                        className="absolute w-[200px] md:w-[360px] h-[200px] md:h-[360px] rounded-full border-2 border-cyan-400/40 shadow-[0_0_40px_rgba(34,211,238,0.35),inset_0_0_30px_rgba(34,211,238,0.15)] bg-cyan-950/[0.15] backdrop-blur-xl"
                                    >
                                        {/* Degree Markers */}
                                        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                                            <div
                                                key={deg}
                                                className="absolute text-[8px] font-mono font-bold text-cyan-300/70"
                                                style={{
                                                    left: '50%',
                                                    top: 10,
                                                    transformOrigin: '50% 170px',
                                                    transform: `translateX(-50%) rotate(${deg}deg)`,
                                                }}
                                            >
                                                {deg}°
                                            </div>
                                        ))}
                                    </motion.div>

                                    {/* 3. CORE MACHINED GLASS HUB */}
                                    <div className="absolute w-[140px] md:w-[260px] h-[140px] md:h-[260px] rounded-full flex flex-col items-center justify-center border-2 border-white/20 bg-gradient-to-br from-[#121624] via-[#090b12] to-[#040508] shadow-[0_15px_35px_rgba(0,0,0,0.9),inset_0_2px_8px_rgba(255,255,255,0.25)] backdrop-blur-2xl">
                                        <motion.div
                                            animate={{ scale: [1, 1.05, 1], opacity: [0.7, 1, 0.7] }}
                                            transition={{ repeat: Infinity, duration: 2.5 }}
                                            className="w-12 h-12 md:w-16 md:h-16 rounded-full border border-cyan-400/50 flex items-center justify-center bg-cyan-500/10 shadow-[0_0_25px_rgba(34,211,238,0.4)] mb-1"
                                        >
                                            <div className="w-4 h-4 rounded-full bg-[#f5b700] shadow-[0_0_15px_#f5b700]" />
                                        </motion.div>
                                        <span className="text-[9px] md:text-[11px] font-mono font-black text-[#f5b700] tracking-[0.3em] uppercase">
                                            16K PRO
                                        </span>
                                        <span className="text-[7px] md:text-[8px] font-mono text-cyan-300/60 font-semibold tracking-widest mt-0.5">
                                            PRECISION JOG
                                        </span>
                                    </div>
                                </div>
                                <div className={`absolute ${isMobileView ? 'left-[-130px] w-[200px]' : 'left-[-280px] w-[400px]'} h-full flex items-center justify-center pointer-events-none`}>
                                    {[
                                        { icon: <RefreshCcw size={14} />, label: "Rotation", color: "#fbbf24", onClick: toggleROT },
                                        { icon: <Camera size={14} />, label: "Capture", color: "#fbbf24", onClick: handleCapture },
                                        { icon: <Headphones size={14} />, label: "Audio", color: "#22d3ee", inlineMenu: {
                                            title: "Audio Tracks",
                                            items: audioTracks.length > 0 ? audioTracks.map((t, i) => ({ label: t.label, active: t.enabled, action: () => handleAudioTrackChange(i) })) : [{ label: "Default Track", active: true, action: () => {} }]
                                        } },
                                        { icon: <Sliders size={14} />, label: "Equalizer", color: "#22d3ee", onClick: () => setSettingsTab('AUDIO') || setShowSettings(true) },
                                        { icon: <ZoomIn size={14} />, label: "Zoom/Fit", color: "#fbbf24", onClick: () => setAspectRatio('Fill') },
                                        { icon: <Settings size={14} />, label: "Settings", color: "#94a3b8", onClick: () => { setShowSettings(true); setSettingsTab('PLAYBACK'); } },
                                        { icon: <Monitor size={14} />, label: "Quality", color: "#fbbf24", inlineMenu: {
                                            title: "Video Quality",
                                            items: ['Auto', '1080p', '2K', '4K', '8K', '16K'].map(q => ({ label: q, active: targetQuality === q, action: () => setTargetQuality(q) }))
                                        } },
                                        { icon: <MessageSquare size={14} />, label: "Subtitles", color: "#22d3ee", inlineMenu: {
                                            title: "Subtitles",
                                            items: subtitles.length > 0 ? subtitles.map((s, i) => ({ label: `Track ${i+1}`, active: activeSubtitle === s, action: () => setActiveSubtitle(s) })) : [{ label: "No Subtitles", active: false, action: () => {} }]
                                        } },
                                        { icon: <PlayCircle size={14} />, label: "Speed", color: "#fbbf24", inlineMenu: {
                                            title: "Playback Speed",
                                            items: SPEEDS.map(s => ({ label: `${s}x`, active: playbackRate === s, action: () => setPlaybackRate(s) }))
                                        } },
                                        { icon: <Zap size={14} />, label: "Hardware", color: "#fbbf24", onClick: () => setHwAccel(!hwAccel) },
                                        { icon: <PictureInPicture size={14} />, label: "PIP", color: "#22d3ee", onClick: () => videoRef.current?.requestPictureInPicture() },
                                        { icon: isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />, label: "Mute", color: "#22d3ee", onClick: () => setIsMuted(!isMuted) },
                                        { icon: <SkipForward size={14} />, label: "Next", color: "#fbbf24", onClick: () => next() },
                                        { icon: <Repeat size={14} />, label: "Loop", color: "#22d3ee", onClick: () => setLoopVideo(!loopVideo) }
                                    ].map((action, i) => (
                                        <JogPanel key={i} action={action} index={i} wheelRotationMV={wheelRotationMV} isMobileView={isMobileView} />
                                    ))}
                                </div>

                                {/* QUICK TABLE MENU - CENTERED OVER VIDEO */}
                                <AnimatePresence>
                                    {quickMenuData && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9, x: 20 }}
                                            animate={{ opacity: 1, scale: 1, x: 0 }}
                                            exit={{ opacity: 0, scale: 0.9, x: 20 }}
                                            // Resized "hidden table" (Quick Menu) to be 8% smaller on mobile (75% -> 67%) as requested
                                            className="fixed left-[50%] top-[50%] -translate-x-[50%] -translate-y-[50%] z-[9999] w-[67%] md:w-[90%] max-w-[400px] bg-black/98 backdrop-blur-3xl border border-white/10 rounded-[1rem] md:rounded-[3rem] overflow-hidden shadow-[0_50px_150px_rgba(0,0,0,0.9)]"
                                            onClick={e => e.stopPropagation()}
                                        >
                                            <div className="px-8 py-6 bg-white/5 border-b border-white/5 flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="text-white text-[12px] font-black uppercase tracking-[0.2em]">{quickMenuData.title}</span>
                                                    <span className="text-white/30 text-[8px] font-bold uppercase tracking-widest mt-1">Direct Function Access</span>
                                                </div>
                                                <button onClick={() => setQuickMenuData(null)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:bg-red-500 hover:text-white transition-all">
                                                    <X size={18} />
                                                </button>
                                            </div>
                                            <div className="max-h-[40vh] overflow-y-auto custom-scrollbar p-4 space-y-2">
                                                {quickMenuData.items.map((item, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => { 
                                                            item.action(); 
                                                            if(!quickMenuData.title.includes('Audio') && !quickMenuData.title.includes('Subtitles')) setQuickMenuData(null); 
                                                        }}
                                                        className={`w-full px-6 py-4 flex items-center justify-between rounded-2xl transition-all border ${item.active ? 'bg-blue-600 text-white border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.4)]' : 'bg-white/[0.02] text-white/60 border-white/5 hover:bg-white/10 hover:text-white'}`}
                                                    >
                                                        <span className="text-[12px] font-black uppercase tracking-wider">{item.label}</span>
                                                        {item.active ? (
                                                            <Check size={16} className="text-yellow-400" />
                                                        ) : (
                                                            <ChevronRight size={16} className="opacity-20" />
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="px-8 py-4 bg-white/5 border-t border-white/5 text-center">
                                                <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.4em]">MacFeed Hyper Engine v1.1</span>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* SETTINGS MODAL */}
                <AnimatePresence>
                    {showSettings && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="absolute inset-0 bg-sky-950/20 flex items-center justify-center p-4 sm:p-20 z-[2000]"
                            onClick={() => setShowSettings(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }}
                                transition={{ duration: 0.1 }}
                                className="bg-blue-900/40 w-[90%] sm:w-full max-w-[700px] h-[50vh] sm:h-[380px] rounded-[1rem] sm:rounded-[2rem] border-2 border-yellow-400 backdrop-blur-3xl overflow-hidden flex flex-row shadow-[0_0_50px_rgba(37,99,235,0.2)]"
                                onClick={e => e.stopPropagation()}
                            >
                                {/* Sidebar Tabs */}
                                <div className="w-28 sm:w-60 bg-white/[0.01] border-r border-white/5 p-1 sm:p-8 flex flex-col gap-1 sm:gap-2 overflow-y-auto no-scrollbar">
                                    <SettingsTab id="PLAYBACK" label="Playback" icon={<PlayCircle size={20} />} active={settingsTab} set={setSettingsTab} />
                                    <SettingsTab id="QUALITY" label="Video Quality" icon={<Monitor size={20} />} active={settingsTab} set={setSettingsTab} />
                                    <SettingsTab id="PERFORMANCE" label="Performance" icon={<Zap size={20} />} active={settingsTab} set={setSettingsTab} />
                                    <SettingsTab id="AUDIO" label="Audio" icon={<Volume2 size={20} />} active={settingsTab} set={setSettingsTab} />
                                    <SettingsTab id="SUBTITLES" label="Subtitles" icon={<MessageSquare size={20} />} active={settingsTab} set={setSettingsTab} />
                                    <SettingsTab id="ADVANCED" label="Advanced" icon={<Settings2 size={20} />} active={settingsTab} set={setSettingsTab} />
                                </div>

                                {/* Content Area */}
                                <div className="flex-1 p-4 sm:p-8 overflow-y-auto custom-scrollbar space-y-4 sm:space-y-8">
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
                                                        <button key={s} onClick={() => setPlaybackRate(s)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${playbackRate === s ? 'bg-blue-600 text-white border border-yellow-400 shadow-[0_0_10px_rgba(37,99,235,0.4)]' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>{s}x</button>
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
                                                                showMXToast(`${q} Rendering Activated`, <Monitor size={14} />, "#FCD34D");
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
                                                <div className="flex flex-col gap-2">
                                                    {audioTracks.length > 0 ? audioTracks.map((track, i) => (
                                                        <button
                                                            key={i}
                                                            onClick={() => handleAudioTrackChange(i)}
                                                            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold transition-all ${track.enabled ? 'bg-white text-black' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
                                                        >
                                                            <Headphones size={14} /> {track.label}
                                                        </button>
                                                    )) : (
                                                        <button className="flex items-center gap-2 px-4 py-3 bg-white/5 rounded-xl text-white/40 text-xs font-bold cursor-not-allowed">
                                                            <Headphones size={14} /> Default Track (English)
                                                        </button>
                                                    )}
                                                </div>
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
                                                            showMXToast('Subtitles Loaded', <FileText size={16} />, "#4ADE80");
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
                                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                            <div className="bg-white/[0.03] rounded-[2rem] border border-white/5 overflow-hidden">
                                                <div className="px-6 py-4 bg-white/5 border-b border-white/5">
                                                    <h4 className="text-white text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                                        <Keyboard size={14} className="text-accent" />
                                                        Keyboard Shortcuts
                                                    </h4>
                                                </div>
                                                <table className="w-full border-collapse">
                                                    <tbody className="divide-y divide-white/[0.03]">
                                                        {[
                                                            { k: "Space", d: "Play / Pause" },
                                                            { k: "← →", d: "Seek Back/Forward 10s" },
                                                            { k: "↑ ↓", d: "Adjust Volume" },
                                                            { k: "M", d: "Mute / Unmute" },
                                                            { k: "F", d: "Toggle Fullscreen" },
                                                            { k: "S", d: "Take Screenshot" },
                                                            { k: "L", d: "Lock Interface" },
                                                            { k: "A", d: "Open Audio Settings" },
                                                            { k: "0-9", d: "Jump to 0-90%" }
                                                        ].map((s, i) => (
                                                            <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                                                                <td className="px-6 py-4 text-[11px] font-medium text-white/40 uppercase tracking-wider">{s.d}</td>
                                                                <td className="px-6 py-4 text-right">
                                                                    <kbd className="px-3 py-1 bg-white/10 rounded-lg text-white font-bold text-[10px] border border-white/10 min-w-[40px] inline-block shadow-lg">{s.k}</kbd>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>

                                            <div className="bg-white/[0.03] rounded-[2rem] border border-white/5 overflow-hidden">
                                                <div className="px-6 py-4 bg-white/5 border-b border-white/5">
                                                    <h4 className="text-white text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                                        <FileText size={14} className="text-accent" />
                                                        Media Information
                                                    </h4>
                                                </div>
                                                <table className="w-full border-collapse">
                                                    <tbody className="divide-y divide-white/[0.03]">
                                                        {[
                                                            { l: "Source", v: currentSong?.title || 'Local Storage' },
                                                            { l: "Format", v: currentSong?.type || 'Auto Detect' },
                                                            { l: "Resolution", v: `${videoRef.current?.videoWidth || 0} x ${videoRef.current?.videoHeight || 0}` },
                                                            { l: "Frame Rate", v: "30.00 fps (CFR)" },
                                                            { l: "Decoder", v: `${decoder} (HEVC/H.265)` },
                                                            { l: "Render Logic", v: hwAccel ? "Hardware Accelerated" : "Software Raster" }
                                                        ].map((row, i) => (
                                                            <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                                                                <td className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">{row.l}</td>
                                                                <td className="px-6 py-4 text-right text-[11px] font-bold text-white/80">{row.v}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
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
                                            </div>
                                        </div>
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
                                className="absolute inset-0 bg-black/90"
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
                            className="absolute bottom-0 left-0 right-0 z-[1100] bg-black border-t border-white/10 p-8 rounded-t-[2.5rem] shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-white text-lg font-bold">Video Quality</h3>
                                <button onClick={() => setShowQualityMenu(false)} className="p-2 text-white/40 hover:text-white"><X size={20} /></button>
                            </div>
                            <div className="grid grid-cols-4 gap-4">
                                {['Auto', '1080p', '2K', '4K', '8K', '16K'].map(q => (
                                    <button
                                        key={q}
                                        onClick={() => {
                                            showMXToast(`${q} Hyper Engine Activated`, <Zap size={14} />, "#FCD34D");
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

export default memo(LocalPlayerOverlay);

const BottomAction = memo(({ icon, label, subLabel, onClick }) => {
    return (
        <button onClick={onClick} className="flex flex-col items-center gap-1 group outline-none">
            <div className="text-white/90 group-hover:text-white transition-colors" style={{ willChange: 'transform' }}>{icon}</div>
            <div className="flex items-center gap-1.5">
                <span className="text-white text-[11px] font-medium opacity-90">{label}</span>
                {subLabel && <span className="text-white/40 text-[10px] font-bold">{subLabel}</span>}
            </div>
        </button>
    );
});

const ExtraAction = memo(({ icon, color, label, onClick }) => {
    return (
        <button
            onClick={onClick}
            className="flex flex-col items-center gap-2 group transition-all outline-none"
        >
            <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110"
                style={{ color: color, willChange: 'transform' }}
            >
                {icon}
            </div>
            <span className="text-white/50 text-[10px] font-black uppercase tracking-widest group-hover:text-white transition-colors">{label}</span>
        </button>
    );
});

const SettingsTab = memo(({ id, label, icon, active, set }) => {
    const isActive = active === id;
    return (
        <button
            onClick={() => set(id)}
            className={`flex items-center gap-1 sm:gap-4 px-1 sm:px-8 py-1 sm:py-3 rounded-[0.6rem] sm:rounded-[1.8rem] transition-all duration-100 outline-none border-2 ${isActive ? 'bg-blue-600 text-white border-yellow-400 shadow-[0_0_30px_rgba(37,99,235,0.4)] scale-[1.01] sm:scale-[1.05]' : 'bg-white/5 text-white/40 border-transparent hover:bg-white/10 hover:text-white'}`}
        >
            <div className={`transition-transform duration-100 ${isActive ? 'scale-110' : ''}`}>{icon}</div>
            <span className="text-[8px] sm:text-[13px] font-bold tracking-tight uppercase">{label}</span>
        </button>
    );
});

const SettingRow = memo(({ label, children }) => {
    return (
        <div className="space-y-3 sm:space-y-6 mb-6 sm:mb-10">
            <h4 className="text-yellow-400 text-[9px] font-black uppercase tracking-[0.3em] ml-1">{label}</h4>
            <div className="flex flex-wrap gap-3">
                {children}
            </div>
        </div>
    );
});

const SettingToggle = memo(({ label, active, onToggle }) => {
    return (
        <div className="flex items-center justify-between py-2">
            <span className="text-white/80 text-sm font-medium">{label}</span>
            <button
                onClick={onToggle}
                className={`w-12 h-6 rounded-full relative transition-colors outline-none border ${active ? 'bg-blue-600 border-yellow-400' : 'bg-white/10 border-transparent'}`}
            >
                <motion.div
                    animate={{ x: active ? 26 : 2 }}
                    className={`absolute top-1 w-4 h-4 rounded-full ${active ? 'bg-yellow-400' : 'bg-white/40'}`}
                />
            </button>
        </div>
    );
});

const Shortcut = memo(({ keyLabel, label }) => {
    return (
        <div className="flex items-center justify-between">
            <span className="text-white/40 text-[11px] font-medium">{label}</span>
            <kbd className="px-2 py-1 bg-white/5 rounded-lg text-white/60 text-[10px] font-bold border border-white/5 min-w-[30px] text-center">{keyLabel}</kbd>
        </div>
    );
});

const JogPanel = memo(({ action, index, wheelRotationMV, isMobileView }) => {
    const angleStep = 18;
    const y = useTransform(wheelRotationMV, (rot) => {
        const rad = ((index * angleStep - rot) * Math.PI) / 180;
        const panelRadius = isMobileView ? 140 : 300;
        return Math.sin(rad) * panelRadius;
    });
    const x = useTransform(wheelRotationMV, (rot) => {
        const rad = ((index * angleStep - rot) * Math.PI) / 180;
        const panelRadius = isMobileView ? 100 : 300;
        const baseOffset = isMobileView ? 60 : 250;
        return Math.cos(rad) * panelRadius + baseOffset;
    });
    const scale = useTransform(y, (yVal) => {
        const panelRadius = isMobileView ? 140 : 300;
        const normalizedDist = Math.abs(yVal) / (panelRadius * 1.2);
        return Math.max(0.7, 1.2 - normalizedDist);
    });
    const opacity = useTransform(y, (yVal) => {
        const panelRadius = isMobileView ? 140 : 300;
        const normalizedDist = Math.abs(yVal) / (panelRadius * 1.2);
        return Math.max(0.1, 1.1 - normalizedDist);
    });

    const [isFocused, setIsFocused] = useState(false);
    const [showInlineMenu, setShowInlineMenu] = useState(false);

    useEffect(() => {
        const unsubscribe = scale.on('change', (s) => {
            setIsFocused(s > 1.05);
        });
        return unsubscribe;
    }, [scale]);

    useEffect(() => {
        if (!isFocused) setShowInlineMenu(false);
    }, [isFocused]);

    return (
        <motion.div
            style={{ y, x, scale, opacity, zIndex: showInlineMenu ? 900 : 600, position: 'absolute', left: isMobileView ? '0px' : '40px', willChange: 'transform, opacity' }}
            className="flex items-center gap-4 cursor-pointer group pointer-events-auto"
            onClick={(e) => {
                e.stopPropagation();
                if (action.inlineMenu) {
                    setShowInlineMenu(!showInlineMenu);
                } else {
                    action.onClick();
                }
            }}
            animate={isFocused ? { 
                scale: showInlineMenu ? 1.1 : 1.2,
                rotateY: showInlineMenu ? 0 : [0, 8, -8, 0],
                rotateX: showInlineMenu ? 0 : [0, 4, -4, 0],
                filter: `drop-shadow(0 0 30px ${action.color}) brightness(1.3)`
            } : { scale: 1, rotateY: 0, rotateX: 0, filter: 'none' }}
            transition={{ 
                rotateY: { repeat: Infinity, duration: 4, ease: 'easeInOut' },
                rotateX: { repeat: Infinity, duration: 3, ease: 'easeInOut' }
            }}
            whileHover={{ scale: 1.25 }}
            whileTap={{ scale: 0.9 }}
        >
            {/* ATMOSPHERIC BLUR LAYER - Behind the Wheel Area */}
            {isFocused && (
                <div className="fixed inset-y-0 left-0 w-[450px] bg-black/20 backdrop-blur-[8px] z-[-1] pointer-events-none" 
                     style={{ maskImage: 'linear-gradient(to right, black, transparent)' }} />
            )}
            {/* SVG Wireframe Box - Starting from OUTSIDE the wheel */}
            <div className="absolute left-[-160px] w-[170px] h-10 pointer-events-none transition-opacity duration-300" style={{ opacity: isFocused ? '1' : '0.5' }}>
                <svg width="170" height="40" viewBox="0 0 170 40" fill="none">
                    <path d="M10 20 H90 L120 5 H170" stroke={action.color} strokeWidth="2.5" strokeOpacity="0.9" />
                    <path d="M10 20 H90 L120 35 H170" stroke={action.color} strokeWidth="2.5" strokeOpacity="0.9" />
                    <circle cx="10" cy="20" r="5" fill={action.color} />
                </svg>
            </div>

            {/* Panel Body - Ultra-Luxury Glassmorphic Action Card */}
            <div
                className={`relative ${isMobileView ? 'w-24 h-9 px-2' : 'w-40 h-14 px-3.5'} rounded-2xl transition-all duration-300 flex items-center justify-between backdrop-blur-2xl`}
                style={{
                    backgroundColor: isFocused ? 'rgba(15, 20, 32, 0.88)' : 'rgba(10, 13, 20, 0.65)',
                    borderWidth: '1px',
                    borderColor: isFocused ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                    borderLeftWidth: isMobileView ? '4px' : '6px',
                    borderLeftColor: isFocused ? action.color : 'rgba(255, 255, 255, 0.2)',
                    boxShadow: isFocused
                        ? `0 10px 30px rgba(0,0,0,0.8), 0 0 35px ${action.color}55, inset 0 1px 1px rgba(255,255,255,0.3)`
                        : '0 4px 16px rgba(0,0,0,0.5)',
                    opacity: isFocused ? '1' : '0.75'
                }}
            >
                <div
                    className="transition-all duration-300 flex items-center justify-center"
                    style={{
                        color: isFocused ? action.color : 'rgba(255,255,255,0.5)',
                        transform: isFocused ? 'scale(1.25)' : 'scale(1)',
                        filter: isFocused ? `drop-shadow(0 0 10px ${action.color})` : 'none'
                    }}
                >
                    {action.icon}
                </div>
                <div className="flex flex-col items-end">
                    <span
                        className={`text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${
                            isFocused ? 'text-white' : 'text-gray-300'
                        }`}
                    >
                        {action.label}
                    </span>
                    {action.inlineMenu && (
                        <div
                            className={`w-1.5 h-1.5 rounded-full mt-1 transition-all ${
                                showInlineMenu
                                    ? 'bg-[#f5b700] shadow-[0_0_10px_#f5b700]'
                                    : 'bg-white/30'
                            }`}
                        />
                    )}
                </div>
            </div>

            {/* IN-LINE FEATURE ROW - APPEARS IN FRONT OF WIREBOX */}
            <AnimatePresence>
                {showInlineMenu && action.inlineMenu && (
                    <motion.div
                        initial={{ opacity: 0, x: -30, scale: 0.8 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -30, scale: 0.8 }}
                        className="flex items-center gap-3 ml-2 sm:ml-6 p-3 bg-red-950/20 backdrop-blur-3xl rounded-2xl border border-red-500/20 shadow-[0_0_50px_rgba(220,38,38,0.2)] max-w-[200px] sm:max-w-[500px] overflow-x-auto no-scrollbar"
                        onClick={e => e.stopPropagation()}
                    >
                        {action.inlineMenu.items.map((item, i) => (
                            <button
                                key={i}
                                onClick={() => { item.action(); setShowInlineMenu(false); }}
                                className={`px-5 py-2.5 rounded-xl whitespace-nowrap text-[10px] font-black uppercase tracking-widest transition-all border ${item.active ? 'bg-yellow-200 text-black border-yellow-200 shadow-[0_0_20px_rgba(250,204,21,0.6)]' : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10 hover:text-white'}`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
});
