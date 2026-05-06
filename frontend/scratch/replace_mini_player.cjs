const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../src/components/MusicMiniPlayer.jsx');

const newContent = `import React, { useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  ChevronDown,
  Maximize2,
  X,
  ListMusic,
  MoreHorizontal,
  MessageSquare,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMusicPlayer } from '../context/MusicContext';

// Swiper
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-coverflow';

function formatTime(s) {
  if (!s || isNaN(s)) return '0:00';
  return \`\${Math.floor(s / 60)}:\${Math.floor(s % 60)
    .toString()
    .padStart(2, '0')}\`;
}

export default function MusicMiniPlayer() {
  const ctx = useMusicPlayer();
  const iframeRef = useRef(null);
  const swiperRef = useRef(null);

  const {
    playlist = [],
    currentSong = null,
    currentIdx = 0,
    isOpen = false,
    isExpanded = false,
    setIsExpanded = () => {},
    playing = false,
    setPlaying = () => {},
    volume = 1,
    setVolume = () => {},
    muted = false,
    setMuted = () => {},
    progress = 0,
    currentTime = 0,
    duration = 0,
    seek = () => {},
    next = () => {},
    prev = () => {},
    close = () => {},
    playVideo = () => {}
  } = ctx || {};

  const getYoutubeId = (song) => {
    if (!song) return '';
    if (song.youtube_id) return song.youtube_id;
    if (song.video_url?.includes('v=')) return song.video_url.split('v=')[1]?.split('&')[0];
    if (song.video_url?.includes('embed/')) return song.video_url.split('embed/')[1]?.split('?')[0];
    return '';
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && isOpen) {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          setPlaying(!playing);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playing, isOpen, setPlaying]);

  useEffect(() => {
    if (currentSong?.source === 'youtube' && iframeRef.current) {
      const command = playing ? 'playVideo' : 'pauseVideo';
      iframeRef.current.contentWindow?.postMessage(
        JSON.stringify({
          event: 'command',
          func: command,
          args: [],
        }),
        '*'
      );
    }
  }, [playing, currentSong, isOpen]);

  useEffect(() => {
    let interval;
    if (playing && currentSong?.source === 'youtube' && isOpen) {
      interval = setInterval(() => {
        ctx?.handleTimeUpdate();
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [playing, currentSong, isOpen, ctx]);

  // Sync Swiper with currentIdx
  useEffect(() => {
    if (swiperRef.current && swiperRef.current.swiper) {
      if (swiperRef.current.swiper.activeIndex !== currentIdx) {
        swiperRef.current.swiper.slideTo(currentIdx);
      }
    }
  }, [currentIdx, isExpanded]);

  if (!ctx || !isOpen || !currentSong) return null;

  return (
    <div
      className={\`fixed z-[100] transition-all duration-700 ease-in-out \${
        isExpanded ? 'inset-0 overflow-hidden bg-[#050505]' : 'bottom-4 left-4 w-80'
      }\`}
    >
      {/* ── FULLSCREEN PLAYER (IMAGE STYLE) ── */}
      {isExpanded && (
        <div className="relative w-full h-full flex flex-col items-center justify-center font-sans overflow-hidden">
          
          {/* Background Blur Image */}
          <motion.div 
            key={currentSong?.id}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 z-0 pointer-events-none"
          >
            <img 
              src={currentSong?.thumbnail_url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745'} 
              className="w-full h-full object-cover blur-[100px] scale-150 opacity-80 saturate-[1.2]"
              alt=""
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/30" />
          </motion.div>

          {/* Top Bar Navigation */}
          <div className="absolute top-0 w-full px-4 sm:px-10 py-8 z-50 flex justify-between items-center">
            <button onClick={() => setIsExpanded(false)} className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center text-white transition-all shadow-lg border border-white/5">
              <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <div className="flex bg-white/5 backdrop-blur-2xl rounded-full p-1 border border-white/10 shadow-xl">
               <button className="px-6 sm:px-10 py-2 sm:py-2.5 rounded-full bg-white/15 text-white font-bold text-xs sm:text-sm shadow-md border border-white/10 backdrop-blur-md">Now Playing</button>
               <button className="px-6 sm:px-10 py-2 sm:py-2.5 rounded-full text-white/50 hover:text-white font-bold text-xs sm:text-sm transition-all" onClick={() => setIsExpanded(false)}>Hide</button>
            </div>
            <button onClick={close} className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 hover:bg-red-500/50 backdrop-blur-xl rounded-full flex items-center justify-center text-white transition-all shadow-lg border border-white/5">
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Main Coverflow Slider */}
          <div className="relative z-10 w-full max-w-[1400px] h-[55vh] flex items-center justify-center mt-[-10vh] md:mt-[-5vh]">
            <Swiper
              ref={swiperRef}
              effect={'coverflow'}
              grabCursor={true}
              centeredSlides={true}
              slidesPerView={'auto'}
              initialSlide={currentIdx}
              coverflowEffect={{
                rotate: 0,
                stretch: 60,
                depth: 300,
                modifier: 1,
                slideShadows: true,
              }}
              modules={[EffectCoverflow]}
              onSlideChange={(swiper) => {
                 if (swiper.activeIndex !== currentIdx && playlist[swiper.activeIndex]) {
                     playVideo(playlist[swiper.activeIndex]);
                 }
              }}
              className="w-full !py-10"
            >
              {playlist.map((song, i) => (
                <SwiperSlide key={\`\${song.id}-\${i}\`} className="w-[280px] sm:w-[320px] md:w-[450px] transition-all duration-300">
                  <div 
                    className={\`relative w-full aspect-square rounded-[36px] overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.8)] transition-all duration-500 border border-white/10 bg-black/40 \${currentIdx === i ? 'scale-100 ring-2 ring-white/10' : 'scale-95 opacity-40'}\`}
                    onClick={() => {
                      if (currentIdx === i) setPlaying(!playing);
                      else if (swiperRef.current) swiperRef.current.swiper.slideTo(i);
                    }}
                  >
                    {/* Active Slide renders actual Video, others render image */}
                    {(currentIdx === i && isExpanded) ? (
                      song.source === 'youtube' ? (
                        <iframe
                          ref={iframeRef}
                          src={\`https://www.youtube.com/embed/\${getYoutubeId(song)}?autoplay=1&controls=0&modestbranding=1&rel=0&enablejsapi=1\`}
                          className="w-full h-full object-cover scale-105 pointer-events-none"
                          allow="autoplay; encrypted-media"
                        />
                      ) : (
                        <video
                          src={song.video_url}
                          autoPlay={playing}
                          className="w-full h-full object-cover pointer-events-none"
                          onTimeUpdate={ctx?.handleTimeUpdate}
                        />
                      )
                    ) : (
                       <img src={song.thumbnail_url} className="w-full h-full object-cover" alt="" />
                    )}
                    
                    {/* Text Gradient Overlay */}
                    <div className="absolute bottom-0 inset-x-0 h-[45%] bg-gradient-to-t from-black via-black/60 to-transparent p-6 sm:p-8 flex flex-col justify-end text-center pointer-events-none">
                      <h2 className="text-white text-2xl sm:text-3xl md:text-4xl font-bold truncate drop-shadow-2xl">{song.title}</h2>
                      <p className="text-white/60 text-xs sm:text-sm font-semibold mt-1 truncate drop-shadow-md">MacFeed Audio</p>
                    </div>

                    {/* Play Overlay if active but not playing */}
                    {currentIdx === i && !playing && (
                      <div className="absolute inset-0 bg-black/10 flex items-center justify-center transition-opacity duration-300 pointer-events-none">
                         <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/20 shadow-2xl">
                           <Play className="w-10 h-10 fill-white text-white translate-x-1" />
                         </div>
                      </div>
                    )}
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          {/* Glassmorphic Control Bar */}
          <div className="absolute bottom-8 sm:bottom-12 z-50 w-[92%] max-w-5xl mx-auto h-[100px] sm:h-[120px] bg-white/[0.08] backdrop-blur-[40px] border border-white/10 rounded-[40px] px-6 sm:px-10 flex items-center justify-between shadow-[0_40px_100px_rgba(0,0,0,0.5)] overflow-hidden">
             {/* Background Progress Line */}
             <div 
               className="absolute left-0 bottom-0 h-1 sm:h-1.5 bg-gradient-to-r from-white to-white/70 shadow-[0_0_20px_rgba(255,255,255,1)] transition-all duration-300 cursor-pointer"
               style={{ width: \`\${progress}%\` }}
             />

             {/* Left Controls (Prev, Play, Next) */}
             <div className="flex items-center gap-4 sm:gap-8">
               <button onClick={prev} className="text-white/50 hover:text-white transition-all hover:scale-110 active:scale-95">
                 <SkipBack className="w-6 h-6 sm:w-8 sm:h-8" fill="currentColor" />
               </button>
               <button onClick={() => setPlaying(!playing)} className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white flex items-center justify-center shadow-2xl hover:scale-105 transition-all active:scale-95">
                 {playing ? <Pause className="w-6 h-6 sm:w-8 sm:h-8 fill-white" /> : <Play className="w-6 h-6 sm:w-8 sm:h-8 fill-white translate-x-1" />}
               </button>
               <button onClick={next} className="text-white/50 hover:text-white transition-all hover:scale-110 active:scale-95">
                 <SkipForward className="w-6 h-6 sm:w-8 sm:h-8" fill="currentColor" />
               </button>
             </div>

             {/* Center Info (Thumbnail, Title, Soundwave, Time) */}
             <div className="hidden md:flex flex-1 mx-12 items-center justify-center gap-5 border-x border-white/5 px-10">
               <img src={currentSong?.thumbnail_url} className="w-16 h-16 rounded-2xl object-cover shadow-2xl border border-white/10" alt="" />
               <div className="min-w-0 flex-1 max-w-[200px]">
                 <h3 className="text-white font-bold text-lg truncate leading-tight">{currentSong?.title || 'No Audio'}</h3>
                 <div className="flex items-center gap-2 mt-1">
                   <p className="text-white/50 text-xs font-medium">{formatTime(currentTime)} / {formatTime(duration)}</p>
                 </div>
               </div>
               
               <div className="flex items-center gap-3">
                 {/* Visualizer */}
                 <div className="flex items-end gap-[3px] h-6">
                   {[1, 2, 3, 4, 5].map(i => (
                     <motion.div
                       key={i}
                       animate={{ height: playing ? ['20%', '100%', '20%'] : '20%' }}
                       transition={{ repeat: Infinity, duration: 0.4 + i * 0.15, ease: 'easeInOut' }}
                       className="w-1.5 bg-white/80 rounded-full"
                     />
                   ))}
                 </div>
                 <button className="text-white/40 hover:text-white ml-2 transition">
                   <MoreHorizontal className="w-5 h-5" />
                 </button>
               </div>
             </div>

             {/* Mobile Center Info */}
             <div className="md:hidden flex-1 mx-4 flex flex-col items-center min-w-0">
                 <h3 className="text-white font-bold text-sm truncate w-full text-center">{currentSong?.title}</h3>
                 <p className="text-white/40 text-[10px] truncate w-full text-center mt-0.5">{formatTime(currentTime)} / {formatTime(duration)}</p>
             </div>

             {/* Right Controls */}
             <div className="flex items-center gap-5 sm:gap-8 text-white/50">
               <button className="hover:text-white transition-all hover:scale-110">
                 <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
               </button>
               <button className="hover:text-white transition-all hover:scale-110">
                 <ListMusic className="w-5 h-5 sm:w-6 sm:h-6" />
               </button>
               
               {/* Volume Control */}
               <div className="group relative flex items-center">
                 <button onClick={() => setMuted(!muted)} className="hover:text-white transition-all hover:scale-110">
                   {muted || volume === 0 ? <VolumeX className="w-5 h-5 sm:w-6 sm:h-6" /> : <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />}
                 </button>
                 <div className="absolute bottom-full right-0 mb-4 bg-black/95 backdrop-blur-2xl p-2 rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100 flex flex-col items-center pointer-events-none group-hover:pointer-events-auto">
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={muted ? 0 : volume}
                      onChange={(e) => setVolume(Number(e.target.value))}
                      className="h-24 accent-white"
                      style={{ appearance: 'slider-vertical' }}
                    />
                 </div>
               </div>
             </div>
          </div>
        </div>
      )}

      {/* ── MINI PLAYER (Stays the same) ── */}
      {!isExpanded && (
        <motion.div
          drag
          dragMomentum={false}
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-[#0a0a0a]/95 backdrop-blur-3xl border border-white/5 rounded-[24px] shadow-2xl p-3 cursor-move active:scale-[0.98] transition-all"
        >
          <div className={\`fixed opacity-0 pointer-events-none\`}>
            {currentSong.source === 'youtube' ? (
              <iframe
                ref={iframeRef}
                src={\`https://www.youtube.com/embed/\${getYoutubeId(currentSong)}?autoplay=1&controls=0&enablejsapi=1&origin=\${window.location.origin}\`}
              />
            ) : (
              <video
                src={currentSong.video_url}
                autoPlay={playing}
                onTimeUpdate={ctx?.handleTimeUpdate}
              />
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-xl border border-white/5 cursor-pointer" onClick={() => setIsExpanded(true)}>
              <img src={currentSong.thumbnail_url} className="w-full h-full object-cover" alt="" />
            </div>
            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setIsExpanded(true)}>
              <h4 className="text-white font-bold text-[9px] truncate leading-tight">
                {currentSong.title}
              </h4>
              <p className="text-white/20 text-[7px] uppercase font-black tracking-widest mt-0.5">
                Playing
              </p>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setPlaying(!playing)}
                className="text-white p-2 bg-white/5 border border-white/5 rounded-full hover:bg-white/10 transition"
              >
                {playing ? (
                  <Pause className="w-3 h-3 fill-white" />
                ) : (
                  <Play className="w-3 h-3 fill-white translate-x-0.5" />
                )}
              </button>
              <button
                onClick={() => setIsExpanded(true)}
                className="text-white/20 hover:text-white p-2 bg-white/5 border border-white/5 rounded-full transition"
              >
                <Maximize2 className="w-3 h-3" />
              </button>
              <button
                onClick={close}
                className="text-white/20 hover:text-red-500 p-2 bg-white/5 border border-white/5 rounded-full transition"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
\`;

fs.writeFileSync(targetPath, newContent);
console.log('MusicMiniPlayer.jsx rewritten successfully');
