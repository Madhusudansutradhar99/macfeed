import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import VideoCard from '../components/VideoCard';
import Loader from '../components/Loader';
import { Play, Flame, Layout, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

// Swiper imports
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, FreeMode, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

export default function Home() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const themeContext = useTheme();
  const theme = themeContext?.theme || 'dark';

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('videos')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) setVideos(data);
      } catch (e) {
        console.error('Data Fetch Error:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // ── LOGIC: HERO VIDEOS ──
  const heroVideos = useMemo(() => {
    const featured = videos.filter(v => v.is_featured);
    return featured.length > 0 ? featured.slice(0, 10) : videos.slice(0, 10);
  }, [videos]);

  // ── LOGIC: CATEGORIES ──
  const categoriesMap = useMemo(() => {
    const groups = {};
    if (!videos || !videos.length) return groups;
    videos.forEach(v => {
      const cat = v.category || 'More Videos';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(v);
    });
    return groups;
  }, [videos]);

  // ── LOGIC: TRENDING ──
  const trending = useMemo(() => {
    return [...videos].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 12);
  }, [videos]);

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-primary pb-40 pt-4 overflow-x-hidden">
      {/* 1. HERO BANNER */}
      {heroVideos.length > 0 && (
        <section className="px-4 md:px-12 mb-12">
          <Swiper
            modules={[Autoplay, Pagination, EffectFade]}
            effect="fade"
            pagination={{ clickable: true }}
            autoplay={{ delay: 5000 }}
            loop={heroVideos.length > 1}
            className="w-full h-[240px] md:h-[450px] rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-yellow-400/10"
          >
            {heroVideos.map(video => (
              <SwiperSlide key={video.id} onClick={() => navigate('/watch/' + video.id)} className="cursor-pointer">
                <div className="relative w-full h-full bg-black">
                  <img src={video.thumbnail_url} className="w-full h-full object-cover opacity-80" alt="" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent z-10" />
                  <div className="absolute bottom-8 left-8 right-8 z-20">
                    <span className="bg-yellow-400 text-black px-2 py-0.5 rounded text-[8px] font-black uppercase mb-3 inline-block">Featured</span>
                    <h2 className="text-white text-xl md:text-5xl font-black italic uppercase tracking-tighter mb-6 line-clamp-1 drop-shadow-2xl">{video.title}</h2>
                    <button className="bg-yellow-400 text-blue-900 px-8 py-3 rounded-full font-black text-[11px] uppercase tracking-widest flex items-center gap-2 shadow-xl">
                      <Play size={18} fill="currentColor" /> WATCH NOW
                    </button>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </section>
      )}

      {/* 2. THEME SELECTOR */}
      <section className="px-4 md:px-12 mb-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
          <h2 className="text-primary text-xl font-black uppercase italic tracking-tighter">THEME <span className="text-blue-500">PICKER</span></h2>
        </div>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
          {['dark', 'light', 'blue'].map(id => (
            <button
              key={id}
              onClick={() => {
                const root = window.document.documentElement;
                root.classList.remove('light', 'dark', 'blue');
                root.classList.add(id);
                localStorage.setItem('theme', id);
                window.location.reload();
              }}
              className={`min-w-[130px] md:min-w-[180px] h-32 rounded-[2rem] border-4 transition-all flex flex-col items-center justify-center gap-2 shadow-xl ${id === 'dark' ? 'bg-slate-900' : id === 'light' ? 'bg-white' : 'bg-blue-100'} ${theme === id ? 'border-yellow-400 scale-105' : 'border-transparent opacity-60'}`}
            >
              <span className={`text-[10px] font-black tracking-widest uppercase ${id === 'light' ? 'text-slate-600' : 'text-primary'}`}>{id} MODE</span>
              {theme === id && <div className="w-2 h-2 rounded-full bg-blue-500" />}
            </button>
          ))}
        </div>
      </section>

      {/* 3. VIDEO CONTENT */}
      <div className="px-4 md:px-12 space-y-20">
        {/* Trending Row */}
        {trending.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-8">
              <Flame className="text-orange-500 w-8 h-8" fill="currentColor" />
              <h2 className="text-2xl font-black text-primary uppercase italic tracking-tighter">Trending <span className="text-blue-500">Videos</span></h2>
            </div>
            <Swiper
              modules={[FreeMode]}
              spaceBetween={15}
              slidesPerView={2.2}
              freeMode={true}
              breakpoints={{ 768: { slidesPerView: 3.5 }, 1280: { slidesPerView: 5.5 } }}
              className="!overflow-visible"
            >
              {trending.map(v => (
                <SwiperSlide key={v.id}><VideoCard video={v} /></SwiperSlide>
              ))}
            </Swiper>
          </section>
        )}

        {/* Dynamic Categories */}
        {Object.entries(categoriesMap).map(([cat, vids]) => (
          <section key={cat}>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-2 h-7 bg-yellow-400 rounded-full shadow-[0_0_10px_rgba(250,204,21,0.5)]" />
              <h2 className="text-2xl font-black text-primary uppercase italic tracking-tighter">{cat}</h2>
            </div>
            <Swiper
              modules={[FreeMode]}
              spaceBetween={15}
              slidesPerView={2.2}
              freeMode={true}
              breakpoints={{ 768: { slidesPerView: 3.5 }, 1280: { slidesPerView: 5.5 } }}
              className="!overflow-visible"
            >
              {vids.map(v => (
                <SwiperSlide key={v.id}><VideoCard video={v} /></SwiperSlide>
              ))}
            </Swiper>
          </section>
        ))}
      </div>

      <div className="mt-40 text-center opacity-10 text-[8px] font-black uppercase tracking-[1em]">
        MACFEED v3.0.6 - DEPLOYMENT FIXED
      </div>
    </div>
  );
}
