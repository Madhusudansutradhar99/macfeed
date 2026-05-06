import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import VideoCard from '../components/VideoCard';
import Loader from '../components/Loader';
import { ThumbsUp, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

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

      // Supabase in query
      const { data, error } = await supabase.from('videos').select('*').in('id', ids);

      if (!error && data) {
        setVideos(data);
      }
      setLoading(false);
    }
    fetchLiked();
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-primary text-primary p-6 md:p-12 pb-40 relative overflow-hidden transition-colors duration-500">
       {/* Background Decor */}
       <div className="fixed inset-0 pointer-events-none opacity-5 z-0">
        <h1 className="text-[25vw] font-black italic uppercase -rotate-12 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          LIKED
        </h1>
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate('/')}
              className="p-4 rounded-full bg-secondary hover:bg-primary/10 border border-primary transition-all active:scale-95 group text-primary"
            >
              <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
            </button>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <ThumbsUp className="w-6 h-6 text-accent" style={{ color: 'var(--accent-color)' }} />
                <span className="text-accent text-xs font-black uppercase tracking-[0.4em]" style={{ color: 'var(--accent-color)' }}>Library</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none">
                Liked Videos
              </h1>
            </div>
          </div>
          <div className="text-right">
             <p className="text-secondary font-bold uppercase tracking-[0.2em] text-sm">
                {videos.length} {videos.length === 1 ? 'VIDEO' : 'VIDEOS'} SAVED
             </p>
          </div>
        </header>

        {videos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {videos.map((v, i) => (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <VideoCard video={v} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-40 text-center">
            <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mb-8 border border-primary">
              <ThumbsUp className="w-10 h-10 text-secondary" />
            </div>
            <h2 className="text-2xl font-black italic uppercase text-primary mb-4">No favorites yet</h2>
            <p className="text-secondary max-w-sm mb-10 text-sm font-medium">
              Tap the like button on any video to save it here for later. Your favorites deserve a special place!
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-10 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl text-white font-black uppercase tracking-widest shadow-2xl hover:scale-105 transition-all"
            >
              Explore Feed
            </button>
          </div>
        )}
      </div>

       {/* Decorative Blur */}
       <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-accent/5 blur-[150px] rounded-full pointer-events-none" style={{ backgroundColor: 'var(--accent-color)', opacity: 0.05 }} />
    </div>
  );
}
