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
      <div className="relative aspect-[2/3] rounded-[2rem] md:rounded-[2.5rem] overflow-hidden bg-[#111] border border-white/5 shadow-2xl transition-all duration-500 group-hover:border-blue-500/50 group-hover:shadow-[0_20px_50px_rgba(59,130,246,0.2)]">
        <img
          src={video.thumbnail_url}
          alt={video.title}
          className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:blur-[2px] brightness-90 group-hover:brightness-100"
        />
        
        {/* Play Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center backdrop-blur-[2px]">
          <motion.div 
            whileHover={{ scale: 1.1 }}
            className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center shadow-[0_0_30px_rgba(37,99,235,0.6)]"
          >
            <Play size={28} fill="white" className="text-white ml-1" />
          </motion.div>
        </div>

        {/* Rating Badge */}
        <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-1.5 z-10">
          <Star size={12} className="text-yellow-400 fill-yellow-400" />
          <span className="text-white text-[10px] font-black uppercase tracking-widest">{video.rating || '8.5'}</span>
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-6 px-2">
        <h3 className="text-white font-black text-sm md:text-base uppercase italic tracking-tighter leading-tight line-clamp-1 group-hover:text-blue-400 transition-colors">
          {video.title}
        </h3>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">
            {video.year || '2024'}
          </span>
          <div className="w-1 h-1 rounded-full bg-white/20" />
          <span className="px-2 py-0.5 bg-white/5 rounded-md text-white/40 text-[8px] font-black uppercase tracking-widest border border-white/5">
            {video.category || 'Movies'}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
