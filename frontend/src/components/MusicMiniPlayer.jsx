import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, Maximize2, X, Rewind, FastForward, ChevronLeft, ChevronRight, Settings2, SlidersHorizontal, ChevronDown, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMusicPlayer } from '../context/MusicContext';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Mousewheel } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-coverflow';

function formatTime(s) {
  if (!s || isNaN(s)) return '0:00';
  return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
}

const themes = [
  { name: 'Cyberpunk', bg1: '#2B9EAD', bg2: '#4C1D95', bg3: '#094F5C', bg4: '#8B5CF6', bg5: '#1A8A95', bg6: '#EC4899', bg7: '#0D6670', blur1: '#F472B6', blur2: '#2DD4BF' },
  { name: 'Neon Dream', bg1: '#F43F5E', bg2: '#8B5CF6', bg3: '#3B82F6', bg4: '#EC4899', bg5: '#6366F1', bg6: '#14B8A6', bg7: '#0F766E', blur1: '#FCD34D', blur2: '#67E8F9' },
  { name: 'Sunset Vibe', bg1: '#F59E0B', bg2: '#E11D48', bg3: '#4C1D95', bg4: '#FCD34D', bg5: '#F43F5E', bg6: '#9333EA', bg7: '#581C87', blur1: '#FDE047', blur2: '#F472B6' },
  { name: 'Aurora', bg1: '#10B981', bg2: '#3B82F6', bg3: '#1E3A8A', bg4: '#34D399', bg5: '#2563EB', bg6: '#8B5CF6', bg7: '#4C1D95', blur1: '#6EE7B7', blur2: '#A78BFA' },
  { name: 'Dark Void', bg1: '#111827', bg2: '#000000', bg3: '#030712', bg4: '#1F2937', bg5: '#0F172A', bg6: '#1E1B4B', bg7: '#000000', blur1: '#6366F1', blur2: '#EC4899' },
  { name: 'Cosmic', bg1: '#312E81', bg2: '#831843', bg3: '#4C1D95', bg4: '#4F46E5', bg5: '#BE185D', bg6: '#D946EF', bg7: '#1E1B4B', blur1: '#818CF8', blur2: '#F472B6' }
];

// ── SINGLETON IFRAME — never destroyed, always playing ──────────────────────
let _iframe = null;
let _iframeVid = null;

