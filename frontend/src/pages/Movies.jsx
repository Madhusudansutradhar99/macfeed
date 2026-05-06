import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import Loader from '../components/Loader';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

export default function Movies() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function getMovies() {
      const { data } = await supabase
        .from('videos')
        .select('*')
        .eq('category', 'Movies')
        .order('created_at', { ascending: false });
      setMovies(data || []);
      setLoading(false);
    }
    getMovies();
  }, []);

  if (loading)
    return <Loader />;

  return (
    <div className="min-h-screen bg-primary text-primary p-6 md:p-12 pb-40 overflow-x-hidden relative transition-colors duration-500">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none opacity-5 z-0">
        <h1 className="text-[25vw] font-black italic uppercase -rotate-12 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          CINEMA
        </h1>
      </div>

      <header className="relative z-40 mb-20 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate('/')}
            className="bg-secondary p-4 rounded-full border border-primary hover:bg-primary/10 transition-all shadow-xl active:scale-95 text-primary"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase drop-shadow-2xl">
              Movies
            </h1>
            <div className="h-1 w-20 bg-accent rounded-full mt-1" style={{ backgroundColor: 'var(--accent-color)' }} />
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-secondary font-bold uppercase tracking-[0.2em] text-sm">
            {movies.length} TOTAL TITLES
          </p>
        </div>
      </header>

      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-x-6 gap-y-16 md:gap-x-10 md:gap-y-24">
        {movies.map((movie, i) => (
          <motion.div
            key={movie.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (i % 20) * 0.03 }}
            whileHover={{
              scale: 1.1,
              rotate: 0,
              zIndex: 50,
              transition: { duration: 0.2 },
            }}
            className="group cursor-pointer"
            onClick={() => navigate(`/watch/${movie.id}`)}
          >
            <div className="relative transform -rotate-6 group-hover:rotate-0 transition-transform duration-500 ease-out">
              {/* Outer Theme-Aware Frame (Yellow in blue mode) */}
              <div 
                className="absolute inset-[-8px] md:inset-[-14px] rounded-2xl md:rounded-[32px] shadow-[0_15px_40px_rgba(0,0,0,0.5)] border border-primary transition-colors duration-500" 
                style={{ backgroundColor: 'var(--border-color)', opacity: 0.8 }}
              />

              <div className="relative aspect-[3/4.2] rounded-2xl md:rounded-[32px] overflow-hidden border-2 border-primary bg-black">
                <img
                  src={movie.thumbnail_url}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 brightness-90 group-hover:brightness-110"
                  alt={movie.title}
                  loading="lazy"
                  onError={(e) => {
                    e.target.src = 'https://placehold.co/400x600/001b2e/ffffff?text=Movie';
                  }}
                />

                {/* Bottom Vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />

                {/* Title Label */}
                <div className="absolute bottom-4 left-5 right-5">
                  <h3 className="text-white font-black italic text-xs md:text-base uppercase tracking-tighter line-clamp-2 leading-tight drop-shadow-md">
                    {movie.title}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--accent-color)' }} />
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">
                      Watch Now
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Decorative Elements */}
      <div className="fixed bottom-0 left-0 w-full h-32 bg-gradient-to-t from-primary to-transparent z-0 pointer-events-none" />
    </div>
  );
}
