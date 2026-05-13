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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#000000]/90 backdrop-blur-2xl border-t border-white/10 px-4 py-2 z-[9999] flex items-center justify-around pb-safe">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className="flex flex-col items-center gap-1 group relative py-1"
          >
            <div className={`relative p-2 rounded-2xl transition-all duration-300 ${isActive ? 'bg-white/10' : 'group-active:scale-90'}`}>
              <item.icon 
                className={`w-6 h-6 transition-colors duration-300 ${isActive ? 'text-white' : 'text-white/40'}`} 
                strokeWidth={isActive ? 2.5 : 2}
              />
              {isActive && (
                <motion.div
                  layoutId="nav-glow"
                  className="absolute inset-0 bg-white/5 rounded-2xl blur-md"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors duration-300 ${isActive ? 'text-white' : 'text-white/40'}`}>
              {item.label}
            </span>
          </NavLink>
        );
      })}
    </nav>
  );
}
