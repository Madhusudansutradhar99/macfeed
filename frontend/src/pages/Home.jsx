import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import VideoCard from '../components/VideoCard';
import Loader from '../components/Loader';
import { Play, Flame, Star, LayoutGrid, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, FreeMode } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export default function Home() {
  const [videos, setVideos] = useState([]);
  const [heroVideos, setHeroVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

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

  // Group by category
  const categories = {};
  videos.forEach((v) => {
    if (!v.category) return;
    if (!categories[v.category]) categories[v.category] = [];
    categories[v.category].push(v);
  });

  const trending = [...videos].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 10);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="max-w-full overflow-x-hidden pb-32 pt-4 bg-primary min-h-screen"
    >
      {/* ── 1. PREMIUM HERO BANNER ── */}
      {heroVideos.length > 0 && (
        <section className="px-4 md:px-12 mb-16">
          <Swiper
            modules={[Autoplay, Pagination]}
            pagination={{ clickable: true }}
            autoplay={{ delay: 6000 }}
            className="w-full h-[250px] md:h-[450px] rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10"
          >
            {heroVideos.map(video => (
              <SwiperSlide key={video.id} onClick={() => navigate('/watch/' + video.id)} className="cursor-pointer">
                <div className="relative w-full h-full group">
                  <img src={video.thumbnail_url} className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" alt="" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                  <div className="absolute bottom-10 left-10 right-10 flex flex-col items-start gap-4">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 px-3 py-1 bg-accent rounded-full text-[8px] font-black uppercase tracking-widest text-white shadow-xl">
                      <Flame size={12} fill="white" /> Featured Content
                    </motion.div>
                    <h2 className="text-white text-2xl md:text-5xl font-black italic uppercase tracking-tighter leading-none max-w-2xl drop-shadow-2xl">{video.title}</h2>
                    <button className="bg-white text-black px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-accent hover:text-white transition-all transform hover:scale-105 active:scale-95 shadow-2xl">
                      <Play size={18} fill="currentColor" /> Watch Now
                    </button>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </section>
      )}

      {/* ── 2. DYNAMIC THEME ENGINE ── */}
      <section className="px-4 md:px-12 mb-16">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-2 h-8 bg-accent rounded-full" />
            <h1 className="text-primary text-2xl font-black uppercase italic tracking-tighter">Experience <span className="text-accent">Modes</span></h1>
          </div>
          <div className="hidden md:flex items-center gap-2 text-secondary text-[10px] font-bold uppercase tracking-widest opacity-50">
            <Palette size={14} /> Personalize your view
          </div>
        </div>
        <div className="flex gap-6 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4 md:mx-0 md:px-0">
          {[
            { id: 'dark', name: 'NIGHT OWL', bg: 'bg-[#0a0a0a]', text: 'text-white/40', accent: 'bg-white' },
            { id: 'light', name: 'DAYLIGHT', bg: 'bg-white', text: 'text-black/40', accent: 'bg-red-500' },
            { id: 'blue', name: 'OCEANIC', bg: 'bg-[#dbeafe]', text: 'text-blue-900/40', accent: 'bg-blue-600' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => {
                const root = window.document.documentElement;
                root.classList.remove('light', 'dark', 'blue');
                root.classList.add(t.id);
                localStorage.setItem('theme', t.id);
                if(setTheme) setTheme(t.id);
                else window.location.reload();
              }}
              className={`relative min-w-[150px] md:min-w-[220px] h-32 md:h-40 rounded-[2.5rem] border-2 transition-all duration-500 flex flex-col items-center justify-center gap-3 shadow-2xl overflow-hidden group ${t.bg} ${theme === t.id ? 'border-accent scale-105 ring-4 ring-accent/20' : 'border-white/5 opacity-60 grayscale hover:grayscale-0 hover:opacity-100'}`}
            >
              <div className={`absolute top-0 left-0 w-full h-1 ${t.accent}`} />
              <span className={`text-[10px] md:text-xs font-black tracking-[0.2em] uppercase transition-colors ${theme === t.id ? 'text-accent' : t.text}`}>{t.name}</span>
              <div className={`w-3 h-3 rounded-full transition-all duration-500 ${theme === t.id ? 'bg-accent scale-125' : 'bg-white/10'}`} />
            </button>
          ))}
        </div>
      </section>

      {/* ── 3. CURATED COLLECTIONS ── */}
      <div className="px-4 md:px-12 space-y-20">
        {/* Trending Now */}
        {trending.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <Flame className="w-8 h-8 text-accent animate-pulse" />
                <h2 className="text-2xl font-black text-primary uppercase italic tracking-tighter">Global <span className="text-accent">Trending</span></h2>
              </div>
              <button onClick={() => navigate('/trending')} className="text-accent text-[10px] font-black uppercase tracking-widest hover:underline">View All</button>
            </div>
            <Swiper
              modules={[FreeMode]}
              spaceBetween={20}
              slidesPerView={2.2}
              freeMode={true}
              breakpoints={{
                768: { slidesPerView: 3.5 },
                1024: { slidesPerView: 4.5 },
                1280: { slidesPerView: 5.5 }
              }}
              className="w-full !overflow-visible"
            >
              {trending.map(v => (
                <SwiperSlide key={v.id}>
                  <VideoCard video={v} />
                </SwiperSlide>
              ))}
            </Swiper>
          </section>
        )}

        {/* Dynamic Categories */}
        {Object.entries(categories).map(([cat, vids]) => (
          <section key={cat}>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <LayoutGrid className="w-7 h-7 text-secondary opacity-50" />
                <h2 className="text-2xl font-black text-primary uppercase italic tracking-tighter">{cat}</h2>
              </div>
            </div>
            <Swiper
              modules={[FreeMode]}
              spaceBetween={20}
              slidesPerView={2.2}
              freeMode={true}
              breakpoints={{
                768: { slidesPerView: 3.5 },
                1024: { slidesPerView: 4.5 },
                1280: { slidesPerView: 5.5 }
              }}
              className="w-full !overflow-visible"
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

      {/* FOOTER METADATA */}
      <div className="mt-32 border-t border-white/5 pt-12 pb-20 text-center">
        <div className="flex items-center justify-center gap-4 mb-6 opacity-20">
            <div className="h-[1px] w-12 bg-white" />
            <LayoutGrid size={16} className="text-white" />
            <div className="h-[1px] w-12 bg-white" />
        </div>
        <p className="text-secondary text-[8px] font-black uppercase tracking-[0.8em] opacity-30">
          MACFEED ADVANCED PLAYER v3.1.0 • PREMIUM EDITION
        </p>
      </div>
    </motion.div>
  );
}
