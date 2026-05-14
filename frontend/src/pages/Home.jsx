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
import { Autoplay, Pagination, FreeMode } from 'swiper/modules';
import 'swiper/css';
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
      {/* ── HERO BANNER (v3.0.6 Compact Proportions) ── */}
      {heroVideos.length > 0 && (
        <section className="px-4 md:px-10 mb-12">
          <Swiper
            modules={[Autoplay, Pagination]}
            pagination={{ clickable: true }}
            autoplay={{ delay: 5000 }}
            loop={true}
            className="w-full h-[240px] md:h-[450px] rounded-[2.5rem] overflow-hidden shadow-2xl border-2 border-white/5"
          >
            {heroVideos.map(video => (
              <SwiperSlide key={video.id} onClick={() => navigate('/watch/' + video.id)} className="cursor-pointer">
                <div className="relative w-full h-full bg-secondary">
                  <img src={video.thumbnail_url} className="w-full h-full object-cover" alt="" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6 md:bottom-12 md:left-12 md:right-12">
                    <h2 className="text-white text-xl md:text-4xl font-black italic uppercase tracking-tighter mb-4 md:mb-6 line-clamp-1 drop-shadow-2xl">{video.title}</h2>
                    <button className="bg-white text-black px-8 py-2.5 md:px-10 md:py-3.5 rounded-full font-black text-[10px] md:text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-yellow-400 transition-all shadow-2xl">
                      <Play size={16} fill="black" /> PLAY NOW
                    </button>
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
          <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
          <h2 className="text-primary text-xl font-black uppercase italic tracking-tighter">SELECT <span className="text-blue-500">THEME</span></h2>
        </div>
        <div className="flex gap-4 md:gap-8 overflow-x-auto no-scrollbar pb-4">
          {[
            { id: 'dark', name: 'MIDNIGHT', bg: 'bg-[#1e293b]', text: 'text-white' },
            { id: 'light', name: 'DAYLIGHT', bg: 'bg-white', text: 'text-slate-400' },
            { id: 'blue', name: 'BLUE SKY', bg: 'bg-blue-100', text: 'text-blue-900' }
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
              className={`min-w-[130px] md:min-w-[200px] h-32 md:h-40 rounded-[2.5rem] border-4 transition-all flex flex-col items-center justify-center gap-3 shadow-2xl ${t.bg} ${theme === t.id ? 'border-yellow-400 scale-105 ring-8 ring-yellow-400/10' : 'border-transparent opacity-60'}`}
            >
              <span className={`text-[10px] md:text-xs font-black tracking-widest ${t.text}`}>{t.name}</span>
              {theme === t.id && <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />}
            </button>
          ))}
        </div>
      </section>

      {/* ── VIDEO ROWS ── */}
      <div className="px-4 md:px-10 space-y-16">
        <section>
          <div className="flex items-center gap-3 mb-8">
            <Flame className="text-orange-500" fill="currentColor" />
            <h2 className="text-2xl font-black text-primary uppercase italic tracking-tighter">Trending <span className="text-blue-500">Now</span></h2>
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
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1.5 h-6 bg-yellow-400 rounded-full" />
              <h2 className="text-2xl font-black text-primary uppercase italic tracking-tighter">{cat}</h2>
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

      <div className="mt-32 text-center opacity-10 text-[8px] font-black uppercase tracking-[1.5em]">
        MACFEED v3.0.6 - ABSOLUTE RESTORATION
      </div>
    </motion.div>
  );
}
