import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Loader from '../components/Loader';

const platforms = [
  {
    id: 'amazon',
    name: 'Amazon',
    logo: 'https://www.google.com/s2/favicons?domain=amazon.in&sz=128',
    url: 'https://www.amazon.in',
    color: '#ff9900',
  },
  {
    id: 'flipkart',
    name: 'Flipkart',
    logo: 'https://www.google.com/s2/favicons?domain=flipkart.com&sz=128',
    url: 'https://www.flipkart.com',
    color: '#047BD5',
  },
  {
    id: 'myntra',
    name: 'Myntra',
    logo: 'https://www.google.com/s2/favicons?domain=myntra.com&sz=128',
    url: 'https://www.myntra.com',
    color: '#f13ab1',
  },
  {
    id: 'ajio',
    name: 'Ajio',
    logo: 'https://www.google.com/s2/favicons?domain=ajio.com&sz=128',
    url: 'https://www.ajio.com',
    color: '#2c4152',
  },
  {
    id: 'meesho',
    name: 'Meesho',
    logo: 'https://www.google.com/s2/favicons?domain=meesho.com&sz=128',
    url: 'https://www.meesho.com',
    color: '#f43397',
  },
  {
    id: 'nykaa',
    name: 'Nykaa',
    logo: 'https://www.google.com/s2/favicons?domain=nykaa.com&sz=128',
    url: 'https://www.nykaa.com',
    color: '#e80071',
  },
  {
    id: 'tatacliq',
    name: 'Tata CLiQ',
    logo: 'https://www.google.com/s2/favicons?domain=tatacliq.com&sz=128',
    url: 'https://www.tatacliq.com',
    color: '#000000',
  },
  {
    id: 'croma',
    name: 'Croma',
    logo: 'https://www.google.com/s2/favicons?domain=croma.com&sz=128',
    url: 'https://www.croma.com',
    color: '#00e6e6',
  },
];

export default function Shopping() {
  const [loading, setLoading] = useState(true);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => {
      window.removeEventListener('resize', checkMobile);
      clearTimeout(timer);
    };
  }, []);

  if (loading) return <Loader />;

  // Coordinate System
  const svgWidth = 1000;
  
  // Site mode (Desktop) now gets more gap too, specifically for the 'site mode' request.
  // Increased from 80 to 120. Mobile stays at its optimized 130.
  const ySpacing = isMobile ? 130 : 120; 
  const startY = isMobile ? 100 : 120;
  
  // Dynamic height for both to accommodate gaps
  const svgHeight = startY * 2 + (platforms.length - 1) * ySpacing;
  
  const leftX = 280;
  const rightX = 750;
  const rightY = svgHeight / 2;
  const cardWidth = 260;

  // Scale: 
  // Mobile: 0.5 (30% zoom in)
  // Desktop: 0.6 (Minimized look)
  // Optimized scale for mobile to prevent cut-offs
  const scaleValue = isMobile ? 0.38 : 0.6;

  return (
    <div className="min-h-screen bg-primary text-primary flex items-center justify-center relative overflow-y-auto overflow-x-hidden transition-colors duration-500 py-10">
      
      {/* Background Atmosphere */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/5 blur-[150px] rounded-full pointer-events-none -z-10" />

      {/* 
          CENTRAL HUB CONTAINER 
      */}
      <div
        className="relative w-[1000px] transition-all duration-700 origin-center flex shrink-0"
        style={{ transform: `scale(${scaleValue})`, height: `${svgHeight}px` }}
      >
        <div className="relative w-full h-full">
          {/* SVG Connection Layer */}
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="absolute inset-0 pointer-events-none"
          >
            {platforms.map((platform, i) => {
              const currentY = startY + i * ySpacing;
              const pathData = `M ${leftX} ${currentY} C ${leftX + 150} ${currentY}, ${rightX - 150} ${rightY}, ${rightX - 30} ${rightY}`;
              const isHovered = hoveredNode === platform.id || hoveredNode === 'hub';

              return (
                <g key={`path-${platform.id}`}>
                  {/* Wire */}
                  <path
                    d={pathData}
                    fill="none"
                    stroke={platform.color}
                    strokeWidth={isHovered ? 6 : 3}
                    className="transition-all duration-500"
                    style={{ strokeOpacity: (isHovered || isMobile) ? 0.8 : 0.2 }}
                  />
                  {/* Flow Animation */}
                  {(isHovered || isMobile) && (
                    <circle r="6" fill={platform.color} filter={`drop-shadow(0 0 12px ${platform.color})`}>
                      <animateMotion dur={isMobile ? "3s" : "2.5s"} repeatCount="indefinite" path={pathData} />
                    </circle>
                  )}
                </g>
              );
            })}
          </svg>

          {/* LEFT NODES */}
          {platforms.map((platform, i) => {
            const currentY = startY + i * ySpacing;
            const isHovered = hoveredNode === platform.id;

            return (
              <motion.button
                key={`node-${platform.id}`}
                onMouseEnter={() => setHoveredNode(platform.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => window.open(platform.url, '_blank')}
                className="absolute flex items-center gap-4 bg-secondary backdrop-blur-2xl border border-primary p-3 pr-10 rounded-[2rem] shadow-2xl transition-all z-20 group"
                style={{
                  left: `${leftX - cardWidth}px`,
                  top: `${currentY - 45}px`, 
                  width: `${cardWidth}px`,
                  height: `90px`
                }}
                whileHover={{ scale: 1.05, x: 10, borderColor: platform.color }}
              >
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center p-2.5 shrink-0 shadow-lg">
                  <img src={platform.logo} alt="" className="w-full h-full object-contain" />
                </div>
                <div className="flex flex-col items-start overflow-hidden text-left">
                  <span className="text-[14px] font-black uppercase tracking-widest text-primary truncate w-full" style={{ color: (isHovered || isMobile) ? platform.color : 'inherit' }}>
                    {platform.name}
                  </span>
                  <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">Official Store</span>
                </div>
                
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: platform.color, opacity: (isHovered || isMobile) ? 1 : 0 }} />
              </motion.button>
            );
          })}

          {/* CENTRAL HUB */}
          <motion.div
            onMouseEnter={() => setHoveredNode('hub')}
            onMouseLeave={() => setHoveredNode(null)}
            className="absolute z-20 flex flex-col items-start"
            style={{ left: `${rightX}px`, top: `${rightY - 60}px` }}
          >
            <h1 className="text-7xl font-black italic tracking-tighter text-primary uppercase leading-none">
              MacFeed
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-blue-500 to-emerald-500">
                HUB
              </span>
            </h1>
            <div className="h-2 w-full mt-2 bg-gradient-to-r from-purple-500 via-blue-500 to-emerald-500 rounded-full opacity-80" />
            <p className="mt-4 text-[12px] font-black uppercase tracking-[0.4em] text-secondary">Shopping Network</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
