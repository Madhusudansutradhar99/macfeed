import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import VideoCard from '../components/VideoCard';
import Loader from '../components/Loader';
import { Play, Flame, Sparkles, Layout } from 'lucide-react';
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
  const [heroVideos, setHeroVideos] = useState([]);
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

        if (data) {
          setVideos(data);
          const featured = data.filter(v => v.is_featured);
          setHeroVideos(featured.length > 0 ? featured.slice(0, 8) : data.slice(0, 8));
        }
      } catch (e) {
        console.error('Home load error:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const categoriesMap = useMemo(() => {
    const groups = {};
    if (!videos || !videos.length) return groups;
    videos.forEach(v => {
      const cat = v.category || 'General';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(v);
    });
    return groups;
  }, [videos]);

  const trendingVideos = useMemo(() => {
    if (!videos || !videos.length) return [];
    return [...videos].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 10);
  }, [videos]);

  if (loading) return <Loader />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-40 pt-4 overflow-x-hidden bg-primary">
      
      {/* ── SECTION 1: HERO BANNER (Cinematic) ── */}
      {heroVideos.length > 0 && (
        <section className="px-4 md:px-12 mb-12">
          <Swiper
            modules={[Autoplay, Pagination, EffectFade]}
            effect="fade"
            pagination={{ clickable: true }}
            autoplay={{ delay: 6000 }}
            loop={true}
            className="w-full h-[240px] md:h-[450px] rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-yellow-400/10"
          >
            {heroVideos.map(video => (
              <SwiperSlide key={video.id} onClick={() => navigate('/watch/' + video.id)} className="cursor-pointer">
                <div className="relative w-full h-full bg-black">
                  <img src={video.thumbnail_url} className="w-full h-full object-cover opacity-90" alt="" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
                  <div className="absolute bottom-8 left-8 right-8 z-20">
                    <span className="bg-yellow-400 text-black px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest mb-4 inline-block shadow-lg">SPOTLIGHT</span>
                    <h2 className="text-white text-xl md:text-5xl font-black italic uppercase tracking-tighter mb-6 line-clamp-1 drop-shadow-2xl">{video.title}</h2>
                    <button className="bg-yellow-400 text-blue-900 px-8 py-3 rounded-full font-black text-[11px] uppercase tracking-widest flex items-center gap-2 hover:bg-white hover:text-black transition-all shadow-xl">
                      <Play size={18} fill="currentColor" /> WATCH NOW
                    </button>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </section>
      )}

      {/* ── SECTION 2: THEME SELECTOR ── */}
      <section className="px-4 md:px-12 mb-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-2 h-7 bg-blue-500 rounded-full" />
          <h2 className="text-primary text-2xl font-black uppercase italic tracking-tighter">SELECT <span className="text-blue-500">THEME</span></h2>
        </div>
        <div className="flex gap-4 md:gap-8 overflow-x-auto no-scrollbar pb-4 px-2">
          {[
            { id: 'dark', name: 'MIDNIGHT', bg: 'bg-[#1a1c2c]', text: 'text-white' },
            { id: 'light', name: 'DAYLIGHT', bg: 'bg-white', text: 'text-slate-600' },
            { id: 'blue', name: 'BLUE SKY', bg: 'bg-[#e0f2fe]', text: 'text-blue-900' }
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
                className={`min-w-[140px] md:min-w-[220px] h-36 md:h-48 rounded-[3rem] border-4 transition-all duration-300 flex flex-col items-center justify-center gap-4 shadow-2xl ${t.bg} ${isActive ? 'border-yellow-400 scale-105 ring-8 ring-yellow-400/10' : 'border-transparent opacity-60 hover:opacity-100'}`}
              >
                <span className={`text-[11px] md:text-sm font-black tracking-[0.2em] uppercase ${t.text}`}>{t.name}</span>
                {isActive && <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />}
              </button>
            )
          })}
        </div>
      </section>

      {/* ── SECTION 3: TRENDING NOW ── */}
      <div className="px-4 md:px-12 space-y-20">
        {trendingVideos.length > 0 && (
          <section>
            <div className="flex items-center gap-4 mb-8">
              <Flame className="text-orange-500 w-8 h-8" fill="currentColor" />
              <h2 className="text-2xl md:text-3xl font-black text-primary uppercase italic tracking-tighter">Trending <span className="text-blue-500">Now</span></h2>
            </div>
            <Swiper
              modules={[FreeMode]}
              spaceBetween={20}
              slidesPerView={2.3}
              freeMode={true}
              breakpoints={{
                768: { slidesPerView: 3.5 },
                1280: { slidesPerView: 5.5 }
              }}
              className="!overflow-visible"
            >
              {trendingVideos.map(v => (
                <SwiperSlide key={v.id}><VideoCard video={v} /></SwiperSlide>
              ))}
            </Swiper>
          </section>
        )}

        {/* ── SECTION 4: DYNAMIC CATEGORY ROWS ── */}
        {Object.entries(categoriesMap).map(([cat, vids]) => (
          <section key={cat}>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-2 h-8 bg-yellow-400 rounded-full shadow-[0_0_15px_rgba(250,204,21,0.4)]" />
              <h2 className="text-2xl md:text-3xl font-black text-primary uppercase italic tracking-tighter">{cat}</h2>
            </div>
            <Swiper
              modules={[FreeMode]}
              spaceBetween={20}
              slidesPerView={2.3}
              freeMode={true}
              breakpoints={{
                768: { slidesPerView: 3.5 },
                1280: { slidesPerView: 5.5 }
              }}
              className="!overflow-visible"
            >
              {vids.map(v => (
                <SwiperSlide key={v.id}><VideoCard video={v} /></SwiperSlide>
              ))}
            </Swiper>
          </section>
        ))}
      </div>

      <div className="mt-40 text-center opacity-10 text-[9px] font-black uppercase tracking-[2em]">
        MACFEED v3.0.6 - VISIBILITY FIXED
      </div>
    </motion.div>
  );
}
