import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import VideoPlayer from '../components/VideoPlayer';
import VideoCard from '../components/VideoCard';
import Loader from '../components/Loader';
import {
  ThumbsUp,
  Share2,
  ArrowLeft,
  Zap,
  Check,
} from 'lucide-react';
import { fetchJson } from '../utils/request';
import { useVideoMiniPlayer } from '../context/VideoPlayerContext';
import { useMusicPlayer } from '../context/MusicContext';
import { FALLBACK_VIDEOS } from '../data/fallbackVideos';
import { getAllCategorizedVideos } from '../utils/categoryDetector';

export default function VideoPlayerPage() {
  const { playVideo } = useVideoMiniPlayer();
  const { deviceSongs } = useMusicPlayer();
  const { id } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // --- INSTANT 0MS INITIALIZATION ---
  const [video, setVideo] = useState(() => location.state?.video || null);
  const [loading, setLoading] = useState(() => !location.state?.video);
  const [related, setRelated] = useState([]);
  const [isLiked, setIsLiked] = useState(false);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let isCancelled = false;

    async function loadData() {
      // 0. If video was already supplied via router state, immediately play it
      if (location.state?.video) {
        setVideo(location.state.video);
        playVideo(location.state.video);
        setLoading(false);
      }

      // 1. Device Song
      if (id?.toString().startsWith('device-')) {
        const deviceSong = deviceSongs.find((s) => s.id === id);
        if (deviceSong) {
          setVideo(deviceSong);
          playVideo(deviceSong);
          setLoading(false);
          return;
        }
      }

      // 2. YouTube ID
      if (id?.toString().startsWith('yt-')) {
        const ytId = id.replace('yt-', '');
        const baseVideo = location.state?.video || {
          id: id,
          youtube_id: ytId,
          title: searchParams.get('title') || 'YouTube Video',
          thumbnail_url: `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`,
          video_url: `https://www.youtube.com/embed/${ytId}`,
          source: 'youtube',
          category: 'YouTube',
        };

        if (!video) {
          setVideo(baseVideo);
          playVideo(baseVideo);
          setLoading(false);
        }

        // Fetch related or metadata in background without blocking player
        try {
          const { data: d } = await fetchJson(`/api/search?q=${encodeURIComponent(baseVideo.title || 'trending')}`, {}, { timeoutMs: 5000 });
          if (!isCancelled && d?.results) {
            setRelated(d.results.slice(0, 12).map((r) => ({
              id: `yt-${r.ytId || r.id}`,
              title: r.title,
              thumbnail_url: r.thumbnail || r.thumbnail_url,
              category: 'Related',
            })));
          }
        } catch (e) {
          // Non-blocking
        }
        return;
      }

      // 3. Check searched/categorized videos & Fallback for instant 0ms playback
      const categorizedMatch = getAllCategorizedVideos().find((v) => v.id === id);
      const fallbackMatch = categorizedMatch || FALLBACK_VIDEOS.find((v) => v.id === id);
      if (fallbackMatch && !video) {
        setVideo(fallbackMatch);
        playVideo(fallbackMatch);
        setRelated(FALLBACK_VIDEOS.filter((v) => v.id !== id).slice(0, 10));
        setLoading(false);
        return;
      }

      // 4. Database fetch if not already in state
      if (!video) {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from('videos')
            .select('*')
            .eq('id', id)
            .single();

          if (!isCancelled && !error && data) {
            setVideo(data);
            playVideo(data);
            setLoading(false);

            // Fetch related videos
            const { data: rel } = await supabase
              .from('videos')
              .select('*')
              .eq('category', data.category)
              .neq('id', id)
              .limit(12);
            if (!isCancelled) setRelated(rel || []);
          } else {
            const fb = FALLBACK_VIDEOS[0];
            setVideo(fb);
            playVideo(fb);
            setRelated(FALLBACK_VIDEOS.slice(1, 11));
            if (!isCancelled) setLoading(false);
          }
        } catch (e) {
          const fb = FALLBACK_VIDEOS[0];
          setVideo(fb);
          playVideo(fb);
          setRelated(FALLBACK_VIDEOS.slice(1, 11));
          if (!isCancelled) setLoading(false);
        }
      } else {
        // Fetch related in background
        supabase
          .from('videos')
          .select('*')
          .eq('category', video.category || 'Movie')
          .neq('id', id)
          .limit(12)
          .then(({ data: rel }) => {
            if (!isCancelled && rel) setRelated(rel);
          });
      }
    }

    loadData();

    // Check likes
    try {
      const likedObj = JSON.parse(localStorage.getItem('macfeed_likes') || '{}');
      if (likedObj[id]) setIsLiked(true);
    } catch (e) {}

    return () => {
      isCancelled = true;
    };
  }, [id, location.state]);

  // Record history
  useEffect(() => {
    if (video) {
      try {
        const history = JSON.parse(localStorage.getItem('macfeed_history') || '[]');
        const filtered = history.filter((item) => item.id !== video.id);
        const newHistory = [
          {
            id: video.id,
            title: video.title,
            thumbnail_url: video.thumbnail_url,
            category: video.category,
            duration: video.duration,
            watched_at: new Date().toISOString(),
          },
          ...filtered,
        ].slice(0, 50);
        localStorage.setItem('macfeed_history', JSON.stringify(newHistory));
      } catch (e) {}
    }
  }, [video]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: video?.title || 'MacFeed Video',
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLike = () => {
    if (!video) return;
    try {
      const likedObj = JSON.parse(localStorage.getItem('macfeed_likes') || '{}');
      if (isLiked) {
        delete likedObj[video.id];
        setIsLiked(false);
      } else {
        likedObj[video.id] = video;
        setIsLiked(true);
      }
      localStorage.setItem('macfeed_likes', JSON.stringify(likedObj));
    } catch (e) {}
  };

  if (loading && !video) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <Loader />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-transparent text-center">
        <h2 className="text-lg font-bold text-white mb-2">Video not found</h2>
        <button
          onClick={() => navigate('/')}
          className="px-5 py-2 rounded-full bg-white text-black font-semibold text-xs"
        >
          Back to Explore
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-white">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4">
        {/* Back Link */}
        <div className="mb-3">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-gray-300 hover:text-white transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
        </div>

        {/* Video Player Box */}
        <div className="w-full rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/10 mb-4">
          <VideoPlayer video={video} onClose={() => navigate(-1)} />
        </div>

        {/* Video Meta Info */}
        <div className="digen-card p-4 sm:p-5 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="digen-badge-teal text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  {video.category || 'Stream'}
                </span>
                <span className="flex items-center gap-1 text-[11px] font-semibold text-[#f5b700] bg-[#f5b700]/10 border border-[#f5b700]/20 px-2 py-0.5 rounded-full">
                  <Zap className="w-3 h-3" />
                  Instant Stream
                </span>
              </div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white leading-tight">
                {video.title}
              </h1>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleLike}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold border transition ${
                  isLiked
                    ? 'bg-[#f5b700] text-black border-[#f5b700]'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-300 hover:text-white'
                }`}
              >
                <ThumbsUp className={`w-3.5 h-3.5 ${isLiked ? 'fill-black' : ''}`} />
                <span>{isLiked ? 'Liked' : 'Like'}</span>
              </button>

              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Share'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* --- Digen Related Videos Section --- */}
        {related.length > 0 && (
          <section className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <h2 className="digen-section-title text-lg sm:text-xl font-black">More Like This</h2>
                <span className="digen-badge-teal text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  AI Recommended
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {related.map((relItem) => (
                <VideoCard key={relItem.id} video={relItem} variant="vertical" />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
