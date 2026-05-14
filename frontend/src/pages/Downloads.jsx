import React, { useState, useEffect } from 'react';
import { Download, Trash2, Play, FolderOpen, Clock, ChevronRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMusicPlayer } from '../context/MusicContext';

export default function Downloads() {
  const navigate = useNavigate();
  const { playLocalSong } = useMusicPlayer();
  const [localHistory, setLocalHistory] = useState([]);

  useEffect(() => {
    const history = JSON.parse(localStorage.getItem('macfeed_local_history') || '[]');
    setLocalHistory(history);
  }, []);

  const clearHistory = () => {
    if (window.confirm('Are you sure you want to clear all offline history?')) {
      localStorage.removeItem('macfeed_local_history');
      setLocalHistory([]);
    }
  };

  const deleteItem = (e, index) => {
    e.stopPropagation();
    const newHistory = [...localHistory];
    newHistory.splice(index, 1);
    localStorage.setItem('macfeed_local_history', JSON.stringify(newHistory));
    setLocalHistory(newHistory);
  };

  return (
    <div className="min-h-screen text-white flex flex-col font-sans pb-20" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Premium Header */}
      <div className="relative h-[250px] flex items-center px-6 md:px-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/40 to-[#050014] z-0" />
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[120%] bg-blue-500/10 blur-[120px] rounded-full" />
        
        <div className="relative z-10 w-full flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shadow-[0_0_50px_rgba(59,130,246,0.3)]">
              <Download className="w-8 h-8 md:w-10 md:h-10 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                Offline Library
              </h1>
              <p className="text-blue-200/50 text-xs md:text-sm font-black uppercase tracking-widest mt-1">
                Your Private Cinematic Vault
              </p>
            </div>
          </div>

          {localHistory.length > 0 && (
            <button 
              onClick={clearHistory}
              className="flex items-center gap-2 px-6 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-full text-red-400 text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
            >
              <Trash2 size={14} /> Clear All History
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 px-6 md:px-12 -mt-10">
        {localHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white/[0.02] border border-white/5 rounded-[3rem] backdrop-blur-xl">
            <FolderOpen className="w-16 h-16 text-white/10 mb-6" />
            <h3 className="text-white/40 text-lg font-black uppercase tracking-widest italic">No offline videos yet</h3>
            <p className="text-white/20 text-xs mt-2 uppercase font-black">Open a local file to see it here</p>
            <button 
                onClick={() => navigate('/')}
                className="mt-8 px-8 py-3 bg-white text-black rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform"
            >
                Explore More
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {localHistory.map((item, index) => (
                <motion.div 
                  key={item.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => playLocalSong(item)}
                  className="group relative bg-white/[0.03] border border-white/5 rounded-[2.5rem] overflow-hidden cursor-pointer hover:bg-white/[0.07] transition-all hover:border-blue-500/30 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                >
                  {/* Thumbnail */}
                  <div className="aspect-video w-full relative overflow-hidden">
                    <img 
                      src={item.thumbnail_url || 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&q=80&w=800'} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 brightness-75 group-hover:brightness-100" 
                      alt="" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050014] via-transparent to-transparent opacity-80" />
                    
                    {/* Floating Play Button */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
                        <div className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center shadow-2xl shadow-blue-500/50">
                            <Play className="w-6 h-6 fill-white text-white translate-x-0.5" />
                        </div>
                    </div>

                    {/* Delete Icon */}
                    <button 
                        onClick={(e) => deleteItem(e, index)}
                        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/50 hover:text-red-400 hover:border-red-500/30 transition-all opacity-0 group-hover:opacity-100"
                    >
                        <X size={14} />
                    </button>
                  </div>

                  {/* Info */}
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-2">
                        <Clock size={10} className="text-blue-400" />
                        <span className="text-[8px] text-white/40 font-black uppercase tracking-widest">
                            {new Date(item.lastPlayed).toLocaleDateString()}
                        </span>
                    </div>
                    <h3 className="text-sm font-black italic uppercase tracking-tighter text-white/90 line-clamp-1 group-hover:text-blue-400 transition-colors">
                      {item.title}
                    </h3>
                    <div className="mt-4 flex items-center justify-between">
                        <span className="px-2 py-1 bg-white/5 rounded-md text-[8px] font-black uppercase text-white/30 tracking-widest border border-white/5">
                            Local File
                        </span>
                        <ChevronRight size={14} className="text-white/20 group-hover:translate-x-1 transition-transform group-hover:text-blue-400" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Floating Action Button to Add New File */}
      <motion.button 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => navigate('/music')}
        className="fixed bottom-10 right-10 w-16 h-16 bg-blue-600 rounded-full shadow-[0_0_30px_rgba(37,99,235,0.5)] flex items-center justify-center z-50 group border border-white/20"
      >
        <FolderOpen className="text-white w-7 h-7 group-hover:scale-110 transition-transform" />
      </motion.button>
    </div>
  );
}
