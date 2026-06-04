import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Plus } from 'lucide-react';
import ReviewButton from './ReviewApp/ReviewButton';

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
            {/* Crisp Full Background version of the thumbnail */}
            <div
              className="absolute inset-0 w-full h-full bg-cover bg-center rounded-[1.2rem] md:rounded-[2rem] overflow-hidden"
              style={{ backgroundImage: `url('${activeHero.thumbnail_url?.replace('mqdefault.jpg', 'hqdefault.jpg') || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2025'}')` }}
            />

            {/* Dark Gradients to ensure readability of buttons and text */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#020205]/90 via-[#020205]/30 to-transparent z-10 rounded-[1.2rem] md:rounded-[2rem]" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#020205]/95 via-transparent to-transparent z-10 rounded-[1.2rem] md:rounded-[2rem]" />

            {/* Interactive Controls Overlay on the Left (Buttons at top, title below in small size) */}
            <div className="absolute inset-x-0 bottom-4 sm:bottom-26 md:bottom-32 flex flex-col items-start px-4 sm:px-8 md:px-12 gap-2 z-40 pointer-events-auto">
              {/* Play & Add & Review buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => navigate('/watch/' + activeHero.id)}
                  className="flex items-center gap-1 bg-[#00f2fe] hover:bg-cyan-400 text-black font-black uppercase text-[7px] sm:text-[8px] md:text-[9px] tracking-widest px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 rounded-lg shadow-[0_0_15px_rgba(0,242,254,0.3)] hover:shadow-[0_0_25px_rgba(0,242,254,0.6)] transition-all hover:scale-105 active:scale-95 border border-[#00f2fe]/20"
                >
                  <Play className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 fill-black text-black" /> Play
                </button>
                <button
                  onClick={() => navigate('/movies')}
                  className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-lg border border-white/20 hover:border-white/50 bg-black/40 backdrop-blur-md flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95"
                >
                  <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 h-4" />
                </button>
                <ReviewButton />
              </div>

              {/* Small title text below the play button */}
              <p className="text-[9px] sm:text-[11px] md:text-xs font-black uppercase tracking-wider text-white/95 drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)] max-w-[85%] text-left font-sans">
                {activeHero.title}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Overlapping Cyberpunk Slide Previews Carousel (Symmetrical 7-card layout centered on active) */}
      <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 flex items-center justify-center -space-x-4 sm:-space-x-8 md:-space-x-12 z-30 w-full overflow-x-auto no-scrollbar py-4 px-6 hidden sm:flex pointer-events-none">
        {[-3, -2, -1, 0, 1, 2, 3].map((offset) => {
          const L = heroSlides.length;
          const slideIdx = (heroIdx + offset + L) % L;
          const slide = heroSlides[slideIdx];
          const isActive = offset === 0;

          let cardStyle = "";
          if (offset === 0) {
            cardStyle = "w-[65px] sm:w-[115px] md:w-[145px] z-30 scale-105 sm:scale-110 border-[#ff007f] shadow-[0_0_15px_rgba(255,0,127,0.4)] sm:shadow-[0_0_25px_rgba(255,0,127,0.6)]";
          } else if (offset === -1 || offset === 1) {
            cardStyle = "w-[55px] sm:w-[100px] md:w-[125px] z-20 scale-95 opacity-80 border-[#ff007f]/40";
          } else if (offset === -2 || offset === 2) {
            cardStyle = "w-[45px] sm:w-[85px] md:w-[105px] z-10 scale-85 opacity-55 border-[#ff007f]/20";
          } else {
            cardStyle = "w-[35px] sm:w-[70px] md:w-[85px] z-0 scale-75 opacity-35 border-transparent hidden sm:flex";
          }

          return (
            <div
              key={slide.id + '-' + offset}
              onClick={() => {
                {
                  setHeroIdx(slideIdx);
                }
              }}
              className={`aspect-[3/4.2] rounded-xl sm:rounded-2xl overflow-visible border cursor-pointer transition-all duration-500 shrink-0 relative flex flex-col justify-end p-2 sm:p-3 shadow-2xl bg-black pointer-events-auto ${cardStyle}`}
            >
              {isActive && (
                <div 
                  style={{ animation: 'spin 15s linear infinite' }}
                  className="absolute inset-[-12px] sm:inset-[-18px] rounded-full border border-dashed border-[#ff007f] opacity-50 blur-[1px] z-[-1] pointer-events-none" 
                />
              )}

              <div className="absolute inset-0 w-full h-full rounded-xl sm:rounded-2xl overflow-hidden pointer-events-none">
                <img src={slide.thumbnail_url?.replace('mqdefault', 'hqdefault')} className="w-full h-full object-cover" draggable="false" alt="" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              </div>
              
              <div className="relative z-10 w-full flex flex-col gap-0.5 sm:gap-1 pointer-events-none">
                {isActive && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/watch/' + slide.id);
                    }}
                    className="bg-[#00f2fe] hover:bg-cyan-400 text-black text-[7px] sm:text-[8px] font-black uppercase tracking-wider py-1.5 rounded-lg w-full text-center shadow-[0_0_12px_rgba(0,242,254,0.5)] border border-cyan-300/20 transition-all select-none pointer-events-auto hover:scale-105 active:scale-95 animate-pulse"
                  >
                    Play Now
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
