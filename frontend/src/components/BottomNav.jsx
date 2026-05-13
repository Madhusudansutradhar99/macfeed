import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Compass, PlaySquare, Music, Settings, LayoutGrid } from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/shorts', icon: PlaySquare, label: 'Shorts' },
  { path: '/music', icon: Music, label: 'Music' },
  { path: '/trending', icon: Compass, label: 'Trending' },
  { path: '/settings', icon: Settings, label: 'Settings' }
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-[400px] h-16 bg-[#000000]/80 backdrop-blur-3xl border border-white/10 rounded-[2rem] px-6 z-[9999] flex items-center justify-around shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className="flex flex-col items-center gap-1 group relative flex-1"
          >
            <div className={`relative p-2 rounded-2xl transition-all duration-300 ${isActive ? 'bg-white/10 scale-110 shadow-[0_0_20px_rgba(255,255,255,0.1)]' : 'active:scale-90 opacity-60 hover:opacity-100'}`}>
              <item.icon 
                className={`w-5 h-5 transition-colors duration-300 ${isActive ? 'text-white' : 'text-white/40'}`} 
                strokeWidth={isActive ? 3 : 2}
              />
              {isActive && (
                <motion.div
                  layoutId="nav-glow-indicator"
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full shadow-[0_0_10px_white]"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
            </div>
            <span className={`text-[8px] font-black uppercase tracking-[0.1em] transition-colors duration-300 ${isActive ? 'text-white' : 'text-white/30'}`}>
              {item.label}
            </span>
          </NavLink>
        );
      })}
    </nav>
  );
}
