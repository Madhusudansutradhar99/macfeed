import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import VideoCard from '../components/VideoCard';
import Loader from '../components/Loader';
import { Clock, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function History() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadHistory = () => {
      setLoading(true);
      const history = JSON.parse(localStorage.getItem('macfeed_history') || '[]');
      setVideos(history);
      setLoading(false);
    };
    loadHistory();
  }, []);

  const clearHistory = () => {
    if (window.confirm('Clear your entire watch history?')) {
      localStorage.removeItem('macfeed_history');
      setVideos([]);
    }
  };

  const removeVideo = (id) => {
    const updated = videos.filter((v) => v.id !== id);
    setVideos(updated);
    localStorage.setItem('macfeed_history', JSON.stringify(updated));
  };

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
              WATCH HISTORY
            </h1>
            <span className="digen-badge-teal text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
              Local Timeline
            </span>
          </div>
          <p className="text-gray-400 text-xs sm:text-sm font-normal max-w-2xl">
            Your recently streamed movies, shows, and audio tracks stored locally on your device.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-xs text-gray-400 font-semibold">
            {videos.length} ENTRIES
          </span>
          {videos.length > 0 && (
            <button
              onClick={clearHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}
        </div>
      </div>

      {/* --- Grid --- */}
      {videos.length === 0 ? (
        <div className="text-center py-24 text-gray-500 text-sm flex flex-col items-center gap-3">
          <Clock className="w-10 h-10 text-gray-600 mb-1" />
          <p>No watch history yet. Start exploring!</p>
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
            <div key={video.id} className="relative group">
              <VideoCard video={video} variant="standard" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeVideo(video.id);
                }}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/70 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition z-30 shadow"
                title="Remove"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
