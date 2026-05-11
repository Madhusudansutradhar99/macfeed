import React, { useState, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Eye, Music } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { useMusicPlayer } from '../context/MusicContext';
import { fetchJson } from '../utils/request';

// YouTube API calls are now routed through backend /api/video-info (cached)

const YoutubeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
    <path d="m10 15 5-3-5-3z" />
  </svg>
);

const formatDuration = (iso) => {
  if (!iso) return '00:00';
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '00:00';
  const h = parseInt(match[1] || 0);
  const m = parseInt(match[2] || 0);
  const s = parseInt(match[3] || 0);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
};

const VideoCard = memo(({ video }) => {
  const navigate = useNavigate();
  const musicPlayer = useMusicPlayer();
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
      whileHover={{ y: -10 }}
      whileTap={{ scale: 0.98 }}
      className={`video-card group cursor-pointer flex flex-col gap-3 w-full transition-opacity duration-300 ${isSaving ? 'opacity-50 pointer-events-none' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
    >
      <div className="relative aspect-video rounded-xl md:rounded-[1.5rem] overflow-hidden bg-secondary border border-primary shadow-2xl transition-all duration-500 group-hover:border-accent group-hover:shadow-[0_0_30px_var(--accent-color)]" style={{ '--accent': 'var(--accent-color)' }}>
        <img src={video?.thumbnail_url || 'https://via.placeholder.com/640x360?text=No+Thumbnail'} alt={video?.title || 'Video'} loading="lazy" decoding="async" className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-75" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

        <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-black text-white border border-white/10">
          {video.duration || '00:00'}
        </div>

        <AnimatePresence>
          {hovered && (
            <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} className="absolute inset-0 flex items-center justify-center">
              <div className="w-14 h-14 bg-accent rounded-full flex items-center justify-center shadow-2xl border-2 border-white/20" style={{ backgroundColor: 'var(--accent-color)' }}>
                {video.category === 'Music' ? <Music className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white fill-white ml-1" />}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="px-2">
        <h3 className="text-primary font-bold text-sm line-clamp-2 leading-tight group-hover:text-accent transition-colors uppercase tracking-tight" style={{ '--accent': 'var(--accent-color)' }}>{video?.title || 'Untitled Video'}</h3>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="text-[10px] font-black text-secondary uppercase tracking-[0.2em]">{video.category}</span>
        </div>
      </div>
    </motion.div>
  );
});

export default VideoCard;
