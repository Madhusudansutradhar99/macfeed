import React, { useEffect, useState, useRef, memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, ChevronLeft, ChevronRight, Loader2, Tv2, Eye, Database, Zap, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { fetchJson } from '../utils/request';

// ── L1 CACHE: localStorage with 2hr TTL ──
const CACHE_PREFIX = 'mf_related_';
const CACHE_TTL = 2 * 60 * 60 * 1000; // 2 hours

function getCachedRelated(videoId) {
  try {
    const key = CACHE_PREFIX + videoId;
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

function setCachedRelated(videoId, data) {
  try {
    const key = CACHE_PREFIX + videoId;
    localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
  } catch { }
}

const YTVideoCard = memo(({ item, onPlay }) => {
  const [hovered, setHovered] = useState(false);
  const videoId = item.ytId || item.id?.videoId || item.id;
  const thumb = item.thumbnail_url || item.thumbnail || item.snippet?.thumbnails?.medium?.url || `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
  const title = item.title || item.snippet?.title || 'Untitled';
  const source = item.source || 'youtube';

  return (
    <motion.div
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.98 }}
      className="flex gap-3 cursor-pointer group hover:bg-primary/5 rounded-xl p-2 transition-all border border-transparent hover:border-primary/10"
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onClick={() => onPlay(videoId, title, item.duration, item.id)}
    >
      <div className="relative flex-shrink-0 w-36 h-20 rounded-lg overflow-hidden bg-black shadow-lg border border-primary/10">
        <img src={thumb} alt={title} className={`object-cover w-full h-full transition-all duration-500 ${hovered ? 'scale-105 brightness-75' : ''}`} loading="lazy" />
        {item.duration && <span className="absolute bottom-1 right-1 bg-black/85 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">{item.duration}</span>}
        <div className="absolute top-1 left-1 bg-accent/90 rounded px-1.5 py-0.5 flex items-center gap-1" style={{ backgroundColor: 'var(--accent-color)' }}>
          {source === 'local' ? <Database className="w-2.5 h-2.5 text-white" /> : <Tv2 className="w-2.5 h-2.5 text-white" />}
          <span className="text-white text-[7px] font-black uppercase">{source === 'local' ? 'MacFeed' : 'Global'}</span>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-primary text-sm font-bold line-clamp-2 leading-snug group-hover:text-accent transition-colors uppercase tracking-tight" style={{ '--accent': 'var(--accent-color)' }}>{title}</div>
        <div className="text-secondary text-[10px] mt-1 font-black uppercase tracking-widest">{item.channelTitle || item.snippet?.channelTitle || (source === 'local' ? 'Internal Content' : 'YouTube')}</div>
      </div>
    </motion.div>
  );
});

export default function YouTubeRelatedVideos({ currentVideoUrl, currentVideoId, currentVideoTitle, parentCategory }) {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [sourceInfo, setSourceInfo] = useState(null);

  const extractYouTubeId = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([^&?#\s]{11})/);
    return match ? match[1] : null;
  };

  const ytId = extractYouTubeId(currentVideoUrl) || currentVideoId;

  const fetchData = useCallback(async () => {
    if (!ytId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setSourceInfo(null);

    // 1. L1 CACHE CHECK
    const cached = getCachedRelated(ytId);
    if (cached) {
      setVideos(cached);
      setSourceInfo('local-cache');
      setLoading(false);
      return;
    }

    const fetchPromises = [];

    // 2. BACKEND RELATED ENDPOINT (L2 Disk Cache)
    fetchPromises.push((async () => {
      const { response: res, data } = await fetchJson(`/api/related?videoId=${ytId}`, {}, { timeoutMs: 6000, retryTimeoutMs: 4000, retries: 1 });
      if (!res.ok) throw new Error('Backend failed');
      if (!data?.results?.length) throw new Error('Backend empty');
      return { results: data.results, source: data.source };
    })());

    // 3. Fallback: Search by title if related endpoint fails
    if (currentVideoTitle && currentVideoTitle !== 'YouTube Video') {
        fetchPromises.push((async () => {
        const { response: res, data } = await fetchJson(`/api/search?q=${encodeURIComponent(currentVideoTitle)}`, {}, { timeoutMs: 6000, retryTimeoutMs: 4000, retries: 1 });
            if (!res.ok) throw new Error('Search failed');
        const filtered = (data?.results || []).filter(v => v.ytId !== ytId);
            if (!filtered.length) throw new Error('Search empty');
            return { results: filtered, source: 'search-fallback' };
        })());
    }

    try {
      const { results, source } = await Promise.any(fetchPromises);
      if (results?.length > 0) {
        setVideos(results);
        setSourceInfo(source);
        setCachedRelated(ytId, results);
      }
    } catch (err) {
      console.warn("All related video strategies failed.");
      const { data: localData } = await supabase.from('videos').select('*').neq('youtube_id', ytId).limit(10);
      if (localData) {
        setVideos(localData.map(v => ({ ...v, source: 'local' })));
      }
    } finally {
      setLoading(false);
    }
  }, [ytId, currentVideoTitle]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePlay = async (videoId, title, duration, internalId) => {
    if (savingId) return;
    if (internalId && typeof internalId === 'number') {
      navigate(`/watch/${internalId}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSavingId(videoId);
    try {
      const { data: existing } = await supabase.from('videos').select('id').or(`youtube_id.eq.${videoId},video_url.ilike.%${videoId}%`).limit(1);
      if (existing?.length) navigate(`/watch/${existing[0].id}`);
      else {
        const { data: inserted } = await supabase.from('videos').insert([{
          title, video_url: `https://www.youtube.com/embed/${videoId}`, youtube_id: videoId,
          thumbnail_url: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`, source: 'youtube',
          category: parentCategory || 'YouTube', duration: duration || '--:--', views: 0
        }]).select('id').single();
        if (inserted?.id) navigate(`/watch/${inserted.id}`);
        else navigate(`/watch/yt-${videoId}`);
      }
    } catch (e) { } finally { setSavingId(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  };

  if (videos.length === 0 && !loading) return null;

  return (
    <section className="mt-10 border-t border-primary/10 pt-8 transition-colors duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h2 className="text-xl font-black text-primary flex items-center gap-3 uppercase italic tracking-tighter">
          <div className="w-8 h-8 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/20" style={{ backgroundColor: 'var(--accent-color)' }}><Tv2 className="w-4 h-4 text-white" /></div>
          Recommended for you
        </h2>
        <div className="flex items-center gap-3">
            {sourceInfo === 'local-cache' && <span className="text-[8px] font-black text-cyan-400 uppercase tracking-widest bg-cyan-400/10 px-2 py-0.5 rounded border border-cyan-400/10">⚡ L1 Cache</span>}
            {sourceInfo === 'disk-cache' && <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest bg-blue-400/10 px-2 py-0.5 rounded border border-blue-400/10">💾 L2 Cache</span>}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex gap-3 p-2">
              <div className="w-36 h-20 bg-secondary rounded-lg animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-secondary rounded w-full animate-pulse" />
                <div className="h-3 bg-secondary rounded w-2/3 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {videos.map((v, idx) => <YTVideoCard key={(v.ytId || v.id) + idx} item={v} onPlay={handlePlay} />)}
        </div>
      )}
    </section>
  );
}
