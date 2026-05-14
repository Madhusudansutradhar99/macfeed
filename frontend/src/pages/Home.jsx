import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import VideoCard from '../components/VideoCard';
import Loader from '../components/Loader';
import { Play, Flame, Search, Bell, User, Layout, Filter, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

// Swiper imports
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
    return cats.slice(0, 12);
  }, [videos]);

  const filteredVideos = useMemo(() => {
    if (activeCategory === 'Trending') return videos.slice(0, 24);
    return videos.filter(v => v.category === activeCategory);
  }, [activeCategory, videos]);

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-[#0b0c10] text-white pb-40 overflow-x-hidden">
      
      {/* ── HEADER ── */}
      <header className="px-6 md:px-12 py-8 flex items-center justify-between sticky top-0 z-[100] bg-[#0b0c10]/80 backdrop-blur-3xl border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg rotate-12 flex items-center justify-center font-black">M</div>
          <h1 className="text-2xl font-black italic tracking-tighter">MAC<span className="text-blue-500">FEED</span></h1>
        </div>
        
        <div className="hidden lg:flex items-center bg-white/5 rounded-2xl px-6 py-3 border border-white/10 w-full max-w-xl mx-12">
          <Search size={18} className="text-gray-400" />
          <input placeholder="Search movies, games, trends..." className="bg-transparent border-none outline-none px-4 text-sm w-full font-bold placeholder:text-gray-600" />
          <button className="p-1.5 bg-blue-600 rounded-lg shadow-lg shadow-blue-600/20"><Search size={14} /></button>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end gap-0.5">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Premium Plan</span>
            <span className="text-xs font-bold text-blue-500">Active</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 border-2 border-white/10 flex items-center justify-center font-black shadow-xl">L</div>
        </div>
      </header>

      {/* ── CINEMATIC HERO (Image 1 Style - GIANT) ── */}
      <section className="mt-8 mb-16 overflow-hidden">
        <Swiper
          modules={[EffectCoverflow, Autoplay, Pagination]}
          effect={'coverflow'}
          grabCursor={true}
          centeredSlides={true}
          slidesPerView={'auto'}
          coverflowEffect={{
            rotate: 0,
            stretch: 80,
            depth: 150,
            modifier: 1.5,
            slideShadows: false,
          }}
          autoplay={{ delay: 5000 }}
          loop={true}
          pagination={{ clickable: true }}
          className="w-full py-10"
        >
          {heroVideos.map(video => (
            <SwiperSlide 
              key={video.id} 
              className="w-[85vw] md:w-[800px] h-[250px] md:h-[450px] rounded-[3rem] overflow-hidden shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] relative group border-2 border-white/5"
              onClick={() => navigate('/watch/' + video.id)}
            >
              <img src={video.thumbnail_url} className="w-full h-full object-cover transition-transform duration-[6s] group-hover:scale-110" alt="" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />
              
              <div className="absolute bottom-10 left-10 right-10 z-20">
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                  <h3 className="text-2xl md:text-5xl font-black italic uppercase tracking-tighter mb-6 drop-shadow-2xl line-clamp-1">{video.title}</h3>
                  <div className="flex items-center gap-4">
                    <button className="bg-white text-black px-10 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-blue-600 hover:text-white transition-all shadow-2xl">
                      <Play size={18} fill="currentColor" /> Play Now
                    </button>
                    <button className="p-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 hover:bg-white/20 transition-all">
                      <Flame size={20} className="text-orange-500" fill="currentColor" />
                    </button>
                  </div>
                </motion.div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </section>

      {/* ── CATEGORY BAR (Image 2 Style - NEAT) ── */}
      <section className="px-6 md:px-12 mb-12">
        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-8 py-3.5 rounded-2xl whitespace-nowrap font-bold text-xs uppercase tracking-widest transition-all ${activeCategory === cat ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30 border-blue-500' : 'bg-white/5 text-gray-500 border border-white/5 hover:bg-white/10'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* ── CONTENT GRID (Image 2 Style - SMALL POSTERS) ── */}
      <section className="px-6 md:px-12">
        <div className="flex items-center justify-between mb-10 border-l-4 border-blue-600 pl-6">
          <div>
            <h2 className="text-2xl font-black uppercase italic tracking-tighter leading-none mb-2">
              {activeCategory} <span className="text-blue-500">Collection</span>
            </h2>
            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Handpicked for your profile</p>
          </div>
          <button className="p-3 bg-white/5 rounded-2xl border border-white/10 group hover:bg-blue-600 transition-all">
            <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 md:gap-10">
          {filteredVideos.map(video => (
            <motion.div 
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              key={video.id} 
              onClick={() => navigate('/watch/' + video.id)}
              className="cursor-pointer group"
            >
              <div className="relative aspect-[3/4.5] rounded-[2.5rem] overflow-hidden mb-5 shadow-2xl border border-white/5 bg-[#1a1d23] group-hover:border-blue-500/50 transition-all">
                <img src={video.thumbnail_url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-6 left-6 right-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                   <button className="w-full py-2.5 bg-blue-600 rounded-xl font-black text-[9px] uppercase tracking-widest">Details</button>
                </div>
              </div>
              <h3 className="font-bold text-xs uppercase tracking-tighter line-clamp-1 group-hover:text-blue-500 transition-colors mb-1.5">{video.title}</h3>
              <div className="flex items-center justify-between text-[9px] font-black text-gray-600 uppercase tracking-widest">
                <div className="flex items-center gap-1.5">
                  <span className="text-yellow-500">★</span>
                  <span>9.2</span>
                </div>
                <span>2024</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <div className="mt-40 text-center opacity-5 text-[8px] font-black uppercase tracking-[2.5em] pointer-events-none">
        MACFEED HYBRID PRO v4.2
      </div>
    </div>
  );
}
