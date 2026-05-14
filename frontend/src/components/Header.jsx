import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user, setAuthModalOpen } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef();

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

  useEffect(() => {
    const handleClickOutside = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsFocused(false); };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isSearchPage = location.pathname === '/search';

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 h-[80px] bg-secondary/90 backdrop-blur-2xl z-[5000] flex items-center px-4 md:px-10 border-b border-primary/5 shadow-2xl"
    >
      <div className="flex items-center gap-4 shrink-0">
        {!isSearchPage && (
          <button onClick={() => window.dispatchEvent(new CustomEvent('toggle-sidebar'))} className="p-3 bg-primary/5 rounded-2xl hover:bg-yellow-400 hover:text-black transition-all text-primary border border-primary/10">
            <Layout className="w-6 h-6" />
          </button>
        )}
        <Link to="/" className="hidden sm:flex items-center gap-3">
          <img src="/macfeed-logo.png" className="h-10 w-10 drop-shadow-lg" />
          <span className="text-primary text-2xl font-black uppercase italic tracking-tighter leading-none">
            MAC<span className="text-yellow-400">FEED</span>
          </span>
          <span className="bg-yellow-400/10 text-yellow-400 text-[8px] font-black px-1.5 py-0.5 rounded border border-yellow-400/20">v3.0.6</span>
        </Link>
      </div>

      <div ref={dropdownRef} className="flex-grow flex justify-center max-w-3xl mx-auto px-4">
        <div className={`relative flex items-center transition-all duration-500 px-6 py-2.5 rounded-full border-2 w-full ${isFocused ? 'bg-secondary border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.2)]' : 'bg-primary/5 border-yellow-400/40'}`}>
          <Search className="w-5 h-5 text-yellow-400 shrink-0" />
          <input 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
            onFocus={() => setIsFocused(true)} 
            placeholder="SEARCH PREMIUM CONTENT..." 
            className="bg-transparent outline-none text-primary text-[12px] md:text-sm font-black uppercase tracking-tight w-full px-4 placeholder:text-secondary/40" 
          />
        </div>
        <AnimatePresence>
          {isFocused && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 15 }} exit={{ opacity: 0, y: 10 }} className="absolute top-full left-4 right-4 bg-secondary border-2 border-yellow-400 rounded-3xl shadow-2xl overflow-hidden z-[7000] mt-2">
              <div className="max-h-[60vh] overflow-y-auto no-scrollbar">
                {results.length > 0 ? results.map((r, idx) => (
                  <div key={r.id + idx} onClick={() => handleResultClick(r)} className="flex items-center gap-4 px-6 py-4 hover:bg-yellow-400 group cursor-pointer transition-all border-b border-primary/5 last:border-0">
                    <img src={r.thumbnail_url} className="w-20 h-12 rounded-lg object-cover" />
                    <p className="text-primary group-hover:text-black text-[13px] font-black uppercase italic tracking-tighter truncate">{r.title}</p>
                  </div>
                )) : <div className="p-10 text-center text-secondary/40 font-black uppercase text-[10px] tracking-[0.5em]">Searching...</div>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-3 md:gap-5 shrink-0">
        <ThemeToggle />
        {user ? (
          <button onClick={() => navigate('/settings')} className="w-11 h-11 rounded-full border-2 border-yellow-400/20 flex items-center justify-center bg-primary/5 hover:border-yellow-400 transition-all overflow-hidden p-0.5">
            {user.picture ? <img src={user.picture} className="w-full h-full rounded-full object-cover" /> : <span className="font-black text-[14px] text-primary">{user.email?.[0]?.toUpperCase()}</span>}
          </button>
        ) : (
          <button onClick={() => setAuthModalOpen(true)} className="px-6 py-2.5 bg-yellow-400 text-blue-900 rounded-full font-black text-[11px] uppercase tracking-widest shadow-lg hover:bg-white hover:text-black transition-all">SIGN IN</button>
        )}
      </div>
    </motion.header>
  );
}
