import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const HexVideoCard = ({ video, index, isFeatured }) => {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);

  // Pointy-topped hexagon clip-path
  const hexClipPath = "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)";

  // Alternating tilt for artistic "teda" look
  const tiltAngle = index % 2 === 0 ? 4 : -4;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
      whileInView={{ opacity: 1, scale: 1, rotate: tiltAngle }}
      whileHover={{ 
        scale: 1.15, 
        rotate: 0,
        zIndex: 100,
        filter: "drop-shadow(0 0 40px rgba(147, 51, 234, 0.6))" 
      }}
      transition={{ 
        type: "spring", 
        stiffness: 260, 
        damping: 20,
        delay: (index % 10) * 0.05
      }}
      className="relative w-full aspect-[0.866] cursor-pointer group"
      onClick={() => navigate(`/watch/${video.id}`)}
    >
      {/* Background Glow (Visible on hover) */}
      <div 
        className="absolute -inset-4 bg-purple-500/0 group-hover:bg-purple-500/20 blur-2xl transition-all duration-700 rounded-full"
      />
      
      {/* Outer Border / Glow Frame */}
      <div 
        className="absolute inset-0 transition-all duration-500 p-[2px]"
        style={{ clipPath: hexClipPath, backgroundColor: 'var(--border-color)' }}
      >
        <div 
          className="w-full h-full bg-secondary"
          style={{ clipPath: hexClipPath }}
        />
      </div>

      {/* Internal Content Area */}
      <div 
        className="absolute inset-[4px] overflow-hidden bg-black"
        style={{ clipPath: hexClipPath }}
      >
        {/* Placeholder while loading */}
        {!isLoaded && (
          <div className="absolute inset-0 bg-gray-900 animate-pulse" />
        )}

        <motion.img
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoaded ? 1 : 0 }}
          transition={{ duration: 0.8 }}
          onLoad={() => setIsLoaded(true)}
          src={video.thumbnail_url}
          alt={video.title}
          loading="lazy"
          className="w-full h-full object-cover brightness-[0.8] group-hover:brightness-110 transition-all duration-1000 scale-110 group-hover:scale-100"
        />
        
        {/* Sharp Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-95" />
        
        {/* Title Content - HIGH CONTRAST */}
        <div className="absolute inset-0 flex flex-col justify-end items-center p-4 text-center pb-8 md:pb-10">
          <div className="w-full">
            <h3 className="text-white text-[11px] md:text-[14px] font-black uppercase italic tracking-tighter leading-tight drop-shadow-[0_2px_10px_rgba(0,0,0,1)] line-clamp-2">
              {video.title}
            </h3>
            <div className="mt-1.5 h-[2px] w-1/3 group-hover:w-2/3 bg-purple-500 mx-auto transition-all duration-500 shadow-[0_0_10px_#9333ea]" />
          </div>
        </div>



      </div>
    </motion.div>
  );
};

export default HexVideoCard;
