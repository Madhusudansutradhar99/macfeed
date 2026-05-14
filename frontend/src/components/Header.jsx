import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Play, X, Mic, Music, Layout, Database, TrendingUp, History, Globe, AlertCircle, ChevronRight, Zap, User, LogIn } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

// ── L1 CACHE: localStorage with 2hr TTL ──
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

const YoutubeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" /><path d="m10 15 5-3-5-3z" />
  </svg>
);

export default function Header() {
  const location = useLocation();
  if (location.pathname === '/music') return null;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFreeMode, setIsFreeMode] = useState(false);
  const { user, setAuthModalOpen } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef();
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // Smart Header Logic: Permanent on Home and Search, Hover-to-reveal on others
  useEffect(() => {
    if (location.pathname === '/' || location.pathname === '/search') {
      setIsVisible(true);
      return;
    }

    const handleMouseMove = (e) => {
      // Show header if mouse is at the top (top 80px)
      if (e.clientY < 80) {
        setIsVisible(true);
      }
      // Hide header if mouse leaves top area (below 120px) AND not focused
      else if (e.clientY > 120 && !isFocused) {
        setIsVisible(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isFocused, location.pathname]);

  const scrapeGlobal = async (q) => {
    if (!q) return [];

    // L1 CACHE: Check localStorage first (0 API units)
    const cached = getCachedSearch(q);
    if (cached && cached.length > 0) return cached;
    
    // Backend Search (has L2 disk cache)
    try {
      const backRes = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: AbortSignal.timeout(4000) });
      if (backRes.ok) {
        const backData = await backRes.json();
        if (backData.results?.length > 0) {
          const mapped = backData.results.slice(0, 10).map(v => ({
            id: `yt-${v.ytId}`, ytId: v.ytId, title: v.title, thumbnail_url: v.thumbnail || v.thumbnail_url,
            video_url: `https://www.youtube.com/embed/${v.ytId}`, source: 'youtube', type: 'global'
          }));
          setCachedSearch(q, mapped); // Save to L1
          return mapped;
        }
      }
    } catch(e) {}

    return [];
  };

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length < 2) { setResults([]); return; }
      setLoading(true); setIsFreeMode(false);

      try {
        // 1. Fetch Local Results FAST
        const { data: dbData } = await supabase.from('videos').select('*').or(`title.ilike.%${query}%`).limit(4);
        const localResults = (dbData || []).map(v => ({ ...v, type: 'local' }));

        // Show local results immediately
        setResults(localResults);

        // 2. Fetch Global Results in background
        const globalResults = await scrapeGlobal(query);

        // Update results with both
        setResults(prev => {
          // Keep local results at top, add global
          const locals = prev.filter(r => r.type === 'local');
          return [...locals, ...globalResults];
        });
      } catch (e) {
        console.error("Search Error:", e);
      } finally {
        setLoading(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  const handleResultClick = async (v) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      if (v.type === 'local') navigate(`/watch/${v.id}`);
      else {
        const { data: existing } = await supabase.from('videos').select('id').or(`youtube_id.eq.${v.ytId},video_url.ilike.%${v.ytId}%`).limit(1);
        if (existing?.length) navigate(`/watch/${existing[0].id}`);
        else {
          const { data: inserted } = await supabase.from('videos').insert([{ title: v.title, video_url: v.video_url, youtube_id: v.ytId, thumbnail_url: v.thumbnail_url, source: 'youtube', category: 'YouTube', duration: v.duration || '--:--', views: 0 }]).select('id').single();
          if (inserted?.id) navigate(`/watch/${inserted.id}`);
          else navigate(`/watch/${v.id}`);
        }
      }
      setQuery(''); setResults([]); setIsFocused(false);
    } catch (e) { navigate(`/watch/${v.id}`); }
    finally { setIsSaving(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  };

  useEffect(() => {
    const handleClickOutside = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsFocused(false); };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [isHeaderHovered, setIsHeaderHovered] = useState(false);
  const isSearchPage = location.pathname === '/search';

  return (
    <motion.header
      initial={{ y: 0 }}
      animate={{ y: isVisible || isFocused ? 0 : -70 }}
      onMouseEnter={() => setIsHeaderHovered(true)}
      onMouseLeave={() => setIsHeaderHovered(false)}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className={`fixed top-0 left-0 right-0 h-[65px] bg-transparent z-[5000] flex items-center px-4 md:px-8 transition-colors duration-500 pointer-events-none ${isSearchPage ? 'justify-center' : ''}`}
      style={isSearchPage ? { backgroundColor: 'transparent', backdropFilter: 'none', WebkitBackdropFilter: 'none', borderBottom: 'none' } : {}}
    >
      {!isSearchPage && (
        <div className="flex items-center gap-4 shrink-0 mr-6 pointer-events-auto">
          <button onClick={() => window.dispatchEvent(new CustomEvent('toggle-sidebar'))} className="p-2.5 bg-secondary rounded-xl hover:bg-primary/10 border border-primary transition-all text-primary">
            <Layout className="w-5 h-5" />
          </button>
          <Link to="/" className="hidden md:flex items-center gap-2">
            <img src="/macfeed-logo.png" className="h-8 w-8" />
            <span className="text-primary text-xl font-black uppercase italic tracking-tighter leading-none">
              Mac<span className="text-accent" style={{ color: 'var(--accent-color)' }}>Feed</span>
            </span>
            <span className="bg-accent/10 text-accent text-[7px] font-black px-1.5 py-0.5 rounded border border-accent/20 ml-1" style={{ color: 'var(--accent-color)' }}>v3.0.2</span>
          </Link>
        </div>
      )}

      <div ref={dropdownRef} className="flex-1 min-w-[80px] max-w-2xl mx-auto relative z-[6000] pointer-events-auto">
        <div
          className={`search-container flex items-center transition-all duration-500 px-3 py-1 rounded-full border ${isFocused ? 'bg-secondary/95 border-accent ring-4 ring-accent/20 w-full shadow-2xl' : 'bg-secondary/40 border-primary w-full hover:bg-secondary/60'}`}
          style={isFocused ? { borderColor: 'var(--accent-color)', boxShadow: `0 0 20px ${'var(--accent-color)'}33` } : {}}
        >
          <div className={`flex items-center justify-center p-1.5 rounded-full transition-all ${isFocused || isHeaderHovered ? 'text-accent' : 'text-secondary'}`} style={isFocused || isHeaderHovered ? { color: 'var(--accent-color)' } : {}}>
            <Search className="w-4 h-4 md:w-5 md:h-5" />
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onKeyDown={(e) => e.key === 'Enter' && (navigate(`/search?q=${encodeURIComponent(query)}`), setIsFocused(false))}
            placeholder="SEARCH..."
            className="bg-transparent outline-none text-primary text-[10px] md:text-sm font-black italic uppercase tracking-tight transition-all duration-500 w-full min-w-0 px-2 md:px-4 placeholder:text-secondary/50"
          />
        </div>
        <AnimatePresence>
          {isFocused && !isSearchPage && (
            <motion.div 
                initial={{ opacity: 0, y: 15 }} 
                animate={{ opacity: 1, y: 10 }} 
                exit={{ opacity: 0, y: 15 }} 
                className="fixed md:absolute top-[70px] md:top-full left-4 right-4 md:left-0 md:right-0 mx-auto w-auto md:w-full max-w-2xl bg-secondary/95 backdrop-blur-3xl border border-primary rounded-[1.5rem] shadow-2xl overflow-hidden"
            >
              <div className="max-h-[60vh] overflow-y-auto pb-4">
                <div className="px-8 py-3 text-[9px] font-black text-secondary uppercase tracking-[0.4em] border-b border-primary">Results for "{query}"</div>
                {results.length > 0 ? results.map((r, idx) => (
                  <div key={r.id + idx} onClick={() => handleResultClick(r)} className="flex items-center gap-4 px-8 py-3 hover:bg-accent/10 cursor-pointer border-b border-primary last:border-0 group transition-all">
                    <div className="relative w-24 h-14 rounded-lg overflow-hidden bg-black shrink-0 shadow border border-primary"><img src={r.thumbnail_url} decoding="async" className="w-full h-full object-cover group-hover:scale-110 transition-all duration-500" /></div>
                    <div className="flex-1 min-w-0"><p className="text-primary text-sm font-black truncate group-hover:text-accent transition-colors uppercase italic tracking-tighter leading-none" style={{ color: 'var(--accent-color)' }}>{r.title}</p></div>
                  </div>
                )) : !loading && <div className="p-10 text-center text-secondary font-black uppercase italic tracking-[0.5em] text-[10px]">Searching...</div>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!isSearchPage && (
        <div className="shrink-0 ml-4 md:ml-8 flex items-center gap-2 md:gap-3 pointer-events-auto">
          <ThemeToggle />
          {user ? (
            <button 
              onClick={() => navigate('/settings')}
              className="w-9 h-9 rounded-full bg-gradient-to-br from-accent via-purple-500 to-accent p-[1.5px] shadow-xl transition-transform active:scale-90"
              style={{ backgroundImage: 'linear-gradient(to bottom right, var(--accent-color), #a855f7, var(--accent-color))' }}
            >
              <div className="w-full h-full rounded-full bg-secondary flex items-center justify-center font-black text-[10px] text-primary uppercase">
                {user.email?.[0] || <User className="w-4 h-4" />}
              </div>
            </button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setAuthModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-accent rounded-full font-black text-[9px] uppercase tracking-[0.2em] shadow-lg shadow-accent/30 transition-all border border-white/20"
              style={{ backgroundColor: 'var(--accent-color)', color: 'var(--text-on-accent)' }}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign In</span>
            </motion.button>
          )}
        </div>
      )}
      <AnimatePresence>{isFocused && !isSearchPage && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-primary/20 z-[4500] pointer-events-none" />}</AnimatePresence>
    </motion.header>
  );
}
