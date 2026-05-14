import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import VideoPlayer from '../components/VideoPlayer';
import VideoCard from '../components/VideoCard';
import Loader from '../components/Loader';
import YouTubeRelatedVideos from '../components/YouTubeRelatedVideos';
import {
  ThumbsUp, Share2, ArrowLeft,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { fetchJson } from '../utils/request';
import { useVideoMiniPlayer } from '../context/VideoPlayerContext';
import { useMusicPlayer } from '../context/MusicContext';

export default function VideoPlayerPage() {
  const { playVideo, viewMode } = useVideoMiniPlayer();
  const { deviceSongs } = useMusicPlayer();
  const { user, setAuthModalOpen } = useAuth();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [video, setVideo] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playerError, setPlayerError] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      setAuthModalOpen(true);
      navigate('/');
    }
  }, [user, loading, navigate, setAuthModalOpen]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setPlayerError('');

      // 0. Handle Device Music (IndexedDB)
      if (id?.toString().startsWith('device-')) {
        const deviceSong = deviceSongs.find(s => s.id === id);
        if (deviceSong) {
          setVideo(deviceSong);
          playVideo(deviceSong);
          setLoading(false);
          return;
        }
      }

      // 1. Handle Dynamic YouTube ID
      if (id?.toString().startsWith('yt-')) {
        const ytId = id.replace('yt-', '');
        let title = searchParams.get('title');
        let thumb = `https://i.ytimg.com/vi/${ytId}/maxresdefault.jpg`;

        if (!title || title === 'YouTube Video') {
          try {
            const { data: d } = await fetchJson(`/api/search?q=${ytId}`, {}, { timeoutMs: 10000, retryTimeoutMs: 5000, retries: 1 });
            if (d?.results?.[0]) {
              title = d.results[0].title || title;
              thumb = d.results[0].thumbnail || thumb;
            } else {
              try {
                const { data: ytInfoData } = await fetchJson(`/api/video-info?id=${ytId}`, {}, { timeoutMs: 10000, retryTimeoutMs: 5000, retries: 1 });
                if (ytInfoData?.video) {
                  title = ytInfoData.video.title || title;
                  thumb = ytInfoData.video.thumbnail || thumb;
                }
              } catch (e) { }
            }
          } catch (e) { }
        }

        const ytVideo = {
          id: id,
          youtube_id: ytId,
          title: title || 'YouTube Video',
          thumbnail_url: thumb,
          video_url: `https://www.youtube.com/embed/${ytId}`,
          source: 'youtube',
          category: 'YouTube'
        };
        setVideo(ytVideo);
        playVideo(ytVideo);
        setLoading(false);
        return;
      }

      // 2. Database fetch
      const { data, error } = await supabase.from('videos').select('*').eq('id', id).single();
      if (!error && data) {
        setVideo(data);
        playVideo(data);
        const { data: rel } = await supabase.from('videos').select('*').eq('category', data?.category).neq('id', id).limit(10);
        setRelated(rel || []);
        
        const likedObj = JSON.parse(localStorage.getItem('macfeed_likes') || '{}');
        if (likedObj[data.id]) setIsLiked(true);

        playVideo(data);
      }
      setLoading(false);
    }
    fetchData();
  }, [id, searchParams, playVideo, deviceSongs]);

  useEffect(() => {
    const retryOnReconnect = () => {
      if (!loading && !video) {
        window.location.reload();
      }
    };
    window.addEventListener('online', retryOnReconnect);
    return () => window.removeEventListener('online', retryOnReconnect);
  }, [loading, video]);

  useEffect(() => {
    if (video && !loading) {
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
    }
  }, [video, loading]);

  if (loading) return <Loader />;
  if (!video) {
    return (
      <div className="p-20 text-center min-h-screen" style={{ color: 'var(--text-primary)', backgroundColor: 'var(--bg-primary)' }}>
        Video Not Found
      </div>
    );
  }

  return (
    <div className="min-h-screen transition-colors duration-500" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <div className="flex flex-col w-full p-0 sm:p-6 max-w-[1400px] mx-auto">
        <div className="px-4 pt-4 sm:px-0 sm:pt-0">
          <button
            onClick={() => navigate('/')}
            className="mb-4 flex items-center gap-2 px-4 py-2 rounded-full border w-fit"
            style={{
              color: 'var(--text-primary)',
              borderColor: 'var(--border-color)',
              backgroundColor: 'var(--bg-secondary)'
            }}
          >
            <ArrowLeft size={16} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Back to Home</span>
          </button>
        </div>

        <div className="w-full mb-4">
          <VideoPlayer 
            video={video} 
            onClose={() => navigate(-1)}
          />
        </div>

        <div className="px-4 py-6 md:px-0">
          <div className="flex flex-col gap-4">
            <h1 className="text-xl md:text-2xl font-bold leading-tight">{video.title}</h1>
            
            <div className="flex items-center justify-between border-b pb-6" style={{ borderColor: 'var(--bg-secondary)' }}>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => {
                    const likedObj = JSON.parse(localStorage.getItem('macfeed_likes') || '{}');
                    if (isLiked) delete likedObj[video.id];
                    else likedObj[video.id] = video;
                    localStorage.setItem('macfeed_likes', JSON.stringify(likedObj));
                    setIsLiked(!isLiked);
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full transition-all"
                  style={{
                    backgroundColor: isLiked ? 'var(--accent-color)' : 'var(--bg-secondary)',
                    color: isLiked ? 'var(--text-on-accent)' : 'var(--text-primary)',
                    opacity: isLiked ? 1 : 0.85
                  }}
                >
                  <ThumbsUp size={18} className={isLiked ? 'fill-white' : ''} />
                  <span className="text-sm font-bold">{isLiked ? 'Liked' : 'Like'}</span>
                </button>
                
                <button 
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: video.title,
                        url: window.location.href,
                      });
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full transition-all"
                  style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', opacity: 0.85 }}
                >
                  <Share2 size={18} />
                  <span className="text-sm font-bold">Share</span>
                </button>
              </div>
            </div>

            <div className="mt-8">
              {video.source === 'youtube' ? (
                <YouTubeRelatedVideos 
                  currentVideoId={video.youtube_id} 
                  currentVideoTitle={video.title} 
                  parentCategory={video.category} 
                />
              ) : (
                <>
                  <h2 className="text-lg font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <Sparkles size={20} className="" style={{ color: 'var(--accent-color)' }} />
                    Recommended For You
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {related.map((v) => (
                      <VideoCard key={v.id} video={v} onClick={() => navigate(`/watch/${v.id}`)} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Sparkles({ size, className, style }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
      style={style}
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
      <path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>
    </svg>
  );
}
