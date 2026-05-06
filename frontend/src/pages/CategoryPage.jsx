import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import VideoCard from '../components/VideoCard';
import Loader from '../components/Loader';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CategoryPage({ category, title, emoji, sortBy }) {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVideos() {
      const start = Date.now();
      setLoading(true);
      let query = supabase.from('videos').select('*');
      if (category) query = query.eq('category', category);
      if (sortBy === 'views') query = query.order('views', { ascending: false });
      else query = query.order('created_at', { ascending: false });
      const { data } = await query;
      setVideos(data || []);
      
      const end = Date.now();
      const diff = end - start;
      setLoading(false);
      
    }
    fetchVideos();
  }, [category, sortBy]);

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-primary text-primary p-6 md:p-12 pb-40 relative overflow-hidden transition-colors duration-500">
       {/* Background Decor */}
       <div className="fixed inset-0 pointer-events-none opacity-5 z-0">
        <h1 className="text-[25vw] font-black italic uppercase -rotate-12 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          {category || title || 'EXPLORE'}
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
                {emoji && <span className="text-xl">{emoji}</span>}
                <span className="text-accent text-xs font-black uppercase tracking-[0.4em]" style={{ color: 'var(--accent-color)' }}>Browse</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none">
                {title}
              </h1>
            </div>
          </div>
          <div className="text-right">
             <p className="text-secondary font-bold uppercase tracking-[0.2em] text-sm">
                {videos.length} {videos.length === 1 ? 'VIDEO' : 'VIDEOS'} FOUND
             </p>
          </div>
        </header>

        {videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40 text-center">
            <div className="text-6xl mb-4 opacity-20">📭</div>
            <h2 className="text-2xl font-black italic uppercase text-primary mb-4">No Videos Found</h2>
            <p className="text-secondary max-w-sm mb-10 text-sm font-medium">No videos in this category yet. Check back later for fresh content!</p>
            <button
              onClick={() => navigate('/')}
              className="px-10 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl text-white font-black uppercase tracking-widest shadow-2xl hover:scale-105 transition-all"
            >
              Explore Feed
            </button>
          </div>
        ) : (
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
        )}
      </div>

       {/* Decorative Blur */}
       <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/5 blur-[150px] rounded-full pointer-events-none" style={{ backgroundColor: 'var(--accent-color)', opacity: 0.05 }} />
    </div>
  );
}


