import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import VideoCard from '../components/VideoCard';
import Loader from '../components/Loader';
import { Play, Flame, Search, Bell, User, Layout, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

// Swiper imports for 3D Effects
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, FreeMode, EffectCoverflow } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/effect-coverflow';

export default function Home() {
  const [videos, setVideos] = useState([]);
  const [heroVideos, setHeroVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Trending');
  const navigate = useNavigate();
  const { theme } = useTheme();

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('videos')
          .select('*')
          .order('created_at', { ascending: false });

        if (data) {
          setVideos(data);
          const featured = data.filter(v => v.is_featured);
          setHeroVideos(featured.length > 0 ? featured.slice(0, 10) : data.slice(0, 10));
        }
      } catch (e) {
        console.error('Home load error:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const categories = useMemo(() => {
    const cats = ['Trending', ...new Set(videos.map(v => v.category).filter(Boolean))];
    return cats.slice(0, 10);
  }, [videos]);

  const filteredVideos = useMemo(() => {
    if (activeCategory === 'Trending') return videos.slice(0, 12);
    return videos.filter(v => v.category === activeCategory);
  }, [activeCategory, videos]);

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-[#0f1115] text-white pb-32">
      
      {/* ── 1. TOP HEADER (Image 2 Style) ── */}
      <header className="px-6 md:px-12 py-6 flex items-center justify-between sticky top-0 z-[100] bg-[#0f1115]/50 backdrop-blur-xl">
        <h1 className="text-2xl font-black italic tracking-tighter">FLIX.<span className="text-blue-500">ID</span></h1>
        
        <div className="hidden md:flex items-center bg-[#1a1d23] rounded-full px-6 py-2 border border-white/5 w-full max-w-md mx-8 shadow-inner">
          <Search size={18} className="text-gray-500" />
          <input placeholder="Search movies, series..." className="bg-transparent border-none outline-none px-4 text-sm w-full font-medium" />
          <Filter size={18} className="text-gray-500 cursor-pointer" />
        </div>

        <div className="flex items-center gap-4">
          <button className="p-2 bg-[#1a1d23] rounded-full border border-white/5 relative">
            <Bell size={20} />
            <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0f1115]" />
          </button>
          <div className="flex items-center gap-3 bg-[#1a1d23] rounded-full pl-2 pr-4 py-1.5 border border-white/5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center font-bold">L</div>
            <span className="text-xs font-bold hidden sm:block">User Profile</span>
          </div>
        </div>
      </header>

      {/* ── 2. HERO CARDS STACK (Image 1 Style - 3D Swiper) ── */}
      <section className="mt-4 mb-12">
        <Swiper
          modules={[EffectCoverflow, Autoplay, Pagination]}
          effect={'coverflow'}
          grabCursor={true}
          centeredSlides={true}
          slidesPerView={'auto'}
          coverflowEffect={{
            rotate: 30,
            stretch: 0,
            depth: 200,
            modifier: 1,
            slideShadows: true,
          }}
          autoplay={{ delay: 4000 }}
          loop={true}
          className="w-full py-12"
        >
          {heroVideos.map(video => (
            <SwiperSlide 
              key={video.id} 
              className="w-[280px] h-[380px] md:w-[450px] md:h-[300px] rounded-[2rem] overflow-hidden shadow-2xl relative group"
              onClick={() => navigate('/watch/' + video.id)}
            >
              <img src={video.thumbnail_url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <h3 className="text-xl md:text-2xl font-black italic uppercase mb-4 drop-shadow-xl line-clamp-1">{video.title}</h3>
                <div className="flex items-center gap-3">
                  <button className="bg-white text-black px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-blue-500 hover:text-white transition-all">
                    <Play size={14} fill="currentColor" /> Play Now
                  </button>
                  <button className="p-2 bg-white/10 backdrop-blur-md rounded-full border border-white/10">
                    <Flame size={16} />
                  </button>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </section>

      {/* ── 3. CATEGORY PILL BAR (Image 2 Style) ── */}
      <section className="px-6 md:px-12 mb-10 overflow-x-auto no-scrollbar flex gap-4">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-8 py-3 rounded-2xl whitespace-nowrap font-bold text-sm transition-all flex items-center gap-2 ${activeCategory === cat ? 'bg-white text-black shadow-[0_10px_20px_rgba(255,255,255,0.1)]' : 'bg-[#1a1d23] text-gray-400 hover:bg-[#252830] border border-white/5'}`}
          >
            {cat === 'Trending' && <Flame size={16} />}
            {cat}
          </button>
        ))}
      </section>

      {/* ── 4. VIDEO GRID (Image 2 Style - Vertical Posters) ── */}
      <section className="px-6 md:px-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-black uppercase italic tracking-tighter">
            {activeCategory} <span className="text-blue-500">Collection</span>
          </h2>
          <button className="text-xs font-bold text-gray-500 uppercase tracking-widest hover:text-white transition-all">View All</button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 md:gap-8">
          {filteredVideos.map(video => (
            <motion.div 
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              key={video.id} 
              onClick={() => navigate('/watch/' + video.id)}
              className="cursor-pointer group"
            >
              <div className="relative aspect-[2/3] rounded-[2rem] overflow-hidden mb-4 shadow-2xl border border-white/5 bg-[#1a1d23]">
                <img src={video.thumbnail_url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="" />
                <div className="absolute top-4 right-4 p-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play size={14} fill="white" />
                </div>
              </div>
              <h3 className="font-bold text-sm line-clamp-1 group-hover:text-blue-500 transition-colors mb-1">{video.title}</h3>
              <div className="flex items-center gap-3 text-[10px] font-bold text-gray-500">
                <span className="flex items-center gap-1"><span className="text-yellow-500">★</span> 7.8</span>
                <span>2023</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <div className="mt-32 text-center opacity-5 text-[8px] font-black uppercase tracking-[2em]">
        MACFEED HYBRID v4.0
      </div>
    </div>
  );
}
