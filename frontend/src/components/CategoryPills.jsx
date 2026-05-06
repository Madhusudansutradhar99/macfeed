import React from 'react';
import { motion } from 'framer-motion';
import { 
  Flame, Clapperboard, MonitorPlay, Sparkles, 
  Smile, Trophy, Video, Ghost, Newspaper, Rocket 
} from 'lucide-react';

const CATEGORIES = [
  { id: 'Trending', label: 'Trending', icon: <Flame size={14} /> },
  { id: 'Movies', label: 'Movie', icon: <Clapperboard size={14} /> },
  { id: 'Series', label: 'Series', icon: <MonitorPlay size={14} /> },
  { id: 'Animation', label: 'Animation', icon: <Ghost size={14} /> },
  { id: 'Comedy', label: 'Horror', icon: <Smile size={14} /> },
  { id: 'Sports', label: 'Special', icon: <Trophy size={14} /> },
  { id: 'Vlogs', label: 'Vlogs', icon: <Video size={14} /> },
  { id: 'News', label: 'News', icon: <Newspaper size={14} /> },
];

const CategoryPills = ({ activeCategory, setCategory }) => {
  return (
    <div className="flex items-center gap-3 py-2 px-1 overflow-visible">
      {CATEGORIES.map((cat) => {
        const isActive = activeCategory === cat.id;
        return (
          <motion.button
            key={cat.id}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCategory(cat.id)}
            className={`
              flex items-center gap-3 px-6 py-3 rounded-full border transition-all duration-300 whitespace-nowrap
              ${isActive 
                ? 'bg-blue-600 border-blue-500 text-white shadow-[0_10px_25px_rgba(37,99,235,0.4)]' 
                : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white hover:scale-105 shadow-blue-500/20'
              }
            `}
          >
            <span className={`${isActive ? 'text-white' : 'text-blue-500'}`}>{cat.icon}</span>
            <span className="text-xs font-black uppercase tracking-widest">{cat.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
};

export default CategoryPills;
