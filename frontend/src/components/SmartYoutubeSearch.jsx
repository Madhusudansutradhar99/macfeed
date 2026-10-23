import React, { useState } from 'react';
import { Search, Play, AlertTriangle, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchJson } from '../utils/request';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const SmartYoutubeSearch = () => {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);
  const navigate = useNavigate();

  const handleVideoSelect = (video) => {
    const rawId = video.youtubeId || video.id;
    const ytId = rawId ? String(rawId).replace('yt-', '') : '';
    const videoObj = {
      id: `yt-${ytId}`,
      youtube_id: ytId,
      title: video.title,
      thumbnail_url: video.thumbnail || video.thumbnail_url,
      video_url: `https://www.youtube.com/embed/${ytId}`,
      source: 'youtube',
      category: 'YouTube',
    };
    // Instant zero-delay navigation!
    navigate(`/watch/yt-${ytId}`, { state: { video: videoObj } });
  };

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setWarning(null);

    try {
      const { data } = await fetchJson(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}`);
      const rawList = data?.results || [];
      const nextResults = rawList.map((item) => ({
        id: item.id || `yt-${item.ytId}`,
        youtubeId: item.ytId || item.id,
        title: item.title,
        thumbnail: item.thumbnail || item.thumbnail_url,
      }));
      setResults(nextResults);
      if (nextResults.length === 0) {
        setWarning('No matches found. Try a different query.');
      }
    } catch (err) {
      setError('Search could not connect to index. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 text-white min-h-screen pb-32">
      {/* --- Digen Header Section --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="digen-section-title text-xl sm:text-2xl md:text-3xl font-black">
              AI NEURAL SEARCH
            </h1>
            <span className="digen-badge-teal text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
              Global Index
            </span>
          </div>
          <p className="text-gray-400 text-xs sm:text-sm font-normal max-w-2xl">
            Prompt or search anything across millions of titles, creators, and official music tracks.
          </p>
        </div>
      </div>

      {/* --- Search Capsule --- */}
      <form onSubmit={handleSearch} className="digen-floating-prompt p-2 sm:p-2.5 rounded-2xl max-w-3xl mx-auto mb-8 shadow-2xl">
        <div className="flex items-center gap-3 px-2">
          <Sparkles className="w-5 h-5 text-[#f5b700] shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Describe your video, or type @ to search..."
            className="w-full bg-transparent text-white placeholder-gray-400 text-sm focus:outline-none py-2 font-medium"
          />
          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-white text-black hover:bg-gray-200 font-bold text-xs shrink-0 transition active:scale-95"
          >
            Search
          </button>
        </div>
      </form>

      {warning && (
        <div className="text-center text-xs text-amber-400 font-semibold mb-6 flex items-center justify-center gap-1.5">
          <AlertTriangle className="w-4 h-4" /> {warning}
        </div>
      )}

      {error && (
        <div className="text-center text-xs text-red-400 font-semibold mb-6">
          {error}
        </div>
      )}

      {/* --- Results Grid --- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="aspect-video bg-white/5 rounded-2xl animate-pulse" />
          ))
        ) : (
          results.map((video) => (
            <div
              key={video.id}
              onClick={() => handleVideoSelect(video)}
              className="digen-card group cursor-pointer flex flex-col p-2 select-none"
            >
              <div className="relative aspect-video rounded-xl overflow-hidden bg-black mb-2">
                <img
                  src={video.thumbnail || 'https://via.placeholder.com/640x360'}
                  alt={video.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg">
                    <Play className="w-4 h-4 fill-black text-black ml-0.5" />
                  </div>
                </div>
              </div>

              <h3 className="text-white font-semibold text-xs line-clamp-1 group-hover:text-[#f5b700] transition-colors">
                {video.title}
              </h3>
              <p className="text-[11px] text-gray-400 truncate mt-0.5">
                @youtube
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SmartYoutubeSearch;
