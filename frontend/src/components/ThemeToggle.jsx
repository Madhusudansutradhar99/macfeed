import React from 'react';
import { Sun, Moon, Palette } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  const getIcon = () => {
    if (theme === 'dark') return <Moon className="w-5 h-5 text-blue-400" />;
    if (theme === 'light') return <Sun className="w-5 h-5 text-yellow-500" />;
    return <Palette className="w-5 h-5 text-blue-600" />;
  };

  const getTitle = () => {
    if (theme === 'dark') return 'Switch to Light Mode';
    if (theme === 'light') return 'Switch to Light Blue Mode';
    return 'Switch to Dark Mode';
  };

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={toggleTheme}
      className="p-2 rounded-xl bg-secondary border border-primary hover:bg-primary/10 transition-colors shadow-lg"
      title={getTitle()}
    >
      {getIcon()}
    </motion.button>
  );
};

export default ThemeToggle;
