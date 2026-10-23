import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import Loader from '../components/Loader';
import VideoCard from '../components/VideoCard';
import { FALLBACK_VIDEOS } from '../data/fallbackVideos';
import { getCategorizedVideos } from '../utils/categoryDetector';

const DEFAULT_MOVIES = FALLBACK_VIDEOS.filter(
  (v) => v.category === 'Movies' || v.category === 'Sci-Fi' || v.category === 'Action' || v.category === 'Animation'
);

function getMergedMovies(dbList = []) {
  const searched = getCategorizedVideos('Movies');
  const existingIds = new Set(searched.map(m => m.id));
  const base = dbList.length > 0 ? dbList : DEFAULT_MOVIES;
  const unrepeated = base.filter(m => !existingIds.has(m.id));
  return [...searched, ...unrepeated];
}

export default function Movies() {
  const [movies, setMovies] = useState(() => getMergedMovies());
  const [loading, setLoading] = useState(false);
  const [selectedTag, setSelectedTag] = useState('ALL');

  const tags = ['ALL', 'Action', 'Sci-Fi', 'Drama', 'Comedy', 'Horror', 'Animation', 'Thriller'];

  useEffect(() => {
    async function getMovies() {
      try {
        const { data, error } = await supabase
          .from('videos')
          .select('*')
          .or('category.eq.Movies,category.eq.Drama,category.eq.Action,category.eq.Comedy')
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          setMovies(getMergedMovies(data));
        }
      } catch (e) {
        // use fallback
      } finally {
        setLoading(false);
      }
    }
    getMovies();

    // Listen for real-time updates when user searches movies
    const handleUpdate = () => {
      setMovies(prev => getMergedMovies(prev));
    };
    window.addEventListener('categorized-videos-updated', handleUpdate);
    return () => window.removeEventListener('categorized-videos-updated', handleUpdate);
  }, []);

  const filteredMovies = useMemo(() => {
    if (selectedTag === 'ALL') return movies;
    return movies.filter((m) =>
      m.title?.toLowerCase().includes(selectedTag.toLowerCase()) ||
      m.category?.toLowerCase().includes(selectedTag.toLowerCase())
    );
  }, [movies, selectedTag]);

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
              PREMIER MOVIES
            </h1>
            <span className="digen-badge-teal text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
              4K Ultra HD
            </span>
          </div>
          <p className="text-gray-400 text-xs sm:text-sm font-normal max-w-2xl">
            Stream blockbusters, indie cinema, and critically acclaimed films with zero playback latency.
          </p>
        </div>

        <div className="text-xs text-gray-400 font-semibold">
          {filteredMovies.length} TITLES AVAILABLE
        </div>
      </div>

      {/* --- Filter Pills Bar --- */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 mb-6">
        {tags.map((tag) => {
          const isActive = selectedTag === tag;
          return (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                isActive ? 'digen-pill-active' : 'digen-pill-nav'
              }`}
            >
              {tag}
            </button>
          );
        })}
      </div>

      {/* --- Movies Grid --- */}
      {filteredMovies.length === 0 ? (
        <div className="text-center py-20 text-gray-500 text-sm">No movies found in this category.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {filteredMovies.map((movie) => (
            <VideoCard key={movie.id} video={movie} variant="standard" />
          ))}
        </div>
      )}
    </div>
  );
}
