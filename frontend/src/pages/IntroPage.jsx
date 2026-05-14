import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  TrendingUp, PlayCircle, Music, Search, Layers, ChevronRight, Zap, Shield, Smartphone, Globe, Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const FeatureCard = ({ feature, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.2 + index * 0.1, duration: 0.8, type: "spring" }}
    whileHover={{ y: -10, scale: 1.02 }}
    className="relative group p-px rounded-[2.5rem] overflow-hidden bg-gradient-to-b from-white/10 to-transparent"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className="relative h-full bg-[#020617]/90 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/5 flex flex-col justify-between">
      <div>
        <div className="mb-8 w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center shadow-lg border border-white/10 group-hover:border-cyan-400/50 group-hover:scale-110 transition-all duration-500">
          {feature.icon}
        </div>
        <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-4 text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyan-400 group-hover:to-blue-400 transition-all">
          {feature.title}
        </h3>
        <p className="text-white/40 text-sm font-medium leading-relaxed">
          {feature.desc}
        </p>
      </div>
    </div>
  </motion.div>
);

export default function IntroPage() {
  const navigate = useNavigate();
  const { user, setAuthModalOpen } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleGetStarted = () => {
    setAuthModalOpen(true);
  };

  const features = [
    {
      icon: <Globe className="w-7 h-7 text-cyan-400" />,
      title: "Limitless Media",
      desc: "Tap into an infinite universe of content. YouTube, movies, live sports, and beyond, completely unchained."
    },
    {
      icon: <Music className="w-7 h-7 text-blue-400" />,
      title: "Persistent Audio",
      desc: "Your soundtrack never stops. Minimize the app or lock your screen, the music flows seamlessly in the background."
    },
    {
      icon: <Layers className="w-7 h-7 text-indigo-400" />,
      title: "Floating Engine",
      desc: "Multitask like a pro with our picture-in-picture floating player. Drag it, resize it, own your screen space."
    }
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col items-center justify-start relative overflow-hidden selection:bg-cyan-500/30">
      
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-cyan-900/20 blur-[120px] mix-blend-screen"
        />
        <motion.div 
          animate={{ scale: [1, 1.5, 1], rotate: [0, -90, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute top-[20%] -right-[20%] w-[60vw] h-[60vw] rounded-full bg-blue-900/20 blur-[120px] mix-blend-screen"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#020617]/80 to-[#020617] z-10" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-20 pb-32 flex flex-col items-center">
        
        {/* Header Badge */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-5 py-2.5 rounded-full mb-12 backdrop-blur-md shadow-2xl"
        >
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400">
            Welcome to the Future
          </span>
        </motion.div>

        {/* Massive Hero Text */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, type: "spring", bounce: 0.4 }}
          className="text-center w-full max-w-5xl mb-12"
        >
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black italic tracking-tighter uppercase leading-[0.85]">
            <span className="block text-white drop-shadow-2xl">BEYOND</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 drop-shadow-[0_0_40px_rgba(56,189,248,0.4)]">
              STREAMING
            </span>
          </h1>
        </motion.div>

        {/* Subtitle */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="text-center text-white/50 text-lg md:text-xl max-w-2xl font-medium leading-relaxed mb-20"
        >
          Step into a revolutionary entertainment ecosystem. Zero boundaries. Infinite content. Crafted for the absolute elite.
        </motion.p>

        {/* CTA Button */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="relative group mb-32 cursor-pointer"
          onClick={handleGetStarted}
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse" />
          <button 
            className="relative flex items-center gap-4 bg-[#020617] px-14 py-6 rounded-full leading-none overflow-hidden border border-white/10 group-hover:border-white/30 transition-colors"
          >
            <span className="text-white font-black uppercase tracking-[0.2em] text-sm md:text-base z-10 group-hover:text-cyan-300 transition-colors">
              Unlock MacFeed
            </span>
            <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center z-10 group-hover:translate-x-2 transition-transform duration-300 shadow-lg">
              <ChevronRight className="w-5 h-5 text-white" />
            </div>
          </button>
        </motion.div>

        {/* Bento Grid Features */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {features.map((f, i) => (
            <FeatureCard key={i} feature={f} index={i} />
          ))}
        </div>

        {/* Trust Badges */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 1 }}
          className="mt-32 flex flex-wrap items-center justify-center gap-12 opacity-40 grayscale"
        >
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6" />
            <span className="text-xs font-black uppercase tracking-[0.3em]">Military Grade Security</span>
          </div>
          <div className="flex items-center gap-3">
            <Zap className="w-6 h-6" />
            <span className="text-xs font-black uppercase tracking-[0.3em]">Zero Latency Engine</span>
          </div>
          <div className="flex items-center gap-3">
            <Smartphone className="w-6 h-6" />
            <span className="text-xs font-black uppercase tracking-[0.3em]">Cross-Platform Sync</span>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
