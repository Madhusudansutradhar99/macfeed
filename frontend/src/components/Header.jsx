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
      animate={{ y: isVisible || isFocused ? 0 : -80 }}
      onMouseEnter={() => setIsHeaderHovered(true)}
      onMouseLeave={() => setIsHeaderHovered(false)}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className={`fixed top-0 left-0 right-0 h-[65px] md:h-[80px] bg-primary/95 backdrop-blur-2xl z-[5000] flex items-center px-4 md:px-10 border-b border-white/5 transition-all duration-500`}
    >
      {!isSearchPage && (
        <div className="flex items-center gap-4 md:gap-6 shrink-0 pointer-events-auto">
          <Link to="/" className="flex items-center gap-2 active:scale-95 transition-transform">
            <img src="/macfeed-logo.png" className="h-8 w-8 md:h-10 md:w-10 object-contain" />
            <span className="text-primary text-lg md:text-2xl font-black uppercase italic tracking-tighter leading-none">
              Mac<span className="text-accent" style={{ color: 'var(--accent-color)' }}>Feed</span>
            </span>
          </Link>
        </div>
      )}

      <div ref={dropdownRef} className="flex-1 max-w-2xl mx-4 md:mx-auto relative z-[6000] pointer-events-auto">
        <div
          className={`search-container flex items-center transition-all duration-500 px-4 py-2 rounded-full border border-white/10 ${isFocused ? 'bg-secondary border-accent shadow-2xl scale-[1.02]' : 'bg-secondary/50 hover:bg-secondary'}`}
          style={isFocused ? { borderColor: 'var(--accent-color)', boxShadow: '0 0 20px rgba(255, 255, 255, 0.1)' } : {}}
        >
          <Search className={`w-4 h-4 md:w-5 md:h-5 transition-colors ${isFocused ? 'text-accent' : 'text-white/40'}`} style={isFocused ? { color: 'var(--accent-color)' } : {}} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onKeyDown={(e) => e.key === 'Enter' && (navigate(`/search?q=${encodeURIComponent(query)}`), setIsFocused(false))}
            placeholder="Search..."
            className="bg-transparent outline-none text-primary text-xs md:text-sm font-bold w-full px-3 placeholder:text-white/20"
          />
          {loading && isFocused && <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin ml-2" style={{ borderColor: 'var(--accent-color)', borderTopColor: 'transparent' }} />}
        </div>
        
        <AnimatePresence>
          {isFocused && !isSearchPage && (
            <motion.div 
                initial={{ opacity: 0, y: 15 }} 
                animate={{ opacity: 1, y: 10 }} 
                exit={{ opacity: 0, y: 15 }} 
                className="fixed md:absolute top-[70px] md:top-full left-4 right-4 md:left-0 md:right-0 mx-auto w-auto md:w-full bg-[#111] backdrop-blur-3xl border border-white/10 rounded-[1.5rem] md:rounded-[2rem] shadow-2xl overflow-hidden"
            >
              <div className="max-h-[60vh] overflow-y-auto pb-6 custom-scrollbar">
                <div className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest border-b border-white/5">Results for "{query}"</div>
                {results.length > 0 ? results.map((r, idx) => (
                  <div key={r.id + idx} onClick={() => handleResultClick(r)} className="flex items-center gap-4 px-6 py-4 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-0 group transition-all">
                    <div className="relative w-24 h-14 rounded-lg overflow-hidden bg-black shrink-0 shadow-md border border-white/5"><img src={r.thumbnail_url} decoding="async" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /></div>
                    <div className="flex-1 min-w-0"><p className="text-white text-sm font-bold truncate group-hover:text-accent transition-colors tracking-tight" style={{ color: hovered ? 'var(--accent-color)' : 'white' }}>{r.title}</p><div className="flex items-center gap-2 mt-1">{r.type === 'local' ? <span className="text-[8px] text-accent font-black uppercase bg-accent/10 px-1.5 py-0.5 rounded" style={{ color: 'var(--accent-color)', backgroundColor: 'var(--accent-color)22' }}>MacFeed</span> : <span className="text-[8px] text-red-500 font-black uppercase bg-red-500/10 px-1.5 py-0.5 rounded">YouTube</span>}</div></div>
                  </div>
                )) : !loading && <div className="p-10 text-center text-white/30 font-bold uppercase tracking-widest text-[10px]">No results found</div>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!isSearchPage && (
        <div className="shrink-0 flex items-center gap-3 pointer-events-auto">
          <div className="hidden md:block">
            <ThemeToggle />
          </div>
          
          {user ? (
            <button 
              onClick={() => navigate('/settings')}
              className="w-9 h-9 md:w-11 md:h-11 rounded-full bg-gradient-to-br from-accent to-purple-600 p-[2px] shadow-lg active:scale-90 transition-transform"
              style={{ backgroundImage: 'linear-gradient(to bottom right, var(--accent-color), #7c3aed)' }}
            >
              <div className="w-full h-full rounded-full bg-[#000] flex items-center justify-center font-black text-[10px] md:text-xs text-white">
                {user.email?.[0]?.toUpperCase() || <User size={16} />}
              </div>
            </button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setAuthModalOpen(true)}
              className="px-4 py-2 bg-accent rounded-full font-black text-[10px] uppercase tracking-widest text-white shadow-lg active:opacity-80"
              style={{ backgroundColor: 'var(--accent-color)' }}
            >
              Sign In
            </motion.button>
          )}
        </div>
      )}
      <AnimatePresence>{isFocused && !isSearchPage && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[4500] pointer-events-none" />}</AnimatePresence>
    </motion.header>
  );
}