function getIframe(videoId) {
  if (!_iframe) {
    _iframe = document.createElement('iframe');
    _iframe.allow = 'autoplay; encrypted-media; fullscreen';
    _iframe.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:none;';
  }
  if (_iframeVid !== videoId) {
    _iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&enablejsapi=1&origin=${window.location.origin}&rel=0&modestbranding=1&iv_load_policy=3`;
    _iframeVid = videoId;
  }
  return _iframe;
}

function ytCmd(func, args = []) {
  _iframe?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), '*');
}

function moveIframeTo(container) {
  if (_iframe && container && _iframe.parentElement !== container) {
    container.appendChild(_iframe);
  }
}
// ────────────────────────────────────────────────────────────────────────────

export default React.memo(function MusicMiniPlayer() {
  const ctx = useMusicPlayer();
  const swiperRef = useRef(null);
  const cardTargetRef = useRef(null);
  const offscreenRef = useRef(null);
  const [showTopBar, setShowTopBar] = useState(false);
  const [showBottomBar, setShowBottomBar] = useState(false);
  const [themeIdx, setThemeIdx] = useState(0);
  const currentTheme = themes[themeIdx] || themes[0];

  const {
    playlist = [], currentSong = null, currentIdx = 0, isOpen = false,
    isExpanded = false, setIsExpanded = () => { }, playing = false,
    setPlaying = () => { }, volume = 1, setVolume = () => { }, progress = 0,
    currentTime = 0, duration = 0, seek = () => { }, next = () => { },
    prev = () => { }, close = () => { }, playVideo = () => { },
    setCurrentTime = () => { }, audioRef
  } = ctx || {};

  const videoId = useMemo(() => {
    if (!currentSong) return '';
    if (currentSong.youtube_id) return currentSong.youtube_id;
    if (currentSong.video_url?.includes('v=')) return currentSong.video_url.split('v=')[1]?.split('&')[0];
    if (currentSong.video_url?.includes('embed/')) return currentSong.video_url.split('embed/')[1]?.split('?')[0];
    return '';
  }, [currentSong?.id]);

  // Redundant MediaSession logic removed (now handled in MusicContext)

  // ── IMPERATIVE EXPAND / MINIMIZE ─────────────────────────────────────────
  // These are called DIRECTLY on button click — no useEffect timing issues.

  const handleExpand = useCallback(() => {
    setIsExpanded(true);
    // Wait 2 frames: React renders card → ref assigned → we move iframe in
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (videoId && currentSong?.source === 'youtube') {
        moveIframeTo(cardTargetRef.current);
      }
    }));
  }, [videoId, currentSong?.source, setIsExpanded]);

  const handleMinimize = useCallback(() => {
    // Step 1: Move iframe to offscreen BEFORE React unmounts the card
    if (currentSong?.source === 'youtube') {
      moveIframeTo(offscreenRef.current);
    }
    // Step 2: Now collapse
    setIsExpanded(false);
  }, [currentSong?.source, setIsExpanded]);

  const handleClose = useCallback(() => {
    if (currentSong?.source === 'youtube') moveIframeTo(offscreenRef.current);
    close();
  }, [currentSong?.source, close]);

  // When song changes while expanded, move new iframe into card
  useEffect(() => {
    if (!videoId || currentSong?.source !== 'youtube') return;
    const iframe = getIframe(videoId); // creates/updates src only if videoId changed
    if (isExpanded && cardTargetRef.current) {
      requestAnimationFrame(() => moveIframeTo(cardTargetRef.current));
    } else {
      moveIframeTo(offscreenRef.current);
    }
  }, [videoId]);

  // When currentIdx changes (swiper slide), re-seat the iframe
  useEffect(() => {
    if (!isExpanded || !videoId || currentSong?.source !== 'youtube') return;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      moveIframeTo(cardTargetRef.current);
    }));
  }, [currentIdx]);

  // Cleanup on unmount
  useEffect(() => () => moveIframeTo(offscreenRef.current), []);

  // Ensure iframe is created and in offscreen on first load
  useEffect(() => {
    if (videoId && currentSong?.source === 'youtube' && offscreenRef.current) {
      const iframe = getIframe(videoId);
      if (!iframe.parentElement) moveIframeTo(offscreenRef.current);
    }
  }, [isOpen, videoId]);

  // Play/Pause via postMessage for YouTube
  useEffect(() => {
    if (currentSong?.source !== 'youtube') return;
    ytCmd(playing ? 'playVideo' : 'pauseVideo');
  }, [playing, videoId]);

  // Play/Pause via native API for Local Audio
  useEffect(() => {
    if (currentSong?.source === 'youtube' || !audioRef.current) return;
    if (playing) {
      audioRef.current.play().catch(e => console.warn('Audio play blocked:', e));
    } else {
      audioRef.current.pause();
    }
  }, [playing, currentSong]);

  // Swiper sync
  useEffect(() => {
    if (swiperRef.current?.swiper && swiperRef.current.swiper.activeIndex !== currentIdx) {
      swiperRef.current.swiper.slideTo(currentIdx, 600);
    }
  }, [currentIdx]);

  const handleSeek = (targetTime) => {
    const t = Math.max(0, Math.min(duration || 1000, targetTime));
    if (currentSong?.source === 'youtube') ytCmd('seekTo', [t, true]);
    else if (audioRef?.current) audioRef.current.currentTime = t;
    setCurrentTime(t);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if (!isOpen || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'Space') { e.preventDefault(); setPlaying(!playing); }
      if (e.code === 'ArrowRight') { e.preventDefault(); handleSeek(currentTime + 10); }
      if (e.code === 'ArrowLeft') { e.preventDefault(); handleSeek(currentTime - 10); }
      if (e.code === 'ArrowUp') { e.preventDefault(); setVolume(Math.min(1, volume + 0.1)); }
      if (e.code === 'ArrowDown') { e.preventDefault(); setVolume(Math.max(0, volume - 0.1)); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [playing, currentTime, isOpen, volume]);

  // Progress bar via direct DOM — avoids re-renders on every time tick
  const progressBarRef = useRef(null);
  useEffect(() => {
    if (progressBarRef.current) {
      progressBarRef.current.style.width = `${progress}%`;
    }
  }, [progress]);

  if (!ctx || !currentSong || ctx.isLocalPlayerOpen || !isOpen) return null;

  return (
    <>
      {/* Always-present off-screen storage */}
      <div ref={offscreenRef} style={{ position: 'fixed', top: '-9999px', left: '-9999px', width: 1, height: 1, overflow: 'hidden', zIndex: -1, pointerEvents: 'none' }} />

      {/* Local audio */}
      {currentSong?.source !== 'youtube' && (
        <audio
          ref={audioRef}
          src={currentSong?.video_url}
          autoPlay={playing}
          style={{ display: 'none' }}
          onLoadedMetadata={(e) => ctx.setDuration?.(e.target.duration)}
          onTimeUpdate={(e) => ctx.setCurrentTime?.(e.target.currentTime)}
          onEnded={next}
        />
      )}

      {/* ══ EXPANDED PLAYER — individually fixed, no full-screen wrapper ══ */}
      {isExpanded && (
        <div className="fixed inset-0 z-[200] bg-[#050505] flex flex-col items-center justify-center pointer-events-auto select-none overflow-hidden">
          {/* Ambient background */}
          <div className="absolute inset-0 z-0 transition-colors duration-1000" style={{ background: `radial-gradient(ellipse at center, ${currentTheme.bg1} 0%, ${currentTheme.bg2} 50%, ${currentTheme.bg3} 100%)` }}>
            <div className="absolute inset-0 opacity-60 mix-blend-overlay transition-colors duration-1000" style={{ background: `linear-gradient(135deg, ${currentTheme.bg4} 0%, ${currentTheme.bg5} 40%, ${currentTheme.bg6} 70%, ${currentTheme.bg7} 100%)` }} />
            <div className="absolute inset-0 bg-[#041D24]/40" />
            <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] blur-[130px] rounded-full transition-colors duration-1000" style={{ backgroundColor: currentTheme.blur1, opacity: 0.15 }} />
            <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] blur-[130px] rounded-full transition-colors duration-1000" style={{ backgroundColor: currentTheme.blur2, opacity: 0.2 }} />
          </div>

          {/* TOP BAR TOGGLE ICON */}
          <AnimatePresence>
            {!showTopBar && (
              <motion.button 
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => setShowTopBar(true)} 
                className="absolute top-4 left-4 md:left-8 z-[60] w-10 h-10 bg-white/5 backdrop-blur-2xl rounded-full flex items-center justify-center text-white/50 hover:text-white border border-white/10 shadow-2xl"
              >
                <Settings2 className="w-5 h-5" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* TOP BAR */}
          <AnimatePresence>
            {showTopBar && (
              <motion.div 
                initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }}
                className="absolute top-2 md:top-4 w-full flex justify-center z-50 px-2 md:px-10"
              >
                <div className="w-full max-w-[320px] h-12 bg-white/5 backdrop-blur-[30px] border border-white/10 rounded-full flex items-center justify-between px-3 shadow-2xl relative">
                  <button onClick={() => setShowTopBar(false)} className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white/50 hover:text-white backdrop-blur-xl border border-white/10 shadow-lg">
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  <div className="hidden md:flex gap-1">
                    <button className="p-1.5 hover:bg-white/10 rounded-full text-white cursor-pointer outline-none" onClick={prev}><ChevronLeft className="w-4 h-4" /></button>
                    <button className="p-1.5 hover:bg-white/10 rounded-full text-white cursor-pointer outline-none" onClick={next}><ChevronRight className="w-4 h-4" /></button>
                  </div>
                  <span className="text-[11px] font-black uppercase text-white/60 truncate max-w-[120px] mx-auto">{currentSong.title}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setThemeIdx(p => (p + 1) % themes.length)} className="p-1.5 hover:bg-white/10 rounded-full text-white/50 hover:text-white outline-none"><Palette className="w-3.5 h-3.5" /></button>
                    <button onClick={handleMinimize} className="p-1.5 hover:bg-white/10 rounded-full text-white/50 hover:text-white outline-none"><Maximize2 className="w-3.5 h-3.5 rotate-180" /></button>
                    <button onClick={handleClose} className="p-1.5 hover:bg-red-500/20 rounded-full text-red-500/50 hover:text-red-500 outline-none"><X className="w-4 h-4" /></button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* SWIPER CAROUSEL */}
          <div className="relative z-10 w-full">
            <Swiper
              ref={swiperRef}
              effect="coverflow"
              centeredSlides={true}
              slidesPerView="auto"
              initialSlide={currentIdx}
              speed={800}
              touchRatio={1.5}
              mousewheel={{ forceToAxis: true }}
              coverflowEffect={{ rotate: 0, stretch: 0, depth: 100, modifier: 2.5, slideShadows: false }}
              modules={[EffectCoverflow, Mousewheel]}
              onSlideChange={(sw) => playlist[sw.activeIndex] && playVideo(playlist[sw.activeIndex])}
              className="w-full !pb-32 !pt-4 md:!py-20"
            >
              {playlist.map((song, i) => (
                <SwiperSlide key={song.id} className="w-[94vw] md:w-[320px] outline-none select-none">
                  <div className={`relative w-full aspect-[2/3] md:aspect-[4/5] rounded-[2.5rem] md:rounded-[3rem] overflow-hidden shadow-2xl border-2 transition-all duration-1000 bg-black
                    ${currentIdx === i ? 'scale-100 border-white/20' : 'scale-[0.8] opacity-30 grayscale border-white/5'}`}>

                    {/* Thumbnail always visible as fallback — prevents black flash during swipe */}
                    <img src={song.thumbnail_url?.replace('maxresdefault.jpg', 'mqdefault.jpg')} loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover" alt="" />

                    {/* Active slide: iframe teleport target sits on top of thumbnail */}
                    {currentIdx === i && (
                      <div ref={cardTargetRef} className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none" style={{ zIndex: 1 }} />
                    )}

                    {/* Swipe Overlay - capture swipes but don't block everything */}
                    <div className="absolute inset-0 z-[5] bg-transparent" />

                    {/* Text overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent p-10 flex flex-col justify-end pointer-events-none z-10">
                      <h2 className="text-white text-4xl md:text-5xl font-black uppercase italic tracking-tighter leading-tight mb-2 truncate">{song.title}</h2>
                      <p className="text-white/40 text-[10px] font-black uppercase tracking-widest italic">MacFeed Cinematic Audio</p>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          {/* BOTTOM BAR TOGGLE ICON */}
          <AnimatePresence>
            {!showBottomBar && (
              <motion.button 
                initial={{ opacity: 0, scale: 0.8, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8, y: 20 }}
                onClick={() => setShowBottomBar(true)} 
                className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 z-[60] w-14 h-14 bg-white/10 hover:bg-white/20 backdrop-blur-3xl rounded-full flex items-center justify-center text-white border border-white/20 shadow-[0_0_40px_rgba(255,255,255,0.1)] transition-colors"
              >
                <SlidersHorizontal className="w-6 h-6" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* BOTTOM CONTROLS */}
          <AnimatePresence>
            {showBottomBar && (
              <motion.div 
                initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
                className="absolute bottom-2 md:bottom-6 w-full flex justify-center z-50 px-2 md:px-10"
              >
                <div className="w-full max-w-[700px] bg-white/10 backdrop-blur-[50px] border border-white/10 rounded-[2rem] md:rounded-full flex flex-col md:flex-row items-center justify-between p-2 md:px-6 shadow-2xl gap-2 md:gap-0 relative">
                  <button onClick={() => setShowBottomBar(false)} className="absolute -top-3 right-4 md:-top-3 md:right-10 w-8 h-8 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white rounded-full flex items-center justify-center border border-red-500/50 backdrop-blur-md transition-all z-[60]">
                    <X className="w-4 h-4" />
                  </button>
                  {/* Buttons */}
                  <div className="flex items-center gap-1 md:gap-1.5 bg-white/5 p-1 rounded-full border border-white/5 shrink-0">
                    <button onClick={() => handleSeek(currentTime - 10)} className="w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center text-white/50 hover:text-white outline-none"><Rewind className="w-3.5 h-3.5 md:w-4 md:h-4" /></button>
                    <button onClick={prev} className="w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center text-white/50 hover:text-white outline-none"><SkipBack className="w-3.5 h-3.5 md:w-4 md:h-4 fill-current" /></button>
                    <button onClick={() => setPlaying(!playing)} className="w-10 h-10 md:w-12 md:h-12 bg-white text-black rounded-full flex items-center justify-center shadow-xl outline-none hover:scale-105 transition-transform">
                      {playing ? <Pause className="w-4 h-4 md:w-5 md:h-5 fill-current" /> : <Play className="w-4 h-4 md:w-5 md:h-5 fill-current translate-x-0.5" />}
                    </button>
                    <button onClick={next} className="w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center text-white/50 hover:text-white outline-none"><SkipForward className="w-3.5 h-3.5 md:w-4 md:h-4 fill-current" /></button>
                    <button onClick={() => handleSeek(currentTime + 10)} className="w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center text-white/50 hover:text-white outline-none"><FastForward className="w-3.5 h-3.5 md:w-4 md:h-4" /></button>
                  </div>

                  {/* Progress */}
                  <div className="flex-1 flex items-center gap-2 md:gap-3 px-3 md:px-10 w-full min-w-0">
                    <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 border border-white/10">
                      <img src={currentSong?.thumbnail_url?.replace('maxresdefault.jpg', 'mqdefault.jpg')} loading="lazy" decoding="async" className="w-full h-full object-cover" alt="" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black uppercase text-white truncate max-w-[150px] italic">{currentSong?.title}</span>
                        <span className="text-[9px] font-bold text-white/40">{formatTime(currentTime)} / {formatTime(duration)}</span>
                      </div>
                      <div className="relative h-3 flex items-center cursor-pointer" onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        handleSeek(((e.clientX - rect.left) / rect.width) * duration);
                      }}>
                        <div className="w-full h-[3px] bg-white/10 rounded-full overflow-hidden">
                          {/* Direct DOM ref — no re-render on progress tick */}
                          <div ref={progressBarRef}
                            className="h-full rounded-full"
                            style={{ width: `${progress}%`, backgroundColor: '#ef4444', boxShadow: '0 0 15px #ef4444', transition: 'width 0.8s linear' }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Minimize + close handled in Top Bar now, just keeping structure if needed, or removed to save space */}
                  <div className="hidden md:flex w-16" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ══ MINI CAPSULE — individually fixed, isolated from expanded player ══ */}
      {!isExpanded && (
        <motion.div
          drag dragMomentum={false}
          initial={{ x: 24, y: window.innerHeight - 120 }}
          className="fixed z-[300] pointer-events-auto bg-secondary backdrop-blur-3xl border border-primary rounded-[20px] md:rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-2 md:p-4 flex items-center gap-2 md:gap-4 cursor-grab active:cursor-grabbing w-[280px] md:w-[340px] transition-colors duration-500"
          style={{ willChange: 'transform' }}
        >
          <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl overflow-hidden cursor-pointer shadow-xl shrink-0 border border-primary" onClick={handleExpand}>
            <img src={currentSong?.thumbnail_url?.replace('maxresdefault.jpg', 'mqdefault.jpg')} loading="lazy" decoding="async" className="w-full h-full object-cover" alt="" />
          </div>
          <div className="flex-1 min-w-0 cursor-pointer" onClick={handleExpand}>
            <h4 className="text-[11px] font-black uppercase text-primary truncate leading-tight italic">{currentSong?.title}</h4>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex gap-0.5">
                {[8, 12, 8].map((h, i) => (
                  <div key={i} className={`w-0.5 rounded-full ${playing ? 'animate-bounce' : ''}`}
                    style={{ height: h, backgroundColor: 'var(--accent-color)', animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
              <p className="text-[8px] font-black uppercase text-secondary tracking-widest">Now Playing</p>
            </div>
          </div>
          <div className="flex gap-1 md:gap-2 shrink-0">
            <button onClick={(e) => { e.stopPropagation(); setPlaying(!playing); }}
              className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/5 border border-primary flex items-center justify-center text-primary hover:bg-accent hover:text-white transition-all outline-none">
              {playing ? <Pause className="w-3.5 h-3.5 md:w-4 md:h-4 fill-current" /> : <Play className="w-3.5 h-3.5 md:w-4 md:h-4 fill-current translate-x-0.5" />}
            </button>
            <button onClick={(e) => { e.stopPropagation(); handleClose(); }}
              className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/5 border border-primary flex items-center justify-center text-secondary hover:text-red-500 transition-all outline-none">
              <X className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </>
  );
});
