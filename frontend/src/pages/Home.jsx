import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import VideoCard from '../components/VideoCard';
import Loader from '../components/Loader';
import { Play, Flame, Sparkles } from 'lucide-react';
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

  // Safe Categories Grouping
  const categories = useMemo(() => {
    const groups = {};
    if (!videos || !videos.length) return groups;
    videos.forEach(v => {
      const cat = v.category || 'YouTube';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(v);
    });
    return groups;
  }, [videos]);

  const trending = useMemo(() => {
    if (!videos || !videos.length) return [];
    return [...videos].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 12);
  }, [videos]);

  if (loading) return <Loader />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-32 pt-4 overflow-x-hidden">
      {/* ── 1. HERO BANNER ── */}
      {heroVideos.length > 0 && (
        <section className="px-4 md:px-10 mb-10">
          <Swiper
            modules={[Autoplay, Pagination, EffectFade]}
            effect="fade"
            pagination={{ clickable: true }}
            autoplay={{ delay: 5000 }}
            loop={true}
            className="w-full h-[220px] md:h-[450px] rounded-[2.5rem] overflow-hidden shadow-2xl border-2 border-yellow-400/10"
          >
            {heroVideos.map(video => (
              <SwiperSlide key={video.id} onClick={() => navigate('/watch/' + video.id)} className="cursor-pointer">
                <div className="relative w-full h-full bg-black">
                  <img src={video.thumbnail_url} className="w-full h-full object-cover opacity-90" alt="" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10" />
                  <div className="absolute bottom-6 left-6 right-6 md:bottom-12 md:left-12 md:right-12 z-20">
                    <h2 className="text-white text-lg md:text-4xl font-black italic uppercase tracking-tighter mb-4 line-clamp-1 drop-shadow-2xl">
                      {video.title}
                    </h2>
                    <button className="bg-yellow-400 text-blue-900 px-6 py-2 md:px-10 md:py-3.5 rounded-full font-black text-[10px] md:text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-white transition-all shadow-xl">
                      <Play size={14} fill="currentColor" /> WATCH NOW
                    </button>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </section>
      )}

      {/* ── 2. THEME SELECTOR ── */}
      <section className="px-4 md:px-10 mb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
          <h2 className="text-primary text-xl font-black uppercase italic tracking-tighter">SELECT <span className="text-blue-500">THEME</span></h2>
        </div>
        <div className="flex gap-4 md:gap-6 overflow-x-auto no-scrollbar pb-4">
          {[
            { id: 'dark', name: 'MIDNIGHT', bg: 'bg-slate-900', text: 'text-white' },
            { id: 'light', name: 'DAYLIGHT', bg: 'bg-white', text: 'text-slate-900' },
            { id: 'blue', name: 'BLUE SKY', bg: 'bg-blue-100', text: 'text-blue-900' }
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
                className={`min-w-[120px] md:min-w-[180px] h-28 md:h-36 rounded-[2rem] border-4 transition-all flex flex-col items-center justify-center gap-2 shadow-xl ${t.bg} ${isActive ? 'border-yellow-400 scale-105' : 'border-transparent opacity-70'}`}
              >
                <span className={`text-[10px] md:text-xs font-black tracking-widest ${t.text}`}>{t.name}</span>
                {isActive && <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />}
              </button>
            )
          })}
        </div>
      </section>

      {/* ── 3. VIDEO ROWS ── */}
      <div className="px-4 md:px-10 space-y-12">
        {trending.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <Flame className="text-orange-500" fill="currentColor" />
              <h2 className="text-xl font-black text-primary uppercase italic tracking-tighter">Trending <span className="text-blue-500">Now</span></h2>
            </div>
            <Swiper
              modules={[FreeMode]}
              spaceBetween={15}
              slidesPerView={2.3}
              freeMode={true}
              breakpoints={{
                768: { slidesPerView: 3.5 },
                1024: { slidesPerView: 5.5 }
              }}
              className="!overflow-visible"
            >
              {trending.map(v => (
                <SwiperSlide key={v.id}><VideoCard video={v} /></SwiperSlide>
              ))}
            </Swiper>
          </section>
        )}

        {Object.entries(categories).map(([cat, vids]) => (
          <section key={cat}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1.5 h-6 bg-yellow-400 rounded-full shadow-[0_0_10px_rgba(250,204,21,0.4)]" />
              <h2 className="text-xl font-black text-primary uppercase italic tracking-tighter">{cat}</h2>
            </div>
            <Swiper
              modules={[FreeMode]}
              spaceBetween={15}
              slidesPerView={2.3}
              freeMode={true}
              breakpoints={{
                768: { slidesPerView: 3.5 },
                1024: { slidesPerView: 5.5 }
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

      <div className="mt-20 text-center opacity-10 text-[8px] font-black uppercase tracking-[1em]">
        MACFEED v3.0.6 - FULL SYSTEM RESTORED
      </div>
    </motion.div>
  );
}
