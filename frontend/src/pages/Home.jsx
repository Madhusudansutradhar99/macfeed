import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import VideoCard from '../components/VideoCard';
import Loader from '../components/Loader';
import { ChevronLeft, ChevronRight, Play, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PosterCard from '../components/PosterCard';
import CategoryPills from '../components/CategoryPills';
import { useTheme } from '../context/ThemeContext';

// Swiper imports
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination, FreeMode } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export default function Home() {
  const [videos, setVideos] = useState([]);
  const [heroVideos, setHeroVideos] = useState([]);
  const [loading, setLoading] = useState(true);
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

        if (error) throw error;

        if (data) {
          setVideos(data);
          const featured = data.filter(v => v.is_featured);
          setHeroVideos(featured.length > 0 ? featured.slice(0, 10) : data.slice(0, 10));
        }
      } catch (e) {
        console.error('Home data load error:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <Loader />;

  const categories = {};
  videos.forEach((v) => {
    if (!v.category) return;
    if (!categories[v.category]) categories[v.category] = [];
    categories[v.category].push(v);
  });

  const trending = [...videos].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 10);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="max-w-full overflow-x-hidden pb-32"
    >
      {/* Hero Section - Strict Container */}
      {heroVideos.length > 0 && (
        <section className="w-full px-4 md:px-12 mb-8 mt-4 overflow-hidden">
          <Swiper
            modules={[Autoplay, Pagination, Navigation]}
            pagination={{ clickable: true }}
            autoplay={{ delay: 4000 }}
            spaceBetween={15}
            slidesPerView={1}
            breakpoints={{
              640: { slidesPerView: 1.2 },
              1024: { slidesPerView: 2.2 },
            }}
            className="w-full h-[180px] md:h-[320px] rounded-2xl md:rounded-[2rem] overflow-hidden shadow-2xl"
          >
            {heroVideos.map(video => (
              <SwiperSlide key={video.id} onClick={() => navigate('/watch/' + video.id)}>
                <div className="relative w-full h-full bg-black rounded-2xl md:rounded-[2rem] overflow-hidden border border-white/10">
                  <img src={video.thumbnail_url} className="w-full h-full object-cover opacity-80" alt="" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8 right-4">
                    <h2 className="text-white text-sm md:text-2xl font-black italic uppercase tracking-tighter mb-2 line-clamp-1">{video.title}</h2>
                    <button className="bg-white text-black px-4 py-1.5 md:px-6 md:py-2 rounded-full font-black text-[8px] md:text-[10px] uppercase tracking-widest flex items-center gap-2">
                      <Play size={10} fill="black" /> PLAY NOW
                    </button>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </section>
      )}

      {/* Theme Selector - Strict Container */}
      <section className="w-full px-4 md:px-12 mb-8 overflow-hidden">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-4 bg-blue-500 rounded-full" />
          <h2 className="text-primary text-xs md:text-sm font-black uppercase tracking-tighter italic">CHOOSE STYLE</h2>
        </div>
        <div className="grid grid-cols-3 gap-3 max-w-full md:max-w-xl">
          {[
            { id: 'dark', name: 'DARK', bg: 'bg-black', text: 'text-white' },
            { id: 'light', name: 'LIGHT', bg: 'bg-white', text: 'text-black' },
            { id: 'blue', name: 'BLUE', bg: 'bg-blue-100', text: 'text-blue-900' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => {
                const root = window.document.documentElement;
                root.classList.remove('light', 'dark', 'blue');
                root.classList.add(t.id);
                localStorage.setItem('theme', t.id);
                window.location.reload();
              }}
              className={`h-14 md:h-20 rounded-xl border-2 transition-all flex flex-col items-center justify-center ${t.bg} ${theme === t.id ? 'border-blue-500 shadow-lg' : 'border-transparent opacity-60'}`}
            >
              <span className={`text-[8px] md:text-[9px] font-black ${t.text}`}>{t.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Video Rows - Strict Containers */}
      <div className="w-full px-4 md:px-12 space-y-8 overflow-hidden">
        {/* Trending */}
        {trending.length > 0 && (
          <section className="w-full overflow-hidden">
            <h2 className="text-xs md:text-sm font-black text-primary uppercase italic tracking-widest mb-3">Trending</h2>
            <Swiper
              modules={[FreeMode]}
              spaceBetween={10}
              slidesPerView={2.2}
              freeMode={true}
              breakpoints={{
                768: { slidesPerView: 3.5 },
                1024: { slidesPerView: 4.5 },
                1280: { slidesPerView: 5.5 }
              }}
              className="w-full overflow-visible"
            >
              {trending.map(v => (
                <SwiperSlide key={v.id}>
                  <VideoCard video={v} />
                </SwiperSlide>
              ))}
            </Swiper>
          </section>
        )}

        {/* Categories */}
        {Object.entries(categories).map(([cat, vids]) => (
          <section key={cat} className="w-full overflow-hidden">
            <h2 className="text-xs md:text-sm font-black text-primary uppercase italic tracking-widest mb-3">{cat}</h2>
            <Swiper
              modules={[FreeMode]}
              spaceBetween={10}
              slidesPerView={2.2}
              freeMode={true}
              breakpoints={{
                768: { slidesPerView: 3.5 },
                1024: { slidesPerView: 4.5 },
                1280: { slidesPerView: 5.5 }
              }}
              className="w-full overflow-visible"
            >
              {vids.map(v => (
                <SwiperSlide key={v.id}>
                  <VideoCard video={v} />
                </SwiperSlide>
              ))}
            </Swiper>
          </section>
        ))}
      </div>

      <div className="mt-12 text-center opacity-10 text-[7px] font-black uppercase tracking-[0.5em]">
        MACFEED v3.0.3
      </div>
    </motion.div>
  );
}
