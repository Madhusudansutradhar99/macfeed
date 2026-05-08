import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import VideoCard from '../components/VideoCard';
import PremiumLoader from '../components/PremiumLoader';
import { Search, SlidersHorizontal, Video, Globe, AlertCircle, Database, Zap, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

// ── L1 CACHE: localStorage with 2hr TTL ──
const CACHE_PREFIX = 'mf_search_';
const CACHE_TTL = 2 * 60 * 60 * 1000; // 2 hours in ms

function getCachedSearch(query) {
  try {
    const key = CACHE_PREFIX + query.trim().toLowerCase();
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) {
      localStorage.removeItem(key);
      return null;
    }
    return data;
  } catch { return null; }
}

function setCachedSearch(query, data) {
  try {
    const key = CACHE_PREFIX + query.trim().toLowerCase();
    localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
  } catch { /* localStorage full — ignore */ }
}

// Global Search is now handled entirely by the backend /api/search (with L2 caching)

export default function SearchResults() {
  const { user, setAuthModalOpen } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Search is now allowed for guests too!
  }, [user, navigate, setAuthModalOpen]);

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFreeMode, setIsFreeMode] = useState(false);
  const [cacheSource, setCacheSource] = useState(null);
  const q = params.get('q') || '';

  const performSearch = useCallback(async (query) => {
    if (!query) return;
    setLoading(true);
    setIsFreeMode(false);
    setCacheSource(null);
    
    // 1. LOCAL SEARCH (Immediate — Supabase)
    try {
      const { data: dbData } = await supabase.from('videos').select('*').or(`title.ilike.%${query}%`);
      const localResults = (dbData || []).map(v => ({ ...v, type: 'local', source: 'local' }));
      setResults(localResults);
    } catch (e) { console.error("Local search failed", e); }

    // 2. L1 CACHE CHECK — localStorage
    const cached = getCachedSearch(query);
    if (cached && cached.length > 0) {
      setCacheSource('local-cache');
      setIsFreeMode(true);
      setResults(prev => {
        const existingIds = new Set(prev.map(p => p.id || p.ytId));
        const uniqueNew = cached.filter(g => !existingIds.has(g.id));
        return [...prev, ...uniqueNew];
      });
      setLoading(false);
      return; // 🎯 0 API units used!
    }

    // 3. GLOBAL SEARCH — Backend only
    // Strategy: Backend Master Engine (has disk cache = L2)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) throw new Error('Backend failed');
      const data = await res.json();
      if (data.results?.length > 0) {
        const globalResults = data.results.map(v => ({
          id: `yt-${v.ytId}`, ytId: v.ytId, title: v.title, thumbnail_url: v.thumbnail || v.thumbnail_url,
          video_url: `https://www.youtube.com/embed/${v.ytId}`, source: 'youtube', type: 'global'
        }));
        
        setIsFreeMode(true);
        setCacheSource(data.source);
        // Save to L1 localStorage cache for next time
        setCachedSearch(query, globalResults);
        setResults(prev => {
          const existingIds = new Set(prev.map(p => p.id || p.ytId));
          const uniqueNew = globalResults.filter(g => !existingIds.has(g.id));
          return [...prev, ...uniqueNew];
        });
      }
    } catch (err) {
      console.warn("Global search failed:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { performSearch(q); }, [q, performSearch]);

  return (
    <div className="min-h-screen px-4 md:px-10 py-10 bg-primary">
      <button 
        onClick={() => navigate('/')} 
        className="mb-8 flex items-center gap-2 text-secondary hover:text-primary transition-all group bg-secondary/30 hover:bg-secondary/50 px-4 py-2 rounded-full border border-white/5 hover:border-white/10 w-fit"
      >
         <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
         <span className="text-[10px] font-black uppercase tracking-[0.3em]">Back to Discover</span>
      </button>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
           <h1 className="text-5xl font-black text-primary uppercase italic tracking-tighter leading-none mb-4">Results</h1>
           <div className="flex items-center gap-4">
              <span className="px-3 py-1 bg-red-600 rounded-lg text-[10px] font-black text-white uppercase tracking-widest italic">{q}</span>
              {isFreeMode && <span className="flex items-center gap-2 text-green-500 text-[10px] font-black uppercase tracking-[0.2em] animate-pulse"><Zap className="w-3 h-3 fill-green-500" /> MacFeed Search Engine Online</span>}
              {cacheSource === 'local-cache' && <span className="flex items-center gap-2 text-cyan-400 text-[10px] font-black uppercase tracking-[0.2em]">⚡ Instant Cache (0 API units)</span>}
              {cacheSource === 'disk-cache' && <span className="flex items-center gap-2 text-blue-400 text-[10px] font-black uppercase tracking-[0.2em]">💾 Server Cache (0 API units)</span>}
           </div>
        </div>
        <p className="text-secondary text-[10px] font-black uppercase tracking-[0.4em]">{results.length} Matches Found</p>
      </div>

      {loading && results.length === 0 && <PremiumLoader />}

      {results.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-8">
          {results.map((video, idx) => (
            <motion.div key={video.id + idx} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.03 }}>
              <VideoCard video={video} />
              <div className="mt-3 flex items-center gap-2 px-1">
                 {video.type === 'local' ? (
                   <span className="text-[8px] text-purple-400 font-black uppercase flex items-center gap-1 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/10"><Database className="w-2.5 h-2.5" /> Library</span>
                 ) : (
                   <span className="text-[8px] text-red-500 font-black uppercase flex items-center gap-1 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/10"><Globe className="w-2.5 h-2.5" /> YouTube Global</span>
                 )}
              </div>
            </motion.div>
          ))}
        </div>
      ) : !loading ? (
        <div className="py-40 text-center flex flex-col items-center">
           <Search className="w-16 h-16 text-secondary/10 mb-6" />
            <p className="text-secondary/20 font-black uppercase tracking-[0.5em] text-2xl italic">No Content Matches</p>
            <div className="mt-8 flex items-center gap-6">
              <button onClick={() => performSearch(q)} className="text-purple-500 font-black text-[10px] uppercase tracking-widest hover:text-white transition-colors">Try Rescan</button>
              <div className="w-[1px] h-4 bg-white/10" />
              <button onClick={() => navigate('/')} className="text-secondary font-black text-[10px] uppercase tracking-widest hover:text-primary transition-colors">Go Home</button>
            </div>
        </div>
      ) : null}
    </div>
  );
}
