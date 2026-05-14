import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import VideoCard from '../components/VideoCard';
import Loader from '../components/Loader';
import { ChevronLeft, ChevronRight, Play, Sparkles, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination, EffectFade, FreeMode } from 'swiper/modules';
import PosterCard from '../components/PosterCard';
import CategoryPills from '../components/CategoryPills';
import AdBanner from '../components/AdBanner';
import { useTheme } from '../context/ThemeContext';

// Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';
import 'swiper/css/navigation';
import 'swiper/css/free-mode';

// ── Shared Section Title ──
const SectionHeader = ({ title, emoji, count, onPrev, onNext }) => (
  <div className="flex items-center justify-between mb-4 px-4 sm:px-0">
    <div className="flex items-center gap-2">
      <div className="w-1 h-5 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
      <h2 className="text-sm sm:text-lg font-black text-primary uppercase italic tracking-tighter flex items-center gap-2">
        {emoji && <span>{emoji}</span>}
        {title}
        {count !== undefined && (
          <span className="text-[9px] font-normal opacity-30 ml-2 tracking-widest italic">({count})</span>
        )}
      </h2>
    </div>
    {(onPrev || onNext) && (
      <div className="hidden sm:flex gap-2">
        <button onClick={onPrev} className="w-8 h-8 rounded-full bg-secondary border border-primary flex items-center justify-center text-primary hover:bg-primary/10 transition-all active:scale-90">
          <ChevronLeft size={16} />
        </button>
        <button onClick={onNext} className="w-8 h-8 rounded-full bg-secondary border border-primary flex items-center justify-center text-primary hover:bg-blue-600 transition-all active:scale-90">
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
    <div className="relative w-full h-[220px] sm:h-[300px] md:h-[450px] mb-10 px-4 sm:px-8 md:px-12 select-none">
      <Swiper
        modules={[Autoplay, Pagination, EffectFade]}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        pagination={{ clickable: true }}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        loop={true}
        className="w-full h-full rounded-[2rem] overflow-hidden border-4 border-accent shadow-2xl"
        style={{ borderColor: 'var(--accent-color)' }}
      >
        {videos.map((video) => (
          <SwiperSlide key={video.id} onClick={() => navigate('/watch/' + video.id)} className="cursor-pointer relative">
            <img src={video.thumbnail_url} className="absolute inset-0 w-full h-full object-cover object-center" alt="" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-12">
               <div className="flex items-center gap-2 mb-2 sm:mb-4">
                 <div className="px-2 py-0.5 bg-accent text-on-accent rounded text-[8px] sm:text-[10px] font-black uppercase tracking-widest" style={{ backgroundColor: 'var(--accent-color)', color: 'var(--text-on-accent)' }}>Featured</div>
               </div>
               <h2 className="text-xl sm:text-3xl md:text-5xl font-black italic uppercase tracking-tighter text-white line-clamp-1 max-w-[90%] mb-4 sm:mb-8 drop-shadow-2xl">
                 {video.title}
               </h2>
               <button className="bg-white text-black px-6 sm:px-10 py-2 sm:py-3.5 rounded-full font-black text-[10px] sm:text-xs uppercase tracking-widest flex items-center gap-3 hover:scale-105 transition-all shadow-xl active:scale-95">
                 <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" /> PLAY NOW
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
    <section className="mb-12">
      <SectionHeader 
        title={title} 
        emoji={emoji} 
        count={videos.length} 
        onPrev={() => scrollRef.current?.scrollBy({ left: -400, behavior: 'smooth' })}
        onNext={() => scrollRef.current?.scrollBy({ left: 400, behavior: 'smooth' })}
      />
      <div ref={scrollRef} className="flex gap-6 overflow-x-auto no-scrollbar px-4 sm:px-0 pb-2 scroll-smooth snap-x snap-mandatory">
        {videos.map((video) => (
          <div key={video.id} className="min-w-[180px] sm:min-w-[240px] md:min-w-[300px] flex-shrink-0 snap-start">
            <VideoCard video={video} />
          </div>
        ))}
      </div>
    </section>
  );
};

// ── 3D Movie Section ──
const Movies3DSection = ({ title, videos }) => {
  const navigate = useNavigate();
  if (!videos?.length) return null;

  return (
    <section className="mb-16 py-10 bg-accent/5 rounded-3xl border border-accent/10 relative overflow-hidden px-4 md:px-10" style={{ backgroundColor: 'var(--accent-color)11', borderColor: 'var(--accent-color)22' }}>
      <div className="flex items-end justify-between mb-10">
        <div>
          <h2 className="text-3xl md:text-5xl font-black italic text-primary uppercase tracking-tighter mb-2">{title}</h2>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" style={{ color: 'var(--accent-color)' }} />
            <p className="text-accent text-[10px] font-black uppercase tracking-[0.4em]" style={{ color: 'var(--accent-color)' }}>Cinematic Experience</p>
          </div>
        </div>
        <button onClick={() => navigate('/movies')} className="text-accent font-black text-xs uppercase tracking-widest hover:underline" style={{ color: 'var(--accent-color)' }}>Explore All</button>
      </div>

      <div className="flex gap-6 overflow-x-auto no-scrollbar scroll-smooth snap-x">
        {videos.map((video) => (
          <div 
            key={video.id} 
            onClick={() => navigate(`/watch/${video.id}`)}
            className="min-w-[150px] sm:min-w-[220px] aspect-[2/3] rounded-2xl overflow-hidden border-2 border-primary/20 cursor-pointer transition-all hover:scale-105 hover:border-accent snap-center flex-shrink-0 relative group"
            style={{ '--hover-border': 'var(--accent-color)' }}
          >
            <img src={video.thumbnail_url} className="w-full h-full object-cover" alt="" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ))}
      </div>
    </section>
  );
};

export default function Home() {
  const [videos, setVideos] = useState([]);
  const [heroVideos, setHeroVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Trending');
  const { theme } = useTheme();
  const navigate = useNavigate();

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
      className="pb-32 pt-20 sm:pt-24 min-h-screen"
    >
      <HeroBanner videos={heroVideos} />

      {/* Theme Selector Section - RESTORED */}
      <section className="px-4 md:px-12 mb-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-1 h-6 bg-blue-500 rounded-full" />
          <h2 className="text-primary text-xl font-black uppercase tracking-tighter italic">SELECT <span className="text-blue-500">THEME</span></h2>
        </div>
        <div className="grid grid-cols-3 gap-4 md:gap-8 max-w-4xl">
          {[
            { id: 'dark', name: 'MIDNIGHT', bg: 'bg-[#1e293b]', border: 'border-white/20', text: 'text-white' },
            { id: 'light', name: 'DAYLIGHT', bg: 'bg-white', border: 'border-red-500', text: 'text-black' },
            { id: 'blue', name: 'BLUE SKY', bg: 'bg-blue-100', border: 'border-yellow-400', text: 'text-blue-900' }
          ].map(t => {
            const isActive = theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  const root = window.document.documentElement;
                  root.classList.remove('light', 'dark', 'blue');
                  root.classList.add(t.id);
                  localStorage.setItem('theme', t.id);
                  window.location.reload();
                }}
                className={`relative h-24 sm:h-32 rounded-[2rem] border-4 transition-all duration-500 shadow-xl ${t.bg} ${isActive ? t.border + ' scale-105 ring-4 ring-blue-500/20' : 'border-transparent opacity-60 hover:opacity-100'}`}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-[9px] sm:text-xs font-black uppercase tracking-widest ${t.text}`}>{t.name}</span>
                  {isActive && <div className="mt-2 w-2 h-2 rounded-full bg-blue-500 animate-pulse" />}
                </div>
              </button>
            )
          })}
        </div>
      </section>

      <div className="max-w-[1800px] mx-auto sm:px-6">
        {trending.length > 0 && (
          <VideoRow title="Trending Now" videos={trending} emoji="🔥" />
        )}

        {Object.entries(categories).map(([cat, vids]) => {
          if (cat === 'Movies') return <Movies3DSection key={cat} title={cat} videos={vids} />;
          return <VideoRow key={cat} title={cat} videos={vids} emoji={CATEGORY_ICONS[cat] || '🎥'} />;
        })}

        <div className="py-12 px-4 sm:px-0">
          <AdBanner position="banner" />
        </div>

        <section className="mt-20 px-4 sm:px-0">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12 border-l-8 border-blue-500 pl-6">
            <div>
              <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.5em] mb-2">Limitless Content</p>
              <h2 className="text-4xl md:text-7xl font-black italic uppercase tracking-tighter text-primary leading-none">
                More to <span className="text-blue-500">Explore</span>
              </h2>
            </div>
          </div>

          <div className="mb-12 overflow-x-auto no-scrollbar">
            <CategoryPills activeCategory={activeTab} setCategory={setActiveTab} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-6">
            {filteredExplore.map((video, index) => (
              <PosterCard key={video.id} video={video} index={index} />
            ))}
          </div>
        </section>
      </div>
    </motion.div>
  );
}
