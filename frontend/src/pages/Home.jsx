import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import VideoCard from '../components/VideoCard';
import Loader from '../components/Loader';
import AdBanner from '../components/AdBanner';
import { 
  Play, ArrowLeft, Music as MusicIcon, Search, Flame, Clock, Sparkles, 
  Download, Heart, ChevronLeft, ChevronRight, AlertTriangle, Folder, 
  Upload, Settings 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMusicPlayer } from '../context/MusicContext';
import PosterCard from '../components/PosterCard';
import CategoryPills from '../components/CategoryPills';
import { useTheme } from '../context/ThemeContext';

// Swiper imports
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination, Mousewheel, FreeMode } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/free-mode';

function formatViews(n) {
  if (!n) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

// ── CAKRABOLA Style Static Hero Banner ──
function HeroBanner({ videos }) {
  const navigate = useNavigate();
  
  if (!videos || !videos.length) return null;

  return (
    <div className="relative w-full mb-8 md:mb-16 select-none bg-[#000000]">
      <div className="max-w-[1600px] mx-auto px-2 md:px-4">
        <Swiper
          modules={[Autoplay, Pagination, Navigation]}
          spaceBetween={20}
          slidesPerView={1.2}
          centeredSlides={true}
          breakpoints={{
            768: { slidesPerView: 2, centeredSlides: false },
          }}
          pagination={{ clickable: true, el: '.hero-pagination' }}
          navigation={{
            prevEl: '.hero-prev',
            nextEl: '.hero-next',
          }}
          autoplay={{ delay: 2500, disableOnInteraction: false }}
          className="w-full"
        >
          {videos.map((video) => (
            <SwiperSlide key={video.id}>
              <div className="hero-card relative w-full h-[160px] md:h-[280px] flex flex-col justify-end overflow-hidden cursor-pointer group rounded-[1.5rem] md:rounded-[2.5rem] shadow-2xl border border-primary" onClick={() => navigate('/watch/' + video.id)}>
                
                {/* Full Fit Pro Thumbnail */}
                <div className="absolute inset-0 z-0 overflow-hidden bg-black">
                  <img 
                    src={video.thumbnail_url} 
                    alt={video.title} 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent z-20" />
                </div>

                {/* Ultra-Slim Bottom Glass Bar */}
                <div className="relative z-30 w-full bg-white/10 backdrop-blur-xl border-t border-white/10 px-5 md:px-8 py-2 md:py-3 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <h1 className="text-sm md:text-lg font-black italic text-white leading-tight uppercase tracking-tighter line-clamp-1">
                      {video.title}
                    </h1>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={(e) => { e.stopPropagation(); navigate('/watch/' + video.id); }} 
                        className="bg-white text-black font-black uppercase tracking-widest text-[8px] md:text-[10px] px-4 md:px-7 py-1.5 md:py-2.5 rounded-full flex items-center gap-2 hover:bg-yellow-500 transition-all"
                      >
                        <Play className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 fill-black" /> Play Now
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
          
          {/* Navigation Controls Overlay */}
          <div className="absolute top-1/2 -translate-y-1/2 left-6 right-6 z-40 hidden md:flex items-center justify-between pointer-events-none">
            <button className="hero-prev w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white flex items-center justify-center backdrop-blur-xl transition-all pointer-events-auto">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button className="hero-next w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white flex items-center justify-center backdrop-blur-xl transition-all pointer-events-auto">
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
          <div className="hero-pagination absolute bottom-6 right-10 z-40 flex items-center gap-2"></div>
        </Swiper>
      </div>

      {/* Hero section padding bottom */}
      <div className="pb-8"></div>
      
      {/* Custom Styles for Pagination */}
      <style>{`
        .hero-pagination .swiper-pagination-bullet {
          width: 8px !important;
          height: 8px !important;
          background: rgba(255, 255, 255, 0.3) !important;
          opacity: 1 !important;
          border-radius: 50% !important;
          transition: all 0.3s ease !important;
          margin: 0 4px !important;
        }
        .hero-pagination .swiper-pagination-bullet-active {
          background: #ff0000 !important;
          width: 24px !important;
          border-radius: 4px !important;
          box-shadow: 0 0 10px rgba(255, 0, 0, 0.5) !important;
        }
      `}</style>
    </div>
  );
}

// ── 3D Movies Section (Premium Scattered Grid) ──
function Movies3DSection({ title, videos }) {
  const navigate = useNavigate();
  if (!videos || !videos.length) return null;

  return (
    <div className="relative w-full bg-gradient-to-br from-[#001b2e] to-[#000d17] rounded-3xl py-6 px-4 md:px-8 mt-2 border border-blue-500/10 shadow-2xl overflow-hidden">
      {/* Background Subtle Label */}
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <h2 className="text-6xl font-black italic text-blue-500 uppercase">CINEMA</h2>
      </div>

      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
          <div>
            <h2 className="text-white text-xl sm:text-2xl font-black italic tracking-tighter uppercase leading-none">
              {title}
            </h2>
            <p className="text-blue-400 font-bold tracking-[0.2em] text-[8px] mt-1 uppercase">
              The MacFeed Experience
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/movies')}
          className="bg-blue-600/10 hover:bg-blue-600 border border-blue-500/20 text-white px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all active:scale-95"
        >
          View All
        </button>
      </div>

      {/* SWIPER FOR ALL VIDEOS */}
      <Swiper
        modules={[Navigation, FreeMode]}
        spaceBetween={15}
        slidesPerView={2.2}
        breakpoints={{
          640: { slidesPerView: 3.2 },
          768: { slidesPerView: 4.2 },
          1024: { slidesPerView: 5.2 }
        }}
        freeMode={true}
        className="w-full pb-2"
      >
        {videos.map((video) => (
          <SwiperSlide key={video.id}>
            <div 
                onClick={() => navigate(`/watch/${video.id}`)}
                className="relative aspect-video rounded-xl overflow-hidden border border-white/5 cursor-pointer group shadow-lg"
            >
                <img src={video.thumbnail_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-1 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-[8px] font-black uppercase italic truncate">{video.title}</p>
                </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}

// ── Horizontal Row ──
function VideoRow({ title, videos, emoji }) {
  const navigate = useNavigate();
  if (!videos.length) return null;

  // Create unique navigation class names for this specific row
  const safeTitle = (title || 'videos').replace(/\s+/g, '-').toLowerCase();
  const nextClass = `swiper-next-${safeTitle}`;
  const prevClass = `swiper-prev-${safeTitle}`;

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4 px-2">
        <h2 className="text-xl font-bold text-primary flex items-center gap-2">
          {emoji && <span className="text-2xl">{emoji}</span>}
          {title}
          <span className="text-sm font-normal text-secondary ml-2">({videos.length})</span>
        </h2>
        <div className="flex gap-2">
          <button className={`${prevClass} bg-secondary hover:bg-purple-600 text-primary rounded-full p-2 transition-all active:scale-90 border border-primary`}>
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button className={`${nextClass} bg-secondary hover:bg-purple-600 text-primary rounded-full p-2 transition-all active:scale-90 border border-primary`}>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <Swiper
        modules={[Navigation, Autoplay, Mousewheel, FreeMode]}
        spaceBetween={20}
        slidesPerView={1.5}
        breakpoints={{
          640: { slidesPerView: 2.2 },
          768: { slidesPerView: 3.2 },
          1024: { slidesPerView: 4.2 },
          1280: { slidesPerView: 5.2 }
        }}
        grabCursor={true}
        freeMode={{
          enabled: true,
          momentum: true,
          momentumRatio: 3.0,
          momentumVelocityRatio: 2.5,
          momentumBounce: false,
        }}
        speed={400}
        mousewheel={{
          forceToAxis: true,
          sensitivity: 2.5,
          releaseOnEdges: true,
        }}
        navigation={{
          prevEl: `.${prevClass}`,
          nextEl: `.${nextClass}`,
        }}
        className="px-2 !pt-10 !-mt-10 cursor-grab active:cursor-grabbing"
      >
        {videos.map((video) => (
          <SwiperSlide key={video.id}>
            <VideoCard video={video} />
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}

export default function Home() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [activeTab, setActiveTab] = useState('Trending');
  const observer = useRef();
  const PAGE_SIZE = 12;

  const fetchVideos = useCallback(async (pageIndex, isInitial = false) => {
    if (isInitial) setLoading(true);
    else setLoadingMore(true);

    const from = pageIndex * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .neq('category', 'Music')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (!error && data) {
      if (isInitial) {
        setVideos(data);
        localStorage.setItem('macfeed_home_cache', JSON.stringify(data));
      } else {
        setVideos((prev) => {
          // Prevent duplicates
          const newIds = new Set(data.map((d) => d.id));
          const filteredPrev = prev.filter((p) => !newIds.has(p.id));
          return [...filteredPrev, ...data];
        });
      }
      if (data.length < PAGE_SIZE) setHasMore(false);
      else setHasMore(true);
    }

    if (!isInitial) setLoadingMore(false);
  }, []);

  const lastVideoElementRef = useCallback(
    (node) => {
      if (loading || loadingMore) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        // Disable infinite scroll on mobile (screen width < 768px)
        const isMobile = window.innerWidth <= 768;
        if (entries[0].isIntersecting && !loadingMore && hasMore && !isMobile) {
          setPage((prevPage) => prevPage + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, loadingMore, hasMore]
  );

  // Handle page changes for infinite scroll
  useEffect(() => {
    if (page > 0) {
      fetchVideos(page, false);
    }
  }, [page, fetchVideos]);

  const [heroVideos, setHeroVideos] = useState([]);

  // Background sync hero videos if they appear in main list
  useEffect(() => {
    const featured = videos.filter(v => v.is_featured === true);
    if (featured.length > 0) {
      setHeroVideos(prev => {
        const existingIds = new Set(prev.map(v => v.id));
        const newOnes = featured.filter(v => !existingIds.has(v.id));
        if (newOnes.length > 0) return [...prev, ...newOnes];
        return prev;
      });
    }
  }, [videos]);

  useEffect(() => {
    async function init() {
      const cached = localStorage.getItem('macfeed_home_cache');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setVideos(parsed);
          setLoading(false); // Skip loader if we have cache
        } catch (e) { }
      } else {
        setLoading(true);
      }

      try {
        // Skip background fetch if offline and have cache
        if (!navigator.onLine && cached) return;

        // 1. Fetch Hero/Featured Videos specifically
        const { data: heroData, error: heroErr } = await supabase
          .from('videos')
          .select('*')
          .or('is_featured.eq.true,upload_location.ilike.%header%')
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (!heroErr && heroData && heroData.length > 0) {
          setHeroVideos(heroData);
        } else {
          // If dedicated fetch empty, try to extract from main feed as second attempt
          const { data: mainData } = await supabase
            .from('videos')
            .select('*')
            .eq('is_featured', true)
            .limit(5);
          if (mainData?.length) setHeroVideos(mainData);
        }

        // 2. Fetch main feed
        await fetchVideos(0, true);
      } catch (err) {
        console.error("Home Load Error:", err);
      } finally {
        setLoading(false);
      }
    }
    init();

    // ── Supabase Realtime ──
    const channel = supabase
      .channel('home-videos-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'videos' }, () => {
        setPage(0);
        fetchVideos(0, true);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchVideos]);

  if (loading) return <Loader />;

  // Group videos by category
  const categories = {};
  videos.forEach((v) => {
    if (!categories[v.category]) categories[v.category] = [];
    categories[v.category].push(v);
  });

  const CATEGORY_EMOJIS = {
    Movies: '🎬', Music: '🎵', Series: '📺', Shorts: '⚡', Gaming: '🎮', 
    Comedy: '😂', Sports: '⚽', Vlogs: '📹', Trending: '🔥', Cartoon: '🐼', 
    News: '📰', Viral: '🚀',
  };

  const trending = [...videos].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 10);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="flex flex-col"
    >
      <HeroBanner videos={heroVideos} />


      <div className="px-2 sm:px-4 lg:px-6 xl:px-8 space-y-3 sm:space-y-4 md:space-y-2">
        {/* Row 1: Trending */}
        {trending.length > 0 && <VideoRow title="Trending Now" videos={trending} emoji="🔥" />}

        {/* Dynamic Category Rows */}
        {Object.entries(categories).map(([cat, vids]) => {
          if (cat === 'Movies') {
            return <Movies3DSection key={cat} title={cat} videos={vids} />;
          }
          return (
            <VideoRow key={cat} title={cat} videos={vids} emoji={CATEGORY_EMOJIS[cat] || '🎥'} />
          );
        })}

        {/* Banner Ad */}
        <div className="py-2 sm:py-4">
          <AdBanner position="banner" />
        </div>

        {/* Infinite Scroll Grid: More to Explore - Premium Flix.id Style */}
        <section className="mt-32 mb-40 relative px-4 md:px-12">
          {/* Section Glow */}
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-full h-[500px] bg-blue-600/[0.03] blur-[150px] rounded-full pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-0.5 bg-blue-500 rounded-full" />
                    <span className="text-blue-500 text-[10px] font-black uppercase tracking-[0.5em]">Curated Content</span>
                  </div>
                  <h2 className="text-4xl md:text-7xl font-black italic uppercase tracking-tighter text-white leading-none">
                    More to <span className="text-blue-500">Explore</span>
                  </h2>
                </div>
                
                <div className="flex items-center gap-4">
                    <button className="more-prev w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:bg-white/10 transition-all active:scale-90 backdrop-blur-xl">
                      <ChevronLeft size={24}/>
                    </button>
                    <button className="more-next w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-blue-600 hover:border-blue-500 transition-all active:scale-90 backdrop-blur-xl">
                      <ChevronRight size={24}/>
                    </button>
                </div>
            </div>

            <div className="py-4 overflow-x-auto no-scrollbar">
              <CategoryPills activeCategory={activeTab} setCategory={setActiveTab} />
            </div>

            <Swiper
              modules={[Navigation, Autoplay, FreeMode]}
              spaceBetween={30}
              slidesPerView={2.2}
              breakpoints={{
                640: { slidesPerView: 3.2 },
                768: { slidesPerView: 4.2 },
                1024: { slidesPerView: 5.2 },
                1280: { slidesPerView: 6.2 }
              }}
              navigation={{
                prevEl: '.more-prev',
                nextEl: '.more-next',
              }}
              freeMode={true}
              grabCursor={true}
              touchEventsTarget="container"
              className="w-full !pt-10 !-mt-10 pb-10"
            >
              {videos.map((video, index) => {
                const isLast = videos.length === index + 1;
                return (
                  <SwiperSlide key={video.id} ref={isLast ? lastVideoElementRef : null}>
                    <PosterCard video={video} index={index} />
                  </SwiperSlide>
                );
              })}
            </Swiper>
          </div>

          {loadingMore && (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent-color)', borderTopColor: 'transparent' }} />
            </div>
          )}
        </section>
      </div>
    </motion.div>
  );
}
