import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import VideoCard from '../components/VideoCard';
import Loader from '../components/Loader';
import AdBanner from '../components/AdBanner';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PosterCard from '../components/PosterCard';
import CategoryPills from '../components/CategoryPills';

// ── Hero Banner (Native Framer Motion) ──
function HeroBanner({ videos }) {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!videos.length) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % videos.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [videos.length]);

  if (!videos || !videos.length) return null;
  const video = videos[index];

  return (
    <div className="relative w-full h-[180px] md:h-[350px] mb-8 px-4 select-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={video.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.8 }}
          onClick={() => navigate('/watch/' + video.id)}
          className="relative w-full h-full rounded-[2.5rem] overflow-hidden cursor-pointer border border-white/10 group shadow-2xl"
        >
          <img src={video.thumbnail_url} className="absolute inset-0 w-full h-full object-cover" alt="" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
          
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
            <motion.h2 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-2xl md:text-5xl font-black italic uppercase tracking-tighter text-white line-clamp-1"
            >
              {video.title}
            </motion.h2>
            <motion.button 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-6 bg-white text-black px-10 py-3.5 rounded-full font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:scale-105 transition-transform"
            >
              <Play className="w-4 h-4 fill-black" /> Play Now
            </motion.button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Pagination Dots */}
      <div className="absolute bottom-6 right-12 flex gap-2 z-10">
        {videos.map((_, i) => (
          <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === index ? 'w-8 bg-white' : 'w-2 bg-white/20'}`} />
        ))}
      </div>
    </div>
  );
}

// ── Standard Video Row (Native Scroll) ──
function VideoRow({ title, videos, emoji }) {
  const scrollRef = useRef(null);
  if (!videos.length) return null;

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-6 px-4">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-8 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
          <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter flex items-center gap-2">
            {emoji && <span className="text-3xl">{emoji}</span>}
            {title}
            <span className="text-xs font-normal text-white/40 ml-2 tracking-widest italic">({videos.length})</span>
          </h2>
        </div>
        <div className="flex gap-2">
          <button onClick={() => scrollRef.current?.scrollBy({ left: -300, behavior: 'smooth' })} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all active:scale-90">
            <ChevronLeft size={20} />
          </button>
          <button onClick={() => scrollRef.current?.scrollBy({ left: 300, behavior: 'smooth' })} className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-blue-600 transition-all active:scale-90">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex gap-6 overflow-x-auto no-scrollbar px-4 pb-4 scroll-smooth snap-x snap-mandatory">
        {videos.map((video) => (
          <div key={video.id} className="min-w-[280px] sm:min-w-[340px] flex-shrink-0 snap-start">
            <VideoCard video={video} />
          </div>
        ))}
      </div>
    </section>
  );
}

// ── 3D Movies Section (Premium Grid) ──
function Movies3DSection({ title, videos }) {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  if (!videos || !videos.length) return null;

  return (
    <div className="relative w-full bg-gradient-to-br from-blue-950/40 via-black to-black rounded-[2rem] py-8 px-6 mb-10 border border-white/5 shadow-3xl overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter leading-none">{title}</h2>
          <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.4em] mt-2">Premium Cinema Experience</p>
        </div>
        <button onClick={() => navigate('/movies')} className="bg-white/5 hover:bg-white/10 px-6 py-2 rounded-xl text-white font-black text-[10px] uppercase tracking-widest transition-all">View All</button>
      </div>

      <div ref={scrollRef} className="flex gap-6 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory">
        {videos.map((video) => (
          <div 
            key={video.id} 
            onClick={() => navigate(`/watch/${video.id}`)}
            className="min-w-[220px] md:min-w-[300px] aspect-video rounded-2xl overflow-hidden border border-white/10 cursor-pointer group shadow-2xl snap-start flex-shrink-0"
          >
            <img src={video.thumbnail_url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ))}
      </div>
    </div>
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
          .limit(60);

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
    Movies: '🎬', Music: '🎵', Series: '📺', Shorts: '⚡', Gaming: '🎮', Comedy: '😂', Sports: '⚽'
  };

  const trending = [...videos].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 10);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-32 pt-4">
      <HeroBanner videos={heroVideos} />

      <div className="px-2 md:px-6">
        {trending.length > 0 && <VideoRow title="Trending Now" videos={trending} emoji="🔥" />}

        {Object.entries(categories).map(([cat, vids]) => {
          if (cat === 'Movies') return <Movies3DSection key={cat} title={cat} videos={vids} />;
          return <VideoRow key={cat} title={cat} videos={vids} emoji={CATEGORY_EMOJIS[cat] || '🎥'} />;
        })}

        <div className="py-12"><AdBanner position="banner" /></div>

        <section className="mt-12 px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-1 bg-blue-500 rounded-full" />
                <span className="text-blue-500 text-xs font-black uppercase tracking-[0.6em]">Curated</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter text-white leading-none">
                More to <span className="text-blue-500">Explore</span>
              </h2>
            </div>
          </div>

          <div className="mb-12 overflow-x-auto no-scrollbar">
            <CategoryPills activeCategory={activeTab} setCategory={setActiveTab} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
            {videos.map((video, index) => (
              <PosterCard key={video.id} video={video} index={index} />
            ))}
          </div>
        </section>
      </div>
    </motion.div>
  );
}
