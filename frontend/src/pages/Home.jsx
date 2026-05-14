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
  const [activeTab, setActiveTab] = useState('Trending');
  const navigate = useNavigate();
  const { theme } = useTheme();

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        console.log("Fetching Home Data...");
        const { data, error } = await supabase
          .from('videos')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data) {
          console.log("Data fetched:", data.length);
          setVideos(data);
          const featured = data.filter(v => v.is_featured);
          setHeroVideos(featured.length > 0 ? featured.slice(0, 5) : data.slice(0, 5));
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
      className="pb-32 pt-20"
    >
      {/* Hero Section */}
      {heroVideos.length > 0 && (
        <section className="px-4 md:px-12 mb-12">
          <Swiper
            modules={[Autoplay, Pagination, Navigation]}
            pagination={{ clickable: true }}
            autoplay={{ delay: 4000 }}
            className="w-full h-[200px] md:h-[450px] rounded-[2rem] overflow-hidden border-4 border-accent shadow-2xl"
            style={{ borderColor: 'var(--accent-color)' }}
          >
            {heroVideos.map(video => (
              <SwiperSlide key={video.id} onClick={() => navigate('/watch/' + video.id)}>
                <div className="relative w-full h-full bg-black">
                  <img src={video.thumbnail_url} className="w-full h-full object-cover opacity-80" alt="" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6 md:bottom-12 md:left-12">
                    <h2 className="text-white text-xl md:text-5xl font-black italic uppercase tracking-tighter mb-4 line-clamp-1">{video.title}</h2>
                    <button className="bg-white text-black px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                      <Play size={16} fill="black" /> PLAY NOW
                    </button>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </section>
      )}

      {/* Theme Selector */}
      <section className="px-4 md:px-12 mb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-6 bg-blue-500 rounded-full" />
          <h2 className="text-primary text-xl font-black uppercase tracking-tighter italic">SELECT <span className="text-blue-500">THEME</span></h2>
        </div>
        <div className="grid grid-cols-3 gap-4 max-w-4xl">
          {[
            { id: 'dark', name: 'MIDNIGHT', bg: 'bg-black', text: 'text-white' },
            { id: 'light', name: 'DAYLIGHT', bg: 'bg-white', text: 'text-black' },
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
              className={`h-20 md:h-32 rounded-3xl border-2 transition-all ${t.bg} ${theme === t.id ? 'border-blue-500 scale-105 shadow-xl' : 'border-transparent opacity-60'}`}
            >
              <span className={`text-[10px] md:text-xs font-black ${t.text}`}>{t.name}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="px-4 md:px-12 space-y-12">
        {/* Trending */}
        {trending.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🔥</span>
              <h2 className="text-xl font-black text-primary uppercase italic">Trending Now</h2>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
              {trending.map(v => (
                <div key={v.id} className="min-w-[160px] md:min-w-[280px]">
                  <VideoCard video={v} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Categories */}
        {Object.entries(categories).map(([cat, vids]) => (
          <div key={cat}>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xl font-black text-primary uppercase italic">{cat}</h2>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
              {vids.map(v => (
                <div key={v.id} className="min-w-[160px] md:min-w-[280px]">
                  <VideoCard video={v} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-20 text-center opacity-10 text-[10px] font-black uppercase tracking-[1em]">
        MACFEED STABLE v3.0.1
      </div>
    </motion.div>
  );
}
