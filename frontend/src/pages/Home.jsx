import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import VideoCard from '../components/VideoCard';
import Loader from '../components/Loader';
import AdBanner from '../components/AdBanner';
import { Play, ChevronLeft, ChevronRight, Sparkles, Flame, Film, Music, Gamepad2, Tv, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PosterCard from '../components/PosterCard';
import CategoryPills from '../components/CategoryPills';

// Swiper imports
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

// ── Shared Section Title ──
const SectionHeader = ({ title, emoji, count, onPrev, onNext }) => (
  <div className="flex items-center justify-between mb-4 px-4 sm:px-0">
    <div className="flex items-center gap-2">
      <div className="w-1 h-5 bg-accent rounded-full shadow-[0_0_10px_var(--accent-color)]" style={{ backgroundColor: 'var(--accent-color)' }} />
      <h2 className="text-sm sm:text-lg font-black text-white uppercase italic tracking-tighter flex items-center gap-2">
        {emoji && <span>{emoji}</span>}
        {title}
        {count !== undefined && (
          <span className="text-[9px] font-normal text-white/40 ml-2 tracking-widest italic">({count})</span>
        )}
      </h2>
    </div>
    {(onPrev || onNext) && (
      <div className="hidden sm:flex gap-2">
        <button onClick={onPrev} className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all active:scale-90">
          <ChevronLeft size={16} />
        </button>
        <button onClick={onNext} className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-accent transition-all active:scale-90" style={{ '--accent-color': 'var(--accent-color)' }}>
          <ChevronRight size={16} />
        </button>
      </div>
    )}
  </div>
);

// ── Premium Hero Banner ──
const HeroBanner = ({ videos }) => {
  const navigate = useNavigate();
  if (!videos?.length) return null;

  return (
    <div className="relative w-full h-[140px] sm:h-[220px] md:h-[350px] mb-6 sm:mb-10 px-0 sm:px-4 select-none">
      <Swiper
        modules={[Autoplay, Pagination, EffectFade]}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        pagination={{ clickable: true, bulletClass: 'swiper-pagination-bullet !bg-white/20 !w-1.5 !h-1.5', bulletActiveClass: 'swiper-pagination-bullet-active !bg-white !w-6' }}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        loop={true}
        className="w-full h-full rounded-none sm:rounded-2xl overflow-hidden border-b sm:border border-white/5 shadow-2xl"
      >
        {videos.map((video) => (
          <SwiperSlide key={video.id} onClick={() => navigate('/watch/' + video.id)} className="cursor-pointer relative overflow-hidden">
            <img src={video.thumbnail_url} className="absolute inset-0 w-full h-full object-cover object-center" alt="" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8">
               <div className="flex items-center gap-2 mb-1 sm:mb-3">
                 <div className="px-1.5 py-0.5 bg-accent/20 border border-accent/40 rounded-[4px] text-[7px] sm:text-[9px] font-black text-accent uppercase tracking-widest" style={{ color: 'var(--accent-color)', borderColor: 'var(--accent-color)' }}>Featured</div>
                 <span className="text-[7px] sm:text-[9px] font-bold text-white/50 uppercase tracking-widest">{video.category}</span>
               </div>
               <h2 className="text-sm sm:text-2xl md:text-4xl font-black italic uppercase tracking-tighter text-white line-clamp-1 max-w-[85%] mb-2 sm:mb-4 drop-shadow-2xl">
                 {video.title}
               </h2>
               <button className="bg-white text-black px-4 sm:px-8 py-1.5 sm:py-2.5 rounded-full font-black text-[8px] sm:text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-accent hover:text-white transition-all shadow-xl active:scale-95">
                 <Play className="w-2.5 h-2.5 sm:w-4 sm:h-4 fill-current" /> PLAY
               </button>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

// ── Video Carousel Row ──
const VideoRow = ({ title, videos, emoji }) => {
  const scrollRef = useRef(null);
  if (!videos?.length) return null;

  return (
    <section className="mb-8 sm:mb-12">
      <SectionHeader 
        title={title} 
        emoji={emoji} 
        count={videos.length} 
        onPrev={() => scrollRef.current?.scrollBy({ left: -400, behavior: 'smooth' })}
        onNext={() => scrollRef.current?.scrollBy({ left: 400, behavior: 'smooth' })}
      />
      <div ref={scrollRef} className="flex gap-3 sm:gap-6 overflow-x-auto no-scrollbar px-4 sm:px-0 pb-2 scroll-smooth snap-x snap-mandatory">
        {videos.map((video) => (
          <div key={video.id} className="min-w-[130px] sm:min-w-[200px] md:min-w-[260px] flex-shrink-0 snap-start">
            <VideoCard video={video} />
          </div>
        ))}
      </div>
    </section>
  );
};

// ── Special Movie Theater Row ──
const MovieTheaterRow = ({ title, videos }) => {
  const navigate = useNavigate();
  if (!videos?.length) return null;

  return (
    <section className="mb-8 sm:mb-12">
      <div className="relative w-full bg-[#0a0a0a] rounded-none sm:rounded-3xl py-6 sm:py-10 px-4 sm:px-8 border-y sm:border border-white/5 shadow-inner overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-accent/5 blur-[100px] pointer-events-none" />
        
        <div className="flex items-end justify-between mb-6 sm:mb-8">
          <div>
            <h2 className="text-2xl sm:text-4xl font-black italic text-white uppercase tracking-tighter leading-none mb-2">{title}</h2>
            <div className="flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-accent" style={{ color: 'var(--accent-color)' }} />
              <p className="text-accent text-[8px] sm:text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: 'var(--accent-color)' }}>Premium Cinema</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/movies')} 
            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold text-[9px] sm:text-[10px] uppercase tracking-widest transition-all border border-white/10"
          >
            View All
          </button>
        </div>

        <div className="flex gap-4 sm:gap-6 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory">
          {videos.map((video) => (
            <div 
              key={video.id} 
              onClick={() => navigate(`/watch/${video.id}`)}
              className="min-w-[140px] sm:min-w-[200px] md:min-w-[260px] aspect-[16/10] rounded-xl overflow-hidden border border-white/10 cursor-pointer group shadow-2xl snap-start flex-shrink-0 relative"
            >
              <img src={video.thumbnail_url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-2 left-2 right-2">
                <p className="text-[8px] sm:text-[10px] text-white font-bold truncate opacity-0 group-hover:opacity-100 transition-opacity">{video.title}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default function Home() {
  const [videos, setVideos] = useState([]);
  const [heroVideos, setHeroVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Trending');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('videos')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (data) {
          setVideos(data);
          const featured = data.filter(v => v.is_featured);
          setHeroVideos(featured.length > 0 ? featured.slice(0, 8) : data.slice(0, 8));
        }
      } catch (e) {
        console.error('Home data load error:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const trending = useMemo(() => 
    [...videos].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 12),
  [videos]);

  const categories = useMemo(() => {
    const cats = {};
    videos.forEach((v) => {
      if (!v.category) return;
      if (!cats[v.category]) cats[v.category] = [];
      cats[v.category].push(v);
    });
    return cats;
  }, [videos]);

  const filteredExplore = useMemo(() => {
    if (activeTab === 'Trending') return videos;
    return videos.filter(v => v.category === activeTab);
  }, [videos, activeTab]);

  if (loading) return <Loader />;

  const CATEGORY_ICONS = {
    Movies: '🎬', Music: '🎵', Series: '📺', Shorts: '⚡', Gaming: '🎮', Comedy: '😂', Sports: '⚽'
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="pb-32 pt-16 sm:pt-20 min-h-screen bg-black"
    >
      <HeroBanner videos={heroVideos} />

      <div className="max-w-[1800px] mx-auto sm:px-6">
        {trending.length > 0 && (
          <VideoRow title="Trending Now" videos={trending} emoji="🔥" />
        )}

        {Object.entries(categories).map(([cat, vids]) => {
          if (cat === 'Movies') return <MovieTheaterRow key={cat} title={cat} videos={vids} />;
          return <VideoRow key={cat} title={cat} videos={vids} emoji={CATEGORY_ICONS[cat] || '🎥'} />;
        })}

        <div className="py-12 px-4 sm:px-0">
          <AdBanner position="banner" />
        </div>

        <section className="mt-12 px-4 sm:px-0">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8 border-l-4 border-accent pl-4" style={{ borderColor: 'var(--accent-color)' }}>
            <div>
              <p className="text-accent text-[9px] sm:text-[10px] font-black uppercase tracking-[0.5em] mb-1" style={{ color: 'var(--accent-color)' }}>Limitless Content</p>
              <h2 className="text-2xl sm:text-4xl font-black italic uppercase tracking-tighter text-white leading-none">
                More to <span className="text-accent" style={{ color: 'var(--accent-color)' }}>Explore</span>
              </h2>
            </div>
          </div>

          <div className="mb-10">
            <CategoryPills activeCategory={activeTab} setCategory={setActiveTab} />
          </div>

          <AnimatePresence mode="popLayout">
            <motion.div 
              layout
              className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-6"
            >
              {filteredExplore.map((video, index) => (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: (index % 10) * 0.05 }}
                >
                  <PosterCard video={video} index={index} />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>

          <div className="mt-20 pb-10 text-center opacity-20">
            <p className="text-[10px] font-black uppercase tracking-[1em]">MacFeed v2.0.1 Redesign</p>
          </div>
        </section>
      </div>
    </motion.div>
  );
}
