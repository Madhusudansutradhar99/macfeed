import React, { useEffect, useState } from 'react';
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

  if (loading) return <Loader />;

  const categories = {};
  videos.forEach(v => {
    if (!v.category) return;
    if (!categories[v.category]) categories[v.category] = [];
    categories[v.category].push(v);
  });

  const trending = [...videos].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 12);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-32 pt-6">
      {/* ── HERO BANNER (v3.0.6 - Fixed Visibility) ── */}
      {heroVideos.length > 0 && (
        <section className="px-4 md:px-10 mb-12">
          <Swiper
            modules={[Autoplay, Pagination, EffectFade]}
            effect="fade"
            pagination={{ clickable: true }}
            autoplay={{ delay: 5000 }}
            loop={true}
            className="w-full h-[250px] md:h-[480px] rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-yellow-400/20"
          >
            {heroVideos.map(video => (
              <SwiperSlide key={video.id} onClick={() => navigate('/watch/' + video.id)} className="cursor-pointer">
                <div className="relative w-full h-full bg-black">
                  <img src={video.thumbnail_url} className="w-full h-full object-cover opacity-80" alt="" />
                  {/* Heavy Bottom Gradient for Text Visibility */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
                  
                  <div className="absolute bottom-8 left-8 right-8 md:bottom-16 md:left-16 md:right-16 z-20">
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                      <h2 className="text-white text-2xl md:text-5xl font-black italic uppercase tracking-tighter mb-4 md:mb-8 line-clamp-2 drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
                        {video.title}
                      </h2>
                      <button className="bg-yellow-400 text-blue-900 px-8 py-3 md:px-12 md:py-4 rounded-full font-black text-[12px] md:text-sm uppercase tracking-widest flex items-center gap-3 hover:bg-white hover:text-black transition-all shadow-[0_10px_30px_rgba(250,204,21,0.3)] active:scale-95">
                        <Play size={20} fill="currentColor" /> Watch Now
                      </button>
                    </motion.div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </section>
      )}

      {/* ── THEME SELECTOR ── */}
      <section className="px-4 md:px-10 mb-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-2 h-6 bg-blue-500 rounded-full" />
          <h2 className="text-primary text-2xl font-black uppercase italic tracking-tighter">SELECT <span className="text-blue-500">THEME</span></h2>
        </div>
        <div className="flex gap-4 md:gap-8 overflow-x-auto no-scrollbar pb-6 px-2">
          {[
            { id: 'dark', name: 'MIDNIGHT', bg: 'bg-[#1e293b]', border: 'border-white/20', text: 'text-white' },
            { id: 'light', name: 'DAYLIGHT', bg: 'bg-white', border: 'border-yellow-400', text: 'text-slate-500' },
            { id: 'blue', name: 'BLUE SKY', bg: 'bg-[#dbeafe]', border: 'border-blue-400', text: 'text-blue-900' }
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
                className={`min-w-[140px] md:min-w-[220px] h-36 md:h-48 rounded-[3rem] border-4 transition-all duration-500 flex flex-col items-center justify-center gap-4 shadow-2xl ${t.bg} ${isActive ? t.border + ' scale-105 ring-8 ring-yellow-400/10' : 'border-transparent opacity-60 hover:opacity-100'}`}
              >
                <span className={`text-[11px] md:text-sm font-black tracking-[0.2em] uppercase ${t.text}`}>{t.name}</span>
                {isActive && <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />}
              </button>
            )
          })}
        </div>
      </section>

      {/* ── VIDEO ROWS ── */}
      <div className="px-4 md:px-10 space-y-20">
        <section>
          <div className="flex items-center gap-3 mb-8">
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
            {trending.map(v => (
              <SwiperSlide key={v.id}><VideoCard video={v} /></SwiperSlide>
            ))}
          </Swiper>
        </section>

        {Object.entries(categories).map(([cat, vids]) => (
          <section key={cat}>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-2 h-8 bg-yellow-400 rounded-full shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
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
        MACFEED v3.0.6 - ABSOLUTE RESTORATION
      </div>
    </motion.div>
  );
}
