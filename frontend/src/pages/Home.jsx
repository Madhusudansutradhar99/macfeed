import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Loader from '../components/Loader';
import { Play, ChevronRight, Sparkles } from 'lucide-react';

// Swiper only for the Hero
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

export default function Home() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('videos')
          .select('*')
          .order('created_at', { ascending: false });
        if (data) setVideos(data);
      } catch (e) {
        console.error('Home load error:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const heroVideos = useMemo(() => videos.filter(v => v.is_featured).slice(0, 8), [videos]);
  
  const categoriesMap = useMemo(() => {
    const groups = {};
    videos.forEach(v => {
      const cat = v.category || 'More Videos';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(v);
    });
    return groups;
  }, [videos]);

  if (loading) return <Loader />;

  return (
    <div className="w-full min-w-0 overflow-x-hidden text-white pb-40 min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      
      {/* ── PREMIUM HERO SECTION (Game Store Style) ── */}
      {heroVideos.length > 0 && (
        <section className="mb-10 px-4 md:px-10 mt-6">
          <Swiper
            modules={[Autoplay, Pagination]}
            autoplay={{ delay: 5000 }}
            pagination={{ clickable: true }}
            centeredSlides={true}
            slidesPerView={1}
            spaceBetween={20}
            loop={heroVideos.length > 1}
            className="w-full rounded-[2rem] overflow-hidden shadow-2xl h-[280px] md:h-[400px]"
            style={{ border: '3px solid var(--border-color)', boxShadow: '0 40px 100px rgba(0,0,0,0.4)' }}
          >
            {heroVideos.map(video => (
              <SwiperSlide key={video.id} onClick={() => navigate('/watch/' + video.id)} className="cursor-pointer">
                <div className="relative w-full h-full" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <img src={video.thumbnail_url} className="w-full h-full object-cover opacity-70" alt="" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="absolute bottom-8 left-8 right-8 z-20 space-y-4">
                    <h2 className="text-2xl md:text-4xl font-black uppercase mb-2 line-clamp-2 tracking-tighter drop-shadow-2xl" style={{ textShadow: '0 4px 12px rgba(0,0,0,0.8)' }}>{video.title}</h2>
                    <div className="flex gap-3 items-center">
                      <button className="px-8 py-3 rounded-lg font-black text-sm uppercase flex items-center gap-2 transition-all hover:scale-105" style={{ backgroundColor: 'var(--border-color)', color: 'white' }}>
                        <Play size={16} fill="currentColor" /> Watch Now
                      </button>
                      <button className="px-6 py-3 rounded-lg font-black text-sm uppercase border-2 transition-all hover:scale-105" style={{ borderColor: 'var(--border-color)', color: 'var(--border-color)' }}>
                        + More Info
                      </button>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </section>
      )}

      {/* ── TINY POSTER ROWS (Image 2 Style - Flix.id) ── */}
      <div className="w-full min-w-0 px-4 md:px-10 space-y-12">
        {Object.entries(categoriesMap).map(([cat, vids]) => (
          <section key={cat} className="w-full">
            <div className="flex items-center justify-between mb-5 border-l-4 pl-4" style={{ borderColor: 'var(--border-color)' }}>
              <h2 className="text-base md:text-lg font-black uppercase italic tracking-tighter" style={{ color: 'var(--text-primary)', opacity: 0.85 }}>{cat}</h2>
              <button className="text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-1" style={{ color: 'var(--border-color)' }}>
                Explore <ChevronRight size={12} />
              </button>
            </div>

            {/* Video Card Rows - Larger Cards */}
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-3">
              {vids.map(video => (
                <div 
                  key={video.id} 
                  onClick={() => navigate('/watch/' + video.id)} 
                  className="min-w-[220px] md:min-w-[260px] lg:min-w-[280px] cursor-pointer group"
                >
                  <div className="relative aspect-video rounded-[1.5rem] overflow-hidden mb-3 border-3 shadow-lg group-hover:shadow-2xl transition-all" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                    <img src={video.thumbnail_url} className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700" alt="" />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="p-3 rounded-full shadow-2xl" style={{ backgroundColor: 'var(--border-color)' }}><Play size={16} fill="white" /></div>
                    </div>
                  </div>
                  <h4 className="text-sm font-bold uppercase tracking-tight line-clamp-2 mb-2 transition-colors leading-tight" style={{ color: 'var(--text-primary)' }}>{video.title}</h4>
                  <div className="flex items-center justify-between text-xs font-bold uppercase" style={{ color: 'var(--text-primary)', opacity: 0.7 }}>
                    <span style={{ color: 'var(--border-color)' }}>★ 9.5</span>
                    <span>2024</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-40 text-center opacity-5 text-[7px] font-black uppercase tracking-[3em]">
        MACFEED ULTRA-TINY v5.6
      </div>
    </div>
  );
}
