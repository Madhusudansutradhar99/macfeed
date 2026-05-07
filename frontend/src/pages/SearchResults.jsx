import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import VideoCard from '../components/VideoCard';
import PremiumLoader from '../components/PremiumLoader';
import { Search, SlidersHorizontal, Video, Globe, AlertCircle, Database, Zap, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const YT_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

// CORS Bypassing & Multi-Engine Config
const PROXIES = [
  "https://api.allorigins.win/get?url=",
  "https://corsproxy.io/?",
  "" // Direct as last resort
];

const PIPED_INSTANCES = [
  "https://pipedapi.kavin.rocks",
  "https://pipedapi.tokhmi.xyz",
  "https://pipedapi.moomoo.me",
  "https://pipedapi.systilly.xyz",
  "https://api.piped.victr.me"
];

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
  const q = params.get('q') || '';

  const performSearch = useCallback(async (query) => {
    if (!query) return;
    setLoading(true);
    setIsFreeMode(false);
    
    // 1. LOCAL SEARCH (Immediate)
    try {
      const { data: dbData } = await supabase.from('videos').select('*').or(`title.ilike.%${query}%`);
      const localResults = (dbData || []).map(v => ({ ...v, type: 'local', source: 'local' }));
      setResults(localResults);
    } catch (e) { console.error("Local search failed", e); }

    // 2. GLOBAL SEARCH (Parallel Winning Strategy)
    const fetchPromises = [];

    // Strategy A: Backend Master Engine
    fetchPromises.push((async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: AbortSignal.timeout(6000) });
      if (!res.ok) throw new Error('Backend failed');
      const data = await res.json();
      if (!data.results?.length) throw new Error('Backend empty');
      return data.results.map(v => ({
        id: `yt-${v.ytId}`, ytId: v.ytId, title: v.title, thumbnail_url: v.thumbnail || v.thumbnail_url,
        video_url: `https://www.youtube.com/embed/${v.ytId}`, source: 'youtube', type: 'global'
      }));
    })());

    // Strategy B: Official API Client-Side
    if (YT_API_KEY) {
      fetchPromises.push((async () => {
        const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=20&order=viewCount&key=${YT_API_KEY}`, { signal: AbortSignal.timeout(5000) });
        const data = await res.json();
        if (!data.items?.length) throw new Error('Official API empty');
        return data.items.map(i => ({
          id: `yt-${i.id.videoId}`, ytId: i.id.videoId, title: i.snippet.title, thumbnail_url: i.snippet.thumbnails.high?.url,
          video_url: `https://www.youtube.com/embed/${i.id.videoId}`, source: 'youtube', type: 'global'
        }));
      })());
    }

    // Strategy C: Multi-Proxy Piped (The "Never Fail" Scraper)
    const CORS_PROXY = "https://api.allorigins.win/get?url=";
    const stableInstance = "https://pipedapi.kavin.rocks";
    fetchPromises.push((async () => {
      const target = `${stableInstance}/search?q=${encodeURIComponent(query)}&filter=videos`;
      const res = await fetch(`${CORS_PROXY}${encodeURIComponent(target)}`, { signal: AbortSignal.timeout(8000) });
      const pData = await res.json();
      const data = JSON.parse(pData.contents);
      const items = data.items || data;
      if (!items?.length) throw new Error('Proxy empty');
      return items.slice(0, 20).map(v => {
        const vidId = v.url?.split('v=')[1] || v.url?.split('/').pop() || v.videoId;
        return {
          id: `yt-${vidId}`, ytId: vidId, title: v.title, thumbnail_url: v.thumbnail || `https://i.ytimg.com/vi/${vidId}/hqdefault.jpg`,
          video_url: `https://www.youtube.com/embed/${vidId}`, source: 'youtube', type: 'global'
        };
      });
    })());

    try {
      // Wait for the fastest successful strategy
      const globalResults = await Promise.any(fetchPromises);
      if (globalResults?.length > 0) {
        setIsFreeMode(true);
        setResults(prev => {
          const existingIds = new Set(prev.map(p => p.id || p.ytId));
          const uniqueNew = globalResults.filter(g => !existingIds.has(g.id));
          return [...prev, ...uniqueNew];
        });
      }
    } catch (err) {
      console.warn("All global search strategies failed or timed out.");
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
