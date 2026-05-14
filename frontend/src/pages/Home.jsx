import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import VideoCard from '../components/VideoCard';
import Loader from '../components/Loader';
import { Play } from 'lucide-react';
import { motion } from 'framer-motion';
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
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="max-w-full overflow-x-hidden pb-32 pt-4 bg-primary"
    >
      {/* ── 1. HERO BANNER (As per Image) ── */}
      {heroVideos.length > 0 && (
        <section className="px-4 md:px-12 mb-10">
          <Swiper
            modules={[Autoplay, Pagination]}
            pagination={{ clickable: true }}
            autoplay={{ delay: 5000 }}
            className="w-full h-[220px] md:h-[400px] rounded-[2rem] overflow-hidden shadow-2xl border-2 border-accent/20"
          >
            {heroVideos.map(video => (
              <SwiperSlide key={video.id} onClick={() => navigate('/watch/' + video.id)}>
                <div className="relative w-full h-full bg-black">
                  <img src={video.thumbnail_url} className="w-full h-full object-cover" alt="" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <h2 className="text-white text-base md:text-2xl font-black italic uppercase tracking-tighter mb-4 line-clamp-1">{video.title}</h2>
                    <button className="bg-white text-black px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-yellow-500 transition-all">
                      <Play size={14} fill="black" /> PLAY NOW
                    </button>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </section>
      )}

      {/* ── 2. SELECT THEME (As per Image) ── */}
      <section className="px-4 md:px-12 mb-10">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-1 h-6 bg-blue-500 rounded-full" />
          <h1 className="text-primary text-xl font-black uppercase italic tracking-tighter">SELECT <span className="text-blue-500">THEME</span></h1>
        </div>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
          {[
            { id: 'dark', name: 'MIDNIGHT', bg: 'bg-[#4a4a4a]', text: 'text-white' },
            { id: 'light', name: 'DAYLIGHT', bg: 'bg-white', text: 'text-gray-400' },
            { id: 'blue', name: 'BLUE SKY', bg: 'bg-[#dbeafe]', text: 'text-blue-900', active: true }
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
              className={`min-w-[120px] md:min-w-[180px] h-28 md:h-36 rounded-[2rem] border-4 transition-all flex flex-col items-center justify-center gap-2 shadow-xl ${t.bg} ${theme === t.id ? 'border-yellow-400 scale-105' : 'border-transparent opacity-80'}`}
            >
              <span className={`text-xs md:text-sm font-black ${t.text}`}>{t.name}</span>
              {theme === t.id && <div className="w-2 h-2 rounded-full bg-blue-500" />}
            </button>
          ))}
        </div>
      </section>

      {/* ── 3. CATEGORY ROWS (As per Image) ── */}
      <div className="px-4 md:px-12 space-y-12">
        {/* Trending Now */}
        {trending.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">🔥</span>
              <h2 className="text-xl font-black text-primary uppercase italic tracking-tighter">Trending <span className="text-blue-500">Now</span></h2>
            </div>
            <Swiper
              modules={[FreeMode]}
              spaceBetween={15}
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

        {/* Dynamic Categories from DB */}
        {Object.entries(categories).map(([cat, vids]) => (
          <section key={cat}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-accent rounded-full" style={{ backgroundColor: 'var(--accent-color)' }} />
              <h2 className="text-xl font-black text-primary uppercase italic tracking-tighter">{cat}</h2>
            </div>
            <Swiper
              modules={[FreeMode]}
              spaceBetween={15}
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

      <div className="mt-20 text-center opacity-10 text-[8px] font-black uppercase tracking-[1em]">
        MACFEED v3.0.6 - RESTORED
      </div>
    </motion.div>
  );
}
