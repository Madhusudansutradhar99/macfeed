import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const SlashVideoCard = ({ video, index }) => {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      whileHover={{ 
        scale: 1.05,
        zIndex: 20,
        transition: { duration: 0.3 }
      }}
      className="relative w-full aspect-[2/3] cursor-pointer group mb-12"
      onClick={() => navigate(`/watch/${video.id}`)}
    >
      {/* The Skewed Frame */}
      <div className="absolute inset-0 transition-all duration-500 overflow-hidden transform -skew-x-[15deg] border-x-2 border-white/20 group-hover:border-green-500 shadow-2xl bg-black">
        
        {/* The Image (Un-skewed back to normal) - Increased scale to 1.6 for perfect fit */}
        <div className="absolute inset-0 transform skew-x-[15deg] scale-[1.6] flex items-center justify-center">
          {!isLoaded && (
            <div className="absolute inset-0 bg-gray-900 animate-pulse" />
          )}
          <img
            onLoad={() => setIsLoaded(true)}
            src={video.thumbnail_url}
            alt={video.title}
            className={`w-full h-full object-cover transition-all duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'} brightness-[0.8] group-hover:brightness-110 group-hover:scale-105`}
          />
<img src="/watermark.png" className="absolute top-2 right-2 w-6 h-6 z-[60] opacity-80 pointer-events-none drop-shadow-md mix-blend-plus-lighter" alt="watermark" />

          
          {/* Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90" />
        </div>

        {/* Info Content (Also needs to be un-skewed to be readable) */}
        <div className="absolute inset-0 transform skew-x-[15deg] flex flex-col justify-end p-4 text-left pointer-events-none">
          <div className="bg-black/60 backdrop-blur-md p-2 rounded-lg border border-white/5 transform -translate-x-2 group-hover:translate-x-0 transition-transform duration-500">
            <h3 className="text-white text-[10px] md:text-[12px] font-black uppercase italic tracking-tighter leading-tight line-clamp-2">
              {video.title}
            </h3>
            <div className="flex items-center gap-2 mt-1">
                <span className="text-[8px] text-green-400 font-bold uppercase">Watch Now</span>
                <div className="h-[1px] flex-1 bg-green-500/50" />
            </div>
          </div>
        </div>

        {/* Hover Glow Line */}
        <div className="absolute top-0 right-0 w-[2px] h-full bg-green-500 opacity-0 group-hover:opacity-100 shadow-[0_0_15px_#22c55e] transition-opacity" />
      </div>

      {/* Decorative Index Number (Optional but looks cool) */}
      <div className="absolute -bottom-6 -left-4 text-[40px] font-black italic text-white/5 select-none pointer-events-none group-hover:text-green-500/20 transition-colors">
        {String(index + 1).padStart(2, '0')}
      </div>
    </motion.div>
  );
};

export default SlashVideoCard;
