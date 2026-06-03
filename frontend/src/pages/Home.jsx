import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../supabaseClient';
import Loader from '../components/Loader';
import { Play, Plus, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReviewButton from '../components/ReviewApp/ReviewButton';
import AdBanner from '../components/AdBanner';

// Utility component to render rating stars
const RenderStars = ({ rating }) => {
  const stars = [];
  const rounded = Math.round(rating);
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <Star
        key={i}
        className={`w-3.5 h-3.5 ${i <= rounded ? 'fill-[#f59e0b] text-[#f59e0b]' : 'text-gray-600'}`}
      />
    );
  }
  return <div className="flex items-center gap-1">{stars}</div>;
};

// VideoRow component with horizontal scroll & slider controls
const VideoRow = ({ title, videos, onVideoClick, defaultCategory }) => {
  const rowRef = useRef(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  const updateScrollButtons = () => {
    if (rowRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
      setShowLeft(scrollLeft > 10);
      setShowRight(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  useEffect(() => {
    const el = rowRef.current;
    if (el) {
      updateScrollButtons();
      el.addEventListener('scroll', updateScrollButtons);
      window.addEventListener('resize', updateScrollButtons);
      
      const observer = new ResizeObserver(updateScrollButtons);
      observer.observe(el);
      
      return () => {
        el.removeEventListener('scroll', updateScrollButtons);
        window.removeEventListener('resize', updateScrollButtons);
        observer.disconnect();
      };
    }
  }, [videos]);

  const scroll = (direction) => {
    if (rowRef.current) {
      const { clientWidth } = rowRef.current;
      const scrollAmount = direction === 'left' ? -clientWidth * 0.75 : clientWidth * 0.75;
      rowRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!videos || videos.length === 0) return null;

  return (
    <section className="w-full relative group">
      {title && (
        <div className="flex items-center justify-between mb-4 px-4 sm:px-6 md:px-10">
          <h2 className="text-base md:text-lg font-black uppercase tracking-widest text-[#f59e0b] italic">{title}</h2>
          <span className="text-[9px] font-black uppercase tracking-widest text-white/40 cursor-pointer hover:text-white transition">View all</span>
        </div>
      )}
      
      <div className="relative w-full">
        {/* Left Chevron Button */}
        {showLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-4 top-[35%] -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/70 backdrop-blur-md border border-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-black/90 hover:scale-110 active:scale-95 cursor-pointer shadow-lg hidden md:flex"
            aria-label="Scroll Left"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
        )}

        {/* Right Chevron Button */}
        {showRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-4 top-[35%] -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/70 backdrop-blur-md border border-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-black/90 hover:scale-110 active:scale-95 cursor-pointer shadow-lg hidden md:flex"
            aria-label="Scroll Right"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        )}

        {/* Horizontal Scroll Wrapper */}
        <div
          ref={rowRef}
          className="flex flex-row gap-4 md:gap-6 overflow-x-auto no-scrollbar pb-4 w-full scroll-smooth px-4 sm:px-6 md:px-10"
        >
          {videos.map((v) => (
            <div
              key={v.id}
              onClick={() => onVideoClick(v.id)}
              className="flex flex-col gap-2 cursor-pointer group/card w-[140px] sm:w-[180px] md:w-[200px] shrink-0"
            >
              <div className="aspect-video rounded-lg md:rounded-[0.8rem] overflow-hidden border border-white/10 group-hover/card:border-blue-400 bg-black relative transition-all duration-300 shadow-xl group-hover/card:scale-102">
                <img src={v.thumbnail_url} className="w-full h-full object-cover" alt="" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3 opacity-0 group-hover/card:opacity-100 transition-opacity">
                  <div className="bg-[#0ea5e9] text-white text-[7px] font-black uppercase tracking-widest py-1 px-2.5 rounded-full w-fit">Watch Now</div>
                </div>
              </div>
              <h4 className="text-[11px] md:text-xs font-black uppercase tracking-tight line-clamp-1 text-white/90 group-hover/card:text-[#0ea5e9] transition-colors">
                {v.title}
              </h4>
              <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">
                {v.category || defaultCategory || 'More Videos'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};


export default function Home() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const navigate = useNavigate();
  const { theme: globalTheme } = useTheme();

  // Handle select-category event for smooth scroll-to-pill category navigation
  useEffect(() => {
    const handleSelectCat = (e) => {
      setSelectedCategory(e.detail);
      const el = document.getElementById('categories-filter-pills');
      if (el) {
        window.scrollTo({ top: el.offsetTop - 100, behavior: 'smooth' });
      }
    };
    window.addEventListener('select-category', handleSelectCat);
    return () => window.removeEventListener('select-category', handleSelectCat);
  }, []);

  // Load videos from Supabase with localStorage caching
  useEffect(() => {
    async function loadData() {
      const cached = localStorage.getItem('macfeed_home_cache');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setVideos(parsed);
          setLoading(false);
        } catch (e) {
          localStorage.removeItem('macfeed_home_cache');
          setLoading(true);
        }
      } else {
        setLoading(true);
      }

      try {
        const { data, error } = await supabase
          .from('videos')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) {
          console.error('Supabase query error on Home:', error);
        }
        if (data) {
          setVideos(data);
          localStorage.setItem('macfeed_home_cache', JSON.stringify(data));
        }
      } catch (e) {
        console.error('Home load error:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filter videos dynamically based on selected pill category
  const filteredVideos = useMemo(() => {
    if (selectedCategory === 'ALL') return videos;
    if (selectedCategory === 'Series') {
      return videos.filter(v => v.category === 'Cartoon' || v.category === 'Series');
    }
    if (selectedCategory === 'Action' || selectedCategory === 'Adventure') {
      return videos.filter(v => v.category === 'Movies' || v.category === 'YouTube');
    }
    if (selectedCategory === 'Comedy') {
      return videos.filter(v => v.category === 'YouTube');
    }
    return videos.filter(v => v.category === 'Shorts' || !v.category);
  }, [videos, selectedCategory]);

  // Segmenting videos for home sections
  const moviesList = useMemo(() => videos.filter(v => v.category === 'Movies'), [videos]);
  const cartoonsList = useMemo(() => videos.filter(v => v.category === 'Cartoon'), [videos]);
  const youtubeList = useMemo(() => videos.filter(v => v.category === 'YouTube'), [videos]);

  // Fallback video objects linked to actual database IDs for functional gameplay
  const defaultPlayVideo = useMemo(() => {
    return videos[0] || { id: 'default' };
  }, [videos]);

  const defaultMoviePlayVideo = useMemo(() => {
    return moviesList[0] || defaultPlayVideo;
  }, [moviesList, defaultPlayVideo]);

  const defaultCartoonPlayVideo = useMemo(() => {
    return cartoonsList[0] || defaultPlayVideo;
  }, [cartoonsList, defaultPlayVideo]);

  // Section list items (Top 6 each for horizontal scroll carousels)
  const mostViewedVideos = useMemo(() => {
    const list = [...videos].sort((a, b) => (b.views || 0) - (a.views || 0));
    return list.slice(0, 10); // fetch slightly more for scrolling rows
  }, [videos]);

  const mostPopularRow1 = useMemo(() => {
    return moviesList.slice(0, 10);
  }, [moviesList]);

  const mostPopularRow2 = useMemo(() => {
    return cartoonsList.slice(0, 10);
  }, [cartoonsList]);

  const tvSeriesRow = useMemo(() => {
    return youtubeList.slice(0, 10);
  }, [youtubeList]);

  // ─── TOP HERO BANNER AUTOPLAY SLIDESHOW SETUP (Right to Left Slide) ───
  const [heroIdx, setHeroIdx] = useState(0);
  const heroSlides = useMemo(() => {
    const uniqueList = [];
    const seen = new Set();
    
    moviesList.forEach(v => {
      if (!seen.has(v.id)) {
        seen.add(v.id);
        uniqueList.push(v);
      }
    });
    cartoonsList.forEach(v => {
      if (!seen.has(v.id)) {
        seen.add(v.id);
        uniqueList.push(v);
      }
    });
    videos.forEach(v => {
      if (!seen.has(v.id)) {
        seen.add(v.id);
        uniqueList.push(v);
      }
    });
    
    const list = uniqueList.slice(0, 7);
    if (list.length === 0) {
      return [{
        id: 'raya',
        title: 'Raya and the Last Dragon',
        category: 'Adventure, Fantasy, Action',
        duration: '1h 47m',
        thumbnail_url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2025',
        description: 'Long ago, in the fantasy world of Kumandra, humans and dragons lived together in harmony. But when an evil force threatened the land, the dragons sacrificed themselves to save humanity. Now, 500 years later, that same evil has returned.'
      }];
    }
    
    const padded = [...list];
    while (padded.length < 7) {
      padded.push(...list);
    }
    return padded.slice(0, 7);
  }, [moviesList, cartoonsList, videos]);

  useEffect(() => {
    if (heroSlides.length <= 1) return;
    const timer = setInterval(() => {
      setHeroIdx(prev => (prev + 1) % heroSlides.length);
    }, 5500); // 5.5 seconds autoplay rotation
    return () => clearInterval(timer);
  }, [heroSlides]);

  const activeHero = useMemo(() => {
    return heroSlides[heroIdx] || heroSlides[0];
  }, [heroSlides, heroIdx]);

  // Split title helper to match the two-line "INTRUDER ALERT" layout
  const { line1, line2 } = useMemo(() => {
    if (!activeHero?.title) return { line1: '', line2: '' };
    const titleText = activeHero.title.trim();
    const words = titleText.split(' ');
    if (words.length <= 1) return { line1: titleText, line2: '' };
    const mid = Math.ceil(words.length / 2);
    return {
      line1: words.slice(0, mid).join(' '),
      line2: words.slice(mid).join(' ')
    };
  }, [activeHero]);

  if (loading && videos.length === 0) return <Loader />;

  return (
    <div className="w-full max-w-full overflow-x-hidden text-[#f8fafc] pb-10 bg-transparent min-h-screen font-sans px-0 relative z-10">
      
      {/* ─── ALL CATEGORY: CINEMATIC MULTI-BANNER LAYOUT ─── */}
      {selectedCategory === 'ALL' ? (
        <div className="flex flex-col gap-10 w-full relative z-10">
          
          {/* 1. TOP HERO BANNER (Autoplay slideshow right-to-left with sharp full thumbnail & blurred back) */}
          <section className="relative w-[calc(100%-2rem)] sm:w-[calc(100%-3rem)] md:w-[calc(100%-5rem)] mx-auto mt-2 md:mt-4 aspect-[16/10] sm:aspect-[16/11] md:aspect-[21/9.5] min-h-[220px] sm:min-h-[360px] md:min-h-[480px] rounded-[1.2rem] md:rounded-[2rem] overflow-hidden shadow-2xl border border-white/5 bg-black">
            
            {/* Green diagonal glowing stripe */}
            <div
              className="absolute left-[-10%] top-[-30%] w-[6%] h-[180%] bg-gradient-to-b from-[#10b981]/50 via-[#10b981]/15 to-transparent blur-[35px] transform rotate-[32deg] pointer-events-none z-10"
            />

            {/* Sliding Container */}
            <div className="absolute inset-0 w-full h-full overflow-hidden rounded-[1.2rem] md:rounded-[2rem]">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={activeHero.id}
                  initial={{ x: '100%', opacity: 0.8 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: '-100%', opacity: 0.8 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0 w-full h-full bg-[#020205] rounded-[1.2rem] md:rounded-[2rem] overflow-hidden"
                >
                  {/* Crisp Full Background version of the thumbnail */}
                  <div
                    className="absolute inset-0 w-full h-full bg-cover bg-center rounded-[1.2rem] md:rounded-[2rem] overflow-hidden"
                    style={{ backgroundImage: `url('${activeHero.thumbnail_url || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2025'}')` }}
                  />

                  {/* Dark Gradients to ensure readability of buttons and text */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#020205]/90 via-[#020205]/30 to-transparent z-10 rounded-[1.2rem] md:rounded-[2rem]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#020205]/95 via-transparent to-transparent z-10 rounded-[1.2rem] md:rounded-[2rem]" />

                  {/* Interactive Controls Overlay on the Left (Buttons at top, title below in small size) */}
                  <div className="absolute inset-x-0 bottom-4 sm:bottom-26 md:bottom-32 flex flex-col items-start px-4 sm:px-8 md:px-12 gap-2 z-40">
                    
                    {/* Play & Add & Review buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => navigate('/watch/' + activeHero.id)}
                        className="flex items-center gap-1 bg-[#00f2fe] hover:bg-cyan-400 text-black font-black uppercase text-[7px] sm:text-[8px] md:text-[9px] tracking-widest px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 rounded-lg shadow-[0_0_15px_rgba(0,242,254,0.3)] hover:shadow-[0_0_25px_rgba(0,242,254,0.6)] transition-all hover:scale-105 active:scale-95 border border-[#00f2fe]/20"
                      >
                        <Play className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 fill-black text-black" /> Play
                      </button>
                      <button
                        onClick={() => navigate('/movies')}
                        className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-lg border border-white/20 hover:border-white/50 bg-black/40 backdrop-blur-md flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95"
                      >
                        <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 h-4" />
                      </button>
                      <ReviewButton />
                    </div>

                    {/* Small title text below the play button */}
                    <p className="text-[9px] sm:text-[11px] md:text-xs font-black uppercase tracking-wider text-white/95 drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)] max-w-[85%] text-left font-sans">
                      {activeHero.title}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Overlapping Cyberpunk Slide Previews Carousel (Symmetrical 7-card layout centered on active) */}
            <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 flex items-center justify-center -space-x-4 sm:-space-x-8 md:-space-x-12 z-30 w-full overflow-x-auto no-scrollbar py-4 px-6 hidden sm:flex pointer-events-none">
              {[-3, -2, -1, 0, 1, 2, 3].map((offset) => {
                const L = heroSlides.length;
                const slideIdx = (heroIdx + offset + L) % L;
                const slide = heroSlides[slideIdx];
                const isActive = offset === 0;

                // Symmetrical size scaling based on offset from center (3D arch depth)
                let cardStyle = "";
                if (offset === 0) {
                  cardStyle = "w-[65px] sm:w-[115px] md:w-[145px] z-30 scale-105 sm:scale-110 border-[#ff007f] shadow-[0_0_15px_rgba(255,0,127,0.4)] sm:shadow-[0_0_25px_rgba(255,0,127,0.6)]";
                } else if (offset === -1 || offset === 1) {
                  cardStyle = "w-[55px] sm:w-[100px] md:w-[125px] z-20 scale-95 opacity-80 border-[#ff007f]/40";
                } else if (offset === -2 || offset === 2) {
                  cardStyle = "w-[45px] sm:w-[85px] md:w-[105px] z-10 scale-85 opacity-55 border-[#ff007f]/20";
                } else {
                  cardStyle = "w-[35px] sm:w-[70px] md:w-[85px] z-0 scale-75 opacity-35 border-transparent hidden sm:flex";
                }

                return (
                  <div
                    key={slide.id + '-' + offset}
                    onClick={() => setHeroIdx(slideIdx)}
                    className={`aspect-[3/4.2] rounded-xl sm:rounded-2xl overflow-visible border cursor-pointer transition-all duration-500 shrink-0 relative flex flex-col justify-end p-2 sm:p-3 shadow-2xl bg-black pointer-events-auto ${cardStyle}`}
                  >
                    {/* Active ring background */}
                    {isActive && (
                      <div 
                        style={{ animation: 'spin 15s linear infinite' }}
                        className="absolute inset-[-12px] sm:inset-[-18px] rounded-full border border-dashed border-[#ff007f] opacity-50 blur-[1px] z-[-1] pointer-events-none" 
                      />
                    )}

                    {/* Card Image */}
                    <div className="absolute inset-0 w-full h-full rounded-xl sm:rounded-2xl overflow-hidden">
                      <img src={slide.thumbnail_url} className="w-full h-full object-cover select-none pointer-events-none" alt="" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    </div>
                    
                    {/* Content */}
                    <div className="relative z-10 w-full flex flex-col gap-0.5 sm:gap-1 pointer-events-none">
                      {isActive && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/watch/' + slide.id);
                          }}
                          className="bg-[#00f2fe] hover:bg-cyan-400 text-black text-[7px] sm:text-[8px] font-black uppercase tracking-wider py-1.5 rounded-lg w-full text-center shadow-[0_0_12px_rgba(0,242,254,0.5)] border border-cyan-300/20 transition-all select-none pointer-events-auto hover:scale-105 active:scale-95 animate-pulse"
                        >
                          Play Now
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 2. CATEGORIES FILTER PILLS */}
          <div id="categories-filter-pills" className="w-[calc(100%-2rem)] sm:w-[calc(100%-3rem)] md:w-[calc(100%-5rem)] mx-auto flex items-center justify-between border-y border-white/5 py-4">
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
              {['ALL', 'Action', 'Comedy', 'Series', 'Adventure', 'Other'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-5 py-2 rounded-full font-black uppercase text-[8px] md:text-[9px] tracking-widest transition-all ${
                    selectedCategory === cat
                      ? 'bg-[#f59e0b] text-black shadow-lg shadow-amber-500/20 scale-105'
                      : 'bg-white/5 hover:bg-white/10 text-white border border-white/5'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="text-secondary/40 font-black uppercase text-[8px] tracking-widest hidden sm:block">
              Filter Content
            </div>
          </div>

          {/* 3. MOST VIEWED SECTION (Rowwise Slide/Scroll) */}
          <VideoRow
            title="Most Viewed"
            videos={mostViewedVideos}
            onVideoClick={(id) => navigate('/watch/' + id)}
            defaultCategory="More Videos"
          />

          {/* 4. MIDDLE HERO BANNER (Black Adam Style) */}
          <section className="relative w-[calc(100%-2rem)] sm:w-[calc(100%-3rem)] md:w-[calc(100%-5rem)] mx-auto aspect-[16/10] md:aspect-[21/6.2] min-h-[260px] md:min-h-[300px] rounded-[1.2rem] md:rounded-[2rem] overflow-hidden shadow-2xl border border-white/5 group">
            {/* Background Image */}
            <div className="absolute inset-0 rounded-[1.2rem] md:rounded-[2rem] overflow-hidden bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=2070')" }}>
              <div className="absolute inset-0 bg-gradient-to-r from-[#020205] via-[#020205]/75 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#020205] via-transparent to-transparent" />
            </div>

            {/* Content Overlay */}
            <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-8 md:p-12 z-10 max-w-2xl gap-2 md:gap-3">
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none text-white italic drop-shadow-2xl">
                Black Adam
              </h2>
              
              {/* Rating */}
              <div className="flex items-center gap-3">
                <RenderStars rating={4} />
                <span className="text-[10px] md:text-xs font-black text-white/60">7.0 RATING</span>
              </div>

              <p className="text-white/60 text-[11px] md:text-sm line-clamp-2 font-medium leading-relaxed max-w-lg">
                Nearly 5,000 years after he was bestowed with the almighty powers of the ancient gods—and imprisoned just as quickly—Black Adam is freed from his earthly tomb, ready to unleash his unique form of justice on the modern world.
              </p>

              {/* Play button */}
              <div className="flex items-center gap-4 mt-1">
                <button
                  onClick={() => navigate('/watch/' + defaultMoviePlayVideo.id)}
                  className="flex items-center gap-2 bg-[#0ea5e9] hover:bg-sky-400 text-white font-black uppercase text-[9px] md:text-[10px] tracking-widest px-6 md:px-8 py-3 rounded-full shadow-[0_0_20px_rgba(14,165,233,0.4)] transition-all active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-white" /> Play
                </button>
              </div>
            </div>

            {/* Right Stacked Scenes */}
            <div className="absolute bottom-4 right-6 hidden lg:flex flex-col gap-2 z-20">
              {cartoonsList.slice(0, 3).map((c) => (
                <div
                  key={c.id}
                  onClick={() => navigate('/watch/' + c.id)}
                  className="w-24 aspect-video rounded-lg overflow-hidden border border-white/10 hover:border-blue-400 cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-xl bg-black"
                >
                  <img src={c.thumbnail_url} className="w-full h-full object-cover" alt="" />
                </div>
              ))}
            </div>
          </section>

          {/* 5. MOST POPULAR ROW 1 (Rowwise Slide/Scroll) */}
          <VideoRow
            title="Most Popular Movies"
            videos={mostPopularRow1}
            onVideoClick={(id) => navigate('/watch/' + id)}
            defaultCategory="Movies"
          />

          {/* 6. MOST POPULAR ROW 2 (Rowwise Slide/Scroll) */}
          <VideoRow
            title="Most Popular Animations"
            videos={mostPopularRow2}
            onVideoClick={(id) => navigate('/watch/' + id)}
            defaultCategory="Cartoon"
          />

          {/* Ad Banner (Inline) */}
          <div className="py-6 px-4 sm:px-0">
            <AdBanner position="banner" />
          </div>

          {/* 7. POPULAR TV SERIES HEADER */}
          <div className="w-full flex items-center justify-center my-4">
            <h1 className="text-2xl md:text-4xl font-black italic tracking-tighter uppercase text-center text-white drop-shadow-lg">
              Popular TV Series
            </h1>
          </div>

          {/* 8. BOTTOM HERO BANNER (The Flash Style) */}
          <section className="relative w-[calc(100%-2rem)] sm:w-[calc(100%-3rem)] md:w-[calc(100%-5rem)] mx-auto aspect-[16/10] md:aspect-[21/6.2] min-h-[260px] md:min-h-[300px] rounded-[1.2rem] md:rounded-[2rem] overflow-hidden shadow-2xl border border-white/5 group">
            {/* Background Image */}
            <div className="absolute inset-0 rounded-[1.2rem] md:rounded-[2rem] overflow-hidden bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=2000')" }}>
              <div className="absolute inset-0 bg-gradient-to-r from-[#020205] via-[#020205]/75 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#020205] via-transparent to-transparent" />
            </div>

            {/* Content Overlay */}
            <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-8 md:p-12 z-10 max-w-2xl gap-2 md:gap-3">
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none text-white italic drop-shadow-2xl">
                The Flash : Season 9
              </h2>
              
              {/* Rating */}
              <div className="flex items-center gap-3">
                <RenderStars rating={4} />
                <span className="text-[10px] md:text-xs font-black text-white/60">7.5 RATING</span>
              </div>

              <p className="text-white/60 text-[11px] md:text-sm line-clamp-2 font-medium leading-relaxed max-w-lg">
                After being struck by lightning, Barry Allen wakes up from his coma to discover he has been given the power of super speed, becoming the next Flash, fighting crime in Central City.
              </p>

              {/* Play button */}
              <div className="flex items-center gap-4 mt-1">
                <button
                  onClick={() => navigate('/watch/' + defaultCartoonPlayVideo.id)}
                  className="flex items-center gap-2 bg-[#0ea5e9] hover:bg-sky-400 text-white font-black uppercase text-[9px] md:text-[10px] tracking-widest px-6 md:px-8 py-3 rounded-full shadow-[0_0_20px_rgba(14,165,233,0.4)] transition-all active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-white" /> Play
                </button>
              </div>
            </div>

            {/* Right highlight poster card */}
            <div className="absolute bottom-4 right-6 hidden lg:flex z-20">
              <div
                onClick={() => navigate('/watch/' + defaultPlayVideo.id)}
                className="w-40 aspect-video rounded-xl overflow-hidden border border-white/20 hover:border-blue-400 cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-2xl bg-black"
              >
                <img src={defaultPlayVideo.thumbnail_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070'} className="w-full h-full object-cover" alt="" />
              </div>
            </div>
          </section>

          {/* 9. TV SERIES ROW (Rowwise Slide/Scroll) */}
          <VideoRow
            videos={tvSeriesRow}
            onVideoClick={(id) => navigate('/watch/' + id)}
            defaultCategory="Series"
          />

        </div>
      ) : (
        /* ─── FILTERED VIEWS LAYOUT (SINGLE ROW SLIDER) ─── */
        <div className="flex flex-col gap-6 w-[calc(100%-2rem)] sm:w-[calc(100%-3rem)] md:w-[calc(100%-5rem)] mx-auto">
          
          {/* Header & Back Button */}
          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className="px-5 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black uppercase text-[8px] md:text-[9px] tracking-widest transition"
            >
              Back to Home
            </button>
            <h2 className="text-xl font-black italic tracking-tighter uppercase text-white">
              Category: {selectedCategory}
            </h2>
          </div>

          {filteredVideos.length > 0 ? (
            <VideoRow
              title=""
              videos={filteredVideos}
              onVideoClick={(id) => navigate('/watch/' + id)}
              defaultCategory={selectedCategory}
            />
          ) : (
            <div className="py-40 text-center text-white/20 font-black uppercase tracking-[0.4em] text-xs">
              No content found in this category
            </div>
          )}
        </div>
      )}

      {/* ─── FOOTER SECTION ─── */}
      <footer className="w-[calc(100%-2rem)] sm:w-[calc(100%-3rem)] md:w-[calc(100%-5rem)] mx-auto border-t border-white/5 mt-20 pt-12 pb-6 flex flex-col gap-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          {/* Logo */}
          <span 
            className="text-[#f59e0b] text-[1.4rem] md:text-[1.6rem] font-black uppercase italic tracking-tighter leading-none cursor-pointer" 
            onClick={() => {
              setSelectedCategory('ALL');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            Movie <span className={globalTheme === 'white-black' ? 'text-black' : 'text-white'}>love</span>
          </span>
          {/* Socials */}
          <div className="flex items-center gap-4 text-white/60">
            <span className="text-[9px] font-black uppercase tracking-widest">Follow Us on:</span>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="hover:text-blue-400 transition-colors"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg></a>
            <a href="https://google.com" target="_blank" rel="noreferrer" className="hover:text-red-400 transition-colors"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-6.887 4.114-4.68 0-8.5-3.82-8.5-8.5s3.82-8.5 8.5-8.5c2.1 0 4.025.772(5.513 2.186l3.125-3.125c-2.316-2.158-5.354-3.461-8.638-3.461-7.46 0-13.5 6.04-13.5 13.5s6.04 13.5 13.5 13.5c7.9 0 13.1-5.56 13.1-13.3 0-.9-.08-1.57-.22-2.22h-12.88z"/></svg></a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-sky-400 transition-colors"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg></a>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-[11px] font-bold border-t border-white/5 pt-8">
          <div className="flex flex-col gap-2.5">
            <span className="text-[#f59e0b] uppercase tracking-wider mb-1 font-black">Movie</span>
            <span className="text-white/50 hover:text-white cursor-pointer transition" onClick={() => window.dispatchEvent(new CustomEvent('select-category', { detail: 'Action' }))}>Action</span>
            <span className="text-white/50 hover:text-white cursor-pointer transition" onClick={() => window.dispatchEvent(new CustomEvent('select-category', { detail: 'Comedy' }))}>Comedy</span>
            <span className="text-white/50 hover:text-white cursor-pointer transition" onClick={() => window.dispatchEvent(new CustomEvent('select-category', { detail: 'Other' }))}>Horror</span>
            <span className="text-white/50 hover:text-white cursor-pointer transition" onClick={() => window.dispatchEvent(new CustomEvent('select-category', { detail: 'Series' }))}>Animation</span>
            <span className="text-white/50 hover:text-white cursor-pointer transition" onClick={() => window.dispatchEvent(new CustomEvent('select-category', { detail: 'Adventure' }))}>Fantasy</span>
          </div>
          <div className="flex flex-col gap-2.5">
            <span className="text-[#f59e0b] uppercase tracking-wider mb-1 font-black">Series</span>
            <span className="text-white/50 hover:text-white cursor-pointer transition" onClick={() => window.dispatchEvent(new CustomEvent('select-category', { detail: 'Series' }))}>Reality Shows</span>
            <span className="text-white/50 hover:text-white cursor-pointer transition" onClick={() => window.dispatchEvent(new CustomEvent('select-category', { detail: 'Series' }))}>Classic Shows</span>
            <span className="text-white/50 hover:text-white cursor-pointer transition" onClick={() => window.dispatchEvent(new CustomEvent('select-category', { detail: 'Other' }))}>Valentine Day</span>
            <span className="text-white/50 hover:text-white cursor-pointer transition" onClick={() => window.dispatchEvent(new CustomEvent('select-category', { detail: 'Comedy' }))}>Comedy</span>
            <span className="text-white/50 hover:text-white cursor-pointer transition" onClick={() => window.dispatchEvent(new CustomEvent('select-category', { detail: 'Series' }))}>Fantasy</span>
          </div>
          <div className="flex flex-col gap-2.5">
            <span className="text-[#f59e0b] uppercase tracking-wider mb-1 font-black">Support</span>
            <span 
              className="text-white/50 hover:text-white cursor-pointer transition"
              onClick={() => window.dispatchEvent(new CustomEvent('open-info-modal', {
                detail: {
                  title: 'Consul Info',
                  content: 'MacFeed Entertainment Group Corp.\n\nCorporate Headquarters:\n122 Broadway, Suite 400\nNew York, NY 10002, USA\n\nFor licensing opportunities, media inquiries, or corporate partnerships, please contact our relations team at relations@movies.com.'
                }
              }))}
            >
              Consul Info
            </span>
            <span 
              className="text-white/50 hover:text-white cursor-pointer transition"
              onClick={() => window.dispatchEvent(new CustomEvent('open-info-modal', {
                detail: {
                  title: 'Privacy Policy',
                  content: 'At MacFeed, we value your privacy. We do not sell your personal data. We collect minimal analytics (such as view counts and category preferences) to customize your dashboard and improve the speed of our global media search. Your data is stored securely and can be deleted at any time from your settings page.'
                }
              }))}
            >
              Privacy Policy
            </span>
            <span 
              className="text-white/50 hover:text-white cursor-pointer transition"
              onClick={() => window.dispatchEvent(new CustomEvent('open-info-modal', {
                detail: {
                  title: 'Terms of Service',
                  content: 'By accessing MacFeed, you agree to our terms. All content is for personal, non-commercial viewing only. Automated scraping of YouTube metadata, media files, or user dashboard states is strictly prohibited. We reserve the right to suspend accounts violating safety guidelines.'
                }
              }))}
            >
              Terms of service
            </span>
            <span 
              className="text-white/50 hover:text-white cursor-pointer transition"
              onClick={() => window.dispatchEvent(new CustomEvent('open-info-modal', {
                detail: {
                  title: 'Help Center',
                  content: 'Welcome to the MacFeed Help Center.\n\nFrequently Asked Questions:\n\nQ: Why is my video not playing?\nA: Ensure you have a stable internet connection. Some content is region-locked on YouTube.\n\nQ: How do I change the website theme?\nA: Click the profile button in the top-right and select your theme in settings.\n\nNeed further assistance? Contact us at support@movies.com.'
                }
              }))}
            >
              Help center
            </span>
          </div>
          <div className="flex flex-col gap-2.5">
            <span className="text-[#f59e0b] uppercase tracking-wider mb-1 font-black">Contact</span>
            <span 
              className="text-white/50 hover:text-white transition font-medium cursor-pointer"
              onClick={() => window.dispatchEvent(new CustomEvent('open-info-modal', {
                detail: {
                  title: 'Contact Support',
                  content: 'To open a support ticket or speak with our help desk, you can email us at support@movies.com.\n\nOur average response time is under 12 hours. Please include your user ID or registered email address for faster troubleshooting.'
                }
              }))}
            >
              support@movies.com
            </span>
            <span 
              className="text-white/50 hover:text-white transition font-medium cursor-pointer"
              onClick={() => window.dispatchEvent(new CustomEvent('open-info-modal', {
                detail: {
                  title: 'Support Hotline',
                  content: 'MacFeed Telephone Assistance:\n\nInternational Support Hotline:\n+1 (718) 782-7233\n\nOperating Hours:\nMonday - Friday, 9:00 AM - 6:00 PM EST.\n\nStandard call charges may apply depending on your network operator.'
                }
              }))}
            >
              Tel: 17187827****
            </span>
          </div>
        </div>

        <div className="text-center text-[9px] text-white/20 font-black uppercase tracking-widest mt-4">
          &copy; {new Date().getFullYear()} Movie Love. All rights reserved.
        </div>
      </footer>

    </div>
  );
}
