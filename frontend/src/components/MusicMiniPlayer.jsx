import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, Maximize2, X, Rewind, FastForward, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMusicPlayer } from '../context/MusicContext';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Mousewheel } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-coverflow';

function formatTime(s) {
  if (!s || isNaN(s)) return '0:00';
  return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
}

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

export default function MusicMiniPlayer() {
  const ctx = useMusicPlayer();
  const swiperRef = useRef(null);
  const cardTargetRef = useRef(null);
  const offscreenRef = useRef(null);

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

  // Play/Pause via postMessage
  useEffect(() => {
    if (currentSong?.source !== 'youtube') return;
    ytCmd(playing ? 'playVideo' : 'pauseVideo');
  }, [playing, videoId]);

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
        <video
          ref={audioRef}
          autoPlay={playing}
          style={{ display: 'none' }}
          onLoadedMetadata={(e) => ctx.setDuration?.(e.target.duration)}
          onTimeUpdate={(e) => ctx.setCurrentTime?.(e.target.currentTime)}
          onEnded={next}
        >
          <source src={currentSong?.video_url} type="audio/mpeg" />
          <source src={currentSong?.video_url} type="audio/wav" />
          <source src={currentSong?.video_url} type="audio/flac" />
          <source src={currentSong?.video_url} type="audio/aac" />
          <source src={currentSong?.video_url} type="audio/ogg" />
          <source src={currentSong?.video_url} type="audio/mp4" />
          <source src={currentSong?.video_url} type="video/mp4" />
        </video>
      )}

      {/* ══ EXPANDED PLAYER — individually fixed, no full-screen wrapper ══ */}
      {isExpanded && (
        <div className="fixed inset-0 z-[200] bg-[#050505] flex flex-col items-center justify-center pointer-events-auto select-none overflow-hidden">
          {/* Ambient background */}
          <div className="absolute inset-0 z-0" style={{ background: 'radial-gradient(ellipse at center, #2B9EAD 0%, #0D6B7A 50%, #094F5C 100%)' }}>
            <div className="absolute inset-0 opacity-60 mix-blend-overlay" style={{ background: 'linear-gradient(135deg, #0A5C6B 0%, #1A8A95 40%, #2BA8B5 70%, #0D6670 100%)' }} />
            <div className="absolute inset-0 bg-[#041D24]/40" />
          </div>

          {/* TOP BAR */}
          <div className="absolute top-4 md:top-10 w-full flex justify-center z-50 px-2 md:px-10">
            <div className="w-full max-w-4xl h-12 bg-white/5 backdrop-blur-[30px] border border-white/10 rounded-full flex items-center justify-between px-6 shadow-2xl">
              <div className="hidden md:flex gap-1">
                <button className="p-2 hover:bg-white/10 rounded-full text-white cursor-pointer outline-none" onClick={prev}><ChevronLeft className="w-5 h-5" /></button>
                <button className="p-2 hover:bg-white/10 rounded-full text-white cursor-pointer outline-none" onClick={next}><ChevronRight className="w-5 h-5" /></button>
              </div>
              <span className="text-[11px] font-black uppercase text-white/60 truncate max-w-[200px] mx-auto">{currentSong.title}</span>
              <div className="flex items-center gap-2">
                <button onClick={handleMinimize} className="p-2 hover:bg-white/10 rounded-full text-white/50 outline-none"><Maximize2 className="w-4 h-4 rotate-180" /></button>
                <button onClick={handleClose} className="p-2 hover:bg-white/10 rounded-full text-white/50 hover:text-white outline-none"><X className="w-4 h-4" /></button>
              </div>
            </div>
          </div>

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
              className="w-full !py-2 md:!py-20"
            >
              {playlist.map((song, i) => (
                <SwiperSlide key={song.id} className="w-[94vw] md:w-[380px] outline-none select-none">
                  <div className={`relative w-full aspect-[1/1.36] md:aspect-[1/1.02] rounded-[2.5rem] md:rounded-[3rem] overflow-hidden shadow-2xl border-2 transition-all duration-1000 bg-black
                    ${currentIdx === i ? 'scale-100 border-white/20' : 'scale-[0.8] opacity-30 grayscale border-white/5'}`}>

                    {/* Thumbnail always visible as fallback — prevents black flash during swipe */}
                    <img src={song.thumbnail_url} className="absolute inset-0 w-full h-full object-cover" alt="" />

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

          {/* BOTTOM CONTROLS */}
          <div className="absolute bottom-4 md:bottom-12 w-full flex justify-center z-50 px-2 md:px-10">
            <div className="w-full max-w-4xl bg-white/10 backdrop-blur-[50px] border border-white/10 rounded-[2.5rem] md:rounded-full flex flex-col md:flex-row items-center justify-between p-5 md:px-8 shadow-2xl gap-5 md:gap-0">
              {/* Buttons */}
              <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-full border border-white/5">
                <button onClick={() => handleSeek(currentTime - 10)} className="w-11 h-11 rounded-full flex items-center justify-center text-white/50 hover:text-white outline-none"><Rewind className="w-5 h-5" /></button>
                <button onClick={prev} className="w-11 h-11 rounded-full flex items-center justify-center text-white/50 hover:text-white outline-none"><SkipBack className="w-5 h-5 fill-current" /></button>
                <button onClick={() => setPlaying(!playing)} className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center shadow-xl outline-none hover:scale-105 transition-transform">
                  {playing ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current translate-x-1" />}
                </button>
                <button onClick={next} className="w-11 h-11 rounded-full flex items-center justify-center text-white/50 hover:text-white outline-none"><SkipForward className="w-5 h-5 fill-current" /></button>
                <button onClick={() => handleSeek(currentTime + 10)} className="w-11 h-11 rounded-full flex items-center justify-center text-white/50 hover:text-white outline-none"><FastForward className="w-5 h-5" /></button>
              </div>

              {/* Progress */}
              <div className="flex-1 flex items-center gap-4 px-8 md:px-16 w-full">
                <div className="w-11 h-11 rounded-2xl overflow-hidden shrink-0 border border-white/10">
                  <img src={currentSong?.thumbnail_url} className="w-full h-full object-cover" alt="" />
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
                        style={{ width: `${progress}%`, backgroundColor: 'var(--accent-color)', boxShadow: '0 0 15px var(--accent-color)', transition: 'width 0.8s linear' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Minimize + close */}
              <div className="hidden md:flex items-center gap-2 bg-white/5 p-1.5 rounded-full border border-white/5">
                <button onClick={handleMinimize} className="w-10 h-10 rounded-full flex items-center justify-center text-white/40 hover:text-white outline-none"><Maximize2 className="w-4 h-4 rotate-180" /></button>
                <button onClick={handleClose} className="w-10 h-10 rounded-full flex items-center justify-center text-white/40 hover:text-red-500 outline-none"><X className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
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
            <img src={currentSong?.thumbnail_url} className="w-full h-full object-cover" alt="" />
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
}
