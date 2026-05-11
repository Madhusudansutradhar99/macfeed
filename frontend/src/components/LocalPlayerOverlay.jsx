import React, { useRef, useEffect, useState, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import {
    ArrowLeft, Lock, Unlock, Maximize, ChevronsLeft, ChevronsRight,
    Play, Pause, Sun, PlayCircle, Monitor, MessageSquare,
    Settings, Volume2, RotateCcw, RotateCw, Camera, Headphones,
    Sliders, PictureInPicture, VolumeX, SkipBack, SkipForward,
    Repeat, Check, X, ChevronRight, Minimize2, MoreHorizontal, MoreVertical,
    Layout, RefreshCcw, ZoomIn, Type, Palette, Shield, Zap,
    Keyboard, FileText, Download, List, Settings2, Camera as CaptureIcon, ZoomIn as ZoomIcon
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

// --- SUB-COMPONENT FOR HIGH PERFORMANCE ROTATION ---
const JogPanel = ({ action, index, wheelRotationMV, isMobileView }) => {
    const angleStep = 18;
    
    // Use framer-motion transforms for 60fps updates without React re-renders
    const x = useTransform(wheelRotationMV, (rot) => {
        const rad = ((index * angleStep - rot) * Math.PI) / 180;
        const panelRadius = isMobileView ? 160 : 240;
        return Math.cos(rad) * panelRadius;
    });

    const y = useTransform(wheelRotationMV, (rot) => {
        const rad = ((index * angleStep - rot) * Math.PI) / 180;
        const panelRadius = isMobileView ? 160 : 240;
        return Math.sin(rad) * panelRadius;
    });

    const scale = useTransform(y, (yVal) => {
        const panelRadius = isMobileView ? 160 : 240;
        const normalizedDist = Math.abs(yVal) / (panelRadius * 1.2);
        return Math.max(0.7, 1.2 - normalizedDist);
    });

    const opacity = useTransform(y, (yVal) => {
        const panelRadius = isMobileView ? 160 : 240;
        const normalizedDist = Math.abs(yVal) / (panelRadius * 1.2);
        return Math.max(0.2, 1.1 - normalizedDist);
    });

    // We need a local state just for the "focused" styling (border color)
    const [isFocused, setIsFocused] = useState(false);
    useEffect(() => {
        return scale.on('change', (s) => setIsFocused(s > 1.05));
    }, [scale]);

    return (
        <motion.div
            className="absolute pointer-events-auto flex items-center cursor-pointer group"
            style={{ x, y, scale, opacity, zIndex: 300, willChange: 'transform' }}
            onClick={(e) => { e.stopPropagation(); action.onClick(); }}
        >
            <div className="mx-panel-svg absolute left-[-190px] w-[200px] h-10 pointer-events-none transition-opacity duration-300" style={{ opacity: isFocused ? '1' : '0.2' }}>
                <svg width="200" height="40" viewBox="0 0 200 40" fill="none">
                    <path d="M10 20 H120 L150 5 H200" stroke={action.color} strokeWidth="1.5" strokeOpacity="0.7" />
                    <path d="M10 20 H120 L150 35 H200" stroke={action.color} strokeWidth="1.5" strokeOpacity="0.7" />
                    <circle cx="10" cy="20" r="3.5" fill={action.color} />
                </svg>
            </div>

            <div
                className="mx-panel-inner relative w-32 h-12 bg-black/98 backdrop-blur-3xl border-l-[6px] border-r-[2px] border-y-[2px] transition-all duration-300 flex items-center justify-between px-3"
                style={{
                    clipPath: 'polygon(15% 0%, 100% 0%, 85% 100%, 0% 100%)',
                    borderLeftColor: isFocused ? action.color : 'rgba(255,255,255,0.1)',
                    boxShadow: isFocused ? `0 0 25px ${action.color}33` : 'none',
                    transform: isFocused ? 'scale(1.05)' : 'scale(1)',
                    opacity: isFocused ? '1' : '0.6'
                }}
            >
                <div className="mx-panel-icon transition-all duration-300" style={{ color: isFocused ? action.color : 'rgba(255,255,255,0.4)', transform: isFocused ? 'scale(1.25)' : 'scale(1)' }}>
                    {action.icon}
                </div>
                <div className="flex flex-col items-end mr-1">
                    <span className="mx-panel-label text-[8.5px] font-black uppercase tracking-tighter transition-all duration-300" style={{ color: isFocused ? '#ffffff' : 'rgba(255,255,255,0.4)' }}>
                        {action.label}
                    </span>
                    <div className="mx-panel-line h-[1.5px] w-8 mt-1" style={{ backgroundColor: action.color, display: isFocused ? 'block' : 'none' }} />
                </div>
            </div>
        </motion.div>
    );
};

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
    const wheelRafRef = useRef(null);
    const wheelRotationMV = useMotionValue(0);
    const [wheelRotation, setWheelRotation] = useState(0); 
    const wheelDragRef = useRef(null);
    const [showExtraPanel, setShowExtraPanel] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showQualityMenu, setShowQualityMenu] = useState(false);
    const [settingsTab, setSettingsTab] = useState('PLAYBACK');
    const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
    const [aspectRatio, setAspectRatio] = useState('Fit');
    const [hwAccel, setHwAccel] = useState(true);
    const [loopVideo, setLoopVideo] = useState(false);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        const handleResize = () => setIsMobileView(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        return wheelRotationMV.on('change', (v) => setWheelRotation(v));
    }, [wheelRotationMV]);

    const showMXToast = (msg, icon, color = "#fff") => {
        setToast({ msg, icon, color });
        setTimeout(() => setToast(null), 2000);
    };

    const toggleROT = () => {
        const newRot = !loopVideo;
        setLoopVideo(newRot);
        showMXToast(`Loop: ${newRot ? 'ON' : 'OFF'}`, <RefreshCcw size={16} />, "#38BDF8");
    };

    const handleCapture = () => showMXToast("Screen Captured", <Camera size={16} />, "#FCD34D");

    const scheduleWheelRotation = useCallback((delta) => {
        const maxRot = (14 - 1) * 18;
        const current = wheelRotationMV.get();
        wheelRotationMV.set(Math.max(0, Math.min(current + delta, maxRot)));
    }, [wheelRotationMV]);

    useEffect(() => {
        const el = wheelDragRef.current;
        if (!el) return;
        const state = { isDragging: false, pointerId: null, startAngle: 0 };
        const calculateAngle = (clientX, clientY) => {
            const rect = el.getBoundingClientRect();
            const offsetX = isMobileView ? -40 : -100; // Adjusted for new layout
            const centerX = rect.left + offsetX;
            const centerY = rect.top + rect.height / 2;
            return Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
        };
        const handlePointerDown = (e) => {
            state.isDragging = true;
            state.pointerId = e.pointerId;
            state.startAngle = calculateAngle(e.clientX, e.clientY);
            el.setPointerCapture(e.pointerId);
        };
        const handlePointerMove = (e) => {
            if (!state.isDragging) return;
            const currentAngle = calculateAngle(e.clientX, e.clientY);
            let deltaAngle = currentAngle - state.startAngle;
            if (deltaAngle > 180) deltaAngle -= 360;
            if (deltaAngle < -180) deltaAngle += 360;
            state.startAngle = currentAngle;
            if (wheelRafRef.current) cancelAnimationFrame(wheelRafRef.current);
            wheelRafRef.current = requestAnimationFrame(() => scheduleWheelRotation(-deltaAngle * 1.8));
        };
        const handlePointerUp = (e) => {
            state.isDragging = false;
            el.releasePointerCapture(e.pointerId);
        };
        el.addEventListener('pointerdown', handlePointerDown);
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        return () => {
            el.removeEventListener('pointerdown', handlePointerDown);
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
        };
    }, [isMobileView, scheduleWheelRotation]);

    const { hls, error: playerError } = useVideoPlayer(videoRef, { currentSong });

    const PANELS = [
        { icon: <RefreshCcw size={14} />, label: "Rotation", color: "#fbbf24", onClick: toggleROT },
        { icon: <CaptureIcon size={14} />, label: "Capture", color: "#fbbf24", onClick: handleCapture },
        { icon: <Headphones size={14} />, label: "Audio", color: "#22d3ee", onClick: () => setShowSettings(true) },
        { icon: <Sliders size={14} />, label: "Equalizer", color: "#22d3ee", onClick: () => setShowSettings(true) },
        { icon: <ZoomIcon size={14} />, label: "Zoom/Fit", color: "#fbbf24", onClick: () => setAspectRatio('Fill') },
        { icon: <Settings size={14} />, label: "Settings", color: "#94a3b8", onClick: () => setShowSettings(true) },
        { icon: <Monitor size={14} />, label: "Quality", color: "#fbbf24", onClick: () => setShowQualityMenu(true) },
        { icon: <MessageSquare size={14} />, label: "Subtitles", color: "#22d3ee", onClick: () => setShowSettings(true) },
        { icon: <Zap size={14} />, label: "Hardware", color: "#fbbf24", onClick: () => setHwAccel(!hwAccel) },
        { icon: <PictureInPicture size={14} />, label: "PIP", color: "#22d3ee", onClick: () => videoRef.current?.requestPictureInPicture() },
        { icon: isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />, label: "Mute", color: "#22d3ee", onClick: () => setIsMuted(!isMuted) },
        { icon: <SkipForward size={14} />, label: "Next", color: "#fbbf24", onClick: () => next() },
        { icon: <SkipBack size={14} />, label: "Prev", color: "#fbbf24", onClick: () => prev() },
        { icon: <Repeat size={14} />, label: "Loop", color: "#22d3ee", onClick: () => setLoopVideo(!loopVideo) }
    ];

    if (!isLocalPlayerOpen) return null;

    return (
        <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[500] bg-black overflow-hidden flex items-center justify-center">
                <video ref={videoRef} className="w-full h-full object-contain" onClick={() => setShowExtraPanel(!showExtraPanel)} />
                
                <AnimatePresence>
                    {toast && (
                        <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 60, opacity: 1 }} exit={{ opacity: 0 }} className="absolute top-0 left-1/2 -translate-x-1/2 z-[1000] bg-black/80 px-4 py-2 rounded-full flex items-center gap-2 border border-white/10 backdrop-blur-md">
                            <span style={{ color: toast.color }}>{toast.icon}</span>
                            <span className="text-white text-[10px] font-black uppercase tracking-widest">{toast.msg}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {showExtraPanel && (
                        <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="absolute inset-0 z-[150] flex items-center justify-start pointer-events-auto bg-black/20 backdrop-blur-[2px]" onClick={() => setShowExtraPanel(false)}>
                            <div className="relative h-full w-[400px] md:w-[500px] flex items-center justify-start pointer-events-auto group/wheel" onClick={e => e.stopPropagation()}>
                                <div ref={wheelDragRef} className="absolute inset-0 z-[200] cursor-grab active:cursor-grabbing" style={{ touchAction: 'none' }} />
                                
                                {/* JOG WHEEL VISUAL */}
                                <div className="absolute left-[-140px] md:left-[-280px] w-[300px] md:w-[400px] h-[300px] md:h-[400px] flex items-center justify-center pointer-events-none scale-[0.8] md:scale-100 origin-left">
                                    <div className="absolute w-[320px] md:w-[420px] h-[320px] md:h-[420px] rounded-full border-[3px] border-dashed border-yellow-400/60 shadow-[0_0_20px_rgba(250,204,21,0.3)]" />
                                    <div className="absolute right-[15px] top-[50%] translate-y-[-50%] rotate-[-90deg] z-50">
                                        <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[14px] border-t-yellow-300 shadow-[0_0_30px_rgba(253,224,71,0.8)]" />
                                    </div>
                                    <motion.div className="absolute w-[240px] md:w-[340px] h-[240px] md:h-[340px] rounded-full border-[4px] border-cyan-300/70" />
                                </div>

                                {/* PANELS */}
                                <div className={`absolute ${isMobileView ? 'left-[-140px] w-[300px]' : 'left-[-280px] w-[400px]'} h-full flex items-center justify-center pointer-events-none`}>
                                    {PANELS.map((action, i) => (
                                        <JogPanel key={i} action={action} index={i} wheelRotationMV={wheelRotationMV} isMobileView={isMobileView} />
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <button onClick={() => setIsLocalPlayerOpen(false)} className="absolute top-6 left-6 z-[600] p-4 text-white hover:bg-white/10 rounded-full transition-all">
                    <ArrowLeft size={24} />
                </button>
            </motion.div>
        </AnimatePresence>
    );
}
