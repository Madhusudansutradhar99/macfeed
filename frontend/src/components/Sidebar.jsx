import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Film, Tv, Music, Zap, Flame, Folder, ThumbsUp, User, Trophy, ShoppingCart, Download, ShieldCheck, History
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { label: 'Home', icon: Home, path: '/' },
  { label: 'Movies', icon: Film, path: '/movies' },
  { label: 'Series', icon: Tv, path: '/series' },
  { label: 'Music', icon: Music, path: '/music' },
  { label: 'Sports', icon: Trophy, path: '/sports' },
  { label: 'Pro Search', icon: Zap, path: '/smart-search' },
  { label: 'Shorts', icon: Zap, path: '/shorts' },
  { label: 'Trending', icon: Flame, path: '/trending' },
  { label: 'Shopping', icon: ShoppingCart, path: '/shopping' },
  { label: 'Downloads', icon: Download, path: '/downloads' },
  { label: 'History', icon: History, path: '/history' },
  { label: 'Liked', icon: ThumbsUp, path: '/liked' },
  { label: 'Library', icon: Folder, path: '/playlists' },
];

const DynamicNavItem = ({ item, active, onClick, forceExpand }) => {
  const [hover, setHover] = useState(false);
  const navigate = useNavigate();
  const iconColor = active ? '#ffffff' : 'var(--text-primary)';
  const isExpanded = forceExpand || hover;

  return (
    <motion.div
      layoutId={`nav-item-${item.label}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={(e) => {
        if (onClick) onClick(e);
        else {
          e.stopPropagation();
          navigate(item.path);
        }
      }}
      className={`absolute left-0 top-0 flex items-center h-10 md:h-11 rounded-2xl cursor-pointer z-[2000] shadow-xl will-change-transform border border-white/5
        ${active ? 'text-white' : 'hover:bg-white/10 glass'}
      `}
      style={active ? { background: 'linear-gradient(135deg, rgba(var(--accent-rgb), 0.9), rgba(var(--accent-rgb), 0.6))', boxShadow: '0 8px 20px -5px rgba(var(--accent-rgb),0.5)' } : {}}
      animate={{ width: isExpanded ? 200 : 44 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <div className="w-11 h-10 md:h-11 flex items-center justify-center shrink-0">
        <item.icon className="w-5 h-5" style={{ color: iconColor }} />
      </div>
      <motion.span
        initial={false}
        animate={{ opacity: isExpanded ? 1 : 0 }}
        transition={{ duration: 0.12 }}
        className={`whitespace-nowrap font-bold pr-6 text-[11px] uppercase tracking-widest ml-1 ${active ? 'text-white' : 'text-primary'}`}
      >
        {item.label}
      </motion.span>
    </motion.div>
  );
};

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, setAuthModalOpen } = useAuth();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [topItem, setTopItem] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const handleToggle = () => setIsSidebarOpen(prev => !prev);
    window.addEventListener('toggle-sidebar', handleToggle);
    return () => window.removeEventListener('toggle-sidebar', handleToggle);
  }, []);

  useEffect(() => {
    if (topItem) {
      const timer = setTimeout(() => setTopItem(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [topItem]);

  // Close sidebar on scroll
  useEffect(() => {
    if (isSidebarOpen) {
      const handleScroll = () => setIsSidebarOpen(false);
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [isSidebarOpen]);

  const handleItemClick = (item) => {
    setTopItem(item);
    setIsSidebarOpen(false);
    navigate(item.path);
  };

  return (
    <>
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-primary/40 z-[1000] backdrop-blur-sm cursor-pointer will-change-transform"
          />
        )}
      </AnimatePresence>

      <motion.aside 
        initial={false}
        animate={{ 
          x: isSidebarOpen ? 0 : '-150%',
          opacity: isSidebarOpen ? 1 : 0
        }}
        transition={{ type: 'tween', ease: 'circOut', duration: 0.14 }}
        className="fixed top-20 left-4 h-[calc(100vh-140px)] w-[220px] z-[1100] flex flex-col pointer-events-none will-change-transform"
      >
        <div className={`w-full h-full py-6 flex flex-col flex-1 relative overflow-y-auto no-scrollbar overflow-x-hidden ${isSidebarOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
          <nav className="flex-1 flex flex-col gap-2 px-3">
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              const isTop = topItem?.label === item.label;
              return (
                <div key={item.path} className="relative h-10 md:h-11 w-full shrink-0">
                  {!isTop && (
                    <DynamicNavItem item={item} active={active} onClick={() => handleItemClick(item)} forceExpand={isSidebarOpen} />
                  )}
                </div>
              );
            })}
          </nav>

          <div className="mt-auto flex flex-col gap-2 px-3 pt-4 border-t border-white/10 mb-2">
            <div className="relative h-10 md:h-11 w-full shrink-0">
               {topItem?.label !== 'Admin' && (
                 <DynamicNavItem item={{ label: 'Admin', icon: ShieldCheck, path: '/admin' }} active={location.pathname === '/admin'} onClick={() => handleItemClick({ label: 'Admin', icon: ShieldCheck, path: '/admin' })} forceExpand={isSidebarOpen} />
               )}
            </div>
            <div className="relative h-10 md:h-11 w-full shrink-0 mt-2">
               <motion.div
                  onMouseEnter={() => setShowUserMenu(true)} 
                  onMouseLeave={() => setShowUserMenu(false)}
                  onClick={() => user ? navigate('/settings') : setAuthModalOpen(true)}
                  className="absolute left-0 top-0 flex items-center h-10 md:h-11 rounded-2xl cursor-pointer overflow-hidden z-50 shadow-lg will-change-transform glass border border-white/10"
                  animate={{ width: isSidebarOpen || showUserMenu ? 200 : 44 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
               >
                  <div className="w-11 h-10 md:h-11 flex items-center justify-center shrink-0"><User className="w-5 h-5" style={{ color: 'var(--accent-color)' }} /></div>
                  <motion.span 
                    animate={{ opacity: isSidebarOpen || showUserMenu ? 1 : 0 }}
                    transition={{ duration: 0.15 }}
                    className="text-[12px] font-bold tracking-wide text-primary pr-4"
                  >
                    {user ? 'Profile' : 'Sign In'}
                  </motion.span>
               </motion.div>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Floating Top Animation */}
      <AnimatePresence>
        {topItem && (
          <div className="fixed inset-0 z-[3000] pointer-events-none flex items-start justify-center pt-8">
            <motion.div
              layoutId={`nav-item-${topItem.label}`}
              className="flex items-center px-8 h-14 rounded-full shadow-2xl text-white pointer-events-auto border-2 border-white/20"
              style={{ backgroundColor: 'var(--accent-color)' }}
              transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
            >
              <topItem.icon className="w-6 h-6 flex-shrink-0" />
              <span className="whitespace-nowrap font-black ml-4 text-xl tracking-tighter uppercase italic">{topItem.label}</span>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
