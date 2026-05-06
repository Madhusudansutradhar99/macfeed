import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  PlayCircle, 
  Music, 
  Search, 
  Layers, 
  ChevronRight,
  Zap,
  Shield,
  Smartphone
} from 'lucide-react';

export default function IntroPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already visited
    const visited = localStorage.getItem('macfeed_visited');
    if (visited) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const handleGetStarted = () => {
    localStorage.setItem('macfeed_visited', 'true');
    navigate('/', { replace: true });
  };

  const features = [
    {
      icon: <TrendingUp className="w-8 h-8 text-purple-500" />,
      title: "Trending Content",
      desc: "Stay updated with the latest from YouTube, ETV, and more in real-time."
    },
    {
      icon: <PlayCircle className="w-8 h-8 text-blue-500" />,
      title: "Local Media Player",
      desc: "Play your local video and audio files with a premium, high-performance player."
    },
    {
      icon: <Music className="w-8 h-8 text-pink-500" />,
      title: "Background Music",
      desc: "Listen to your favorite tracks even when the app is minimized or closed."
    },
    {
      icon: <Search className="w-8 h-8 text-green-500" />,
      title: "Cross-Platform Search",
      desc: "Find anything you want across multiple platforms with a single search."
    },
    {
      icon: <Layers className="w-8 h-8 text-orange-500" />,
      title: "Mini Floating Player",
      desc: "Multitask with ease using our smooth, draggable floating mini player."
    }
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full" />

      <div className="max-w-4xl w-full z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full mb-6">
            <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">Welcome to MacFeed</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase mb-4 leading-none">
            Stream <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500">Everything</span>
          </h1>
          <p className="text-white/50 text-base md:text-lg max-w-xl mx-auto font-medium">
            The ultimate all-in-one entertainment hub for YouTube, Movies, Music, and your local media.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] backdrop-blur-xl hover:bg-white/10 transition-all group"
            >
              <div className="mb-6 transform group-hover:scale-110 group-hover:rotate-6 transition-transform">
                {f.icon}
              </div>
              <h3 className="text-lg font-black uppercase italic tracking-tighter mb-2">{f.title}</h3>
              <p className="text-white/40 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col items-center"
        >
          <button 
            onClick={handleGetStarted}
            className="group relative bg-white text-black px-12 py-5 rounded-full font-black uppercase tracking-widest text-sm flex items-center gap-3 hover:bg-purple-600 hover:text-white transition-all active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.2)]"
          >
            Get Started
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <div className="mt-10 flex items-center gap-8 opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
             <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Secure</span>
             </div>
             <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Mobile Optimized</span>
             </div>
          </div>
        </motion.div>
      </div>

      {/* Decorative logo */}
      <div className="absolute bottom-10 left-10 opacity-10 pointer-events-none">
        <img src="/macfeed-logo.png" alt="MacFeed" className="w-12 h-12 grayscale" />
      </div>
    </div>
  );
}
