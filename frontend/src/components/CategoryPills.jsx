import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
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
  const { theme } = useTheme();
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
              flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300 whitespace-nowrap
              ${isActive 
                ? 'bg-accent text-on-accent border-accent shadow-lg' 
                : 'bg-secondary/40 border-primary text-secondary hover:bg-secondary/60 hover:text-primary'
              }
            `}
            style={isActive ? { backgroundColor: 'var(--accent-color)', color: 'var(--text-on-accent)', borderColor: 'var(--accent-color)' } : {}}
          >
            <span className={`${isActive ? 'text-on-accent' : 'text-accent'}`} style={{ color: isActive ? 'var(--text-on-accent)' : 'var(--accent-color)' }}>{cat.icon}</span>
            <span className="text-xs font-black uppercase tracking-widest">{cat.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
};

export default CategoryPills;
