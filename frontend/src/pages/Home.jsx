import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../supabaseClient';
import Loader from '../components/Loader';
import { Play, Plus, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReviewButton from '../components/ReviewApp/ReviewButton';
import AdBanner from '../components/AdBanner';
import VideoCard from '../components/VideoCard';
import HeroCarousel from '../components/HeroCarousel';

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

  // Drag to scroll states
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

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

  // Mouse Drag to Scroll Handlers
  const handleMouseDown = (e) => {
    if (!rowRef.current) return;
    setIsDragging(true);
    setHasDragged(false);
    setStartX(e.pageX - rowRef.current.offsetLeft);
    setScrollLeft(rowRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !rowRef.current) return;
    e.preventDefault();
    setHasDragged(true);
    const x = e.pageX - rowRef.current.offsetLeft;
    const walk = (x - startX) * 2; // scroll-fast multiplier
    rowRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleClickCapture = (e) => {
    if (hasDragged) {
      e.stopPropagation();
      e.preventDefault();
      setHasDragged(false);
    }
  };

  // Click handler for VIEW ALL / FILTER CONTENT
  const handleFilterClick = () => {
    const el = document.getElementById('categories-filter-pills');
    if (el) {
      window.scrollTo({ top: el.offsetTop - 100, behavior: 'smooth' });
    }
    window.dispatchEvent(new CustomEvent('select-category', { detail: defaultCategory || 'ALL' }));
  };

  if (!videos || videos.length === 0) return null;

  return (
    <section className="w-full relative group/row">
      {title && (
        <div className="flex items-center justify-between mb-4 px-4 sm:px-6 md:px-10">
          <h2 className="text-base md:text-lg font-black uppercase tracking-widest text-[#f59e0b] italic">{title}</h2>
          <div className="flex flex-col items-end gap-1">
            <span 
              onClick={handleFilterClick}
              className="text-[9px] font-black uppercase tracking-widest text-white/40 cursor-pointer hover:text-white transition"
            >
              View all
            </span>
            <div 
              onClick={handleFilterClick}
              className="text-secondary/40 font-black uppercase text-[8px] tracking-widest hidden sm:block cursor-pointer hover:text-white transition"
            >
              Filter Content
            </div>
          </div>
        </div>
      )}
      
      <div className="relative w-full">
        {/* Left Chevron Button */}
        {showLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-4 top-[35%] -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/70 backdrop-blur-md border border-white/10 flex items-center justify-center text-white opacity-0 group-hover/row:opacity-100 transition-opacity duration-300 hover:bg-black/90 hover:scale-110 active:scale-95 cursor-pointer shadow-lg hidden md:flex"
            aria-label="Scroll Left"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
        )}

        {/* Right Chevron Button */}
        {showRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-4 top-[35%] -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/70 backdrop-blur-md border border-white/10 flex items-center justify-center text-white opacity-0 group-hover/row:opacity-100 transition-opacity duration-300 hover:bg-black/90 hover:scale-110 active:scale-95 cursor-pointer shadow-lg hidden md:flex"
            aria-label="Scroll Right"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        )}

        {/* Horizontal Scroll Wrapper */}
        <div
          ref={rowRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          onClickCapture={handleClickCapture}
          className={`flex flex-row gap-4 md:gap-6 overflow-x-auto no-scrollbar py-4 w-full scroll-smooth px-4 sm:px-6 md:px-10 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        >
          {videos.map((v) => (
            <div key={v.id} onClick={() => !hasDragged && onVideoClick(v.id)} className="w-[200px] sm:w-[220px] md:w-[260px] shrink-0 pointer-events-auto">
              <VideoCard video={v} />
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

    // Find the featured video from Supabase
    const featuredVideo = useMemo(() => videos.find(v => v.is_featured) || null, [videos]);

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
  // Segmenting videos for home sections
    const allCategories = useMemo(() => {
    const dynamicCats = Array.from(new Set(videos.map(v => v.category).filter(Boolean)));
    const baseCats = ['Comedy', 'Series', 'Drama', 'Horror', 'Animation', 'Cartoon', 'Sports'];
    const cats = Array.from(new Set([...baseCats, ...dynamicCats]));
    return cats.filter(c => c !== 'Shorts');
  }, [videos]);

  const visibleCategories = useMemo(() => {
    if (selectedCategory === 'ALL') return allCategories;
    return allCategories.filter(c => c === selectedCategory);
  }, [allCategories, selectedCategory]);
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
  
  if (loading && videos.length === 0) return <Loader />;

  return (
    <div className="w-full max-w-full overflow-x-hidden text-[#f8fafc] pb-10 bg-transparent min-h-screen font-sans px-0 relative z-10">
      
      {/* ─── ALL CATEGORY: CINEMATIC MULTI-BANNER LAYOUT ─── */}
      
        <div className="flex flex-col gap-10 w-full relative z-10">
          
          {/* 1. TOP HERO BANNER (Universal Carousel) */}
          <HeroCarousel slides={[...(moviesList.slice(0,3)), ...(cartoonsList.slice(0,3)), ...videos].filter(Boolean)} />

          {/* 2. CATEGORIES FILTER PILLS */}
          <div id="categories-filter-pills" className="w-[calc(100%-2rem)] sm:w-[calc(100%-3rem)] md:w-[calc(100%-5rem)] mx-auto flex items-center justify-between border-y border-white/5 py-4">
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
              {['ALL', ...allCategories].map((cat) => (
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

          {/* ─── EXPLICIT CATEGORY ROWS ─── */}
          {['Comedy', 'Horror', 'Drama'].map((cat) => (
             visibleCategories.includes(cat) && (
               <VideoRow
                 key={`cat-row-${cat}`}
                 title={`${cat} Videos`}
                 videos={videos.filter(v => v.category === cat)}
                 onVideoClick={(id) => navigate('/watch/' + id)}
                 defaultCategory={cat}
               />
             )
          ))}

          {/* 4. MIDDLE HERO BANNER (Universal Carousel) */}
          <HeroCarousel slides={featuredVideo ? [featuredVideo, ...moviesList] : moviesList} />

          {['Series', 'Animation', 'Cartoon'].map((cat) => (
             visibleCategories.includes(cat) && (
               <VideoRow
                 key={`cat-row-${cat}`}
                 title={`${cat} Highlights`}
                 videos={videos.filter(v => v.category === cat)}
                 onVideoClick={(id) => navigate('/watch/' + id)}
                 defaultCategory={cat}
               />
             )
          ))}

          {/* Ad Banner (Inline) */}
          <div className="py-6 px-4 sm:px-0">
            <AdBanner position="banner" />
          </div>

          {['Sports'].map((cat) => (
             visibleCategories.includes(cat) && (
               <VideoRow
                 key={`cat-row-${cat}`}
                 title={`Best of ${cat}`}
                 videos={videos.filter(v => v.category === cat)}
                 onVideoClick={(id) => navigate('/watch/' + id)}
                 defaultCategory={cat}
               />
             )
          ))}

          {/* Any other dynamic categories not explicitly mentioned */}
          {visibleCategories.filter(c => !['Comedy', 'Horror', 'Drama', 'Series', 'Animation', 'Cartoon', 'Sports'].includes(c)).map((cat, i) => (
             <VideoRow
               key={`cat-row-extra-${cat}`}
               title={`More ${cat}`}
               videos={videos.filter(v => v.category === cat)}
               onVideoClick={(id) => navigate('/watch/' + id)}
               defaultCategory={cat}
             />
          ))}
          
        </div>

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
