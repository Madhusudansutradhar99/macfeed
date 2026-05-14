import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PosterCard from '../components/PosterCard';
import Loader from '../components/Loader';
import { History as HistoryIcon, ArrowLeft, Trash2, Clock, X, Library as LibraryIcon } from 'lucide-react';
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
    if (window.confirm('Are you sure you want to clear your entire watch history?')) {
      localStorage.removeItem('macfeed_history');
      setVideos([]);
    }
  };

  const removeVideo = (id) => {
    const updated = videos.filter((v) => v.id !== id);
    setVideos(updated);
    localStorage.setItem('macfeed_history', JSON.stringify(updated));
  };

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen text-white p-4 md:p-12 pb-40 relative overflow-x-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Cinematic Background Text */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden select-none">
        <h1 className="text-[25vw] font-black italic uppercase text-white/[0.02] leading-none absolute -top-10 -left-10 rotate-[-5deg] whitespace-nowrap">
          LIBRARY
        </h1>
        <h1 className="text-[20vw] font-black italic uppercase text-blue-500/[0.01] leading-none absolute bottom-0 right-0 rotate-[10deg] whitespace-nowrap">
          HISTORY
        </h1>
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-blue-600/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-600/5 blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate('/')}
              className="w-14 h-14 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all active:scale-95 group backdrop-blur-xl"
            >
              <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
            </button>
            <div>
              <div className="flex items-center gap-3 mb-3">
                <LibraryIcon className="w-5 h-5 text-blue-500" />
                <span className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em]">Personal Space</span>
              </div>
              <h1 className="text-4xl md:text-7xl font-black italic tracking-tighter uppercase leading-none">
                Watch <span className="text-blue-500">History</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="px-6 py-4 bg-white/5 backdrop-blur-xl rounded-[2rem] border border-white/10 flex items-center gap-3">
              <Clock className="w-4 h-4 text-blue-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white/60">
                {videos.length} ENTRIES SAVED
              </span>
            </div>
            {videos.length > 0 && (
              <button
                onClick={clearHistory}
                className="w-14 h-14 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl border border-red-500/20 transition-all flex items-center justify-center shadow-lg shadow-red-500/5"
                title="Clear All"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </header>

        {videos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 md:gap-10">
            <AnimatePresence>
              {videos.map((video, idx) => (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: idx * 0.05 }}
                  className="relative group"
                >
                  <PosterCard video={video} index={idx} />
                  <button
                    onClick={(e) => { e.stopPropagation(); removeVideo(video.id); }}
                    className="absolute top-4 right-4 w-8 h-8 bg-black/60 backdrop-blur-md rounded-full text-white/40 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all border border-white/10 shadow-xl flex items-center justify-center z-50"
                  >
                    <X size={14} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-40 text-center">
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-32 h-32 bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 flex items-center justify-center mb-10 shadow-2xl"
            >
              <HistoryIcon className="w-12 h-12 text-white/20" />
            </motion.div>
            <h2 className="text-3xl font-black italic uppercase text-white mb-4 tracking-tighter">Library is Empty</h2>
            <p className="text-white/40 max-w-sm mb-12 text-xs font-bold leading-relaxed uppercase tracking-widest">
              Videos you watch will be listed here automatically. Start your journey!
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-12 py-5 bg-blue-600 hover:bg-blue-500 rounded-[2rem] text-white font-black uppercase tracking-widest shadow-[0_20px_50px_rgba(37,99,235,0.3)] transition-all active:scale-95"
            >
              Explore Feed
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
