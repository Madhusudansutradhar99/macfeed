import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import VideoCard from '../components/VideoCard';
import Loader from '../components/Loader';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { FALLBACK_VIDEOS } from '../data/fallbackVideos';
import { getCategorizedVideos } from '../utils/categoryDetector';

export default function CategoryPage({ category, title, emoji, sortBy }) {
  const navigate = useNavigate();

  const getMergedList = (dbList = []) => {
    const searched = getCategorizedVideos(category || title || '');
    const fallbackList = category
      ? FALLBACK_VIDEOS.filter((v) => v.category?.toLowerCase() === category.toLowerCase())
      : FALLBACK_VIDEOS;
    const base = dbList.length > 0 ? dbList : (fallbackList.length > 0 ? fallbackList : FALLBACK_VIDEOS);
    const existingIds = new Set(searched.map(m => m.id));
    const unrepeated = base.filter(m => !existingIds.has(m.id));
    return [...searched, ...unrepeated];
  };

  const [videos, setVideos] = useState(() => getMergedList());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchVideos() {
      try {
        let query = supabase.from('videos').select('*');
        if (category) query = query.eq('category', category);
        if (sortBy === 'views') query = query.order('views', { ascending: false });
        else query = query.order('created_at', { ascending: false });
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          setVideos(getMergedList(data));
        } else {
          setVideos(getMergedList());
        }
      } catch (e) {
        setVideos(getMergedList());
      } finally {
        setLoading(false);
      }
    }
    fetchVideos();

    const handleUpdate = () => {
      setVideos(prev => getMergedList(prev));
    };
    window.addEventListener('categorized-videos-updated', handleUpdate);
    return () => window.removeEventListener('categorized-videos-updated', handleUpdate);
  }, [category, sortBy]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-white pt-2 sm:pt-4 px-3 sm:px-6 max-w-7xl mx-auto pb-32">
      {/* --- Digen Header Section --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="digen-section-title text-xl sm:text-2xl md:text-3xl font-black">
              {title.toUpperCase()}
            </h1>
            <span className="digen-badge-teal text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
              {emoji || '?'} Official Feed
            </span>
          </div>
          <p className="text-gray-400 text-xs sm:text-sm font-normal max-w-2xl">
            Curated high-speed playback stream for {title}. Instant buffer-free streaming across all devices.
          </p>
        </div>

        <div className="text-xs text-gray-400 font-semibold">
          {videos.length} {videos.length === 1 ? 'ITEM' : 'ITEMS'} AVAILABLE
        </div>
      </div>

      {/* --- Video Grid --- */}
      {videos.length === 0 ? (
        <div className="text-center py-24 text-gray-500 text-sm">
          No media items found in this section.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {videos.map((v) => (
            <VideoCard key={v.id} video={v} variant={category === 'Shorts' ? 'vertical' : 'standard'} />
          ))}
        </div>
      )}
    </div>
  );
}
