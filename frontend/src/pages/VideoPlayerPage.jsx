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

export default function VideoPlayerPage() {
  const { user, setAuthModalOpen } = useAuth();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [video, setVideo] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
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
      // 1. Handle Dynamic YouTube ID
      if (id?.toString().startsWith('yt-')) {
        const ytId = id.replace('yt-', '');
        let title = searchParams.get('title');
        let thumb = `https://i.ytimg.com/vi/${ytId}/maxresdefault.jpg`;

        // If title is missing, try to fetch it from YouTube or Backend
        if (!title || title === 'YouTube Video') {
          try {
            const res = await fetch(`/api/search?q=${ytId}`);
            const d = await res.json();
            if (d.results?.[0] && d.results[0].id === ytId) {
              title = d.results[0].title;
              thumb = d.results[0].thumbnail;
            } else if (import.meta.env.VITE_YOUTUBE_API_KEY) {
              const ytRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${ytId}&key=${import.meta.env.VITE_YOUTUBE_API_KEY}`);
              const ytData = await ytRes.json();
              if (ytData.items?.[0]) {
                title = ytData.items[0].snippet.title;
                thumb = ytData.items[0].snippet.thumbnails.high?.url || thumb;
              }
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
        const { data: rel } = await supabase.from('videos').select('*').eq('category', data.category).neq('id', id).limit(10);
        setRelated(rel || []);
      }
      setLoading(false);
    }
    fetchData();
  }, [id, searchParams]);

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
      <div className="flex flex-col w-full p-4 sm:p-6 max-w-[1400px] mx-auto">
        {/* Back Button */}
        <button onClick={() => window.history.back()} className="flex items-center gap-2 text-secondary hover:text-primary mb-6 w-fit transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-xs font-black uppercase tracking-widest">Back</span>
        </button>

        {/* Main Video Section */}
        <div className="w-full aspect-video rounded-3xl overflow-hidden bg-black shadow-2xl border border-primary transition-colors duration-500">
          <VideoPlayer video={video} onClose={() => navigate(-1)} />
        </div>

        <div className="mt-6 flex flex-col md:flex-row justify-between items-start gap-4">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-black text-primary italic uppercase tracking-tighter leading-tight">{video.title}</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="px-2 py-0.5 bg-accent/20 text-accent text-[8px] font-black rounded-md uppercase border border-accent/20" style={{ color: 'var(--accent-color)', borderColor: 'var(--accent-color)', backgroundColor: 'var(--accent-color)22' }}>Global</span>
              <span className="text-secondary text-[9px] font-bold uppercase tracking-widest">{video.category}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2.5 bg-secondary rounded-xl hover:bg-primary/10 transition-colors border border-primary text-primary"><ThumbsUp className="w-4 h-4" /></button>
            <button className="p-2.5 bg-secondary rounded-xl hover:bg-primary/10 transition-colors border border-primary text-primary"><Share2 className="w-4 h-4" /></button>
          </div>
        </div>

        {video.description && (
          <div className="mt-6 p-6 bg-secondary/30 rounded-3xl border border-primary transition-colors duration-500">
            <p className="text-secondary text-xs leading-relaxed whitespace-pre-wrap">{video.description}</p>
          </div>
        )}

        {/* Related Section at BOTTOM */}
        <div className="mt-8">
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
