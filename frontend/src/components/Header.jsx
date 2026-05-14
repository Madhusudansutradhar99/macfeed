import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Layout, User } from 'lucide-react';
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

export default function Header() {
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { user, setAuthModalOpen } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef();

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
          const { data: inserted } = await supabase.from('videos').insert([{ title: v.title, video_url: v.video_url, youtube_id: v.ytId, thumbnail_url: v.thumbnail_url, source: 'youtube', category: 'YouTube', duration: '--:--', views: 0 }]).select('id').single();
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
      className="fixed top-0 left-0 right-0 h-[70px] bg-secondary/80 backdrop-blur-xl z-[5000] flex items-center px-4 md:px-8 border-b border-primary/10"
    >
      <div className="flex items-center gap-4 shrink-0">
        {!isSearchPage && (
          <button onClick={() => window.dispatchEvent(new CustomEvent('toggle-sidebar'))} className="p-2.5 bg-primary/5 rounded-2xl hover:bg-primary/10 border border-primary/10 transition-all text-primary">
            <Layout className="w-6 h-6" />
          </button>
        )}
        <Link to="/" className="hidden sm:flex items-center gap-2">
          <img src="/macfeed-logo.png" className="h-8 w-8" />
          <span className="text-primary text-xl font-black uppercase italic tracking-tighter leading-none">
            MAC<span className="text-accent" style={{ color: 'var(--accent-color)' }}>FEED</span>
          </span>
        </Link>
      </div>

      <div ref={dropdownRef} className="flex-grow flex justify-center max-w-2xl mx-auto px-4">
        <div className={`relative flex items-center transition-all duration-500 px-6 py-2 rounded-full border-2 w-full ${isFocused ? 'bg-secondary border-yellow-400 ring-8 ring-yellow-400/10' : 'bg-primary/5 border-yellow-400/60'}`} style={{ borderColor: '#facc15' }}>
          <Search className="w-5 h-5 text-secondary/40 shrink-0" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} onFocus={() => setIsFocused(true)} placeholder="SEARCH VIDEOS..." className="bg-transparent outline-none text-primary text-[11px] md:text-xs font-black uppercase tracking-tight w-full px-4 placeholder:text-secondary/30" />
        </div>
        <AnimatePresence>
          {isFocused && !isSearchPage && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 15 }} exit={{ opacity: 0, y: 10 }} className="fixed md:absolute top-[75px] md:top-full left-4 right-4 md:left-0 md:right-0 max-w-2xl bg-secondary border border-primary rounded-3xl shadow-2xl overflow-hidden z-[7000]">
              <div className="max-h-[60vh] overflow-y-auto">
                {results.length > 0 ? results.map((r, idx) => (
                  <div key={r.id + idx} onClick={() => handleResultClick(r)} className="flex items-center gap-4 px-6 py-4 hover:bg-accent/5 cursor-pointer border-b border-primary last:border-0 group transition-all">
                    <img src={r.thumbnail_url} className="w-20 h-12 rounded-lg object-cover shadow-sm" />
                    <p className="text-primary text-[12px] font-black truncate uppercase italic tracking-tighter leading-none">{r.title}</p>
                  </div>
                )) : !loading && <div className="p-10 text-center text-secondary font-black uppercase italic tracking-[0.5em] text-[10px]">No Results Found</div>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-3 md:gap-5 shrink-0">
        <ThemeToggle />
        {user ? (
          <button onClick={() => navigate('/settings')} className="w-10 h-10 rounded-full border-2 border-primary/20 flex items-center justify-center bg-primary/5 hover:bg-primary/10 transition-all overflow-hidden">
            {user.picture ? <img src={user.picture} className="w-full h-full object-cover" /> : <span className="font-black text-[12px] text-primary">{user.email?.[0]?.toUpperCase()}</span>}
          </button>
        ) : (
          <button onClick={() => setAuthModalOpen(true)} className="px-6 py-2 bg-accent rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg text-white" style={{ backgroundColor: 'var(--accent-color)' }}>SIGN IN</button>
        )}
      </div>
    </motion.header>
  );
}
