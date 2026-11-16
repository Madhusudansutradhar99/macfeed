import React, { useState, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Music } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { useMusicPlayer } from '../context/MusicContext';

const timeAgo = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
  };

  for (const [unit, seconds] of Object.entries(intervals)) {
    const interval = Math.floor(diffInSeconds / seconds);
    if (interval >= 1) {
      return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
    }
  }
  return 'Just now';
};

const VideoCard = memo(({ video, variant = 'standard' }) => {
  const navigate = useNavigate();
  const musicPlayer = useMusicPlayer();
  const [hovered, setHovered] = useState(false);

  if (!video) return null;

  const isVertical = variant === 'vertical';
  const targetId = video.id || (video.youtube_id ? `yt-${video.youtube_id}` : `v-${Date.now()}`);

  const handleClick = (e) => {
    e.preventDefault();

    // --- INSTANT RESPONSE: Navigate immediately without ANY network blocking ---
    if (video.category === 'Music' && musicPlayer?.playVideo) {
      musicPlayer.playVideo(video);
    } else {
      navigate(`/watch/${targetId}`, { state: { video } });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // --- NON-BLOCKING BACKGROUND SYNC ---
    setTimeout(async () => {
      try {
        if (targetId.startsWith('yt-')) {
          const ytId = targetId.replace('yt-', '');
          const { data: existing } = await supabase
            .from('videos')
            .select('id')
            .eq('youtube_id', ytId)
            .limit(1);

          if (!existing || existing.length === 0) {
            await supabase.from('videos').insert([
              {
                title: video.title || 'YouTube Video',
                video_url: video.video_url || `https://www.youtube.com/embed/${ytId}`,
                youtube_id: ytId,
                thumbnail_url: video.thumbnail_url,
                source: 'youtube',
                category: video.category || 'YouTube',
                duration: video.duration || '00:00',
                views: 0,
              },
            ]);
          }
        }
      } catch (err) {
        // Silent background fallback
      }
    }, 100);
  };

  const creatorName =
    video.channel_title ||
    video.author ||
    (video.source === 'youtube' ? '@creator' : '@official');

  return (
    <motion.div
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className="video-card group cursor-pointer flex flex-col w-full select-none"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
    >
      {/* Media Thumbnail Container (Digen Rounded Style) */}
      <div
        className={`relative w-full rounded-2xl overflow-hidden bg-[#12141a] border border-white/5 group-hover:border-white/20 transition-all duration-300 shadow-lg ${
          isVertical ? 'aspect-[9/14] sm:aspect-[9/13]' : 'aspect-video'
        }`}
      >
        <img
          src={
            video.thumbnail_url ||
            (video.youtube_id
              ? `https://i.ytimg.com/vi/${video.youtube_id}/mqdefault.jpg`
              : 'https://via.placeholder.com/640x360?text=MacFeed')
          }
          alt={video.title || 'Video'}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          draggable="false"
        />

        {/* Clean dark gradient scrim for contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

        {/* Duration / Tag Badge */}
        {video.duration && video.duration !== '--:--' && (
          <div className="absolute bottom-2.5 right-2.5 bg-black/75 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider text-white border border-white/10 shadow">
            {video.duration}
          </div>
        )}

        {/* Play Icon on Hover */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-md border border-white/40 shadow-xl">
                {video.category === 'Music' ? (
                  <Music className="w-6 h-6 text-white" />
                ) : (
                  <Play className="w-6 h-6 text-white fill-white ml-0.5" />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Typography Underneath (Digen Clean Label Style) */}
      <div className="pt-2 px-0.5">
        <h3 className="text-white font-semibold text-xs sm:text-sm line-clamp-1 leading-snug group-hover:text-[#f5b700] transition-colors">
          {video.title || 'Untitled Video'}
        </h3>
        <div className="flex items-center justify-between text-[11px] text-gray-400 mt-0.5">
          <span className="truncate font-medium">{creatorName}</span>
          {video.published_at && (
            <span className="text-[10px] text-gray-400 shrink-0 ml-2">
              {timeAgo(video.published_at)}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
});

export default VideoCard;
