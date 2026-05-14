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
      className="pb-32 pt-2"
    >
      {/* Hero Section - Compact CAKRABOLA Style */}
      {heroVideos.length > 0 && (
        <section className="px-4 md:px-12 mb-8 mt-2">
          <Swiper
            modules={[Autoplay, Pagination, Navigation]}
            pagination={{ clickable: true }}
            autoplay={{ delay: 4000 }}
            spaceBetween={15}
            slidesPerView={1.1}
            centeredSlides={true}
            breakpoints={{
              768: { slidesPerView: 1.5, centeredSlides: false },
              1024: { slidesPerView: 2.2 },
            }}
            className="w-full h-[180px] md:h-[320px] rounded-2xl md:rounded-[2rem] overflow-hidden shadow-2xl"
          >
            {heroVideos.map(video => (
              <SwiperSlide key={video.id} onClick={() => navigate('/watch/' + video.id)}>
                <div className="relative w-full h-full bg-black rounded-2xl md:rounded-[2rem] overflow-hidden border-2 border-accent/20" style={{ borderColor: 'var(--accent-color)44' }}>
                  <img src={video.thumbnail_url} className="w-full h-full object-cover opacity-80" alt="" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8 right-4">
                    <h2 className="text-white text-sm md:text-3xl font-black italic uppercase tracking-tighter mb-2 line-clamp-1">{video.title}</h2>
                    <button className="bg-white text-black px-4 py-1.5 md:px-6 md:py-2 rounded-full font-black text-[8px] md:text-[10px] uppercase tracking-widest flex items-center gap-2">
                      <Play size={12} fill="black" /> PLAY NOW
                    </button>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </section>
      )}

      {/* Theme Selector - Compact Cards */}
      <section className="px-4 md:px-12 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 bg-blue-500 rounded-full" />
          <h2 className="text-primary text-sm md:text-lg font-black uppercase tracking-tighter italic">CHOOSE <span className="text-blue-500">STYLE</span></h2>
        </div>
        <div className="grid grid-cols-3 gap-3 max-w-2xl">
          {[
            { id: 'dark', name: 'MIDNIGHT', bg: 'bg-black', border: 'border-white/10', text: 'text-white' },
            { id: 'light', name: 'DAYLIGHT', bg: 'bg-white', border: 'border-red-500', text: 'text-black' },
            { id: 'blue', name: 'BLUE SKY', bg: 'bg-blue-100', border: 'border-yellow-400', text: 'text-blue-900' }
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
              className={`h-16 md:h-24 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1 ${t.bg} ${theme === t.id ? t.border + ' scale-[1.03] shadow-lg' : 'border-transparent opacity-60'}`}
            >
              <span className={`text-[8px] md:text-[10px] font-black ${t.text}`}>{t.name}</span>
              {theme === t.id && <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />}
            </button>
          ))}
        </div>
      </section>

      <div className="px-4 md:px-12 space-y-8">
        {/* Trending */}
        {trending.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🔥</span>
              <h2 className="text-sm md:text-base font-black text-primary uppercase italic tracking-widest">Trending</h2>
            </div>
            <Swiper
              modules={[FreeMode]}
              spaceBetween={12}
              slidesPerView={2.2}
              freeMode={true}
              breakpoints={{
                768: { slidesPerView: 3.2 },
                1024: { slidesPerView: 4.2 },
                1280: { slidesPerView: 5.2 }
              }}
              className="w-full"
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
          <section key={cat}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-4 bg-accent rounded-full" style={{ backgroundColor: 'var(--accent-color)' }} />
              <h2 className="text-sm md:text-base font-black text-primary uppercase italic tracking-widest">{cat}</h2>
            </div>
            <Swiper
              modules={[FreeMode]}
              spaceBetween={12}
              slidesPerView={2.2}
              freeMode={true}
              breakpoints={{
                768: { slidesPerView: 3.2 },
                1024: { slidesPerView: 4.2 },
                1280: { slidesPerView: 5.2 }
              }}
              className="w-full"
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

      <div className="mt-20 text-center opacity-20 text-[8px] font-black uppercase tracking-[0.5em]">
        MACFEED STABLE v3.0.2
      </div>
    </motion.div>
  );
}
