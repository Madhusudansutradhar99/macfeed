import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Info } from 'lucide-react';

export default function HeroCarousel({ slides = [] }) {
  const navigate = useNavigate();

  const heroSlides = useMemo(() => {
    if (!slides || slides.length === 0) {
      return [{
        id: 'raya',
        title: 'Raya and the Last Dragon',
        category: 'Adventure • 4K HDR',
        duration: '1h 47m',
        thumbnail_url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2025',
        description: 'Curated high-resolution cinema with instant buffer-free streaming.'
      }];
    }

    const uniqueList = [];
    const seen = new Set();
    slides.forEach((v) => {
      if (!seen.has(v.id)) {
        seen.add(v.id);
        uniqueList.push(v);
      }
    });

    return uniqueList.slice(0, 6);
  }, [slides]);

  const [heroIdx, setHeroIdx] = useState(0);

  useEffect(() => {
    if (heroSlides.length <= 1) return;
    const timer = setInterval(() => {
      setHeroIdx((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroSlides]);

  const activeHero = useMemo(() => {
    return heroSlides[heroIdx] || heroSlides[0];
  }, [heroSlides, heroIdx]);

  const handlePlay = (e) => {
    e.stopPropagation();
    navigate(`/watch/${activeHero.id}`, { state: { video: activeHero } });
  };

  return (
    <section className="relative w-full max-w-7xl mx-auto px-3 sm:px-6 mt-2 mb-6">
      <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] min-h-[240px] sm:min-h-[340px] md:min-h-[420px] rounded-2xl md:rounded-3xl overflow-hidden select-none bg-[#11131a] border border-white/10 shadow-2xl">
        
        {/* Background Slide Image */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeHero.id}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 w-full h-full"
          >
            <img
              src={activeHero.thumbnail_url?.replace('mqdefault.jpg', 'maxresdefault.jpg') || activeHero.thumbnail_url}
              alt={activeHero.title}
              className="w-full h-full object-cover"
            />

            {/* Digen Deep Scrim */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0b0c10] via-[#0b0c10]/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c10] via-transparent to-transparent" />
          </motion.div>
        </AnimatePresence>

        {/* Content Overlay */}
        <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-8 md:p-12 z-20">
          {/* Badge */}
          <div className="flex items-center gap-2 mb-2">
            <span className="digen-badge-amber text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
              Featured Premiere
            </span>
            <span className="text-xs text-gray-400 font-medium hidden sm:inline">
              {activeHero.category || 'Curated Stream'}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-xl sm:text-2xl md:text-4xl font-extrabold text-white leading-tight max-w-2xl mb-2">
            {activeHero.title}
          </h1>

          {/* Description */}
          {activeHero.description && (
            <p className="text-gray-300 text-xs sm:text-sm line-clamp-2 max-w-xl mb-4 font-normal">
              {activeHero.description}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 mt-1">
            <button
              onClick={handlePlay}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black hover:bg-gray-200 font-bold text-xs shadow-lg transition active:scale-95"
            >
              <Play className="w-4 h-4 fill-black text-black" />
              <span>Watch Now</span>
            </button>

            <button
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent('open-info-modal', {
                    detail: {
                      title: activeHero.title,
                      content: activeHero.description || 'Exclusive MacFeed High-Definition feature.',
                    },
                  })
                );
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/15 text-xs font-semibold backdrop-blur-md transition active:scale-95"
            >
              <Info className="w-4 h-4 text-gray-300" />
              <span>Details</span>
            </button>
          </div>
        </div>

        {/* Slide Indicators on Bottom Right */}
        <div className="absolute bottom-4 right-5 z-20 flex items-center gap-1.5">
          {heroSlides.map((s, idx) => (
            <button
              key={s.id || idx}
              onClick={() => setHeroIdx(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === heroIdx ? 'w-6 bg-white' : 'w-2 bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
