import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Loader from '../components/Loader';
import { ChevronLeft, ChevronRight, ChevronRight as ArrowRight, Sparkles, X } from 'lucide-react';
import VideoCard from '../components/VideoCard';
import HeroCarousel from '../components/HeroCarousel';
import { FALLBACK_VIDEOS } from '../data/fallbackVideos';
import { getAllCategorizedVideos } from '../utils/categoryDetector';

// --- Digen Section Row Component ---
const DigenSectionRow = ({
  title,
  badge,
  subtitle,
  linkText = 'See all',
  linkPath,
  videos = [],
  variant = 'standard',
  defaultCategory,
}) => {
  const rowRef = useRef(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;

    const handleScroll = () => {
      setShowLeft(el.scrollLeft > 20);
      setShowRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 20);
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => el.removeEventListener('scroll', handleScroll);
  }, [videos]);

  const scroll = (direction) => {
    if (rowRef.current) {
      const { clientWidth } = rowRef.current;
      const scrollAmount = direction === 'left' ? -clientWidth * 0.75 : clientWidth * 0.75;
      rowRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleMouseDown = (e) => {
    if (!rowRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - rowRef.current.offsetLeft);
    setScrollLeft(rowRef.current.scrollLeft);
  };

  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e) => {
    if (!isDragging || !rowRef.current) return;
    e.preventDefault();
    const x = e.pageX - rowRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    rowRef.current.scrollLeft = scrollLeft - walk;
  };

  if (!videos || videos.length === 0) return null;

  const isVertical = variant === 'vertical';

  return (
    <section className="w-full max-w-7xl mx-auto px-3 sm:px-6 mb-8 relative group/section">
      {/* --- Header: Gold Title + Pill Badge + Subtitle + Link --- */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-1.5 mb-3">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="digen-section-title text-base sm:text-lg md:text-xl font-black">
              {title}
            </h2>
            {badge && (
              <span className="digen-badge-teal text-[10px] sm:text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-gray-400 text-xs sm:text-sm font-normal mt-0.5 leading-snug max-w-3xl">
              {subtitle}
            </p>
          )}
        </div>

        {linkText && (
          <button
            onClick={() => {
              if (linkPath) navigate(linkPath);
              else if (defaultCategory) {
                window.dispatchEvent(new CustomEvent('select-category', { detail: defaultCategory }));
              }
            }}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition font-medium shrink-0 self-start sm:self-auto mt-1 sm:mt-0"
          >
            <span>{linkText}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* --- Scroll Container with Left/Right Arrows --- */}
      <div className="relative w-full">
        {showLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-[40%] -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-black/80 backdrop-blur-md border border-white/20 flex items-center justify-center text-white opacity-0 group-hover/section:opacity-100 transition-opacity hover:scale-110 active:scale-95 shadow-xl hidden md:flex"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {showRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-[40%] -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-black/80 backdrop-blur-md border border-white/20 flex items-center justify-center text-white opacity-0 group-hover/section:opacity-100 transition-opacity hover:scale-110 active:scale-95 shadow-xl hidden md:flex"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        <div
          ref={rowRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          className={`flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar py-2 w-full scroll-smooth select-none ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
        >
          {videos.map((v) => (
            <div
              key={v.id}
              className={`shrink-0 ${
                isVertical
                  ? 'w-[150px] sm:w-[180px] md:w-[200px]'
                  : 'w-[240px] sm:w-[280px] md:w-[320px]'
              }`}
            >
              <VideoCard video={v} variant={variant} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

function getMergedHomeVideos(baseList = []) {
  const searched = getAllCategorizedVideos();
  const existingIds = new Set(searched.map(m => m.id));
  const base = baseList.length > 0 ? baseList : FALLBACK_VIDEOS;
  const unrepeated = base.filter(m => !existingIds.has(m.id));
  return [...searched, ...unrepeated];
}

export default function Home() {
  const [videos, setVideos] = useState(() => {
    try {
      const cached = localStorage.getItem('macfeed_home_cache');
      if (cached) return getMergedHomeVideos(JSON.parse(cached));
    } catch (e) {}
    return getMergedHomeVideos(FALLBACK_VIDEOS);
  });
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const navigate = useNavigate();

  // Load videos
  useEffect(() => {
    async function loadData() {
      try {
        const { data, error } = await supabase
          .from('videos')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          setVideos(getMergedHomeVideos(data));
          localStorage.setItem('macfeed_home_cache', JSON.stringify(data));
        } else {
          setVideos(prev => getMergedHomeVideos(prev));
        }
      } catch (err) {
        setVideos(prev => getMergedHomeVideos(prev));
      } finally {
        setLoading(false);
      }
    }
    loadData();

    const handleUpdate = () => {
      setVideos(prev => getMergedHomeVideos(prev));
    };
    window.addEventListener('categorized-videos-updated', handleUpdate);
    return () => window.removeEventListener('categorized-videos-updated', handleUpdate);
  }, []);

  // Handle category select
  useEffect(() => {
    const handleSelectCat = (e) => {
      setSelectedCategory(e.detail);
      const el = document.getElementById('categories-filter-pills');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };
    window.addEventListener('select-category', handleSelectCat);
    return () => window.removeEventListener('select-category', handleSelectCat);
  }, []);

  const filterTags = ['ALL', 'Trending', 'Movies', 'Music', 'Series', 'Action', 'Comedy', 'Animation', 'Sports'];

  const filteredVideos = useMemo(() => {
    if (selectedCategory === 'ALL') return videos;
    if (selectedCategory === 'Trending') {
      return [...videos].sort((a, b) => (b.views || 0) - (a.views || 0));
    }
    return videos.filter(
      (v) => v.category?.toLowerCase() === selectedCategory.toLowerCase()
    );
  }, [videos, selectedCategory]);

  // Admin Controlled Hero Slides: Only videos explicitly starred / marked as featured by Admin appear here
  const heroSlides = useMemo(() => {
    // 1. Check videos marked as is_featured in DB
    const adminFeatured = videos.filter((v) => v.is_featured === true || v.featured === true);

    // 2. Check localStorage admin-starred selections
    try {
      const localFeaturedIds = JSON.parse(localStorage.getItem('macfeed_admin_featured') || '[]');
      if (localFeaturedIds.length > 0) {
        const idSet = new Set(localFeaturedIds);
        const locallyChosen = videos.filter((v) => idSet.has(v.id));
        if (locallyChosen.length > 0) return locallyChosen.slice(0, 7);
      }
    } catch (e) {}

    if (adminFeatured.length > 0) {
      return adminFeatured.slice(0, 7);
    }

    // 3. Fallback: Curated 4K blockbuster movies only (NEVER random search items)
    return FALLBACK_VIDEOS.slice(0, 6);
  }, [videos]);

  if (loading && videos.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-white">
      {/* --- Hero Spotlight Banner (Strictly Admin / Curated Only) --- */}
      <HeroCarousel slides={heroSlides} />

      {/* --- Intro Spotlight Banner --- */}
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 mb-8 mt-2">
        <div className="relative rounded-2xl overflow-hidden p-4 sm:p-5 bg-gradient-to-r from-blue-950/40 via-cyan-950/20 to-black/60 border border-cyan-500/20 backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/30 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shrink-0 shadow-lg">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded-full border border-cyan-400/20">
                  Welcome Tour
                </span>
                <span className="text-[10px] text-gray-400 font-semibold hidden xs:inline">
                  Beyond Streaming
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white mt-0.5">
                New to MacFeed? Discover our next-generation streaming & floating playback engine.
              </h3>
            </div>
          </div>
          <button
            onClick={() => navigate('/intro?tour=true')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black font-black uppercase text-xs tracking-wider transition-transform active:scale-95 shadow-[0_0_20px_rgba(34,211,238,0.35)] shrink-0"
          >
            <span>Launch Intro Tour</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* --- Row 1: MINISORA / TRENDING VERTICAL CAROUSEL (Directly matching Screenshot) --- */}
      <DigenSectionRow
        title="MINISORA"
        badge="800k Sora creators"
        subtitle="Sora 2 is shutting down. We distilled a small runtime from 800k Sora creators — their prompts, shot lists, weather. Not a sequel."
        linkText="Why we launched MiniSora"
        linkPath="/shorts"
        videos={videos.filter((v) => v.category === 'Shorts' || v.duration === 'Short' || (v.views || 0) > 100).slice(0, 15)}
        variant="vertical"
      />

      {/* --- Filter Pills Bar (Directly matching Screenshot: RealDance, Lip Gen, etc.) --- */}
      <div id="categories-filter-pills" className="w-full max-w-7xl mx-auto px-3 sm:px-6 mb-6">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {filterTags.map((tag) => {
            const isActive = selectedCategory === tag;
            return (
              <button
                key={tag}
                onClick={() => setSelectedCategory(tag)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive ? 'digen-pill-active' : 'digen-pill-nav'
                }`}
              >
                {tag === 'Trending' && '🔥 '}
                {tag === 'Music' && '🎵 '}
                {tag === 'Movies' && '🎬 '}
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* --- Category Filter View (If Specific Category Selected) --- */}
      {selectedCategory !== 'ALL' ? (
        <div className="max-w-7xl mx-auto px-3 sm:px-6 mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="digen-section-title">{selectedCategory} Feed</h2>
            <button
              onClick={() => setSelectedCategory('ALL')}
              className="text-xs text-gray-400 hover:text-white underline"
            >
              Reset to All
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {filteredVideos.map((v) => (
              <VideoCard key={v.id} video={v} variant={selectedCategory === 'Shorts' ? 'vertical' : 'standard'} />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* --- Row 2: OPEN SKILLS / FEATURED CONTENT (Directly matching Screenshot) --- */}
          <DigenSectionRow
            title="OPEN SKILLS"
            badge="AI Curated"
            subtitle="New agent skills, now available — new ways to discover, remix, and stream 4K entertainment."
            linkText="See all"
            linkPath="/movies"
            videos={videos.filter((v) => v.category !== 'Shorts').slice(0, 12)}
            variant="standard"
          />

          {/* --- Row 3: TOP CINEMA & MOVIES --- */}
          <DigenSectionRow
            title="PREMIER CINEMA"
            badge="4K HDR"
            subtitle="Award-winning movies and indie cinema with studio audio fidelity."
            linkText="Explore Movies"
            linkPath="/movies"
            videos={videos.filter((v) => v.category === 'Movies' || v.category === 'Drama' || v.category === 'Action').slice(0, 10)}
            variant="standard"
          />

          {/* --- Row 4: VERTICAL VIRAL SHORTS --- */}
          <DigenSectionRow
            title="VIRAL CLIPS & SHORTS"
            badge="Trending Fast"
            subtitle="Instant micro-entertainment clips generated and curated daily."
            linkText="Open Shorts Player"
            linkPath="/shorts"
            videos={videos.filter((v) => v.category === 'Shorts' || v.duration === 'Short' || (v.views || 0) > 50).slice(0, 12)}
            variant="vertical"
          />

          {/* --- Row 5: MUSIC & SOUNDSCAPES --- */}
          <DigenSectionRow
            title="MUSIC & AUDIO"
            badge="Lossless Audio"
            subtitle="Immersive sound, official releases, and live music sessions."
            linkText="Listen on MacFeed Music"
            linkPath="/music"
            videos={videos.filter((v) => v.category === 'Music').slice(0, 10)}
            variant="standard"
          />
        </>
      )}

      {/* --- Digen Dark Footer --- */}
      <footer className="w-full max-w-7xl mx-auto px-3 sm:px-6 pt-12 pb-24 border-t border-white/5 text-xs text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white">MAC<span className="text-[#f5b700]">FEED</span></span>
          <span>© 2026 MacFeed Studio. All Rights Reserved.</span>
        </div>
        <div className="flex items-center gap-4 text-gray-400">
          <button onClick={() => navigate('/movies')} className="hover:text-white transition">Movies</button>
          <button onClick={() => navigate('/music')} className="hover:text-white transition">Music</button>
          <button onClick={() => navigate('/shorts')} className="hover:text-white transition">Shorts</button>
          <button onClick={() => navigate('/settings')} className="hover:text-white transition">Settings</button>
        </div>
      </footer>
    </div>
  );
}
