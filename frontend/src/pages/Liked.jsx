import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import VideoCard from '../components/VideoCard';
import Loader from '../components/Loader';
import { ThumbsUp, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Liked() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchLiked() {
      setLoading(true);
      const likedObj = JSON.parse(localStorage.getItem('macfeed_likes') || '{}');
      const ids = Object.keys(likedObj);

      if (ids.length === 0) {
        setVideos([]);
        setLoading(false);
        return;
      }

      // If stored items contain full video objects
      const directVideos = Object.values(likedObj).filter((v) => v && typeof v === 'object' && v.title);
      if (directVideos.length > 0) {
        setVideos(directVideos);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.from('videos').select('*').in('id', ids);
      if (!error && data) {
        setVideos(data);
      }
      setLoading(false);
    }
    fetchLiked();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0c10]">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0c10] text-white pt-2 sm:pt-4 px-3 sm:px-6 max-w-7xl mx-auto pb-32">
      {/* --- Digen Header Section --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="digen-section-title text-xl sm:text-2xl md:text-3xl font-black">
              LIKED VIDEOS
            </h1>
            <span className="digen-badge-amber text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
              Favorites
            </span>
          </div>
          <p className="text-gray-400 text-xs sm:text-sm font-normal max-w-2xl">
            All the videos, music, and clips you've liked across MacFeed.
          </p>
        </div>

        <div className="text-xs text-gray-400 font-semibold">
          {videos.length} SAVED TITLES
        </div>
      </div>

      {/* --- Grid --- */}
      {videos.length === 0 ? (
        <div className="text-center py-24 text-gray-500 text-sm flex flex-col items-center gap-3">
          <ThumbsUp className="w-10 h-10 text-gray-600 mb-1" />
          <p>No liked videos yet. Tap Like on any video to bookmark it here!</p>
          <button
            onClick={() => navigate('/')}
            className="px-5 py-2 rounded-full bg-white text-black font-semibold text-xs mt-2"
          >
            Explore Feed
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} variant="standard" />
          ))}
        </div>
      )}
    </div>
  );
}
