import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../supabaseClient';
import Loader from '../components/Loader';
import { Play, ChevronRight, RotateCcw, RotateCw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [currAngle, setCurrAngle] = useState(0);
  const [targetAngle, setTargetAngle] = useState(0);
  const [activeIdx, setActiveIdx] = useState(0);
  const wheelRef = useRef(null);
  const rafRef = useRef(null);

  const { theme: globalTheme } = useTheme();

  // Color Mapping for Themes
  const themeMap = {
    'blue-yellow': { p: '#3b82f6', s: '#eab308' },
    'white-black': { p: '#ffffff', s: '#000000' },
    'orange-green': { p: '#f97316', s: '#22c55e' },
    'black-red': { p: '#ef4444', s: '#000000' },
    'yellow-blue': { p: '#eab308', s: '#3b82f6' },
    'dark': { p: '#3b82f6', s: '#ffffff' }, // Fallback for default themes
    'light': { p: '#3b82f6', s: '#000000' },
    'blue': { p: '#eab308', s: '#3b82f6' }
  };
  const activeTheme = themeMap[globalTheme] || themeMap['dark'];

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('videos')
          .select('*')
          .order('created_at', { ascending: false });
        if (data) setVideos(data);
      } catch (e) {
        console.error('Home load error:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const heroVideos = useMemo(() => {
    const vids = videos.slice(0, 6);
    while (vids.length < 6) {
      vids.push({ id: 'dummy-' + vids.length, thumbnail_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070' });
    }
    return vids;
  }, [videos]);

  const angleStep = 60;

  useEffect(() => {
    const animate = () => {
      setCurrAngle(prev => {
        const diff = targetAngle - prev;
        if (Math.abs(diff) < 0.1) return targetAngle;
        return prev + diff * 0.1;
      });
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [targetAngle]);

  const rotate = (dir) => {
    const nextAngle = targetAngle + (dir * 60);
    setTargetAngle(nextAngle);
    
    // Update index immediately for better feedback
    const steps = Math.round(nextAngle / 60);
    const idx = ((-steps % 6) + 6) % 6;
    if (!isNaN(idx)) setActiveIdx(idx);
  };

  const goToCard = (idx) => {
    const currentStep = Math.round(targetAngle / 60);
    const targetStep = -idx;
    let normalizedTarget = targetStep;
    while (Math.abs(normalizedTarget - currentStep) > 3) {
      if (normalizedTarget < currentStep) normalizedTarget += 6;
      else normalizedTarget -= 6;
    }
    setTargetAngle(normalizedTarget * 60);
    setActiveIdx(idx);
  };

  const dragInfo = useRef({ isDragging: false, startX: 0, startAngle: 0, wasDragged: false });

  const onStart = (e) => {
    dragInfo.current.isDragging = true;
    dragInfo.current.wasDragged = false;
    dragInfo.current.startX = e.clientX || e.touches?.[0]?.clientX || 0;
    dragInfo.current.startAngle = targetAngle;
  };

  useEffect(() => {
    const onMove = (e) => {
      // Safety: Only drag if isDragging is true AND mouse button is pressed (1 for primary)
      if (!dragInfo.current.isDragging || (e.buttons === 0 && !e.touches)) {
        if (dragInfo.current.isDragging) onEnd(); // Force end if button released outside
        return;
      }
      
      const x = e.clientX || e.touches?.[0]?.clientX || 0;
      const diff = x - dragInfo.current.startX;
      
      if (Math.abs(diff) > 15) dragInfo.current.wasDragged = true;
      
      const newAngle = dragInfo.current.startAngle + diff * 0.3;
      setTargetAngle(newAngle);

      // Real-time index update
      const steps = Math.round(newAngle / 60);
      const idx = ((-steps % 6) + 6) % 6;
      if (!isNaN(idx)) setActiveIdx(idx);
    };
    const onEnd = () => {
      if (!dragInfo.current.isDragging) return;
      dragInfo.current.isDragging = false;
      setTargetAngle(prev => {
        const snapped = Math.round(prev / 60) * 60;
        const steps = Math.round(snapped / 60);
        const idx = ((-steps % 6) + 6) % 6;
        if (!isNaN(idx)) setActiveIdx(idx);
        return snapped;
      });
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onEnd);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [targetAngle]);

  const categoriesMap = useMemo(() => {
    const groups = {};
    videos.forEach(v => {
      const cat = v.category || 'More Videos';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(v);
    });
    return groups;
  }, [videos]);

  if (loading) return <Loader />;

  return (
    <div className="w-full min-w-0 overflow-x-hidden text-white pb-20 min-h-screen">
      
      <section className="relative w-full min-h-[350px] flex flex-col items-center justify-center pt-16 select-none overflow-hidden">
        <div 
          className="relative w-full flex items-center justify-center cursor-grab active:cursor-grabbing" 
          style={{ perspective: '1200px' }}
          onMouseDown={onStart}
          onTouchStart={onStart}
        >
          {/* Left Navigation Button */}
          <button 
            onClick={(e) => { e.stopPropagation(); rotate(1); }} 
            className="absolute left-4 md:left-10 z-[100] w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all shadow-2xl"
            style={{ borderColor: activeTheme.p, color: activeTheme.p, backgroundColor: 'rgba(0,0,0,0.2)' }}
          >
            <RotateCcw size={24} />
          </button>

          <div 
            ref={wheelRef}
            className="relative w-[300px] h-[170px]"
            style={{ 
              transformStyle: 'preserve-3d',
              transform: `rotateY(${currAngle}deg)`
            }}
          >
            {heroVideos.map((video, i) => {
              const cardAngle = (i * 60 + currAngle) % 360;
              let diff = Math.abs(cardAngle);
              if (diff > 180) diff = 360 - diff;
              const dynamicScale = 1 + Math.max(0, (40 - diff) / 40) * 0.25;
              const dynamicOpacity = 0.6 + Math.max(0, (60 - diff) / 60) * 0.4;
              const isFront = diff < 30;

              return (
                <div 
                  key={video.id}
                  onClick={(e) => {
                    if (dragInfo.current.wasDragged) return;
                    if (isFront) {
                      navigate('/watch/' + video.id);
                    } else {
                      goToCard(i);
                    }
                  }}
                  className="absolute inset-0 rounded-[2rem] overflow-hidden cursor-pointer border-2"
                  style={{ 
                    transform: `rotateY(${i * 60}deg) translateZ(320px) scale(${dynamicScale})`,
                    backfaceVisibility: 'hidden',
                    opacity: dynamicOpacity,
                    borderColor: isFront ? activeTheme.p : 'rgba(255,255,255,0.1)',
                    boxShadow: isFront ? `0 0 30px ${activeTheme.p}66` : 'none',
                    zIndex: isFront ? 100 : Math.round(100 - diff),
                    transition: dragInfo.current.isDragging ? 'none' : 'transform 0.5s ease-out, opacity 0.5s ease-out, border-color 0.5s'
                  }}
                >
                  <img src={video.thumbnail_url} className="w-full h-full object-cover" alt="" />
                  
                  <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end items-center pb-6 transition-opacity duration-300 ${isFront ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="text-white px-4 py-1.5 rounded-full font-black uppercase text-[10px] tracking-widest shadow-xl border" style={{ backgroundColor: activeTheme.s, borderColor: activeTheme.p }}>
                      Watch Now
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Navigation Button */}
          <button 
            onClick={(e) => { e.stopPropagation(); rotate(-1); }} 
            className="absolute right-4 md:right-10 z-[100] w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all shadow-2xl"
            style={{ borderColor: activeTheme.p, color: activeTheme.p, backgroundColor: 'rgba(0,0,0,0.2)' }}
          >
            <RotateCw size={24} />
          </button>
        </div>

        <div className="mt-32 flex flex-col items-center gap-4">
          <h2 
            className={`text-base md:text-lg font-black uppercase tracking-[0.2em] text-center drop-shadow-2xl px-10 line-clamp-1 opacity-90 transition-colors duration-500 max-w-[80%] md:max-w-[60%] ${(['white-black', 'yellow-blue', 'light'].includes(globalTheme)) ? 'text-black' : 'text-white'}`}
          >
            {heroVideos[((-Math.round(currAngle / 60) % 6) + 6) % 6]?.title}
          </h2>
          
          <div className="flex justify-center gap-2">
            {heroVideos.map((_, i) => {
              const currentVisualIdx = ((-Math.round(currAngle / 60) % 6) + 6) % 6;
              return (
                <button 
                  key={i} 
                  onClick={() => goToCard(i)}
                  className={`h-1.5 rounded-full transition-all duration-500 ${currentVisualIdx === i ? 'w-10 bg-white' : 'w-2 bg-white/20'}`}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* Row Content */}
      <div className="w-full px-4 md:px-10 space-y-4">
        {Object.entries(categoriesMap).map(([cat, vids]) => (
          <section key={cat} className="w-full">
            <h2 className="text-lg font-black uppercase tracking-tight mb-6 opacity-80">{cat}</h2>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
              {vids.map(v => (
                <div 
                  key={v.id} 
                  onClick={() => navigate('/watch/'+v.id)} 
                  className="min-w-[280px] cursor-pointer group"
                >
                  <div 
                    className="aspect-video rounded-3xl overflow-hidden mb-3 border-2 transition-all duration-500"
                    style={{ borderColor: activeTheme.p }}
                  >
                    <img src={v.thumbnail_url} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" alt="" />
                  </div>
                  <h4 className="text-sm font-bold uppercase line-clamp-1 opacity-90">{v.title}</h4>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
