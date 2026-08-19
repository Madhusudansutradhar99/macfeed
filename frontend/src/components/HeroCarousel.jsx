import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Plus, Info, ChevronLeft, ChevronRight } from 'lucide-react';

export default function HeroCarousel({ slides = [] }) {
  const navigate = useNavigate();

  // Pad slides to at least 7 for the 3D effect
  const heroSlides = useMemo(() => {
    if (!slides || slides.length === 0) {
      return [{
        id: 'raya',
        title: 'Raya and the Last Dragon',
        category: 'Adventure, Fantasy, Action',
        duration: '1h 47m',
        thumbnail_url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2025',
        description: 'Long ago, in the fantasy world of Kumandra, humans and dragons lived together in harmony.'
      }];
    }
    
    // De-duplicate slides
    const uniqueList = [];
    const seen = new Set();
    slides.forEach(v => {
      if (!seen.has(v.id)) {
        seen.add(v.id);
        uniqueList.push(v);
      }
    });

    const list = uniqueList.slice(0, 7);
    const padded = [...list];
    while (padded.length > 0 && padded.length < 7) {
      padded.push(...list);
    }
    return padded.slice(0, 7);
  }, [slides]);

  const [heroIdx, setHeroIdx] = useState(0);

  useEffect(() => {
    if (heroSlides.length <= 1) return;
    const timer = setInterval(() => {
      setHeroIdx(prev => (prev + 1) % heroSlides.length);
    }, 5500); // 5.5 seconds autoplay rotation
    return () => clearInterval(timer);
  }, [heroSlides]);

  const activeHero = useMemo(() => {
    return heroSlides[heroIdx] || heroSlides[0];
  }, [heroSlides, heroIdx]);

  
  return (
    <section 

      className={`relative w-[calc(100%-2rem)] sm:w-[calc(100%-3rem)] md:w-[calc(100%-5rem)] mx-auto mt-2 md:mt-4 aspect-[16/10] sm:aspect-[16/11] md:aspect-[21/9.5] min-h-[220px] sm:min-h-[360px] md:min-h-[480px] rounded-[1.2rem] md:rounded-[2rem] overflow-hidden select-none shadow-2xl border border-white/5 bg-black cursor-grab active:cursor-grabbing`}
    >
      {/* Green diagonal glowing stripe */}
      <div className="absolute left-[-10%] top-[-30%] w-[6%] h-[180%] bg-gradient-to-b from-[#10b981]/50 via-[#10b981]/15 to-transparent blur-[35px] transform rotate-[32deg] pointer-events-none z-10" />

      {/* Sliding Container */}
      <div className="absolute inset-0 w-full h-full overflow-hidden rounded-[1.2rem] md:rounded-[2rem]">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={activeHero.id}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = offset.x;
              if (swipe < -50) {
                setHeroIdx(prev => (prev + 1) % heroSlides.length);
              } else if (swipe > 50) {
                setHeroIdx(prev => (prev - 1 + heroSlides.length) % heroSlides.length);
              }
            }}
            initial={{ x: '100%', opacity: 0.8 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: 0.8 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 w-full h-full bg-[#020205] rounded-[1.2rem] md:rounded-[2rem] overflow-hidden pointer-events-none"
          >
            {/* Crisp Full Background version of the thumbnail with maxresdefault fallback */}
            <motion.img
              initial={{ scale: 1.05 }}
              animate={{ scale: 1 }}
              transition={{ duration: 6, ease: "easeOut" }}
              src={activeHero.thumbnail_url?.replace('mqdefault.jpg', 'maxresdefault.jpg') || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2025'}
              onError={(e) => { e.target.onerror = null; e.target.src = activeHero.thumbnail_url?.replace('mqdefault.jpg', 'hqdefault.jpg'); }}
              className="absolute inset-0 w-full h-full object-cover rounded-[1.2rem] md:rounded-[2rem]"
              alt=""
            />

            {/* Dark Gradients to ensure readability of buttons and text */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent z-10 rounded-[1.2rem] md:rounded-[2rem]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-transparent z-10 rounded-[1.2rem] md:rounded-[2rem]" />

            {/* Interactive Controls Overlay */}
            <div className="absolute inset-0 flex flex-col justify-end px-6 sm:px-10 md:px-16 pb-16 sm:pb-24 md:pb-32 gap-4 z-40 pointer-events-auto">
              
              {/* Featured Badge */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="flex items-center gap-2"
              >
                <span className="px-3 py-1 bg-accent/20 border border-accent/50 text-accent text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] rounded-full backdrop-blur-md shadow-[0_0_15px_rgba(var(--accent-rgb),0.3)]">
                  Featured
                </span>
                <span className="text-[10px] sm:text-xs font-bold text-white/50 uppercase tracking-widest">{activeHero.category || 'Exclusive'}</span>
              </motion.div>

              {/* Title & Description */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="max-w-3xl">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tight text-white drop-shadow-2xl leading-[1.1] mb-2 sm:mb-4">
                  {activeHero.title}
                </h1>
                <p className="text-xs sm:text-sm text-white/70 font-medium line-clamp-2 md:line-clamp-3 max-w-xl hidden sm:block">
                  {activeHero.description || 'Experience the best premium entertainment exclusively on MacFeed. Dive into this amazing content right now.'}
                </p>
              </motion.div>

              {/* Buttons */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2">
                <button
                  onClick={() => navigate('/watch/' + activeHero.id)}
                  className="group flex items-center gap-2 sm:gap-3 bg-white text-black font-black uppercase text-[10px] sm:text-xs tracking-widest px-6 sm:px-8 py-3 sm:py-3.5 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:shadow-[0_0_30px_rgba(255,255,255,0.6)] transition-all hover:scale-105 active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-black transition-transform group-hover:scale-110" /> Play Now
                </button>
                <button
                  onClick={() => navigate('/movies')}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-white/20 hover:border-white/80 bg-white/5 backdrop-blur-xl flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button className="h-10 sm:h-12 px-6 bg-white/10 hover:bg-white/20 backdrop-blur-xl border-2 border-white/10 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-black uppercase tracking-widest text-white transition-all hover:scale-105 active:scale-95"
                  onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent('open-info-modal', { detail: { title: activeHero.title, content: activeHero.description || 'MacFeed Exclusive Content.' } })); }}>
                  <Info className="w-4 h-4 mr-2 opacity-70" />
                  More Info
                </button>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
