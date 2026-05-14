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
  const { user, setAuthModalOpen } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef();
  const [isVisible, setIsVisible] = useState(true);

  // Header is now always visible for Purana Style stability
  useEffect(() => {
    setIsVisible(true);
  }, [location.pathname]);

  const scrapeGlobal = async (q) => {
    if (!q) return [];
    const cached = getCachedSearch(q);
    if (cached && cached.length > 0) return cached;
    try {
      const backRes = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: AbortSignal.timeout(4000) });
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

  const isSearchPage = location.pathname === '/search';

  return (
    <motion.header
      initial={{ y: 0 }}
      animate={{ y: isVisible || isFocused ? 0 : -70 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className={`fixed top-0 left-0 right-0 h-[60px] bg-secondary/80 backdrop-blur-xl z-[5000] flex items-center px-3 md:px-6 transition-all duration-500 border-b border-primary/10`}
    >
      <div className="flex items-center gap-3 shrink-0 mr-4">
        {!isSearchPage && (
          <button onClick={() => window.dispatchEvent(new CustomEvent('toggle-sidebar'))} className="p-2 bg-primary/5 rounded-xl hover:bg-primary/10 border border-primary/10 transition-all text-primary pointer-events-auto">
            <Layout className="w-5 h-5" />
          </button>
        )}
        <Link to="/" className="hidden sm:flex items-center gap-2 pointer-events-auto">
          <img src="/macfeed-logo.png" className="h-7 w-7" />
          <span className="text-primary text-lg font-black uppercase italic tracking-tighter leading-none">
            MAC<span className="text-accent" style={{ color: 'var(--accent-color)' }}>FEED</span>
          </span>
          <span className="bg-accent/10 text-accent text-[6px] font-black px-1 py-0.5 rounded border border-accent/20" style={{ color: 'var(--accent-color)' }}>v3.0.6</span>
        </Link>
      </div>

      <div ref={dropdownRef} className="flex-grow flex justify-center max-w-2xl mx-auto px-2 pointer-events-auto">
        <div className={`relative flex items-center transition-all duration-500 px-4 py-1.5 rounded-full border-2 w-full max-w-full ${isFocused ? 'bg-secondary border-yellow-400 ring-4 ring-yellow-400/20' : 'bg-primary/5 border-yellow-400/60'}`} style={{ borderColor: '#facc15' }}>
          <Search className="w-4 h-4 text-secondary/40 shrink-0" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} onFocus={() => setIsFocused(true)} onKeyDown={(e) => e.key === 'Enter' && (navigate(`/search?q=${encodeURIComponent(query)}`), setIsFocused(false))} placeholder="SEARCH..." className="bg-transparent outline-none text-primary text-[10px] md:text-xs font-black uppercase tracking-tight w-full px-3 placeholder:text-secondary/30" />
        </div>
        <AnimatePresence>
          {isFocused && !isSearchPage && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 12 }} exit={{ opacity: 0, y: 10 }} className="fixed md:absolute top-[60px] md:top-full left-4 right-4 md:left-0 md:right-0 max-w-2xl bg-secondary border border-primary rounded-2xl shadow-2xl overflow-hidden z-[7000]">
              <div className="max-h-[50vh] overflow-y-auto">
                <div className="px-6 py-2 text-[8px] font-black text-secondary uppercase tracking-[0.4em] border-b border-primary">Results for "{query}"</div>
                {results.length > 0 ? results.map((r, idx) => (
                  <div key={r.id + idx} onClick={() => handleResultClick(r)} className="flex items-center gap-3 px-6 py-3 hover:bg-accent/5 cursor-pointer border-b border-primary last:border-0 group transition-all">
                    <img src={r.thumbnail_url} className="w-16 h-10 rounded object-cover shadow-sm" />
                    <p className="text-primary text-[11px] font-black truncate uppercase italic tracking-tighter leading-none" style={{ color: 'var(--accent-color)' }}>{r.title}</p>
                  </div>
                )) : !loading && <div className="p-8 text-center text-secondary font-black uppercase italic tracking-[0.5em] text-[9px]">Searching...</div>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-2 md:gap-3 shrink-0 ml-4 pointer-events-auto">
        <ThemeToggle />
        {user ? (
          <button onClick={() => navigate('/settings')} className="w-8 h-8 rounded-full border border-primary/20 flex items-center justify-center bg-primary/5 hover:bg-primary/10 transition-all overflow-hidden">
            {user.picture ? <img src={user.picture} className="w-full h-full object-cover" /> : <span className="font-black text-[10px] text-primary">{user.email?.[0]?.toUpperCase()}</span>}
          </button>
        ) : (
          <button onClick={() => setAuthModalOpen(true)} className="px-4 py-1.5 bg-accent rounded-full font-black text-[8px] uppercase tracking-widest shadow-lg text-white" style={{ backgroundColor: 'var(--accent-color)' }}>SIGN IN</button>
        )}
      </div>
      <AnimatePresence>{isFocused && !isSearchPage && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-[4500] pointer-events-none" />}</AnimatePresence>
    </motion.header>
  );
}
