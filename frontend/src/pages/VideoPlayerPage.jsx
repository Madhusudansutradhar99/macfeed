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

export default function VideoPlayerPage() {
  const { openMini } = useVideoMiniPlayer();
  const { user, setAuthModalOpen } = useAuth();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [video, setVideo] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playerError, setPlayerError] = useState('');
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
      // 1. Handle Dynamic YouTube ID
      if (id?.toString().startsWith('yt-')) {
        const ytId = id.replace('yt-', '');
        let title = searchParams.get('title');
        let thumb = `https://i.ytimg.com/vi/${ytId}/maxresdefault.jpg`;

        // If title is missing, try to fetch it from YouTube or Backend
        if (!title || title === 'YouTube Video') {
          try {
            const { data: d } = await fetchJson(`/api/search?q=${ytId}`, {}, { timeoutMs: 10000, retryTimeoutMs: 5000, retries: 1 });
            if (d?.results?.[0]) {
              title = d.results[0].title || title;
              thumb = d.results[0].thumbnail || thumb;
            } else {
              // Use cached backend endpoint instead of direct YouTube API
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

        setVideo({
          id: id,
          youtube_id: ytId,
          title: title || 'YouTube Video',
          thumbnail_url: thumb,
          video_url: `https://www.youtube.com/embed/${ytId}`,
          source: 'youtube',
          category: 'YouTube'
        });
        setLoading(false);
        return;
      }
      // 2. Database fetch
      const { data, error } = await supabase.from('videos').select('*').eq('id', id).single();
      if (!error && data) {
        setVideo(data);
        const { data: rel } = await supabase.from('videos').select('*').eq('category', data?.category).neq('id', id).limit(10);
        setRelated(rel || []);
      }
      setLoading(false);
    }
    fetchData();
  }, [id, searchParams]);

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
      // Remove if already exists (to move to top)
      const filtered = history.filter((item) => item.id !== video.id);
      // Keep only last 50 items
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
  if (!video) return <div className="text-primary p-20 text-center bg-primary min-h-screen">Video Not Found</div>;

  return (
    <div className="min-h-screen bg-primary text-primary transition-colors duration-500">
      <div className="flex flex-col w-full p-0 sm:p-6 max-w-[1400px] mx-auto">
        {/* Back Button - Compact on Mobile */}
        <button onClick={() => window.history.back()} className="flex items-center gap-2 text-secondary hover:text-primary mb-2 sm:mb-6 p-4 sm:p-0 w-fit transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">Back</span>
        </button>

        {/* Main Video Section - Edge to Edge on Mobile */}
        <div className="w-full aspect-video rounded-2xl sm:rounded-[32px] overflow-hidden bg-black shadow-2xl border sm:border border-primary transition-colors duration-500 max-h-[85vh] mx-auto flex items-center justify-center">
          {playerError ? (
            <div className="w-full h-full flex items-center justify-center text-center p-6 bg-black text-white">
              <div>
                <p className="font-black uppercase tracking-[0.25em] text-sm text-red-300">Video failed to load</p>
                <p className="mt-2 text-white/70 text-sm">{playerError}</p>
                <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 rounded-full bg-white text-black font-black uppercase text-[10px] tracking-[0.2em]">Retry</button>
              </div>
            </div>
          ) : (
            <VideoPlayer 
              video={video} 
              onClose={() => navigate(-1)} 
              onError={(message) => setPlayerError(message)} 
              onMiniChange={(time, isPlaying) => {
                openMini(video, time, isPlaying);
                if (window.history.length > 2) {
                  navigate(-1);
                } else {
                  navigate('/');
                }
              }}
            />
          )}
        </div>

        <div className="mt-4 sm:mt-6 px-4 sm:px-0 flex flex-col md:flex-row justify-between items-start gap-3">
          <div className="flex-1">
            <h1 className="text-lg sm:text-2xl font-black text-primary italic uppercase tracking-tighter leading-tight">{video.title}</h1>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="px-1.5 py-0.5 bg-accent/20 text-accent text-[7px] font-black rounded-md uppercase border border-accent/20" style={{ color: 'var(--accent-color)', borderColor: 'var(--accent-color)', backgroundColor: 'var(--accent-color)22' }}>Global</span>
              <span className="text-secondary text-[8px] font-bold uppercase tracking-widest">{video.category}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 bg-secondary rounded-lg hover:bg-primary/10 transition-colors border border-primary text-primary"><ThumbsUp className="w-3.5 h-3.5" /></button>
            <button className="p-2 bg-secondary rounded-lg hover:bg-primary/10 transition-colors border border-primary text-primary"><Share2 className="w-3.5 h-3.5" /></button>
          </div>
        </div>

        {video.description && (
          <div className="mt-4 mx-4 sm:mx-0 p-4 bg-secondary/30 rounded-2xl border border-primary transition-colors duration-500">
            <p className="text-secondary text-[10px] leading-relaxed whitespace-pre-wrap">{video.description}</p>
          </div>
        )}

        {/* Related Section at BOTTOM */}
        <div className="mt-6 px-4 sm:px-0">
          {video.youtube_id ? (
            <YouTubeRelatedVideos
              currentVideoUrl={video.video_url}
              currentVideoId={video.youtube_id}
              currentVideoIdRaw={video.youtube_id}
              currentVideoTitle={video.title}
              parentCategory={video.category}
            />
          ) : related.length > 0 && (
            <section>
              <h3 className="text-xl font-black text-primary italic uppercase tracking-widest mb-6">Explore More</h3>
              <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar no-scrollbar">
                {related.map(v => <VideoCard key={v.id} video={v} />)}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
