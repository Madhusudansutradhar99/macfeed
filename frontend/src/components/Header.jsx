import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Search, Layout, User, Palette } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';


// ── L1 CACHE ──
const CACHE_PREFIX = 'mf_search_';
const CACHE_TTL = 2 * 60 * 60 * 1000;
function getCachedSearch(query) {
  try {
    const key = CACHE_PREFIX + query.trim().toLowerCase();
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) { localStorage.removeItem(key); return null; }
    return data;
  } catch { return null; }
}
function setCachedSearch(query, data) {
  try {
    const key = CACHE_PREFIX + query.trim().toLowerCase();
    localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
  } catch { }
}

export default function Header() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const [isSearchHovered, setIsSearchHovered] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [loading, setLoading] = useState(false);
  const { user, setAuthModalOpen } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef();
  const inputRef = useRef(null);
  const lastScrollY = useRef(0);

  const scrapeGlobal = async (q) => {
    if (!q) return [];
    const cached = getCachedSearch(q);
    if (cached && cached.length > 0) return cached;
    try {
      const backRes = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (backRes.ok) {
        const backData = await backRes.json();
        if (backData.results?.length > 0) {
          const mapped = backData.results.slice(0, 10).map(v => ({
            id: `yt-${v.ytId}`, ytId: v.ytId, title: v.title, thumbnail_url: v.thumbnail || v.thumbnail_url,
            video_url: `https://www.youtube.com/embed/${v.ytId}`, source: 'youtube',
              type: 'global',
              published_at: item.snippet.publishedAt
          }));
          setCachedSearch(q, mapped);
          return mapped;
        }
      }

      // Fallback: Direct YouTube API call if backend fails or is unavailable
      const key = import.meta.env.VITE_YOUTUBE_API_KEY;
      if (key) {
        const ytQuery = encodeURIComponent(q + ' -shorts');
          const ytUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${ytQuery}&type=video&videoDuration=medium&order=date&maxResults=50&key=${key}`;
        const ytRes = await fetch(ytUrl);
        const ytData = await ytRes.json();
        if (ytData.items) {
          const mapped = ytData.items.map(item => ({
            id: `yt-${item.id.videoId}`, 
            ytId: item.id.videoId, 
            title: item.snippet.title, 
            thumbnail_url: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
            video_url: `https://www.youtube.com/embed/${item.id.videoId}`, 
            source: 'youtube',
              type: 'global',
              published_at: item.snippet.publishedAt
          })).filter(v => v.ytId);
          setCachedSearch(q, mapped);
          return mapped;
        }
      }
    } catch(e) {
      console.error('Search fallback failed:', e);
    }
    return [];
  };

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length < 2) { setResults([]); return; }
      setLoading(true);
      try {
        const { data: dbData } = await supabase.from('videos').select('*').or(`title.ilike.%${query}%`).limit(4);
        const localResults = (dbData || []).map(v => ({ ...v, type: 'local' }));
        setResults(localResults);
        const globalResults = await scrapeGlobal(query);
        setResults(prev => {
          const locals = prev.filter(r => r.type === 'local');
          return [...locals, ...globalResults];
        });
      } catch (e) {
      } finally {
        setLoading(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  const handleResultClick = (v) => {
    navigate(`/watch/${v.id}`);
    setQuery(''); setResults([]); setIsFocused(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      const q = query.trim();
      if (!q) return;
      navigate(`/search?q=${encodeURIComponent(q)}`);
      setIsFocused(false);
      setResults([]);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsFocused(false); };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Keep header input in sync with /search query param
    if (location.pathname === '/search') {
      const urlQuery = searchParams.get('q') || '';
      setQuery(urlQuery);
    }
  }, [location.pathname, searchParams]);

  useEffect(() => {
    // Show header when route changes
    setIsHeaderVisible(true);
    lastScrollY.current = 0;
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY || document.documentElement.scrollTop;

      if (isFocused) {
        setIsHeaderVisible(true);
        lastScrollY.current = currentY;
        return;
      }

      if (currentY < 10) {
        setIsHeaderVisible(true);
      } else if (currentY > lastScrollY.current + 2) {
        setIsHeaderVisible(false);
      } else if (currentY < lastScrollY.current - 2) {
        setIsHeaderVisible(true);
      }

      lastScrollY.current = currentY;
    };

    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [isFocused]);

  const isSearchPage = location.pathname === '/search';
  const isHomePage = location.pathname === '/';
  const showExpandedSearch = isFocused || query.trim().length > 0 || isSearchHovered;

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: isHeaderVisible ? 0 : -80 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 h-[70px] z-[5000] flex items-center px-4 md:px-10 glass-header"
    >
      <div className="flex items-center gap-3 shrink-0">
        {!isSearchPage && (
          <button onClick={() => window.dispatchEvent(new CustomEvent('toggle-sidebar'))} className="w-10 h-10 rounded-xl hover:text-white transition-all duration-300 border-2 active:scale-90 flex items-center justify-center" style={{ backgroundColor: 'transparent', borderColor: 'var(--accent-color)', color: 'var(--accent-color)' }}>
            <Layout className="w-4 h-4" />
          </button>
        )}
        <Link to="/" className="hidden sm:flex items-center gap-3 pl-1">
          <img src="/watermark.png" className="h-9 w-9 drop-shadow-lg" />
          <span className="text-primary text-[1.45rem] font-black uppercase italic tracking-tighter leading-none">
            MAC<span style={{ color: 'var(--accent-color)' }}>FEED</span>
          </span>
          <span className="text-[7px] font-black px-1.5 py-0.5 rounded border" style={{ color: 'var(--accent-color)', borderColor: 'var(--accent-color)', backgroundColor: 'var(--accent-color)', opacity: 0.12 }}>v3.0.6</span>
        </Link>
        {isHomePage && (
          <div className="hidden lg:flex items-center gap-6 ml-8 text-[11px] font-black uppercase tracking-widest text-white/50">
            <span 
              className="hover:text-white transition-colors cursor-pointer"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('open-info-modal', {
                  detail: {
                    title: 'About MacFeed',
                    content: 'MacFeed is the ultimate premium media and entertainment destination. We curate high-quality cartoons, movies, TV series, and independent music to provide an immersive, color-shifting aesthetic experience. Dive into our handpicked playlists or leverage our advanced Smart Search feature to find your next obsession.'
                  }
                }));
              }}
            >
              About
            </span>
            <span className="hover:text-white transition-colors cursor-pointer" onClick={() => navigate('/movies')}>Marketplace</span>
            <span className="hover:text-white transition-colors cursor-pointer" onClick={() => navigate('/music')}>For Artists</span>
            <span className="hover:text-white transition-colors cursor-pointer" onClick={() => navigate('/playlists')}>Exhibitions</span>
          </div>
        )}
      </div>

      <div ref={dropdownRef} className="flex-grow flex justify-center max-w-2xl mx-auto px-4">
        <motion.div
          onMouseEnter={() => setIsSearchHovered(true)}
          onMouseLeave={() => {
            if (!isFocused && !query.trim()) setIsSearchHovered(false);
          }}
          onClick={() => {
            setIsFocused(true);
            setTimeout(() => inputRef.current?.focus(), 0);
          }}
          className={`relative flex items-center transition-all duration-300 px-3 md:px-4 py-2 rounded-2xl ${isFocused ? 'shadow-[0_0_40px] drop-shadow-lg' : ''}`}
          style={{
            width: showExpandedSearch ? '100%' : '56px',
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: isFocused ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)',
            boxShadow: isFocused ? `0 0 30px rgba(var(--accent-rgb),0.3)` : '0 4px 20px rgba(0,0,0,0.2)',
            backgroundColor: isFocused ? 'rgba(var(--bg-primary), 0.9)' : 'rgba(255,255,255,0.03)',
            backdropFilter: 'blur(10px)',
            cursor: showExpandedSearch ? 'text' : 'pointer'
          }}
        >
          <Search className="w-5 h-5 shrink-0" style={{ color: 'var(--accent-color)' }} />
          <AnimatePresence>
            {showExpandedSearch && (
              <motion.input
                ref={inputRef}
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: '100%', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onKeyDown={handleKeyDown}
                placeholder="SEARCH PREMIUM CONTENT..."
                className="bg-transparent outline-none text-primary text-[12px] md:text-sm font-black uppercase tracking-tight w-full px-3 md:px-4 placeholder:text-primary/35"
              />
            )}
          </AnimatePresence>
        </motion.div>
        <AnimatePresence>
          {isFocused && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 15 }} exit={{ opacity: 0, y: 10 }} className="absolute top-full left-4 right-4 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-[7000] mt-3 glass-panel">
              <div className="max-h-[60vh] overflow-y-auto no-scrollbar">
                {results.length > 0 ? results.map((r, idx) => (
                  <div key={r.id + idx} onClick={() => handleResultClick(r)} className="flex items-center gap-4 px-6 py-4 group cursor-pointer transition-all border-b border-primary/5 last:border-0" style={{ backgroundColor: 'transparent' }}>
                    <img src={r.thumbnail_url} className="w-20 h-12 rounded-lg object-cover" />
                    <p className="text-primary group-hover:text-primary text-[13px] font-black uppercase italic tracking-tighter truncate">{r.title}</p>
                  </div>
                )) : <div className="p-10 text-center text-secondary/40 font-black uppercase text-[10px] tracking-[0.5em]">Searching...</div>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-2 md:gap-4 shrink-0">
        {user ? (
          <button onClick={() => navigate('/settings')} className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80 transition-all duration-300 overflow-hidden p-0.5 active:scale-90 border-2" style={{ borderColor: 'var(--accent-color)', backgroundColor: 'transparent' }}>
            {user.picture ? <img src={user.picture} className="w-full h-full rounded-full object-cover" /> : <span className="font-black text-[12px]" style={{ color: 'var(--accent-color)' }}>{user.email?.[0]?.toUpperCase()}</span>}
          </button>
        ) : (
          <button onClick={() => setAuthModalOpen(true)} className="px-4 py-2 rounded-lg font-black text-[8px] md:text-[9px] uppercase tracking-widest shadow-[0_0_15px_rgba(var(--accent-rgb),0.3)] hover:shadow-[0_0_25px_rgba(var(--accent-rgb),0.55)] hover:scale-105 transition-all duration-300 active:scale-95 flex items-center gap-1.5" style={{ backgroundColor: 'var(--accent-color)', color: 'var(--text-on-accent, #ffffff)' }}>
            <User className="w-3 h-3 md:w-3.5 md:h-3.5" />
            {isHomePage ? 'SIGN UP / LOG IN' : 'SIGN IN'}
          </button>
        )}
      </div>
    </motion.header>
  );
}
