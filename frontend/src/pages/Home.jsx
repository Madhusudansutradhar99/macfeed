import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import VideoCard from '../components/VideoCard';
import Loader from '../components/Loader';
import { Play, Flame, Search, Bell, ChevronRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

// Swiper imports
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, FreeMode, EffectCoverflow } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/free-mode';

export default function Home() {
  const [videos, setVideos] = useState([]);
  const [heroVideos, setHeroVideos] = useState([]);
  const [loading, setLoading] = useState(true);
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
    const groups = {};
    videos.forEach(v => {
      const cat = v.category || 'More Videos';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(v);
    });
    return groups;
  }, [videos]);

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-[#08090d] text-white pb-40 overflow-x-hidden">
      
      {/* ── HEADER ── */}
      <header className="px-6 md:px-12 py-6 flex items-center justify-between sticky top-0 z-[100] bg-[#08090d]/90 backdrop-blur-2xl border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-blue-600/30">M</div>
          <h1 className="text-2xl font-black italic tracking-tighter uppercase">MAC<span className="text-blue-500">FEED</span></h1>
        </div>

        <div className="hidden lg:flex items-center bg-white/5 rounded-full px-6 py-3 border border-white/10 w-full max-w-xl mx-12">
          <Search size={18} className="text-gray-500" />
          <input placeholder="Search Premium Content..." className="bg-transparent border-none outline-none px-4 text-sm w-full font-bold" />
        </div>

        <div className="flex items-center gap-4">
          <Bell size={22} className="text-gray-400 cursor-pointer hover:text-white transition-all" />
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 border border-white/10 flex items-center justify-center font-bold">L</div>
        </div>
      </header>

      {/* ── GIANT HERO (Image 1 Style) ── */}
      <section className="mt-6 mb-20 overflow-hidden">
        <Swiper
          modules={[Autoplay, Pagination]}
          spaceBetween={30}
          slidesPerView={1.2}
          centeredSlides={true}
          autoplay={{ delay: 5000 }}
          loop={true}
          pagination={{ clickable: true }}
          breakpoints={{
            1024: { slidesPerView: 1.5, spaceBetween: 50 }
          }}
          className="w-full py-6"
        >
          {heroVideos.map(video => (
            <SwiperSlide 
              key={video.id} 
              className="relative w-full h-[300px] md:h-[500px] rounded-[3rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.7)] group border border-white/10"
              onClick={() => navigate('/watch/' + video.id)}
            >
              <img src={video.thumbnail_url} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt="" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
              
              <div className="absolute bottom-10 left-10 right-10">
                <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles size={16} className="text-yellow-400" fill="currentColor" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-400">Featured Content</span>
                  </div>
                  <h3 className="text-3xl md:text-6xl font-black italic uppercase tracking-tighter mb-8 drop-shadow-2xl line-clamp-1">{video.title}</h3>
                  <button className="bg-white text-black px-12 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-blue-600 hover:text-white transition-all shadow-2xl active:scale-95">
                    <Play size={18} fill="currentColor" /> Watch Now
                  </button>
                </motion.div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </section>

      {/* ── SLIDING ROWS (Image 2 Style - SMALL CARDS) ── */}
      <div className="px-6 md:px-12 space-y-24">
        {Object.entries(categories).map(([cat, vids]) => (
          <section key={cat} className="group">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-1.5 h-8 bg-blue-600 rounded-full group-hover:h-10 transition-all" />
                <h2 className="text-2xl font-black uppercase italic tracking-tighter">{cat}</h2>
              </div>
              <button className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-blue-500 transition-all">
                Explore All <ChevronRight size={14} />
              </button>
            </div>

            <Swiper
              modules={[FreeMode]}
              spaceBetween={20}
              slidesPerView={2.5}
              freeMode={true}
              breakpoints={{
                768: { slidesPerView: 4.5 },
                1024: { slidesPerView: 6.5 },
                1440: { slidesPerView: 8.5 }
              }}
              className="!overflow-visible"
            >
              {vids.map(video => (
                <SwiperSlide key={video.id} onClick={() => navigate('/watch/' + video.id)} className="cursor-pointer group/card">
                  <div className="relative aspect-[2/3] rounded-[2.5rem] overflow-hidden mb-4 shadow-xl border border-white/5 bg-[#14151a] group-hover/card:border-blue-600/50 transition-all">
                    <img src={video.thumbnail_url} className="w-full h-full object-cover grayscale-[30%] group-hover/card:grayscale-0 transition-all duration-500" alt="" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 scale-50 group-hover/card:scale-100 transition-all">
                      <div className="p-3 bg-blue-600 rounded-full shadow-2xl shadow-blue-600/50"><Play size={16} fill="white" /></div>
                    </div>
                  </div>
                  <h4 className="text-[11px] font-bold uppercase tracking-tighter line-clamp-1 mb-1 group-hover/card:text-blue-500 transition-colors">{video.title}</h4>
                  <div className="flex items-center justify-between text-[8px] font-black text-gray-600 uppercase tracking-widest">
                    <span>9.5 Rating</span>
                    <span>2024</span>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </section>
        ))}
      </div>

      <div className="mt-40 text-center opacity-5 text-[8px] font-black uppercase tracking-[3em] pointer-events-none">
        MACFEED HYBRID v5.0 - ABSOLUTE PROPORTIONS
      </div>
    </div>
  );
}
