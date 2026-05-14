import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Search, Layout, User, Palette } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

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
            video_url: `https://www.youtube.com/embed/${v.ytId}`, source: 'youtube', type: 'global'
          }));
          setCachedSearch(q, mapped);
          return mapped;
        }
      }
    } catch(e) {}
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
    lastScrollY.current = window.scrollY;
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY;

      if (isFocused) {
        setIsHeaderVisible(true);
        lastScrollY.current = currentY;
        return;
      }

      if (currentY < 20) {
        setIsHeaderVisible(true);
      } else if (currentY > lastScrollY.current + 6) {
        setIsHeaderVisible(false);
      } else if (currentY < lastScrollY.current - 6) {
        setIsHeaderVisible(true);
      }

      lastScrollY.current = currentY;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isFocused]);

  const isSearchPage = location.pathname === '/search';
  const isHomePage = location.pathname === '/';
  const showExpandedSearch = isHomePage || isFocused || query.trim().length > 0 || isSearchHovered;

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: isHeaderVisible ? 0 : -110 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 h-[86px] z-[5000] flex items-center px-4 md:px-10 border-b border-primary/10 shadow-none"
      style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.18) 100%)', backdropFilter: 'blur(18px)' }}
    >
      <div className="flex items-center gap-3 shrink-0">
        {!isSearchPage && (
          <button onClick={() => window.dispatchEvent(new CustomEvent('toggle-sidebar'))} className="w-14 h-14 rounded-2xl hover:text-white transition-all duration-300 border active:scale-90 flex items-center justify-center" style={{ backgroundColor: 'var(--accent-color)', borderColor: 'var(--accent-color)', color: '#ffffff', boxShadow: '0 12px 30px rgba(0,0,0,0.08)' }}>
            <Layout className="w-5 h-5" />
          </button>
        )}
        <Link to="/" className="hidden sm:flex items-center gap-3 pl-1">
          <img src="/macfeed-logo.png" className="h-9 w-9 drop-shadow-lg" />
          <span className="text-primary text-[1.45rem] font-black uppercase italic tracking-tighter leading-none">
            MAC<span style={{ color: 'var(--accent-color)' }}>FEED</span>
          </span>
          <span className="text-[7px] font-black px-1.5 py-0.5 rounded border" style={{ color: 'var(--accent-color)', borderColor: 'var(--accent-color)', backgroundColor: 'var(--accent-color)', opacity: 0.12 }}>v3.0.6</span>
        </Link>
      </div>

      <div ref={dropdownRef} className="flex-grow flex justify-center max-w-4xl mx-auto px-4">
        <motion.div
          onMouseEnter={() => setIsSearchHovered(true)}
          onMouseLeave={() => {
            if (!isFocused && !query.trim()) setIsSearchHovered(false);
          }}
          onClick={() => {
            setIsFocused(true);
            setTimeout(() => inputRef.current?.focus(), 0);
          }}
          className={`relative flex items-center transition-all duration-300 px-4 md:px-6 py-3 md:py-4 rounded-[1.6rem] ${isFocused ? 'shadow-[0_0_40px] drop-shadow-lg' : ''}`}
          style={{
            width: showExpandedSearch ? '100%' : '56px',
            borderWidth: '2px',
            borderStyle: 'solid',
            borderColor: 'var(--accent-color)',
            boxShadow: isFocused ? `0 0 40px var(--accent-color)44` : 'none',
            backgroundColor: 'rgba(255,255,255,0.30)',
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
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 15 }} exit={{ opacity: 0, y: 10 }} className="absolute top-full left-4 right-4 rounded-[1.5rem] shadow-2xl overflow-hidden z-[7000] mt-2" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid rgba(255,255,255,0.10)' }}>
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
        <ThemeToggle />
        {user ? (
          <button onClick={() => navigate('/settings')} className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80 transition-all duration-300 overflow-hidden p-0.5 active:scale-90" style={{ borderWidth: '2px', borderStyle: 'solid', borderColor: 'var(--accent-color)', backgroundColor: 'var(--accent-color)' }}>
            {user.picture ? <img src={user.picture} className="w-full h-full rounded-full object-cover" /> : <span className="font-black text-[12px] text-white">{user.email?.[0]?.toUpperCase()}</span>}
          </button>
        ) : (
          <button onClick={() => setAuthModalOpen(true)} className="px-5 py-2 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:scale-105 transition-all duration-300 active:scale-95" style={{ backgroundColor: 'var(--accent-color)' }}>SIGN IN</button>
        )}
      </div>
    </motion.header>
  );
}
