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

// ── Hero Banner Component ──
function HeroBanner({ videos }) {
  const navigate = useNavigate();
  if (!videos || videos.length === 0) return null;

  return (
    <div className="w-full px-4 md:px-12 mb-10 overflow-hidden">
      <Swiper
        modules={[Autoplay, Pagination, EffectFade]}
        effect="fade"
        pagination={{ clickable: true }}
        autoplay={{ delay: 6000, disableOnInteraction: false }}
        loop={true}
        className="w-full h-[220px] md:h-[450px] rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10"
      >
        {videos.map((video) => (
          <SwiperSlide key={video.id} onClick={() => navigate('/watch/' + video.id)} className="cursor-pointer">
            <div className="relative w-full h-full group">
              <img src={video.thumbnail_url} className="absolute inset-0 w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" alt="" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 md:bottom-12 md:left-12 md:right-12">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 px-3 py-1 bg-accent rounded-full text-[8px] font-black uppercase tracking-widest text-white shadow-xl w-fit mb-4">
                  <Flame size={12} fill="white" /> Featured Spotlight
                </motion.div>
                <h2 className="text-white text-xl md:text-5xl font-black italic uppercase tracking-tighter mb-6 line-clamp-1 drop-shadow-2xl">{video.title}</h2>
                <button className="bg-white text-black px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-accent hover:text-white transition-all transform hover:scale-105 active:scale-95 shadow-2xl">
                  <Play size={16} fill="currentColor" /> Watch Now
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
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-7 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
          <h2 className="text-xl font-black text-primary uppercase italic tracking-tighter flex items-center gap-2">
            {emoji && <span className="text-2xl">{emoji}</span>}
            {title}
          </h2>
        </div>
        <div className="flex gap-2">
          <button onClick={() => scrollRef.current?.scrollBy({ left: -400, behavior: 'smooth' })} className="w-10 h-10 rounded-full bg-secondary/50 border border-primary/10 flex items-center justify-center text-primary hover:bg-accent hover:text-white transition-all active:scale-90">
            <ChevronLeft size={20} />
          </button>
          <button onClick={() => scrollRef.current?.scrollBy({ left: 400, behavior: 'smooth' })} className="w-10 h-10 rounded-full bg-secondary/50 border border-primary/10 flex items-center justify-center text-primary hover:bg-accent hover:text-white transition-all active:scale-90">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex gap-6 overflow-x-auto no-scrollbar pb-4 scroll-smooth snap-x snap-mandatory">
        {videos.map((video) => (
          <div key={video.id} className="min-w-[180px] sm:min-w-[260px] md:min-w-[320px] flex-shrink-0 snap-start">
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
    <div className="relative w-full bg-gradient-to-br from-blue-900/10 via-transparent to-transparent rounded-[2.5rem] py-10 px-6 sm:px-10 mb-12 border border-primary/5 shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl md:text-4xl font-black italic text-primary uppercase tracking-tighter leading-none">{title}</h2>
          <div className="flex items-center gap-2 mt-2">
            <Sparkles className="w-4 h-4 text-accent" />
            <p className="text-accent text-[10px] font-black uppercase tracking-[0.4em]">Premium Cinema Experience</p>
          </div>
        </div>
        <button onClick={() => navigate('/movies')} className="bg-primary/5 hover:bg-accent hover:text-white px-6 py-2 rounded-xl text-primary font-black text-[10px] uppercase tracking-widest transition-all border border-primary/10">View All</button>
      </div>

      <div className="flex gap-6 overflow-x-auto no-scrollbar pb-4 scroll-smooth snap-x snap-mandatory">
        {videos.map((video) => (
          <div 
            key={video.id} 
            onClick={() => navigate(`/watch/${video.id}`)}
            className="min-w-[150px] md:min-w-[220px] aspect-[2/3] rounded-2xl overflow-hidden border-2 border-primary/10 cursor-pointer group shadow-2xl snap-start flex-shrink-0 relative transition-transform hover:scale-105"
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

      <div className="px-4 md:px-12 space-y-4">
        {trending.length > 0 && <VideoRow title="Trending Now" videos={trending} emoji="🔥" />}

        {Object.entries(categories).map(([cat, vids]) => {
          if (cat === 'Movies') return <MovieTheaterRow key={cat} title={cat} videos={vids} />;
          return <VideoRow key={cat} title={cat} videos={vids} emoji={CATEGORY_EMOJIS[cat] || '🎥'} />;
        })}

        <div className="py-12"><AdBanner position="banner" /></div>

        <section className="mt-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-l-8 border-blue-500 pl-6">
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

      <div className="mt-32 text-center opacity-10 text-[8px] font-black uppercase tracking-[1em]">
        MACFEED v3.1.2 - PREMIUM RESTORED
      </div>
    </motion.div>
  );
}
