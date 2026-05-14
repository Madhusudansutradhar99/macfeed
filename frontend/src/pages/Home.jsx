import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import VideoCard from '../components/VideoCard';
import Loader from '../components/Loader';
import { ChevronLeft, ChevronRight, Play, Sparkles, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PosterCard from '../components/PosterCard';
import CategoryPills from '../components/CategoryPills';
import AdBanner from '../components/AdBanner';

// Swiper imports
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination, FreeMode, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

// ── Hero Banner Component (Compact Style) ──
function HeroBanner({ videos }) {
  const navigate = useNavigate();
  if (!videos || videos.length === 0) return null;

  return (
    <div className="w-full px-4 md:px-10 mb-6 md:mb-10 overflow-hidden">
      <Swiper
        modules={[Autoplay, Pagination, EffectFade]}
        effect="fade"
        pagination={{ clickable: true }}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        loop={true}
        className="w-full h-[180px] md:h-[340px] rounded-2xl md:rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10"
      >
        {videos.map((video) => (
          <SwiperSlide key={video.id} onClick={() => navigate('/watch/' + video.id)} className="cursor-pointer">
            <div className="relative w-full h-full group">
              <img src={video.thumbnail_url} className="absolute inset-0 w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-105" alt="" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 md:bottom-10 md:left-10 md:right-10">
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 px-2 py-0.5 bg-accent rounded-full text-[7px] md:text-[8px] font-black uppercase tracking-widest text-white shadow-xl w-fit mb-2 md:mb-3">
                  <Flame size={10} fill="white" /> Featured Spotlight
                </motion.div>
                <h2 className="text-white text-base md:text-3xl font-black italic uppercase tracking-tighter mb-3 md:mb-5 line-clamp-1 drop-shadow-2xl">{video.title}</h2>
                <button className="bg-white text-black px-4 py-1.5 md:px-7 md:py-2.5 rounded-full font-black text-[9px] md:text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-accent hover:text-white transition-all transform hover:scale-105 active:scale-95 shadow-xl">
                  <Play size={14} fill="currentColor" /> Watch Now
                </button>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}

// ── Standard Video Row Component ──
function VideoRow({ title, videos, emoji }) {
  const scrollRef = useRef(null);
  if (!videos || videos.length === 0) return null;

  return (
    <section className="mb-8 md:mb-10">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
          <h2 className="text-sm md:text-lg font-black text-primary uppercase italic tracking-tighter flex items-center gap-2">
            {emoji && <span className="text-lg">{emoji}</span>}
            {title}
          </h2>
        </div>
        <div className="flex gap-1.5">
          <button onClick={() => scrollRef.current?.scrollBy({ left: -300, behavior: 'smooth' })} className="w-8 h-8 rounded-full bg-secondary/50 border border-primary/10 flex items-center justify-center text-primary hover:bg-accent hover:text-white transition-all active:scale-90">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => scrollRef.current?.scrollBy({ left: 300, behavior: 'smooth' })} className="w-8 h-8 rounded-full bg-secondary/50 border border-primary/10 flex items-center justify-center text-primary hover:bg-accent hover:text-white transition-all active:scale-90">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex gap-4 md:gap-6 overflow-x-auto no-scrollbar pb-3 scroll-smooth snap-x snap-mandatory">
        {videos.map((video) => (
          <div key={video.id} className="min-w-[150px] sm:min-w-[240px] md:min-w-[280px] flex-shrink-0 snap-start">
            <VideoCard video={video} />
          </div>
        ))}
      </div>
    </section>
  );
}

// ── 3D Movie Row Component ──
function MovieTheaterRow({ title, videos }) {
  const navigate = useNavigate();
  if (!videos || !videos.length) return null;

  return (
    <div className="relative w-full bg-gradient-to-br from-blue-900/5 via-transparent to-transparent rounded-2xl md:rounded-[2rem] py-6 md:py-8 px-4 md:px-8 mb-10 border border-primary/5 shadow-xl overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-black italic text-primary uppercase tracking-tighter leading-none">{title}</h2>
          <div className="flex items-center gap-2 mt-1.5">
            <Sparkles className="w-3 h-3 text-accent" />
            <p className="text-accent text-[8px] font-black uppercase tracking-[0.3em]">Cinematic Experience</p>
          </div>
        </div>
        <button onClick={() => navigate('/movies')} className="bg-primary/5 hover:bg-accent hover:text-white px-4 py-1.5 rounded-lg text-primary font-black text-[8px] uppercase tracking-widest transition-all border border-primary/10">View All</button>
      </div>

      <div className="flex gap-4 md:gap-6 overflow-x-auto no-scrollbar pb-3 scroll-smooth snap-x snap-mandatory">
        {videos.map((video) => (
          <div 
            key={video.id} 
            onClick={() => navigate(`/watch/${video.id}`)}
            className="min-w-[130px] md:min-w-[180px] aspect-[2/3] rounded-xl overflow-hidden border-2 border-primary/10 cursor-pointer group shadow-xl snap-start flex-shrink-0 relative transition-transform hover:scale-105"
          >
            <img src={video.thumbnail_url} className="w-full h-full object-cover" alt="" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [videos, setVideos] = useState([]);
  const [heroVideos, setHeroVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Trending');
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

  const categories = useMemo(() => {
    const cats = {};
    videos.forEach((v) => {
      if (!v.category) return;
      if (!cats[v.category]) cats[v.category] = [];
      cats[v.category].push(v);
    });
    return cats;
  }, [videos]);

  const trending = useMemo(() => 
    [...videos].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 12),
  [videos]);

  const filteredExplore = useMemo(() => {
    if (activeTab === 'Trending') return videos;
    return videos.filter(v => v.category === activeTab);
  }, [videos, activeTab]);

  if (loading) return <Loader />;

  const CATEGORY_EMOJIS = {
    Movies: '🎬', Music: '🎵', Series: '📺', Shorts: '⚡', Gaming: '🎮', Comedy: '😂', Sports: '⚽'
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-32 min-h-screen">
      <HeroBanner videos={heroVideos} />

      <div className="px-4 md:px-10 space-y-4">
        {trending.length > 0 && <VideoRow title="Trending Now" videos={trending} emoji="🔥" />}

        {Object.entries(categories).map(([cat, vids]) => {
          if (cat === 'Movies') return <MovieTheaterRow key={cat} title={cat} videos={vids} />;
          return <VideoRow key={cat} title={cat} videos={vids} emoji={CATEGORY_EMOJIS[cat] || '🎥'} />;
        })}

        <div className="py-8"><AdBanner position="banner" /></div>

        <section className="mt-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 border-l-4 border-blue-500 pl-4">
            <div>
              <p className="text-blue-500 text-[8px] font-black uppercase tracking-[0.4em] mb-1">Limitless Content</p>
              <h2 className="text-2xl md:text-4xl font-black italic uppercase tracking-tighter text-primary leading-none">
                More to <span className="text-blue-500">Explore</span>
              </h2>
            </div>
          </div>

          <div className="mb-8 overflow-x-auto no-scrollbar">
            <CategoryPills activeCategory={activeTab} setCategory={setActiveTab} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-4 md:gap-5">
            {filteredExplore.map((video, index) => (
              <PosterCard key={video.id} video={video} index={index} />
            ))}
          </div>
        </section>
      </div>

      <div className="mt-20 text-center opacity-10 text-[7px] font-black uppercase tracking-[1em]">
        MACFEED v3.1.5 - ULTRA COMPACT RESTORED
      </div>
    </motion.div>
  );
}
