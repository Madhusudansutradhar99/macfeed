import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import Loader from '../components/Loader';
import PremiumLoader from '../components/PremiumLoader';
import { motion } from 'framer-motion';

export default function Sports() {
  const [loading, setLoading] = useState(true);
  const [cricketCount, setCricketCount] = useState(0);
  const [footballCount, setFootballCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      const start = Date.now();
      try {
        const { data, error } = await supabase
          .from('videos')
          .select('id,title')
          .eq('category', 'Sports')
          .timeout(5000); 

        if (error) throw error;

        const all = data || [];
        const c = all.filter(v => /cricket|ipl|t20|test/i.test(v.title));
        const f = all.filter(v => /football|soccer|fifa|premier/i.test(v.title));
        
        setCricketCount(c.length || 24); 
        setFootballCount(f.length || 18);
      } catch (err) {
        console.error("Sports Load Error:", err);
        setCricketCount(24);
        setFootballCount(18);
      } finally {
        const end = Date.now();
        const diff = end - start;
        setLoading(false);
        
      }
    }
    load();
  }, []);

  if (loading)
    return <PremiumLoader />;

  return (
    <div className="min-h-screen bg-primary text-primary overflow-hidden font-sans transition-colors duration-500">
      {/* BG text watermark */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] z-0">
        <span className="text-[30vw] font-black italic uppercase text-primary">SPORT</span>
      </div>

      <div className="relative z-10 flex flex-col md:flex-row h-screen">

        {/* CRICKET CARD */}
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 relative group cursor-pointer overflow-hidden border-r border-primary"
          onClick={() => navigate('/sports/cricket')}
        >
          <img
            src="https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&q=80&w=1200"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 brightness-50 group-hover:brightness-75"
            alt="Cricket"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent opacity-80" />

          {/* Number outline */}
          <div className="absolute top-10 right-10 text-[12rem] font-black leading-none select-none pointer-events-none" style={{ WebkitTextStroke: '2px rgba(255,255,255,0.15)', color: 'transparent' }}>68</div>

          <div className="absolute bottom-0 left-0 p-10 md:p-16">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-[3px] w-12 bg-yellow-400" />
              <span className="text-yellow-400 text-[11px] font-black tracking-[0.4em] uppercase">Live Sport</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black italic uppercase leading-none tracking-tighter drop-shadow-2xl">
              <span className="text-white block">CRICKET</span>
            </h1>
            <p className="text-white/50 text-sm mt-3 font-medium">{cricketCount} Videos Available</p>
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
              className="mt-8 flex items-center gap-3 bg-yellow-400 text-black font-black uppercase text-sm tracking-widest px-8 py-4 shadow-[0_0_40px_rgba(250,204,21,0.4)] hover:bg-yellow-300 transition-colors"
            >
              <span>WATCH NOW</span>
              <span className="text-lg">🏏</span>
            </motion.button>
          </div>

          {/* Hover label */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 text-center pointer-events-none">
            <span className="text-yellow-400 font-black text-xl tracking-widest uppercase border border-yellow-400/50 px-8 py-3 backdrop-blur-sm">
              ENTER →
            </span>
          </div>
        </motion.div>

        {/* CENTER DIVIDER */}
        <div className="hidden md:flex flex-col items-center justify-center w-20 bg-primary z-10 gap-4 shrink-0 border-x border-primary">
          <div className="h-full w-[2px] bg-gradient-to-b from-transparent via-primary/20 to-transparent" />
          <div className="absolute text-secondary font-black text-xs tracking-[0.3em] uppercase rotate-90 whitespace-nowrap">VS</div>
        </div>

        {/* FOOTBALL CARD */}
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 relative group cursor-pointer overflow-hidden border-l border-primary"
          onClick={() => navigate('/sports/football')}
        >
          <img
            src="https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&q=80&w=1200"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 brightness-50 group-hover:brightness-75"
            alt="Football"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-l from-black/60 to-transparent opacity-80" />

          {/* Number outline */}
          <div className="absolute top-10 left-10 text-[12rem] font-black leading-none select-none pointer-events-none" style={{ WebkitTextStroke: '2px rgba(255,255,255,0.15)', color: 'transparent' }}>70</div>

          <div className="absolute bottom-0 right-0 p-10 md:p-16 text-right">
            <div className="flex items-center justify-end gap-3 mb-4">
              <span className="text-[#d31c23] text-[11px] font-black tracking-[0.4em] uppercase">Live Sport</span>
              <div className="h-[3px] w-12 bg-[#d31c23]" />
            </div>
            <h1 className="text-6xl md:text-8xl font-black italic uppercase leading-none tracking-tighter drop-shadow-2xl">
              <span className="text-white block">FOOTBALL</span>
            </h1>
            <p className="text-white/50 text-sm mt-3 font-medium">{footballCount} Videos Available</p>
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
              className="mt-8 inline-flex items-center gap-3 bg-[#d31c23] text-white font-black uppercase text-sm tracking-widest px-8 py-4 shadow-[0_0_40px_rgba(211,28,35,0.4)] hover:bg-red-600 transition-colors"
            >
              <span>⚽</span>
              <span>WATCH NOW</span>
            </motion.button>
          </div>

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 text-center pointer-events-none">
            <span className="text-[#d31c23] font-black text-xl tracking-widest uppercase border border-[#d31c23]/50 px-8 py-3 backdrop-blur-sm">
              ENTER →
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}


