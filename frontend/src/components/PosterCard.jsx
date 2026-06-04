import React from 'react';
import { motion } from 'framer-motion';
import { Play, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMusicPlayer } from '../context/MusicContext';

export default function PosterCard({ video, index }) {
  const navigate = useNavigate();
  const { playSong } = useMusicPlayer();

  const handleClick = () => {
    if (video.isLocal) {
        playSong(video);
    } else {
        navigate(`/watch/${video.id}`);
    }
  };

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 30 },
        show: { opacity: 1, y: 0 }
      }}
      whileHover={{ y: -10 }}
      onClick={handleClick}
      className="relative flex flex-col group cursor-pointer"
    >
      {/* Poster Image Container */}
      <div className="relative aspect-[2/3] rounded-2xl md:rounded-[1.5rem] overflow-hidden bg-black/40 border border-white/5 shadow-2xl transition-all duration-500 group-hover:shadow-[0_20px_50px_-10px_rgba(var(--accent-rgb),0.5)] group-hover:-translate-y-2 glass" style={{ '--accent': 'var(--accent-color)' }}>
        <img
          src={video.thumbnail_url}
          alt={video.title}
          className="w-full h-full object-cover object-top transition-all duration-700 group-hover:scale-110 group-hover:blur-[2px] brightness-90 group-hover:brightness-75"
        />
        
<img src="/watermark.png" className="absolute top-2 right-2 w-7 h-7 z-[60] opacity-100 pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" alt="watermark" />
        {/* Premium glare overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none transform -translate-x-[100%] group-hover:translate-x-[100%]" />

        {/* Play Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center backdrop-blur-sm p-4 text-center">
          <motion.div 
            whileHover={{ scale: 1.15 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="w-16 h-16 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(var(--accent-rgb),0.8)] border-[2px] border-white/40 mb-4 bg-white/10 backdrop-blur-md" style={{ backgroundColor: 'var(--accent-color)' }}
          >
            <Play size={28} fill="white" className="text-white ml-1 drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
          </motion.div>
          <h4 className="text-white font-black uppercase text-[13px] tracking-wide leading-tight line-clamp-2 drop-shadow-2xl px-2">
            {video.title}
          </h4>
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-4 px-2">
        <h3 className="text-white/95 font-bold text-[13px] uppercase tracking-wide leading-tight line-clamp-1 group-hover:text-accent transition-colors duration-300" style={{ '--accent': 'var(--accent-color)' }}>
          {video.title}
        </h3>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-white/40 text-[10px] font-bold uppercase tracking-wider">
            {video.year || '2024'}
          </span>
          <div className="w-1 h-1 rounded-full bg-white/20" />
          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border border-white/10" style={{ color: 'var(--accent-color)', backgroundColor: 'rgba(var(--accent-rgb), 0.1)' }}>
            {video.category || 'Movies'}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
