import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import VideoCard from '../components/VideoCard';
import Loader from '../components/Loader';
import AdBanner from '../components/AdBanner';
import { 
  Play, ChevronLeft, ChevronRight, Music as MusicIcon
} from 'lucide-react';
import { motion } from 'framer-motion';
import PosterCard from '../components/PosterCard';
import CategoryPills from '../components/CategoryPills';

// Swiper imports
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination, Mousewheel, FreeMode } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/free-mode';

// ── Hero Banner ──
function HeroBanner({ videos }) {
  const navigate = useNavigate();
  if (!videos || !videos.length) return null;

  return (
    <div className="relative w-full mb-12 select-none">
      <Swiper
        modules={[Autoplay, Pagination, Navigation]}
        spaceBetween={20}
        slidesPerView={1.2}
        centeredSlides={true}
        breakpoints={{
          768: { slidesPerView: 2, centeredSlides: false },
        }}
        autoplay={{ delay: 3000 }}
        className="w-full h-[200px] md:h-[400px]"
      >
        {videos.map((video) => (
          <SwiperSlide key={video.id}>
            <div 
              onClick={() => navigate('/watch/' + video.id)}
              className="relative w-full h-full rounded-[2rem] overflow-hidden cursor-pointer group border border-white/10"
            >
              <img src={video.thumbnail_url} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <h2 className="text-xl md:text-4xl font-black italic uppercase tracking-tighter text-white line-clamp-1">{video.title}</h2>
                <button className="mt-4 bg-white text-black px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest flex items-center gap-2">
                  <Play className="w-4 h-4 fill-black" /> Play Now
                </button>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}

// ── 3D Movies Section ──
function Movies3DSection({ title, videos }) {
  const navigate = useNavigate();
  if (!videos || !videos.length) return null;

  return (
    <div className="relative w-full bg-gradient-to-br from-blue-900/20 to-black rounded-3xl py-8 px-6 mb-12 border border-blue-500/10 overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter">{title}</h2>
        <button onClick={() => navigate('/movies')} className="text-blue-500 font-black text-[10px] uppercase tracking-widest hover:text-white transition-colors">View All</button>
      </div>
      <Swiper
        modules={[FreeMode]}
        spaceBetween={20}
        slidesPerView={2.2}
        breakpoints={{
          768: { slidesPerView: 4.2 },
          1024: { slidesPerView: 5.2 }
        }}
        freeMode={true}
      >
        {videos.map((video) => (
          <SwiperSlide key={video.id}>
            <div onClick={() => navigate(`/watch/${video.id}`)} className="relative aspect-video rounded-2xl overflow-hidden border border-white/5 cursor-pointer group">
              <img src={video.thumbnail_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all" />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}

// ── Standard Video Row ──
function VideoRow({ title, videos, emoji }) {
  if (!videos.length) return null;
  const safeTitle = (title || 'row').replace(/\s+/g, '-').toLowerCase();

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6 px-2">
        <h2 className="text-xl font-black text-white uppercase italic tracking-tighter flex items-center gap-2">
          {emoji && <span className="text-2xl">{emoji}</span>}
          {title}
          <span className="text-xs font-normal text-white/40 ml-2">({videos.length})</span>
        </h2>
      </div>

      <Swiper
        modules={[FreeMode, Navigation]}
        spaceBetween={20}
        slidesPerView={1.5}
        breakpoints={{
          640: { slidesPerView: 2.2 },
          768: { slidesPerView: 3.2 },
          1024: { slidesPerView: 4.2 }
        }}
        freeMode={true}
        className="px-2"
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
  const [heroVideos, setHeroVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Trending');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('videos')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (data) {
          setVideos(data);
          const featured = data.filter(v => v.is_featured);
          setHeroVideos(featured.length > 0 ? featured.slice(0, 5) : data.slice(0, 5));
        }
      } catch (e) {
        console.error(e);
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

  const CATEGORY_EMOJIS = {
    Movies: '🎬', Music: '🎵', Series: '📺', Shorts: '⚡', Gaming: '🎮', 
    Comedy: '😂', Sports: '⚽', Trending: '🔥'
  };

  const trending = [...videos].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 10);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-20">
      <HeroBanner videos={heroVideos} />

      <div className="px-4 md:px-8">
        {trending.length > 0 && <VideoRow title="Trending Now" videos={trending} emoji="🔥" />}

        {Object.entries(categories).map(([cat, vids]) => {
          if (cat === 'Movies') return <Movies3DSection key={cat} title={cat} videos={vids} />;
          return <VideoRow key={cat} title={cat} videos={vids} emoji={CATEGORY_EMOJIS[cat] || '🎥'} />;
        })}

        <div className="py-8"><AdBanner position="banner" /></div>

        <section className="mt-20">
          <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-white mb-12">More to <span className="text-blue-500">Explore</span></h2>
          <div className="mb-8 overflow-x-auto no-scrollbar">
            <CategoryPills activeCategory={activeTab} setCategory={setActiveTab} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {videos.map((video, index) => (
              <PosterCard key={video.id} video={video} index={index} />
            ))}
          </div>
        </section>
      </div>
    </motion.div>
  );
}
