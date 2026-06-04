import React, { useState, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Eye, Music } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { useMusicPlayer } from '../context/MusicContext';
import { useAuth } from '../context/AuthContext';
import { fetchJson } from '../utils/request';

// YouTube API calls are now routed through backend /api/video-info (cached)

const YoutubeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
    <path d="m10 15 5-3-5-3z" />
  </svg>
);

const formatDuration = (iso) => {
  if (!iso || iso === '--:--') return '--:--';
  // If it's already a time string like "5:32" or "1:20:05"
  if (iso.includes(':') && !iso.includes('P')) return iso;
  
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return iso;
  const h = parseInt(match[1] || 0);
  const m = parseInt(match[2] || 0);
  const s = parseInt(match[3] || 0);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
};

const VideoCard = memo(({ video }) => {
  const navigate = useNavigate();
  const musicPlayer = useMusicPlayer();
  const { user } = useAuth();
  const [hovered, setHovered] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (!video) return null;

  const isYouTube = video.source === 'youtube' || video.id?.toString().startsWith('yt-');

  const handleClick = async () => {
    if (isSaving) return;

    if (isYouTube && video.id?.toString().startsWith('yt-')) {
      setIsSaving(true);
      const ytId = video.id.replace('yt-', '');
      try {
        const { data: existing } = await supabase.from('videos').select('*').or(`youtube_id.eq.${ytId},video_url.ilike.%${ytId}%`).limit(1);

        if (existing?.length) {
          const found = existing[0];
          
          // Self-heal: If duration is missing in DB, try to fetch and update it now
          if (!found.duration || found.duration === '00:00' || found.duration === '--:--') {
            try {
              const { data: d } = await fetchJson(`/api/video-info?id=${ytId}`, {}, { timeoutMs: 5000 });
              if (d?.video?.duration) {
                const realDur = formatDuration(d.video.duration);
                await supabase.from('videos').update({ duration: realDur }).eq('id', found.id);
                found.duration = realDur; // Update local object for immediate UI
              }
            } catch (e) { }
          }

          if (found.category === 'Music' && musicPlayer?.playVideo) {
            musicPlayer.playVideo(found);
          } else {
            navigate(`/watch/${found.id}`);
          }
        } else {
          let finalTitle = video.title;
          let finalDuration = video.duration || '00:00';
          let finalThumb = video.thumbnail_url;

          try {
            const { data: d } = await fetchJson(`/api/video-info?id=${ytId}`, {}, { timeoutMs: 10000, retryTimeoutMs: 5000, retries: 1 });
            if (d?.video) {
              finalTitle = d.video.title || finalTitle;
              finalDuration = d.video.duration ? formatDuration(d.video.duration) : finalDuration;
              finalThumb = d.video.thumbnail || finalThumb;
            }
          } catch (e) { }

          const isMusic = finalTitle.toLowerCase().includes('song') || finalTitle.toLowerCase().includes('music') || finalTitle.toLowerCase().includes('lyrics');

          const { data: inserted } = await supabase.from('videos').insert([{
            title: finalTitle,
            video_url: `https://www.youtube.com/embed/${ytId}`,
            youtube_id: ytId,
            thumbnail_url: finalThumb,
            source: 'youtube',
            category: isMusic ? 'Music' : 'YouTube',
            duration: finalDuration,
            views: 0
          }]).select('*').single();

          if (inserted) {
            if (inserted.category === 'Music' && musicPlayer?.playVideo) {
              musicPlayer.playVideo(inserted);
            } else {
              navigate(`/watch/${inserted.id}`);
            }
          } else {
            navigate(`/watch/${video.id}`);
          }
        }
      } catch (e) {
        navigate(`/watch/${video.id}`);
      } finally {
        setIsSaving(false);
      }
    } else {
      if (video.category === 'Music' && musicPlayer?.playVideo) {
        musicPlayer.playVideo(video);
      } else {
        navigate(`/watch/${video.id}`);
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <motion.div
      whileHover={{ y: -12 }}
      whileTap={{ scale: 0.96 }}
      className={`video-card group cursor-pointer flex flex-col gap-3 w-full transition-opacity duration-300 ${isSaving ? 'opacity-50 pointer-events-none' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
    >
      <div className="relative aspect-video rounded-2xl md:rounded-[1.5rem] overflow-hidden shadow-2xl transition-all duration-500 group-hover:shadow-[0_20px_50px_-10px_rgba(var(--accent-rgb),0.5)] group-hover:-translate-y-1 glass" style={{ backgroundColor: 'transparent', '--accent': 'var(--accent-color)' }}>
        <img src={video?.thumbnail_url || 'https://via.placeholder.com/640x360?text=No+Thumbnail'} alt={video?.title || 'Video'} loading="lazy" decoding="async" className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-[0.4]" />
<img src="/watermark.png" className="absolute top-2 right-2 w-6 h-6 z-[60] opacity-80 pointer-events-none drop-shadow-md mix-blend-plus-lighter" alt="watermark" />

        
        {/* Premium glare overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none transform -translate-x-[100%] group-hover:translate-x-[100%]" />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

        <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-[6px] text-[10px] font-black tracking-wider text-white border border-white/20 shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
          {video.duration || '00:00'}
        </div>

        <AnimatePresence>
          {hovered && (
            <motion.div initial={{ opacity: 0, scale: 0.5, rotate: -15 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} exit={{ opacity: 0, scale: 0.5, rotate: 15 }} transition={{ type: "spring", stiffness: 300, damping: 20 }} className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(var(--accent-rgb),0.8)] border-[3px] border-white/50 backdrop-blur-md bg-white/10 transition-all">
                {video.category === 'Music' ? <Music className="w-8 h-8 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" /> : <Play className="w-8 h-8 text-white fill-white ml-1 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" />}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="px-2 pt-1">
        <h3 className="text-primary font-bold text-[13px] line-clamp-2 leading-relaxed group-hover:text-accent transition-colors duration-300" style={{ '--accent': 'var(--accent-color)' }}>{video?.title || 'Untitled Video'}</h3>
        <div className="flex items-center gap-2 mt-2.5">
          <span className="text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-md" style={{ color: 'var(--accent-color)', backgroundColor: 'rgba(var(--accent-rgb), 0.15)' }}>{video.category}</span>
        </div>
      </div>
    </motion.div>
  );
});

export default VideoCard;
