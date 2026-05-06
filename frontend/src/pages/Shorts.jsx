import React, { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import Loader from '../components/Loader';
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  ChevronUp,
  ChevronDown,
  Play,
  Pause,
  VolumeX,
  Volume2,
  Eye,
  Music,
  MoreHorizontal,
  Check,
  Copy,
  X,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

function formatViews(n) {
  if (!n) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

function formatTime(s) {
  if (!s || isNaN(s)) return '0:00';
  return `${Math.floor(s / 60)}:${Math.floor(s % 60)
    .toString()
    .padStart(2, '0')}`;
}

// ── Single Short Player Card ──
function ShortPlayer({ video, isActive, onLike }) {
  const videoRef = useRef();
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(video?.likes || 0);
  const [saved, setSaved] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showHeart, setShowHeart] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const lastTap = useRef(0);

  useEffect(() => {
    const likedShorts = JSON.parse(localStorage.getItem('macfeed_short_likes') || '{}');
    setLiked(!!likedShorts[video?.id]);
  }, [video?.id]);

  useEffect(() => {
    if (!videoRef.current) return;
    if (isActive) {
      videoRef.current.currentTime = 0;
      videoRef.current
        .play()
        .then(() => setPlaying(true))
        .catch(() => {});
    } else {
      videoRef.current.pause();
      setPlaying(false);
    }
  }, [isActive]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  const handleTimeUpdate = () => {
    const vid = videoRef.current;
    if (!vid?.duration) return;
    setCurrentTime(vid.currentTime);
    setDuration(vid.duration);
    setProgress((vid.currentTime / vid.duration) * 100);
  };

  const handleSeek = (e) => {
    e.stopPropagation();
    const vid = videoRef.current;
    if (!vid?.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    vid.currentTime = ((e.clientX - rect.left) / rect.width) * vid.duration;
  };

  const togglePlay = (e) => {
    e.stopPropagation();
    if (playing) {
      videoRef.current?.pause();
      setPlaying(false);
    } else {
      videoRef.current?.play();
      setPlaying(true);
    }
  };

  const handleDoubleTap = (e) => {
    const now = Date.now();
    if (now - lastTap.current < 350) {
      if (!liked) doLike();
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 800);
    } else {
      togglePlay(e);
    }
    lastTap.current = now;
  };

  const doLike = () => {
    if (liked) return;
    setLiked(true);
    setLikes((l) => l + 1);
    onLike?.();
    const likedShorts = JSON.parse(localStorage.getItem('macfeed_short_likes') || '{}');
    likedShorts[video.id] = true;
    localStorage.setItem('macfeed_short_likes', JSON.stringify(likedShorts));
    supabase
      .from('videos')
      .update({ likes: (video.likes || 0) + 1 })
      .eq('id', video.id);
  };

  const handleLike = (e) => {
    e.stopPropagation();
    doLike();
  };

  const handleShare = async (e) => {
    e.stopPropagation();
    const url = `${window.location.origin}/shorts?play=${video.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: video.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setShareToast(true);
        setTimeout(() => setShareToast(false), 2000);
      }
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        setShareToast(true);
        setTimeout(() => setShareToast(false), 2000);
      } catch {}
    }
  };

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
      <video
        ref={videoRef}
        src={video.video_url}
        poster={video.thumbnail_url}
        loop
        playsInline
        muted={muted}
        className="w-full h-auto object-cover"
        style={{ width: '100%', height: 'auto' }}
        onClick={handleDoubleTap}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={(e) => setDuration(e.target.duration)}
        onError={() => {}}
      />

      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/80 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent pointer-events-none" />

      <AnimatePresence>
        {showHeart && (
          <motion.div
            key="heart"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1.3, opacity: 1 }}
            exit={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
          >
            <Heart className="w-24 h-24 text-pink-500 fill-pink-500 drop-shadow-2xl" />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!playing && isActive && (
          <motion.div
            key="pause"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.8 }}
            exit={{ scale: 1.5, opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
          >
            <div className="bg-black/40 backdrop-blur-sm rounded-full p-5 border border-white/10">
              <Play className="w-12 h-12 text-white fill-white" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {shareToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-green-600 text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-lg"
          >
            <Check className="w-3 h-3" /> Copied!
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute right-3 bottom-36 flex flex-col gap-5 items-center z-10">
        <div className="relative mb-2">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-yellow-500 p-[2px]">
            <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
              {video.thumbnail_url ? (
                <img src={video.thumbnail_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <Music className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </div>
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-pink-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow border-2 border-black">
            +
          </div>
        </div>

        <button
          onClick={handleLike}
          className={`flex flex-col items-center gap-1 transition-all active:scale-125 ${liked ? 'text-pink-500' : 'text-white'}`}
        >
          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-all ${
              liked ? 'bg-pink-500/20 backdrop-blur' : 'bg-black/40 backdrop-blur'
            }`}
          >
            <Heart className={`w-6 h-6 transition-all ${liked ? 'fill-pink-500 scale-110' : ''}`} />
          </div>
          <span className="text-[11px] font-semibold">{formatViews(likes)}</span>
        </button>

        <button className="flex flex-col items-center gap-1 text-white">
          <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur flex items-center justify-center shadow-lg">
            <MessageCircle className="w-5 h-5" />
          </div>
          <span className="text-[11px]">0</span>
        </button>

        <button onClick={handleShare} className="flex flex-col items-center gap-1 text-white">
          <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur flex items-center justify-center shadow-lg hover:bg-white/20 transition">
            <Share2 className="w-5 h-5" />
          </div>
          <span className="text-[11px]">Share</span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setSaved((s) => !s);
          }}
          className={`flex flex-col items-center gap-1 transition ${saved ? 'text-yellow-400' : 'text-white'}`}
        >
          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition ${
              saved ? 'bg-yellow-400/20 backdrop-blur' : 'bg-black/40 backdrop-blur'
            }`}
          >
            <Bookmark className={`w-5 h-5 ${saved ? 'fill-yellow-400' : ''}`} />
          </div>
          <span className="text-[11px]">{saved ? 'Saved' : 'Save'}</span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setMuted((m) => !m);
          }}
          className="flex flex-col items-center gap-1 text-white"
        >
          <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur flex items-center justify-center shadow-lg hover:bg-white/20 transition">
            {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </div>
          <span className="text-[11px]">{muted ? 'Unmute' : 'Mute'}</span>
        </button>

        <div className="flex flex-col items-center gap-1 text-white/60">
          <div className="w-11 h-11 rounded-full bg-black/30 flex items-center justify-center">
            <Eye className="w-4 h-4" />
          </div>
          <span className="text-[10px]">{formatViews(video.views)}</span>
        </div>
      </div>

      <div className="absolute bottom-14 left-4 right-20 z-10">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-white font-bold text-sm">@MacFeed</span>
          <span className="text-[10px] text-white/50 bg-white/10 px-1.5 py-0.5 rounded">
            Creator
          </span>
        </div>
        <h3 className="text-white font-bold text-base mb-1.5 leading-tight line-clamp-2 drop-shadow-lg">
          {video.title}
        </h3>
        {video.description && (
          <p className="text-white/70 text-xs line-clamp-2 mb-2">{video.description}</p>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="bg-white/15 backdrop-blur text-white text-xs px-2.5 py-1 rounded-full font-medium">
            #{video.category}
          </span>
          {video.tags &&
            (Array.isArray(video.tags) ? video.tags : String(video.tags).split(','))
              .slice(0, 2)
              .map((tag, i) => (
                <span
                  key={i}
                  className="bg-white/10 text-white/70 text-xs px-2 py-0.5 rounded-full"
                >
                  #{tag.toString().trim()}
                </span>
              ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-20">
        <div className="w-full h-1 cursor-pointer group" onClick={handleSeek}>
          <div className="relative w-full h-full bg-white/20">
            <div
              className="absolute h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition"
              style={{ left: `calc(${progress}% - 6px)` }}
            />
          </div>
        </div>
        <div className="flex justify-between px-3 py-1 bg-black/50">
          <span className="text-[9px] text-white/50 font-mono">{formatTime(currentTime)}</span>
          <span className="text-[9px] text-white/50 font-mono">{formatTime(duration)}</span>
        </div>
      </div>

      {video.duration && (
        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur text-white text-xs px-2 py-0.5 rounded-full font-mono z-10">
          {video.duration}
        </div>
      )}

      <div className="absolute top-4 left-14 z-10 flex items-center gap-1.5 opacity-60 pointer-events-none">
        <img src="/macfeed-logo.png" alt="" className="w-4 h-4 object-contain" />
        <span className="text-white text-[10px] font-bold tracking-wider">MacFeed Shorts</span>
      </div>
    </div>
  );
}

export default function Shorts() {
  const [shorts, setShorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const containerRef = useRef();
  const touchStartY = useRef(null);

  // Check if we are in Swiper Player mode by checking URL parameters
  const playId = new URLSearchParams(location.search).get('play');

  useEffect(() => {
    async function getShorts() {
      const start = Date.now();
      const { data } = await supabase
        .from('videos')
        .select('*')
        .eq('category', 'Shorts')
        .order('created_at', { ascending: false });
      setShorts(data || []);

      if (data && playId) {
        const idx = data.findIndex((s) => s.id === playId);
        if (idx !== -1) setCurrentIdx(idx);
      }

      const end = Date.now();
      const diff = end - start;
      setLoading(false);
      
    }
    getShorts();
  }, [playId]);

  const goNext = useCallback(
    () => setCurrentIdx((i) => Math.min(i + 1, shorts.length - 1)),
    [shorts.length]
  );
  const goPrev = useCallback(() => setCurrentIdx((i) => Math.max(i - 1, 0)), []);

  // Keyboard navigation for Swiper
  useEffect(() => {
    if (!playId) return;
    const handleKey = (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      }
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      }
      if (e.key === 'Escape') navigate('/shorts'); // exit swiper to grid
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [playId, goNext, goPrev, navigate]);

  // Touch swipe support for Swiper
  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e) => {
    if (touchStartY.current === null || !playId) return;
    const delta = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(delta) > 50) {
      delta > 0 ? goNext() : goPrev();
    }
    touchStartY.current = null;
  };

  // Scroll wheel for Swiper
  const wheelCooldown = useRef(false);
  const handleWheel = useCallback(
    (e) => {
      if (!playId) return; // Only prevent default and capture scroll in swiper mode
      e.preventDefault();
      if (wheelCooldown.current) return;
      if (e.deltaY > 30) {
        goNext();
        wheelCooldown.current = true;
      } else if (e.deltaY < -30) {
        goPrev();
        wheelCooldown.current = true;
      }
      setTimeout(() => {
        wheelCooldown.current = false;
      }, 400);
    },
    [playId, goNext, goPrev]
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !playId) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel, playId]);

  // Handle URL sync if currentIdx changes during Swiper playback
  useEffect(() => {
    if (playId && shorts[currentIdx]) {
      if (shorts[currentIdx].id !== playId) {
        navigate(`/shorts?play=${shorts[currentIdx].id}`, { replace: true });
      }
    }
  }, [currentIdx, playId, shorts, navigate]);

  if (loading) return <Loader />;

  // ── SWIPER PLAYER VIEW ──
  if (playId) {
    if (!shorts.length) return null;
    return (
      <div
        ref={containerRef}
        className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <button
          onClick={() => navigate('/shorts')}
          className="absolute top-4 left-4 z-50 flex items-center gap-2 bg-black/50 backdrop-blur-md text-white px-4 py-2 rounded-full hover:bg-black/80 transition border border-white/10"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium hidden sm:inline">Back to Gallery</span>
        </button>

        <div className="absolute top-4 right-4 z-50 bg-black/50 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full border border-white/10 font-mono">
          {currentIdx + 1} / {shorts.length}
        </div>

        <div className="absolute right-3 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2 sm:right-4">
          <button
            onClick={goPrev}
            disabled={currentIdx === 0}
            className="bg-black/50 backdrop-blur-md text-white p-2.5 rounded-full hover:bg-purple-600 transition disabled:opacity-20 disabled:hover:bg-black/50 border border-white/10"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
          <button
            onClick={goNext}
            disabled={currentIdx === shorts.length - 1}
            className="bg-black/50 backdrop-blur-md text-white p-2.5 rounded-full hover:bg-purple-600 transition disabled:opacity-20 disabled:hover:bg-black/50 border border-white/10"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>

        <div className="absolute left-2 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-1.5 max-h-[60vh] overflow-hidden hidden sm:flex">
          {shorts
            .slice(Math.max(0, currentIdx - 4), Math.min(shorts.length, currentIdx + 5))
            .map((_, i) => {
              const realIdx = Math.max(0, currentIdx - 4) + i;
              return (
                <button
                  key={realIdx}
                  onClick={() => setCurrentIdx(realIdx)}
                  className={`rounded-full transition-all duration-300 ${
                    realIdx === currentIdx
                      ? 'w-2 h-7 bg-gradient-to-b from-purple-500 to-pink-500'
                      : 'w-1.5 h-1.5 bg-white/30 hover:bg-white/60'
                  }`}
                />
              );
            })}
        </div>

        <div className="w-full h-full max-w-[420px] mx-auto relative bg-black">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={shorts[currentIdx]?.id}
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -80, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="absolute inset-0"
            >
              {shorts[currentIdx] && (
                <ShortPlayer video={shorts[currentIdx]} isActive={true} onLike={() => {}} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white/20 text-[10px] z-50 hidden sm:flex items-center gap-3">
          <span>↑↓ Navigate</span>
          <span className="w-px h-3 bg-white/10" />
          <span>Double-tap ❤️</span>
          <span className="w-px h-3 bg-white/10" />
          <span>ESC Exit</span>
        </div>
      </div>
    );
  }

  // ── GRID GALLERY VIEW ──
  return (
    <div className="min-h-screen bg-primary text-primary p-6 md:p-12 pb-40 overflow-x-hidden relative transition-colors duration-500">
      <div className="fixed inset-0 pointer-events-none opacity-5 z-0">
        <h1 className="text-[25vw] font-black italic uppercase -rotate-12 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          SHORTS
        </h1>
      </div>

      <header className="relative z-40 mb-20 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate('/')}
            className="bg-secondary p-4 rounded-full border border-primary hover:bg-primary/10 transition-all shadow-xl active:scale-95 text-primary"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase drop-shadow-2xl">
              Shorts
            </h1>
            <div className="h-1 w-20 bg-accent rounded-full mt-1" style={{ backgroundColor: 'var(--accent-color)' }} />
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-secondary font-bold uppercase tracking-[0.2em] text-sm">
            {shorts.length} TOTAL SHORTS
          </p>
        </div>
      </header>

      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-x-6 gap-y-16 md:gap-x-10 md:gap-y-24">
        {shorts.map((short, i) => (
          <motion.div
            key={short.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (i % 20) * 0.03 }}
            whileHover={{
              scale: 1.1,
              rotate: 0,
              zIndex: 50,
              transition: { duration: 0.2 },
            }}
            className="group cursor-pointer"
            onClick={() => navigate(`/shorts?play=${short.id}`)}
          >
            <div className="relative transform -rotate-6 group-hover:rotate-0 transition-transform duration-500 ease-out">
              {/* Outer Theme-Aware Frame (Yellow in blue mode) */}
              <div 
                className="absolute inset-[-8px] md:inset-[-14px] rounded-2xl md:rounded-[32px] shadow-[0_15px_40px_rgba(0,0,0,0.5)] border border-primary transition-colors duration-500" 
                style={{ backgroundColor: 'var(--border-color)', opacity: 0.8 }}
              />

              <div className="relative aspect-[9/16] rounded-2xl md:rounded-[32px] overflow-hidden border-2 border-primary bg-black">
                <img
                  src={short.thumbnail_url}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 brightness-90 group-hover:brightness-110"
                  alt={short.title}
                  loading="lazy"
                  onError={(e) => {
                    e.target.src = 'https://placehold.co/400x711/001b2e/ffffff?text=Short';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-90" />
                <div className="absolute bottom-4 left-5 right-5">
                  <h3 className="text-white font-black italic text-xs md:text-base uppercase tracking-tighter line-clamp-2 leading-tight drop-shadow-md">
                    {short.title}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--accent-color)' }} />
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">
                      Play Short
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 w-full h-32 bg-gradient-to-t from-primary to-transparent z-0 pointer-events-none" />
    </div>
  );
}


