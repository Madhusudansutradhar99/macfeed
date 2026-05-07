import React, { useEffect, useState, useRef, memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, ChevronLeft, ChevronRight, Loader2, Tv2, Eye, Database, Zap, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';

const YT_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

// Multi-Engine Config for Resilience
const PROXIES = [
  "https://api.allorigins.win/get?url=",
  "https://corsproxy.io/?",
  "" // Direct
];

const PIPED_INSTANCES = [
  "https://pipedapi.kavin.rocks",
  "https://pipedapi.tokhmi.xyz",
  "https://pipedapi.moomoo.me",
  "https://pipedapi.systilly.xyz",
  "https://api.piped.victr.me"
];

function extractYouTubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([^&?#\s]{11})/);
  return match ? match[1] : null;
}

function formatDuration(iso) {
  if (!iso) return '';
  if (typeof iso === 'string' && !iso.startsWith('PT')) return iso; // Already formatted
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '';
  const h = parseInt(match[1] || 0);
  const m = parseInt(match[2] || 0);
  const s = parseInt(match[3] || 0);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const YTVideoCard = memo(({ item, onPlay }) => {
  const [hovered, setHovered] = useState(false);
  const videoId = item.ytId || item.id?.videoId || item.id;
  const thumb = item.thumbnail_url || item.snippet?.thumbnails?.medium?.url || `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
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
        <div className="text-secondary text-[10px] mt-1 font-black uppercase tracking-widest">{source === 'local' ? 'Internal Content' : (item.snippet?.channelTitle || 'YouTube')}</div>
      </div>
    </motion.div>
  );
});

export default function YouTubeRelatedVideos({ currentVideoUrl, currentVideoId, currentVideoTitle, parentCategory }) {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  const ytId = extractYouTubeId(currentVideoUrl) || currentVideoId;

  const fetchData = useCallback(async () => {
    if (!currentVideoTitle && !ytId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    // Use the title for search query to get relevant videos
    const query = currentVideoTitle && currentVideoTitle !== 'YouTube Video' ? currentVideoTitle : 'trending videos';
    const fetchPromises = [];

    // 1. Backend Search (Fastest + Cached)
    fetchPromises.push((async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: AbortSignal.timeout(3000) });
        if (!res.ok) throw new Error('Backend failed');
        const data = await res.json();
        if (data.results?.length > 0) {
          return data.results
            .filter(v => v.id !== ytId)
            .map(v => ({
              ytId: v.id, title: v.title, thumbnail_url: v.thumbnail,
              duration: '--:--', source: 'youtube'
            }));
        }
      } catch (e) { }
      throw new Error('No backend results');
    })());

    // 2. Official YouTube API
    if (YT_API_KEY) {
      fetchPromises.push((async () => {
        try {
          const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=20&order=viewCount&key=${YT_API_KEY}`, { signal: AbortSignal.timeout(4000) });
          if (!res.ok) throw new Error('Official API failed');
          const data = await res.json();
          if (data.items?.length > 0) {
            return data.items
              .filter(i => i.id?.videoId !== ytId)
              .map(i => ({
                ytId: i.id.videoId, snippet: i.snippet,
                title: i.snippet.title, thumbnail_url: i.snippet.thumbnails.medium?.url,
                duration: '--:--', source: 'youtube'
              }));
          }
        } catch (e) { }
        throw new Error('No official API results');
      })());
    }

    // 3. Piped/Proxies (Scraping Fallback)
    for (const instance of PIPED_INSTANCES) {
      for (const proxy of PROXIES) {
        fetchPromises.push((async () => {
          try {
            const targetUrl = `${instance}/search?q=${encodeURIComponent(query)}&filter=videos`;
            const fetchUrl = proxy ? `${proxy}${encodeURIComponent(targetUrl)}` : targetUrl;
            const res = await fetch(fetchUrl, { signal: AbortSignal.timeout(4000) });
            if (!res.ok) throw new Error('Proxy failed');
            
            let data;
            if (proxy.includes('allorigins')) {
              const pData = await res.json();
              data = JSON.parse(pData.contents);
            } else {
              data = await res.json();
            }

            const items = data.items || data;
            if (items?.length > 0) {
              return items.slice(0, 10).map(v => {
                const vidId = v.url?.split('v=')[1] || v.url?.split('/').pop() || v.videoId;
                if (!vidId || vidId === ytId) return null;
                return {
                  ytId: vidId, title: v.title,
                  thumbnail_url: v.thumbnail || v.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${vidId}/hqdefault.jpg`,
                  duration: v.duration ? (typeof v.duration === 'number' ? `${Math.floor(v.duration/60)}:${v.duration%60}` : v.duration) : '--:--',
                  source: 'youtube'
                };
              }).filter(Boolean);
            }
          } catch (e) { }
          throw new Error('Proxy failed');
        })());
      }
    }

    try {
      const results = await Promise.any(fetchPromises);
      setVideos(results);
    } catch (err) {
      console.warn("All recommendation sources failed, falling back to local DB.");
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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-black text-primary flex items-center gap-3 uppercase italic tracking-tighter">
          <div className="w-8 h-8 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/20" style={{ backgroundColor: 'var(--accent-color)' }}><Tv2 className="w-4 h-4 text-white" /></div>
          Recommended for you
        </h2>
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
          {videos.map((v, idx) => <YTVideoCard key={v.ytId || v.id || idx} item={v} onPlay={handlePlay} />)}
        </div>
      )}
    </section>
  );
}
