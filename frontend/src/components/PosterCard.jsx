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
      whileTap={{ scale: 0.96 }}
      onClick={handleClick}
      className="premium-card relative flex flex-col group cursor-pointer bg-secondary/30"
    >
      <div className="relative aspect-[2/3] overflow-hidden">
        <img
          src={video.thumbnail_url}
          alt={video.title}
          className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 brightness-90 group-hover:brightness-100"
        />
        
        {/* Play Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center backdrop-blur-[2px] p-4 text-center">
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-2xl">
            <Play size={20} fill="black" className="text-black ml-1" />
          </div>
        </div>

        {video.year && (
          <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] font-black text-white border border-white/10 uppercase tracking-widest">
            {video.year}
          </div>
        )}
      </div>

      <div className="p-3">
        <h3 className="text-white font-bold text-xs line-clamp-1 group-hover:text-accent transition-colors tracking-tight">
          {video.title}
        </h3>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-white/40 text-[8px] font-black uppercase tracking-widest">
            {video.category || 'Movies'}
          </span>
          {video.rating && (
            <>
              <div className="w-1 h-1 rounded-full bg-white/10" />
              <div className="flex items-center gap-1 text-yellow-500 text-[8px] font-bold">
                <Star size={8} fill="currentColor" />
                <span>{video.rating}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
